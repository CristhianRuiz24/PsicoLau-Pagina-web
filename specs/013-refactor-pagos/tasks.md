# Tareas: Spec 013 - Refactorización de Pagos

## Fase 1: Estructura y Utilidades Base
- [x] **T1.1** Crear la carpeta `panel/js/pagos/` y sus subcarpetas (`utils`, `render`, `export`, `actions`).
- [x] **T1.2** Crear `panel/js/pagos/utils/contabilidad.js` extrayendo y mejorando `detectarTipoCita`, y añadiendo `obtenerMontoSesion` y `formatearMoneda`.
- [x] **T1.3** Crear `panel/js/pagos/utils/periodo.js` para manejar las variables globales de estado `mesReporteSeleccionado` y `anioReporteSeleccionado`.

## Fase 2: Módulos de Acciones y Renderizado
- [x] **T2.1** Crear `panel/js/pagos/actions/modal.js` extrayendo las funciones de abrir/cerrar modal (Datos de Pago, Auditoría, Reporte).
- [x] **T2.2** Crear `panel/js/pagos/actions/pagoState.js` extrayendo la interacción directa con el backend (`cambiarPagoDirecto`, `togglePagoDesdeAuditoria`, `togglePagoDesdeReporte`).
- [x] **T2.3** Crear `panel/js/pagos/render/auditoria.js` portando `renderAuditoriaPagos` y adaptándolo a usar `utils/contabilidad.js`.
- [x] **T2.4** Crear `panel/js/pagos/render/reporte.js` portando `renderReporteMensual` y limpiando la lógica de cálculo de KPIs para usar `obtenerMontoSesion`.

## Fase 3: Módulos de Exportación
- [x] **T3.1** Crear `panel/js/pagos/export/contadora.js` portando `copiarReporteParaContadora` eliminando la duplicación de código mediante el uso de los utilitarios centrales.
- [x] **T3.2** Crear `panel/js/pagos/export/csv.js` portando `descargarReporteCSV` consumiendo `obtenerMontoSesion` y `detectarTipoCita`.

## Fase 4: Integración
- [x] **T4.1** Crear el entry point `panel/js/pagos/index.js` que importe todos los submódulos y adjunte las funciones necesarias al objeto `window` (para retrocompatibilidad con los atributos `onclick` en el HTML).
- [x] **T4.2** Modificar `panel/agenda.html` para incluir el nuevo script de pagos `<script type="module" src="/panel/js/pagos/index.js"></script>` y eliminar el `<script src="/panel/js/pagos.js"></script>` antiguo.
- [x] **T4.3** Sustituir el archivo legado `panel/js/pagos.js` con un puente/shim de retrocompatibilidad ESM.

## Fase 5: Validación
- [x] **T5.1** Probar el cálculo de montos abriendo el modal "Reporte Contable Mensual".
- [x] **T5.2** Probar "Copiar para Contadora" verificando que los totales sean exactos.
- [x] **T5.3** Ejecutar la suite de pruebas del backend (`testContabilidad.js` y `testContabilidadMesCompleto.js`, más `testPagosModulos.mjs`) asegurando 100% de aprobación sin regresiones.
