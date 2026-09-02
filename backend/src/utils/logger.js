/**
 * logger.js — Módulo centralizado de logging para la Suite Clínica PsicoLau.
 *
 * En producción (NODE_ENV === 'production'):
 * - Oculta stack traces, rutas locales y queries internas de base de datos.
 * - Registra únicamente mensajes estructurados y el mensaje conciso del error.
 *
 * En desarrollo y pruebas:
 * - Emite trazas completas para facilitar la depuración inmediata.
 */

const isProd = process.env.NODE_ENV === 'production';

const formatError = (error) => {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (error instanceof Error) {
    return isProd ? (error.message || 'Error no especificado') : (error.stack || error.message);
  }
  return isProd ? (error.message || 'Error no especificado') : JSON.stringify(error);
};

const logger = {
  info: (mensaje, ...args) => {
    console.log(`[INFO] ${mensaje}`, ...args);
  },

  warn: (mensaje, ...args) => {
    console.warn(`[WARN] ${mensaje}`, ...args);
  },

  error: (mensaje, error) => {
    if (error !== undefined) {
      console.error(`[ERROR] ${mensaje}:`, formatError(error));
    } else {
      console.error(`[ERROR] ${mensaje}`);
    }
  }
};

module.exports = logger;
