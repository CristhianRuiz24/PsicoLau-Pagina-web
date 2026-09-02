# Plan Técnico 006 — Optimización Web Integral y Rendimiento PageSpeed

## 1. Resumen de la Solución Técnica
Implementación de un plan de optimización frontend exhaustivo para las 10 páginas públicas del sitio web de PsicoLau, cubriendo las 4 dimensiones evaluadas por Google Lighthouse (Rendimiento, Accesibilidad, Prácticas Recomendadas y SEO):
1. **Reducción de bloqueo de renderizado**: Adición de `rel="preconnect"` temprano para CDNs de fuentes e iconos, y carga no bloqueante asíncrona de Font Awesome (`rel="preload" as="style"` con swap en `onload` y `<noscript>`).
2. **Optimización geométrica y formatos de imagen**: Generación de activos `.webp` dimensionados y optimizados mediante script sin pérdida visual perceptible, asignando dimensiones estrictas `width` y `height` a cada `<img>` para eliminar el CLS (de 0.198/0.476 a 0), y uso de `fetchpriority="high"` en imágenes de LCP con `loading="lazy"` en las restantes.
3. **Fachada de video en testimonios**: Sustitución de los `<iframe>` pesados de YouTube por el patrón *Click-to-Play Facade*, evitando la descarga inicial de ~2 MB de JavaScript/CSS y la inyección involuntaria de cookies de rastreo de terceros.
4. **Hardening de CSP sin errores**: Autorización de `static.cloudflareinsights.com` y `cloudflareinsights.com` en `_headers` para el funcionamiento transparente del beacon de analíticas de Cloudflare.
5. **Estructura semántica y contraste**: Adición del hito `<main id="main-content">`, regularización de niveles de encabezados y ajuste del gris secundario `--color-text-light` a `#5C5C5C` (> 5.5:1 WCAG AA).

---

## 2. Alineación con la Constitución
- **Art. 1 (Datos Cifrados)**: Ningún dato clínico se toca ni se expone. El trabajo se limita al sitio público y configuraciones de servidor estático.
- **Art. 2 (Separación Dev/Prod)**: Se trabaja sobre archivos estáticos y pruebas en entorno local sin interactuar con bases de datos ni alterar producción.
- **Art. 3 (Frontend simple, sin dependencias innecesarias)**: Se mantiene 100% en HTML5 semántico, CSS3 puro y JavaScript vanilla ligero. Cero frameworks, cero librerías de build steps añadidas.
- **Art. 4 (Autenticación real)**: El panel clínico `/panel` y sus endpoints JWT permanecen intactos.
- **Art. 5 (CORS y CSP explícitos)**: No se usa comodín `*`. Se declaran únicamente los subdominios exactos requeridos por Cloudflare Analytics.
- **Art. 6 (No romper lo que funciona para Laura)**: La suite clínica, la agenda, el cálculo contable y la creación de citas no sufren ninguna alteración.

---

## 3. Módulos y Archivos Afectados

```text
Componente       | Archivos                                   | Tipo de cambio
-----------------|--------------------------------------------|------------------
Configuración    | _headers                                   | Modificar (CSP)
Estilos          | css/style.css                              | Modificar (Contraste + Facade)
Multimedia       | assets/*.webp                              | Crear (Imágenes WebP)
Vistas Públicas  | index.html, sobre-mi.html, testimonios.html| Modificar (Head, LCP, CLS, semántica)
Vistas Públicas  | areas-de-atencion.html, experiencia.html   | Modificar (Head, LCP, CLS, semántica)
Vistas Públicas  | libros.html, terapias-grupales.html        | Modificar (Head, LCP, CLS, semántica)
Vistas Públicas  | contacto.html, preguntas-frecuentes.html   | Modificar (Head, LCP, CLS, semántica)
Vistas Públicas  | privacidad.html                            | Modificar (Head, LCP, CLS, semántica)
Scripts Utilidad | js/main.js                                 | Modificar (Lógica de fachada de video)
```

---

## 4. Modelo de Datos y Esquema
*Sin cambios en Prisma ni en base de datos. La optimización aplica estrictamente a la capa de presentación pública.*

---

## 5. Decisiones Técnicas y Alternativas Descartadas

| Decisión tomada | Razón técnica | Alternativa descartada y por qué |
|---|---|---|
| **Carga asíncrona de Font Awesome con `<noscript>`** | Elimina 900 ms de bloqueo de renderizado inicial (FCP y LCP) sin perder iconos | *Eliminar Font Awesome y migrar a SVG en línea: descartado por riesgo de inconsistencias estéticas y mayor tiempo de refactorización.* |
| **Fachada de Video Click-to-Play nativa en Vanilla JS** | Evita la descarga de 1,966 KiB y cookies de terceros de YouTube hasta que el usuario hace clic | *Iframe estático con `loading="lazy"`: descartado porque los navegadores siguen cargando scripts pesados y cookies de tracking al hacer scroll.* |
| **Conversión WebP dimensionada conservando originales** | Reduce el peso de las imágenes entre 80% y 90%, resolviendo la advertencia de 166 KiB en logo y 104 KiB en foto | *Comprimir los PNG/JPG destructivamente sobre los originales: descartado para no perder los archivos maestros en alta resolución.* |
| **Atributos `width` y `height` explícitos en HTML** | Reserva la proporción de aspecto (`aspect-ratio`) en el árbol de render, reduciendo el CLS de 0.476 a 0 | *Dimensionar solo por CSS: descartado porque el navegador requiere las dimensiones en el nodo HTML para calcular el espacio antes de descargar la imagen.* |
| **Inclusión puntual de Cloudflare Insights en CSP** | Suprime los errores de violación CSP en la consola de Chrome sin debilitar la seguridad | *Desactivar Web Analytics en Cloudflare: descartado para no privar a Laura de métricas de visitantes de su sitio.* |

---

## 6. Estrategia de Pruebas y Validación
1. **Verificación de sintaxis y validación de marcado**: Comprobar que todas las etiquetas `<main>`, `<img>`, `<picture>` y encabezados sean semánticamente correctos y válidos.
2. **Prueba funcional en navegador local**:
   - Comprobar que la página se visualice exactamente igual que antes (cero regresión visual).
   - Probar la interacción de la fachada de video en `testimonios.html` (al dar clic reproduce inmediatamente el video).
   - Verificar en las herramientas de desarrollo de Chrome (Consola y Red) que no existan errores de CSP y que los recursos WebP carguen en orden óptimo.
3. **Verificación de no regresión en la suite clínica**:
   - Correr la batería completa de 8 tests automatizados en `backend/scripts/` para asegurar que el backend y panel permanezcan intactos.
