require('dotenv').config();
const prisma = require('../src/config/db');

async function inspect() {
  const pacientes = await prisma.paciente.findMany({
    include: {
      _count: { select: { citas: true, expedientes: true } },
      citas: true
    }
  });
  console.log('Pacientes en DB:', JSON.stringify(pacientes, null, 2));

  const citas = await prisma.cita.findMany({
    include: { paciente: true }
  });
  console.log('Total Citas en DB:', citas.length);
  citas.forEach(c => {
    console.log(`Cita ID: ${c.id}, Fecha: ${c.fechaHora}, Paciente: ${c.paciente ? c.paciente.nombre : 'None'} (ID: ${c.pacienteId})`);
  });
}

inspect().finally(() => prisma.$disconnect());
