require('dotenv').config();
const prisma = require('../src/config/db');

async function cleanAndFix() {
  console.log('=== LIMPIANDO PACIENTES HUÉRFANOS Y DUPLICADOS ===');

  // 1. Eliminar notas de prueba de Elena Morales Rivera si existen
  await prisma.expediente.deleteMany({
    where: {
      paciente: { email: 'expediente.demo@psicolau.com' }
    }
  });

  // 2. Eliminar pacientes huérfanos que tengan 0 citas y 0 expedientes
  const pacientesHuerfanos = await prisma.paciente.findMany({
    where: {
      citas: { none: {} },
      expedientes: { none: {} }
    }
  });

  console.log(`Encontrados ${pacientesHuerfanos.length} pacientes huérfanos:`, pacientesHuerfanos.map(p => `${p.nombre} (ID: ${p.id})`));

  for (const h of pacientesHuerfanos) {
    await prisma.paciente.delete({ where: { id: h.id } });
    console.log(`✓ Eliminado paciente huérfano: ${h.nombre} (ID: ${h.id})`);
  }

  // 3. Verificar estado final
  const pacientesFinales = await prisma.paciente.findMany({
    include: {
      _count: { select: { citas: true, expedientes: true } }
    }
  });

  console.log('\nPacientes activos en Base de Datos:', JSON.stringify(pacientesFinales, null, 2));
}

cleanAndFix().finally(() => prisma.$disconnect());
