const { test } = require('node:test');
const assert = require('node:assert');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const prisma = require('../src/config/db');

test('Eliminación de paciente vía HTTP DELETE /api/pacientes/:id', async () => {
  const token = jwt.sign({ id: 1, email: 'admin@psicolau.com' }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
  const PORT = process.env.PORT || 3001;

  // 1. Crear un paciente de prueba para ser eliminado
  const paciente = await prisma.paciente.create({
    data: {
      nombre: 'Paciente HTTP Delete Test',
      email: `httpdelete.${Date.now()}@test.com`,
      telefono: '5500001111'
    }
  });

  try {
    const res = await fetch(`http://localhost:${PORT}/api/pacientes/${paciente.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200, 'DELETE debe responder 200');
    assert.strictEqual(data.success, true, 'success debe ser true');

    const check = await prisma.paciente.findUnique({ where: { id: paciente.id } });
    assert.strictEqual(check, null, 'El paciente debe haber sido eliminado de la base de datos');
  } finally {
    await prisma.paciente.deleteMany({ where: { id: paciente.id } }).catch(() => {});
    await prisma.$disconnect();
  }
});
