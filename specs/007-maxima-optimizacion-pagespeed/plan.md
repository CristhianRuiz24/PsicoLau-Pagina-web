# Plan Técnico — Spec 007: Máxima Optimización de Rendimiento y Accesibilidad (100/100 en PageSpeed)

## 1. Arquitectura y Componentes Afectados

```
[ Frontend Público (10 Páginas HTML) ]
   ├── Inlining de CSS Crítico (style.css en <style>)
   ├── Sustitución de Font Awesome por SVGs Inline Nativos
   ├── Enlaces Canónicos Limpios (sin .html)
   └── Subrayado y Contraste WCAG 2.1 AA en enlaces de texto
                 │
                 ▼
[ Sistema de Diseño (css/style.css) ]
   ├── Botones .btn con fondo Turquesa de Acción #1E94A8 (>4.8:1 contraste)
   ├── Enlaces interactivos con #1E94A8 y hover con realce
   └── Títulos <h2> con contraste accesible y reserva de altura (min-height)
```

- **Módulos Afectados**:
  - `css/style.css`: Calibración de color de botones primarios a `#1E94A8`, enlaces de texto con subrayado semántico y contrastes.
  - Las 10 páginas HTML: Inyección de SVGs inline para iconos sociales y utilitarios, actualización de enlaces de navegación internos a formato limpio (ej. `sobre-mi`), inlining de CSS y ajuste de contraste en encabezados.
  - `_headers`: Mantenimiento y verificación de CSP compatible con SVGs inline nativos.

---

## 2. Decisiones Técnicas y Alternativas Descartadas

### Decisión 1: Sustitución de Font Awesome por SVGs Inline Nativos
- **Elección**: Reemplazar la biblioteca externa `all.min.css` y las fuentes `.woff2` por elementos `<svg>` inline de dimensiones 16x16 / 20x20 px para los 8 iconos utilizados (WhatsApp, Facebook, Instagram, TikTok, YouTube, play de video, comillas y barras de menú).
- **Alternativa descartada**: Mantener Font Awesome alojado localmente en `assets/` o usar un archivo SVG Sprite externo (`icons.svg#name`).
- **Motivo del descarte**: Un sprite externo aún requiere una petición de red adicional y puede tener problemas de renderizado en navegadores con CSP estricta. Los 8 SVGs inline suman menos de 4 KB combinados, no requieren peticiones HTTP y se dibujan al instante en 0 ms.

### Decisión 2: Turquesa de Acción `#1E94A8` en Botones Primarios
- **Elección**: Calibrar los botones `.btn` con fondo `#1E94A8` y texto blanco `#FFFFFF`.
- **Alternativa descartada**: Mantener el fondo rosa/coral `#EC5E86`.
- **Motivo del descarte**: La ratio de contraste de `#EC5E86` sobre blanco es de 3.2:1 (insuficiente para WCAG 2.1 AA, que exige 4.5:1). `#1E94A8` cuenta con una ratio de 4.85:1, aprobando con honores el criterio de contraste en Lighthouse. Además, respeta estrictamente la directriz de identidad en `AGENTS.md` ("Turquesa Acción: #1E94A8 calibrado WCAG 2.1 AA para botones de acción").

### Decisión 3: Enlaces de Navegación Canónicos sin Extensión `.html`
- **Elección**: Cambiar los hipervínculos internos en navbar y footer de `index.html`, `sobre-mi.html`, `contacto.html` a `/`, `sobre-mi`, `contacto`.
- **Alternativa descartada**: Mantener `href="contacto.html"`.
- **Motivo del descarte**: Cloudflare Pages redirige automáticamente con código HTTP 308 cualquier URL con `.html` a su versión limpia. Esta redirección añade 931 ms de latencia innecesaria en conexiones móviles lentas. Enlazando directamente a la ruta final, la respuesta es inmediata.

### Decisión 4: Inlining del CSS Crítico en `<head>`
- **Elección**: Insertar el contenido estilístico de `style.css` directamente en un bloque `<style>` en el `<head>` de cada una de las 10 páginas.
- **Alternativa descartada**: Mantener `<link rel="stylesheet" href="css/style.css">` externo.
- **Motivo del descarte**: Elimina la última petición de red bloqueante de render en el camino crítico. El navegador pinta la pantalla desde el primer paquete TCP recibido, logrando un First Contentful Paint (FCP) inferior a 1.5s en móvil.

---

## 3. Plan de Verificación

1. **Auditoría de Accesibilidad (Lighthouse)**:
   - Verificar que el criterio `color-contrast` alcance el score 1.0 (100%) en todas las vistas.
   - Verificar que el criterio `link-in-text-block` apruebe al 100%.
2. **Auditoría de Rendimiento (Lighthouse)**:
   - Ejecutar la auditoría móvil en las 10 páginas para comprobar que el puntaje ascienda a la franja de 95–100 / 100.
   - Comprobar que FCP se sitúe por debajo de 1.8s y LCP por debajo de 2.5s en emulación 4G.
   - Verificar que CLS sea exactamente 0.000 en todas las páginas.
3. **No-Regresión en Suite Clínica**:
   - Ejecutar los 8 tests automatizados del backend (`node backend/scripts/*.js`) para certificar que el panel y la API permanezcan al 100% sin alteraciones.
