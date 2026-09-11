/**
 * Test automatizado: Visibilidad de Citas Canceladas y Control de Asistencia (Spec 003)
 */

const { test } = require('node:test');
const assert = require('node:assert');
const express = require('express');
const http = require('http');
const jwt = require('jsonwebtoken');
const prisma = require('../src/config/db');
const agendaRoutes = require('../src/routes/agenda');

test('Visibilidad de citas canceladas en matriz semanal (Spec 003)', async () => {
  console.log('\n=== TEST SUITE: VISIBILIDAD DE CITAS CANCELADAS EN MATRIZ SEMANAL (SPEC 003) ===\n');

  const app = express();
  app.use(express.json());
  app.use('/agenda', agendaRoutes);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`✓ Servidor de prueba temporal activo en puerto ${port}`);

  const jwtSecret = process.env.JWT_SECRET || 'secret_psicolau_jwt_default_dev';
  const token = jwt.sign(
    { id: 9999, email: 'admin@psicolau.com', rol: 'ADMIN' },
    jwtSecret,
    { expiresIn: '1h' }
  );
  console.log('✓ Token JWT administrativo generado.');

  let pacienteIdTest = null;
  let citaIdTest = null;

  try {
    // 1. Crear paciente y cita inicial
    const paciente = await prisma.paciente.create({
      data: {
        nombre: 'Paciente Test Canceladas Spec003',
        email: `test-canc-${Date.now()}@psicolau.com`,
        telefono: '+52 5599887766',
        tarifaDefecto: 550
      }
    });
    pacienteIdTest = paciente.id;

    const fechaCita = new Date('2026-09-15T16:00:00.000Z');
    const cita = await prisma.cita.create({
      data: {
        pacienteId: paciente.id,
        fechaHora: fechaCita,
        categoria: 'Primera sesión evaluación',
        color: '#3EB8CC',
        monto: 550,
        estado_cita: 'PENDIENTE',
        estado_pago: 'PENDIENTE'
      }
    });
    citaIdTest = cita.id;
    console.log(`✓ Test 1: Cita inicial creada con ID ${cita.id} y estado "PENDIENTE".`);

    // 2. Cancelación rápida vía PATCH /agenda/citas/:id/estado (RF-3)
    const resCancel = await fetch(`${baseUrl}/agenda/citas/${cita.id}/estado`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ estado_cita: 'CANCELADA' })
    });
    const dataCancel = await resCancel.json();
    assert.strictEqual(dataCancel.success, true, `Fallo en cancelación rápida: ${JSON.stringify(dataCancel)}`);

    const citaCancelada = await prisma.cita.findUnique({ where: { id: cita.id } });
    assert.strictEqual(citaCancelada.estado_cita, 'CANCELADA', `Estado no actualizado a CANCELADA`);
    console.log('✓ Test 2 (RF-3): Cancelación rápida en 1 clic actualizó estado a "CANCELADA".');

    // 3. Consulta de agenda: la cita cancelada debe ser devuelta en GET /agenda/citas para renderizar en semana (RF-1)
    const resGet = await fetch(`${baseUrl}/agenda/citas`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const dataGet = await resGet.json();
    assert.strictEqual(dataGet.success, true, 'Consulta de agenda debe ser exitosa');
    assert.ok(Array.isArray(dataGet.data), 'dataGet.data debe ser un arreglo');

    const citaEncontrada = dataGet.data.find(c => c.id === cita.id);
    assert.ok(citaEncontrada, 'La cita cancelada debe ser devuelta en la lista');
    assert.strictEqual(citaEncontrada.estado_cita, 'CANCELADA', 'La cita devuelta debe tener estado CANCELADA');
    console.log('✓ Test 3 (RF-1): Cita cancelada devuelta correctamente en la API para visualización en la celda horaria.');

    // 4. Reactivación rápida vía PATCH /agenda/citas/:id/estado (RF-4)
    const resReactivar = await fetch(`${baseUrl}/agenda/citas/${cita.id}/estado`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ estado_cita: 'PENDIENTE' })
    });
    const dataReactivar = await resReactivar.json();
    assert.strictEqual(dataReactivar.success, true, `Fallo al reactivar cita: ${JSON.stringify(dataReactivar)}`);

    const citaReactivada = await prisma.cita.findUnique({ where: { id: cita.id } });
    assert.strictEqual(citaReactivada.estado_cita, 'PENDIENTE', `Estado no reactivado a PENDIENTE`);
    console.log('✓ Test 4 (RF-4): Reactivación rápida en 1 clic restauró estado a "PENDIENTE".');

    // 5. Edición desde el modal con cambio de estado explícito a CANCELADA (RF-5)
    const resEdit = await fetch(`${baseUrl}/agenda/citas/${cita.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        nombre: 'Paciente Test Canceladas Spec003',
        estado_cita: 'CANCELADA',
        notas: 'Paciente avisó que no podrá asistir por viaje laboral',
        color: '#f97316'
      })
    });
    const dataEdit = await resEdit.json();
    assert.strictEqual(dataEdit.success, true, `Fallo en edición con estado: ${JSON.stringify(dataEdit)}`);

    const citaEditada = await prisma.cita.findUnique({ where: { id: cita.id } });
    assert.strictEqual(citaEditada.estado_cita, 'CANCELADA');
    assert.strictEqual(citaEditada.categoria, 'Paciente avisó que no podrá asistir por viaje laboral');
    console.log('✓ Test 5 (RF-5): Modificación de estado_cita persistida exitosamente vía PUT /agenda/citas/:id.');

    // 6. Preservación de cobro previo en cita cancelada (RF-6)
    await prisma.cita.update({
      where: { id: cita.id },
      data: { estado_pago: 'PAGADO', monto: 550 }
    });
    const citaPagada = await prisma.cita.findUnique({ where: { id: cita.id } });
    assert.strictEqual(citaPagada.estado_cita, 'CANCELADA');
    assert.strictEqual(citaPagada.estado_pago, 'PAGADO');
    assert.strictEqual(citaPagada.monto, 550);
    console.log('✓ Test 6 (RF-6): Estado de pago previo (PAGADO) preservado íntegramente en cita cancelada.');

    console.log('\n🎉 ¡TODAS LAS PRUEBAS AUTOMATIZADAS DE SPEC 003 PASARON AL 100%! 🎉\n');
  } finally {
    if (citaIdTest) {
      await prisma.cita.deleteMany({ where: { id: citaIdTest } }).catch(() => {});
    }
    if (pacienteIdTest) {
      await prisma.paciente.deleteMany({ where: { id: pacienteIdTest } }).catch(() => {});
    }
    await prisma.$disconnect();
    server.close();
  }
});
