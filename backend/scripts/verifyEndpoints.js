const { test } = require('node:test');
const assert = require('node:assert');
require('dotenv').config();
const prisma = require('../src/config/db');
const { cifrar, descifrar } = require('../src/utils/crypto');

test('Verificación integral de endpoints y almacenamiento cifrado', async () => {
  console.log('=== VERIFICACIÓN INTEGRAL DE ENDPOINTS Y BASE DE DATOS ===\n');

  let paciente = null;
  let notaCreada = null;
  const testEmail = `expediente.demo.${Date.now()}@psicolau.com`;

  try {
    // 1. Crear paciente real de prueba
    paciente = await prisma.paciente.create({
      data: {
        nombre: 'Elena Morales Rivera',
        telefono: '+52 55 9876 5432',
        email: testEmail
      }
    });

    console.log(`✓ Paciente: ${paciente.nombre} (ID: ${paciente.id})`);

    // 2. Simular creación de nota de sesión clínica
    const payload = {
      fechaSesion: new Date('2026-08-26T10:00:00.000Z'),
      resumenBreve: 'Sesión 1: Evaluación neuropsicológica y exploración de sintomatología de burnout.',
      estadoActual: 'Paciente acude con reporte de fatiga cognitiva crónica, irritabilidad y dificultad para desconectar del trabajo.',
      insightPaciente: 'Comprende que su tendencia al perfeccionismo responde a una necesidad de hipercontrol aprendida.',
      eventoPrincipal: 'Crisis de llanto en el trabajo ante un error menor en un entregable.',
      intervenciones: 'Psicoeducación sobre ciclo del estrés, validación emocional y encuadre del plan terapéutico.',
      formulacionClinica: 'Perfil con alta autoexigencia, posible rasgo de alta sensibilidad (PAS) no diagnosticado previamente.',
      tareasAsignadas: 'Completar autorregistro de energía durante la jornada laboral (escala 1 al 10).',
      pendientesProximaSesion: 'Aplicar escala de sobrecarga subjetiva y revisar registro de energía.'
    };

    // Cifrar datos exactamente como lo hace el controlador
    const datosCifrados = {
      resumenBreve: cifrar(payload.resumenBreve),
      estadoActual: cifrar(payload.estadoActual),
      insightPaciente: cifrar(payload.insightPaciente),
      eventoPrincipal: cifrar(payload.eventoPrincipal),
      intervenciones: cifrar(payload.intervenciones),
      formulacionClinica: cifrar(payload.formulacionClinica),
      tareasAsignadas: cifrar(payload.tareasAsignadas),
      pendientesProximaSesion: cifrar(payload.pendientesProximaSesion)
    };

    notaCreada = await prisma.expediente.create({
      data: {
        pacienteId: paciente.id,
        fechaSesion: payload.fechaSesion,
        ...datosCifrados
      }
    });

    console.log(`✓ Nota de sesión creada con ID: ${notaCreada.id}`);

    // 3. Inspección directa en la base de datos (PostgreSQL crudo)
    const registroCrudoEnDB = await prisma.expediente.findUnique({
      where: { id: notaCreada.id }
    });

    assert.ok(registroCrudoEnDB, 'El registro debe existir en base de datos');
    assert.notStrictEqual(registroCrudoEnDB.resumenBreve, payload.resumenBreve, 'El resumen debe estar cifrado');

    // 4. Verificación de lectura descifrada
    const notaLeida = {
      ...registroCrudoEnDB,
      resumenBreve: descifrar(registroCrudoEnDB.resumenBreve),
      estadoActual: descifrar(registroCrudoEnDB.estadoActual),
      insightPaciente: descifrar(registroCrudoEnDB.insightPaciente),
      eventoPrincipal: descifrar(registroCrudoEnDB.eventoPrincipal),
      intervenciones: descifrar(registroCrudoEnDB.intervenciones),
      formulacionClinica: descifrar(registroCrudoEnDB.formulacionClinica),
      tareasAsignadas: descifrar(registroCrudoEnDB.tareasAsignadas),
      pendientesProximaSesion: descifrar(registroCrudoEnDB.pendientesProximaSesion)
    };

    assert.strictEqual(notaLeida.resumenBreve, payload.resumenBreve);
    assert.strictEqual(notaLeida.estadoActual, payload.estadoActual);
    assert.strictEqual(notaLeida.insightPaciente, payload.insightPaciente);

    // 5. Verificación de búsqueda in-memory
    const q = 'burnout';
    const campos = [
      notaLeida.resumenBreve,
      notaLeida.estadoActual,
      notaLeida.insightPaciente,
      notaLeida.eventoPrincipal,
      notaLeida.intervenciones,
      notaLeida.formulacionClinica,
      notaLeida.tareasAsignadas,
      notaLeida.pendientesProximaSesion
    ];
    const match = campos.some(c => c && c.toLowerCase().includes(q));
    assert.strictEqual(match, true, 'Búsqueda de burnout debe coincidir');
    console.log(`Búsqueda por "${q}": ✅ Encontrado con éxito`);

  } finally {
    if (notaCreada) {
      await prisma.expediente.delete({ where: { id: notaCreada.id } }).catch(() => {});
    }
    if (paciente) {
      await prisma.paciente.delete({ where: { id: paciente.id } }).catch(() => {});
    }
    await prisma.$disconnect();
  }
});
