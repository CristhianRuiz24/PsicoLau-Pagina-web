# Tareas Técnicas — Spec 019: Aislamiento del Rate Limiter en Entornos Locales y Pruebas

## Tareas Atómicas

### T1: Helper de Omisión de Rate Limit Local
- [x] **Archivos**: `backend/src/utils/rateLimitHelpers.js`
- **Acción**: Implementada función `debeOmitirRateLimit(req)` que devuelve `true` si `process.env.NODE_ENV === 'test'` o si (`process.env.NODE_ENV !== 'production'` y `req.ip` es una IP de loopback `127.0.0.1`, `::1`, `::ffff:127.0.0.1`).
- **Hecho cuando**: El helper reconoce correctamente las IPs locales en modo dev/test y devuelve `false` si `NODE_ENV === 'production'`.

### T2: Integrar Bypass en Limitadores Públicos
- [x] **Archivos**: `backend/src/routes/citas.js`, `backend/src/routes/contacto.js`
- **Acción**: Configurada la propiedad `skip: (req) => debeOmitirRateLimit(req)` en `publicCitaLimiter` y `contactoLimiter`.
- **Hecho cuando**: Ambos limitadores utilizan la nueva regla sin alterar su configuración de cuotas (`max: 5`, `15 * 60 * 1000`).

### T3: Validación con Servidor Dev Activo y Suite Completa
- [x] **Archivos**: `backend/scripts/testBlindajeEntradas.js`, `backend/scripts/runTests.js`
- **Acción**: Ejecutado `node scripts/testBlindajeEntradas.js` pasando al 100% con HTTP 400. Ajustado puerto de test aislado (3099) en `runTests.js` para desacoplar el servidor de pruebas del servidor dev. Ejecutado `npm test`.
- **Hecho cuando**: La suite unificada pasa al 100% (40/40 PASS) con 0 fallos.

### T4: Actualización de Documentación SDD
- [x] **Archivos**: `overview/session.md`, `overview/tasks.md`
- **Acción**: Registrada la finalización exitosa de la Spec 019.
- **Hecho cuando**: La memoria de sesión refleja el estado actual y los próximos pasos.
