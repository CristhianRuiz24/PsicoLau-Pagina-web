const { test } = require('node:test');
const assert = require('node:assert');
require('dotenv').config();
const prisma = require('../src/config/db');
const jwt = require('jsonwebtoken');

test('Control de ingresos, tarifas y reportes contables', async () => {
  console.log('=== TEST DE CONTROL DE INGRESOS Y REPORTES CONTABLES ===\n');

  let pacienteCreado = null;
  let cita1 = null;
  let cita2 = null;

  try {
    const PORT = process.env.PORT || 3001;
    // 1. Generar token de prueba
    const token = jwt.sign({ id: 1, email: 'test.admin@psicolau.com' }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
    console.log('✓ Token JWT de prueba generado.');

    // 2. Crear paciente con tarifa personalizada mediante API interna
    const emailTest = `paciente.contable.${Date.now()}@test.com`;
    const resCrear = await fetch(`http://localhost:${PORT}/api/agenda/citas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        nombre: 'Paciente Prueba Contabilidad',
        email: emailTest,
        telefono: '+52 55 1234 5678',
        fechaHora: new Date('2026-08-15T10:00:00.000Z').toISOString(),
        categoria: 'Sesión Terapéutica',
        monto: 1200
      })
    });

    const dataCita1 = await resCrear.json();
    assert.strictEqual(dataCita1.success, true, `Fallo al crear cita 1: ${JSON.stringify(dataCita1)}`);
    cita1 = dataCita1.data;
    assert.strictEqual(cita1.monto, 1200, 'El monto de Cita 1 debe ser 1200');
    console.log(`✓ Cita 1 creada exitosamente con Monto: $${cita1.monto} (Esperado: 1200)`);

    // Verificar que el paciente guardó tarifaDefecto = 1200
    const pacienteEnDB = await prisma.paciente.findUnique({
      where: { id: cita1.pacienteId }
    });
    pacienteCreado = pacienteEnDB;
    assert.strictEqual(pacienteEnDB.tarifaDefecto, 1200, 'tarifaDefecto del paciente debe ser 1200');
    console.log(`✓ Paciente creado con tarifaDefecto: $${pacienteEnDB.tarifaDefecto} (Esperado: 1200)`);

    // 3. Crear segunda cita para el mismo paciente sin especificar monto -> debe heredar 1200
    const resCrear2 = await fetch(`http://localhost:${PORT}/api/agenda/citas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        nombre: 'Paciente Prueba Contabilidad',
        email: emailTest,
        fechaHora: new Date('2026-08-22T10:00:00.000Z').toISOString(),
        categoria: 'Sesión Seguimiento'
      })
    });

    const dataCita2 = await resCrear2.json();
    assert.strictEqual(dataCita2.success, true, `Fallo al crear cita 2: ${JSON.stringify(dataCita2)}`);
    cita2 = dataCita2.data;
    assert.strictEqual(cita2.monto, 1200, 'Cita 2 debe heredar tarifa del paciente 1200');
    console.log(`✓ Cita 2 hereda tarifa del paciente con Monto: $${cita2.monto} (Esperado: 1200)`);

    // 4. Probar actualización rápida de monto vía PATCH /citas/:id/monto a $0 (Cortesía)
    const resPatch = await fetch(`http://localhost:${PORT}/api/agenda/citas/${cita2.id}/monto`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ monto: 0 })
    });

    const dataPatch = await resPatch.json();
    assert.strictEqual(dataPatch.success, true, `Fallo al actualizar monto vía PATCH: ${JSON.stringify(dataPatch)}`);
    assert.strictEqual(dataPatch.data.monto, 0, 'Monto de cita 2 debe ser 0');
    console.log(`✓ Cita 2 actualizada vía PATCH a Monto: $${dataPatch.data.monto} (Esperado: 0)`);

    // 5. Validar que se rechacen montos negativos (< 0)
    const resError = await fetch(`http://localhost:${PORT}/api/agenda/citas/${cita1.id}/monto`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ monto: -500 })
    });

    const dataError = await resError.json();
    assert.strictEqual(resError.status, 400, 'Debe rechazar monto negativo con 400');
    assert.strictEqual(dataError.success, false, 'success debe ser false al rechazar monto negativo');
    console.log('✓ Validación de monto negativo rechazada con 400 Bad Request como se esperaba.');

    console.log('\n🎉 ¡TODAS LAS PRUEBAS DE CONTABILIDAD Y MONTOS PASARON CON ÉXITO! (100% OK)');
  } finally {
    // Limpieza de datos de prueba
    if (cita1) await prisma.cita.delete({ where: { id: cita1.id } }).catch(() => {});
    if (cita2) await prisma.cita.delete({ where: { id: cita2.id } }).catch(() => {});
    if (pacienteCreado) await prisma.paciente.delete({ where: { id: pacienteCreado.id } }).catch(() => {});
    await prisma.$disconnect();
  }
});
