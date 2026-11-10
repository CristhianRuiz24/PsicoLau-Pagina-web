# Historial de Tareas Completadas — PsicoLau (Specs 001 a 018)

> Archivo histórico de tareas completadas. Para las tareas activas y recientes (Specs 019 en adelante), consultar [`overview/tasks.md`](../tasks.md).

---

## Tareas Archivadas (Specs 001 a 018)

- [x] **[Spec 018: Modularización y Desacoplamiento del Formulario de Citas (`app.js`)](../../specs/018-modularizacion-formulario-agenda/spec.md)** (2026-09-11):
  - **T1**: Crear módulo ESM `submitHandler.js` en `panel/js/agenda/form/`.
  - **T2**: Integrar e inicializar `submitHandler` en `panel/js/agenda/index.js`.
  - **T3**: Desacoplar `panel/js/app.js` y exponer `window.initAgenda`.
  - **T4-T5**: Verificación de no-regresión, unificación de eliminación con `#modalAlcanceSerie` y carga asíncrona en `#modalCambiarPassword` (40/40 PASS).
- [x] **[Spec 017: Cifrado Integral de Datos Personales Identificables (PII) de Pacientes y Blindaje Clínico](../../specs/017-cifrado-datos-paciente-pii/spec.md)** (2026-09-11):
  - Esquema Prisma con `emailHash`, utilidades `AES-256-GCM` + `HMAC-SHA256`, migración `migrateEncryptPacientes.js`, adaptación de controladores y suite `testCifradoPacientes.js` (40/40 PASS).
- [x] **[Spec 016: Aislamiento de Correos en Entornos de Pruebas y Desarrollo](../../specs/016-aislamiento-emails-entorno-pruebas/spec.md)** (2026-09-11):
  - Blindaje en `emailService.js`, `NODE_ENV: 'test'` en `runTests.js` y suite `testAislamientoEmail.js`.
- [x] **[Spec 015: Blindaje de Entradas, Sanitización Anti-Inyecciones (XSS / CSV) y Purga de Datos](../../specs/015-blindaje-entradas-y-seguridad-datos/spec.md)** (2026-09-11):
  - Purga transaccional (`purgeTestData.js`), validación Unicode en `validators.js`, sanitización CSV (`CWE-1236`) y suite `testBlindajeEntradas.js`.
- [x] **Hotfix: Reversión Automática en Autocompletado de Citas y Grupos** (2026-09-11).
- [x] **Hotfix: Condiciones de Carrera Asíncronas en Modales del Panel** (2026-09-11).
- [x] **[Spec 014: Suite de Tests Automatizados de Integración E2E](../../specs/014-test-runner/spec.md)** (2026-09-11):
  - Consolidación de `backend/scripts/runTests.js` con `--test-concurrency=1` y bloques `finally`.
- [x] **[Spec 013: Modularización y Reducción de Duplicación en Pagos](../../specs/013-refactor-pagos/spec.md)** (2026-09-11):
  - Arquitectura modular ESM en `panel/js/pagos/` (`contabilidad.js`, `periodo.js`, `auditoria.js`, `reporte.js`, `contadora.js`, `csv.js`).
- [x] **[Spec 012: Actualización a Express 5.x y Refactor de Controladores](../../specs/012-upgrade-express-5/spec.md)** (2026-09-11).
- [x] **[Spec 011: Migración a bcryptjs (Seguridad - Dependencias)](../../specs/011-migracion-bcryptjs/spec.md)** (2026-09-11).
- [x] **[Spec 010: Modularización de JS y CSS del Panel Clínico](../../specs/010-modularizacion-panel-js/spec.md)** (2026-09-11):
  - 15 componentes CSS en `panel/css/components/`, 8 modales HTML lazy-load en `panel/partials/modals/`, 10 módulos JS de Agenda y 7 módulos JS de Expedientes.
- [x] **Auditoría Integral del Proyecto y Corrección de 9 Hallazgos (P0-P2)** (2026-09-10).
- [x] **[Spec 009: Plantilla Base y Clon Demo Comercial (PsicoTemplate / PsicoDemo)](../../specs/009-clon-demo-comercial-psicotemplate/spec.md)** (2026-09-09).
- [x] **Blindaje CSP contra Recursos HTTP Inseguros y Auditoría DAST con OWASP ZAP** (2026-09-05).
- [x] **[Spec 008: Hardening de Seguridad Web y Cabeceras (Mozilla Observatory Grade A+)](../../specs/008-seguridad-cabeceras-mozilla-observatory/spec.md)** (2026-09-05).
- [x] **[Spec 006 / 007: Máxima Optimización de Rendimiento y Accesibilidad (100/100 en PageSpeed)](../../specs/007-maxima-optimizacion-pagespeed/spec.md)** (2026-09-02).
- [x] **[Spec 005: Cambio de Contraseña desde el Panel Clínico](../../specs/005-cambio-password-panel/spec.md)** (2026-09-02).
- [x] **[Spec 004: Gestión de Costos en Terapia Grupal, Evaluaciones y Desglose Contable](../../specs/004-desglose-contable-grupal-y-tarifas/spec.md)** (2026-09-01).
- [x] **[Spec 003: Estado Visual y Visibilidad de Citas Canceladas en Matriz Semanal](../../specs/003-visibilidad-citas-canceladas/spec.md)** (2026-09-01).
- [x] **[Spec 002: Gestión y Edición de Citas Recurrentes en Serie](../../specs/002-edicion-citas-recurrentes/spec.md)** (2026-09-01).
- [x] **[Spec 001: Reporte Contable Mensual de Ingresos](../../specs/001-reporte-contable-ingresos/spec.md)** (2026-08-28).
