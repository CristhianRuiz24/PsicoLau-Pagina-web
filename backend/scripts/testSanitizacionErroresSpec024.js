/**
 * testSanitizacionErroresSpec024.js
 * 
 * Suite integral de verificación automatizada para la Spec 024:
 * "Blindaje de Errores de Servidor, Sanitización de Respuestas y Resiliencia en UI".
 * 
 * Requisitos Verificados (Notación EARS):
 * - RF-1: Sanitización estricta de respuestas 500 y 503 sin fuga de `stack`, `sql`, `schema`, `tenant` ni hostnames.
 * - RF-2: Mapeo de fallos de conector / caídas de BD (PrismaClientInitializationError, ENOTFOUND) a HTTP 503 con mensaje clínico amigable.
 * - RF-3: Captura de errores inesperados no asociados a BD a HTTP 500 con mensaje genérico seguro.
 * - RF-4: Preservación de respuestas funcionales legítimas (Zod 400, Prisma P2002 400, Auth 401).
 * - RF-5: Endpoints de liveness (GET /api/health -> 200) y DB keep-alive (GET /api/health/db -> 200 o 503 sanitizado).
 * 
 * Puerto efímero: La suite levanta el servidor Express en puerto 0 asignado dinámicamente por el SO,
 * garantizando aislamiento absoluto sin colisiones ni puertos colgados.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Garantizar entorno de pruebas y llaves criptográficas mínimas para el arranque seguro
process.env.NODE_ENV = 'test';
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  process.env.JWT_SECRET = 'test_secret_key_psicolau_long_enough_12345';
}
if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY.length !== 64) {
  process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
}

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');

const app = require('../src/index');
const prisma = require('../src/config/db');

describe('Suite Integral Spec 024 — Sanitización de Errores y Salud de Base de Datos', () => {
  let server = null;
  let baseUrl = '';

  before(async () => {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  // --------------------------------------------------------------------------
  // RF-1 & RF-2: Fallos de Conector / Base de Datos
  // --------------------------------------------------------------------------
  test('RF-1 & RF-2: Fallo de conector / Prisma (ENOTFOUND / tenant not found) responde HTTP 503 sanitizado sin stack ni leaks', async () => {
    const originalFindFirst = prisma.usuario.findFirst;
    try {
      prisma.usuario.findFirst = async () => {
        const err = new Error('FATAL: (ENOTFOUND) tenant/user postgres.pokzqvttgzzpkjzsdghl not found at db.supabase.co:5432');
        err.name = 'PrismaClientInitializationError';
        err.code = 'ENOTFOUND';
        err.stack = 'PrismaClientInitializationError: FATAL at /opt/render/backend/src/index.js:42:1';
        throw err;
      };

      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@psicolau.com', password: 'password123' })
      });

      assert.strictEqual(res.status, 503, 'Debe responder con HTTP 503 ante caída de conector');
      const data = await res.json();

      assert.strictEqual(data.success, false);
      assert.strictEqual(
        data.message,
        'El servicio clínico no se encuentra disponible momentáneamente. Por favor, intenta de nuevo en unos minutos.'
      );

      // Verificaciones estrictas de no filtración (Information Disclosure CWE-209)
      assert.strictEqual(data.stack, undefined, 'data.stack debe ser undefined');
      assert.strictEqual('stack' in data, false, 'No debe existir la propiedad stack');
      assert.strictEqual('tenant' in data, false, 'No debe existir la propiedad tenant');
      assert.strictEqual('sql' in data, false, 'No debe existir la propiedad sql');
      assert.strictEqual('schema' in data, false, 'No debe existir la propiedad schema');

      const rawSerialized = JSON.stringify(data).toLowerCase();
      assert.strictEqual(rawSerialized.includes('tenant'), false, 'No debe contener la palabra tenant');
      assert.strictEqual(rawSerialized.includes('pokzqvttgzzpkjzsdghl'), false, 'No debe contener el id del tenant');
      assert.strictEqual(rawSerialized.includes('supabase'), false, 'No debe contener el hostname de supabase');
      assert.strictEqual(rawSerialized.includes('postgres'), false, 'No debe contener la palabra postgres');
      assert.strictEqual(rawSerialized.includes('prismaclient'), false, 'No debe contener referencias a Prisma');
      assert.strictEqual(rawSerialized.includes('/opt/render'), false, 'No debe contener rutas del sistema operativo');
    } finally {
      prisma.usuario.findFirst = originalFindFirst;
    }
  });

  // --------------------------------------------------------------------------
  // RF-1 & RF-3: Errores 500 Inesperados del Servidor
  // --------------------------------------------------------------------------
  test('RF-1 & RF-3: Excepción 500 no controlada responde HTTP 500 con mensaje genérico seguro y sin traza interna', async () => {
    const originalFindFirst = prisma.usuario.findFirst;
    try {
      prisma.usuario.findFirst = async () => {
        const rawErr = new Error('Unexpected crash at /var/app/backend/src/secret.js:100 SELECT * FROM private_vault');
        rawErr.stack = 'Error: Unexpected crash at /var/app/backend/src/secret.js:100:1';
        throw rawErr;
      };

      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@psicolau.com', password: 'password123' })
      });

      assert.strictEqual(res.status, 500, 'Debe responder con HTTP 500 ante error interno');
      const data = await res.json();

      assert.strictEqual(data.success, false);
      assert.strictEqual(
        data.message,
        'Ha ocurrido un error inesperado al procesar tu solicitud. Por favor, intenta más tarde.'
      );

      assert.strictEqual(data.stack, undefined, 'data.stack debe ser undefined');
      assert.strictEqual('stack' in data, false, 'No debe existir la propiedad stack');
      assert.strictEqual('sql' in data, false, 'No debe existir la propiedad sql');
      assert.strictEqual('schema' in data, false, 'No debe existir la propiedad schema');

      const rawSerialized = JSON.stringify(data).toLowerCase();
      assert.strictEqual(rawSerialized.includes('private_vault'), false, 'No debe contener nombres de tablas secretas');
      assert.strictEqual(rawSerialized.includes('/var/app'), false, 'No debe contener rutas del servidor');
    } finally {
      prisma.usuario.findFirst = originalFindFirst;
    }
  });

  // --------------------------------------------------------------------------
  // RF-4: Preservación de Respuestas Funcionales Legítimas
  // --------------------------------------------------------------------------
  test('RF-4: Preservación de errores 400 de validación Zod en endpoint real (/api/contacto)', async () => {
    const res = await fetch(`${baseUrl}/api/contacto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: '', // Inválido según contactoSchema
        email: 'correo-invalido',
        mensaje: ''
      })
    });

    assert.strictEqual(res.status, 400, 'Debe responder con HTTP 400 ante validación Zod fallida');
    const data = await res.json();

    assert.strictEqual(data.success, false);
    assert.strictEqual(typeof data.message, 'string');
    assert.ok(data.message.length > 0, 'Debe incluir mensaje descriptivo de validación');
    assert.ok(Array.isArray(data.errors), 'Debe incluir el array de errores de Zod');
    assert.strictEqual(data.stack, undefined, 'No debe exponer traza de ejecución');
  });

  test('RF-4: Preservación de errores 400 por unicidad de Prisma (P2002) en endpoint real (/api/citas/public)', async () => {
    const originalPacienteFindFirst = prisma.paciente.findFirst;
    const originalPacienteCreate = prisma.paciente.create;

    try {
      prisma.paciente.findFirst = async () => null;
      prisma.paciente.create = async () => {
        const p2002Err = new Error('Unique constraint failed on the fields: (`emailHash`)');
        p2002Err.code = 'P2002';
        p2002Err.stack = 'PrismaClientKnownRequestError: P2002 at ...';
        throw p2002Err;
      };

      const res = await fetch(`${baseUrl}/api/citas/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: 'Paciente Existente',
          email: 'paciente.existente@psicolau.com',
          telefono: '5512345678',
          fechaHora: '2026-11-20T11:00:00Z',
          categoria: 'Individual'
        })
      });

      assert.strictEqual(res.status, 400, 'Debe responder con HTTP 400 ante colisión P2002');
      const data = await res.json();

      assert.strictEqual(data.success, false);
      assert.strictEqual(
        data.message,
        'Ya existe otro paciente registrado con ese correo electrónico en el sistema.'
      );
      assert.strictEqual(data.stack, undefined, 'No debe exponer stack en colisiones P2002');
    } finally {
      prisma.paciente.findFirst = originalPacienteFindFirst;
      prisma.paciente.create = originalPacienteCreate;
    }
  });

  test('RF-4: Preservación de errores 401 de autenticación legítimos ("Credenciales inválidas")', async () => {
    const originalFindFirst = prisma.usuario.findFirst;
    try {
      prisma.usuario.findFirst = async () => null; // Usuario inexistente

      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'noexiste@psicolau.com',
          password: 'contraseñaIncorrecta123'
        })
      });

      assert.strictEqual(res.status, 401, 'Debe responder HTTP 401 ante credenciales incorrectas');
      const data = await res.json();

      assert.strictEqual(data.success, false);
      assert.strictEqual(data.message, 'Credenciales inválidas');
      assert.strictEqual(data.stack, undefined);
    } finally {
      prisma.usuario.findFirst = originalFindFirst;
    }
  });

  test('RF-4: Preservación de errores 401 al acceder a rutas protegidas sin JWT', async () => {
    const res = await fetch(`${baseUrl}/api/pacientes`);
    assert.strictEqual(res.status, 401, 'Debe responder HTTP 401 sin cabecera de autenticación');
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.stack, undefined);
  });

  // --------------------------------------------------------------------------
  // RF-5: Health Checks (Liveness y DB Keep-Alive)
  // --------------------------------------------------------------------------
  test('RF-5: Liveness probe GET /api/health responde HTTP 200 de forma no bloqueante', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(res.status, 200, 'Liveness probe debe devolver HTTP 200');
    const data = await res.json();

    assert.deepStrictEqual(data, {
      status: 'ok',
      message: 'API funcionando correctamente'
    });
  });

  test('RF-5: Diagnostic & Keep-Alive GET /api/health/db responde HTTP 200 con base de datos activa', async () => {
    const originalQueryRaw = prisma.$queryRaw;
    try {
      prisma.$queryRaw = async () => [{ '?column?': 1 }];

      const res = await fetch(`${baseUrl}/api/health/db`);
      assert.strictEqual(res.status, 200, 'DB Keep-alive debe responder HTTP 200 cuando la conexión es exitosa');
      const data = await res.json();

      assert.deepStrictEqual(data, {
        status: 'ok',
        db: 'connected',
        message: 'Conexión a base de datos operativa'
      });
    } finally {
      prisma.$queryRaw = originalQueryRaw;
    }
  });

  test('RF-5: Diagnostic & Keep-Alive GET /api/health/db responde HTTP 503 sanitizado ante fallo de conexión de BD', async () => {
    const originalQueryRaw = prisma.$queryRaw;
    try {
      const dbErr = new Error('getaddrinfo ENOTFOUND tenant.supabase.co:5432');
      dbErr.name = 'PrismaClientInitializationError';
      dbErr.code = 'ENOTFOUND';
      prisma.$queryRaw = async () => { throw dbErr; };

      const res = await fetch(`${baseUrl}/api/health/db`);
      assert.strictEqual(res.status, 503, 'DB Keep-alive debe responder HTTP 503 cuando la BD no está disponible');
      const data = await res.json();

      assert.strictEqual(data.success, false);
      assert.strictEqual(
        data.message,
        'El servicio clínico no se encuentra disponible momentáneamente. Por favor, intenta de nuevo en unos minutos.'
      );
      assert.strictEqual(data.stack, undefined);
      assert.strictEqual(JSON.stringify(data).includes('supabase.co'), false);
    } finally {
      prisma.$queryRaw = originalQueryRaw;
    }
  });
});
