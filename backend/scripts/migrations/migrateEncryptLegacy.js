#!/usr/bin/env node
/**
 * migrateEncryptLegacy.js
 * 
 * Script de migración one-shot para cifrar registros de expedientes clínicos
 * que fueron insertados ANTES de la implementación del cifrado AES-256-GCM.
 * 
 * Detecta campos en texto plano (no tienen el formato iv:tag:cipher) y los
 * cifra in-place sin alterar el contenido original.
 * 
 * Uso:
 *   node scripts/migrateEncryptLegacy.js          # Dry-run (solo reporta)
 *   node scripts/migrateEncryptLegacy.js --apply   # Aplica el cifrado
 * 
 * IMPORTANTE: Ejecutar SOLO contra la base de datos de DESARROLLO.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { cifrar } = require('../../src/utils/crypto');

const prisma = new PrismaClient();
const applyMode = process.argv.includes('--apply');

const CAMPOS_CLINICOS = [
  'estadoActual',
  'insightPaciente',
  'eventoPrincipal',
  'intervenciones',
  'formulacionClinica',
  'tareasAsignadas',
  'pendientesProximaSesion',
  'resumenBreve'
];

/**
 * Determina si un valor de campo está en formato cifrado estándar (iv:tag:cipher).
 */
function estaCifrado(valor) {
  if (!valor || typeof valor !== 'string') return true; // null/vacío = no necesita cifrado
  const partes = valor.split(':');
  // Formato esperado: 3 partes hexadecimales (iv 24 chars, tag 32 chars, cipher variable)
  if (partes.length !== 3) return false;
  return /^[0-9a-f]{24}$/.test(partes[0]) && /^[0-9a-f]{32}$/.test(partes[1]) && /^[0-9a-f]+$/.test(partes[2]);
}

async function main() {
  console.log(`\n🔐 Migración de Cifrado de Expedientes Legacy`);
  console.log(`   Modo: ${applyMode ? '⚡ APLICAR CAMBIOS' : '👁️  DRY-RUN (solo reporte)'}\n`);

  const expedientes = await prisma.expediente.findMany({
    include: { paciente: { select: { nombre: true } } }
  });

  console.log(`   Total de registros de expediente: ${expedientes.length}\n`);

  let totalCamposSinCifrar = 0;
  let totalRegistrosAfectados = 0;

  for (const exp of expedientes) {
    const camposSinCifrar = [];

    for (const campo of CAMPOS_CLINICOS) {
      const valor = exp[campo];
      if (valor && !estaCifrado(valor)) {
        camposSinCifrar.push(campo);
      }
    }

    if (camposSinCifrar.length === 0) continue;

    totalRegistrosAfectados++;
    totalCamposSinCifrar += camposSinCifrar.length;

    const pacienteNombre = exp.paciente?.nombre || 'Desconocido';
    console.log(`   ⚠️  Expediente #${exp.id} (Paciente: ${pacienteNombre}, Sesión: ${exp.fechaSesion.toISOString().split('T')[0]})`);
    console.log(`       Campos sin cifrar: ${camposSinCifrar.join(', ')}`);

    if (applyMode) {
      const updateData = {};
      for (const campo of camposSinCifrar) {
        updateData[campo] = cifrar(exp[campo]);
      }

      await prisma.expediente.update({
        where: { id: exp.id },
        data: updateData
      });

      console.log(`       ✅ Cifrado aplicado exitosamente`);
    }
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`   Registros afectados: ${totalRegistrosAfectados}`);
  console.log(`   Campos cifrados:     ${totalCamposSinCifrar}`);

  if (totalRegistrosAfectados === 0) {
    console.log(`\n   ✅ Todos los registros ya están cifrados. No se requiere acción.\n`);
  } else if (!applyMode) {
    console.log(`\n   ℹ️  Ejecuta con --apply para cifrar los registros detectados:`);
    console.log(`      node scripts/migrateEncryptLegacy.js --apply\n`);
  } else {
    console.log(`\n   ✅ Migración completada exitosamente.\n`);
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Error fatal en migración:', err);
  await prisma.$disconnect();
  process.exit(1);
});
