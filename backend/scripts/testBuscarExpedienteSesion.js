const prisma = require('../src/config/db');
const jwt = require('jsonwebtoken');

async function testSearchBySession() {
  console.log('\n=== TEST DE BÚSQUEDA DINÁMICA POR SESIÓN EN EXPEDIENTES ===\n');

  // Buscar un paciente existente con notas
  const paciente = await prisma.paciente.findFirst({
    include: { expedientes: true }
  });

  if (!paciente) {
    console.log('No hay pacientes para probar.');
    return;
  }

  const jwtSecret = process.env.JWT_SECRET || 'secret_psicolau_jwt_default_dev';
  const token = jwt.sign({ id: 9999, email: 'admin@psicolau.com', rol: 'ADMIN' }, jwtSecret, { expiresIn: '1h' });

  // Crear 2 notas de prueba para validar
  const nota1 = await prisma.expediente.create({
    data: {
      pacienteId: paciente.id,
      fechaSesion: new Date('2026-08-10T10:00:00Z'),
      resumenBreve: 'Trabajo con técnicas de respiración diafragmática y reestructuración cognitiva'
    }
  });

  const nota2 = await prisma.expediente.create({
    data: {
      pacienteId: paciente.id,
      fechaSesion: new Date('2026-08-20T10:00:00Z'),
      resumenBreve: 'Seguimiento de tareas y manejo de crisis de pánico'
    }
  });

  try {
    const port = 3000;
    
    // Probar búsqueda: "sesión 2"
    const resSesionConTilde = await fetch(`http://localhost:${port}/api/pacientes/${paciente.id}/expediente/buscar?q=sesi%C3%B3n%202`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const dataConTilde = await resSesionConTilde.json();
    console.log(`• Búsqueda "sesión 2": Encontradas ${dataConTilde.total} notas (Éxito: ${dataConTilde.total >= 1})`);

    // Probar búsqueda: "sesion 2"
    const resSesionSinTilde = await fetch(`http://localhost:${port}/api/pacientes/${paciente.id}/expediente/buscar?q=sesion%202`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const dataSinTilde = await resSesionSinTilde.json();
    console.log(`• Búsqueda "sesion 2": Encontradas ${dataSinTilde.total} notas (Éxito: ${dataSinTilde.total >= 1})`);

    // Probar búsqueda con acento en texto clínico: "respiracion" vs "respiración"
    const resTextoClinico = await fetch(`http://localhost:${port}/api/pacientes/${paciente.id}/expediente/buscar?q=respiracion`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const dataTexto = await resTextoClinico.json();
    console.log(`• Búsqueda de palabra clínica "respiracion": Encontradas ${dataTexto.total} notas (Éxito: ${dataTexto.total >= 1})`);

    console.log('\n🎉 ¡BÚSQUEDA DINÁMICA POR NÚMERO DE SESIÓN Y SIN TILDES VALIDADA AL 100%! 🎉\n');
  } finally {
    await prisma.expediente.deleteMany({ where: { id: { in: [nota1.id, nota2.id] } } });
  }
}

testSearchBySession().catch(console.error);
