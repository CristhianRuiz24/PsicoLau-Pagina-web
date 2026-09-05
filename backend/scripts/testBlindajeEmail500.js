/**
 * testBlindajeEmail500.js
 * 
 * Verifica que el endpoint de edición de citas:
 * 1. Responda 400 Bad Request (y NUNCA 500 Error interno) si se intenta usar un correo que ya pertenece a otro paciente.
 * 2. Permita editar y guardar citas con correo vacío ("") sin romper la unicidad en Prisma.
 */

require('dotenv').config();
const jwt = require('jsonwebtoken');
const assert = require('assert');
const prisma = require('../src/config/db');

async function runTests() {
  console.log('🧪 Iniciando pruebas de blindaje contra error 500 por colisión de correo...\n');

  const PORT = process.env.PORT || 3001;
  const token = jwt.sign({ id: 1, email: 'test@psicolau.com' }, process.env.JWT_SECRET);
  const authHeader = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // Buscar 2 pacientes diferentes en la base de datos
  const pacientes = await prisma.paciente.findMany({
    where: {
      NOT: [
        { email: { startsWith: 'sin-email-' } },
        { email: { startsWith: 'grupal-' } }
      ]
    },
    take: 2
  });

  if (pacientes.length < 2) {
    console.log('⚠️ Se requieren al menos 2 pacientes con correo real para la prueba. Creando temporales...');
    const p1 = await prisma.paciente.create({
      data: {
        nombre: 'Paciente Test A',
        email: `test-a-${Date.now()}@local.com`,
        telefono: '5511111111'
      }
    });
    const p2 = await prisma.paciente.create({
      data: {
        nombre: 'Paciente Test B',
        email: `test-b-${Date.now()}@local.com`,
        telefono: '5522222222'
      }
    });
    pacientes.push(p1, p2);
  }

  // Buscar o crear una cita para el paciente 1
  let cita = await prisma.cita.findFirst({
    where: { pacienteId: pacientes[0].id }
  });

  if (!cita) {
    cita = await prisma.cita.create({
      data: {
        pacienteId: pacientes[0].id,
        fechaHora: new Date(),
        categoria: 'Test'
      }
    });
  }

  // 1. Probar enviar el correo del Paciente 2 a la cita del Paciente 1
  console.log(`Intentando asignar a la cita (paciente "${pacientes[0].nombre}") el correo de "${pacientes[1].nombre}" (${pacientes[1].email})...`);
  
  const resDup = await fetch(`http://localhost:${PORT}/api/agenda/citas/${cita.id}`, {
    method: 'PUT',
    headers: authHeader,
    body: JSON.stringify({
      nombre: pacientes[0].nombre,
      email: pacientes[1].email, // Correo duplicado
      telefono: '5511111111',
      monto: 500,
      estado_cita: 'PENDIENTE'
    })
  });

  const dataDup = await resDup.json();
  console.log(`Respuesta HTTP: ${resDup.status}`);
  console.log(`Mensaje recibido: "${dataDup.message}"`);

  assert.strictEqual(resDup.status, 400, 'El servidor debe responder con código 400 (Bad Request), NUNCA 500');
  assert.strictEqual(dataDup.success, false);
  assert.ok(dataDup.message.toLowerCase().includes('ya está') || dataDup.message.toLowerCase().includes('registrado'), 'El mensaje debe explicar que el correo ya pertenece a otro paciente');
  console.log('✅ Test 1: Colisión de correo prevenida limpiamente con código 400 (sin error 500).');

  // 2. Probar guardar con correo vacío ("")
  console.log('\nIntentando guardar cita con correo vacío ("")...');
  const resEmpty = await fetch(`http://localhost:${PORT}/api/agenda/citas/${cita.id}`, {
    method: 'PUT',
    headers: authHeader,
    body: JSON.stringify({
      nombre: pacientes[0].nombre,
      email: '', // Correo vacío (opcional)
      telefono: '5511111111',
      monto: 500,
      estado_cita: 'PENDIENTE'
    })
  });

  const dataEmpty = await resEmpty.json();
  console.log(`Respuesta HTTP: ${resEmpty.status}`);
  assert.strictEqual(resEmpty.status, 200, 'Guardar con correo vacío debe ser completamente exitoso (200 OK)');
  assert.strictEqual(dataEmpty.success, true);
  console.log('✅ Test 2: Guardar cita con correo opcional vacío funciona de forma fluida.');

  await prisma.$disconnect();
  console.log('\n🎉 ¡TODAS LAS PRUEBAS DE BLINDAJE DE CORREO PASARON CON 100% DE ÉXITO!');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Error durante la prueba:', err);
  process.exit(1);
});
