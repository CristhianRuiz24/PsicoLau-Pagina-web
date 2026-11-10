/**
 * Helper Transversal de Sanitización Defensiva y Resiliencia en UI (Spec 024)
 * PSICOLAU — Psicología y Resiliencia
 *
 * Proporciona:
 * 1. Sanitización de errores (RF-6): Detecta fallos técnicos (Prisma, SQL, trazas, red)
 *    e intercepta fugas de información, retornando mensajes cálidos y seguros.
 * 2. Renderizado con botón de reintento (RF-5): Inyecta el error formateado
 *    acompañado de un botón interactivo estilizado en la paleta de acción oficial (#1E94A8).
 */

export const MENSAJE_INSTITUCIONAL_SERVICIO = 'No fue posible conectar con el servicio clínico. Por favor, intenta nuevamente en unos momentos.';
export const MENSAJE_INSTITUCIONAL_RED = 'Comprueba tu conexión a internet o intenta nuevamente en unos momentos.';

/**
 * Patrones que identifican un error de conectividad de red pura en el cliente o navegador.
 */
const PATRONES_RED = [
  'failed to fetch',
  'networkerror',
  'network error',
  'net::err_',
  'load failed',
  'sin conexión',
  'la conexión fue rechazada',
  'conexion rechazada',
  'offline'
];

/**
 * Patrones que delatan problemas de infraestructura, base de datos o backend.
 */
const PATRONES_INFRAESTRUCTURA_SERVIDOR = [
  'prisma',
  'database',
  'base de datos',
  'db ',
  'connector',
  'tenant',
  'pg_',
  'sql',
  'postgres',
  'relation',
  'schema',
  'column',
  'table',
  'enotfound',
  'econnrefused',
  'econnreset',
  'etimedout',
  'node_modules',
  'internal server error',
  '500 internal',
  '503 service',
  'bad gateway',
  'gateway timeout',
  'crash',
  'failed to connect',
  'can\'t reach',
  'cannot reach',
  '<!doctype',
  '<html',
  '<head',
  '<body',
  '<script'
];

/**
 * Patrones técnicos internos que jamás deben exponerse al usuario clínico (CWE-209).
 */
const PATRONES_TECNICOS = [
  ...PATRONES_INFRAESTRUCTURA_SERVIDOR,
  'syntax',
  'stack',
  'at object.',
  'at async',
  'typeerror:',
  'referenceerror:',
  'uncaught exception',
  'unhandled rejection'
];

/**
 * Inspecciona un error recibido y retorna un mensaje institucional seguro,
 * filtrando trazas de ejecución, nombres de infraestructura o sintaxis técnica.
 *
 * @param {Error|string|object|unknown} error - Mensaje, objeto o instancia de error recibida.
 * @param {string} [fallbackMsg] - Mensaje alternativo opcional en caso de fallo técnico no legible.
 * @returns {string} Mensaje seguro y cálido para presentar al usuario.
 */
export function sanitizarMensajeError(error, fallbackMsg) {
  let rawMsg = '';

  if (typeof error === 'string') {
    rawMsg = error.trim();
  } else if (error && typeof error.message === 'string') {
    rawMsg = error.message.trim();
  } else if (error && typeof error.error === 'string') {
    rawMsg = error.error.trim();
  } else if (error) {
    rawMsg = String(error).trim();
  }

  // Si no se proporcionó ningún mensaje o está vacío
  if (!rawMsg) {
    return fallbackMsg || MENSAJE_INSTITUCIONAL_SERVICIO;
  }

  // Remover prefijo común "Error: " si existe
  if (/^error:\s*/i.test(rawMsg)) {
    rawMsg = rawMsg.replace(/^error:\s*/i, '').trim();
  }

  const lower = rawMsg.toLowerCase();

  // 1. Identificar si es un corte de conexión de red pura del cliente
  const esErrorRedPura = PATRONES_RED.some((patron) => lower.includes(patron)) ||
    (typeof navigator !== 'undefined' && navigator && navigator.onLine === false);

  const contieneInfraestructuraServidor = PATRONES_INFRAESTRUCTURA_SERVIDOR.some((patron) => lower.includes(patron));
  const contienePatronTecnico = PATRONES_TECNICOS.some((patron) => lower.includes(patron));
  const esDemasiadoLargo = rawMsg.length > 120;

  // Si es un corte de red sin patrones técnicos de infraestructura de servidor
  if (esErrorRedPura && !contieneInfraestructuraServidor) {
    return MENSAJE_INSTITUCIONAL_RED;
  }

  // Si contiene trazas técnicas o supera los 120 caracteres
  if (contienePatronTecnico || esDemasiadoLargo) {
    return fallbackMsg || MENSAJE_INSTITUCIONAL_SERVICIO;
  }

  // Mensaje funcional legítimo y breve (ej. "Credenciales inválidas")
  return rawMsg;
}

