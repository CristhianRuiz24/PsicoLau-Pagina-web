# Plan Técnico: Test Runner Unificado

## Decisiones Técnicas

### 1. Motor de Pruebas
- **Seleccionado:** `node:test` y `node:assert` (Nativo en Node.js >= 20).
- **Descartado:** Jest / Vitest / Mocha.
- **Motivo:** El proyecto ya se basa en dependencias mínimas. Añadir un test runner de terceros agregaría configuración innecesaria, dependencias en `node_modules` y tiempo de compilación. Las pruebas actuales ya se ejecutan bien de manera independiente; solo necesitan orquestación.

### 2. Estrategia de Refactorización de Scripts
- **Patrón Actual:** Scripts independientes que declaran un `async function main() { ... }` autoejecutable. Usan `console.log` y `throw new Error()` o `process.exit(1)`.
- **Nuevo Patrón:** 
  - Importar `test` de `node:test` y `assert` de `node:assert`.
  - Envolver la función principal dentro de un bloque `test('Nombre de la suite', async (t) => { ... })`.
  - Reemplazar las validaciones manuales (`if (!condicion) throw new Error()`) por `assert.strictEqual` o `assert.ok()`.
  - Conservar estrictamente los bloques `try...finally` para la limpieza de la base de datos dentro del test o usar ganchos `after()`.

### 3. Modificación del package.json
- **Script:** Se actualizará el script `test` en `backend/package.json` a:
  ```json
  "scripts": {
    "test": "node --test scripts/test*.js"
  }
  ```
  O alternativamente (para compatibilidad Windows/Mac), un script orquestador `scripts/runTests.js` si la expansión de globs falla.

### 4. Orquestación y Concurrencia
- Como las pruebas interactúan directamente con la base de datos de desarrollo y algunas pueden mutar datos globales (ej. cambio de contraseñas de admin), la ejecución paralela podría generar condiciones de carrera (Race Conditions). 
- **Decisión:** La ejecución por defecto será secuencial (o bien cada script utilizará usuarios/pacientes con identificadores únicos `Date.now()` como ya lo hacen muchos). En `node:test` los archivos se ejecutan en procesos separados. Aseguraremos que cada archivo limpia sus propios recursos.

## Archivos Afectados
- `backend/package.json`
- `backend/scripts/test*.js` (Se irán refactorizando uno por uno o en lotes para adaptar al patrón `node:test`).
