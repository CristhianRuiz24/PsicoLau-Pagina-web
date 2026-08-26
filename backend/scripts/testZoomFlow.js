require('dotenv').config();
const prisma = require('../src/config/db');

async function testZoomAndAutocomplete() {
  console.log('=== TEST: FLUJO DE ZOOM Y AUTOCOMPLETADO DE PACIENTES ===\n');

  try {
    const testEmail = `zoom.test.${Date.now()}@test.com`;
    const testNombre = 'Paciente Test Zoom';
    const testZoom1 = 'https://zoom.us/j/111222333';
    const testZoom2 = 'https://zoom.us/j/999888777';

    // 1. Crear Cita 1 con Zoom
    console.log('1. Creando cita con enlace de Zoom 1...');
    let paciente = await prisma.paciente.create({
      data: {
        nombre: testNombre,
        telefono: '+52 222 123 4567',
        email: testEmail,
        enlaceZoom: testZoom1
      }
    });

    const cita1 = await prisma.cita.create({
      data: {
        pacienteId: paciente.id,
        fechaHora: new Date('2026-09-01T10:00:00Z'),
        categoria: 'Primera sesión Zoom'
      },
      include: { paciente: true }
    });

    console.log(`✓ Paciente creado con ID ${paciente.id} y Zoom: ${cita1.paciente.enlaceZoom}`);
    if (cita1.paciente.enlaceZoom !== testZoom1) {
      throw new Error('El enlace de Zoom no coincide con el esperado');
    }

    // 2. Simular edición actualizando el link de Zoom
    console.log('\n2. Actualizando enlace de Zoom a Zoom 2...');
    await prisma.paciente.update({
      where: { id: paciente.id },
      data: { enlaceZoom: testZoom2 }
    });

    const pacienteActualizado = await prisma.paciente.findUnique({
      where: { id: paciente.id }
    });

    console.log(`✓ Enlace de Zoom actualizado a: ${pacienteActualizado.enlaceZoom}`);
    if (pacienteActualizado.enlaceZoom !== testZoom2) {
      throw new Error('El enlace actualizado no coincide con Zoom 2');
    }

    // 3. Limpiar datos de prueba
    await prisma.cita.delete({ where: { id: cita1.id } });
    await prisma.paciente.delete({ where: { id: paciente.id } });
    console.log('\n✓ Limpieza completada con éxito.');

    console.log('\n=========================================');
    console.log('🎉 TODOS LOS TESTS DE ZOOM PASARON CON ÉXITO');
    console.log('=========================================');
  } catch (error) {
    console.error('❌ Error en el test de Zoom:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testZoomAndAutocomplete();
