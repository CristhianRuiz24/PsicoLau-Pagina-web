# Tareas de Implementación 002 — Gestión y Edición de Citas Recurrentes en Serie

> **Regla de ejecución**: Implementar y verificar una sola tarea a la vez antes de avanzar a la siguiente.

---

## 📋 Lista de Tareas

### [x] T1: Modelo de Datos y Esquema Prisma
- **Archivos**:
  - `backend/prisma/schema.prisma`
- **Acción**:
  - Agregar campo `serieId String?` e índice `@@index([serieId])` en el modelo `Cita`.
  - Ejecutar `npx prisma db push` y `npx prisma generate` contra la base de datos de desarrollo.
- **Hecho cuando**:
  - `npx prisma db push` aplique el campo `serieId` sin errores y el cliente Prisma esté actualizado.

---

### [x] T2: Backend — Soporte de `serieId` en Creación y Detección de Series
- **Archivos**:
  - `backend/src/controllers/agendaController.js`
- **Acción**:
  - Modificar `crearCita` para generar y asociar un `serieId` único (`serie_${Date.now()}_${random}`) a todas las citas de una tanda cuando `repeticiones > 1`.
  - Crear función auxiliar de backend `obtenerCitasFuturasDeSerie(citaId, tx)` que busque por `serieId` o fallback regex `(Sesión \d+/\d+)` para el mismo paciente.
- **Hecho cuando**:
  - Al agendar citas recurrentes, todas las instancias queden vinculadas con el mismo `serieId`.

---

### [x] T3: Backend — Lógica de Actualización y Cancelación en Serie con `alcance`
- **Archivos**:
  - `backend/src/controllers/agendaController.js`
  - `backend/src/utils/validators.js`
- **Acción**:
  - Adaptar `editarCitaAdminSchema` para aceptar `alcance` (`'SOLO_ESTA'` o `'ESTA_Y_SIGUIENTES'`).
  - Implementar en `editarCita` la transacción atómica para `ESTA_Y_SIGUIENTES`: cálculo de desplazamiento `deltaMs`, actualización de fecha/hora para citas no-`REALIZADA`, preservación de `PAGADO` y actualización de metadatos (color, notas, Zoom, monto).
  - Implementar en `cancelarCita` y `eliminarCita` soporte para `alcance: 'ESTA_Y_SIGUIENTES'`.
- **Hecho cuando**:
  - Los endpoints de edición y eliminación procesen correctamente el parámetro `alcance` dentro de `prisma.$transaction`.

---

### [x] T4: Backend — Script de Validación Automatizada
- **Archivos**:
  - `backend/scripts/testCitasRecurrentes.js`
- **Acción**:
  - Crear script de pruebas que verifique:
    1. Creación de serie de 4 citas con `serieId`.
    2. Edición `SOLO_ESTA` (solo altera la cita 2).
    3. Edición `ESTA_Y_SIGUIENTES` con desplazamiento de 2 horas (traslada citas 3 y 4).
    4. Protección de cita `PAGADO` (mantiene estado pagado tras traslado).
    5. Cancelación `ESTA_Y_SIGUIENTES` (cancela 3 y 4, preservando la 1 y 2).
- **Hecho cuando**:
  - `node backend/scripts/testCitasRecurrentes.js` ejecute todas las aserciones con 100% de éxito.

---

### [x] T5: Frontend — Distintivo Visual de Serie en Modal de Edición
- **Archivos**:
  - `panel/agenda.html`
  - `panel/js/agenda.js`
  - `panel/panel.css`
- **Acción**:
  - En `editarCita(id)`, detectar si la cita tiene `serieId` o notas de sesión `(Sesión X/N)`.
  - Renderizar distintivo visual estilizado: `<div id="badgeSerieRecurrente" class="badge-serie-info"><i class="fa-solid fa-repeat"></i> Serie recurrente (Sesión X de N)</div>`.
- **Hecho cuando**:
  - Al abrir cualquier cita que sea parte de una serie se visualice el distintivo visual claro en la cabecera del modal.

---

### [x] T6: Frontend — Diálogo de Alcance y Propagación (Touch & Responsivo)
- **Archivos**:
  - `panel/agenda.html`
  - `panel/js/agenda.js`
  - `panel/panel.css`
- **Acción**:
  - Diseñar modal/submodal de selección de alcance `#modalAlcanceAccion`:
    - Botón `[ 🔵 Solo esta cita ]`
    - Botón `[ 🟣 Esta y las siguientes (N citas) ]`
    - Botón `[ Cancelar ]`
  - Conectar el flujo de Guardar Cambios y Eliminar Cita con el selector de alcance.
  - Asegurar estilos táctiles (mínimo 44px de altura, apilado responsive en móviles `<900px`).
- **Hecho cuando**:
  - Al editar o eliminar una cita con sesiones futuras, el diálogo permita elegir el alcance y la agenda visual se actualice instantáneamente.

---

### [x] T7: Verificación Integral y No-Regresiones
- **Archivos**:
  - Todos los módulos involucrados
- **Acción**:
  - Ejecutar suite de pruebas backend.
  - Verificar que citas individuales, bloqueos de horario y terapias grupales siguen funcionando normalmente.
  - Validar todos los criterios de finalización de `specs/002-edicion-citas-recurrentes/spec.md`.
- **Hecho cuando**:
  - Se cumplan todos los requisitos funcionales (RF-1 a RF-9) y el checklist de `AGENTS.md`.
