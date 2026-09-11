/**
 * testBlindajeEmail500.js
 * 
 * Verifica que el endpoint de edición de citas:
 * 1. Responda 400 Bad Request (y NUNCA 500 Error interno) si se intenta usar un correo que ya pertenece a otro paciente.
 * 2. Permita editar y guardar citas con correo vacío ("") sin romper la unicidad en Prisma.
 */

const { test } = require('node:test');
const assert = require('node:assert');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const prisma = require('../src/config/db');

test('Blindaje contra error 500 por colisión de correo en edición de citas', async () => {
  console.log('🧪 Iniciando pruebas de blindaje contra error 500 por colisión de correo...\n');

  const PORT = process.env.PORT || 3001;
  const token = jwt.sign({ id: 1, email: 'test@psicolau.com' }, process.env.JWT_SECRET || 'secret123456789012345');
  const authHeader = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  let p1 = null;
  let p2 = null;
  let cita = null;

  try {
    p1 = await prisma.paciente.create({
      data: {
        nombre: 'Paciente Blindaje A',
        email: `test-blind-a-${Date.now()}@local.com`,
        telefono: '5511111111'
      }
    });

    p2 = await prisma.paciente.create({
      data: {
        nombre: 'Paciente Blindaje B',
        email: `test-blind-b-${Date.now()}@local.com`,
        telefono: '5522222222'
      }
    });

    cita = await prisma.cita.create({
      data: {
        pacienteId: p1.id,
        fechaHora: new Date(),
        categoria: 'Test'
      }
    });

    // 1. Probar enviar el correo del Paciente 2 a la cita del Paciente 1
    console.log(`Intentando asignar a la cita (paciente "${p1.nombre}") el correo de "${p2.nombre}" (${p2.email})...`);
    
    const resDup = await fetch(`http://localhost:${PORT}/api/agenda/citas/${cita.id}`, {
      method: 'PUT',
      headers: authHeader,
      body: JSON.stringify({
        nombre: p1.nombre,
        email: p2.email, // Correo duplicado
        telefono: '5511111111',
        monto: 500,
        estado_cita: 'PENDIENTE'
      })
    });

    const dataDup = await resDup.json();
    assert.strictEqual(resDup.status, 400, 'El servidor debe responder con código 400 (Bad Request), NUNCA 500');
    assert.strictEqual(dataDup.success, false);
    assert.ok(dataDup.message.toLowerCase().includes('ya está') || dataDup.message.toLowerCase().includes('registrado') || dataDup.message.toLowerCase().includes('existe'), 'El mensaje debe explicar que el correo ya pertenece a otro paciente');
    console.log('✅ Test 1: Colisión de correo prevenida limpiamente con código 400 (sin error 500).');

    // 2. Probar guardar con correo vacío ("")
    console.log('\nIntentando guardar cita con correo vacío ("")...');
    const resEmpty = await fetch(`http://localhost:${PORT}/api/agenda/citas/${cita.id}`, {
      method: 'PUT',
      headers: authHeader,
      body: JSON.stringify({
        nombre: p1.nombre,
        email: '', // Correo vacío (opcional)
        telefono: '5511111111',
        monto: 500,
        estado_cita: 'PENDIENTE'
      })
    });

    const dataEmpty = await resEmpty.json();
    assert.strictEqual(resEmpty.status, 200, 'Guardar con correo vacío debe ser completamente exitoso (200 OK)');
    assert.strictEqual(dataEmpty.success, true);
    console.log('✅ Test 2: Guardar cita con correo opcional vacío funciona de forma fluida.');

    console.log('\n🎉 ¡TODAS LAS PRUEBAS DE BLINDAJE DE CORREO PASARON CON 100% DE ÉXITO!');
  } finally {
    if (cita) await prisma.cita.delete({ where: { id: cita.id } }).catch(() => {});
    if (p1) await prisma.paciente.delete({ where: { id: p1.id } }).catch(() => {});
    if (p2) await prisma.paciente.delete({ where: { id: p2.id } }).catch(() => {});
    await prisma.$disconnect();
  }
});
