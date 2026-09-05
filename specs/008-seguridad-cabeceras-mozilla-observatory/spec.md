# Spec 008 — Hardening de Seguridad Web y Cabeceras (Mozilla Observatory Grade A+)

## 1. Contexto y Objetivo
El sitio web oficial de PsicoLau (`psicolau.com`) cuenta con una infraestructura segura y un rendimiento optimizado al 100% en PageSpeed. Sin embargo, una auditoría técnica en **Mozilla Observatory** evidenció dos penalizaciones críticas que reducen su calificación a un grado deficiente (C/D con -40 puntos de penalización):
1. **Content Security Policy (CSP) (-20 Failed)**: La presencia de `'unsafe-inline'` dentro de `script-src` en las cabeceras globales, lo que reduce la protección contra ataques de inyección de código (XSS).
2. **Redirección HTTP a HTTPS (-20 Failed)**: El acceso no cifrado a `http://psicolau.com` responde directamente con código `200 OK` en vez de forzar una redirección `301/308` hacia `https://psicolau.com`.

Adicionalmente, se detectó la ausencia de cabeceras modernas de aislamiento de contexto entre orígenes (`COOP` y `CORP`).

El objetivo de esta especificación es implementar un endurecimiento (*hardening*) de cabeceras HTTP en `_headers`, desacoplar cualquier invocación JavaScript inline en las 10 páginas públicas hacia `js/main.js`, segmentar las políticas entre el sitio público (`/*`) y la suite médica privada (`/panel/*`), y verificar la redirección obligatoria a HTTPS en Cloudflare para alcanzar una calificación de **Grado A o A+ (100+) en Mozilla Observatory**, preservando el 100% de la funcionalidad de la suite clínica y el rendimiento de PageSpeed.

---

## 2. Usuarios / Actores
- **Consultante / Paciente**: Navega por la web pública con la certeza de que su conexión está forzada a HTTPS y que la plataforma cuenta con protección activa contra scripts maliciosos.
- **Ana Laura Gómez Díaz (Propietaria)**: Administra su consultorio y agenda en `/panel` sin ninguna interrupción, manteniendo su suite clínica operando con normalidad.
- **Auditor / Escáner de Ciberseguridad**: Evalúa la superficie de ataque del dominio mediante herramientas estándar de la industria (Mozilla Observatory, SecurityHeaders) y recibe cabeceras endurecidas de nivel empresarial.

---

## 3. Historias de Usuario
- **H1**: Como consultante que escribe `psicolau.com` en el navegador, quiero ser redirigido inmediatamente a la versión segura `https://psicolau.com` para que mi navegación y solicitudes viajen cifradas.
- **H2**: Como paciente que consulta la página, quiero que el sitio impida la ejecución de scripts no autorizados o inyecciones XSS mediante una política CSP estricta sin `'unsafe-inline'`.
- **H3**: Como profesional de la salud mental, quiero que el endurecimiento de seguridad en el sitio público no altere ni bloquee la funcionalidad de mi panel de citas, expedientes y cobros.

---

## 4. Requisitos Funcionales (Criterios en Notación EARS)

### Segmentación de Cabeceras y CSP Estricto (`_headers`)
- **RF-1 (Ubicuo)**: EL SISTEMA definirá una política `Content-Security-Policy` estricta para todo el sitio público (`/*`) que omita `'unsafe-inline'` y `data:` en la directiva `script-src`, limitando las fuentes de script exclusivamente a `'self'` y al endpoint analítico `https://static.cloudflareinsights.com`.
- **RF-2 (Ubicuo)**: EL SISTEMA mantendrá una directiva `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;` para el sitio público, garantizando el renderizado instantáneo del CSS crítico inyectado en el `<head>`.
- **RF-3 (Ubicuo)**: EL SISTEMA restringirá `connect-src` en el sitio público a `'self'`, las APIs locales (`http://localhost:3000`, `http://localhost:3001`), la API de producción (`https://api.psicolau.com`) y el endpoint analítico (`https://cloudflareinsights.com`), asegurando el funcionamiento del formulario de contacto sin exponer orígenes innecesarios.
- **RF-4 (Ubicuo)**: EL SISTEMA definirá una sección de cabeceras dedicada para la suite clínica (`/panel/*`), garantizando compatibilidad con los componentes interactivos de la agenda, audio Web Audio API y orígenes de API autorizados sin degradar la seguridad del frontend público.

