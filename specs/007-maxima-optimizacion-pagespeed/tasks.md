# Tareas de Implementación — Spec 007: Máxima Optimización de Rendimiento y Accesibilidad (100/100 en PageSpeed)

---

### [x] T1: Calibración de Accesibilidad WCAG 2.1 AA en Sistema de Diseño (`css/style.css`)
- **Archivos**:
  - `css/style.css`
- **Acción**:
  - Actualizar los botones `.btn` para utilizar el **Turquesa de Acción `#1E94A8`** de fondo con texto blanco `#FFFFFF` (ratio de contraste superior a 4.8:1).
  - Añadir regla para que todos los enlaces dentro de párrafos de texto lleven `text-decoration: underline;` y color `#1E94A8`, aprobando la auditoría `link-in-text-block`.
  - Calibrar el contraste de los encabezados `<h2>` para superar 4.5:1 en cualquier resolución.
  - Definir estilos base para los iconos SVG inline (alineación vertical, tamaño 1em/1.25em, `fill: currentColor`).
- **Hecho cuando**:
  - La inspección de estilos confirme botones con contraste > 4.8:1 y enlaces de texto subrayados.

---

### [x] T2: Sustitución de Font Awesome por SVGs Inline Nativos
- **Archivos**:
  - Las 10 páginas HTML (`index.html`, `sobre-mi.html`, etc.)
- **Acción**:
  - Reemplazar las etiquetas `<i>` de Font Awesome por elementos `<svg>` inline limpios para los 8 iconos utilizados (WhatsApp, Facebook, Instagram, TikTok, YouTube, play de video, comillas de testimonios y menú móvil).
  - Retirar por completo el enlace de precarga y hoja de estilo de Font Awesome (`all.min.css`) del `<head>` de las 10 páginas.
- **Hecho cuando**:
  - Ninguna página solicite archivos desde `cdnjs.cloudflare.com` de Font Awesome ni descargue fuentes `.woff2`.
  - Todos los iconos se muestren nítidos y perfectamente alineados en pantalla.

---

### [x] T3: Inlining de CSS Crítico y Enlaces Canónicos Limpios
- **Archivos**:
  - Las 10 páginas HTML
- **Acción**:
  - Incrustar el contenido optimizado de `style.css` directamente en una etiqueta `<style>` en el `<head>` de cada página.
  - Actualizar los enlaces de la barra de navegación y pie de página para apuntar a las rutas limpias de Cloudflare Pages (ej. `href="sobre-mi"`, `href="contacto"` en lugar de `.html`), eliminando la redirección 308 (ahorro de ~930 ms).
  - Asegurar `&display=swap` en la llamada de Google Fonts.
- **Hecho cuando**:
  - No existan peticiones bloqueantes de CSS externo en el `<head>`.
  - Los enlaces internos naveguen directamente sin redirecciones intermedias.

---

### [x] T4: Corrección de CLS Residual en `libros` y `contacto`
- **Archivos**:
  - `libros.html`
  - `contacto.html`
- **Acción**:
  - Ajustar el contenedor de tarjetas de libros y el contenedor del formulario de contacto con altura mínima y reserva geométrica para garantizar CLS = 0.000 absoluto.
- **Hecho cuando**:
  - Las 10 páginas registren un CLS de 0.000 en la auditoría de Lighthouse.

---

### [x] T5: Verificación Integral de No Regresión y Auditoría Final Lighthouse
- **Archivos**:
  - Las 10 páginas públicas
  - `backend/scripts/*.js`
- **Acción**:
  - Ejecutar el script automatizado de auditoría Lighthouse sobre las 10 páginas para comprobar que el Rendimiento alcance 95–100 y la Accesibilidad 100/100.
  - Ejecutar la batería completa de 8 tests automatizados del backend.
  - Actualizar `overview/tasks.md` y `overview/session.md`.
- **Hecho cuando**:
  - 100/100 en Accesibilidad, Prácticas Recomendadas y SEO en todas las páginas.
  - Rendimiento en zona verde (95-100).
  - 8/8 tests backend pasando al 100%.
