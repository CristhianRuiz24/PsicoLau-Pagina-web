# Tareas — Spec 004: Gestión de Costos en Terapia Grupal, Evaluaciones y Desglose Contable Mensual por Tarifas

> **Estado**: `COMPLETADA`  
> **Flujo**: Spec-Driven Development (SDD)

---

## 📋 Lista de Tareas Atómicas

- [x] **T1**: Cuarta Pestaña de Evaluación y Calculadora Grupal en Modal (`panel/agenda.html` & `panel/js/agenda.js`)
- [x] **T2**: Persistencia de Monto para Evaluaciones y Citas Grupales (`panel/js/app.js`, `panel/js/agenda.js`)
- [x] **T3**: Inclusión Financiera en el Reporte Mensual (`panel/js/pagos.js`)
- [x] **T4**: Motor de Agrupación por Tarifas y Botón "Copiar para Contadora" (`panel/agenda.html`, `panel/js/pagos.js`, `panel/panel.css`)
- [x] **T5**: Exportación CSV para Excel con Tipo de Servicio (`panel/js/pagos.js`)
- [x] **T6**: Suite de Pruebas Automatizadas (Dataset Real de 37 Citas / $22,500 MXN)

---

### 🗂️ T1: Cuarta Pestaña de Evaluación y Calculadora Grupal en Modal (`panel/agenda.html` & `panel/js/agenda.js`)
- **Archivos afectados**: `panel/agenda.html`, `panel/js/agenda.js`
- **Descripción**:
  - Incorporar en `#seccionTabsTipo` la pestaña `tabTipoEvaluacion` (`[ 🧠 Evaluación ]`).
  - Agregar el bloque `#calculadoraGrupal` con inputs `#nc_cuota_persona` y `#nc_num_participantes`.
  - Configurar `seleccionarTipoRegistro('EVALUACION')` con tarifa predeterminada de $4,000 (editable) y color índigo.
  - Configurar `seleccionarTipoRegistro('GRUPAL')` con la calculadora en tiempo real que sincroniza `#nc_monto`.
- **Hecho cuando**: Al hacer clic en *Evaluación*, el monto se autocompleta en $4,000 (editable); al hacer clic en *Terapia Grupal*, se muestra la calculadora y $150 × 6 calcula $900 al instante.

---

### 💾 T2: Persistencia de Monto para Evaluaciones y Citas Grupales (`panel/js/app.js`, `panel/js/agenda.js`)
- **Archivos afectados**: `panel/js/app.js`, `panel/js/agenda.js`
- **Descripción**:
  - En el listener `submit` de `#formNuevaCita`, permitir guardar `montoFinal` para citas de tipo `EVALUACION` y `GRUPAL` (removiendo el forzado a 0).
  - En `editarCita(id)`, permitir cargar y modificar el monto y estado de pago de evaluaciones y sesiones grupales existentes.
- **Hecho cuando**: Al guardar una evaluación o terapia grupal con su monto correspondiente, la cita en la base de datos conserva su tarifa y estado de pago exactos al recargar.

---

### 📊 T3: Inclusión Financiera en el Reporte Mensual (`panel/js/pagos.js`)
- **Archivos afectados**: `panel/js/pagos.js`
- **Descripción**:
  - Modificar `obtenerCitasReportePeriodo()` para incluir sesiones grupales (`[GRUPAL]`) y evaluaciones.
  - Actualizar `renderReporteMensual()` para que todas las sesiones pagadas sumen a `Total Cobrado` y las pendientes a `Por Cobrar`.
  - Renderizar en la tabla de detalle los badges correspondientes (`[Individual]`, `[Evaluación]`, `[Grupal]`).
- **Hecho cuando**: El modal de Reporte Mensual suma correctamente ingresos de individuales, evaluaciones y grupales, mostrando sus respectivos badges en la tabla.

---

### 📋 T4: Motor de Agrupación por Tarifas y Botón "Copiar para Contadora" (`panel/agenda.html`, `panel/js/pagos.js`, `panel/panel.css`)
- **Archivos afectados**: `panel/agenda.html`, `panel/js/pagos.js`, `panel/panel.css`
- **Descripción**:
  - Agregar el botón `[ 📋 Copiar para Contadora ]` junto a `[ 💬 Copiar Detallado WhatsApp ]` en la cabecera del modal de reporte mensual.
  - Implementar la función `copiarReporteParaContadora()` que agrupa automáticamente consultas individuales por precio, sesiones grupales, evaluaciones y cortesías, con total acumulado de cierre.
- **Hecho cuando**: Al presionar `[ 📋 Copiar para Contadora ]`, el texto en el portapapeles reproduce con exactitud el formato categorizado solicitado por la contadora de Laura con sumas matemáticas idénticas.

---

### 📑 T5: Exportación CSV para Excel con Tipo de Servicio (`panel/js/pagos.js`)
- **Archivos afectados**: `panel/js/pagos.js`
- **Descripción**:
  - Actualizar `descargarReporteCSV()` para incluir la columna de tipo de servicio (`Individual`, `Evaluación`, `Grupal`) y monto de todas las sesiones, manteniendo el encabezado UTF-8 BOM (`\uFEFF`).
- **Hecho cuando**: Al abrir el CSV descargado en Excel, las filas aparecen clasificadas por tipo con su monto real y sin distorsión de caracteres.

---

### 🧪 T6: Suite de Pruebas Automatizadas (Dataset Real de 37 Citas / $22,500 MXN)
- **Archivos afectados**: `backend/scripts/testReporteContadoraDesglose.js`
- **Descripción**:
  - Crear script de prueba automatizado con el dataset exacto de Laura:
    - 20 individuales de $600 = $12,000
    - 5 individuales de $500 = $2,500
    - 2 grupales de $2,000 = $4,000
    - 1 evaluación de $4,000 = $4,000
    - 9 gratuitas ($0)
  - Validar cálculo matemático de `$22,500.00 MXN` y coincidencia exacta del texto de la contadora.
- **Hecho cuando**: La ejecución de `node backend/scripts/testReporteContadoraDesglose.js` finaliza con código 0 y 100% de aserciones superadas.