### Aislamiento de Origen (COOP, CORP)
- **RF-5 (Ubicuo)**: EL SISTEMA emitirá la cabecera `Cross-Origin-Opener-Policy: same-origin-allow-popups` en las respuestas del sitio público, blindando el contexto de ejecución contra ataques de temporización de ventanas y permitiendo la apertura fluida de enlaces a WhatsApp Web y redes sociales.
- **RF-6 (Ubicuo)**: EL SISTEMA emitirá la cabecera `Cross-Origin-Resource-Policy: same-origin` en las respuestas del sitio público, impidiendo la incrustación no autorizada de activos estáticos por dominios de terceros.

### Desacoplamiento de Atributos Inline en Frontend Público
- **RF-7 (Evento)**: CUANDO el navegador cargue cualquiera de las 10 páginas públicas, EL SISTEMA inicializará los manejadores de eventos desde `js/main.js`, eliminando todo atributo inline `onload` de los enlaces de hojas de estilo (`<link>`) y todo atributo `onerror` en imágenes del HTML.
- **RF-8 (Excepción)**: SI la imagen de retrato en `sobre-mi.html` falla en cargarse, ENTONCES EL SISTEMA sustituirá la fuente por el logo institucional mediante un escuchador de eventos estándar (`addEventListener('error')`) registrado en `js/main.js`.

### Redirección Obligatoria HTTP → HTTPS
- **RF-9 (Ubicuo)**: EL SISTEMA forzará la redirección inmediata con código `301` o `308` de cualquier petición entrante por `http://psicolau.com/*` hacia `https://psicolau.com/*` a nivel de borde (Cloudflare).
- **RF-10 (Evento)**: CUANDO se ejecute el script de auditoría automatizado (`backend/scripts/verifySecurityHeaders.js`), EL SISTEMA verificará que las cabeceras `HSTS`, `CSP`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `COOP`, `CORP` y el código de redirección HTTP→HTTPS cumplan con los estándares de Mozilla Observatory.

---

## 5. Requisitos No Funcionales & Seguridad
- **Cumplimiento de la Constitución**:
  - Principio 5: Superficie de ataque y orígenes explícitos en CSP y CORS. Cero comodines `*`.
  - Principio 6: Cero regresiones en la suite clínica (`/panel`).
- **Pila 100% Vanilla**: Sin librerías externas ni herramientas de transpilación.
- **Compatibilidad**: Funcionamiento verificado en navegadores modernos de escritorio y móviles (Chrome, Firefox, Safari, Edge).
- **Rendimiento**: Preservar el cuádruple 100/100 en Google Lighthouse / PageSpeed móvil.

---

## 6. Casos Límite y Manejo de Errores
- **Navegadores antiguos sin soporte para COOP/CORP**: Ignoran las cabeceras de aislamiento sin afectar la visualización de la página.
- **Peticiones sin conexión a internet en formulario de contacto**: `main.js` captura el fallo de red y muestra el mensaje accesible de error sin recargar la página.
- **Caché en Cloudflare**: Tras el despliegue de cabeceras, se purga la caché perimetral para que los escáneres reciban los nuevos valores inmediatamente.

---

## 7. Fuera de Alcance (Out of Scope)
- Modificación de la lógica interna de expedientes médicos cifrados, agenda o contabilidad en el panel.
- Reescritura de los componentes del panel de administración para eliminar eventos inline internos (estos quedan cubiertos por su propia política CSP en `/panel/*`).
- Registro manual en el catálogo de `hstspreload.org` (queda como acción opcional para el usuario una vez confirmada la redirección HTTPS en producción).

---

## 8. Criterios de Finalización (Definition of Done)
- [ ] Directivas CSP sin `'unsafe-inline'` en `script-src` configuradas para `/*` en `_headers`.
- [ ] Cabeceras `COOP: same-origin-allow-popups` y `CORP: same-origin` incorporadas en `_headers`.
- [ ] Atributos `onload` y `onerror` inline eliminados de las 10 páginas HTML públicas y absorbidos en `js/main.js`.
- [ ] Guía de activación de "Always Use HTTPS" en Cloudflare documentada y script de validación `verifySecurityHeaders.js` creado.
- [ ] Cero errores o advertencias de CSP en la consola del navegador en las 10 páginas públicas.
- [ ] Batería de 8 tests automatizados del backend pasando al 100%.
- [ ] Verificación obligatoria de `AGENTS.md` superada.
