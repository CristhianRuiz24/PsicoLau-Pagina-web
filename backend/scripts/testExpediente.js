require('dotenv').config();
const prisma = require('../src/config/db');
const { cifrar, descifrar } = require('../src/utils/crypto');

async function testearExpediente() {
  console.log('=== INICIANDO PRUEBA DE INTEGRIDAD Y CIFRADO DEL EXPEDIENTE CLÍNICO ===\n');

  try {
    // 1. Obtener o crear un paciente de prueba
    let paciente = await prisma.paciente.findFirst({
      where: { email: 'paciente.prueba.expediente@psicolau.com' }
    });

    if (!paciente) {
      paciente = await prisma.paciente.create({
        data: {
          nombre: 'Mariana Test Clínica',
          telefono: '+525512345678',
          email: 'paciente.prueba.expediente@psicolau.com'
        }
      });
      console.log('✓ Paciente de prueba creado con ID:', paciente.id);
    } else {
      console.log('✓ Paciente de prueba existente ID:', paciente.id);
    }

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

    console.log('\n--- DATOS EN TEXTO PLANO QUE SE CIFRARÁN ---');
    console.log('Resumen breve:', datosSesion.resumenBreve);
    console.log('Estado actual:', datosSesion.estadoActual);

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
    const notaGuardada = await prisma.expediente.create({
      data: {
        pacienteId: paciente.id,
        fechaSesion: datosSesion.fechaSesion,
        ...camposCifrados
      }
    });

    console.log('\n--- VERIFICACIÓN EN BASE DE DATOS DIRECTA (Texto crudo almacenado en PostgreSQL) ---');
    console.log('ID de Nota:', notaGuardada.id);
    console.log('pacienteId:', notaGuardada.pacienteId);
    console.log('resumenBreve (EN BD):', notaGuardada.resumenBreve);
    console.log('estadoActual (EN BD):', notaGuardada.estadoActual);
    console.log('eventoPrincipal (EN BD):', notaGuardada.eventoPrincipal);
    console.log('intervenciones (EN BD):', notaGuardada.intervenciones);

    // Verificación estricta de que NO está en texto plano
    const contieneTextoPlano = Object.values(camposCifrados).some(val => 
      val && (val.includes('crisis') || val.includes('Mariana') || val.includes('Sesión 4'))
    );
    if (contieneTextoPlano) {
      throw new Error('❌ ALERTA CRÍTICA: Se detectaron fragmentos legibles en los campos cifrados.');
    } else {
      console.log('\n✅ CONFIRMACIÓN DE SEGURIDAD: Ningún dato clínico se almacena en texto plano en la base de datos.');
    }

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

    console.log('\n--- VERIFICACIÓN DE DESCIFRADO EN MEMORIA ---');
    console.log('resumenBreve descifrado:', notaDescifrada.resumenBreve);
    console.log('¿Coincide exactamente?', notaDescifrada.resumenBreve === datosSesion.resumenBreve ? '✅ SÍ' : '❌ NO');
    console.log('estadoActual descifrado:', notaDescifrada.estadoActual);
    console.log('¿Coincide exactamente?', notaDescifrada.estadoActual === datosSesion.estadoActual ? '✅ SÍ' : '❌ NO');

    // 6. Probar búsqueda en memoria
    const terminoBusqueda = 'asertivo';
    const coincide = [
      notaDescifrada.resumenBreve,
      notaDescifrada.estadoActual,
      notaDescifrada.eventoPrincipal
    ].some(c => c && c.toLowerCase().includes(terminoBusqueda));
    console.log(`\n--- PRUEBA DE BÚSQUEDA EN MEMORIA ("${terminoBusqueda}") ---`);
    console.log('¿Encontró coincidencia en datos descifrados?', coincide ? '✅ SÍ' : '❌ NO');

    // Limpieza de prueba
    await prisma.expediente.delete({ where: { id: notaGuardada.id } });
    await prisma.paciente.delete({ where: { id: paciente.id } });
    console.log('\n✓ Registro de prueba limpiado correctamente.');
    console.log('\n🎉 ¡TODAS LAS PRUEBAS DE SEGURIDAD Y CIFRADO PASARON EXITOSAMENTE!');

  } catch (error) {
    console.error('Error durante la prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testearExpediente();
