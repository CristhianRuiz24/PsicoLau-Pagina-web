# Spec 003 — Estado Visual y Visibilidad de Citas Canceladas en Matriz Semanal

## 📌 Contexto y Objetivo
Actualmente en la suite clínica de PsicoLau, cuando una cita se cancela (porque el paciente avisó que no podrá asistir esa semana), el sistema la oculta por completo de la matriz semanal activa (Easy Table), dejando la celda horaria en blanco. Esto genera un problema operativo para Laura: al ver el espacio vacío, puede asumir por error que el horario está disponible y agendar a otro paciente encima, o perder el contexto de qué paciente tenía reservada esa hora.

Esta funcionalidad introduce el **estado visual de citas canceladas en la matriz semanal**: permitiendo que las citas canceladas permanezcan visibles en su celda con un diseño atenuado inconfundible y badge `✕ Cancelada`, con controles rápidos de cancelación/reactivación en 1 clic y exclusión contable automática.

---

## 👥 Usuarios / Actores
- **Terapeuta / Administradora (Laura Gómez)**: Consulta y gestiona el horario semanal de consultas individuales y terapias grupales desde escritorio y móvil.

---

## 📖 Historias de Usuario
- **H1**: Como terapeuta, quiero que las citas canceladas de la semana permanezcan visibles en su franja horaria con un diseño atenuado y distintivo rojo `✕ Cancelada`, para saber qué paciente canceló y no ocupar su espacio por error.
- **H2**: Como terapeuta, quiero poder marcar una cita como cancelada en 1 solo clic desde la tarjeta semanal o desde el selector de estado del modal.
- **H3**: Como terapeuta, quiero poder reactivar una cita cancelada (`↺ Reactivar`) con 1 clic si el paciente avisa que finalmente sí puede acudir.
- **H4**: Como terapeuta, quiero que las tarjetas canceladas oculten los botones de WhatsApp y Zoom para evitar el envío de recordatorios o accesos por error.
- **H5**: Como terapeuta, quiero que las citas canceladas no sumen cobros pendientes a la contabilidad a menos que hayan sido pagadas expresamente.
- **H6**: Como terapeuta, quiero que las citas canceladas sigan apareciendo en el buscador global de pacientes para consultar su historial.
- **H7**: Como terapeuta, quiero conservar la opción de borrado permanente (🗑️) para cuando un paciente termine su tratamiento o sea dado de alta definitiva.

---

## ⚙️ Requisitos Funcionales (Notación EARS)

### 🎨 Visualización en Matriz Semanal
- **RF-1 (Estado)**: MIENTRAS una cita tenga el estado `CANCELADA`, EL SISTEMA la renderizará en su celda horaria de la matriz semanal con clase visual atenuada (`.is-cancelled`), color de fondo tenue, nombre con tachado sutil (`line-through`) y badge de alto contraste `✕ Cancelada`.
- **RF-2 (Ubicuo)**: MIENTRAS una tarjeta tenga estado `CANCELADA`, EL SISTEMA ocultará los botones de videollamada (Zoom) y recordatorios de WhatsApp en su barra de acciones, mostrando en su lugar el botón de acción rápida `[ ↺ Reactivar ]`.

### ⚡ Acciones Rápidas y Modal de Edición
- **RF-3 (Evento)**: CUANDO la terapeuta presione el botón rápido de cancelación `[ ✕ ]` en la cápsula de una cita activa, EL SISTEMA cambiará su estado a `CANCELADA` y actualizará la tarjeta en la cuadrícula al instante.
- **RF-4 (Evento)**: CUANDO la terapeuta presione `[ ↺ Reactivar ]` en una tarjeta cancelada, EL SISTEMA cambiará su estado a `PENDIENTE` y restaurará sus controles y colores activos.
- **RF-5 (Opcional)**: DONDE se abra el modal de agendamiento/edición de cita, EL SISTEMA dispondrá de un selector de estado interactivo (`[ ⏳ Pendiente ]`, `[ ✓ Realizada ]`, `[ ✕ Cancelada ]`).

### 📊 Integración Contable y Búsqueda Global
- **RF-6 (Estado)**: MIENTRAS una cita esté `CANCELADA`, EL SISTEMA la excluirá de las cuentas por cobrar pendientes en la auditoría semanal y en el reporte contable mensual, a menos que tenga `estado_pago === 'PAGADO'`.
- **RF-7 (Evento)**: CUANDO la terapeuta utilice el buscador global de pacientes, EL SISTEMA listará las citas canceladas con su distintivo histórico `✕ Cancelada`, permitiendo abrirlas para consulta o reactivación.

---

## 📱 Requisitos No Funcionales
- **RNF-1 (Accesibilidad y Contraste WCAG 2.1 AA)**: El badge `✕ Cancelada` debe contar con fondo blanco sólido o rojo nítido y ratio de contraste superior a 4.5:1 sobre cualquier color de tarjeta.
- **RNF-2 (Ergonomía Móvil)**: Los botones rápidos `[ ✕ ]` y `[ ↺ ]` deben contar con zona táctil de fácil pulsación en móviles sin solaparse con las demás acciones de la tarjeta.
- **RNF-3 (Microinteracciones Acústicas)**: Al marcar como cancelada o reactivar una cita, el sistema reproducirá una retroalimentación auditiva armónica sutil mediante Web Audio API.

---

## 🔍 Casos Límite
1. **Cita cancelada con pago previo**: Si la cita fue pagada previamente, conserva su estado `PAGADO` y su monto en el reporte mensual.
2. **Cita en serie recurrente**: Si la cita cancelada pertenece a una serie, la cancelación rápida afecta solo a la sesión seleccionada, manteniendo intactas las sesiones futuras.
3. **Múltiples citas en la misma celda**: Si en una hora hay una cita cancelada y otra activa, la celda se expande ordenadamente apilando ambas tarjetas.

---

## 🚫 Fuera de Alcance
- Envío de correos automáticos al paciente notificando cancelación (Laura gestiona la comunicación directa por WhatsApp).
- Notificaciones push al navegador.

---

## 🏁 Criterios de Finalización (Done Criteria)
- [ ] Las citas canceladas permanecen visibles en la matriz semanal con diseño atenuado, tachado y badge `✕ Cancelada`.
- [ ] Botón rápido `[ ✕ ]` en tarjeta para cancelar y botón `[ ↺ ]` para reactivar en 1 clic.
- [ ] Acciones de Zoom y WhatsApp ocultas en tarjetas canceladas.
- [ ] Selector de estado en el modal de edición.
- [ ] Citas canceladas no generan saldos pendientes en contabilidad.
- [ ] Citas canceladas siguen consultables en el buscador global.
- [ ] Pruebas automatizadas actualizadas y superadas al 100%.
