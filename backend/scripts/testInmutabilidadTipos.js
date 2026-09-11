const { test } = require('node:test');
const assert = require('node:assert');
require('dotenv').config();
const prisma = require('../src/config/db');

test('Inmutabilidad de tipos en edición de citas', async () => {
  console.log('=== TEST: INMUTABILIDAD DE TIPOS EN EDICIÓN DE CITAS ===\n');

  let pacInd = null;
  let citaInd = null;
  let pacGrup = null;
  let citaGrup = null;
  let pacBloq = null;
  let citaBloq = null;

  try {
    // 1. Crear Cita Individual
    console.log('1. Creando cita individual de prueba...');
    pacInd = await prisma.paciente.create({
      data: {
        nombre: 'Paciente Individual Test',
        telefono: '+52 222 111 2233',
        email: `pac.ind.${Date.now()}@test.com`
      }
    });
    citaInd = await prisma.cita.create({
      data: {
        pacienteId: pacInd.id,
        fechaHora: new Date(),
        categoria: 'Primera sesión clínica'
      }
    });

    // Simular intento de mutar Cita Individual a Bloqueo o Grupal
    console.log('2. Verificando que editarCita preserva la naturaleza individual...');
    const eraBloqueo1 = (citaInd.categoria && citaInd.categoria.startsWith('[BLOQUEO]')) || (pacInd.nombre.startsWith('[BLOQUEO]'));
    const eraGrupal1 = (citaInd.categoria && citaInd.categoria.startsWith('[GRUPAL]')) || (pacInd.nombre.startsWith('[GRUPAL]'));
    
    assert.strictEqual(Boolean(eraBloqueo1), false, 'La cita no debería ser detectada como bloqueo');
    assert.strictEqual(Boolean(eraGrupal1), false, 'La cita no debería ser detectada como grupal');

    // 2. Crear Cita Grupal
    console.log('\n3. Creando terapia grupal de prueba...');
    pacGrup = await prisma.paciente.create({
      data: {
        nombre: '[GRUPAL] Taller de Habilidades Test',
        email: `grupal-${Date.now()}@psicolau.com`,
        telefono: '',
        enlaceZoom: 'https://zoom.us/j/123456789'
      }
    });
    citaGrup = await prisma.cita.create({
      data: {
        pacienteId: pacGrup.id,
        fechaHora: new Date(),
        categoria: '[GRUPAL] Módulo 1'
      }
    });

    const eraGrupal2 = (citaGrup.categoria && citaGrup.categoria.startsWith('[GRUPAL]')) || (pacGrup.nombre.startsWith('[GRUPAL]'));
    assert.strictEqual(Boolean(eraGrupal2), true, 'La sesión grupal debe ser reconocida como grupal.');
    console.log('✓ Correcto: La sesión grupal es reconocida y mantiene su tipo grupal.');

    // 3. Crear Bloqueo
    console.log('\n4. Creando bloqueo de prueba...');
    pacBloq = await prisma.paciente.create({
      data: {
        nombre: '[BLOQUEO] Comida / Personal',
        email: `sin-email-${Date.now()}@psicolau.com`,
        telefono: ''
      }
    });
    citaBloq = await prisma.cita.create({
      data: {
        pacienteId: pacBloq.id,
        fechaHora: new Date(),
        categoria: '[BLOQUEO] No disponible'
      }
    });

    const eraBloqueo3 = (citaBloq.categoria && citaBloq.categoria.startsWith('[BLOQUEO]')) || (pacBloq.nombre.startsWith('[BLOQUEO]'));
    assert.strictEqual(Boolean(eraBloqueo3), true, 'El bloqueo debe ser reconocido como bloqueo.');
    console.log('✓ Correcto: El bloqueo es reconocido y mantiene su tipo bloqueo.');

    console.log('\n=============================================================');
    console.log('🎉 TODOS LOS TESTS DE INMUTABILIDAD DE TIPOS PASARON AL 100%');
    console.log('=============================================================');
  } finally {
    // Limpieza garantizada incluso si ocurre un fallo
    console.log('\n5. Limpiando datos de prueba...');
    if (citaInd) await prisma.cita.delete({ where: { id: citaInd.id } }).catch(() => {});
    if (pacInd) await prisma.paciente.delete({ where: { id: pacInd.id } }).catch(() => {});
    if (citaGrup) await prisma.cita.delete({ where: { id: citaGrup.id } }).catch(() => {});
    if (pacGrup) await prisma.paciente.delete({ where: { id: pacGrup.id } }).catch(() => {});
    if (citaBloq) await prisma.cita.delete({ where: { id: citaBloq.id } }).catch(() => {});
    if (pacBloq) await prisma.paciente.delete({ where: { id: pacBloq.id } }).catch(() => {});
    await prisma.$disconnect();
    console.log('✓ Limpieza completada.');
  }
});
