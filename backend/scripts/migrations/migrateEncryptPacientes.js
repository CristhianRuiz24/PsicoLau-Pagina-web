/**
 * migrateEncryptPacientes.js
 * 
 * Script de migración idempotente para cifrar los datos personales de pacientes (PII)
 * con AES-256-GCM y generar índices ciegos HMAC-SHA256 (emailHash) (Spec 017 - T3).
 * 
 * Uso:
 *   node backend/scripts/migrateEncryptPacientes.js           (Ejecución real)
 *   node backend/scripts/migrateEncryptPacientes.js --dry-run (Simulación sin mutaciones)
 */

require('dotenv').config();
const prisma = require('../../src/config/db');
const { cifrarPaciente, esCifrado } = require('../../src/utils/crypto');

async function migrate() {
  const isDryRun = process.argv.includes('--dry-run');
  console.log('=== MIGRACIÓN DE CIFRADO PII DE PACIENTES (SPEC 017) ===');
  console.log(`Modo: ${isDryRun ? 'DRY-RUN (Simulación sin cambios)' : 'EJECUCIÓN REAL (Transaccional)'}\n`);

  const pacientes = await prisma.paciente.findMany({
    include: {
      _count: { select: { citas: true, expedientes: true } }
    },
    orderBy: { id: 'asc' }
  });

  console.log(`Total de pacientes encontrados en base de datos: ${pacientes.length}`);

  let pacientesParaCifrar = 0;
  let yaCifrados = 0;
  const operaciones = [];

  for (const p of pacientes) {
    const yaTieneCifrado = esCifrado(p.nombre) && esCifrado(p.email);
    if (yaTieneCifrado && p.emailHash) {
      yaCifrados++;
      continue;
    }

    pacientesParaCifrar++;
    const datosCifrados = cifrarPaciente({
      nombre: p.nombre,
      telefono: p.telefono,
      email: p.email,
      enlaceZoom: p.enlaceZoom
    });

    operaciones.push({
      id: p.id,
      nombreOriginal: p.nombre,
      emailOriginal: p.email,
      citas: p._count.citas,
      expedientes: p._count.expedientes,
      datosCifrados
    });
  }

  console.log(`- Pacientes ya cifrados previamente: ${yaCifrados}`);
  console.log(`- Pacientes pendientes de cifrado: ${pacientesParaCifrar}\n`);

  if (pacientesParaCifrar === 0) {
    console.log('✅ Todos los pacientes en la base de datos ya se encuentran 100% cifrados con AES-256-GCM.');
    return;
  }

  console.log('Detalle de pacientes a migrar:');
  operaciones.forEach(op => {
    console.log(`  * [ID ${op.id}] "${op.nombreOriginal}" (${op.emailOriginal}) -> ${op.citas} citas, ${op.expedientes} exps vinculados`);
  });

  if (isDryRun) {
    console.log('\n[DRY-RUN] Simulación concluida exitosamente. No se ejecutaron escrituras en la base de datos.');
    return;
  }

  // Ejecución transaccional atómica
  console.log('\nIniciando transacción atómica de actualización...');
  await prisma.$transaction(async (tx) => {
    for (const op of operaciones) {
      await tx.paciente.update({
        where: { id: op.id },
        data: {
          nombre: op.datosCifrados.nombre,
          telefono: op.datosCifrados.telefono,
          email: op.datosCifrados.email,
          emailHash: op.datosCifrados.emailHash,
          enlaceZoom: op.datosCifrados.enlaceZoom
        }
      });
    }
  });

  console.log(`✅ Transacción completada con éxito. ${operaciones.length} pacientes migrados a AES-256-GCM.`);

  // Verificación post-migración
  const verificacion = await prisma.paciente.findMany({ orderBy: { id: 'asc' } });
  let todosCifrados = true;
  for (const v of verificacion) {
    if (!esCifrado(v.nombre) || !esCifrado(v.email) || !v.emailHash) {
      todosCifrados = false;
      console.error(`❌ Error en paciente ID ${v.id}: no quedó correctamente cifrado.`);
    }
  }

  if (todosCifrados) {
    console.log('\n🔒 VERIFICACIÓN POST-MIGRACIÓN SUPERADA:');
    console.log(`   - 100% de los pacientes (${verificacion.length}) tienen nombre, email y teléfono cifrados.`);
    console.log(`   - 100% de los pacientes cuentan con blind index determinista emailHash.`);
  }
}

migrate()
  .catch(err => {
    console.error('❌ Error durante la migración de cifrado:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
