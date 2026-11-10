---
name: code-audit
description: >-
  Usa esta skill cuando el usuario solicite una auditoría de código, revisión de calidad,
  análisis de buenas prácticas o evaluación técnica integral de un proyecto. Ejecuta una
  auditoría estructurada en 5 dimensiones: nomenclatura y formato, simplicidad y diseño
  (KISS/YAGNI/SOLID), mantenibilidad y modularidad (DRY), calidad y manejo de errores,
  y seguridad y protección de datos. Produce un reporte con hallazgos categorizados por
  severidad y recomendaciones priorizadas.
---

# Code Audit — Auditoría Técnica Integral de Código

Ejecuta una auditoría estructurada de código en **5 dimensiones** con herramientas automatizadas y revisión manual. El resultado es un artefacto `audit_report.md` con hallazgos categorizados por severidad (🔴 Crítico / 🟡 Medio / 🟢 Bajo / ✅ OK).

> **Regla**: No modifiques código durante la auditoría. Solo diagnostica y reporta.

---

## Fase 0 — Reconocimiento del Proyecto

Antes de auditar, establece el contexto:

1. Lee la estructura de directorios del proyecto con `list_dir` (raíz y subdirectorios principales).
2. Identifica el **stack tecnológico**: lenguajes, frameworks, gestor de paquetes, base de datos.
3. Identifica los **archivos de configuración** relevantes: `package.json`, `tsconfig.json`, `.eslintrc`, `.prettierrc`, `Dockerfile`, `docker-compose.yml`, `.env.example`, `.gitignore`.
4. Construye un **inventario de archivos** agrupado por capa (frontend, backend, infra, docs) con tamaño en KB.
5. Determina las herramientas disponibles en el proyecto (¿tiene ESLint instalado? ¿tiene tests? ¿tiene linter configurado?).

---

## Fase 1 — Nomenclatura y Formato

### 1.1 Análisis Estático con Linter
- Si el proyecto tiene ESLint/linter configurado: ejecutar `npx eslint . --format json` y reportar errores/warnings.
- Si **no** tiene linter: documentarlo como hallazgo y ejecutar un análisis manual de convenciones.

### 1.2 Revisión de Convenciones de Naming
Verificar consistencia del estilo de nomenclatura según el lenguaje:

| Lenguaje | Variables/Funciones | Clases/Constructores | Constantes | Archivos |
|---|---|---|---|---|
| JavaScript/Node | `camelCase` | `PascalCase` | `UPPER_SNAKE_CASE` | `kebab-case` o `camelCase` |
| Python | `snake_case` | `PascalCase` | `UPPER_SNAKE_CASE` | `snake_case` |
| CSS | `kebab-case` | N/A | `--kebab-case` | `kebab-case` |

Buscar violaciones con `grep_search` usando patrones regex por archivo/lenguaje.

### 1.3 Revisión Semántica de Nombres
Revisar manualmente una muestra representativa (~20 funciones/variables) verificando:
- ¿El nombre revela la intención funcional sin requerir contexto externo?
- ¿Se evitan abreviaciones crípticas (`fn`, `cb`, `tmp`, `x`) excepto en scopes muy cortos?
- ¿Los booleanos usan prefijos `is`, `has`, `should`, `can`?

### 1.4 Evaluación de Documentación Interna
Revisar comentarios en archivos clave:
- ¿Los comentarios explican el **por qué** (decisión de negocio, workaround, contexto) y no el **qué** (sintaxis obvia)?
- ¿Hay comentarios redundantes tipo `// incrementar el contador` antes de `counter++`?
- ¿Los módulos/archivos tienen un comentario de cabecera que explique su propósito?

---

## Fase 2 — Simplicidad y Diseño (KISS, YAGNI, SOLID)

### 2.1 Complejidad Ciclomática y Cognitiva
Ejecutar análisis de complejidad:

```bash
# Para proyectos JavaScript/Node.js:
npx cr -f json .

# Alternativa universal si cr no está disponible:
# Usar grep para contar if/else/switch/for/while/catch por función
```

