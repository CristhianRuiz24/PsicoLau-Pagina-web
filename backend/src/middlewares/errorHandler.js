/**
 * errorHandler.js — Middleware centralizado de manejo y sanitización de errores (Spec 024).
 *
 * Principios:
 * - Sanitización estricta de respuestas 500 y 503 (RF-1 y RF-3).
 * - Ocultamiento absoluto de trazas internas (stack traces, SQL, rutas de archivos y hostnames).
 * - Mapeo de caídas o desconexiones de base de datos a HTTP 503 Service Unavailable (RF-2).
 * - Preservación de respuestas funcionales legítimas (Zod 400, P2002 400, 4xx explícitos) (RF-4).
 * - Registro estructurado interno mediante logger.error.
 */

const logger = require('../utils/logger');

/**
 * Determina si un error corresponde a un fallo de conector, caída o timeout
 * de la base de datos PostgreSQL / Prisma.
 *
 * @param {any} err
 * @returns {boolean}
 */
function isDatabaseConnectionError(err) {
  if (!err) return false;

  const dbErrorNames = [
    'PrismaClientInitializationError',
    'PrismaClientRustPanicError',
    'PrismaClientUnknownRequestError'
  ];

  if (dbErrorNames.includes(err.name) || dbErrorNames.includes(err.constructor?.name)) {
    return true;
  }

  const dbErrorCodes = [
    'P1000', // Error de autenticación contra la base de datos
    'P1001', // No se puede alcanzar el servidor de base de datos
    'P1002', // El servidor de base de datos respondió timeout
    'P1003', // La base de datos no existe
    'P1008', // Operaciones con timeout
    'P1011', // Error abriendo conexión TLS
    'P1017', // El servidor cerró la conexión
    'ENOTFOUND',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'EHOSTUNREACH'
  ];

  if (err.code && dbErrorCodes.includes(err.code)) {
    return true;
  }

  const msg = typeof err.message === 'string' ? err.message.toLowerCase() : '';

  const connectionPatterns = [
    "can't reach database server",
    'cant reach database server',
    'enotfound',
    'tenant/user',
    'connection closed',
    'connection terminated',
    'prismaclientinitializationerror',
    'unable to establish a connection to the database',
    'database server was reached, but timed out'
  ];

  return connectionPatterns.some(pattern => msg.includes(pattern));
}

/**
 * Middleware central de Express para manejo de errores.
 *
 * @param {Error|any} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next
 */
function errorHandler(err, req, res, _next) {
  // Si las cabeceras ya fueron enviadas al cliente, delegar al manejador por defecto de Express
  if (res.headersSent) {
    return _next(err);
  }

  // 1. Errores de validación semántica Zod (HTTP 400) (RF-4)
  if (err && err.name === 'ZodError') {
    const msg = Array.isArray(err.errors)
      ? err.errors.map(e => e.message).join(', ')
      : (err.message || 'Error de validación');
    return res.status(400).json({
      success: false,
      message: msg,
      errors: err.errors
    });
  }

  // 2. Errores de colisión de unicidad de Prisma P2002 (HTTP 400) (RF-4)
  if (err && err.code === 'P2002') {
    return res.status(400).json({
      success: false,
      message: 'Ya existe otro paciente registrado con ese correo electrónico en el sistema.'
    });
  }

  // 3. Errores de cliente explícitos (4xx: 400, 401, 403, 404, etc.) (RF-4)
  const explicitStatus = err ? (err.status || err.statusCode) : null;
  if (typeof explicitStatus === 'number' && explicitStatus >= 400 && explicitStatus < 500) {
    return res.status(explicitStatus).json({
      success: false,
      message: err.message || 'Solicitud inválida'
    });
  }

  // 4. Fallos de conector o caídas de base de datos (HTTP 503) (RF-2)
  if (isDatabaseConnectionError(err)) {
    logger.error('Fallo de conexión o disponibilidad de base de datos:', err);
    return res.status(503).json({
      success: false,
      message: 'El servicio clínico no se encuentra disponible momentáneamente. Por favor, intenta de nuevo en unos minutos.'
    });
  }

  // 5. Errores inesperados del servidor no controlados (HTTP 500 sanitizado) (RF-1, RF-3)
  logger.error('Error no controlado en la aplicación:', err);
  return res.status(500).json({
    success: false,
    message: 'Ha ocurrido un error inesperado al procesar tu solicitud. Por favor, intenta más tarde.'
  });
}

module.exports = errorHandler;
