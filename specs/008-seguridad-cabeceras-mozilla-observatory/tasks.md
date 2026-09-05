# Tareas de Implementación 008 — Hardening de Seguridad Web y Cabeceras (Mozilla Observatory Grade A+)

> **Regla de ejecución**: Implementar y verificar una sola tarea a la vez antes de avanzar a la siguiente.

---

## 📋 Lista de Tareas

### [x] T1: Desacoplamiento de Atributos Inline en Frontend Público
- **Archivos**:
  - `js/main.js`
  - `index.html`
  - `sobre-mi.html`
  - `areas-de-atencion.html`
  - `experiencia.html`
  - `libros.html`
  - `preguntas-frecuentes.html`
  - `terapias-grupales.html`
  - `testimonios.html`
  - `contacto.html`
  - `privacidad.html`
- **Acción**:
  - Centralizar en `js/main.js` el fallback de imagen de perfil (`.profile-img`) mediante `addEventListener('error')`.
  - Retirar los atributos inline `onload="this.media='all'"` de los elementos `<link>` de fuentes en las 10 páginas HTML públicas.
  - Retirar el atributo inline `onerror="..."` del tag `<img>` en `sobre-mi.html`.
- **Hecho cuando**:
  - Una búsqueda de patrones regex `\son[a-z]+=` en las 10 páginas HTML públicas arroja 0 resultados de eventos JavaScript incrustados y la web visualiza las fuentes y fotos con total normalidad.

---

### [x] T2: Segmentación y Hardening de Cabeceras HTTP (`_headers`)
- **Archivos**:
  - `_headers`
- **Acción**:
  - Configurar en `_headers` la sección `/*` para el sitio público con:
    - CSP estricto sin `'unsafe-inline'` ni `data:` en `script-src` (`script-src 'self' https://static.cloudflareinsights.com;`).
    - Aislamiento de ventanas: `Cross-Origin-Opener-Policy: same-origin-allow-popups`.
    - Aislamiento de recursos: `Cross-Origin-Resource-Policy: same-origin`.
    - Superficie explícita en fuentes (`font-src 'self' https://fonts.gstatic.com`), estilos y conexiones API.
  - Configurar la sección `/panel/*` para la suite clínica privada:
    - CSP aislado que mantenga compatibilidad con la agenda interactiva (`script-src 'self' 'unsafe-inline' ...`), Web Audio API y Font Awesome en CDN sin degradar la seguridad del sitio público.
- **Hecho cuando**:
  - El archivo `_headers` contiene las directivas segmentadas y la sección `/*` carece completamente de `'unsafe-inline'` en `script-src`.

---

### [x] T3: Script de Verificación Automatizada de Seguridad y Redirección HTTPS
- **Archivos**:
  - `backend/scripts/verifySecurityHeaders.js`
- **Acción**:
  - Crear un script en Node.js que audite estáticamente las reglas de `_headers` asegurando el cumplimiento de los estándares de Mozilla Observatory.
  - Añadir comprobación de red hacia `http://psicolau.com` para verificar si responde con código de redirección (301/308) hacia `https://`.
- **Hecho cuando**:
  - `node backend/scripts/verifySecurityHeaders.js` se ejecute sin errores y reporte el estado de cada cabecera obligatoria.

---

### [x] T4: Verificación Integral de No Regresión, Consola y Pila Clínica
- **Archivos**:
  - Todos los archivos afectados
  - `backend/scripts/`
- **Acción**:
  - Ejecutar los 8 tests automatizados del backend (`testBlindajeEmail500.js`, `testContadoresSemanales.js`, `testReporteContadoraDesglose.js`, `testWhatsAppEvaluaciones.js`, `testContabilidad.js`, `testCitasRecurrentes.js`, `testCambioPassword.js`, `verifyEndpoints.js`).
  - Abrir el sitio público en navegador local y verificar que no se produzca ninguna violación de CSP en la consola de desarrollador.
  - Comprobar que la suite clínica en `/panel` continúa funcionando de forma fluida.
- **Hecho cuando**:
  - 8/8 tests backend superados al 100% y 0 errores o violaciones de CSP en consola del navegador.
