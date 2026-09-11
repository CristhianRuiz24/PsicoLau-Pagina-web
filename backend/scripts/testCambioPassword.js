const { test } = require('node:test');
const assert = require('node:assert');
require('dotenv').config();
const express = require('express');
const http = require('http');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../src/config/db');
const authRoutes = require('../src/routes/auth');

test('Cambio seguro de contraseña y autenticación (Spec 005)', async () => {
  console.log('🧪 Iniciando suite de pruebas automatizadas: Spec 005 (Cambio de Contraseña)...\n');

  // Iniciar servidor express temporal en puerto dinámico
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/auth`;
  console.log(`✓ Servidor temporal de pruebas activo en puerto ${port}`);

  let testUser = null;
  const emailTest = `test.cambiopass.${Date.now()}@psicolau.com`;
  const passwordInicial = 'PasswordInicial123';
  const passwordNueva = 'MiNuevaClaveSegura2026';

  try {
    // 1. Crear usuario de prueba aislado en DB
    const initialHash = await bcrypt.hash(passwordInicial, 10);
    testUser = await prisma.usuario.create({
      data: {
        email: emailTest,
        password_hash: initialHash
      }
    });
    console.log(`✓ Usuario de prueba creado (ID: ${testUser.id}, Email: ${emailTest})`);

    // 2. Generar token JWT inicial
    let token = jwt.sign(
      { id: testUser.id, email: testUser.email },
      process.env.JWT_SECRET || 'secret123456789012345',
      { expiresIn: '8h' }
    );

    // TEST 1 (RF-6): Contraseña actual incorrecta
    const res1 = await fetch(`${baseUrl}/cambiar-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        passwordActual: 'ClaveTotalmenteErronea',
        passwordNueva: passwordNueva,
        confirmarPassword: passwordNueva
      })
    });
    const data1 = await res1.json();
    assert.strictEqual(res1.status, 400);
    assert.ok(data1.message.includes('incorrecta'));
    console.log('✅ Test 1 (RF-6): Contraseña actual errónea rechazada correctamente con 400 Bad Request.');

    // TEST 2 (RF-3): Nueva contraseña menor a 8 caracteres
    const res2 = await fetch(`${baseUrl}/cambiar-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        passwordActual: passwordInicial,
        passwordNueva: '1234567',
        confirmarPassword: '1234567'
      })
    });
    const data2 = await res2.json();
    assert.strictEqual(res2.status, 400);
    assert.ok(data2.message.includes('al menos 8 caracteres'));
    console.log('✅ Test 2 (RF-3): Contraseña menor a 8 caracteres prevenida con 400 Bad Request.');

    // TEST 3 (RF-4): Confirmación no coincide
    const res3 = await fetch(`${baseUrl}/cambiar-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        passwordActual: passwordInicial,
        passwordNueva: passwordNueva,
        confirmarPassword: 'OtraPasswordDistinta2026'
      })
    });
    const data3 = await res3.json();
    assert.strictEqual(res3.status, 400);
    assert.ok(data3.message.includes('no coinciden'));
    console.log('✅ Test 3 (RF-4): Confirmación no coincidente rechazada con 400 Bad Request.');

    // TEST 4 (RF-5): Nueva contraseña idéntica a la anterior
    const res4 = await fetch(`${baseUrl}/cambiar-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        passwordActual: passwordInicial,
        passwordNueva: passwordInicial,
        confirmarPassword: passwordInicial
      })
    });
    const data4 = await res4.json();
    assert.strictEqual(res4.status, 400);
    assert.ok(data4.message.includes('no puede ser igual'));
    console.log('✅ Test 4 (RF-5): Nueva contraseña idéntica a la anterior rechazada con 400 Bad Request.');

    // TEST 5 (RF-7): Cambio exitoso de contraseña
    const res5 = await fetch(`${baseUrl}/cambiar-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        passwordActual: passwordInicial,
        passwordNueva: passwordNueva,
        confirmarPassword: passwordNueva
      })
    });
    const data5 = await res5.json();
    assert.strictEqual(res5.status, 200);
    assert.strictEqual(data5.success, true);
    assert.ok(data5.token);
    token = data5.token;
    console.log('✅ Test 5 (RF-7): Cambio exitoso 200 OK con mensaje y nuevo token JWT generado.');

    // TEST 6: Login con la nueva contraseña
    const resLoginNuevo = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: emailTest,
        password: passwordNueva
      })
    });
    const dataLoginNuevo = await resLoginNuevo.json();
    assert.strictEqual(resLoginNuevo.status, 200);
    assert.strictEqual(dataLoginNuevo.success, true);
    console.log('✅ Test 6: Inicio de sesión con la nueva contraseña verificado exitosamente (200 OK).');

    // TEST 7: Login con la contraseña vieja debe fallar
    const resLoginViejo = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: emailTest,
        password: passwordInicial
      })
    });
    assert.strictEqual(resLoginViejo.status, 401);
    console.log('✅ Test 7: Inicio de sesión con la contraseña anterior rechazado con 401 Unauthorized.');

    console.log('\n🎉 ¡TODAS LAS PRUEBAS DE LA SPEC 005 PASARON CON 100% DE ÉXITO!');
  } finally {
    if (testUser && testUser.id) {
      await prisma.usuario.delete({ where: { id: testUser.id } }).catch(() => {});
      console.log('✓ Usuario de prueba eliminado de la base de datos.');
    }
    await prisma.$disconnect();
    server.close();
  }
});
