// --- Lógica de Autenticación y Acceso al Panel Clínico (Spec 024) ---

import {
  sanitizarMensajeError as sanitizarHelper,
  renderizarErrorConReintento as renderizarHelper,
  limpiarError as limpiarHelper
} from './errorHelper.js';

// Fallbacks defensivos si se ejecuta en contextos donde los helpers provengan de window
const sanitizar = typeof sanitizarHelper === 'function'
  ? sanitizarHelper
  : (typeof window !== 'undefined' && typeof window.sanitizarMensajeError === 'function'
      ? window.sanitizarMensajeError
      : (msg) => String(msg && msg.message ? msg.message : msg || ''));

const renderizarConReintento = typeof renderizarHelper === 'function'
  ? renderizarHelper
  : (typeof window !== 'undefined' && typeof window.renderizarErrorConReintento === 'function'
      ? window.renderizarErrorConReintento
      : null);

const limpiar = typeof limpiarHelper === 'function'
  ? limpiarHelper
  : (typeof window !== 'undefined' && typeof window.limpiarError === 'function'
      ? window.limpiarError
      : null);

// Redirigir de inmediato si ya hay una sesión activa en localStorage
if (typeof localStorage !== 'undefined' && localStorage.getItem('psicolau_token')) {
  if (typeof window !== 'undefined' && window.location) {
    window.location.href = '/panel/agenda.html';
  }
}

/**
 * Resuelve la URL base del API clínico según la configuración activa.
 */
function obtenerApiUrl() {
  if (typeof API_URL !== 'undefined') return API_URL;
  if (typeof window !== 'undefined' && window.API_URL) return window.API_URL;
  return '/api';
}

/**
 * Renderiza un mensaje de error en el contenedor objetivo utilizando el helper
 * con botón de reintento interactivo, o mediante fallback si el helper no está disponible.
 *
 * @param {HTMLElement|string} contenedor - Elemento o selector del contenedor de error.
 * @param {Error|string|unknown} error - Error o mensaje a sanitizar y mostrar.
 * @param {Function} onRetry - Función a ejecutar cuando se presione "Reintentar".
 */
function mostrarErrorLogin(contenedor, error, onRetry) {
  const el = typeof contenedor === 'string'
    ? (typeof document !== 'undefined' ? document.querySelector(contenedor) : null)
    : contenedor;

  if (!el) return;

  if (typeof renderizarConReintento === 'function') {
    renderizarConReintento(el, error, onRetry);
  } else {
    const textoSanitizado = sanitizar(error);
    el.textContent = textoSanitizado;
    el.style.display = 'block';
  }
}

/**
 * Procesa la autenticación de la usuaria enviando sus credenciales al endpoint /auth/login.
 * Si ocurre una falla de red o de servidor, presenta una notificación amigable con opción de reintento.
 *
 * @param {Event} [e] - Evento de envío de formulario opcional.
 */
export async function ejecutarLogin(e) {
  if (e && typeof e.preventDefault === 'function') {
    e.preventDefault();
  }

  if (typeof document === 'undefined') return;

  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const errorMsg = document.getElementById('errorMessage');
  const btn = document.getElementById('loginBtn');

  if (!emailInput || !passwordInput || !btn) return;

  const email = emailInput.value ? emailInput.value.trim() : '';
  const password = passwordInput.value || '';

  // Limpiar cualquier mensaje de error previo antes de reenviar
  if (errorMsg) {
    if (typeof limpiar === 'function') {
      limpiar(errorMsg);
    } else {
      errorMsg.innerHTML = '';
      errorMsg.style.display = 'none';
    }
  }

  // Validación rápida de campos obligatorios en cliente
  if (!email || !password) {
    const validacionMsg = 'Por favor, completa tu correo y contraseña.';
    mostrarErrorLogin(errorMsg, validacionMsg, () => ejecutarLogin());
    if (!email && typeof emailInput.focus === 'function') {
      emailInput.focus();
    } else if (typeof passwordInput.focus === 'function') {
      passwordInput.focus();
    }
    return;
  }

  const originalContent = btn.innerHTML;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right: 6px;" aria-hidden="true"></i> Autenticando...';
  btn.disabled = true;

  try {
    const apiUrl = obtenerApiUrl();
    const response = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    let data = null;
    const contentType = response.headers && typeof response.headers.get === 'function'
      ? (response.headers.get('content-type') || '')
      : '';

    if (contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (errJson) {
        data = null;
      }
    }

    if (response.ok && data && data.success && data.token) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('psicolau_token', data.token);
      }
      if (typeof window !== 'undefined' && window.location) {
        window.location.href = '/panel/agenda.html';
      }
      return;
    }

    // 401: Credenciales inválidas
    if (response.status === 401) {
      const mensaje = (data && data.message) ? data.message : 'Credenciales inválidas.';
      const err = new Error(mensaje);
      err.status = 401;
      throw err;
    }

    // 503 / 500: Errores de disponibilidad de servicio o base de datos
    if (response.status === 503 || response.status === 500) {
      const mensaje = (data && data.message)
        ? data.message
        : 'El servicio clínico no se encuentra disponible momentáneamente. Por favor, intenta de nuevo en unos minutos.';
      const err = new Error(mensaje);
      err.status = response.status;
      throw err;
    }

    // Otras respuestas anómalas
    const mensajeFallo = (data && data.message)
      ? data.message
      : `Error al conectar con el servidor (${response.status || 'desconocido'})`;
    const err = new Error(mensajeFallo);
    err.status = response.status;
    throw err;
  } catch (error) {
    mostrarErrorLogin(errorMsg, error, () => ejecutarLogin());

    // Si fueron credenciales inválidas, enfocar el campo de contraseña para facilitar la corrección
    if (error && error.status === 401 && passwordInput && typeof passwordInput.focus === 'function') {
      passwordInput.focus();
      if (typeof passwordInput.select === 'function') {
        passwordInput.select();
      }
    }
  } finally {
    btn.innerHTML = originalContent;
    btn.disabled = false;
  }
}

/**
 * Inicializa el formulario de login y vincula el manejador de eventos de envío.
 */
export function inicializarLogin() {
  if (typeof document === 'undefined') return;

  const form = document.getElementById('loginForm');
  if (!form) return;

  if (form.dataset && form.dataset.listenerAttached === 'true') return;
  if (form.dataset) {
    form.dataset.listenerAttached = 'true';
  }

  form.addEventListener('submit', ejecutarLogin);
}

// Inicialización en el ciclo de vida del DOM
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarLogin);
  } else {
    inicializarLogin();
  }
}

// Soporte global para pruebas y contextos no modulares
if (typeof window !== 'undefined') {
  window.inicializarLogin = inicializarLogin;
  window.ejecutarLogin = ejecutarLogin;
}
