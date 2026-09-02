# Spec 006 — Optimización Web Integral y Rendimiento PageSpeed (Core Web Vitals)

## 1. Contexto y Objetivo
El sitio web público de PsicoLau (`psicolau.com`) es la principal vía de contacto y credibilidad para pacientes que buscan atención clínica especializada. Aunque el sitio cuenta con una arquitectura limpia en HTML/CSS/JS vanilla, las auditorías móviles de **Google PageSpeed Insights** evidencian oportunidades críticas de mejora:
- **Rendimiento (69-79/100)**: Tiempos de renderizado inicial (LCP ~4.4s, FCP ~3.1s) causados por fuentes e iconos que bloquean el renderizado (~3.1s), imágenes maestras sin escalar (ej. logo de 2363x2363 px en ranuras de 50x50 o 300x300 px), y saltos visuales bruscos (**CLS 0.198 a 0.476**) por falta de dimensiones explícitas `width` y `height`.
- **Prácticas Recomendadas (73-92/100)**: Errores en consola por bloqueo CSP de Cloudflare Web Analytics y descarga inicial obligatoria de ~2 MB de scripts y cookies de terceros por videos embebidos de YouTube en `testimonios.html`.
- **Accesibilidad (90-92/100)**: Salto de jerarquía en encabezados (h2 a h4), ausencia de hito semántico `<main>` y contraste limítrofe en textos secundarios sobre fondo marfil.

El objetivo de esta especificación es resolver integralmente todas estas oportunidades en las 10 páginas públicas del sitio para elevar las métricas móviles a **95–100 en Rendimiento, 100 en Accesibilidad, 100 en Prácticas Recomendadas y 100 en SEO**, sin alterar la estética cálida, la identidad de marca ni la funcionalidad interactiva.

---

## 2. Usuarios / Actores
- **Consultante / Paciente en Móvil**: Usuario que navega desde un dispositivo móvil con conexión 4G/3G; requiere carga ultrarrápida, navegación fluida sin saltos de pantalla (CLS = 0) y respeto absoluto a su privacidad (sin cookies innecesarias).
- **Usuario con Necesidades de Accesibilidad**: Navega con lectores de pantalla o requiere alto contraste visual legible según las directrices WCAG 2.1 AA.
- **Ana Laura Gómez Díaz (Propietaria)**: Mantiene intacta la imagen institucional, reputación médica y tasa de conversión de consultantes.

---

## 3. Historias de Usuario
- **H1**: Como paciente en móvil, quiero que la página cargue de inmediato y sin saltos bruscos de diseño para leer la información clínica sin demoras ni desorientación.
- **H2**: Como usuario interesado en testimonios, quiero que la página cargue ligera sin descargar megabytes de video a menos que yo decida reproducirlos.
- **H3**: Como usuario con debilidad visual o que utiliza lectores de pantalla, quiero una jerarquía estructurada con un punto de referencia `<main>` y contrastes de color nítidos para una lectura cómoda.
- **H4**: Como administradora del sitio, quiero que las herramientas de analítica institucional funcionen limpiamente sin generar advertencias de seguridad en la consola del navegador.

---

## 4. Requisitos Funcionales (Notación EARS)

### Rendimiento & Core Web Vitals
- **RF-1 (Ubicuo)**: EL SISTEMA declarará directivas de preconexión (`rel="preconnect"`) hacia `fonts.googleapis.com`, `fonts.gstatic.com` y `cdnjs.cloudflare.com` en el `<head>` de todas las páginas públicas.
- **RF-2 (Ubicuo)**: EL SISTEMA cargará las hojas de estilo externas que no pertenecen al diseño crítico (Font Awesome y fuentes secundarias) de forma no bloqueante mediante precarga asíncrona (`rel="preload" as="style"` / `media="print" onload="this.media='all'"`), incluyendo siempre un bloque de respaldo `<noscript>`.
- **RF-3 (Ubicuo)**: EL SISTEMA suministrará activos de imagen optimizados en formato WebP con dimensiones acordes a su visualización real en pantalla, preservando los archivos originales en `assets/` como respaldo.
- **RF-4 (Ubicuo)**: EL SISTEMA incluirá atributos explícitos `width` y `height` en todos los elementos de imagen (`<img>`) de todas las páginas públicas para reservar el espacio geométrico en el DOM y garantizar un Cumulative Layout Shift (CLS) inferior a 0.05.
- **RF-5 (Ubicuo)**: EL SISTEMA asignará `fetchpriority="high"` a la imagen principal (LCP) de cada vista y el atributo `loading="lazy"` a todas las imágenes secundarias ubicadas debajo del pliegue visual inicial.

