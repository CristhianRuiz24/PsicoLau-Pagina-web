# Tareas Atómicas: Test Runner Unificado (014-test-runner)

- [x] **T1: Configuración Inicial del Runner**
  - **Acción:** Actualizar `backend/package.json` para definir el script `"test": "node scripts/runTests.js"` e implementar el orquestador con detección de servidor y fallback efímero.
  - **Hecho cuando:** Ejecutar `npm test` en `backend/` levanta el test runner nativo e intenta ejecutar los archivos existentes.

- [x] **T2: Refactorización de Tests de Utilidades (Aislamiento)**
  - **Acción:** Migrar `testInmutabilidadTipos.js`, `testPagosModulos.mjs` y `testContadoresSemanales.js` a `node:test` y `node:assert`.
  - **Hecho cuando:** Estos scripts se ejecutan correctamente a través de `npm test`, muestran checkmarks verdes en consola y pasan al 100%.

- [x] **T3: Refactorización de Tests de Agenda y Expedientes (Integración)**
  - **Acción:** Migrar `testCitasRecurrentes.js`, `testAutocompletadoGrupal.js`, `testBuscarExpedienteSesion.js`, `testExpediente.js`, `testVisibilidadCanceladas.js`.
  - **Hecho cuando:** Todos estos scripts utilizan la estructura `test()` y mantienen su limpieza rigurosa en `finally`.

- [x] **T4: Refactorización de Tests de Contabilidad y Pagos (Integración)**
  - **Acción:** Migrar `testContabilidad.js`, `testContabilidadMesCompleto.js`, `testReporteContadoraDesglose.js`.
  - **Hecho cuando:** Se validan correctamente los flujos contables usando `node:assert` y los registros se limpian al terminar.

- [x] **T5: Refactorización de Tests de Seguridad y Otros**
  - **Acción:** Migrar `testCambioPassword.js`, `testAislamientoYAutocompletado.js`, `testBlindajeEmail500.js`, `verifyEndpoints.js`, `verifySecurityHeaders.js`, `testDeletePaciente.js`, `testGrupalFlow.js`, `testHttpDelete.js`, `testWhatsAppEvaluaciones.js`, `testZoomFlow.js`.
  - **Hecho cuando:** La suite completa de seguridad pasa exitosamente sin dejar registros temporales en DB.

- [x] **T6: Validación Final de la Suite Completa**
  - **Acción:** Ejecutar `npm test` completo asegurando que todos los tests corren y pasan secuencialmente.
  - **Hecho cuando:** Todos los 21 archivos de prueba en `backend/scripts/` pasan en una sola ejecución unificada (26 tests/subtests, 0 fallos, ~66s).
