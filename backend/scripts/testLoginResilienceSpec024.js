/**
 * Test Automatizado de Resiliencia y Sanitización en Login (Spec 024 - Tarea T3)
 * PSICOLAU — Psicología y Resiliencia
 *
 * Valida:
 * 1. Fallos de red pura ('Failed to fetch') -> Mensaje institucional de red + botón "Reintentar".
 * 2. Fallos de servidor HTTP 503 / Caída de DB (Prisma, tenant leaks) -> Mensaje institucional sanitizado + botón "Reintentar".
 * 3. Fallos de servidor HTTP 500 / Páginas HTML (SyntaxError en JSON) -> Mensaje institucional seguro + botón "Reintentar".
 * 4. Error de credenciales inválidas (HTTP 401) -> Mensaje claro preservado + foco en contraseña + botón "Reintentar".
 * 5. Reintento interactivo: pulsar el botón "Reintentar" dispara de nuevo la autenticación sin recargar la página.
 * 6. Login exitoso -> Persistencia de token en localStorage y redirección a /panel/agenda.html.
 */

const assert = require('node:assert/strict');
const path = require('path');
const { pathToFileURL } = require('url');

async function ejecutarPruebas() {
  console.log('[TEST LOGIN RESILIENCE] Iniciando validación de resiliencia y sanitización en pantalla de login...');

  // Mock de localStorage
  const localStore = new Map();
  const mockLocalStorage = {
    getItem: (k) => localStore.get(k) || null,
    setItem: (k, v) => localStore.set(k, String(v)),
    removeItem: (k) => localStore.delete(k),
    clear: () => localStore.clear()
  };

  // Mock de Window y Location
  const mockWindow = {
    location: { href: '/panel/index.html' },
    API_URL: 'http://localhost:3001/api'
  };

  // Mock de Elementos DOM
  function crearElemento(tag, id = '') {
    return {
      tagName: tag.toUpperCase(),
      id,
      type: '',
      value: '',
      innerHTML: '',
      textContent: '',
      className: '',
      disabled: false,
      isConnected: true,
      style: { display: '' },
      dataset: {},
      attributes: {},
      children: [],
      listeners: {},
      _focused: false,
      _selected: false,
      setAttribute(k, v) { this.attributes[k] = v; },
      getAttribute(k) { return this.attributes[k]; },
      appendChild(child) { this.children.push(child); },
      addEventListener(evt, fn) {
        if (!this.listeners[evt]) this.listeners[evt] = [];
        this.listeners[evt].push(fn);
      },
      click() {
        if (this.listeners['click']) {
          for (const fn of this.listeners['click']) {
            fn({ preventDefault() {}, stopPropagation() {} });
          }
        }
      },
      focus() { this._focused = true; },
      select() { this._selected = true; }
    };
  }

  const elementsMap = {
    email: crearElemento('input', 'email'),
    password: crearElemento('input', 'password'),
    errorMessage: crearElemento('p', 'errorMessage'),
    loginBtn: crearElemento('button', 'loginBtn'),
    loginForm: crearElemento('form', 'loginForm')
  };

  elementsMap.loginBtn.innerHTML = 'Ingresar al Panel';

  // Mock de Document
  const mockDocument = {
    readyState: 'complete',
    getElementById(id) {
      return elementsMap[id] || null;
    },
    querySelector(sel) {
      if (sel === '#errorMessage') return elementsMap.errorMessage;
      if (sel === '#email') return elementsMap.email;
      if (sel === '#password') return elementsMap.password;
      if (sel === '#loginBtn') return elementsMap.loginBtn;
      if (sel === '#loginForm') return elementsMap.loginForm;
      return null;
    },
    createElement(tag) {
      return crearElemento(tag);
    },
    addEventListener() {}
  };

  // Inyectar entorno global simulado
  globalThis.document = mockDocument;
  globalThis.window = mockWindow;
  globalThis.localStorage = mockLocalStorage;
  globalThis.API_URL = mockWindow.API_URL;

  // Manejador dinámico de fetch para simular respuestas de backend y red
  let mockFetchHandler = null;
  globalThis.fetch = async (url, opts) => {
    if (!mockFetchHandler) {
      throw new Error('fetch invocado sin handler configurado en la prueba');
    }
    return mockFetchHandler(url, opts);
  };

  // Importar el módulo bajo prueba
  const loginJsPath = path.resolve(__dirname, '../../panel/js/login.js');
  const loginJsUrl = pathToFileURL(loginJsPath).href;
  const { ejecutarLogin } = await import(loginJsUrl);

  const errorHelperPath = path.resolve(__dirname, '../../panel/js/errorHelper.js');
  const errorHelperUrl = pathToFileURL(errorHelperPath).href;
  const { MENSAJE_INSTITUCIONAL_SERVICIO, MENSAJE_INSTITUCIONAL_RED } = await import(errorHelperUrl);

  function buscarBotonReintentar(contenedor) {
    // Busca recursivamente un botón con clase 'btn-reintentar' en los hijos
    function search(node) {
      if (!node) return null;
      if (node.tagName === 'BUTTON' && node.className && node.className.includes('btn-reintentar')) {
        return node;
      }
      if (node.children) {
        for (const child of node.children) {
          const res = search(child);
          if (res) return res;
        }
      }
      return null;
    }
    return search(contenedor);
  }

  function obtenerTextoRecursivo(node) {
    if (!node) return '';
    let txt = node.textContent || '';
    if (node.children) {
      for (const child of node.children) {
        txt += ' ' + obtenerTextoRecursivo(child);
      }
    }
    return txt.trim();
  }

  // --- CASO 1: Fallo de Red Pura ('Failed to fetch') ---
  console.log('  1. Probando fallo de red pura (Failed to fetch)...');
  elementsMap.email.value = 'contacto@psicolau.com';
  elementsMap.password.value = 'Password123!';
  mockFetchHandler = async () => {
    throw new TypeError('Failed to fetch');
  };

  await ejecutarLogin();

  assert.equal(elementsMap.errorMessage.style.display, 'block', 'Contenedor de error debe ser visible');
  const textoCaso1 = obtenerTextoRecursivo(elementsMap.errorMessage);
  assert(textoCaso1.includes(MENSAJE_INSTITUCIONAL_RED), 'Debe mostrar el mensaje institucional de red');
  const btnReintentar1 = buscarBotonReintentar(elementsMap.errorMessage);
  assert(btnReintentar1 !== null, 'Debe incluir el botón de reintento');
  assert(btnReintentar1.innerHTML.includes('fa-rotate-right'), 'Botón debe incluir icono de reintento');

  // --- CASO 2: Fallo de Servidor 503 con fuga técnica de Prisma / Tenant ---
  console.log('  2. Probando fallo de base de datos HTTP 503 con traza de Prisma...');
  mockFetchHandler = async () => {
    return {
      ok: false,
      status: 503,
      headers: {
        get: (h) => (h.toLowerCase() === 'content-type' ? 'application/json' : null)
      },
      json: async () => ({
        success: false,
        message: 'PrismaClientInitializationError: Can\'t reach database server tenant postgres.pokzqvttgzzpkjzsdghl'
      })
    };
  };

  await ejecutarLogin();

  const textoCaso2 = obtenerTextoRecursivo(elementsMap.errorMessage);
  assert(!textoCaso2.toLowerCase().includes('prisma'), 'Jamás debe exponer el término "prisma"');
  assert(!textoCaso2.toLowerCase().includes('tenant'), 'Jamás debe exponer el término "tenant"');
  assert(!textoCaso2.toLowerCase().includes('postgres'), 'Jamás debe exponer el término "postgres"');
  assert(textoCaso2.includes(MENSAJE_INSTITUCIONAL_SERVICIO), 'Debe sustituir por mensaje institucional de servicio');
  const btnReintentar2 = buscarBotonReintentar(elementsMap.errorMessage);
  assert(btnReintentar2 !== null, 'Debe incluir botón de reintento ante 503');

  // --- CASO 3: Fallo de Servidor 500 con respuesta HTML (SyntaxError al parsear JSON) ---
  console.log('  3. Probando respuesta no-JSON HTML 500 (Bad Gateway)...');
  mockFetchHandler = async () => {
    return {
      ok: false,
      status: 500,
      headers: {
        get: (h) => (h.toLowerCase() === 'content-type' ? 'text/html' : null)
      },
      json: async () => {
        throw new SyntaxError('Unexpected token < in JSON at position 0');
      }
    };
  };

  await ejecutarLogin();

  const textoCaso3 = obtenerTextoRecursivo(elementsMap.errorMessage);
  assert(textoCaso3.includes(MENSAJE_INSTITUCIONAL_SERVICIO), 'Debe manejar el error de servidor con mensaje amigable');
  const btnReintentar3 = buscarBotonReintentar(elementsMap.errorMessage);
  assert(btnReintentar3 !== null, 'Debe incluir botón de reintento ante respuesta anómala');

  // --- CASO 4: Credenciales Inválidas (HTTP 401) ---
  console.log('  4. Probando credenciales inválidas HTTP 401...');
  elementsMap.password._focused = false;
  elementsMap.password._selected = false;
  mockFetchHandler = async () => {
    return {
      ok: false,
      status: 401,
      headers: {
        get: (h) => (h.toLowerCase() === 'content-type' ? 'application/json' : null)
      },
      json: async () => ({
        success: false,
        message: 'Credenciales inválidas.'
      })
    };
  };

  await ejecutarLogin();

  const textoCaso4 = obtenerTextoRecursivo(elementsMap.errorMessage);
  assert(textoCaso4.includes('Credenciales inválidas'), 'Debe preservar el mensaje funcional claro');
  assert.equal(elementsMap.password._focused, true, 'Debe enfocar el campo de contraseña para corregir');
  assert.equal(elementsMap.password._selected, true, 'Debe seleccionar el texto del campo de contraseña');
  const btnReintentar4 = buscarBotonReintentar(elementsMap.errorMessage);
  assert(btnReintentar4 !== null, 'Debe permitir reintento');

  // --- CASO 5: Reintento Interactivo (Pulsar el botón de reintentar) ---
  console.log('  5. Probando flujo de reintento interactivo con éxito posterior...');
  let llamadasFetch = 0;
  mockFetchHandler = async () => {
    llamadasFetch++;
    if (llamadasFetch === 1) {
      // Primera llamada: falla por red
      throw new TypeError('Failed to fetch');
    }
    // Segunda llamada (reintento): éxito
    return {
      ok: true,
      status: 200,
      headers: {
        get: (h) => (h.toLowerCase() === 'content-type' ? 'application/json' : null)
      },
      json: async () => ({
        success: true,
        token: 'jwt_token_reintento_exitoso_777'
      })
    };
  };

  // Disparamos la primera llamada que fallará
  await ejecutarLogin();
  assert.equal(llamadasFetch, 1, 'Debe haber hecho 1 llamada');
  const btnReintentoActivo = buscarBotonReintentar(elementsMap.errorMessage);
  assert(btnReintentoActivo !== null, 'Debe tener botón de reintento');

  // Simulamos clic en el botón de reintento
  btnReintentoActivo.click();

  // Esperar a que la promesa del click se resuelva
  await new Promise((resolve) => setTimeout(resolve, 50));

  assert.equal(llamadasFetch, 2, 'El reintento debe disparar una segunda petición fetch sin recargar la página');
  assert.equal(mockLocalStorage.getItem('psicolau_token'), 'jwt_token_reintento_exitoso_777', 'Debe guardar el token tras reintento exitoso');
  assert.equal(mockWindow.location.href, '/panel/agenda.html', 'Debe redirigir a /panel/agenda.html');

  // --- CASO 6: Validación de campos vacíos en cliente ---
  console.log('  6. Probando validación de campos vacíos...');
  elementsMap.email.value = '';
  elementsMap.password.value = '';
  let fetchInvocado = false;
  mockFetchHandler = async () => {
    fetchInvocado = true;
    return { ok: true, status: 200, headers: { get: () => null }, json: async () => ({}) };
  };

  await ejecutarLogin();

  assert.equal(fetchInvocado, false, 'No debe invocar fetch si los campos están vacíos');
  const textoCaso6 = obtenerTextoRecursivo(elementsMap.errorMessage);
  assert(textoCaso6.includes('completa tu correo y contraseña'), 'Debe notificar campos faltantes');

  console.log('✔ Todas las pruebas de resiliencia y sanitización en login pasaron satisfactoriamente (6/6 escenarios).');
}

ejecutarPruebas().catch((err) => {
  console.error('✖ Error durante la prueba de resiliencia de login:', err);
  process.exit(1);
});
