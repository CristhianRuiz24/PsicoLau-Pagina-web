/**
 * testMiddlewareErroresYSalud.js
 * 
 * Prueba automatizada para Spec 024 - Tarea T1:
 * - Middleware centralizado de errores sanitizado (RF-1, RF-2, RF-3, RF-4).
 * - Endpoint de salud /api/health con keep-alive de base de datos (RF-5).
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { test } = require('node:test');
const assert = require('node:assert');
const http = require('http');

const errorHandler = require('../src/middlewares/errorHandler');
const app = require('../src/index');
const prisma = require('../src/config/db');

// Helper para simular req, res, next
function createMockRes() {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
  return res;
}

test('TDD: El módulo src/middlewares/errorHandler debe existir y exportar una función', () => {
  assert.ok(errorHandler, 'El middleware errorHandler debe existir en backend/src/middlewares/errorHandler.js');
  assert.strictEqual(typeof errorHandler, 'function', 'errorHandler debe ser una función middleware');
  assert.strictEqual(errorHandler.length, 4, 'errorHandler debe tener aridad 4 (err, req, res, next)');
});

test('RF-1 y RF-3: Captura de error 500 no previsto y sanitización estricta sin stack traces', () => {
  const res = createMockRes();
  const rawError = new Error('FATAL: Table "expediente_sensible" leaked /var/app/backend/src/secret.js SELECT * FROM secrets');
  rawError.stack = 'Error: FATAL at /var/app/backend/src/secret.js:10:5';

  errorHandler(rawError, {}, res, () => {});

  assert.strictEqual(res.statusCode, 500, 'Debe responder con HTTP 500');
  assert.deepStrictEqual(res.body, {
    success: false,
    message: 'Ha ocurrido un error inesperado al procesar tu solicitud. Por favor, intenta más tarde.'
  });
  assert.strictEqual(res.body.stack, undefined, 'No debe filtrar la propiedad stack');
  assert.strictEqual(JSON.stringify(res.body).includes('secret'), false, 'No debe filtrar datos sensibles ni nombres de tablas');
});

test('RF-2: Mapeo de fallos de conector o caídas de BD a HTTP 503 con mensaje amigable', () => {
  const connectionErrors = [
    (() => {
      const e = new Error("Can't reach database server at db.supabase.co:5432");
      e.name = 'PrismaClientInitializationError';
      return e;
    })(),
    (() => {
      const e = new Error('Rust panic in query engine');
      e.name = 'PrismaClientRustPanicError';
      return e;
    })(),
    (() => {
      const e = new Error('Unknown request error: connection closed by remote host');
      e.name = 'PrismaClientUnknownRequestError';
      return e;
    })(),
    (() => {
      const e = new Error('getaddrinfo ENOTFOUND tenant/user.supabase.co');
      e.code = 'ENOTFOUND';
      return e;
    })(),
    (() => {
      const e = new Error('P1001: Can\'t reach database server');
      e.code = 'P1001';
      return e;
    })()
  ];

  for (const err of connectionErrors) {
    const res = createMockRes();
    errorHandler(err, {}, res, () => {});

    assert.strictEqual(res.statusCode, 503, `Error ${err.name || err.code} debe mapearse a HTTP 503`);
    assert.deepStrictEqual(res.body, {
      success: false,
      message: 'El servicio clínico no se encuentra disponible momentáneamente. Por favor, intenta de nuevo en unos minutos.'
    });
    assert.strictEqual(res.body.stack, undefined, 'No debe exponer stack trace en 503');
    assert.strictEqual(JSON.stringify(res.body).includes('supabase.co'), false, 'No debe exponer hostnames internos');
  }
});

test('RF-4: Preservación de respuestas funcionales legítimas (Zod, P2002, 4xx explícitos)', () => {
  // Caso Zod
  const zodRes = createMockRes();
  const zodErr = {
    name: 'ZodError',
    errors: [
      { message: 'El correo electrónico no es válido' },
      { message: 'El nombre es obligatorio' }
    ]
  };
  errorHandler(zodErr, {}, zodRes, () => {});
  assert.strictEqual(zodRes.statusCode, 400);
  assert.strictEqual(zodRes.body.success, false);
  assert.strictEqual(zodRes.body.message, 'El correo electrónico no es válido, El nombre es obligatorio');
  assert.deepStrictEqual(zodRes.body.errors, zodErr.errors);

  // Caso P2002 (Unicidad)
  const p2002Res = createMockRes();
  const p2002Err = { code: 'P2002' };
  errorHandler(p2002Err, {}, p2002Res, () => {});
  assert.strictEqual(p2002Res.statusCode, 400);
  assert.deepStrictEqual(p2002Res.body, {
    success: false,
    message: 'Ya existe otro paciente registrado con ese correo electrónico en el sistema.'
  });

  // Caso 403 CORS o explícito
  const corsRes = createMockRes();
  const corsErr = new Error('No permitido por CORS');
  corsErr.status = 403;
  errorHandler(corsErr, {}, corsRes, () => {});
  assert.strictEqual(corsRes.statusCode, 403);
  assert.deepStrictEqual(corsRes.body, {
    success: false,
    message: 'No permitido por CORS'
  });
});

test('Guarda res.headersSent: si las cabeceras ya se enviaron, delega a next(err)', () => {
  const sentRes = createMockRes();
  sentRes.headersSent = true;
  let nextCalledWith = null;

  const testErr = new Error('Error post cabeceras');
  errorHandler(testErr, {}, sentRes, (err) => {
    nextCalledWith = err;
  });

  assert.strictEqual(nextCalledWith, testErr, 'Debe delegar el error con next(err)');
  assert.strictEqual(sentRes.statusCode, null, 'No debe intentar enviar nuevo status');
  assert.strictEqual(sentRes.body, null, 'No debe intentar enviar nuevo body');
});

test('Liveness probe: GET /api/health siempre responde HTTP 200 independientemente de la BD', async () => {
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/health`);
    assert.strictEqual(res.status, 200, 'Liveness probe debe responder HTTP 200');
    const data = await res.json();
    assert.deepStrictEqual(data, {
      status: 'ok',
      message: 'API funcionando correctamente'
    });
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('RF-5 (Éxito): GET /api/health/db realiza keep-alive a PostgreSQL y responde HTTP 200', async () => {
  const originalQueryRaw = prisma.$queryRaw;
  prisma.$queryRaw = async () => [{ '?column?': 1 }];

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/health/db`);
    assert.strictEqual(res.status, 200, 'DB Health check debe responder HTTP 200 cuando la BD está conectada');
    const data = await res.json();
    assert.deepStrictEqual(data, {
      status: 'ok',
      db: 'connected',
      message: 'Conexión a base de datos operativa'
    });
  } finally {
    prisma.$queryRaw = originalQueryRaw;
    await new Promise(resolve => server.close(resolve));
  }
});

test('RF-5 (Falla): Si la BD falla en GET /api/health/db, delega y responde HTTP 503 sanitizado', async () => {
  const originalQueryRaw = prisma.$queryRaw;
  const dbErr = new Error("Can't reach database server at db.supabase.co:5432");
  dbErr.name = 'PrismaClientInitializationError';
  prisma.$queryRaw = async () => {
    throw dbErr;
  };

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/health/db`);
    assert.strictEqual(res.status, 503, 'Debe responder HTTP 503 en caso de caída de BD');
    const data = await res.json();
    assert.deepStrictEqual(data, {
      success: false,
      message: 'El servicio clínico no se encuentra disponible momentáneamente. Por favor, intenta de nuevo en unos minutos.'
    });
    assert.strictEqual(data.stack, undefined, 'No debe filtrar stack');
  } finally {
    prisma.$queryRaw = originalQueryRaw;
    await new Promise(resolve => server.close(resolve));
  }
});
