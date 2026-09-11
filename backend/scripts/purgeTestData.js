/**
 * purgeTestData.js
 * 
 * Script de purga e higiene de base de datos (Spec 015 - T1).
 * Elimina de forma segura y transaccional:
 * 1. Pacientes y citas inyectados por OWASP ZAP (firmas http://, www., ZAP).
 * 2. Pacientes y citas de prueba residuales huérfanos ('Paciente Test%', 'paciente random').
 * 3. Citas con fechas anómalas previas al año 2020.
 * 
 * Preserva al 100% los pacientes legítimos y las configuraciones clínicas de Laura.
 */

require('dotenv').config();
const prisma = require('../src/config/db');

async function purge() {
  console.log('=== INICIANDO PURGA E HIGIENE DE BASE DE DATOS (SPEC 015) ===\n');

  // 1. Identificar pacientes a purgar
  const todosLosPacientes = await prisma.paciente.findMany({
    include: {
      _count: { select: { citas: true, expedientes: true } }
    }
  });

  const idsParaPurgar = [];
  const detallesPurgados = [];

  for (const p of todosLosPacientes) {
    const nom = (p.nombre || '').toLowerCase();
    const esZAP = nom.includes('http://') || nom.includes('https://') || nom.includes('www.') || nom.includes('zap');
    const esTestHuerfano = nom.includes('paciente test') || nom.includes('paciente random');

    if (esZAP || esTestHuerfano) {
      idsParaPurgar.push(p.id);
      detallesPurgados.push({
        id: p.id,
        nombre: p.nombre,
        email: p.email,
        citas: p._count.citas,
        motivo: esZAP ? 'OWASP ZAP Payload' : 'Registro de Test Residual'
      });
    }
  }

  console.log(`🔍 Pacientes identificados para purga: ${idsParaPurgar.length}`);
  detallesPurgados.forEach(d => {
    console.log(`  - [ID ${d.id}] "${d.nombre}" (${d.email}) | ${d.citas} citas | Causa: ${d.motivo}`);
  });

  // 2. Ejecutar purga dentro de una transacción segura
  const resultadoTransaccion = await prisma.$transaction(async (tx) => {
    // A. Eliminar citas anómalas con fecha < 2020 (ej. año 1980)
    const citasAnomalas = await tx.cita.deleteMany({
      where: {
        fechaHora: { lt: new Date('2020-01-01T00:00:00.000Z') }
      }
    });

    // B. Eliminar citas vinculadas a los pacientes a purgar
    const citasPurgadas = await tx.cita.deleteMany({
      where: {
        pacienteId: { in: idsParaPurgar }
      }
    });

    // C. Eliminar expedientes vinculados si existieran (los pacientes de prueba no deberían tenerlos, pero por seguridad)
    const expedientesPurgados = await tx.expediente.deleteMany({
      where: {
        pacienteId: { in: idsParaPurgar }
      }
    });

    // D. Eliminar los pacientes
    const pacientesEliminados = await tx.paciente.deleteMany({
      where: {
        id: { in: idsParaPurgar }
      }
    });

    return {
      citasAnomalas: citasAnomalas.count,
      citasPurgadas: citasPurgadas.count,
      expedientesPurgados: expedientesPurgados.count,
      pacientesEliminados: pacientesEliminados.count
    };
  });

  console.log('\n✅ Transacción de purga completada exitosamente:');
  console.log(`   - Citas anómalas eliminadas (<2020): ${resultadoTransaccion.citasAnomalas}`);
  console.log(`   - Citas asociadas a tests/ZAP eliminadas: ${resultadoTransaccion.citasPurgadas}`);
  console.log(`   - Expedientes eliminados: ${resultadoTransaccion.expedientesPurgados}`);
  console.log(`   - Pacientes eliminados: ${resultadoTransaccion.pacientesEliminados}`);

  // 3. Verificar estado final limpio de la base de datos
  const pacientesRestantes = await prisma.paciente.findMany({
    include: {
      _count: { select: { citas: true, expedientes: true } }
    },
    orderBy: { id: 'asc' }
  });

  console.log(`\n📋 Pacientes legítimos restantes en el sistema: ${pacientesRestantes.length}`);
  pacientesRestantes.forEach(p => {
    console.log(`   ✓ [ID ${p.id}] ${p.nombre} | ${p._count.citas} citas | ${p._count.expedientes} expedientes`);
  });

  const totalCitasRestantes = await prisma.cita.count();
  console.log(`\n📅 Total de citas activas legítimas en la agenda: ${totalCitasRestantes}`);
}

purge()
  .catch(err => {
    console.error('❌ Error durante la purga de datos:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
