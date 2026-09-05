# Plan Técnico 008 — Hardening de Seguridad Web y Cabeceras (Mozilla Observatory Grade A+)

## 1. Resumen de la Solución Técnica
Implementación de un endurecimiento perimetral de seguridad mediante la reconfiguración y segmentación de cabeceras en `_headers` para Cloudflare Pages, la eliminación sistemática de atributos de eventos JavaScript inline en las 10 páginas públicas del sitio web (`onload`, `onerror`), la incorporación de cabeceras de aislamiento moderno (`COOP`, `CORP`), y la provisión de una suite de validación automatizada (`verifySecurityHeaders.js`) para auditar las cabeceras y la redirección forzada a HTTPS.

---

## 2. Alineación con la Constitución

- **Principio 1 (Cifrado de datos sensibles)**: No se alteran modelos ni consultas de expedientes médicos. Todo dato sensible se mantiene cifrado en AES-256-GCM.
- **Principio 2 (Separación Dev / Producción)**: Las cabeceras contemplan orígenes locales (`localhost:3000`, `localhost:3001`) para desarrollo y `api.psicolau.com` para producción de forma explícita.
- **Principio 3 (Frontend simple sin dependencias)**: Se mantiene 100% Vanilla HTML5/CSS3/JS sin frameworks ni librerías de build.
- **Principio 4 (Autenticación real)**: Las políticas no alteran las rutas de autenticación JWT ni la sesión de Laura.
- **Principio 5 (CORS y superficie de ataque explícitos)**: Se reduce la superficie en el sitio público eliminando dominios innecesarios (como `cdnjs.cloudflare.com`) y restringiendo las fuentes a orígenes exactos.
- **Principio 6 (No romper lo que ya funciona)**: El panel de administración (`/panel`) queda aislado con su propia política en `_headers`, garantizando que todas las funciones de agenda, pagos y expedientes continúen operando al 100%.

---

## 3. Módulos y Archivos Afectados

```text
Componente       | Archivos                                    | Tipo de cambio
-----------------|---------------------------------------------|------------------
Infraestructura  | _headers                                    | Modificar (Segmentar /* y /panel/*)
Frontend Público | js/main.js                                  | Modificar (Centralizar fallback de imagen)
Frontend Público | index.html, sobre-mi.html, libros.html, etc. | Modificar (Eliminar onload y onerror)
Backend / QA     | backend/scripts/verifySecurityHeaders.js     | Crear (Script de auditoría de cabeceras)
```

---

## 4. Modelo de Datos y Esquema
No requiere modificaciones en la base de datos PostgreSQL ni en `schema.prisma`.

---

## 5. Arquitectura de Cabeceras HTTP (`_headers`)

### Bloque 1: Sitio Web Público (`/*`)
```http
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Cross-Origin-Opener-Policy: same-origin-allow-popups
  Cross-Origin-Resource-Policy: same-origin
  Content-Security-Policy: default-src 'self'; font-src 'self' https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; script-src 'self' https://static.cloudflareinsights.com; connect-src 'self' http://localhost:3000 http://localhost:3001 https://api.psicolau.com https://cloudflareinsights.com; form-action 'self'; frame-src https://www.youtube-nocookie.com; object-src 'none'; base-uri 'self';
```

### Bloque 2: Suite Clínica y Panel de Control (`/panel/*`)
```http
/panel/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Cross-Origin-Opener-Policy: same-origin-allow-popups
  Content-Security-Policy: default-src 'self'; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com; connect-src 'self' http://localhost:3000 http://localhost:3001 https://api.psicolau.com https://*.psicolau.com https://cloudflareinsights.com; form-action 'self'; frame-src 'none'; object-src 'none'; base-uri 'self';
```

---

## 6. Decisiones Técnicas y Alternativas Descartadas

| Decisión tomada | Razón técnica | Alternativa descartada y por qué |
|---|---|---|
| **Segmentación por ruta en `_headers`** | Permite aplicar máxima severidad en el sitio público (Grado A+ en Mozilla Observatory) sin riesgo de incompatibilidad en la suite médica. | *CSP único y restrictivo para todo el sitio*: Descartado porque bloquearía los eventos inline de la agenda interactiva de Laura. |
| **`COOP: same-origin-allow-popups`** | Protege contra fugas de temporización de origen cruzado mientras permite la apertura no intrusiva de enlaces a WhatsApp Web (`wa.me`) y redes sociales. | *`same-origin` estricto*: Descartado porque rompería la apertura limpia de chats de WhatsApp desde botones web. |
| **Limpieza de `onload` en Google Fonts** | Elimina la necesidad de `'unsafe-inline'` o `'unsafe-hashes'` en `script-src`. Con el CSS crítico inyectado en `<style>`, las fuentes cargan de forma asíncrona nativa con `display=swap`. | *Carga condicional con hash SHA-256*: Descartada por fragilidad ante cambios de versión y soporte incompleto de `'unsafe-hashes'`. |
| **Fallback de imagen en `js/main.js`** | Mueve el manejo de error de carga de imagen a un escuchador estandarizado (`addEventListener`), manteniendo el HTML semántico y libre de JavaScript incrustado. | *Dejar `onerror` en el tag `<img>`*: Descartado porque dispara violación de CSP si no se habilita `'unsafe-inline'`. |

---

## 7. Estrategia de Pruebas y Validación

1. **Pruebas Automatizadas de Cabeceras (`backend/scripts/verifySecurityHeaders.js`)**:
   - Inspección estática del archivo `_headers` garantizando la ausencia de `'unsafe-inline'` en `script-src` para `/*`.
   - Verificación de cabeceras de seguridad requeridas (`HSTS`, `nosniff`, `DENY`, `COOP`, `CORP`).
   - Comprobación de redirección HTTP a HTTPS mediante petición a `http://psicolau.com`.
2. **Pruebas de Regresión en Backend**:
   - Ejecución completa de la suite de 8 tests automatizados existentes en `backend/scripts/`.
3. **Validación de Consola y Navegador**:
   - Apertura local del sitio público en navegador y confirmación de 0 violaciones de CSP en consola.
   - Verificación visual de fuentes Google Fonts (`Lora`, `Outfit`) y estilos sin bloqueo.
