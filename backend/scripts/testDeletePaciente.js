require('dotenv').config();
const prisma = require('../src/config/db');

async function testDeletePaciente() {
  console.log('=== TEST: ELIMINACIÓN DE PACIENTE Y EXPEDIENTE ===');

  // 1. Crear un paciente con 1 nota y 1 cita de prueba
  const p = await prisma.paciente.create({
    data: {
      nombre: 'Paciente Temporal Borrado',
      telefono: '5550000000',
      email: `temporal-${Date.now()}@test.com`,
      expedientes: {
        create: {
          fechaSesion: new Date(),
          resumenBreve: 'Nota que debe ser borrada en cascada'
        }
      },
      citas: {
        create: {
          fechaHora: new Date(),
          categoria: 'Cita temporal'
        }
      }
    }
  });

  console.log(`✓ Paciente de prueba creado ID: ${p.id}`);

  // 2. Ejecutar borrado seguro usando transacción
  await prisma.$transaction(async (tx) => {
    const citas = await tx.cita.findMany({ where: { pacienteId: p.id }, select: { id: true } });
    const citaIds = citas.map(c => c.id);
    if (citaIds.length > 0) {
      await tx.logNotificacion.deleteMany({ where: { citaId: { in: citaIds } } });
      await tx.cita.deleteMany({ where: { id: { in: citaIds } } });
    }
    await tx.expediente.deleteMany({ where: { pacienteId: p.id } });
    await tx.paciente.delete({ where: { id: p.id } });
  });

  const check = await prisma.paciente.findUnique({ where: { id: p.id } });
  console.log('¿Paciente eliminado?', check === null ? '✅ SÍ' : '❌ NO');
}

testDeletePaciente().finally(() => prisma.$disconnect());
