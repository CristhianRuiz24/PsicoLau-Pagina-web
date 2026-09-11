# Plan Técnico: Spec 013 - Refactorización de Pagos

## 1. Análisis del Problema
Actualmente, el archivo `panel/js/pagos.js` tiene 566 líneas y sufre de alta duplicación en la determinación de montos y tipos de cita. Específicamente, este bloque se repite en las funciones `renderReporteMensual`, `copiarReporteParaContadora` y `descargarReporteCSV`:
```javascript
const tipo = detectarTipoCita(c);
const monto = typeof c.monto === 'number' ? c.monto : (tipo === 'EVALUACION' ? 4000 : 500);
const esPagado = c.estado_pago === 'PAGADO';
```
Además, el archivo completo no sigue el estándar ES Modules introducido en la **Spec 010** para `agenda` y `expedientes`.

## 2. Arquitectura Propuesta

Se dividirá `pagos.js` en la siguiente estructura de árbol en `panel/js/pagos/`:
```text
panel/js/pagos/
├── index.js             # Entry point (adjunta funciones al window)
├── utils/
│   ├── contabilidad.js  # detectarTipoCita(), obtenerMontoSesion(), formatearMoneda()
│   └── periodo.js       # Estado del mes/año seleccionado, cambiarMesReporte()
├── render/
│   ├── auditoria.js     # renderAuditoriaPagos()
│   └── reporte.js       # renderReporteMensual(), actualizarTarjetasKPIs()
├── export/
│   ├── contadora.js     # copiarReporteParaContadora()
│   └── csv.js           # descargarReporteCSV()
└── actions/
    ├── modal.js         # abrir/cerrar modales (Auditoría, Reporte, DatosPago)
    └── pagoState.js     # cambiarPagoDirecto(), togglePagoDesdeAuditoria(), etc.
```

## 3. Decisiones Técnicas

### 3.1. Estado Compartido
**Alternativa 1**: Pasar el mes y año como parámetros a todas las funciones.
**Alternativa 2 (Elegida)**: Mantener `mesReporteSeleccionado` y `anioReporteSeleccionado` en un módulo `utils/periodo.js` que exporte getters y setters.
**Motivo**: Minimiza la refactorización de las llamadas a funciones y respeta la naturaleza "stateful" que actualmente tiene el modal de reporte.

### 3.2. Carga del Módulo
**Alternativa 1**: Lazy-load dinámico (`import()`) cuando se abre el modal, como en Expedientes.
**Alternativa 2 (Elegida)**: Carga en `app.js` (o cargado mediante `<script type="module" src="/panel/js/pagos/index.js">` en `agenda.html`) porque los badges de pago en las tarjetas de la agenda también dependen de estas funciones de auditoría/pago directo.
**Motivo**: Necesitamos las funciones de pago disponibles inmediatamente en la vista de la agenda.

## 4. Contratos (API Interna)

El nuevo módulo `utils/contabilidad.js` expondrá:
```javascript
export function detectarTipoCita(cita) { ... }
export function obtenerMontoSesion(cita, tipo) { ... }
export function formatearMoneda(monto) { ... }
export function procesarCitasParaReporte(citasCache, mes, anio) { ... }
```
Estas 4 funciones gobernarán absolutamente toda la lógica matemática, asegurando que si la tarifa de evaluación cambia mañana (ej. a $4500), solo se edite una línea de código en todo el frontend.
