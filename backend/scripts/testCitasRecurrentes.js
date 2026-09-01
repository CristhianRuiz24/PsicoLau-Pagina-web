require('dotenv').config();
const express = require('express');
const http = require('http');
const jwt = require('jsonwebtoken');
const prisma = require('../src/config/db');
const routes = require('../src/routes');

async function testCitasRecurrentesSuite() {
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
    if (!dataCrear.success) throw new Error(`Fallo al crear serie: ${JSON.stringify(dataCrear)}`);
    
    // Obtener las 4 citas creadas en la base de datos
    citasCreadas = await prisma.cita.findMany({
      where: { paciente: { email: emailTest } },
      orderBy: { fechaHora: 'asc' },
      include: { paciente: true }
    });

    pacienteCreado = citasCreadas[0].paciente;
    serieIdGenerado = citasCreadas[0].serieId;

    if (citasCreadas.length !== 4) throw new Error(`Se esperaban 4 citas pero se obtuvieron ${citasCreadas.length}`);
    if (!serieIdGenerado || !serieIdGenerado.startsWith('serie_')) throw new Error(`serieId inválido: ${serieIdGenerado}`);

    const todasConMismoSerieId = citasCreadas.every(c => c.serieId === serieIdGenerado);
    if (!todasConMismoSerieId) throw new Error('Las citas de la serie no comparten el mismo serieId');

    console.log(`✓ Test 1: Serie de 4 citas creada exitosamente con serieId: "${serieIdGenerado}"`);
    citasCreadas.forEach((c, idx) => {
      console.log(`   - Cita ${idx + 1}: ${c.fechaHora.toISOString()} | Categoría: "${c.categoria}" | Monto: $${c.monto}`);
    });

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
    if (!dataEditSolo.success) throw new Error(`Fallo en edición SOLO_ESTA: ${JSON.stringify(dataEditSolo)}`);

    const cita2DB = await prisma.cita.findUnique({ where: { id: cita2.id } });
    const cita3DBPre = await prisma.cita.findUnique({ where: { id: citasCreadas[2].id } });

    if (cita2DB.color !== '#ef4444') throw new Error(`Color de cita 2 no actualizado: ${cita2DB.color}`);
    if (cita3DBPre.color === '#ef4444') throw new Error('Error: Cita 3 fue modificada cuando el alcance era SOLO_ESTA');
    console.log('✓ Test 2: Edición SOLO_ESTA modifica exclusivamente la cita seleccionada.');

    // 4. PREPARAR ESTADOS PARA TEST DE PROPAGACIÓN
    // - Marcar Cita 1 como REALIZADA (RF-6: debe ser protegida de cambios)
    await prisma.cita.update({
      where: { id: citasCreadas[0].id },
      data: { estado_cita: 'REALIZADA' }
    });

    // - Marcar Cita 4 como PAGADO con monto 600 (RF-7: debe preservar estado PAGADO y monto)
    await prisma.cita.update({
      where: { id: citasCreadas[3].id },
      data: { estado_pago: 'PAGADO', monto: 600 }
    });

    // 5. TEST EDICIÓN PROPAGADA (ESTA_Y_SIGUIENTES) DESDE CITA 2
    // Mover Cita 2 dos horas más tarde (+2 horas = +7200000 ms) y cambiar monto a $750
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
    if (!dataEditSerie.success) throw new Error(`Fallo en edición ESTA_Y_SIGUIENTES: ${JSON.stringify(dataEditSerie)}`);

    // Consultar estado de todas las citas tras la propagación
    const citasPostUpdate = await prisma.cita.findMany({
      where: { pacienteId: pacienteCreado.id },
      orderBy: { id: 'asc' }
    });

    const c1 = citasPostUpdate.find(c => c.id === citasCreadas[0].id);
    const c2 = citasPostUpdate.find(c => c.id === citasCreadas[1].id);
    const c3 = citasPostUpdate.find(c => c.id === citasCreadas[2].id);
    const c4 = citasPostUpdate.find(c => c.id === citasCreadas[3].id);

    // Verificaciones:
    // Cita 1 (REALIZADA): fecha y hora intacta (RF-6)
    if (c1.fechaHora.getTime() !== citasCreadas[0].fechaHora.getTime()) {
      throw new Error('Error: Cita 1 (REALIZADA) fue alterada en fechaHora');
    }
    console.log('✓ Test 3a (RF-6): Cita pasada marcada como REALIZADA protegida de desplazamientos.');

    // Cita 2 y 3: trasladadas +2 horas
    const diffC2 = c2.fechaHora.getTime() - citasCreadas[1].fechaHora.getTime();
    const diffC3 = c3.fechaHora.getTime() - citasCreadas[2].fechaHora.getTime();
    if (diffC2 !== 2 * 60 * 60 * 1000 || diffC3 !== 2 * 60 * 60 * 1000) {
      throw new Error(`Desplazamiento incorrecto: C2 diff=${diffC2}, C3 diff=${diffC3}`);
    }
    console.log('✓ Test 3b (RF-5): Citas 2 y 3 desplazadas exactamente +2 horas en horario.');

    // Cita 3 (PENDIENTE): actualizó monto a $750
    if (c3.monto !== 750) throw new Error(`Monto de Cita 3 no actualizado a 750 (es ${c3.monto})`);

    // Cita 4 (PAGADO): trasladada +2 horas pero conserva PAGADO y su monto original de 600 (RF-7)
    if (c4.estado_pago !== 'PAGADO' || c4.monto !== 600) {
      throw new Error(`Cita 4 no preservó estado PAGADO o monto: pago=${c4.estado_pago}, monto=${c4.monto}`);
    }
    console.log('✓ Test 3c (RF-7): Cita 4 con estado PAGADO conservó su pago y tarifa intactos.');

    // Notas limpias preservadas sin concatenación de Sesión X/N
    if (c2.categoria !== 'Terapia Avanzada' || c3.categoria !== 'Terapia Avanzada') {
      throw new Error(`Notas no actualizadas limpiamente: C2="${c2.categoria}", C3="${c3.categoria}"`);
    }
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
    if (!dataCancelar.success) throw new Error(`Fallo al cancelar serie: ${JSON.stringify(dataCancelar)}`);

    const c1PostCanc = await prisma.cita.findUnique({ where: { id: c1.id } });
    const c2PostCanc = await prisma.cita.findUnique({ where: { id: c2.id } });
    const c3PostCanc = await prisma.cita.findUnique({ where: { id: c3.id } });
    const c4PostCanc = await prisma.cita.findUnique({ where: { id: c4.id } });

    if (c1PostCanc.estado_cita === 'CANCELADA' || c2PostCanc.estado_cita === 'CANCELADA') {
      throw new Error('Error: Citas 1 y 2 fueron canceladas incorrectamente');
    }
    if (c3PostCanc.estado_cita !== 'CANCELADA' || c4PostCanc.estado_cita !== 'CANCELADA') {
      throw new Error('Error: Citas 3 y 4 no fueron canceladas');
    }
    console.log('✓ Test 4 (RF-8, RF-9): Cancelación ESTA_Y_SIGUIENTES canceló Citas 3 y 4 preservando 1 y 2.');

    console.log('\n🎉 ¡TODAS LAS PRUEBAS AUTOMATIZADAS DE CITAS RECURRENTES EN SERIE PASARON AL 100%! 🎉\n');

  } catch (err) {
    console.error('❌ Error en suite de pruebas:', err);
    process.exitCode = 1;
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
}

testCitasRecurrentesSuite();