Umbrales de evaluación:
| Complejidad Ciclomática | Veredicto |
|---|---|
| 1–10 | ✅ Simple, bajo riesgo |
| 11–20 | 🟡 Moderada, considerar refactorizar |
| 21–50 | 🔴 Compleja, refactorizar obligatorio |
| 50+ | 🔴 Crítica, alto riesgo de defectos |

Si no hay herramienta disponible, buscar manualmente funciones con >80 líneas y contar ramificaciones (if/else/switch/ternarios anidados).

### 2.2 Principio de Responsabilidad Única (SRP)
Para cada archivo/módulo evaluar:
- ¿Tiene un **solo motivo para cambiar**?
- ¿El nombre del archivo refleja una sola responsabilidad?
- Archivos > 500 líneas son candidatos automáticos a revisión SRP.

### 2.3 YAGNI — Código Muerto y Especulativo
Buscar con `grep_search`:
- Funciones/clases exportadas pero nunca importadas en el resto del proyecto.
- Bloques comentados extensos (>10 líneas de código comentado).
- Variables declaradas pero nunca usadas.
- Features o ramas condicionales para casos de uso no requeridos actualmente.

```bash
# Buscar código comentado extenso:
grep -rn "^[[:space:]]*//" --include="*.js" | head -50

# Buscar TODO/FIXME/HACK pendientes:
grep -rniE "(TODO|FIXME|HACK|XXX)" --include="*.js" --include="*.ts"
```

---

## Fase 3 — Mantenibilidad y Modularidad

### 3.1 Detección de Clones y Duplicados (DRY)
Buscar código duplicado:

```bash
# Si jscpd está disponible:
npx jscpd --min-lines 5 --min-tokens 50 --reporters console .

# Si no, buscar funciones con el mismo nombre definidas en múltiples archivos:
grep -rn "function nombreFuncion" --include="*.js"
```

Evaluar:
- ¿Hay funciones idénticas o casi idénticas en múltiples archivos?
- ¿Hay lógica de validación/sanitización repetida que debería extraerse a un utils compartido?
- ¿Hay patrones copy-paste evidentes?

### 3.2 Análisis de Modularización
Para archivos que excedan los umbrales:

| Tamaño | Acción |
|---|---|
| > 50 KB | ⚠️ Evaluación obligatoria de partición |
| 25–50 KB | 🔍 Revisar si tiene responsabilidades separables |
| < 25 KB | ✅ Aceptable si tiene cohesión |

Verificar:
- ¿Se puede separar lógica de negocio vs renderización/UI?
- ¿Los controladores backend mezclan validación + lógica + respuesta?
- ¿El CSS monolítico debería partirse por componente?

### 3.3 Auditoría del Historial Git
Ejecutar:

```bash
# Últimos 30 commits: calidad de mensajes
git log -30 --oneline

# Estrategia de ramas
git branch -a

# Archivos con más cambios (hotspots de mantenibilidad)
git log --pretty=format: --name-only -50 | sort | uniq -c | sort -rn | head -20

# Buscar commits con mensajes genéricos
git log -50 --oneline | grep -iE "^[a-f0-9]+ (fix|update|change|wip|test|asdf|temp)"
```

Evaluar:
- ¿Los mensajes de commit son descriptivos y siguen una convención (conventional commits, imperative mood)?
- ¿Se usan ramas para features o todo va directo a `main`?
- ¿Hay commits masivos (>20 archivos) que dificultan la trazabilidad?

---

## Fase 4 — Calidad y Manejo de Errores

### 4.1 Cobertura y Existencia de Tests
Verificar:
- ¿Existen archivos de test? Buscar con `list_dir` en `__tests__/`, `test/`, `spec/`, `*.test.js`, `*.spec.js`.
- Si hay tests, ejecutar `npm test` o equivalente y reportar resultados.
- Si hay reporte de cobertura, evaluar:

| Cobertura | Veredicto |
|---|---|
| > 80% | ✅ Buena |
| 50–80% | 🟡 Aceptable |
| < 50% | 🔴 Insuficiente |
| 0% (sin tests) | 🔴 Crítico |

- ¿Los tests cubren happy paths Y edge cases/errores?

