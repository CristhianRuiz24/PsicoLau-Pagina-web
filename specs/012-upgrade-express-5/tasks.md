# Tareas - Spec 012 (Express 5.x)

- [x] **T1:** Actualizar dependencia. Ejecutar `npm install express@latest` en el backend para instalar la versión 5.
  - *Hecho cuando:* `express` versión `5.x` conste en `package.json`.
- [x] **T2:** Refactorizar `agendaController.js`. Remover bloques `try/catch` redundantes.
  - *Hecho cuando:* Las rutas de agenda estén limpias y deleguen el error asíncrono nativamente.
- [x] **T3:** Refactorizar `authController.js`. Remover bloques `try/catch` redundantes.
  - *Hecho cuando:* El login delege errores correctamente.
- [x] **T4:** Refactorizar `expedienteController.js` y `pacienteController.js`. Remover bloques `try/catch` redundantes.
  - *Hecho cuando:* Se limpie la indentación de manejo de errores.
- [x] **T5:** Refactorizar `pagosController.js` y `contactoController.js`. Remover bloques `try/catch` redundantes.
  - *Hecho cuando:* Se concluya el refactor de controladores.
- [x] **T6:** Validar pruebas. Ejecutar todas las suites de prueba (`testContabilidad.js`, `testExpediente.js`, `testCambioPassword.js`, etc.).
  - *Hecho cuando:* La suite 19/19 pase con éxito.
- [x] **T7:** Validar seguridad. Ejecutar `npm audit`.
  - *Hecho cuando:* Ya no aparezcan vulnerabilidades asociadas a `qs` o dependencias base de Express.
