const { test } = require('node:test');
const assert = require('node:assert');
require('dotenv').config();
const prisma = require('../src/config/db');
const { cifrar, descifrar } = require('../src/utils/crypto');

test('Integridad y cifrado AES-256-GCM del expediente clínico', async () => {
  console.log('=== INICIANDO PRUEBA DE INTEGRIDAD Y CIFRADO DEL EXPEDIENTE CLÍNICO ===\n');

  let paciente = null;
  let notaGuardada = null;

  try {
    // 1. Crear un paciente de prueba con email único
    paciente = await prisma.paciente.create({
      data: {
        nombre: 'Mariana Test Clínica',
        telefono: '+525512345678',
        email: `paciente.expediente.${Date.now()}@psicolau.com`
      }
    });
    console.log('✓ Paciente de prueba creado con ID:', paciente.id);

    // 2. Datos clínicos confidenciales de prueba (en claro para enviar)
    const datosSesion = {
      fechaSesion: new Date(),
      estadoActual: 'Paciente reporta mejoría en episodios de crisis de pánico. Menor rumiación nocturna.',
      insightPaciente: 'Comienza a identificar disparadores vinculados a sobrecarga sensorial en el trabajo.',
      eventoPrincipal: 'Discusión con su supervisor donde logró aplicar técnicas de asertividad aprendidas.',
      intervenciones: 'Reestructuración cognitiva, psicoeducación sobre límites sanos y respiración diafragmática.',
      formulacionClinica: 'Avance positivo en desensibilización sistemática; rasgos neurodivergentes funcionales.',
      tareasAsignadas: 'Llevar registro diario de detonantes de ansiedad y practicar 10 min de respiración.',
      pendientesProximaSesion: 'Revisar autorregistro y evaluar escalas de bienestar subjetivo.',
      resumenBreve: 'Sesión 4: Manejo asertivo en entorno laboral y disminución de crisis de ansiedad.'
    };

    // 3. Cifrar cada campo clínico con AES-256-GCM
    const camposCifrados = {
      estadoActual: cifrar(datosSesion.estadoActual),
      insightPaciente: cifrar(datosSesion.insightPaciente),
      eventoPrincipal: cifrar(datosSesion.eventoPrincipal),
      intervenciones: cifrar(datosSesion.intervenciones),
      formulacionClinica: cifrar(datosSesion.formulacionClinica),
      tareasAsignadas: cifrar(datosSesion.tareasAsignadas),
      pendientesProximaSesion: cifrar(datosSesion.pendientesProximaSesion),
      resumenBreve: cifrar(datosSesion.resumenBreve)
    };

    // 4. Guardar en Base de Datos PostgreSQL
    notaGuardada = await prisma.expediente.create({
      data: {
        pacienteId: paciente.id,
        fechaSesion: datosSesion.fechaSesion,
        ...camposCifrados
      }
    });

    // Verificación estricta de que NO está en texto plano
    const contieneTextoPlano = Object.values(camposCifrados).some(val => 
      val && (val.includes('crisis') || val.includes('Mariana') || val.includes('Sesión 4'))
    );
    assert.strictEqual(contieneTextoPlano, false, 'ALERTA: Se detectaron fragmentos legibles en los campos cifrados.');
    console.log('✅ CONFIRMACIÓN DE SEGURIDAD: Ningún dato clínico se almacena en texto plano en la base de datos.');

    // 5. Probar lectura y descifrado
    const notaLeida = await prisma.expediente.findUnique({
      where: { id: notaGuardada.id }
    });

    const notaDescifrada = {
      ...notaLeida,
      resumenBreve: descifrar(notaLeida.resumenBreve),
      estadoActual: descifrar(notaLeida.estadoActual),
      insightPaciente: descifrar(notaLeida.insightPaciente),
      eventoPrincipal: descifrar(notaLeida.eventoPrincipal),
      intervenciones: descifrar(notaLeida.intervenciones),
      formulacionClinica: descifrar(notaLeida.formulacionClinica),
      tareasAsignadas: descifrar(notaLeida.tareasAsignadas),
      pendientesProximaSesion: descifrar(notaLeida.pendientesProximaSesion)
    };

    assert.strictEqual(notaDescifrada.resumenBreve, datosSesion.resumenBreve, 'El resumenBreve descifrado debe coincidir');
    assert.strictEqual(notaDescifrada.estadoActual, datosSesion.estadoActual, 'El estadoActual descifrado debe coincidir');

    // 6. Probar búsqueda en memoria
    const terminoBusqueda = 'asertivo';
    const coincide = [
      notaDescifrada.resumenBreve,
      notaDescifrada.estadoActual,
      notaDescifrada.eventoPrincipal
    ].some(c => c && c.toLowerCase().includes(terminoBusqueda));
    assert.strictEqual(coincide, true, 'Debe encontrar coincidencia en datos descifrados');

    console.log('🎉 ¡TODAS LAS PRUEBAS DE SEGURIDAD Y CIFRADO PASARON EXITOSAMENTE!');
  } finally {
    if (notaGuardada) {
      await prisma.expediente.delete({ where: { id: notaGuardada.id } }).catch(() => {});
    }
    if (paciente) {
      await prisma.paciente.delete({ where: { id: paciente.id } }).catch(() => {});
    }
    await prisma.$disconnect();
  }
});
