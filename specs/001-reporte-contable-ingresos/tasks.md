# Tareas de Implementación 001 — Reporte Contable Mensual y Control de Ingresos

> **Regla de ejecución**: Implementar y verificar una sola tarea a la vez antes de avanzar a la siguiente.

---

## 📋 Lista de Tareas

### [x] T1: Modelo de Datos y Esquema Prisma
- **Archivos**:
  - `backend/prisma/schema.prisma`
- **Acción**:
  - Agregar campo `tarifaDefecto Float? @default(500)` en el modelo `Paciente`.
  - Agregar campo `monto Float @default(500)` en el modelo `Cita`.
  - Ejecutar `npx prisma db push` y `npx prisma generate` contra la base de datos de desarrollo.
- **Hecho cuando**:
  - `npx prisma db push` aplique las columnas sin errores y el cliente Prisma esté actualizado.

---

### [x] T2: Backend — Controladores de Citas con Soporte de Monto
- **Archivos**:
  - `backend/src/controllers/agendaController.js`
  - `backend/src/routes/agenda.js`
- **Acción**:
  - Adaptar `crearCita` para procesar `monto` (validar número >= 0, default 500), asignar a cada cita de la serie y actualizar `tarifaDefecto` en `Paciente`.
  - Adaptar `actualizarCita` para admitir y actualizar `monto`.
  - Implementar nuevo endpoint `PATCH /api/agenda/citas/:id/monto` para actualización rápida.
- **Hecho cuando**:
  - Los endpoints procesen correctamente el campo `monto` y actualicen la base de datos.

---

### [x] T3: Backend — Script de Validación Automatizada
- **Archivos**:
  - `backend/scripts/testContabilidad.js`
- **Acción**:
  - Crear script de prueba que verifique:
    1. Creación de cita con monto personalizado ($1,200).
    2. Creación de cita con monto $0 (Cortesía).
    3. Persistencia de tarifa en el paciente.
    4. Actualización de monto vía PATCH.
    5. Validación de errores ante montos negativos.
- **Hecho cuando**:
  - `node backend/scripts/testContabilidad.js` ejecute todas las aserciones con éxito (100% OK).

---

### [x] T4: Frontend — Integración de Montos en Formulario de Cita
- **Archivos**:
  - `panel/agenda.html`
  - `panel/js/agenda.js`
  - `panel/panel.css`
- **Acción**:
  - Añadir campo de entrada numérico para Monto ($ MXN) con selector rápido de `$0 (Cortesía)`.
  - Conectar el autocompletado: al seleccionar o escribir un paciente existente, autocompletar el campo de monto con su `tarifaDefecto`.
  - Enviar el `monto` en el payload de creación y edición de citas.
- **Hecho cuando**:
  - Al agendar o editar una cita en el panel se observe el campo de monto funcional, el autocompletado del paciente y el botón de cortesía.

---

### [x] T5: Frontend — Modal y Lógica de Reporte Contable Mensual
- **Archivos**:
  - `panel/agenda.html`
  - `panel/js/pagos.js`
  - `panel/panel.css`
- **Acción**:
  - Añadir botón `📊 Reporte Mensual` en la cabecera del panel.
  - Diseñar el modal de Reporte Mensual con selector de Mes/Año y botones de navegación.
  - Implementar lógica de cálculo de KPIs: Total Ingresos Cobrados, Total Sesiones Realizadas, Sesiones $0 Cortesía, Pendiente por cobrar.
  - Renderizar tabla cronológica con desglose por paciente, sesión y cobro.
- **Hecho cuando**:
  - Al abrir el reporte mensual se visualice el consolidado correcto del mes seleccionado con actualización instantánea al cambiar de periodo.

---

### [x] T6: Frontend — Exportación a WhatsApp, CSV e Impresión/PDF
- **Archivos**:
  - `panel/js/pagos.js`
  - `panel/panel.css`
- **Acción**:
  - Implementar función para copiar resumen estructurado al portapapeles para WhatsApp.
  - Implementar generador de archivo CSV (UTF-8 con BOM) para descarga directa en Excel.
  - Configurar estilos `@media print` para vista de impresión formal con membrete de PsicoLau.
- **Hecho cuando**:
  - Los 3 botones de exportación funcionen correctamente en el navegador y produzcan los formatos acordados en la spec.

---

### [x] T7: Verificación Integral y No-Regresiones
- **Archivos**:
  - Todos los involucrados
- **Acción**:
  - Verificar que la agenda semanal, el buscador global, los expedientes clínicos y el login continúan operando sin errores.
  - Validar los criterios de finalización de `specs/001-reporte-contable-ingresos/spec.md`.
- **Hecho cuando**:
  - Se cumplan todos los puntos de la verificación obligatoria de `AGENTS.md`.
