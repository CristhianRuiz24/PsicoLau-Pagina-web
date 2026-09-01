# Spec 002 — Gestión y Edición de Citas Recurrentes en Serie

## 📌 Contexto y Objetivo
Actualmente en la suite clínica de PsicoLau, al agendar un paciente con recurrencia (de 2 a 12 sesiones semanales o quincenales), las citas se crean individualmente en la base de datos. Sin embargo, al abrir el modal de edición de una de estas citas, la sección de recurrencia se oculta y no existe un mecanismo para propagar cambios de horario, datos clínicos o cancelaciones al resto de la serie. Si un paciente necesita cambiar el día/hora de su proceso terapéutico o cancelar las sesiones restantes, la terapeuta se ve obligada a modificar o eliminar cada cita manualmente una por una.

Esta funcionalidad introduce la **gestión contextual de series recurrentes**: permitiendo a Laura editar o cancelar una cita individualmente o propagar los cambios automáticamente a toda la serie futura, manteniendo la integridad contable y la protección de sesiones pasadas/realizadas.

---

## 👥 Usuarios / Actores
- **Terapeuta / Administradora (Laura Gómez)**: Gestiona la agenda semanal, edita horarios y cancela citas desde escritorio o dispositivos móviles.

---

## 📖 Historias de Usuario
- **H1**: Como terapeuta, quiero identificar visualmente en el modal de edición si una cita pertenece a una serie recurrente para saber qué número de sesión es y cuántas restan.
- **H2**: Como terapeuta, quiero que al modificar el día, la hora, el monto, el enlace de Zoom o las notas de una cita recurrente, el sistema me pregunte si deseo aplicar el cambio solo a esa sesión o a esa y todas las siguientes de la serie.
- **H3**: Como terapeuta, quiero que al trasladar una serie futura de horario o día, se respete el intervalo (semanal o quincenal) sin desfasar las semanas subsecuentes.
- **H4**: Como terapeuta, quiero que las sesiones futuras que ya hayan sido marcadas como pagadas conserven su estado contable intacto aunque cambien de fecha.
- **H5**: Como terapeuta, quiero poder cancelar o eliminar una cita individual o toda la serie futura en 1 solo paso con confirmación clara para evitar borrados accidentales.
- **H6**: Como terapeuta en movilidad, quiero que los diálogos de confirmación y selección de alcance sean 100% responsivos y cómodos en pantallas táctiles de celular.

---

## ⚙️ Requisitos Funcionales (Notación EARS)

### 🏷️ Identificación y Visualización de Series
- **RF-1 (Estado)**: MIENTRAS una cita pertenezca a una serie recurrente (`serieId` o patrón legacy), EL SISTEMA mostrará un distintivo visual informativo en el modal de edición indicando `🔁 Serie recurrente (Sesión X de N)` calculado dinámicamente según la posición cronológica de la cita dentro del grupo de su `serieId`.
- **RF-2 (Ubicuo)**: EL SISTEMA guardará el campo de notas (`notas`/`categoria`) limpio, sin concatenar textos redundantes de `(Sesión X/N)`, preservando exclusivamente las anotaciones ingresadas por la terapeuta y manteniendo compatibilidad de lectura con citas legacy anteriores.

### ✏️ Edición y Propagación de Cambios
- **RF-3 (Evento)**: CUANDO la terapeuta presione "Guardar Cambios" en una cita perteneciente a una serie con citas futuras asociadas, EL SISTEMA desplegará un diálogo modal modal con dos opciones de alcance:
  - `[ 🔵 Solo esta cita ]`
  - `[ 🟣 Esta y las siguientes (N restantes) ]`
- **RF-4 (Evento)**: CUANDO se seleccione `Solo esta cita`, EL SISTEMA actualizará únicamente los datos de la cita seleccionada sin alterar las demás citas de la serie.
- **RF-5 (Evento)**: CUANDO se seleccione `Esta y las siguientes`, EL SISTEMA calculará la diferencia de tiempo (desplazamiento de día/hora) y aplicará el nuevo horario, monto, color, notas y enlace de Zoom a la cita actual y a todas las citas posteriores de esa serie.
- **RF-6 (Excepción)**: SI una cita posterior de la serie ya tiene el estado `REALIZADA`, ENTONCES EL SISTEMA la omitirá del desplazamiento de fecha/hora para proteger la cronología de notas clínicas pasadas.
- **RF-7 (Ubicuo)**: SI una cita posterior de la serie tiene el estado de pago `PAGADO`, EL SISTEMA actualizará su fecha/hora pero conservará invariablemente su estado `PAGADO` y su monto ya cobrado.

