/**
 * Test Unitario de Verificación para errorHelper.js (Spec 024 - Tarea T2)
 */

const assert = require('node:assert/strict');
const path = require('path');
const { pathToFileURL } = require('url');

async function ejecutarPruebas() {
  console.log('[TEST ERROR HELPER] Iniciando validación unitaria de errorHelper.js...');

  const moduloPath = path.resolve(__dirname, '../../panel/js/errorHelper.js');
  const moduloUrl = pathToFileURL(moduloPath).href;
  const {
    sanitizarMensajeError,
    renderizarErrorConReintento,
    limpiarError,
    MENSAJE_INSTITUCIONAL_SERVICIO,
    MENSAJE_INSTITUCIONAL_RED
  } = await import(moduloUrl);

  // 1. Detección de errores técnicos y trazas de Prisma / DB
  const errPrisma = new Error("PrismaClientInitializationError: Can't reach database server at localhost:5432");
  assert.equal(
    sanitizarMensajeError(errPrisma),
    MENSAJE_INSTITUCIONAL_SERVICIO,
    'Debe interceptar PrismaClientInitializationError'
  );

  const errTenant = "FATAL: (ENOTFOUND) tenant/user postgres.pokzqvttgzzpkjzsdghl not found";
  assert.equal(
    sanitizarMensajeError(errTenant),
    MENSAJE_INSTITUCIONAL_SERVICIO,
    'Debe interceptar errores con tenant/postgres'
  );

  const errSyntaxJson = "SyntaxError: Unexpected token '<', \"<!DOCTYPE \"... is not valid JSON";
  assert.equal(
    sanitizarMensajeError(errSyntaxJson),
    MENSAJE_INSTITUCIONAL_SERVICIO,
    'Debe interceptar respuestas HTML con syntax error'
  );

  // 2. Detección de errores de corte de red puro
  const errNetworkFetch = new TypeError("Failed to fetch");
  assert.equal(
    sanitizarMensajeError(errNetworkFetch),
    MENSAJE_INSTITUCIONAL_RED,
    'Debe mapear Failed to fetch al mensaje de conexión de internet'
  );

  const errFirefoxNet = "TypeError: NetworkError when attempting to fetch resource.";
  assert.equal(
    sanitizarMensajeError(errFirefoxNet),
    MENSAJE_INSTITUCIONAL_RED,
    'Debe mapear NetworkError al mensaje de conexión de internet'
  );

  const errChromeNet = "net::ERR_CONNECTION_REFUSED";
  assert.equal(
    sanitizarMensajeError(errChromeNet),
    MENSAJE_INSTITUCIONAL_RED,
    'Debe mapear net::ERR_ al mensaje de conexión de internet'
  );

  // 3. Preservación de mensajes funcionales legítimos
  assert.equal(
    sanitizarMensajeError("Credenciales inválidas"),
    "Credenciales inválidas",
    'Debe preservar mensajes breves funcionales como "Credenciales inválidas"'
  );

  assert.equal(
    sanitizarMensajeError("Email y contraseña requeridos"),
    "Email y contraseña requeridos",
    'Debe preservar mensajes de validación'
  );

  assert.equal(
    sanitizarMensajeError(new Error("Credenciales inválidas")),
    "Credenciales inválidas",
    'Debe extraer y preservar mensaje limpio de instancias de Error funcionales'
  );

  // 4. Límite de longitud (> 120 caracteres)
  const textoLargo = "Este es un mensaje extremadamente largo que supera intencionalmente los ciento veinte caracteres para comprobar que el sistema intercepta mensajes desproporcionados que romperían la UI";
  assert(textoLargo.length > 120, 'El texto de prueba debe superar 120 caracteres');
  assert.equal(
    sanitizarMensajeError(textoLargo),
    MENSAJE_INSTITUCIONAL_SERVICIO,
    'Textos mayores a 120 caracteres deben sanitizarse'
  );

  // 5. Manejo de valores vacíos y fallback personalizado
  assert.equal(
    sanitizarMensajeError(null),
    MENSAJE_INSTITUCIONAL_SERVICIO,
    'Debe retornar mensaje institucional por defecto si error es null'
  );

  assert.equal(
    sanitizarMensajeError(null, "No se pudo cargar la sección."),
    "No se pudo cargar la sección.",
    'Debe respetar fallbackMsg si se proporciona'
  );

  assert.equal(
    sanitizarMensajeError(new Error("db crash"), "No se pudo actualizar"),
    "No se pudo actualizar",
    'Debe usar fallbackMsg ante fallo técnico si fue especificado'
  );

  // 6. Prueba de renderizado DOM simulado
  const mockContainer = {
    innerHTML: '',
    style: { display: 'none' },
    children: [],
    appendChild(child) {
      this.children.push(child);
    }
  };

  // Simulamos entorno DOM mínimo
  globalThis.document = {
    querySelector(sel) {
      if (sel === '#errorMessage') return mockContainer;
      return null;
    },
    createElement(tag) {
      return {
        tagName: tag.toUpperCase(),
        type: '',
        className: '',
        innerHTML: '',
        textContent: '',
        attributes: {},
        style: {},
        disabled: false,
        isConnected: true,
        children: [],
        listeners: {},
        setAttribute(k, v) { this.attributes[k] = v; },
        appendChild(child) { this.children.push(child); },
        addEventListener(evt, handler) { this.listeners[evt] = handler; }
      };
    }
  };

  let retryClicked = false;
  const renderResult = renderizarErrorConReintento(
    mockContainer,
    new TypeError("Failed to fetch"),
    () => { retryClicked = true; }
  );

  assert(renderResult !== null, 'renderizarErrorConReintento debe retornar objeto con referencias');
  assert.equal(mockContainer.style.display, 'block', 'Debe hacer visible el contenedor');
  assert.equal(renderResult.textoSpan.textContent, MENSAJE_INSTITUCIONAL_RED, 'Texto debe ser sanitizado');
  assert(renderResult.botonReintentar !== null, 'Debe crear botón de reintento');
  assert.equal(renderResult.botonReintentar.className, 'btn-reintentar');
  assert(renderResult.botonReintentar.innerHTML.includes('fa-rotate-right'), 'Botón debe incluir icono FontAwesome');

  // Simular clic en botón
  assert(renderResult.botonReintentar.listeners['click'], 'Botón debe tener listener click');
  renderResult.botonReintentar.listeners['click']({
    preventDefault() {},
    stopPropagation() {}
  });
  assert.equal(retryClicked, true, 'Debe invocar callback onRetry al hacer click');

  // Probar limpiarError
  limpiarError(mockContainer);
  assert.equal(mockContainer.innerHTML, '');
  assert.equal(mockContainer.style.display, 'none');

  console.log('✔ Todas las pruebas unitarias de errorHelper.js pasaron satisfactoriamente (10/10 assertions).');
}

ejecutarPruebas().catch((err) => {
  console.error('✖ Error durante la prueba:', err);
  process.exit(1);
});