### 4.2 Gestión de Excepciones
Buscar con `grep_search` y evaluar:

```bash
# try/catch: ¿se atrapan errores correctamente?
grep -rn "catch" --include="*.js"

# ¿Se loguean los errores?
grep -rn "console.error\|logger.error" --include="*.js"

# ¿Se exponen stack traces al usuario?
grep -rn "err.stack\|error.stack" --include="*.js"

# ¿Hay catch vacíos (swallowed errors)?
grep -rn "catch.*{[[:space:]]*}" --include="*.js"
```

Verificar:
- ¿Los errores se capturan explícitamente con try/catch o .catch()?
- ¿Se registran en logs sin exponer trazas internas al usuario final?
- ¿El sistema degrada elegantemente (devuelve mensajes genéricos, no se cae)?
- ¿Hay catch vacíos que tragan errores silenciosamente?

---

## Fase 5 — Seguridad y Protección de Datos

### 5.1 Sanitización y Prevención de Inyección
Buscar vectores de ataque:

```bash
# XSS: innerHTML con datos dinámicos
grep -rn "innerHTML" --include="*.js"

# eval() y funciones peligrosas
grep -rn "eval(\|Function(\|setTimeout.*string\|setInterval.*string" --include="*.js"

# SQL raw sin parametrizar
grep -rn "\$queryRaw\|\$executeRaw\|query(" --include="*.js"

# Command injection
grep -rn "exec(\|spawn(\|execSync(" --include="*.js"
```

Verificar que TODAS las entradas de usuario se validen (Zod, Joi, express-validator) ANTES de procesarse.

### 5.2 Cifrado y Protección de Datos
- ¿Se usa cifrado adecuado para datos sensibles en reposo (AES-256-GCM, no AES-ECB)?
- ¿Las contraseñas se hashean con bcrypt/scrypt/Argon2 con costo ≥ 10?
- ¿Los tokens JWT tienen expiración y usan secretos fuertes?
- ¿HTTPS es obligatorio (HSTS)?

### 5.3 Credenciales y Secretos Hardcoded
Buscar:

```bash
# API keys, passwords, tokens en código
grep -rniE "(api.?key|password|secret|token|private.?key)\s*[:=]" --include="*.js" --include="*.json" --include="*.yml" --include="*.yaml" --include="*.env*"

# .env en .gitignore
grep -n "\.env" .gitignore
```

### 5.4 Dependencias Vulnerables

```bash
npm audit --audit-level=low
# O para Python: pip-audit / safety check
```

### 5.5 Configuración de Seguridad
- CORS: ¿sin wildcard `*` en producción?
- Headers: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy.
- Rate limiting en rutas sensibles (login, API pública).
- ¿Helmet u equivalente configurado?

---

## Fase 6 — Generación del Reporte

Crear el artefacto `audit_report.md` con la siguiente estructura:

1. **Resumen Ejecutivo**: Contadores por severidad, veredicto general, score por dimensión (0-10).
2. **Tabla de Hallazgos**: ID, severidad, fase, archivo (con link clickeable), descripción, remediación.
3. **Score por Dimensión**:

| Dimensión | Score | Criterio |
|---|---|---|
| Nomenclatura y Formato | 0-10 | Consistencia, semántica, documentación |
| Simplicidad y Diseño | 0-10 | Complejidad, SRP, YAGNI |
| Mantenibilidad y Modularidad | 0-10 | DRY, modularización, historial Git |
| Calidad y Errores | 0-10 | Tests, manejo de excepciones |
| Seguridad | 0-10 | Sanitización, cifrado, secretos, dependencias |

4. **Recomendaciones Priorizadas**: Ordenadas por impacto (críticos primero).

---

## Guardrails

- **No ejecutes** comandos destructivos (`rm`, `drop`, `delete`) durante la auditoría.
- **No modifiques** ningún archivo de código fuente. La auditoría es de solo lectura.
- **No releas** archivos ya examinados en la misma sesión.
- Si una herramienta no está disponible (e.g., ESLint no instalado), documéntalo como hallazgo y continúa con alternativas manuales.
