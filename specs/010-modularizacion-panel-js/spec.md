# Spec 010 - Modularización de JS y CSS del Panel Clínico

> **Proyecto:** PsicoLau — Suite Clínica (/panel)
> **Tipo:** Refactor / Arquitectura (deuda técnica priorizada en Auditoría 2026-09-10)
> **Estado:** COMPLETADA (Implementada y Auditada)

---

## 1. Contexto y Justificación

La auditoría integral (2026-09-10) identificó **deuda técnica crítica** en el panel clínico:

| Archivo | Tamaño | Problema |
|---------|--------|----------|
| panel/js/agenda.js | ~66 KB / 1800+ líneas | Monolito: renderizado tabla, lógica formularios, modales, autocompletado, recurrencias, estados, Zoom, WhatsApp, impresión, notas semanales |
| panel/js/expedientes.js | ~64 KB / 1300+ líneas | Monolito: directorio pacientes, expediente individual, 8 campos clínicos, búsqueda, formulario notas, vista ampliada, edición in-situ, impresión, exportación |
| panel/agenda.html | ~70 KB | 8 modales incrustados (Nueva Cita, Expedientes, Auditoría Pagos, Datos Cobro, Seguridad, Directorio, Notas Semana, Detalle Sesión) |
| panel/panel.css | ~49 KB / 2400+ líneas | Todo junto: login, agenda, tablas, modales, expedientes, auditoría, responsive, impresión |

**Impacto real:**
- Mantenibilidad nula: cambios en agenda rompen expedientes y viceversa
- Auditoría de seguridad difícil (superficie de código enorme en un archivo)
- Onboarding imposible para nuevo desarrollador
- Tests unitarios inviables (dependencias globales window.* acopladas)
- Carga inicial innecesaria: todo el JS del panel se descarga aunque solo se use una vista

---

## 2. Objetivo

Dividir el código monolítico en **módulos ES6 por responsabilidad única**, manteniendo:
- **Cero regresiones funcionales** (suite 19/19 tests backend + verificación manual completa del panel)
- **Compatibilidad total** con navegadores modernos (ESM nativo, sin build step)
- **Carga bajo demanda** (dynamic import()) para modales y vistas pesadas
- **API pública estable** en window solo para lo estrictamente necesario (hooks de onclick en HTML)

---

## 3. Requisitos Funcionales (EARS)

### 3.1 Estructura de Módulos JS — Agenda

**RF-01** — **CUANDO** se carga panel/agenda.html **EL SISTEMA DEBERÁ** importar un punto de entrada único panel/js/agenda/index.js que orqueste los submódulos de agenda.

**RF-02** — **EL MÓDULO** agenda/render/weeklyTable.js **DEBERÁ** encapsular toda la lógica de renderEasyTable(), horasSlots, estadísticas semanales (statTotalCitas, statPagadas, statPorPagar), y navegación de semanas (cambiarSemana, irHoy, setFiltroDias).

**RF-03** — **EL MÓDULO** agenda/render/appointmentCard.js **DEBERÁ** encapsular la generación de HTML de tarjetas de cita (.appointment-block), badges, barra de acciones rápidas (Zoom, WhatsApp, Cobro, Editar, Eliminar, Pago), y clases CSS dinámicas (is-blocked, is-group, is-evaluacion, is-completed, is-cancelled, is-highlighted, is-dimmed).

**RF-04** — **EL MÓDULO** agenda/form/modal.js **DEBERÁ** encapsular abrirModal(), cerrarModal(), seleccionarTipoRegistro(), setModoFormulario(), mostrarModalDirecto(), toggleOpcionesRecurrencia(), y toda la lógica de pestañas (Cita / Evaluación / Grupal / Bloqueo) con sus campos condicionales.

**RF-05** — **EL MÓDULO** agenda/form/autocomplete.js **DEBERÁ** encapsular actualizarDatalistPacientes(), manejarInputNombrePaciente(), autoDetectarColorPaciente(), establecerMontoCortesia(), calcularTotalGrupal(), y parsearTelefono() (si se mueve de whatsapp.js).

**RF-06** — **EL MÓDULO** agenda/actions/citaState.js **DEBERÁ** encapsular toggleCompletarCita(), toggleCancelarCita(), toggleReactivarCita(), togglePagoDirecto(), abrirZoomSesion(), enviarWhatsAppRecordatorio(), enviarWhatsAppCobro(), editarCita(), eliminarCita(), agendarEnCelda().

