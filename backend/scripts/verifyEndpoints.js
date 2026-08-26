require('dotenv').config();
const prisma = require('../src/config/db');
const jwt = require('jsonwebtoken');
const { cifrar, descifrar } = require('../src/utils/crypto');

async function testFullSuite() {
  console.log('=== VERIFICACIÓN INTEGRAL DE ENDPOINTS Y BASE DE DATOS ===\n');

  try {
    // 1. Crear o buscar paciente real de prueba
    let paciente = await prisma.paciente.findFirst({
      where: { email: 'expediente.demo@psicolau.com' }
    });

    if (!paciente) {
      paciente = await prisma.paciente.create({
        data: {
          nombre: 'Elena Morales Rivera',
          telefono: '+52 55 9876 5432',
          email: 'expediente.demo@psicolau.com'
        }
      });
    }

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

    const notaCreada = await prisma.expediente.create({
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

    console.log('\n======================================================');
    console.log('REGISTRO GUARDADO DIRECTAMENTE EN LA TABLA "Expediente"');
    console.log('======================================================');
    console.log(JSON.stringify(registroCrudoEnDB, null, 2));
    console.log('======================================================\n');

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

    console.log('--- LECTURA DESCIFRADA PARA EL FRONTEND ---');
    console.log('Fecha:', notaLeida.fechaSesion);
    console.log('Resumen:', notaLeida.resumenBreve);
    console.log('Estado Actual:', notaLeida.estadoActual);
    console.log('Insight:', notaLeida.insightPaciente);
    console.log('Intervenciones:', notaLeida.intervenciones);

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
    console.log(`\nBúsqueda por "${q}": ${match ? '✅ Encontrado con éxito' : '❌ No encontrado'}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFullSuite();
