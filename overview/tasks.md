# Tareas Activas — PsicoLau

> **Historial Completo**: Para las tareas completadas en las Specs 001 a 018, consultar [`overview/archive/tasks-history.md`](./archive/tasks-history.md).

---

## En Progreso
*Ninguna.*

## Completadas Recientemente (Ventana Activa: Specs 020 a 024)

- [x] **[Spec 024: Blindaje de Errores de Servidor, Sanitización de Respuestas y Resiliencia en UI](../specs/024-sanitizacion-errores-resiliencia-ui/spec.md)** (2026-11-10):
  - **T1**: Creado `backend/src/middlewares/errorHandler.js` con mapeo tipado de errores de Prisma/PostgreSQL a HTTP 503 sin trazas (`stack: undefined`), preservación de errores 4xx legítimos (Zod, P2002, 401), liveness probe ultraligero `GET /api/health` e implementado `GET /api/health/db` para diagnóstico y keep-alive de PostgreSQL con `SELECT 1`.
  - **T2**: Creado módulo ESM transversal `panel/js/errorHelper.js` con sanitización defensiva (intercepta fugas de infraestructura y longitud >120 caracteres) y renderizado accesible de alertas con botón `.btn-reintentar` en paleta oficial `#1E94A8` (`panel/css/components/login.css`).
  - **T3**: Integrada resiliencia y reintento en 1 clic en `panel/index.html` y `panel/js/login.js`, con soporte para fallos de red (`Failed to fetch`), HTTP 500/503 y autofoco en contraseña ante credenciales 401.
  - **T4**: Creada y validada la suite integral `backend/scripts/testSanitizacionErroresSpec024.js` (9/9 pass) y ejecutadas las compuertas de pre-vuelo (33/33 tests Spec 024 aprobados al 100%, 33 módulos ESM y 70 imports validados con 0 errores, ESLint 0 advertencias).

- [x] **[Spec 023: Adopción de Arquitectura de Orquestación Multiagente SDD, Catálogo de Skills, Compuertas Fail-Fast y Homologación de Plantilla Universal (`samples/`)](../specs/023-orquestacion-multiagente-sdd-y-samples/spec.md)** (2026-10-26):
  - **T1**: Creados `.agents/rules/orchestrator.md` y los 4 subagentes en `.agents/agents/` (`builder-frontend`, `builder-backend`, `auditor-calidad` en modo estricto de solo lectura, `devops`).
  - **T2**: Completado el catálogo de 14 skills en `.agents/skills/` adaptado a la identidad y arquitectura de PsicoLau.
  - **T3**: Configurados `.agents/hooks.json`, `scripts/hooks/quickCheck.js`, `scripts/testFrontendSyntax.js` (`32/32` módulos OK), `scripts/testModuleImports.js` (`69/69` imports OK) y `package.json` raíz.
  - **T4**: Actualizados `AGENTS.md` (§2.1, §8) y `GEMINI.md`, y rotada la memoria histórica (Specs 001–018) a `overview/archive/`.
  - **T5**: Homologada la plantilla universal `/home/cris/Documentos/Proyectos/samples/` (`AGENTS.md`, `GEMINI.md`, `README.md`, `prompt-inicial-sdd.md`, `prompts.md`, `overview/archive/`, `code-audit` y `sdd-compliance` agnóstica).
  - **T6**: Creada y validada la suite automatizada `backend/scripts/testSubagentesRuntimeSpec023.js` al 100% junto con `npm run lint`, `npm run test:syntax` y `npm run test:imports`.

- [x] **Ajuste de Redacción del Mensaje de Cobro por WhatsApp** (2026-09-22):
  - Modificado `window.enviarWhatsAppCobro` en `panel/js/whatsapp.js` (*"te dejo los datos para el pago de tu sesión"*) y sincronizado `backend/scripts/testWhatsAppEvaluaciones.js` (`4/4` PASS, commit `eb12608`).

- [x] **[Spec 022: Rediseño Visual de Plantillas de Correo HTML Transaccionales](../specs/022-plantillas-email-notificaciones/spec.md)** (2026-09-13):
  - Helper `construirPlantillaBase` y rediseño institucional de `enviarAvisoLaura`, `enviarConfirmacionPaciente` y `enviarMensajeContacto` en `backend/src/services/emailService.js`, más `backend/scripts/previewEmails.js` (`48/48` PASS, commit `f7d5fe0`).

- [x] **[Spec 021: Cumplimiento Integral de la LFPDPPP, Actualización del Aviso de Privacidad y Validación de Consentimiento](../specs/021-cumplimiento-lfpdppp-aviso-privacidad/spec.md)** (2026-09-12):
  - Actualización de `privacidad.html`, validación `privacyCheck: z.literal(true)` en `validators.js` y `js/main.js`, y suite `testConsentimientoLFPDPPP.js` (`48/48` PASS).

- [x] **[Spec 020: Configuración de Linter Automatizado (ESLint) en Backend](../specs/020-linter-eslint-backend/spec.md)** (2026-09-11):
  - Configuración de `backend/eslint.config.js` (`0` errores / `0` warnings) y blindaje de `.gitignore`.

- [x] **[Spec 019: Aislamiento del Rate Limiter en Entornos Locales y Pruebas](../specs/019-aislamiento-rate-limiter-pruebas/spec.md)** (2026-09-11):
  - Helper `debeOmitirRateLimit` en `backend/src/utils/rateLimitHelpers.js` y puerto aislado `3099` en `runTests.js`.

## Bloqueos Ambientales
- **Base de datos de desarrollo de Supabase inalcanzable** (`FATAL: ENOTFOUND tenant/user postgres.pkkpizbuizxwswizisvu not found`): afecta únicamente a los scripts de prueba que requieren conexión viva a PostgreSQL Dev (proyecto pausado o cambio de host en Supabase).
