const { test } = require('node:test');
const assert = require('node:assert');
require('dotenv').config();
const prisma = require('../src/config/db');

test('Lógica de autocompletado de terapias grupales', async () => {
  console.log('=== TEST: LÓGICA DE AUTOCOMPLETADO DE TERAPIAS GRUPALES ===\n');

  let pac = null;
  let cita = null;

  try {
    const testNombre = 'Terapia Grupal para Autistas Adultos';
    const testZoom = 'https://zoom.us/j/5566778899';
    const testColor = '#8b5cf6';

    // 1. Simular registro previo en BD
    console.log('1. Creando registro previo de grupo...');
    pac = await prisma.paciente.create({
      data: {
        nombre: `[GRUPAL] ${testNombre}`,
        email: `grupal-${Date.now()}@psicolau.com`,
        telefono: '',
        enlaceZoom: testZoom
      }
    });

    cita = await prisma.cita.create({
      data: {
        pacienteId: pac.id,
        fechaHora: new Date(),
        categoria: `[GRUPAL] Módulo de prueba`,
        color: testColor
      },
      include: { paciente: true }
    });

    console.log(`✓ Cita grupal previa creada con ID ${cita.id}`);

    // 2. Simular búsqueda de autocompletado en memoria
    console.log('\n2. Simulando búsqueda de autocompletado al escribir...');
    const inputUsuario = 'Terapia Grupal para Autistas Adultos';
    const nombreLimpio = inputUsuario.trim().toLowerCase().replace(/^\[(bloqueo|grupal)\]\s*/i, '');

    const citasCache = [cita];

    const citaGrupalPrevia = citasCache.find(c => {
      if (!c.paciente || !c.paciente.nombre) return false;
      const esGrup = (c.categoria && c.categoria.startsWith('[GRUPAL]')) || (c.paciente.nombre.startsWith('[GRUPAL]'));
      if (!esGrup) return false;
      const nom = c.paciente.nombre.toLowerCase().replace(/^\[(bloqueo|grupal)\]\s*/i, '').trim();
      return nom === nombreLimpio || (nombreLimpio.length >= 4 && nom.includes(nombreLimpio));
    });

    assert.ok(citaGrupalPrevia, 'No se detectó la cita grupal previa');
    console.log(`✓ Grupo detectado exitosamente: "${citaGrupalPrevia.paciente.nombre}"`);
    console.log(`✓ Enlace de Zoom autocompletado: "${citaGrupalPrevia.paciente.enlaceZoom}"`);
    console.log(`✓ Color autocompletado: "${citaGrupalPrevia.color}"`);

    assert.strictEqual(citaGrupalPrevia.paciente.enlaceZoom, testZoom, 'El enlace de Zoom debe coincidir');

    console.log('\n============================================================');
    console.log('🎉 TODOS LOS TESTS DE AUTOCOMPLETADO GRUPAL PASARON AL 100%');
    console.log('============================================================');
  } finally {
    console.log('\n3. Limpiando datos...');
    if (cita) await prisma.cita.delete({ where: { id: cita.id } }).catch(() => {});
    if (pac) await prisma.paciente.delete({ where: { id: pac.id } }).catch(() => {});
    await prisma.$disconnect();
    console.log('✓ Limpieza completada.');
  }
});
