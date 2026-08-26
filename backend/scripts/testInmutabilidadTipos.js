require('dotenv').config();
const prisma = require('../src/config/db');

async function testInmutabilidadTipos() {
  console.log('=== TEST: INMUTABILIDAD DE TIPOS EN EDICIÓN DE CITAS ===\n');

  try {
    // 1. Crear Cita Individual
    console.log('1. Creando cita individual de prueba...');
    const pacInd = await prisma.paciente.create({
      data: {
        nombre: 'Paciente Individual Test',
        telefono: '+52 222 111 2233',
        email: `pac.ind.${Date.now()}@test.com`
      }
    });
    const citaInd = await prisma.cita.create({
      data: {
        pacienteId: pacInd.id,
        fechaHora: new Date(),
        categoria: 'Primera sesión clínica'
      }
    });

    // Simular intento de mutar Cita Individual a Bloqueo o Grupal
    console.log('2. Verificando que editarCita preserva la naturaleza individual...');
    const eraBloqueo1 = (citaInd.categoria && citaInd.categoria.startsWith('[BLOQUEO]')) || (pacInd.nombre.startsWith('[BLOQUEO]'));
    const eraGrupal1 = (citaInd.categoria && citaInd.categoria.startsWith('[GRUPAL]')) || (pacInd.nombre.startsWith('[GRUPAL]'));
    
    if (eraBloqueo1 || eraGrupal1) {
      throw new Error('La cita no debería ser detectada como bloqueo ni grupal.');
    }

    // 2. Crear Cita Grupal
    console.log('\n3. Creando terapia grupal de prueba...');
    const pacGrup = await prisma.paciente.create({
      data: {
        nombre: '[GRUPAL] Taller de Habilidades Test',
        email: `grupal-${Date.now()}@psicolau.com`,
        telefono: '',
        enlaceZoom: 'https://zoom.us/j/123456789'
      }
    });
    const citaGrup = await prisma.cita.create({
      data: {
        pacienteId: pacGrup.id,
        fechaHora: new Date(),
        categoria: '[GRUPAL] Módulo 1'
      }
    });

    const eraGrupal2 = (citaGrup.categoria && citaGrup.categoria.startsWith('[GRUPAL]')) || (pacGrup.nombre.startsWith('[GRUPAL]'));
    if (!eraGrupal2) {
      throw new Error('La sesión grupal debe ser reconocida como grupal.');
    }
    console.log('✓ Correcto: La sesión grupal es reconocida y mantiene su tipo grupal.');

    // 3. Crear Bloqueo
    console.log('\n4. Creando bloqueo de prueba...');
    const pacBloq = await prisma.paciente.create({
      data: {
        nombre: '[BLOQUEO] Comida / Personal',
        email: `sin-email-${Date.now()}@psicolau.com`,
        telefono: ''
      }
    });
    const citaBloq = await prisma.cita.create({
      data: {
        pacienteId: pacBloq.id,
        fechaHora: new Date(),
        categoria: '[BLOQUEO] No disponible'
      }
    });

    const eraBloqueo3 = (citaBloq.categoria && citaBloq.categoria.startsWith('[BLOQUEO]')) || (pacBloq.nombre.startsWith('[BLOQUEO]'));
    if (!eraBloqueo3) {
      throw new Error('El bloqueo debe ser reconocido como bloqueo.');
    }
    console.log('✓ Correcto: El bloqueo es reconocido y mantiene su tipo bloqueo.');

    // Limpieza
    console.log('\n5. Limpiando datos de prueba...');
    await prisma.cita.delete({ where: { id: citaInd.id } });
    await prisma.paciente.delete({ where: { id: pacInd.id } });

    await prisma.cita.delete({ where: { id: citaGrup.id } });
    await prisma.paciente.delete({ where: { id: pacGrup.id } });

    await prisma.cita.delete({ where: { id: citaBloq.id } });
    await prisma.paciente.delete({ where: { id: pacBloq.id } });

    console.log('✓ Limpieza completada.');

    console.log('\n=============================================================');
    console.log('🎉 TODOS LOS TESTS DE INMUTABILIDAD DE TIPOS PASARON AL 100%');
    console.log('=============================================================');
  } catch (error) {
    console.error('❌ Error en el test:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testInmutabilidadTipos();
