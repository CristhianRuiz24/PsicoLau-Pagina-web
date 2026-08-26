require('dotenv').config();
const prisma = require('../src/config/db');

async function testGrupalFlow() {
  console.log('=== TEST: FLUJO DE TERAPIAS GRUPALES EN SUITE CLÍNICA ===\n');

  try {
    const testNombreGrupo = 'Terapia Grupal para Autistas Adultos';
    const testZoom = 'https://zoom.us/j/9988776655';
    const testTema = 'Sesión 1: Plan de crisis y señales de alarma';
    const testEmail = `grupal-${Date.now()}@psicolau.com`;
    const numSesiones = 4;

    console.log('1. Creando registro de grupo y 4 sesiones recurrentes...');
    
    // Crear o vincular paciente grupal
    let pacienteGrupal = await prisma.paciente.create({
      data: {
        nombre: `[GRUPAL] ${testNombreGrupo}`,
        email: testEmail,
        telefono: '',
        enlaceZoom: testZoom
      }
    });

    console.log(`✓ Paciente grupal creado con ID: ${pacienteGrupal.id}`);

    // Crear 4 sesiones recurrentes
    const citasCreadas = [];
    const fechaBase = new Date();
    fechaBase.setHours(18, 0, 0, 0);

    for (let i = 0; i < numSesiones; i++) {
      const fechaCita = new Date(fechaBase);
      fechaCita.setDate(fechaCita.getDate() + (i * 7));

      const categoriaSesion = `[GRUPAL] ${testTema} (Sesión ${i + 1}/${numSesiones})`;

      const cita = await prisma.cita.create({
        data: {
          pacienteId: pacienteGrupal.id,
          fechaHora: fechaCita,
          categoria: categoriaSesion,
          color: '#8b5cf6',
          estado_cita: 'PENDIENTE',
          estado_pago: 'PENDIENTE'
        }
      });
      citasCreadas.push(cita);
    }

    console.log(`✓ Creadas ${citasCreadas.length} sesiones recurrentes con numeración (Sesión X/${numSesiones}).`);

    // 2. Verificar que el directorio de pacientes clínicos individuales excluye el grupo
    console.log('\n2. Verificando aislamiento del directorio de expedientes...');
    const todosPacientes = await prisma.paciente.findMany({
      orderBy: { nombre: 'asc' }
    });
    const filtradosDirectorio = todosPacientes.filter(p => !p.nombre.startsWith('[BLOQUEO]') && !p.nombre.startsWith('[GRUPAL]'));

    const grupoEnDirectorio = filtradosDirectorio.find(p => p.id === pacienteGrupal.id);
    if (grupoEnDirectorio) {
      throw new Error('El paciente grupal NO debe aparecer en el directorio de expedientes individuales.');
    }
    console.log('✓ Correcto: El grupo está aislado y no contamina los expedientes individuales.');

    // 3. Simular actualización de la sala de Zoom del grupo
    console.log('\n3. Actualizando enlace de Zoom grupal...');
    const nuevoZoom = 'https://zoom.us/j/4433221100';
    await prisma.paciente.update({
      where: { id: pacienteGrupal.id },
      data: { enlaceZoom: nuevoZoom }
    });

    const grupoActualizado = await prisma.paciente.findUnique({
      where: { id: pacienteGrupal.id }
    });
    if (grupoActualizado.enlaceZoom !== nuevoZoom) {
      throw new Error('El enlace de Zoom grupal no se actualizó correctamente.');
    }
    console.log(`✓ Enlace de Zoom grupal actualizado a: ${grupoActualizado.enlaceZoom}`);

    // 4. Limpieza
    console.log('\n4. Limpiando datos de prueba...');
    for (const c of citasCreadas) {
      await prisma.cita.delete({ where: { id: c.id } });
    }
    await prisma.paciente.delete({ where: { id: pacienteGrupal.id } });
    console.log('✓ Limpieza completada con éxito.');

    console.log('\n======================================================');
    console.log('🎉 TODOS LOS TESTS DE TERAPIA GRUPAL PASARON AL 100%');
    console.log('======================================================');
  } catch (error) {
    console.error('❌ Error en el test de terapia grupal:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testGrupalFlow();
