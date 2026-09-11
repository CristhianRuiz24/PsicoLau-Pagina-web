# Tareas Técnicas — Spec 020: Configuración de Linter Automatizado (ESLint) en Backend

## Tareas Atómicas

### [x] T1: Instalación de ESLint en DevDependencies
- **Archivos**: `backend/package.json`
- **Acción**: Instalar `eslint` en `devDependencies` de `backend/` mediante `npm install -D eslint`.
- **Hecho cuando**: `eslint` está presente en `devDependencies` de `package.json` con versión moderna compatible (`^10.10.0`).
- **Estado**: Completado.

### [x] T2: Configuración de ESLint Flat Config
- **Archivos**: `backend/eslint.config.js`
- **Acción**: Crear la configuración moderna de ESLint para Node.js con entornos globales (`globals.node`), reglas esenciales de prevención de errores y soporte para `_` en variables no usadas.
- **Hecho cuando**: `eslint.config.js` está creado y es reconocido por ESLint.
- **Estado**: Completado.

### [x] T3: Añadir Script Canónico `"lint"` y Validación
- **Archivos**: `backend/package.json`
- **Acción**: Añadir `"lint": "eslint src/ scripts/"` a la sección `scripts`. Ejecutar `npm run lint` y verificar que el código pase limpiamente.
- **Hecho cuando**: `npm run lint` se ejecuta con éxito reportando 0 errores y 0 advertencias.
- **Estado**: Completado.

### [x] T4: Verificación Integral de No-Regresión y Documentación
- **Archivos**: `overview/session.md`, `overview/tasks.md`
- **Acción**: Ejecutar `npm test` para asegurar que la suite sigue pasando 40/40 tests (100% verde) y actualizar la documentación SDD.
- **Hecho cuando**: La suite unificada está 100% en verde (40/40 pasadas) y la memoria de sesión refleja el cierre de la Spec 020.
- **Estado**: Completado.