**RF-07** — **EL MÓDULO** agenda/ui/notasSemana.js **DEBERÁ** encapsular toggleNotasSemana(), cargarNotasConsultorio(), guardarNotasConsultorio().

**RF-08** — **EL MÓDULO** agenda/utils/colors.js **DEBERÁ** encapsular PALETA_COLORES, getColoresPersonalizados(), guardarColorPersonalizado(), renderSwatches(), getContrastColor(), obtenerSiguienteColorDisponible().

### 3.2 Estructura de Módulos JS — Expedientes

**RF-09** — **CUANDO** se abre el directorio o expediente **EL SISTEMA DEBERÁ** importar bajo demanda (dynamic import()) el punto de entrada panel/js/expedientes/index.js.

**RF-10** — **EL MÓDULO** expedientes/directorio.js **DEBERÁ** encapsular abrirDirectorioExpedientes(), cerrarDirectorioExpedientes(), renderDirectorioPacientes(), filtrarDirectorioExpedientes(), cargarDirectorioEnSegundoPlano(), eliminarPacienteDirectorio().

**RF-11** — **EL MÓDULO** expedientes/paciente.js **DEBERÁ** encapsular abrirExpedientePorId(), abrirExpedientePorCita(), cerrarModalExpediente(), actualizarCabeceraExpediente(), volverAlDirectorioExpedientes(), toggleMaximizarModalExpediente().

**RF-12** — **EL MÓDULO** expedientes/render/notasList.js **DEBERÁ** encapsular renderListaNotasExpediente(), resaltarTexto(), escapeHtmlText(), buscarEnNotasExpediente() (con debounce), y el HTML de .nota-expediente-card con sus 8 campos clínicos.

**RF-13** — **EL MÓDULO** expedientes/form/notaForm.js **DEBERÁ** encapsular mostrarFormularioNuevaNota(), ocultarFormularioNota(), guardarNotaExpediente(), editarNotaExpedienteModal(), eliminarNotaExpedienteConfirm().

**RF-14** — **EL MÓDULO** expedientes/ui/detalleSesion.js **DEBERÁ** encapsular abrirDetalleSesion(), cerrarDetalleSesion(), editarNotaDesdeDetalle(), guardarEdicionInSituDetalle(), cancelarEdicionInSituDetalle(), toggleAgrandarDetalleSesion(), imprimirNotaActualDetalle(), descargarNotaActualTxt(), imprimirNotaIndividual(), descargarNotaIndividualTxt().

**RF-15** — **EL MÓDULO** expedientes/utils/api.js **DEBERÁ** encapsular getAuthHeaders() y helpers de fetch reutilizables.

### 3.3 Modularización de HTML (Modales)

**RF-16** — **CADA MODAL** incrustado en agenda.html **DEBERÁ** extraerse a un partial HTML independiente en panel/partials/modals/:
- modal-nueva-cita.html
- modal-notas-semana.html
- modal-auditoria-pagos.html
- modal-datos-pago.html
- modal-cambiar-password.html
- modal-directorio-expedientes.html
- modal-expediente-paciente.html
- modal-detalle-sesion.html

**RF-17** — **EL SISTEMA DEBERÁ** cargar los partials vía fetch() e inyectarlos en el DOM al abrir cada modal (lazy-load), eliminando el HTML estático de agenda.html.

**RF-18** — **LOS EVENTOS** onclick inline en los partials **DEBERÁN** migrarse a addEventListener delegado en el módulo JS correspondiente tras la inyección.

### 3.4 Modularización de CSS

**RF-19** — **EL ARCHIVO** panel/panel.css **DEBERÁ** dividirse en hojas por componente en panel/css/components/:
- login.css
- header.css
- agenda-controls.css
- easy-table.css (matriz semanal, tarjetas, badges, animaciones)
- modals.css (base + cada modal específico)
- expedientes-directorio.css
- expedientes-paciente.css
- expedientes-notas.css
- expedientes-detalle.css
- auditoria-pagos.css
- datos-pago.css
- cambiar-password.css
- notas-semana.css
- responsive.css
- print.css

**RF-20** — **UN ARCHIVO** panel/css/panel.css **DEBERÁ** actuar como entry point importando todos los componentes (@import) manteniendo la misma ruta de carga actual (<link rel="stylesheet" href="/panel/panel.css">).

### 3.5 Carga y Orquestación

**RF-21** — **EN agenda.html** el script principal **DEBERÁ** ser <script type="module" src="/panel/js/agenda/index.js"></script> (ESM nativo).

