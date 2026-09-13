# Tareas Activas - PsicoLau

## En Progreso
*Ninguna.*

## Completadas Recientemente
- [x] **[Spec 022: Rediseño Visual de Plantillas de Correo HTML Transaccionales](../specs/022-plantillas-email-notificaciones/spec.md)** (2026-09-13):
  - **T1**: Helper de Layout Base (`construirPlantillaBase`) y rediseño institucional de `enviarAvisoLaura` con cabecera corporativa `#EC5E86`, tarjeta con datos estructurados y botón CTA turquesa (`#1E94A8`) hacia `https://psicolau.com/panel`, eliminando definitivamente el texto plano legacy *"Revisa el panel de administración para confirmarla"*.
  - **T2**: Rediseño de `enviarConfirmacionPaciente` (mensaje empático, sesión destacada, firma profesional de Laura y botón directo a WhatsApp) y `enviarMensajeContacto` (ficha del remitente, cita del mensaje y botón de respuesta rápida por correo).
  - **T3**: Creación del script `backend/scripts/previewEmails.js` y generación exitosa de vistas previas HTML en `scratch/email-previews/` con renderizado responsive impecable.
  - **T4**: Verificación de linter `npm run lint` (0 errores, 0 advertencias) y suite unificada de backend `npm test` ejecutando 23 archivos y aprobando el 100% de las pruebas (**48/48 PASS** en 59s).
  - **T5**: Documentación de sesión actualizada en `session.md` y `tasks.md`.
