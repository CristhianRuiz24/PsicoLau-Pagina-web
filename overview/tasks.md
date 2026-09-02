# Tareas Activas — PsicoLau

## En Progreso
*Ninguna tarea activa por el momento.*

## Completadas Recientemente
- [x] **Optimización Ergonómica de Barra de Exportación y Protección de Privacidad**:
  - [x] Retiro de botón redundante `Copiar para WhatsApp` para blindar la confidencialidad de nombres de pacientes con terceros.
  - [x] Consolidación de barra de acciones en 3 botones limpios (`Contadora`, `Excel`, `Imprimir/PDF`) y modal ampliado a 1060px sin desbordamientos.
  - [x] Depuración de registros temporales de prueba en la base de datos dev y blindaje con cleanup en `verifyEndpoints.js`.
- [x] **Mejoras y Hardening Post-Auditoría Técnica**:
  - [x] Higiene de Git: Eliminación de plantillas huérfanas en raíz y configuración en `.gitignore`.
  - [x] Hardening CSP: Integración de `object-src 'none'` y `base-uri 'self'` en cabeceras de Cloudflare Pages (`_headers`).
  - [x] Rate Limiting Diferenciado: Implementación de `agendaMutationLimiter` (45 req/min) para mutaciones en `backend/src/routes/agenda.js`.
  - [x] Logging Seguro: Creación de `backend/src/utils/logger.js` y sanitización de trazas en producción para `agendaController`, `expedienteController` y `authController`.
  - [x] Modularización de Backend: Extracción de lógica pura a `backend/src/utils/agendaHelpers.js` y validación de 0 regresiones con batería de 7 tests automatizados al 100%.
- [x] **Correcciones y Blindaje Clínico (P1 a P4)**:

  - [x] P1: Textos de WhatsApp para Evaluaciones, Zoom y apertura sin bloqueo con persistencia de teléfono (`panel/js/whatsapp.js`).
  - [x] P2: Etiquetas `(opcional)` y prevención de autocompletado en Correo y Teléfono (`panel/agenda.html`).
  - [x] P3: Sincronización de contadores semanales en cabecera para sesiones grupales y evaluaciones (`panel/js/agenda.js`).
  - [x] P4: Blindaje del backend ante colisiones de correo y eliminación del Error 500 (`backend/src/controllers/agendaController.js`).
- [x] **Spec 004: Gestión de Costos en Terapia Grupal, Evaluaciones y Desglose Contable Mensual por Tarifas** (T1 a T6 completadas y validadas con tests)
  - [x] T1: Cuarta Pestaña de Evaluación y Calculadora Grupal en Modal (`panel/agenda.html` & `panel/js/agenda.js`)
  - [x] T2: Persistencia de Monto para Evaluaciones y Citas Grupales (`panel/js/app.js`, `panel/js/agenda.js`, `backend/src/controllers/agendaController.js`)
  - [x] T3: Inclusión Financiera en el Reporte Mensual (`panel/js/pagos.js`)
  - [x] T4: Motor de Agrupación por Tarifas y Botón "Copiar para Contadora" (`panel/agenda.html`, `panel/js/pagos.js`, `panel/panel.css`)
  - [x] T5: Exportación CSV para Excel con Tipo de Servicio (`panel/js/pagos.js`)
  - [x] T6: Suite de Pruebas Automatizadas con Dataset Real de 37 Citas ($22,500 MXN) (`backend/scripts/testReporteContadoraDesglose.js`)
- [x] **Spec 003: Estado Visual y Visibilidad de Citas Canceladas en Matriz Semanal**
- [x] **Spec 002: Gestión y Edición de Citas Recurrentes en Serie**
- [x] **Auditoría Integral Contable y Adaptación Ergonómica para Móviles**
- [x] **Búsqueda Dinámica e Insensible a Acentos por Número de Sesión en Expedientes**
- [x] **Corrección de Papelera a Borrado Definitivo (DELETE)**

## Bloqueos
*Ninguno.*
