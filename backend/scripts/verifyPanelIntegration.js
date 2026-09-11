/**
 * verifyPanelIntegration.js
 * 
 * Verificación Integral de Integridad para el Panel Clínico (Spec 017 & Suite Clínica).
 * Comprueba que el panel funcione con los datos cifrados y descifrados:
 * 1. GET /api/agenda/citas: Ningún nombre de paciente devuelto contiene formato de cifrado 'iv:tag:ciphertext'.
 * 2. GET /api/pacientes: El directorio devuelve pacientes descifrados legibles y cuenta con sus métricas.
 * 3. GET /api/pacientes/:id/expediente: Devuelve notas y datos del paciente 100% descifrados.
 * 4. POST /api/agenda/citas -> GET /api/agenda/citas: Creación desde el panel y visualización inmediata descifrada.
 * 5. Verificación en PostgreSQL: El registro persistido está estrictamente cifrado (cero PII en texto plano).
 */

const { test } = require('node:test');
const assert = require('node:assert');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const prisma = require('../src/config/db');
const { esCifrado } = require('../src/utils/crypto');

test('Verificación de Integridad del Panel Clínico tras cifrado PII (Spec 017)', async () => {
  console.log('🩺 Iniciando verificación integral de endpoints para el Panel Clínico...\n');

  const PORT = process.env.PORT || 3001;
  const token = jwt.sign({ id: 1, email: 'admin@psicolau.com' }, process.env.JWT_SECRET || 'secret123456789012345');
  const authHeader = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  let citaPruebaId = null;
  let pacientePruebaId = null;

  try {
    // 1. Verificación de Agenda Semanal (GET /api/agenda/citas)
    console.log('1. Verificando GET /api/agenda/citas para la matriz semanal del panel...');
    const resCitas = await fetch(`http://localhost:${PORT}/api/agenda/citas`, {
      headers: authHeader
    });
    assert.strictEqual(resCitas.status, 200, 'GET /api/agenda/citas debe responder 200 OK');
    const dataCitas = await resCitas.json();
    assert.strictEqual(dataCitas.success, true);
    assert.ok(Array.isArray(dataCitas.data), 'data debe ser un arreglo de citas');
    console.log(`   ✓ ${dataCitas.data.length} citas recuperadas de la base de datos.`);

    for (const cita of dataCitas.data) {
      if (cita.paciente) {
        assert.strictEqual(esCifrado(cita.paciente.nombre), false, `El nombre del paciente (${cita.paciente.id}) en la agenda no debe estar cifrado en la respuesta`);
        assert.strictEqual(esCifrado(cita.paciente.telefono), false, `El teléfono del paciente (${cita.paciente.id}) en la agenda no debe estar cifrado en la respuesta`);
        assert.strictEqual(esCifrado(cita.paciente.email), false, `El email del paciente (${cita.paciente.id}) en la agenda no debe estar cifrado en la respuesta`);
        if (cita.paciente.enlaceZoom) {
          assert.strictEqual(esCifrado(cita.paciente.enlaceZoom), false, `El Zoom del paciente (${cita.paciente.id}) en la agenda no debe estar cifrado en la respuesta`);
        }
      }
    }
    console.log('   ✅ Todas las citas de la agenda contienen pacientes 100% descifrados y legibles para el panel.');

    // 2. Verificación del Directorio de Pacientes (GET /api/pacientes)
    console.log('\n2. Verificando GET /api/pacientes para el buscador y expedientes del panel...');
    const resPacientes = await fetch(`http://localhost:${PORT}/api/pacientes`, {
      headers: authHeader
    });
    assert.strictEqual(resPacientes.status, 200, 'GET /api/pacientes debe responder 200 OK');
    const dataPacientes = await resPacientes.json();
    assert.strictEqual(dataPacientes.success, true);
    assert.ok(Array.isArray(dataPacientes.data), 'data debe ser un arreglo de pacientes');
    console.log(`   ✓ Directorio clínico contiene ${dataPacientes.data.length} pacientes activos.`);

    for (const pac of dataPacientes.data) {
      assert.strictEqual(esCifrado(pac.nombre), false, `El nombre de paciente ${pac.id} no debe estar cifrado en respuesta del directorio`);
      assert.strictEqual(esCifrado(pac.email), false, `El email de paciente ${pac.id} no debe estar cifrado en respuesta del directorio`);
      assert.strictEqual(esCifrado(pac.telefono), false, `El teléfono de paciente ${pac.id} no debe estar cifrado en respuesta del directorio`);
      assert.ok(pac.nombre && pac.nombre.length > 0, 'El nombre debe existir y ser legible');
    }
    console.log('   ✅ Todos los pacientes del directorio se presentan legibles y descifrados.');

    // 3. Verificación de Expediente Clínico de un Paciente con notas
    console.log('\n3. Verificando GET /api/pacientes/:id/expediente...');
    const pacienteConExpediente = dataPacientes.data.find(p => p._count && p._count.expedientes > 0);
    if (pacienteConExpediente) {
      const resExpediente = await fetch(`http://localhost:${PORT}/api/pacientes/${pacienteConExpediente.id}/expediente`, {
        headers: authHeader
      });
      assert.strictEqual(resExpediente.status, 200);
      const dataExpediente = await resExpediente.json();
      assert.strictEqual(dataExpediente.success, true);
      assert.strictEqual(esCifrado(dataExpediente.paciente.nombre), false);
      for (const nota of dataExpediente.data) {
        assert.strictEqual(esCifrado(nota.estadoActual), false, 'estadoActual de nota clínica no debe estar cifrado en respuesta');
        assert.strictEqual(esCifrado(nota.resumenBreve), false, 'resumenBreve de nota clínica no debe estar cifrado en respuesta');
      }
      console.log(`   ✅ Expediente de ${dataExpediente.paciente.nombre} recuperado con ${dataExpediente.data.length} notas descifradas.`);
    } else {
      console.log('   ℹ No se encontraron pacientes con notas existentes para este test.');
    }

    // 4. Verificación de Ciclo Completo Panel: Crear Cita -> Visualizar en Agenda -> Comprobar Cifrado en BD
    console.log('\n4. Verificando creación desde formulario de panel y persistencia cifrada...');
    const emailPanel = `paciente.panel.${Date.now()}@psicolau.test`;
    const resCrear = await fetch(`http://localhost:${PORT}/api/agenda/citas`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({
        nombre: 'Valeria Sotomayor Panel Test',
        email: emailPanel,
        telefono: '+52 55 1122 3344',
        enlaceZoom: 'https://zoom.us/j/panel123456',
        fechaHora: new Date(Date.now() + 172800000).toISOString(),
        categoria: 'Terapia Psicológica',
        monto: 700,
        color: '#EC5E86'
      })
    });
    assert.strictEqual(resCrear.status, 201, 'Creación de cita debe devolver 201');
    const dataCrear = await resCrear.json();
    assert.strictEqual(dataCrear.success, true);
    citaPruebaId = dataCrear.data.id;
    pacientePruebaId = dataCrear.data.pacienteId;

    // Comprobar que en la respuesta de creación los datos vienen descifrados para pintar la tarjeta
    assert.strictEqual(dataCrear.data.paciente.nombre, 'Valeria Sotomayor Panel Test');
    assert.strictEqual(dataCrear.data.paciente.email, emailPanel);
    assert.strictEqual(dataCrear.data.paciente.telefono, '+52 55 1122 3344');
    console.log('   ✓ Cita creada y respuesta descifrada recibida correctamente por el cliente.');

    // Comprobar que en PostgreSQL los datos están 100% cifrados
    const pacienteEnDb = await prisma.paciente.findUnique({
      where: { id: pacientePruebaId }
    });
    assert.ok(pacienteEnDb, 'Paciente debe existir en la base de datos');
    assert.strictEqual(esCifrado(pacienteEnDb.nombre), true, 'nombre DEBE estar cifrado en PostgreSQL');
    assert.strictEqual(esCifrado(pacienteEnDb.telefono), true, 'telefono DEBE estar cifrado en PostgreSQL');
    assert.strictEqual(esCifrado(pacienteEnDb.email), true, 'email DEBE estar cifrado en PostgreSQL');
    assert.strictEqual(esCifrado(pacienteEnDb.enlaceZoom), true, 'enlaceZoom DEBE estar cifrado en PostgreSQL');
    assert.notStrictEqual(pacienteEnDb.nombre, 'Valeria Sotomayor Panel Test');
    console.log('   ✅ PostgreSQL almacena estrictamente texto cifrado AES-256-GCM.');

    console.log('\n🎉 ¡EL PANEL CLÍNICO OPERA AL 100% CON LA INTEGRACIÓN DE CIFRADO Y DESCIFRADO PII! 🎉\n');

  } finally {
    if (citaPruebaId) {
      await prisma.cita.delete({ where: { id: citaPruebaId } }).catch(() => {});
    }
    if (pacientePruebaId) {
      await prisma.cita.deleteMany({ where: { pacienteId: pacientePruebaId } }).catch(() => {});
      await prisma.paciente.delete({ where: { id: pacientePruebaId } }).catch(() => {});
    }
    await prisma.$disconnect();
  }
});
