# Plan Técnico 020 — Configuración de Linter Automatizado (ESLint) en Backend

## 1. Resumen de la Solución Técnica
Se añadirá `eslint` como dependencia de desarrollo (`devDependencies`) en `backend/package.json`. Se definirá un archivo de configuración estándar compatible con Node.js 20+ y Express 5, configurando las variables globales de Node.js, tolerando parámetros no usados con prefijo `_`, y añadiendo el script de ejecución canónico `"lint": "eslint src/ scripts/"`.

---

## 2. Alineación con la Constitución
- **Principio #1 (Cifrado)**: No tiene impacto en algoritmos ni datos clínicos.
- **Principio #2 (Separación Dev/Prod)**: Herramienta 100% de desarrollo, nunca se instala ni ejecuta en producción (`npm install --omit=dev`).
- **Principio #3 (Frontend Ligero)**: Confinado exclusivamente al directorio `backend/`.
- **Principio #6 (No Regresión)**: Las reglas no romperán ni alterarán la suite de 40 pruebas existentes.

---

## 3. Módulos y Archivos Afectados

```text
Componente       | Archivos                              | Tipo de cambio
-----------------|---------------------------------------|------------------
Backend Config   | backend/package.json                  | Modificar (devDependencies + script)
Backend Config   | backend/eslint.config.js              | Crear (Flat Config moderna de ESLint)
```

---

## 4. Modelo de Datos y Esquema
**Sin cambios.** No se modifica `schema.prisma` ni la base de datos de PostgreSQL.

---

## 5. Decisiones Técnicas y Alternativas Descartadas

| Decisión tomada | Razón técnica | Alternativa descartada y por qué |
|---|---|---|
| ESLint Flat Config (`eslint.config.js`) | Estándar oficial nativo de ESLint 9+, más rápido y sin dependencias heredadas de plugins deprecados. | Archivo `.eslintrc.json` legado: Descartado porque está en proceso de obsolescencia en ESLint moderno. |
| Reglas enfocadas en prevención de errores (`no-unused-vars`, `no-undef`, `no-unreachable`), no en formateo cosmético | Evita discrepancias de indentación o saltos de línea sin valor semántico. | Reglas de estilo estrictas (Airbnb / Standard): Descartado porque exigirían refactorizar innecesariamente decenas de archivos funcionales. |

---

## 6. Estrategia de Pruebas y Validación
1. Ejecutar `npm run lint` en `backend/` y verificar reporte limpio.
2. Ejecutar `npm test` verificando que la suite completa sigue al 100% (40/40 PASS).