### 🗑️ Cancelación y Borrado de Series
- **RF-8 (Evento)**: CUANDO la terapeuta presione "Eliminar esta cita" (o borrar) sobre una cita de una serie, EL SISTEMA desplegará el diálogo de alcance preguntando con la redacción explícita de borrado para evitar ambigüedades con el botón Cancelar:
  - `[ 🗑️ Borrar solo esta cita ]`
  - `[ ⚠️ Borrar esta y las siguientes (N restantes) ]`
  - `[ Cancelar ]` (cierra sin aplicar cambios)
- **RF-9 (Evento)**: CUANDO se confirme el borrado de `Esta y las siguientes`, EL SISTEMA retirará en lote la cita actual y todas las citas futuras vinculadas a esa serie, dejando intactas las sesiones pasadas en el historial.

---

## 📱 Requisitos No Funcionales
- **RNF-1 (Ergonomía Móvil)**: Los modales de confirmación de alcance deben contar con botones táctiles de al menos 44px de altura, disposición apilada en móviles (`@media (max-width: 900px)`) y soporte de cierre con tecla `Escape` o toque fuera en escritorio.
- **RNF-2 (Rendimiento y Atomicidad)**: La actualización o eliminación masiva de citas en el backend debe ejecutarse dentro de una transacción atómica (`prisma.$transaction`) para garantizar que todas las citas se actualicen o ninguna en caso de error.
- **RNF-3 (Seguridad y Autorización)**: Todos los endpoints de actualización masiva deben estar protegidos bajo el middleware de autenticación JWT (`authMiddleware`).
- **RNF-4 (Accesibilidad WCAG 2.1 AA)**: Los distintivos y botones del diálogo de selección deben cumplir contraste mínimo de 4.5:1 con tipografía legible.

---

## 🔍 Casos Límite y Manejo de Errores
1. **Última sesión de la serie**: Si Laura edita la última sesión (ej. Sesión 6 de 6), el sistema no muestra el diálogo de "Esta y las siguientes" (o lo muestra con "0 citas restantes") y guarda directamente como cita individual.
2. **Edición sin cambio de fecha/hora**: Si solo se cambia el color, notas o enlace de Zoom, la propagación a las siguientes citas aplica esos campos sin alterar sus fechas respectivas.
3. **Citas canceladas previamente en la serie**: Las citas que ya hayan sido marcadas como `CANCELADA` dentro de la serie no se resucitan ni se duplican al propagar cambios.
4. **Fallo de conexión en móvil**: Si la petición falla, el modal no se cierra y muestra un mensaje de error claro con opción a reintentar.

---

## 🚫 Fuera de Alcance (Out of Scope)
- Renumeración retroactiva de series históricas ya concluidas en meses pasados.
- Cambio de periodicidad dinámica a mitad de serie (ej. cambiar de semanal a cada 3 días sobre una serie ya creada).
- Conversión retroactiva de citas individuales no relacionadas en una sola serie (para nuevos ciclos, Laura utiliza el agendamiento recurrente habitual).

---

## 🏁 Criterios de Finalización (Done Criteria)
- [ ] La terapeuta puede visualizar si una cita es recurrente al abrir el modal de edición.
- [ ] Al guardar cambios en una cita con sesiones futuras, aparece el diálogo de alcance (Solo esta vs Esta y siguientes).
- [ ] Al seleccionar "Esta y las siguientes", todas las sesiones futuras cambian de día/hora respetando el intervalo semanal o quincenal.
- [ ] Las sesiones futuras con pago `PAGADO` conservan su estado de cobro.
- [ ] Al eliminar una cita de serie, se puede elegir eliminar solo una o todas las futuras.
- [ ] El flujo completo es fluido y responsivo en pantallas móviles.
- [ ] Se incluye script de pruebas automatizadas en `backend/scripts/` validando la transacción en serie.
