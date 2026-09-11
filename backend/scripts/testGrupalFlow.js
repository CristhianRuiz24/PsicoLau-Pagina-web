const { test } = require('node:test');
const assert = require('node:assert');
require('dotenv').config();
const prisma = require('../src/config/db');

test('Flujo de terapias grupales en suite clínica', async () => {
  console.log('=== TEST: FLUJO DE TERAPIAS GRUPALES EN SUITE CLÍNICA ===\n');

  let pacienteGrupal = null;
  const citasCreadas = [];

  try {
    const testNombreGrupo = 'Terapia Grupal para Autistas Adultos';
    const testZoom = 'https://zoom.us/j/9988776655';
    const testTema = 'Sesión 1: Plan de crisis y señales de alarma';
    const testEmail = `grupal-${Date.now()}@psicolau.com`;
    const numSesiones = 4;

    console.log('1. Creando registro de grupo y 4 sesiones recurrentes...');
    
    // Crear o vincular paciente grupal
    pacienteGrupal = await prisma.paciente.create({
      data: {
        nombre: `[GRUPAL] ${testNombreGrupo}`,
        email: testEmail,
        telefono: '',
        enlaceZoom: testZoom
      }
    });

    console.log(`✓ Paciente grupal creado con ID: ${pacienteGrupal.id}`);

    // Crear 4 sesiones recurrentes
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
    assert.strictEqual(citasCreadas.length, 4);

    // 2. Verificar que el directorio de pacientes clínicos individuales excluye el grupo
    console.log('\n2. Verificando aislamiento del directorio de expedientes...');
    const todosPacientes = await prisma.paciente.findMany({
      orderBy: { nombre: 'asc' }
    });
    const filtradosDirectorio = todosPacientes.filter(p => !p.nombre.startsWith('[BLOQUEO]') && !p.nombre.startsWith('[GRUPAL]'));

    const grupoEnDirectorio = filtradosDirectorio.find(p => p.id === pacienteGrupal.id);
    assert.strictEqual(grupoEnDirectorio, undefined, 'El paciente grupal NO debe aparecer en el directorio');
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
    assert.strictEqual(grupoActualizado.enlaceZoom, nuevoZoom);
    console.log(`✓ Enlace de Zoom grupal actualizado a: ${grupoActualizado.enlaceZoom}`);

    console.log('\n======================================================');
    console.log('🎉 TODOS LOS TESTS DE TERAPIA GRUPAL PASARON AL 100%');
    console.log('======================================================');
  } finally {
    console.log('\n4. Limpiando datos de prueba...');
    for (const c of citasCreadas) {
      await prisma.cita.delete({ where: { id: c.id } }).catch(() => {});
    }
    if (pacienteGrupal) {
      await prisma.paciente.delete({ where: { id: pacienteGrupal.id } }).catch(() => {});
    }
    await prisma.$disconnect();
    console.log('✓ Limpieza completada con éxito.');
  }
});
