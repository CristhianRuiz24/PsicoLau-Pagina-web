const { test } = require('node:test');
const assert = require('node:assert');
require('dotenv').config();
const prisma = require('../src/config/db');
const jwt = require('jsonwebtoken');

test('Búsqueda dinámica por sesión en expedientes clínicos', async () => {
  console.log('\n=== TEST DE BÚSQUEDA DINÁMICA POR SESIÓN EN EXPEDIENTES ===\n');

  let pacienteCreado = null;
  let paciente = await prisma.paciente.findFirst({
    include: { expedientes: true }
  });

  if (!paciente) {
    paciente = await prisma.paciente.create({
      data: {
        nombre: 'Paciente Temporal Busqueda',
        email: `busqueda.${Date.now()}@test.com`,
        telefono: '+52 55 1111 2222'
      }
    });
    pacienteCreado = paciente;
  }

  const jwtSecret = process.env.JWT_SECRET || 'secret_psicolau_jwt_default_dev';
  const token = jwt.sign({ id: 9999, email: 'admin@psicolau.com', rol: 'ADMIN' }, jwtSecret, { expiresIn: '1h' });

  let nota1 = null;
  let nota2 = null;

  try {
    nota1 = await prisma.expediente.create({
      data: {
        pacienteId: paciente.id,
        fechaSesion: new Date('2026-08-10T10:00:00Z'),
        resumenBreve: 'Trabajo con técnicas de respiración diafragmática y reestructuración cognitiva'
      }
    });

    nota2 = await prisma.expediente.create({
      data: {
        pacienteId: paciente.id,
        fechaSesion: new Date('2026-08-20T10:00:00Z'),
        resumenBreve: 'Seguimiento de tareas y manejo de crisis de pánico'
      }
    });

    const port = process.env.PORT || 3001;
    
    // Probar búsqueda: "sesión 2"
    const resSesionConTilde = await fetch(`http://localhost:${port}/api/pacientes/${paciente.id}/expediente/buscar?q=sesi%C3%B3n%202`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const dataConTilde = await resSesionConTilde.json();
    assert.ok(dataConTilde.success, 'La petición de búsqueda debe ser exitosa');
    assert.ok(dataConTilde.total >= 1, 'Debe encontrar al menos 1 nota para "sesión 2"');
    console.log(`• Búsqueda "sesión 2": Encontradas ${dataConTilde.total} notas (Éxito)`);

    // Probar búsqueda: "sesion 2"
    const resSesionSinTilde = await fetch(`http://localhost:${port}/api/pacientes/${paciente.id}/expediente/buscar?q=sesion%202`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const dataSinTilde = await resSesionSinTilde.json();
    assert.ok(dataSinTilde.success, 'La petición de búsqueda debe ser exitosa');
    assert.ok(dataSinTilde.total >= 1, 'Debe encontrar al menos 1 nota para "sesion 2"');
    console.log(`• Búsqueda "sesion 2": Encontradas ${dataSinTilde.total} notas (Éxito)`);

    // Probar búsqueda con acento en texto clínico: "respiracion" vs "respiración"
    const resTextoClinico = await fetch(`http://localhost:${port}/api/pacientes/${paciente.id}/expediente/buscar?q=respiracion`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const dataTexto = await resTextoClinico.json();
    assert.ok(dataTexto.success, 'La petición de búsqueda debe ser exitosa');
    assert.ok(dataTexto.total >= 1, 'Debe encontrar al menos 1 nota para "respiracion"');
    console.log(`• Búsqueda de palabra clínica "respiracion": Encontradas ${dataTexto.total} notas (Éxito)`);

    console.log('\n🎉 ¡BÚSQUEDA DINÁMICA POR NÚMERO DE SESIÓN Y SIN TILDES VALIDADA AL 100%! 🎉\n');
  } finally {
    const idsBorrar = [nota1?.id, nota2?.id].filter(Boolean);
    if (idsBorrar.length > 0) {
      await prisma.expediente.deleteMany({ where: { id: { in: idsBorrar } } }).catch(() => {});
    }
    if (pacienteCreado) {
      await prisma.paciente.delete({ where: { id: pacienteCreado.id } }).catch(() => {});
    }
    await prisma.$disconnect();
  }
});