/**
 * Renderiza de forma segura un mensaje de error dentro de un contenedor del DOM,
 * agregando un botón interactivo para "Reintentar" estilizado en la paleta oficial (#1E94A8).
 *
 * @param {HTMLElement|string} contenedor - Elemento DOM o selector CSS del contenedor (ej. '#errorMessage').
 * @param {Error|string|object|unknown} mensaje - Error o mensaje a sanitizar y desplegar.
 * @param {Function} [onRetry] - Callback asíncrono o síncrono a invocar cuando se pulse "Reintentar".
 * @returns {object|null} Referencias a los elementos creados o null si el contenedor no existe.
 */
export function renderizarErrorConReintento(contenedor, mensaje, onRetry) {
  const el = typeof contenedor === 'string'
    ? document.querySelector(contenedor)
    : contenedor;

  if (!el) {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[errorHelper] Contenedor no encontrado:', contenedor);
    }
    return null;
  }

  const textoSanitizado = sanitizarMensajeError(mensaje);

  // Limpiar el contenido previo de forma segura
  el.innerHTML = '';

  const wrapper = document.createElement('span');
  wrapper.className = 'error-reintento-wrapper';

  const textoSpan = document.createElement('span');
  textoSpan.className = 'error-texto';
  textoSpan.textContent = textoSanitizado;
  wrapper.appendChild(textoSpan);

  let botonReintentar = null;

  if (typeof onRetry === 'function') {
    botonReintentar = document.createElement('button');
    botonReintentar.type = 'button';
    botonReintentar.className = 'btn-reintentar';
    botonReintentar.setAttribute('aria-label', 'Reintentar operación');
    botonReintentar.innerHTML = '<i class="fa-solid fa-rotate-right" aria-hidden="true"></i> Reintentar';

    botonReintentar.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (botonReintentar.disabled) return;

      botonReintentar.disabled = true;
      const contenidoOriginal = botonReintentar.innerHTML;
      botonReintentar.innerHTML = '<i class="fa-solid fa-rotate-right fa-spin" aria-hidden="true"></i> Reintentando...';

      try {
        const resultado = onRetry(e);
        if (resultado && typeof resultado.then === 'function') {
          await resultado;
        }
      } catch (err) {
        if (typeof console !== 'undefined' && console.error) {
          console.error('[errorHelper] Error al ejecutar reintento:', err);
        }
      } finally {
        const estaConectado = typeof botonReintentar.isConnected === 'boolean'
          ? botonReintentar.isConnected
          : (typeof document !== 'undefined' && document.body && document.body.contains(botonReintentar));

        if (estaConectado) {
          botonReintentar.disabled = false;
          botonReintentar.innerHTML = contenidoOriginal;
        }
      }
    });

    wrapper.appendChild(botonReintentar);
  }

  el.appendChild(wrapper);
  el.style.display = 'block';

  return {
    contenedor: el,
    wrapper,
    textoSpan,
    botonReintentar
  };
}

/**
 * Limpia y oculta un contenedor de error previamente renderizado.
 *
 * @param {HTMLElement|string} contenedor - Elemento DOM o selector CSS.
 */
export function limpiarError(contenedor) {
  const el = typeof contenedor === 'string'
    ? document.querySelector(contenedor)
    : contenedor;

  if (!el) return;
  el.innerHTML = '';
  el.style.display = 'none';
}

// Soporte global para scripts tradicionales que no usen type="module"
if (typeof window !== 'undefined') {
  window.sanitizarMensajeError = sanitizarMensajeError;
  window.renderizarErrorConReintento = renderizarErrorConReintento;
  window.limpiarError = limpiarError;
}
