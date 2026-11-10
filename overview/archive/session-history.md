# Historial de Sesiones — PsicoLau (Specs 001 a 018)

> Archivo histórico de sesiones completadas. Para la ventana activa reciente (Specs 019 en adelante), consultar [`overview/session.md`](../session.md).

---

## Registro Histórico (Specs 010 a 018)

1. **Auditoría General y Spec 011 (Migración a bcryptjs)**:
   - Se ejecutó auditoría general revelando alta clonación de código en `pagos.js` y deudas técnicas en `express`.
   - Se diseñó el roadmap de 4 fases para remediar los hallazgos.
   - Se implementó exitosamente la **Spec 011**, reemplazando la dependencia nativa de `bcrypt` (que traía la vulnerabilidad crítica de `tar`) por la implementación en JavaScript puro `bcryptjs`.
   - Pruebas backend pasando al 100% (incluyendo los scripts de contraseñas y transacciones).
   - `npm audit` se redujo de 4 a 2 alertas (resta arreglar `qs` vía Express).

2. **Auditoría Integral del Proyecto (6 Ejes)**:
   - Dependencias & vulnerabilidades (`npm audit`, `npm outdated`).
   - Suite de 19 tests backend ejecutada al 100% (19/19 PASS).
   - Git & higiene de secretos (0 expuestos).
   - Seguridad backend (CORS, rate limiting, cifrado, JWT, Helmet).
   - Frontend público (meta tags, canonical URLs, CSP).
   - Panel clínico (config, token handling, tamaño de módulos).

3. **Corrección de 9 Hallazgos Priorizados (P0-P2)**:
   - **P0**: Script `migrateEncryptLegacy.js` para cifrar datos legacy (dry-run: 0 registros sin cifrar en BD dev).
   - **P1**: `nodemailer` actualizado de v6.10.1 a v10.0.3 (12 CVEs eliminadas).
   - **P1**: URLs canónicas, `og:url`, JSON-LD y `sitemap.xml` migrados a clean URLs (sin `.html`).
   - **P1**: CORS en desarrollo restringido a localhost/LAN (sin `*`).
   - **P2**: `console.error` -> `logger.error` en `contactoController.js` y `citaController.js`.
   - **P2**: Bug de ruta `editarNotaExpediente` corregido (params `id` vs `notaId`).
   - **P2**: Error handler genérico en producción para errores >=500.
   - **P2**: `sitemap.xml` `lastmod` actualizado a 2026-09-10.

4. **Spec 010 + Plan e Implementación de Modularización del Panel Clínico**:
   - **Spec creada**: `specs/010-modularizacion-panel-js/spec.md` con 24 RFs (EARS) cubriendo 8 módulos JS Agenda, 6 módulos JS Expedientes, 8 partials HTML modales (lazy-load via `fetch`), 15 componentes CSS + entry point `@import` y carga ESM nativa.
   - Implementación concluida con éxito, reduciendo significativamente el peso del DOM en `agenda.html` y aplicando lazy-loading a la Suite Clínica.

5. **Auditoría de Cumplimiento Spec-Driven Development (SDD)**:
   - Se evaluó el cumplimiento de los 6 principios de la Constitución y la trazabilidad de la Spec 010, confirmando Grado A+.

6. **Ejecución y Validación de Spec 012 (Actualización a Express 5.x y Refactor de Controladores)**:
   - Se actualizó `express` a `5.2.1` y se ejecutó `npm audit fix` (**0 vulnerabilidades**).
   - Se centralizó el manejo de excepciones asíncronas nativas en `backend/src/index.js` (`ZodError` -> 400, Prisma `P2002` -> 400).
   - Se refactorizaron los controladores eliminando bloques `try/catch` redundantes.

7. **Ejecución y Validación de Spec 013 (Modularización y Reducción de Duplicación en Pagos)**:
   - Se refactorizó `panel/js/pagos.js` (566 líneas) hacia una arquitectura ESM limpia en `panel/js/pagos/` (`utils/`, `actions/`, `render/`, `export/`, `index.js`).

8. **Ejecución y Validación de Spec 014 (Consolidación del Test Runner Unificado `npm test`)**:
   - Se creó el orquestador inteligente `backend/scripts/runTests.js` y se migraron los 21 scripts de prueba a `node:test` y `node:assert` con ejecución secuencial determinista (`--test-concurrency=1`) y limpieza en bloques `finally`.

9. **Promoción de Reglas Operativas y Hotfixes de Modales y Autocompletado**:
   - Promovidas reglas de CSP (§6.7) y ejecución secuencial (§7.7) en `AGENTS.md`.
   - Hotfix de condiciones de carrera asíncronas en modales (`await asegurarModal(...)`).
   - Hotfix de limpieza reactiva (`datosAutocompletados`) al dejar de coincidir el autocompletado de pacientes y grupos en `panel/js/agenda/form/autocomplete.js`.

10. **Spec 015 (Blindaje de Entradas, Sanitización Anti-Inyecciones y Purga)**:
    - Purga transaccional de 24 registros residuales de prueba (`purgeTestData.js`).
    - Blindaje semántico en `validators.js` (regex Unicode para nombres humanos, bloqueo de XSS/URLs), mitigación de CSV Formula Injection (`CWE-1236`) en `csv.js` y suite adversaria `testBlindajeEntradas.js`.

11. **Spec 016 (Aislamiento de Correos en Entornos de Pruebas y Desarrollo)**:
    - Blindaje de 3 capas en `backend/src/services/emailService.js` (`NODE_ENV === 'test'`, filtro anti-rebote y protección de notificaciones a Laura en desarrollo) + suite `testAislamientoEmail.js`.

12. **Spec 017 (Cifrado Integral de PII de Pacientes y Blindaje Clínico)**:
    - Columna `emailHash String? @unique` (HMAC-SHA256) y cifrado `AES-256-GCM` de PII en tabla `Paciente` (`cifrarPaciente`, `descifrarPaciente`, `migrateEncryptPacientes.js`, `testCifradoPacientes.js`).

13. **Spec 018 (Modularización y Desacoplamiento del Formulario de Citas `app.js`)**:
    - Creación de `panel/js/agenda/form/submitHandler.js`, desacoplamiento de `app.js`, unificación del modal de eliminación `#modalAlcanceSerie` y corrección asíncrona de `#modalCambiarPassword`. Promovida regla §6.10 en `AGENTS.md`.
