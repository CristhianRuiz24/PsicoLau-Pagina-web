# Spec 004 — Gestión de Costos en Terapia Grupal, Evaluaciones y Desglose Contable Mensual por Tarifas

## 📌 Contexto y Objetivo
Actualmente en la Suite Clínica de PsicoLau, las **Terapias Grupales (`[GRUPAL]`)** se gestionan como eventos con tarifa forzada en `$0`, quedando excluidas de los cálculos de ingresos mensuales, y las **Evaluaciones Diagnósticas** no cuentan con una categoría dedicada para distinguirlas de consultas comunes.

En la práctica clínica real de Laura:
1. **Cobro Grupal:** Laura cobra una cuota individual a cada participante de una sesión grupal (ej. `$150 MXN` × `6 personas` = `$900 MXN` por sesión).
2. **Evaluaciones:** Las evaluaciones diagnósticas/neuropsicológicas tienen una naturaleza y tarifa distinta (predeterminada en `$4,000 MXN`, editable).
3. **Requerimiento Mensual de la Contadora:** Cada fin de mes, la contadora solicita a Laura los **ingresos totales con un desglose categorizado por tarifas y tipos de servicio**:
   - Consultas individuales agrupadas por precio (ej. *20 de $600 = $12,000 / 5 de $500 = $2,500*).
   - Terapias grupales (ej. *2 sesiones grupales = $4,000 total*).
   - Evaluaciones diagnósticas/neuropsicológicas (ej. *1 evaluación de $4,000 = $4,000*).
   - Sesiones gratuitas / cortesías (ej. *9 sesiones gratuitas*).
   - Línea de cierre con ingresos totales acumulados (*Ingresos totales: $22,500*).

Esta especificación formaliza las **4 pestañas de registro en el modal de agendamiento (`Consulta Individual`, `Evaluación`, `Terapia Grupal`, `Bloquear Horario`)**, la **calculadora ágil de tarifas grupales**, la inclusión financiera en el motor contable mensual y el **generador en 1 clic del formato oficial para la contadora**.

---

## 👥 Usuarios / Actores
- **Terapeuta / Administradora (Laura Gómez)**: Administra la agenda de consultas individuales, evaluaciones diagnósticas y terapias grupales, y genera los reportes contables mensuales para su contadora.

---

## 📖 Historias de Usuario
- **H1**: Como terapeuta, quiero una pestaña dedicada `[ 🧠 Evaluación ]` que predetermine la tarifa en `$4,000 MXN` (editable) y clasifique la cita como evaluación diagnóstica.
- **H2**: Como terapeuta, quiero tener una mini-calculadora en la pestaña de `[ 👥 Terapia Grupal ]` (`Cuota x Participantes = Total`) para registrar de forma rápida cuánto ingresa por cada sesión grupal.
- **H3**: Como terapeuta, quiero poder editar el monto recaudado de una sesión grupal puntual si asisten más o menos participantes de lo previsto.
- **H4**: Como terapeuta, quiero que las sesiones grupales y evaluaciones con estado `PAGADO` se sumen automáticamente al Total Cobrado del mes en el Reporte Contable Mensual.
- **H5**: Como terapeuta, quiero que las sesiones grupales se identifiquen con un distintivo visual morado `[Grupal]` y las evaluaciones con distintivo azul/índigo `[Evaluación]` en la tabla del reporte mensual y en la agenda.
- **H6**: Como terapeuta, quiero un botón dedicado `[ 📋 Copiar para Contadora ]` que genere el desglose exacto agrupado por tarifas y tipos que me pide mi contadora mes con mes.
- **H7**: Como terapeuta, quiero conservar el botón `[ 💬 Copiar Detallado WhatsApp ]` para consultar el desglose línea por línea con fecha, hora y paciente cuando sea necesario.
- **H8**: Como terapeuta, quiero que los bloqueos de horario (`[BLOQUEO]`) permanezcan con costo `$0` y 100% excluidos de los reportes financieros.

---

## ⚙️ Requisitos Funcionales (Notación EARS)

### 🗂️ Pestañas de Registro y Formulario de Cita
- **RF-1 (Ubicuo)**: EL SISTEMA dispondrá de 4 pestañas de selección de tipo de evento en el modal de agendamiento, permitiendo editar libremente el monto en todas las opciones de atención clínica:
  1. `[ 👤 Consulta Individual ]`: Tarifa predeterminada en $500 (o la tarifa personalizada del paciente), **100% editable libremente** (ej. $600, $750, etc.).
  2. `[ 🧠 Evaluación ]`: Tarifa predeterminada en $4,000 MXN, **100% editable libremente** (ej. $3,500, $4,500, etc.), campos de paciente completos y etiquetado `[EVALUACION]`.
  3. `[ 👥 Terapia Grupal ]`: Calculadora ágil de cuota por participante × número de integrantes, con monto total **100% editable libremente** y etiquetado `[GRUPAL]`.
  4. `[ 🚫 Bloquear Horario ]`: Tarifa fija $0 y etiquetado `[BLOQUEO]`.
