# Tareas: Aislamiento de Correos en Entornos de Pruebas y Desarrollo (Spec 016)

- [x] **T1. Blindaje e Intercepción en `backend/src/services/emailService.js` (RF-1, RF-2, RF-3)**
  - [x] Implementar helper de detección de dominios de prueba (`@local.com`, `@test.com`, `@example.com`, etc.).
  - [x] Interceptar llamadas en `NODE_ENV === 'test'` retornando objeto mock con `simulated: true`.
  - [x] Interceptar envíos a dominios ficticios evitando rebotes en Resend.
  - [x] Interceptar avisos a Laura en entornos locales de desarrollo si no está activo `ENABLE_REAL_EMAILS_DEV`.

- [x] **T2. Configuración Determinista del Entorno de Pruebas en `backend/scripts/runTests.js` (RF-4)**
  - [x] Inyectar `NODE_ENV: 'test'` en `startEphemeralServer` (`spawn`).
  - [x] Inyectar `NODE_ENV: 'test'` en la ejecución del runner de pruebas (`spawn('node', ['--test', ...])`).

- [x] **T3. Suite Automatizada de Aislamiento de Email (RF-5)**
  - [x] Crear `backend/scripts/testAislamientoEmail.js` con `node:test` y `node:assert`.
  - [x] Validar casos unitarios de simulación en test, dominios ficticios y aviso local a Laura.
  - [x] Integrar en el ciclo de limpieza con bloque `finally`.

- [x] **T4. Ejecución y Verificación de Suite Completa**
  - [x] Ejecutar `npm test` en `backend/` verificando 100% PASS (23 archivos y 33 tests).
  - [x] Comprobar que `testBlindajeEntradas.js` no emite peticiones salientes a Resend.