- [x] **[Spec 021: Cumplimiento Integral de la LFPDPPP, Actualización del Aviso de Privacidad y Validación de Consentimiento](../specs/021-cumplimiento-lfpdppp-aviso-privacidad/spec.md)** (2026-09-12):
  - **T1**: Actualización exhaustiva de [privacidad.html](file:///c:/Users/crist/Documents/Proyectos/Web%20PsicoLau/privacidad.html) incorporando las cláusulas de Remisiones y Transferencias en la Nube (Art. 36/37 LFPDPPP, Art. 49 RLFPDPPP), Declaración de Cookies y Tecnologías Similares (Lineamiento 31 INAI), Excepción Médica Legal de Retención de 5 Años y Bloqueo (NOM-004-SSA3-2012 / Art. 26 Fracc. II LFPDPPP) y plazos ARCO completos (20 días de respuesta + 15 días de cumplimiento, Art. 32 LFPDPPP).
  - **T2**: Validación semántica estricta en backend de `privacyCheck: true` en `contactoSchema` dentro de [validators.js](file:///c:/Users/crist/Documents/Proyectos/Web%20PsicoLau/backend/src/utils/validators.js).
  - **T3**: Extracción y transmisión del consentimiento `privacyCheck: true` en el payload JSON del formulario de contacto en [main.js](file:///c:/Users/crist/Documents/Proyectos/Web%20PsicoLau/js/main.js).
  - **T4**: Creación y validación de suite automatizada `testConsentimientoLFPDPPP.js` (8/8 aserciones unitarias y HTTP en verde).
  - **T5**: Verificación integral de no-regresión y linter: `npm run lint` (0 errores) y suite unificada `npm test` aprobando el 100% (48/48 tests en verde en 58s).
  - **T6**: Documentación SDD actualizada en `session.md` y `tasks.md`.

- [x] **[Spec 020: Configuración de Linter Automatizado (ESLint) en Backend](../specs/020-linter-eslint-backend/spec.md)** (2026-09-11):
  - **T1**: Instalación de `eslint` (^10.10.0) en `devDependencies` de `backend/package.json`.
  - **T2**: Configuración moderna de Flat Config `backend/eslint.config.js` adaptada para Node.js ESM y CommonJS, ignorando variables con prefijo `_`.
  - **T3**: Incorporación del script canónico `"lint": "eslint src/ scripts/"` en `backend/package.json` y corrección de advertencias residuales de variables no utilizadas en controladores y scripts de migración. `npm run lint` pasa con 0 errores y 0 advertencias.
  - **T4**: Verificación integral de no-regresión (`npm test` 40/40 tests aprobados al 100% en 58s) y documentación SDD.

- [x] **[Spec 019: Aislamiento del Rate Limiter en Entornos Locales y Pruebas](../specs/019-aislamiento-rate-limiter-pruebas/spec.md)** (2026-09-11):
  - **T1**: Implementación de `backend/src/utils/rateLimitHelpers.js` con función `debeOmitirRateLimit` para loopback en entornos no productivos y omisión total en tests.
  - **T2**: Integración de `debeOmitirRateLimit` en `publicCitaLimiter` ([citas.js](file:///c:/Users/crist/Documents/Proyectos/Web%20PsicoLau/backend/src/routes/citas.js)) y `contactoLimiter` ([contacto.js](file:///c:/Users/crist/Documents/Proyectos/Web%20PsicoLau/backend/src/routes/contacto.js)).
  - **T3**: Aislamiento del servidor de pruebas efímero en puerto 3099 en `runTests.js` para desacoplamiento total del servidor de desarrollo en 3001. Validación al 100% de `testBlindajeEntradas.js` (400 Bad Request) y de la suite completa `npm test` con **40/40 tests aprobados (100% PASS)**.
  - **T4**: Documentación SDD actualizada en `session.md` y `tasks.md`.

- [x] **[Spec 018: Modularización y Desacoplamiento del Formulario de Citas (`app.js`)](../specs/018-modularizacion-formulario-agenda/spec.md)** (2026-09-11):
  - **T1**: Crear módulo ESM `submitHandler.js` en `panel/js/agenda/form/` desacoplando la lógica de validación, sanitización de prefijos, series recurrentes y persistencia.
  - **T2**: Integrar e inicializar `submitHandler` en `panel/js/agenda/index.js`.
  - **T3**: Desacoplar `panel/js/app.js` (eliminadas 173 líneas de listener procedimental legacy) y exponer `window.initAgenda`.
  - **T4**: Verificación Integral de No-Regresión en Local y Backend: Diagnóstico y resolución de interacción en botón de eliminar citas (`.btn-del` en tarjetas y `#btnEliminarModal` en modal con modal visual unificado, paso de `event.stopPropagation()` y delegación de eventos). Suite automatizada pasando 40/40 tests (100% verde).
- [x] **[Spec 017: Cifrado Integral de Datos Personales Identificables (PII) de Pacientes y Blindaje Clínico](../specs/017-cifrado-datos-paciente-pii/spec.md)** (2026-09-11):
  - **T1**: Prisma schema actualizado con `emailHash String? @unique` y sincronización con Supabase Dev via `npx prisma db push`.
  - **T2**: Utilidades criptográficas AES-256-GCM para PII (`cifrarPaciente`, `descifrarPaciente`, `esCifrado`) e índice ciego determinista HMAC-SHA256 (`generarBlindIndex`) en `crypto.js`.
  - **T3**: Migración transaccional idempotente en Dev (`migrateEncryptPacientes.js`): 10 pacientes migrados íntegramente a formato cifrado `iv:tag:ciphertext` con 0 datos en texto plano.
  - **T4**: Controladores y helpers adaptados (`agendaController`, `citaController`, `expedienteController`, `agendaHelpers`): Cifrado automático al persistir y descifrado transparente en memoria para respuestas autorizadas.
  - **T5**: Suite automatizada `testCifradoPacientes.js` con aserciones estrictas de integridad y cifrado en base de datos.
  - **T6**: Verificación integral del Panel Clínico (`verifyPanelIntegration.js`) y suite de no-regresión unificada (`npm test`): 40/40 tests aprobados al 100%.

- [x] **[Spec 016: Aislamiento de Correos en Entornos de Pruebas y Desarrollo](../specs/016-aislamiento-emails-entorno-pruebas/spec.md)** (2026-09-11):
  - Blindaje e intercepción en `emailService.js`: Modo test (`NODE_ENV === 'test'`), filtro anti-rebote para dominios ficticios (`@local.com`, `@test.com`, etc.) y protección de notificaciones a Laura en desarrollo local.
  - Inyección determinista de `NODE_ENV: 'test'` en `runTests.js` para servidores efímeros y proceso de pruebas.
  - Creación de suite `testAislamientoEmail.js` con aserciones nativas y validación 100% de la suite completa.




- [x] **Spec 015: Blindaje de Entradas, Sanitización Anti-Inyecciones (XSS / CSV) y Purga de Datos (2026-09-11)**:
  - Purga transaccional idempotente en base de datos (`purgeTestData.js`): 24 registros de prueba (10 de ZAP, 13 huérfanos de test, 1 anómalo de 1980) eliminados con éxito, restaurando el directorio a exactamente 10 pacientes y grupos legítimos de Laura.
  - Blindaje semántico en `validators.js`: Regex Unicode para nombres humanos reales (`/^[\p{L}\s.'\-]+$/u`), bloqueo estricto de URLs y etiquetas HTML en formularios públicos, soporte de prefijos `[GRUPAL]`/`[BLOQUEO]` solo en panel autenticado, validación de teléfonos internacionales (7 a 20 dígitos) y control anti-spam de mensajes (máximo 2 enlaces, cero tags ejecutables).
  - Mitigación contra CSV Formula Injection CWE-1236 en `csv.js` (`sanitizarCeldaCSV` antepone `'` para forzar renderizado de texto en Excel).
  - Creación de suite adversaria `testBlindajeEntradas.js` integrada en el runner unificado `npm test`.
  - Validación 100% de la suite completa: 27/27 tests pasando en verde sin regresiones.



## Spec 010: Modularización de JS y CSS del Panel Clínico (EN PLANIFICACIÓN)

### Fase 0: Preparación (15 min)
- [x] **T0.1** Crear estructura de carpetas:
  - panel/js/agenda/ (subcarpetas: render/, form/, actions/, ui/, utils/)
  - panel/js/expedientes/ (subcarpetas: render/, form/, ui/, utils/)
  - panel/partials/modals/
  - panel/css/components/

### Fase 1: CSS - Componentes (2 h)
- [x] **T1.1** Extraer login.css desde panel.css (líneas 27-115)
- [x] **T1.2** Extraer header.css desde panel.css (líneas 117-321)
- [x] **T1.3** Extraer agenda-controls.css desde panel.css (líneas 322-430)
- [x] **T1.4** Extraer easy-table.css desde panel.css (líneas 479-1018) - matriz, tarjetas, badges, animaciones
- [x] **T1.5** Extraer modals.css desde panel.css (base + específicos)
- [x] **T1.6** Extraer expedientes-directorio.css desde panel.css (líneas 1844-1940)
- [x] **T1.7** Extraer expedientes-paciente.css (cabecera, buscador, acciones)
- [x] **T1.8** Extraer expedientes-notas.css (tarjetas .nota-expediente-card, grid campos)
- [x] **T1.9** Extraer expedientes-detalle.css (vista ampliada, edición in-situ)
- [x] **T1.10** Extraer auditoria-pagos.css (líneas 1104-1249)
- [x] **T1.11** Extraer datos-pago.css (líneas 1257-1266)
- [x] **T1.12** Extraer cambiar-password.css (estilos específicos modal seguridad)
- [x] **T1.13** Extraer notas-semana.css (modal bloc notas)
- [x] **T1.14** Extraer responsive.css (líneas 1350-1808)
- [x] **T1.15** Extraer print.css (líneas 1832-1838)
- [x] **T1.16** Crear panel/css/panel.css entry point con 15 @import ordenados

### Fase 2: HTML Partials - Modales (1.5 h)
- [x] **T2.1** Extraer modal-nueva-cita.html (líneas 123-381 de agenda.html)
- [x] **T2.2** Extraer modal-notas-semana.html (líneas 384-399)
- [x] **T2.3** Extraer modal-auditoria-pagos.html (líneas 402-438)
- [x] **T2.4** Extraer modal-datos-pago.html (líneas 441-483)
- [x] **T2.5** Extraer modal-cambiar-password.html (líneas 486-544)
- [x] **T2.6** Extraer modal-directorio-expedientes.html (líneas 547-579)
- [x] **T2.7** Extraer modal-expediente-paciente.html (líneas 582-750+)
- [x] **T2.8** Extraer modal-detalle-sesion.html (restante del modal en agenda.html)
- [x] **T2.9** Limpiar agenda.html: eliminar 8 modales, mantener solo estructura base (header, controls, table wrapper)
- [x] **T2.10** Verificar que agenda.html sigue válido (sin modales, solo contenedores vacíos para inyección)

### Fase 3: JS Agenda - 8 Módulos + Entry Point (3 h)
- [x] **T3.1** Crear panel/js/agenda/utils/colors.js (RF-08): PALETA_COLORES, getColoresPersonalizados(), guardarColorPersonalizado(), renderSwatches(), getContrastColor(), obtenerSiguienteColorDisponible()
- [x] **T3.2** Crear panel/js/agenda/utils/phone.js (RF-05 + shared): parsearTelefono(), actualizarPlaceholderTelefono()
- [x] **T3.3** Crear panel/js/agenda/render/weeklyTable.js (RF-02): renderEasyTable(), horasSlots, cambiarSemana(), irHoy(), setFiltroDias(), actualizarUIFiltroDias(), imprimirAgenda(), stats semanales
- [x] **T3.4** Crear panel/js/agenda/render/appointmentCard.js (RF-03): HTML tarjeta .appointment-block, badges, barra acciones, clases dinámicas (is-blocked, is-group, is-evaluacion, is-completed, is-cancelled, is-highlighted, is-dimmed)
- [x] **T3.5** Crear panel/js/agenda/form/autocomplete.js (RF-05): actualizarDatalistPacientes(), manejarInputNombrePaciente(), autoDetectarColorPaciente(), establecerMontoCortesia(), calcularTotalGrupal()
- [x] **T3.6** Crear panel/js/agenda/form/modal.js (RF-04): abrirModal(), cerrarModal(), seleccionarTipoRegistro(), setModoFormulario(), mostrarModalDirecto(), toggleOpcionesRecurrencia(), window.seleccionarEstadoModal(), window.abrirModal(), window.cerrarModal(), window.seleccionarTipoRegistro(), window.toggleOpcionesRecurrencia(), window.establecerMontoCortesia(), window.calcularTotalGrupal()
- [x] **T3.7** Crear panel/js/agenda/actions/citaState.js (RF-06): toggleCompletarCita(), toggleCancelarCita(), toggleReactivarCita(), togglePagoDirecto(), abrirZoomSesion(), enviarWhatsAppRecordatorio(), enviarWhatsAppCobro(), editarCita(), eliminarCita(), agendarEnCelda(), window.editarCita(), window.eliminarCita(), window.agendarEnCelda(), window.abrirZoomSesion()
- [x] **T3.8** Crear panel/js/agenda/ui/notasSemana.js (RF-07): toggleNotasSemana(), cargarNotasConsultorio(), guardarNotasConsultorio(), window.toggleNotasSemana()
- [x] **T3.9** Crear panel/js/agenda/index.js (RF-01, RF-21): Entry point ESM, importar 8 módulos, exponer API mínima en window (RF-23): initAgenda, filtrarCitasEnTabla, limpiarBusqueda, abrirDirectorioExpedientes, abrirExpedientePorCita, abrirModalReporteMensual, abrirModalAuditoriaPagos, abrirModalDatosPago, toggleNotasSemana, abrirModalCambiarPassword, logout
- [x] **T3.10** Migrar onclick inline en partials HTML - addEventListener delegado en cada módulo correspondiente

### Fase 4: JS Expedientes - 6 Módulos + Entry Point + Lazy Load (3 h)
- [x] **T4.1** Crear panel/js/expedientes/utils/api.js (RF-15): getAuthHeaders(), helpers fetch reutilizables
- [x] **T4.2** Crear panel/js/expedientes/directorio.js (RF-10): abrirDirectorioExpedientes(), cerrarDirectorioExpedientes(), renderDirectorioPacientes(), filtrarDirectorioExpedientes(), cargarDirectorioEnSegundoPlano(), eliminarPacienteDirectorio(), window.abrirDirectorioExpedientes(), window.cerrarDirectorioExpedientes(), window.filtrarDirectorioExpedientes()
- [x] **T4.3** Crear panel/js/expedientes/paciente.js (RF-11): abrirExpedientePorId(), abrirExpedientePorCita(), cerrarModalExpediente(), actualizarCabeceraExpediente(), volverAlDirectorioExpedientes(), toggleMaximizarModalExpediente(), window.abrirExpedientePorId(), window.abrirExpedientePorCita(), window.cerrarModalExpediente(), window.volverAlDirectorioExpedientes()
- [x] **T4.4** Crear panel/js/expedientes/render/notasList.js (RF-12): renderListaNotasExpediente(), resaltarTexto(), escapeHtmlText(), buscarEnNotasExpediente() (debounce), window.buscarEnNotasExpediente()
- [x] **T4.5** Crear panel/js/expedientes/form/notaForm.js (RF-13): mostrarFormularioNuevaNota(), ocultarFormularioNota(), guardarNotaExpediente(), editarNotaExpedienteModal(), eliminarNotaExpedienteConfirm(), window.mostrarFormularioNuevaNota(), window.ocultarFormularioNota(), window.guardarNotaExpediente(), window.editarNotaExpedienteModal(), window.eliminarNotaExpedienteConfirm()
- [x] **T4.6** Crear panel/js/expedientes/ui/detalleSesion.js (RF-14): abrirDetalleSesion(), cerrarDetalleSesion(), editarNotaDesdeDetalle(), guardarEdicionInSituDetalle(), cancelarEdicionInSituDetalle(), toggleAgrandarDetalleSesion(), imprimirNotaActualDetalle(), descargarNotaActualTxt(), imprimirNotaIndividual(), descargarNotaIndividualTxt(), window.abrirDetalleSesion(), window.cerrarDetalleSesion(), window.imprimirNotaIndividual(), window.descargarNotaIndividualTxt()
- [x] **T4.7** Crear panel/js/expedientes/index.js (RF-09, RF-22): Entry point lazy-load, exportar funciones públicas, cargar partials HTML vía fetch() al abrir
- [x] **T4.8** Actualizar panel/js/app.js: import(/panel/js/expedientes/index.js) dinámico en handlers de Expedientes y tarjeta cita-expediente
- [x] **T4.9** Migrar onclick inline en partials expedientes - addEventListener delegado

### Fase 5: Integración y Wiring (1 h)
- [x] **T5.1** Cambiar agenda.html: script type=module src=/panel/js/agenda/index.js (reemplazar script actual)
- [x] **T5.2** Verificar que panel/panel.css entry point carga 15 componentes correctamente
- [x] **T5.3** Wiring eventos delegados en todos los partials (8 modales agenda + expedientes)
- [x] **T5.4** Testing humo local: login - agenda carga - navegar semanas - abrir modal nueva cita

### Fase 6: Verificación Completa (1.5 h)
- [x] **T6.1** Ejecutar suite backend: node backend/scripts/testContabilidad.js (19/19 PASS)
- [x] **T6.2** Checklist manual RF-26 (16 puntos):
  - [x] Login - Agenda: semana actual, navegar semanas, filtro 5/7 días
  - [x] Crear cita individual / evaluación / grupal / bloqueo (con/sin recurrencia)
  - [x] Editar cita (cambiar tipo, fecha, hora, color, monto, Zoom, recurrencia)
  - [x] Marcar realizada / cancelar / reactivar / toggle pago desde tarjeta
  - [x] Abrir Zoom, WhatsApp recordatorio, WhatsApp cobro desde tarjeta
  - [x] Buscador global (pacientes, histórico, futuro)
  - [x] Imprimir agenda semanal
  - [x] Bloc de notas de la semana
  - [x] Directorio de expedientes (buscar, abrir, ver contador notas/citas)
  - [x] Expediente paciente: lista notas, buscar en notas, nueva nota, editar, eliminar
  - [x] Vista ampliada sesión (leer, editar in-situ, imprimir PDF, guardar .txt)
  - [x] Auditoría pagos (semana / todas, WhatsApp cobro, toggle pagado)
  - [x] Datos de cobro (guardar, usar en WhatsApp)
  - [x] Cambio de contraseña
  - [x] Responsive móvil (<=900px, <=480px)
  - [x] Impresión / PDF agenda y notas
- [x] **T6.3** Verificar CSP: sin errores consola, unsafe-inline solo en onclick legacy mínimos

### Fase 7: Documentación (30 min)
- [x] **T7.1** Actualizar overview/architecture.md: diagrama módulos JS, flujo lazy-load, estructura CSS
- [x] **T7.2** Actualizar overview/session.md: qué se logró, en qué quedó, próximo paso
- [x] **T7.3** Actualizar overview/tasks.md: marcar tareas completadas, mover Spec 010 a Completadas

---

## Tareas Futuras (Roadmap de Refactorización y Deuda Técnica)
*Todas las 4 recomendaciones del roadmap de auditoría han sido completadas con éxito.*

## Completadas Recientemente
- [x] **Hotfix: Reversión Automática en Autocompletado de Citas y Grupos (2026-09-11)**:
  - Implementación de rastreador de estado reactivo `datosAutocompletados` en `panel/js/agenda/form/autocomplete.js`.
  - Reversión automática a valores limpios/por defecto de correo, teléfono, prefijo `+52`, Zoom, monto (`500` / `4000`) y color sugerido cuando el nombre deja de coincidir (ej. "Cristhian" -> "Cristhian 2") o al vaciar el campo.
  - Reversión precisa en Terapia Grupal (`GRUPAL`) para Zoom grupal y color `#8b5cf6`.
  - Protección del modo de edición de citas existentes (`nc_id` con valor) para preservar datos guardados.
  - Sincronización en `panel/js/agenda/form/modal.js` y `panel/js/agenda.js`.
  - Validación de sintaxis con `node -c` y 100% de la suite de backend `npm test` aprobada (26/26 PASS).
- [x] **Hotfix: Condiciones de Carrera Asíncronas en Modales del Panel (2026-09-11)**:
  - Corrección de prellenado de fecha y hora en `abrirModal` y blindaje con `await asegurarModal` en `agendarEnCelda`, `editarCita` y `revisarCitaCancelada`.
  - Desacoplamiento de `asegurarModal` en `panel/js/pagos/actions/modal.js` y `panel/js/agenda/index.js`.
- [x] **Spec 014: Suite de Tests Automatizados de Integración E2E (2026-09-11)**:
  - Consolidación del test runner unificado bajo `npm test` con `node scripts/runTests.js`.
  - Detección automática del estado del servidor en `localhost:3001` con levantamiento y cierre automático de instancia efímera de pruebas si no está en ejecución.
  - Migración de los 21 archivos de pruebas y verificaciones en `backend/scripts/` a la API nativa `node:test` y `node:assert` (ejecución secuencial determinista `--test-concurrency=1`).
  - Garantía constitucional de limpieza en base de datos mediante bloques `finally` en todas las pruebas.
  - Validación 100% de la suite completa: 26 tests/subtests pasando en 66 segundos con 0 fallos (`npm test`).
- [x] **Spec 013: Modularización y Reducción de Duplicación en Pagos (2026-09-11)**:
  - Creación de la arquitectura modular ESM en `panel/js/pagos/` (`utils/`, `render/`, `export/`, `actions/`, `index.js`).
  - Centralización de la lógica matemática de contabilidad (`detectarTipoCita`, `obtenerMontoSesion`, `formatearMoneda`, `obtenerCitasReportePeriodo`) en `utils/contabilidad.js`, eliminando la duplicación en `reporte.js`, `contadora.js` y `csv.js`.
  - Reemplazo de `panel/js/pagos.js` con un puente/shim de retrocompatibilidad y actualización de `agenda.html` a `type="module"`.
  - Validación 100% de tests unitarios (`testPagosModulos.mjs`), auditoría contable (`testContabilidad.js`, `testContabilidadMesCompleto.js`) y verificación de sintaxis sin errores.
- [x] **Spec 012: Actualización a Express 5.x y Refactor de Controladores**:
  - Migración a `express@5.2.1` y resolución completa de vulnerabilidades moderadas de `qs` (`npm audit`: 0 vulnerabilidades).
  - Corrección de sintaxis de ruta 404 para Express 5 (`app.use('/api', ...)` en lugar de wildcard incompatible).
  - Manejo centralizado nativo de excepciones asíncronas en `backend/src/index.js` (incluyendo formateo de `ZodError` y `P2002`).
  - Refactorización de todos los controladores (`agendaController.js`, `authController.js`, `citaController.js`, `contactoController.js`, `expedienteController.js`) eliminando bloques `try/catch` redundantes y reduciendo indentación.
  - Verificación de pruebas: 19/19 suites ejecutadas y aprobadas al 100%.
- [x] **Spec 011: Migración a bcryptjs (Seguridad - Dependencias)**: Eliminación exitosa de la dependencia C++ `bcrypt` para adoptar la versión 100% JS `bcryptjs`, mitigando 2 CVEs asociadas a `tar` y `@mapbox/node-pre-gyp`. Suites de pruebas pasando al 100%.
- [x] **Auditoría SDD (Spec-Driven Development) Completa**: Generación del artefacto de reporte evaluando trazabilidad de specs, principios constitucionales (AES-256-GCM, Aislamiento, Frontend Ligero, Auth), integridad de la documentación (session, tasks, architecture, learning) e integridad visual de la paleta. Veredicto: Grado A+.
- [x] **Spec 010: Modularización de JS y CSS del Panel Clínico (2026-09-11)**:
  - 15 Componentes CSS modulares en `panel/css/components/` con entry points W3C `@import` compatibles (`panel/css/panel.css` y `panel/panel.css`).
  - 8 Modales HTML extraídos a partials bajo demanda en `panel/partials/modals/` con helper `asegurarModal()` (`fetch()`), reduciendo `agenda.html` de 972 a 303 líneas (-69% DOM inicial).
  - 10 Módulos JS ESM para la Agenda (`panel/js/agenda/`) organizados por dominios (`actions/`, `form/`, `render/`, `ui/`, `utils/`).
  - 7 Módulos JS ESM para Expedientes Clínicos (`panel/js/expedientes/`) con carga dinámica bajo demanda (`import()`), reduciendo >60 KB de carga inicial.
  - Verificación estricta sin regresiones (100% test suites backend, sintaxis Node.js validada, resolución íntegra de imports, CSP grado A+ compatible).
- [x] **Auditoría Integral del Proyecto y Corrección de 9 Hallazgos (P0-P2)**...
- [x] **Spec 009: Plantilla Base y Clon Demo Comercial (PsicoTemplate / PsicoDemo)**...
- [x] **Blindaje CSP contra Recursos HTTP Inseguros (Mozilla Observatory)**.
- [x] **Hotfix Crítico: Desacoplamiento de Login y Segmentación de CSP en Cloudflare Pages**.
- [x] **Auditoría de Seguridad Dinámica (DAST) con OWASP ZAP**.
- [x] **Spec 008: Hardening de Seguridad Web y Cabeceras (Mozilla Observatory Grade A+)**.
- [x] **Spec 007: Máxima Optimización de Rendimiento y Accesibilidad (100/100 en PageSpeed)**.
- [ ] **Spec 006: Optimización Web Integral y Rendimiento PageSpeed (Core Web Vitals)**.
- [x] **Spec 005: Cambio de Contraseña desde el Panel Clínico**.
- [x] **Spec 004: Gestión de Costos en Terapia Grupal, Evaluaciones y Desglose Contable**.
- [x] **Spec 003: Estado Visual y Visibilidad de Citas Canceladas en Matriz Semanal**.
- [x] **Spec 002: Gestión y Edición de Citas Recurrentes en Serie**.

## Bloqueos
*Ninguno.*