### Prácticas Recomendadas & Privacidad de Terceros
- **RF-6 (Ubicuo)**: EL SISTEMA autorizará los orígenes de analíticas de Cloudflare (`https://static.cloudflareinsights.com` en `script-src` y `https://cloudflareinsights.com` en `connect-src`) en el archivo `_headers`, eliminando los errores de violación de CSP en la consola del navegador.
- **RF-7 (Evento)**: CUANDO el usuario ingrese a `testimonios.html`, EL SISTEMA mostrará una fachada ligera (miniatura del video con botón de reproducción) y solo inyectará el iframe de YouTube (`https://www.youtube-nocookie.com/embed/...`) tras el clic explícito del usuario, impidiendo la descarga de 2 MB y la instalación de cookies de rastreo antes de la interacción.

### Accesibilidad (WCAG 2.1 AA) & Estructura
- **RF-8 (Ubicuo)**: EL SISTEMA envolverá el contenido sustancial de cada página entre las etiquetas semánticas `<main id="main-content">` y `</main>`, proporcionando el punto de referencia estructural principal para tecnologías asistivas.
- **RF-9 (Ubicuo)**: EL SISTEMA mantendrá un orden secuencial descendente estricto en los encabezados (h1 → h2 → h3), sustituyendo cualquier salto indebido (ej. de h2 a h4 en tarjetas de testimonios).
- **RF-10 (Ubicuo)**: EL SISTEMA definirá la variable `--color-text-light` con un ratio de contraste superior a 4.5:1 (mínimo `#5C5C5C`) respecto al color de fondo institucional `#FDFBF9` en `css/style.css`.

---

## 5. Requisitos No Funcionales & Seguridad
- **Constitución del Proyecto**:
  - Se mantiene el stack 100% Vanilla (HTML5 semántico, CSS3 puro, JavaScript nativo sin dependencias ni build steps).
  - Cero dependencias externas adicionales en Node.js para el frontend público.
  - La suite clínica (`/panel`) permanece completamente intacta e inalterada.
- **Seguridad**:
  - Mantenimiento estricto de las cabeceras CSP, HSTS, X-Content-Type-Options y X-Frame-Options en `_headers`. Ningún origen comodín (`*`) añadido a la CSP.
- **Rendimiento Objetivo en Móvil**:
  - Performance: **≥ 95 / 100**.
  - Accesibilidad: **100 / 100**.
  - Prácticas Recomendadas: **100 / 100**.
  - SEO: **100 / 100**.

---

## 6. Casos Límite y Manejo de Errores
- **Navegadores con JavaScript desactivado**: Las hojas de estilo diferidas cuentan con fallback inmediato mediante `<noscript>`, asegurando que la página se renderice correctamente en cualquier entorno.
- **Navegadores antiguos sin soporte WebP**: Se preservan los archivos `.png` y `.jpg` originales y se utilizan atributos de fallback estándar para evitar imágenes rotas.
- **Fallo de red al reproducir video en testimonios**: Si la conexión a YouTube falla o es bloqueada por extensiones del consultante, la fachada mantendrá un enlace directo al video en pestaña nueva.

---

## 7. Fuera de Alcance (Out of Scope)
- El panel administrativo, expedientes clínicos, agenda y backend (`/panel`, `/backend`) quedan estrictamente fuera de alcance.
- Modificaciones a la redacción o contenidos de textos clínicos autorizados por la psicóloga.
- Migración a frameworks como React, Vue, Vite o Tailwind (prohibido por Constitución Art. 3).

---

## 8. Criterios de Finalización (Definition of Done)
- [ ] Las 10 páginas públicas del sitio cuentan con orígenes preconectados y estilos externos asíncronos con `<noscript>`.
- [ ] Todas las imágenes visibles cuentan con dimensiones `width` y `height`, versión WebP optimizada y atributos de carga según su posición (`fetchpriority` o `loading="lazy"`).
- [ ] Los videos de `testimonios.html` operan con el patrón fachada (clic para reproducir con `youtube-nocookie.com`).
- [ ] El archivo `_headers` tiene la CSP actualizada para Cloudflare Web Analytics y no arroja errores en consola.
- [ ] La jerarquía semántica (`<main>`, niveles de encabezados) y la calibración de contraste WCAG AA están integradas en todas las vistas.
- [ ] Verificación en navegador y prueba de no regresión en el panel clínico completada satisfactoriamente.

---

## 9. Dudas Abiertas / Pendientes de Aclaración
*Ninguna. Todos los puntos fueron clarificados y acordados durante la entrevista.*
