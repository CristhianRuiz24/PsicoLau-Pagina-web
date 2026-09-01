# Desglose de Tareas — Spec 003: Estado Visual y Visibilidad de Citas Canceladas en Matriz Semanal

---

### [x] T1: Backend — Soporte de `estado_cita` en edición y endpoint de reactivación rápida
- **Archivos**:
  - `backend/src/utils/validators.js`
  - `backend/src/controllers/agendaController.js`
- **Acción**:
  - Permitir `estado_cita` en `editarCitaAdminSchema`.
  - Asegurar que `editarCita` actualice `estado_cita` si viene en el body.
  - Asegurar que `actualizarEstadoCita` y `reactivarCita` manejen `CANCELADA` y `PENDIENTE` con respuesta consistente.
- **Hecho cuando**:
  - `PUT /api/agenda/citas/:id` y `PATCH /api/agenda/citas/:id/estado` admitan el ciclo completo de estados.

---

### [x] T2: Frontend — Estilos visuales de cita cancelada (`.is-cancelled`, badges, botones de reactivación)
- **Archivos**:
  - `panel/panel.css`
- **Acción**:
  - Definir `.appointment-block.is-cancelled` con color atenuado, borde rojo carmesí y tachado de nombre.
  - Diseñar `.badge-cancelada` de alto contraste blanco/rojo.
  - Diseñar `.btn-cancel-quick` y `.btn-reactivar-quick` con dimensiones táctiles >44px para móvil.
- **Hecho cuando**:
  - Las citas canceladas tengan una apariencia inconfundible y accesible en la interfaz.

---

### [x] T3: Frontend — Renderizado de citas canceladas en la matriz semanal y acciones en tarjeta
- **Archivos**:
  - `panel/js/agenda.js`
- **Acción**:
  - Actualizar `renderTable()` para incluir citas con `estado_cita === 'CANCELADA'`.
  - En tarjetas canceladas: ocultar Zoom y WhatsApp, mostrar botón `↺ Reactivar` y distintivo `✕ Cancelada`.
  - En tarjetas activas: agregar botón rápido `[ ✕ ]` de cancelación rápida (`toggleCancelarCita`).
  - Implementar `window.toggleCancelarCita(id, event)` y `window.toggleReactivarCita(id, event)` con microsonido.
- **Hecho cuando**:
  - Las canceladas se mantengan en su celda horaria y se puedan cancelar/reactivar con 1 solo clic.

---

### [x] T4: Frontend — Selector de estado en el modal de edición
- **Archivos**:
  - `panel/agenda.html`
  - `panel/js/agenda.js`
  - `panel/js/app.js`
- **Acción**:
  - Agregar selector de estado interactivo en el modal (`[ ⏳ Pendiente ]`, `[ ✓ Realizada ]`, `[ ✕ Cancelada ]`).
  - Cargar el estado actual al abrir el modal de edición y enviarlo al guardar.
- **Hecho cuando**:
  - Desde el modal también se pueda alternar el estado de la cita.

---

### [x] T5: Backend — Script de validación automatizada
- **Archivos**:
  - `backend/scripts/testVisibilidadCanceladas.js`
- **Acción**:
  - Testear: Creación de cita -> Cancelación rápida -> Verificación de estado -> Reactivación -> Exclusión contable.
- **Hecho cuando**:
  - La suite de pruebas pase al 100%.

---

### [x] T6: Verificación Integral y No-Regresiones
- **Archivos**:
  - Todos los módulos de la suite clínica
- **Acción**:
  - Verificar que citas individuales, series recurrentes, bloqueos y terapias grupales operen sin ninguna regresión.
  - Comprobar checklist de `AGENTS.md` y todos los criterios de finalización de `spec.md`.
- **Hecho cuando**:
  - Todos los RF-1 a RF-7 estén validados con éxito.