**RF-22** — **LOS MÓDULOS** de expedientes **DEBERÁN** cargarse bajo demanda: import('/panel/js/expedientes/index.js') al click en "Expedientes" o tarjeta de cita → expediente.

**RF-23** — **LA API PÚBLICA** expuesta en window **DEBERÁ** reducirse al mínimo indispensable para onclick legacy en HTML no migrado: initAgenda, filtrarCitasEnTabla, limpiarBusqueda, abrirDirectorioExpedientes, abrirExpedientePorCita, abrirModalReporteMensual, abrirModalAuditoriaPagos, abrirModalDatosPago, toggleNotasSemana, abrirModalCambiarPassword, logout.

**RF-24** — **TODOS LOS SUBMÓDULOS** **DEBERÁN** usar export nombrados (no default) y seguir convención: export function nombreFuncion() {} / export const CONSTANTE = ....

### 3.6 Verificación y No-Regresión

**RF-25** — **TRAS LA MODULARIZACIÓN** la suite de 19 tests backend **DEBERÁ** seguir pasando 19/19.

**RF-26** — **VERIFICACIÓN MANUAL OBLIGATORIA** (checklist) antes de dar por terminada la tarea:
- [ ] Login → Agenda: semana actual, navegar semanas, filtro 5/7 días
- [ ] Crear cita individual / evaluación / grupal / bloqueo (con/sin recurrencia)
- [ ] Editar cita (cambiar tipo, fecha, hora, color, monto, Zoom, recurrencia)
- [ ] Marcar realizada / cancelar / reactivar / toggle pago desde tarjeta
- [ ] Abrir Zoom, WhatsApp recordatorio, WhatsApp cobro desde tarjeta
- [ ] Buscador global (pacientes, histórico, futuro)
- [ ] Imprimir agenda semanal
- [ ] Bloc de notas de la semana
- [ ] Directorio de expedientes (buscar, abrir, ver contador notas/citas)
- [ ] Expediente paciente: lista notas, buscar en notas, nueva nota, editar, eliminar
- [ ] Vista ampliada sesión (leer, editar in-situ, imprimir PDF, guardar .txt)
- [ ] Auditoría pagos (semana / todas, WhatsApp cobro, toggle pagado)
- [ ] Datos de cobro (guardar, usar en WhatsApp)
- [ ] Cambio de contraseña
- [ ] Responsive móvil (≤900px, ≤480px)
- [ ] Impresión / PDF agenda y notas

---

## 4. Requisitos No Funcionales

**RNF-01** — **Rendimiento**: Carga inicial de agenda.html ≤ 150 KB JS (vs 130 KB actuales combinados) gracias a lazy-load de expedientes.

**RNF-02** — **Mantenibilidad**: Cada módulo ≤ 300 líneas, responsabilidad única, sin acoplamiento cruzado entre agenda y expedientes.

**RNF-03** — **Seguridad**: Sin eval(), Function(), ni innerHTML con datos no saneados. Mantener escapeHtmlText() centralizado.

**RNF-04** — **Compatibilidad**: ES2020 (modules, optional chaining, nullish coalescing). Sin transpilación. Probado en Chrome 100+, Firefox 98+, Safari 15+, Edge 100+.

**RNF-05** — **CSP**: Mantener compatibilidad con _headers actual (script-src 'self' + unsafe-inline solo para onclick legacy mínimos). Migrar onclick → addEventListener reduce superficie unsafe-inline.

---

## 5. Fuera de Alcance (Out of Scope)

- Migración a bundler (Vite, Webpack, esbuild) — no (requisito constitucional: frontend sin build step)
- TypeScript — no (JS vanilla por constitución)
- Tests unitarios frontend (Jest/Vitest) — no en esta spec (futuro: spec separada)
- Refactor de panel/js/audio.js, whatsapp.js, pagos.js, config.js, app.js — no (son ya módulos razonables)
- Backend / Prisma / Base de datos — no

---

## 6. Criterios de Aceptación (Definition of Done)

1. Spec aprobada por el usuario
2. Plan técnico detallado con tareas atómicas (overview/tasks.md)
3. Implementación completa (módulos JS + partials HTML + CSS componentes)
4. 19/19 tests backend PASS
5. Checklist manual RF-26 al 100% verificado por el usuario
6. overview/architecture.md actualizado con nuevo diagrama de módulos
7. overview/session.md y overview/tasks.md actualizados
8. Push a producción solo tras aprobación explícita del usuario
