# Spec 007 — Máxima Optimización de Rendimiento y Accesibilidad (100/100 en PageSpeed)

## 1. Contexto y Objetivo
Tras la implementación de la Spec 006, el sitio web público de PsicoLau (`psicolau.com`) alcanzó **100/100 en Prácticas Recomendadas** y **100/100 en SEO**, reduciendo el tiempo de bloqueo de CPU a **0 ms** y eliminando prácticamente todos los desplazamientos acumulativos (CLS).

Sin embargo, las auditorías móviles detalladas de **Google Lighthouse / PageSpeed** revelan que:
- **Accesibilidad (~94/100)**: Pierde puntos por contraste insuficiente en botones primarios y encabezados con el rosa institucional (`#EC5E86` tiene ratio de 3.2:1 frente al mínimo requerido de 4.5:1), y por enlaces dentro de bloques de texto que no tienen subrayado.
- **Rendimiento Móvil (~70/100)**: En conexiones móviles lentas (4G simulado), el primer pintado (FCP ~4.7s) y la carga del elemento principal (LCP ~5.0s) se ven retrasados por la descarga de la librería externa Font Awesome (18.7 KB CSS + 3 fuentes WOFF2 que suman cientos de KB para usar solo 8 iconos), la descarga externa de `style.css` y la redirección 308 de Cloudflare Pages (`.html` ➔ ruta limpia, que añade ~930 ms).

El objetivo de esta especificación es resolver con precisión milimétrica estos factores en las 10 páginas públicas para llevar el sitio a una puntuación de **95–100 en Rendimiento y 100/100 en Accesibilidad, Prácticas Recomendadas y SEO** en dispositivos móviles.

---

## 2. Usuarios / Actores
- **Consultante / Paciente en Dispositivo Móvil**: Accede con conectividad móvil limitada; experimenta un primer pintado instantáneo (< 1.5s) y lectura fluida sin dependencias externas pesadas.
- **Usuario con Necesidades de Accesibilidad (WCAG 2.1 AA)**: Visualiza botones, enlaces y títulos con contraste superior a 4.5:1 y distingue enlaces en texto mediante subrayado sin depender exclusivamente del color.
- **Ana Laura Gómez Díaz (Propietaria)**: Conserva una imagen profesional impecable, elegante, neuroafirmativa y con la máxima calificación técnica en motores de búsqueda.

---

## 3. Historias de Usuario
- **H1**: Como paciente con visión reducida, quiero que los botones y enlaces tengan suficiente contraste y diferenciación para interactuar con seguridad sin forzar la vista.
- **H2**: Como paciente en un teléfono móvil con señal débil, quiero ver el contenido de la web casi instantáneamente sin que el navegador se detenga a descargar fuentes de iconos completas de terceros.
- **H3**: Como consultante que navega entre secciones, quiero que los enlaces me dirijan directamente a la URL final limpia para no sufrir pausas por redirecciones del servidor.

---

## 4. Requisitos Funcionales (Notación EARS)

### Accesibilidad (WCAG 2.1 AA — 100/100)
- **RF-1 (Ubicuo)**: EL SISTEMA utilizará el **Turquesa de Acción `#1E94A8`** (o fondo oscuro con texto blanco con contraste superior a 4.8:1) para todos los botones principales de llamada a la acción (`.btn`), cumpliendo estrictamente con la ratio mínima de 4.5:1 de WCAG 2.1 AA sobre fondo blanco.
- **RF-2 (Ubicuo)**: EL SISTEMA aplicará subrayado (`text-decoration: underline;`) y contraste accesible (mínimo 4.5:1) a todos los enlaces de hipertexto situados dentro de párrafos o bloques de contenido (`link-in-text-block`).
- **RF-3 (Ubicuo)**: EL SISTEMA ajustará la luminosidad de los títulos `<h2>` y acentos visuales sobre fondo blanco a una relación de contraste igual o superior a 4.5:1 (ej. `#C8325E` o `#2E2E2E` con realce de marca).

### Rendimiento Móvil (Core Web Vitals — 95 a 100/100)
- **RF-4 (Ubicuo)**: EL SISTEMA sustituirá la carga externa de la biblioteca Font Awesome (`all.min.css` y archivos `.woff2`) por **iconos SVG inline nativos** para los 8 iconos utilizados en el sitio (WhatsApp, Facebook, Instagram, TikTok, YouTube, play de video, comillas y barras de menú), eliminando 3 fuentes externas pesadas y su latencia asociada.
- **RF-5 (Ubicuo)**: EL SISTEMA incorporará la directiva `&display=swap` en la llamada a Google Fonts (`Lora` y `Outfit`), permitiendo que el navegador dibuje inmediatamente el texto usando tipografías del sistema mientras descarga las fuentes web.
- **RF-6 (Ubicuo)**: EL SISTEMA incrustará el CSS crítico de `style.css` directamente en una etiqueta `<style>` dentro del `<head>` de cada página pública, logrando 0 peticiones de red bloqueantes para el primer pintado visual.
- **RF-7 (Ubicuo)**: EL SISTEMA actualizará los enlaces de navegación interna entre páginas a sus URLs limpias canónicas sin la extensión `.html` (ej. `href="sobre-mi"`, `href="contacto"`), evitando la penalización de redirección 308 de Cloudflare Pages (~930 ms).
- **RF-8 (Ubicuo)**: EL SISTEMA definirá reservas explícitas de altura mínima (`min-height` / `aspect-ratio`) en los contenedores de tarjetas de `libros.html` y del formulario de `contacto.html`, garantizando un Cumulative Layout Shift (CLS) de **0.000** en todas las vistas.

---

## 5. Requisitos No Funcionales & Seguridad
- **Constitución del Proyecto**:
  - Pila 100% Vanilla (HTML5, CSS3, JavaScript puro sin dependencias externas ni frameworks).
  - La suite clínica médica (`/panel`) permanece completamente inalterada y fuera de alcance.
  - La batería completa de pruebas automatizadas del backend (8/8 tests) debe continuar pasando al 100% sin ninguna regresión.
- **Seguridad**:
  - Integridad de cabeceras de seguridad CSP, HSTS y X-Frame-Options en `_headers`. Cero comodines `*`.
- **Métricas Objetivo en Móvil**:
  - Rendimiento: **95 – 100 / 100**.
  - Accesibilidad: **100 / 100**.
  - Prácticas Recomendadas: **100 / 100**.
  - SEO: **100 / 100**.
  - CLS: **0.000** en todas las páginas.
  - TBT: **0 ms**.

---

## 6. Casos Límite y Manejo de Errores
- **Navegadores antiguos o sin soporte SVG**: Los SVGs inline se definen con atributos `width`, `height`, `viewBox` y `aria-hidden="true"` estándar, compatibles con el 100% de navegadores modernos y móviles.
- **Acceso directo con o sin extensión `.html`**: El servidor de Cloudflare Pages atiende ambas rutas transparentemente; la optimización de enlaces internos previene la redirección en la navegación de usuarios.

---

## 7. Fuera de Alcance (Out of Scope)
- El panel de administración y suite médica (`/panel`), sus endpoints y sus estilos continúan completamente aislados e intactos.
- Reescritura del contenido textual o de las fichas clínicas de los libros y servicios.