- **RF-2 (Evento)**: CUANDO la terapeuta seleccione `[ 👥 Terapia Grupal ]`, EL SISTEMA mostrará la calculadora con:
  - `nc_cuota_persona`: Cuota individual por participante (ej. `$150 MXN`).
  - `nc_num_participantes`: Número de integrantes (ej. `6`).
  - `nc_monto`: Monto total que se calcula en tiempo real (`cuota × participantes`), permitiendo en todo momento edición manual directa.
- **RF-3 (Evento)**: CUANDO la terapeuta agende una sesión grupal o evaluación recurrente (serie de sesiones), EL SISTEMA asignará el monto total a cada una de las sesiones de la serie automáticamente.
- **RF-4 (Evento)**: CUANDO la terapeuta edite una cita puntual, EL SISTEMA permitirá modificar su monto y estado de pago (`PAGADO` / `PENDIENTE`) sin alterar las demás sesiones de la serie a menos que se solicite.

### 📊 Motor de Reporte Contable Mensual
- **RF-5 (Estado)**: MIENTRAS se calcule el Reporte Contable Mensual (`#modalReporteMensual`), EL SISTEMA:
  - Sumará las consultas individuales, evaluaciones y sesiones grupales pagadas al **Total Cobrado** mensual.
  - Sumará las sesiones pendientes a las **Cuentas por Cobrar**.
  - Renderizará en la tabla de detalle las sesiones identificadas con sus badges distintivos (`[Individual]`, `[Evaluación]`, `[Grupal]`).

### 📋 Desglose Inteligente para la Contadora (WhatsApp y Exportadores)
- **RF-6 (Evento)**: CUANDO la terapeuta presione el botón `[ 📋 Copiar para Contadora ]`, EL SISTEMA generará en el portapapeles el texto estructurado con la agrupación por categorías y tarifas:
  1. *Consultas individuales agrupadas por tarifa*: `• X sesiones individuales de $YYY.YY = $ZZZ.ZZ`
  2. *Terapias grupales*: `• X sesiones grupales = $ZZZ.ZZ total`
  3. *Evaluaciones*: `• X evaluación(es) de $YYY.YY = $ZZZ.ZZ`
  4. *Sesiones gratuitas / cortesías*: `• X sesiones gratuitas (cortesía $0)`
  5. *Línea divisoria y cierre*: `💰 Ingresos totales: $ZZZ.ZZ MXN`
- **RF-7 (Evento)**: CUANDO la terapeuta presione `[ 💬 Copiar Detallado WhatsApp ]`, EL SISTEMA copiará el listado cronológico de todas las sesiones con fecha, hora, nombre, monto y estatus de pago.
- **RF-8 (Evento)**: CUANDO la terapeuta descargue el archivo CSV para Excel, EL SISTEMA incluirá las sesiones con su columna de tipo de servicio (`Individual`, `Evaluación`, `Grupal`) y monto en formato UTF-8 BOM (`\uFEFF`).

### 🛡️ Exclusión de Bloqueos y Retrocompatibilidad
- **RF-9 (Excepción)**: SI una cita corresponde a un bloqueo de horario personal (`[BLOQUEO]`), ENTONCES EL SISTEMA mantendrá su costo en `$0` y la excluirá de cualquier cálculo contable o reporte de ingresos.

---

## 📱 Requisitos No Funcionales
- **RNF-1 (Cálculo en Tiempo Real)**: La multiplicación de `cuota × participantes` en el modal grupal debe realizarse instantáneamente en el evento `input` sin retardo perceptible.
- **RNF-2 (Ergonomía Táctil en Celulares)**: Las 4 pestañas de tipo y los botones de exportación `[ 📋 Copiar para Contadora ]` y `[ 💬 Copiar Detallado WhatsApp ]` deben disponer de altura mínima de 44px y feedback visual táctil cómodo.
- **RNF-3 (Precisión Contable Decimal)**: Todas las sumatorias, multiplicaciones y formateos monetarios deben procesarse con precisión decimal estricta (`Intl.NumberFormat('es-MX')`), garantizando que la suma de las partes coincida exactamente con el Total de Ingresos reportado.

---

## 🔍 Casos Límite
1. **Grupo con costo cero ($0 Cortesía):** Si la cuota o el total es 0, computa en el conteo de sesiones grupales pero no suma a ingresos ni altera promedios con costo.
2. **Evaluación con tarifa personalizada:** Si Laura cobra $3,500 o $5,000 en lugar de $4,000, puede editar el campo de tarifa libremente y el sistema agrupa: `• 1 evaluación de $3,500 = $3,500`.
3. **Múltiples tarifas individuales en el mismo mes:** Si Laura cobra tarifas diferenciadas (ej. 20 de $600, 5 de $500), el motor de agrupación genera una línea ordenada para cada tarifa detectada sin duplicidades.

---

## 🚫 Fuera de Alcance
- Gestión de listas individuales de asistencia por nombre dentro de cada grupo (se maneja por número total de participantes y cuota global).
- Emisión de facturas CFDI / timbrado fiscal automático ante el SAT.
