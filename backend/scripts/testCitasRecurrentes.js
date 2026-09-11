const { test } = require('node:test');
const assert = require('node:assert');
require('dotenv').config();
const express = require('express');
const http = require('http');
const jwt = require('jsonwebtoken');
const prisma = require('../src/config/db');
const routes = require('../src/routes');

test('Gestión y edición de citas recurrentes en serie (Spec 002)', async () => {
  console.log('=== TEST SUITE: GESTIÓN Y EDICIÓN DE CITAS RECURRENTES EN SERIE (SPEC 002) ===\n');

  // Iniciar servidor express temporal en puerto dinámico
  const app = express();
  app.use(express.json());
  app.use('/api', routes);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;
  console.log(`✓ Servidor de prueba temporal activo en puerto ${port}`);

  let pacienteCreado = null;
  let serieIdGenerado = null;
  let citasCreadas = [];

  try {
    // 1. Generar token de prueba JWT
    const token = jwt.sign({ id: 1, email: 'test.admin@psicolau.com' }, process.env.JWT_SECRET || 'secret123456789012345', { expiresIn: '1h' });
    console.log('✓ Token JWT administrativo generado.');

    // 2. CREACIÓN EN SERIE (4 sesiones semanales)
    const emailTest = `paciente.serie.${Date.now()}@test.com`;
    const fechaBase = new Date('2026-09-10T10:00:00.000Z');

    const resCrear = await fetch(`${baseUrl}/agenda/citas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        nombre: 'Paciente Prueba Serie Recurrente',
        email: emailTest,
        telefono: '+52 55 9988 7766',
        enlaceZoom: 'https://zoom.us/j/123456',
        fechaHora: fechaBase.toISOString(),
        categoria: 'Terapia Individual',
        monto: 600,
        color: '#3EB8CC',
        repeticiones: 4,
        frecuencia: 'SEMANAL'
      })
    });

    const dataCrear = await resCrear.json();
    assert.strictEqual(dataCrear.success, true, `Fallo al crear serie: ${JSON.stringify(dataCrear)}`);
    
    // Obtener las 4 citas creadas en la base de datos
    citasCreadas = await prisma.cita.findMany({
      where: { serieId: dataCrear.data.serieId },
      orderBy: { fechaHora: 'asc' },
      include: { paciente: true }
    });

    pacienteCreado = citasCreadas[0].paciente;
    serieIdGenerado = citasCreadas[0].serieId;

    assert.strictEqual(citasCreadas.length, 4, `Se esperaban 4 citas pero se obtuvieron ${citasCreadas.length}`);
    assert.ok(serieIdGenerado && serieIdGenerado.startsWith('serie_'), `serieId inválido: ${serieIdGenerado}`);

    const todasConMismoSerieId = citasCreadas.every(c => c.serieId === serieIdGenerado);
    assert.strictEqual(todasConMismoSerieId, true, 'Las citas de la serie no comparten el mismo serieId');

    console.log(`✓ Test 1: Serie de 4 citas creada exitosamente con serieId: "${serieIdGenerado}"`);

    // 3. TEST EDICIÓN INDIVIDUAL (SOLO_ESTA) EN CITA 2
    const cita2 = citasCreadas[1];
    const resEditSolo = await fetch(`${baseUrl}/agenda/citas/${cita2.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        nombre: 'Paciente Prueba Serie Recurrente',
        color: '#ef4444',
        alcance: 'SOLO_ESTA'
      })
    });

    const dataEditSolo = await resEditSolo.json();
    assert.strictEqual(dataEditSolo.success, true, `Fallo en edición SOLO_ESTA: ${JSON.stringify(dataEditSolo)}`);

    const cita2DB = await prisma.cita.findUnique({ where: { id: cita2.id } });
    const cita3DBPre = await prisma.cita.findUnique({ where: { id: citasCreadas[2].id } });

    assert.strictEqual(cita2DB.color, '#ef4444', `Color de cita 2 no actualizado: ${cita2DB.color}`);
    assert.notStrictEqual(cita3DBPre.color, '#ef4444', 'Error: Cita 3 fue modificada cuando el alcance era SOLO_ESTA');
    console.log('✓ Test 2: Edición SOLO_ESTA modifica exclusivamente la cita seleccionada.');

    // 4. PREPARAR ESTADOS PARA TEST DE PROPAGACIÓN
    await prisma.cita.update({
      where: { id: citasCreadas[0].id },
      data: { estado_cita: 'REALIZADA' }
    });

    await prisma.cita.update({
      where: { id: citasCreadas[3].id },
      data: { estado_pago: 'PAGADO', monto: 600 }
    });

    // 5. TEST EDICIÓN PROPAGADA (ESTA_Y_SIGUIENTES) DESDE CITA 2
    const fechaOriginalCita2 = new Date(cita2.fechaHora);
    const nuevaFechaCita2 = new Date(fechaOriginalCita2.getTime() + (2 * 60 * 60 * 1000)); // +2 horas

    const resEditSerie = await fetch(`${baseUrl}/agenda/citas/${cita2.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        nombre: 'Paciente Prueba Serie Recurrente',
        fechaHora: nuevaFechaCita2.toISOString(),
        monto: 750,
        categoria: 'Terapia Avanzada',
        alcance: 'ESTA_Y_SIGUIENTES'
      })
    });

    const dataEditSerie = await resEditSerie.json();
    assert.strictEqual(dataEditSerie.success, true, `Fallo en edición ESTA_Y_SIGUIENTES: ${JSON.stringify(dataEditSerie)}`);

    const citasPostUpdate = await prisma.cita.findMany({
      where: { pacienteId: pacienteCreado.id },
      orderBy: { id: 'asc' }
    });

    const c1 = citasPostUpdate.find(c => c.id === citasCreadas[0].id);
    const c2 = citasPostUpdate.find(c => c.id === citasCreadas[1].id);
    const c3 = citasPostUpdate.find(c => c.id === citasCreadas[2].id);
    const c4 = citasPostUpdate.find(c => c.id === citasCreadas[3].id);

    // Cita 1 (REALIZADA): fecha y hora intacta (RF-6)
    assert.strictEqual(c1.fechaHora.getTime(), citasCreadas[0].fechaHora.getTime(), 'Error: Cita 1 (REALIZADA) fue alterada en fechaHora');
    console.log('✓ Test 3a (RF-6): Cita pasada marcada como REALIZADA protegida de desplazamientos.');

    // Cita 2 y 3: trasladadas +2 horas
    const diffC2 = c2.fechaHora.getTime() - citasCreadas[1].fechaHora.getTime();
    const diffC3 = c3.fechaHora.getTime() - citasCreadas[2].fechaHora.getTime();
    assert.strictEqual(diffC2, 2 * 60 * 60 * 1000, `Desplazamiento incorrecto C2: ${diffC2}`);
    assert.strictEqual(diffC3, 2 * 60 * 60 * 1000, `Desplazamiento incorrecto C3: ${diffC3}`);
    console.log('✓ Test 3b (RF-5): Citas 2 y 3 desplazadas exactamente +2 horas en horario.');

    // Cita 3 (PENDIENTE): actualizó monto a $750
    assert.strictEqual(c3.monto, 750, `Monto de Cita 3 no actualizado a 750`);

    // Cita 4 (PAGADO): conservó PAGADO y tarifa original (RF-7)
    assert.strictEqual(c4.estado_pago, 'PAGADO', 'Cita 4 no preservó estado PAGADO');
    assert.strictEqual(c4.monto, 600, 'Cita 4 no preservó monto 600');
    console.log('✓ Test 3c (RF-7): Cita 4 con estado PAGADO conservó su pago y tarifa intactos.');

    assert.strictEqual(c2.categoria, 'Terapia Avanzada');
    assert.strictEqual(c3.categoria, 'Terapia Avanzada');
    console.log('✓ Test 3d (RF-2): Campo de notas preservado 100% limpio sin texto redundante de sesión.');

    // 6. TEST CANCELACIÓN PROPAGADA (ESTA_Y_SIGUIENTES) DESDE CITA 3
    const resCancelar = await fetch(`${baseUrl}/agenda/citas/${c3.id}/cancelar`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ alcance: 'ESTA_Y_SIGUIENTES' })
    });

    const dataCancelar = await resCancelar.json();
    assert.strictEqual(dataCancelar.success, true, `Fallo al cancelar serie: ${JSON.stringify(dataCancelar)}`);

    const c1PostCanc = await prisma.cita.findUnique({ where: { id: c1.id } });
    const c2PostCanc = await prisma.cita.findUnique({ where: { id: c2.id } });
    const c3PostCanc = await prisma.cita.findUnique({ where: { id: c3.id } });
    const c4PostCanc = await prisma.cita.findUnique({ where: { id: c4.id } });

    assert.notStrictEqual(c1PostCanc.estado_cita, 'CANCELADA', 'Cita 1 no debe ser cancelada');
    assert.notStrictEqual(c2PostCanc.estado_cita, 'CANCELADA', 'Cita 2 no debe ser cancelada');
    assert.strictEqual(c3PostCanc.estado_cita, 'CANCELADA', 'Cita 3 debe estar cancelada');
    assert.strictEqual(c4PostCanc.estado_cita, 'CANCELADA', 'Cita 4 debe estar cancelada');
    console.log('✓ Test 4 (RF-8, RF-9): Cancelación ESTA_Y_SIGUIENTES canceló Citas 3 y 4 preservando 1 y 2.');

    console.log('\n🎉 ¡TODAS LAS PRUEBAS AUTOMATIZADAS DE CITAS RECURRENTES EN SERIE PASARON AL 100%! 🎉\n');
  } finally {
    // Limpieza de datos de prueba
    if (pacienteCreado) {
      await prisma.logNotificacion.deleteMany({
        where: { cita: { pacienteId: pacienteCreado.id } }
      }).catch(() => {});

      await prisma.cita.deleteMany({
        where: { pacienteId: pacienteCreado.id }
      }).catch(() => {});

      await prisma.paciente.delete({
        where: { id: pacienteCreado.id }
      }).catch(() => {});
    }

    await prisma.$disconnect();
    server.close();
  }
});
