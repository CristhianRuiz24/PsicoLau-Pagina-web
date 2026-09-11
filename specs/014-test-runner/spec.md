# Especificación: Consolidación del Test Runner (014-test-runner)

## Contexto y Motivación
Actualmente, los scripts de prueba en `backend/scripts/` (ej. `testContabilidad.js`, `testZoomFlow.js`) se ejecutan de manera aislada mediante comandos individuales. A medida que el proyecto crece, es fundamental contar con un test runner unificado que permita ejecutar toda la suite de validación con un solo comando (`npm test`) garantizando que no se introduzcan regresiones.

## Objetivos
- Unificar la ejecución de todos los scripts de validación bajo el comando `npm test`.
- Aprovechar el módulo nativo `node:test` (Node.js 24) sin añadir dependencias externas pesadas.
- Mantener la limpieza estricta de la base de datos (bloques `finally`) y el reporte explícito de errores.

## Requisitos Funcionales (EARS)

- **RF-1 (Evento):** CUANDO el desarrollador ejecute el comando `npm run test` (o `npm test`), EL SISTEMA ejecutará automáticamente todos los archivos prefijados con `test` dentro del directorio `backend/scripts/`.
- **RF-2 (Ubicuo):** EL SISTEMA utilizará la API nativa de Node.js (`node:test` y `node:assert`) para la estructuración (`describe`, `test`/`it`) y validación, rechazando el uso de frameworks externos como Jest o Mocha.
- **RF-3 (Excepción):** SI alguna de las pruebas dentro de los scripts falla, ENTONCES EL SISTEMA terminará el proceso del test runner con código de salida no nulo (exit code `1`), reflejando el fallo en la consola.
- **RF-4 (Ubicuo):** EL SISTEMA preservará rigurosamente los bloques `finally` en la lógica de pruebas para garantizar la eliminación (limpieza) de registros de prueba en la base de datos, evitando que se generen datos huérfanos.
- **RF-5 (Condicional):** DONDE existan scripts que dependan del servidor en ejecución (haciendo peticiones a `localhost:3001`), EL SISTEMA documentará o manejará el requerimiento de que el entorno de desarrollo esté activo (`npm run dev`) antes de la ejecución de la suite.

## Fuera de Alcance (Out of Scope)
- Migrar el código frontend o escribir pruebas unitarias de UI.
- Modificar la lógica interna de los controladores de Express.
- Automatización de CI/CD (GitHub Actions, etc.) en este paso (solo se prepara la base local).

## Casos Límite y Riesgos
- **Riesgo:** Ejecución paralela podría causar colisiones si múltiples pruebas insertan/borran el mismo tipo de dato y asumen que la base de datos está vacía. **Mitigación:** Configurar el test runner nativo de Node para ejecución secuencial si es necesario, o mantener aislamiento criptográfico/UUID en los datos de prueba.
