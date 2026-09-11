/**
 * rateLimitHelpers.js
 * Utilidades para la gestión y bypass seguro de limitadores de tasa (Spec 019).
 * 
 * Garantiza que las solicitudes originadas desde localhost/loopback en entornos
 * de desarrollo y pruebas no sean bloqueadas por falsos positivos de HTTP 429,
 * mientras mantiene la protección estricta e innegociable en producción.
 */

/**
 * Determina si una dirección IP corresponde a la interfaz de loopback local.
 * @param {string} ip 
 * @returns {boolean}
 */
const esLoopback = (ip) => {
  if (!ip || typeof ip !== 'string') return false;
  const limpia = ip.trim().toLowerCase();
  return (
    limpia === '127.0.0.1' ||
    limpia === '::1' ||
    limpia === '::ffff:127.0.0.1' ||
    limpia.endsWith('127.0.0.1')
  );
};

/**
 * Determina si un limitador de tasa debe omitir la restricción para una solicitud dada.
 * - Modo test (NODE_ENV === 'test'): Omite incondicionalmente.
 * - Modo desarrollo (NODE_ENV !== 'production'): Omite únicamente para solicitudes de loopback (localhost).
 * - Modo producción (NODE_ENV === 'production'): NUNCA omite (aplica límite estricto).
 * 
 * @param {import('express').Request} req 
 * @returns {boolean}
 */
const debeOmitirRateLimit = (req) => {
  // 1. En suites de pruebas automatizadas, omitir siempre
  if (process.env.NODE_ENV === 'test') {
    return true;
  }

  // 2. En producción, la seguridad es estricta: jamás se omite el rate limit
  if (process.env.NODE_ENV === 'production') {
    return false;
  }

  // 3. En desarrollo local, permitir peticiones de loopback sin consumir cuota pública
  const ip = req?.ip || req?.socket?.remoteAddress || req?.connection?.remoteAddress;
  return esLoopback(ip);
};

module.exports = {
  esLoopback,
  debeOmitirRateLimit
};
