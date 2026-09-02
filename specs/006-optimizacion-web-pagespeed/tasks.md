# Tareas de Implementación 006 — Optimización Web Integral y Rendimiento PageSpeed

> **Regla de ejecución**: Implementar y verificar una sola tarea a la vez antes de avanzar a la siguiente.

---

## 📋 Lista de Tareas

### [x] T1: Hardening de Seguridad CSP y Eliminación de Errores de Consola
- **Archivos**:
  - `_headers`
- **Acción**:
  - Actualizar la directiva `Content-Security-Policy` en `_headers`: agregar `https://static.cloudflareinsights.com` en `script-src` y `https://cloudflareinsights.com` en `connect-src`.
- **Hecho cuando**:
  - El archivo `_headers` contenga los orígenes autorizados exactos (sin comodines `*`) y la consola del navegador en producción no registre violaciones de CSP al cargar el beacon de analíticas.

---

### [x] T2: Calibración de Estilos Globales, Accesibilidad y Fachada de Video
- **Archivos**:
  - `css/style.css`
- **Acción**:
  - Calibrar la variable `--color-text-light` a `#5C5C5C` para superar el ratio de contraste 4.5:1 (WCAG 2.1 AA) sobre fondo `#FDFBF9`.
  - Crear clases de estilo para el componente de fachada de video (`.video-facade`, `.video-facade-play`, `.video-facade-thumb`, etc.) garantizando una relación de aspecto 16:9 fluida y accesible.
  - Asegurar reglas CSS de dimensionamiento responsivo para imágenes (`aspect-ratio`, `object-fit`).
- **Hecho cuando**:
  - Los estilos de texto secundario tengan contraste > 5.5:1 y el contenedor de fachada de video esté estéticamente integrado con la paleta de la marca.

---

### [x] T3: Generación de Activos Modernos WebP Dimensionados
- **Archivos**:
  - `assets/`
- **Acción**:
  - Mediante script con Pillow (PIL), generar versiones WebP optimizadas con calidad 85 y muestreo LANCZOS:
    - `assets/logo.webp` (600x600 px para hero en pantallas retina)
    - `assets/logo-nav.webp` (100x100 px para barra de navegación y pie de página)
    - `assets/foto-laura.webp` (800x1103 px para la vista Sobre Mí)
    - `assets/libro-manual.webp` y `assets/libro-resiliencia.webp` (escalados para Libros)
  - Conservar los archivos originales `.png` y `.jpg` intactos como respaldos maestros.
- **Hecho cuando**:
  - Los archivos `.webp` existan en `assets/`, su peso conjunto sea inferior a 80 KB (reducción de más del 80% sobre los ~580 KB originales) y la nitidez visual sea idéntica.

---

### [x] T4: Fachada de Video Ligera y Privacidad en Testimonios
- **Archivos**:
  - `testimonios.html`
  - `js/main.js`
- **Acción**:
  - Reemplazar los iframes directos de YouTube en `testimonios.html` por componentes de fachada HTML ligeros con miniatura, botón de reproducción y texto descriptivo accesible.
  - Añadir soporte en `js/main.js` para que al hacer clic en cualquier fachada se inyecte dinámicamente el `<iframe>` con `youtube-nocookie.com`, autoplay y parámetros limpios.
- **Hecho cuando**:
  - Al abrir `testimonios.html`, la transferencia inicial no descargue los 2 MB de scripts de YouTube ni instale cookies de terceros, y al hacer clic en el video se reproduzca de inmediato.

---

### [x] T5: Optimización Integral de las 10 Páginas Públicas HTML (LCP, CLS, Preconexión, `<main>`)
- **Archivos**:
  - `index.html`
  - `sobre-mi.html`
  - `areas-de-atencion.html`
  - `experiencia.html`
  - `libros.html`
  - `terapias-grupales.html`
  - `testimonios.html`
  - `contacto.html`
  - `preguntas-frecuentes.html`
  - `privacidad.html`
- **Acción**:
  - En `<head>` de cada página: insertar `preconnect` a `fonts.googleapis.com`, `fonts.gstatic.com` y `cdnjs.cloudflare.com`. Cargar Font Awesome de forma asíncrona no bloqueante con respaldo `<noscript>`.
  - En el cuerpo: delimitar todo el contenido principal entre `<header>` y `<footer>` con el elemento semántico `<main id="main-content">`.
  - En imágenes: sustituir por las versiones WebP optimizadas, agregando atributos explícitos `width` y `height` en todas las imágenes visibles para eliminar el CLS a 0.
  - Asignar `fetchpriority="high"` a la imagen LCP de cada página (ej. hero logo en `index.html`, foto en `sobre-mi.html`) y `loading="lazy"` a las imágenes secundarias.
  - Regularizar la jerarquía de encabezados donde corresponda (ej. corregir h4 en testimonios).
- **Hecho cuando**:
  - Las 10 páginas cuenten con la estructura semántica completa, cero bloqueos críticos de renderizado y atributos explícitos de imagen.

---

### [x] T6: Verificación Integral de No Regresión y Auditoría Final
- **Archivos**:
  - `backend/scripts/*.js`
  - Navegador local (`http://localhost:5500`)
- **Acción**:
  - Ejecutar la batería completa de pruebas unitarias/integración del backend (`testReporteContadoraDesglose.js`, `testCambioPassword.js`, `testBlindajeEmail500.js`, `testContadoresSemanales.js`, `testWhatsAppEvaluaciones.js`, `testContabilidad.js`, `testCitasRecurrentes.js`, `verifyEndpoints.js`).
  - Navegar localmente con browser subagent por las páginas principales (`index.html`, `testimonios.html`, `libros.html`) para comprobar visualmente la carga instantánea, la nitidez de imágenes WebP, la correcta alineación y la apertura de las fachadas de video.
  - Verificar que no se generen errores en la consola de JavaScript ni advertencias de CSP.
- **Hecho cuando**:
  - 100% de los tests automatizados del backend pasen con éxito.
  - Navegación visual y consola totalmente limpias sin regresiones.
