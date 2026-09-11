# Spec 020 — Configuración de Linter Automatizado (ESLint) en Backend

## 1. Contexto y Objetivo
El backend de PsicoLau ha alcanzado una madurez arquitectónica considerable tras las Specs 010 a 019 (Express 5, cifrado AES-256-GCM, suites nativas con `node:test`, Zod, rate limiting aislado). Aunque las convenciones de código (`camelCase`, `UPPER_SNAKE_CASE`, ausencia de variables huérfanas) se han mantenido con rigurosa disciplina manual, el proyecto no cuenta actualmente con un analizador estático automatizado en `devDependencies`.

El objetivo de esta spec es incorporar una configuración ligera, moderna y no intrusiva de **ESLint** en `backend/` para prevenir errores comunes de sintaxis, variables sin uso (`no-unused-vars`) y asegurar la consistencia del código sin introducir dependencias pesadas ni fricciones en el flujo de desarrollo.

---

## 2. Usuarios / Actores
- **Desarrollador / Agente de IA**: Ejecuta `npm run lint` para auditar estáticamente la calidad del código antes de ejecutar pruebas o confirmaciones.
- **Laura (Psicóloga)**: Se beneficia de una plataforma con menor probabilidad de regresiones o defectos de código.

---

## 3. Historias de Usuario
- **H1**: Como desarrollador, quiero ejecutar `npm run lint` en el backend para identificar rápidamente variables no utilizadas, errores tipográficos o patrones propensos a fallos en tiempo de desarrollo.
- **H2**: Como desarrollador, quiero que la configuración de ESLint sea ligera y adaptada al entorno Node.js CommonJS/ESM del proyecto, para no generar advertencias innecesarias en scripts de prueba ni en controladores.

---

## 4. Requisitos Funcionales (Criterios en Notación EARS)

### RF-1: Comando Canónico de Linting
- **CUANDO** el desarrollador ejecute `npm run lint` dentro del directorio `backend/`, **EL SISTEMA** analizará todos los archivos JavaScript en `src/` y `scripts/` reportando cualquier infracción de estilo o sintaxis.

### RF-2: Detección de Variables y Parámetros No Utilizados
- **CUANDO** un archivo en `backend/src/` declare una variable o importe que nunca es referenciada, **EL SISTEMA** emitirá una advertencia o error indicando el nombre y la línea exacta.

### RF-3: Compatibilidad con Entornos Node.js y Pruebas Nativas
- **EL SISTEMA** reconocerá automáticamente las variables globales nativas de Node.js (`process`, `Buffer`, `__dirname`, `module`, `require`, `console`, `fetch`, `setTimeout`) y del test runner nativo (`test`, `describe`, `it`) sin marcarlas como indefinidas (`no-undef`).

### RF-4: Cero Impacto en Ejecución y Producción
- **MIENTRAS** el backend se ejecute en producción (`npm start`), **EL SISTEMA** operará sin requerir ni invocar ESLint (paquete confinado exclusivamente a `devDependencies`).

---

## 5. Requisitos No Funcionales & Seguridad
- **Alineación Constitucional**: Cumple el Principio #3 (sin dependencias innecesarias en producción) y Principio #6 (no rompe lo que ya funciona).
- **Rendimiento**: La ejecución de `npm run lint` debe completarse en menos de 5 segundos.
- **Sobrecarga Mínima**: Utilizar configuración estándar de ESLint con el menor número posible de plugins adicionales.

---

## 6. Casos Límite y Manejo de Errores
- **Parámetros ignorados intencionalmente**: Parámetros de middleware como `(err, req, res, next)` o variables con prefijo `_` (ej. `_err`, `_val`) deben ser permitidos sin generar advertencias de variables no usadas.
- **Archivos de prueba `.mjs` vs `.js`**: La configuración debe soportar sintaxis CommonJS en `src/` e imports ESM en scripts con extensión `.mjs`.

---

## 7. Fuera de Alcance (Out of Scope)
- Modificación del frontend público (`*.html`, `js/`, `css/`).
- Reglas invasivas o dogmáticas que fuercen reescritura masiva de código funcional.
- Formateadores automáticos invasivos que alteren el formato visual de líneas estables.

---

## 8. Criterios de Finalización (Definition of Done)
- [ ] `eslint` instalado en `devDependencies` de `backend/package.json`.
- [ ] Archivo de configuración de ESLint configurado y adaptado a Node.js y `src/` / `scripts/`.
- [ ] Script `"lint": "eslint src/ scripts/"` añadido a `backend/package.json`.
- [ ] `npm run lint` ejecutado con 0 errores bloqueantes.
- [ ] Suite completa `npm test` ejecutada con 40/40 pruebas pasando exitosamente.
