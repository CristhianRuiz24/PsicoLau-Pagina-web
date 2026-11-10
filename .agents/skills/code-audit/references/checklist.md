# Checklist Granular — Code Audit

> Referencia detallada para verificación item por item. Cada fase del SKILL.md usa esta lista.

---

## Fase 1 — Nomenclatura y Formato

### Linting Automatizado
- [ ] ¿Existe configuración de linter (`.eslintrc`, `.prettierrc`, `pylintrc`)?
- [ ] ¿El linter se ejecuta sin errores críticos?
- [ ] ¿Hay reglas de formato deshabilitadas con `// eslint-disable` en exceso (>10 instancias)?

### Convenciones de Naming
- [ ] Variables y funciones siguen la convención del lenguaje (`camelCase` JS, `snake_case` Python)
- [ ] Clases y constructores usan `PascalCase`
- [ ] Constantes usan `UPPER_SNAKE_CASE`
- [ ] Archivos siguen convención consistente (`kebab-case` o `camelCase`)
- [ ] No hay nombres de una sola letra fuera de iteradores (`i`, `j`) o lambdas cortas
- [ ] Los booleanos usan prefijos semánticos (`is`, `has`, `should`, `can`)

### Revisión Semántica
- [ ] Los nombres revelan intención sin contexto externo
- [ ] No hay abreviaciones crípticas (`fn`, `cb`, `tmp`, `mgr`, `impl`)
- [ ] Los nombres de funciones empiezan con verbo (`obtener`, `calcular`, `validar`, `renderizar`)
- [ ] No hay nombres engañosos (función que hace más de lo que su nombre indica)

### Documentación Interna
- [ ] Módulos/archivos tienen comentario de cabecera con propósito
- [ ] Los comentarios explican el **por qué**, no el **qué**
- [ ] No hay comentarios redundantes (`// Incrementar contador` antes de `counter++`)
- [ ] No hay bloques de código comentado >10 líneas (debería estar en Git history)

---

## Fase 2 — Simplicidad y Diseño

### Complejidad
- [ ] No hay funciones con complejidad ciclomática > 20
- [ ] No hay funciones > 80 líneas
- [ ] No hay anidamiento > 3 niveles de profundidad
- [ ] No hay ternarios anidados o cadenas de `? : ? :`
- [ ] No hay switch/case con > 10 casos (usar lookup table o polimorfismo)

### Principio de Responsabilidad Única (SRP)
- [ ] Cada archivo/módulo tiene un solo motivo para cambiar
- [ ] No hay "god objects" (clases/módulos que hacen demasiado)
- [ ] Los controladores no mezclan validación + lógica de negocio + formato de respuesta
- [ ] Las funciones de renderizado no contienen lógica de negocio

### YAGNI
- [ ] No hay funciones exportadas que nunca se importan
- [ ] No hay parámetros de función que nunca se usan
- [ ] No hay ramas condicionales para features no implementadas
- [ ] No hay abstracciones prematuras (interfaces/clases base con una sola implementación)

---

## Fase 3 — Mantenibilidad y Modularidad

### DRY / Duplicados
- [ ] No hay funciones idénticas en múltiples archivos
- [ ] No hay bloques de lógica copy-paste (>5 líneas repetidas)
- [ ] La lógica reutilizada está extraída a módulos utils/helpers compartidos
- [ ] Las constantes mágicas están definidas como named constants

### Modularización
- [ ] Archivos > 50 KB están justificados o propuestos para partición
- [ ] Archivos > 25 KB tienen responsabilidades claramente cohesivas
- [ ] No hay dependencias circulares entre módulos
- [ ] Los imports/requires son explícitos (no `import *`)

### Historial Git
- [ ] Los mensajes de commit son descriptivos (no "fix", "update", "wip")
- [ ] Los commits son atómicos (un cambio lógico por commit)
- [ ] No hay commits masivos (>20 archivos modificados sin justificación)
- [ ] Se usa estrategia de ramas (feature branches) o al menos hay trazabilidad

---

## Fase 4 — Calidad y Manejo de Errores

### Tests
- [ ] Existen archivos de test (unitarios y/o integración)
- [ ] Los tests se ejecutan sin errores
- [ ] Los tests cubren happy paths (flujo exitoso)
- [ ] Los tests cubren edge cases (entradas vacías, nulas, límites)
- [ ] Los tests cubren error paths (excepciones, respuestas 4xx/5xx)
- [ ] Cobertura de código medida y documentada

### Gestión de Excepciones
- [ ] Todas las operaciones async tienen try/catch o .catch()
- [ ] No hay catch vacíos que tragan errores silenciosamente
- [ ] Los errores se registran en logs con contexto suficiente
- [ ] Los stack traces NO se exponen al usuario final en producción
- [ ] Los mensajes de error al usuario son genéricos y no revelan internos
- [ ] El sistema degrada elegantemente (no se cae ante un error individual)
- [ ] Los errores de validación devuelven mensajes útiles al usuario

---

## Fase 5 — Seguridad y Protección de Datos

### Inyección y Sanitización
- [ ] Todas las entradas de usuario se validan con esquemas tipados (Zod, Joi, etc.)
- [ ] No hay SQL raw sin parametrizar (`$queryRaw`, concatenación de strings)
- [ ] No hay uso de `eval()`, `Function()`, o equivalentes
- [ ] Los usos de `innerHTML` sanitizan datos con funciones de escape
- [ ] No hay `exec()` / `spawn()` con input de usuario sin sanitizar

### Cifrado y Autenticación
- [ ] Datos sensibles cifrados en reposo con algoritmo moderno (AES-256-GCM, no ECB)
- [ ] Contraseñas hasheadas con bcrypt/scrypt/Argon2 (costo ≥ 10)
- [ ] Tokens JWT con expiración definida y secreto fuerte (≥ 32 bytes)
- [ ] HTTPS obligatorio (HSTS configurado)
- [ ] No hay bypasses de autenticación en ningún entorno

### Secretos
- [ ] `.env` está en `.gitignore`
- [ ] No hay credenciales, API keys o tokens hardcoded en código fuente
- [ ] Los valores de `.env.example` son placeholders obvios, no secretos reales
- [ ] Los archivos `docker-compose.yml` no contienen secretos en texto plano

### Dependencias
- [ ] `npm audit` (o equivalente) ejecutado sin vulnerabilidades críticas
- [ ] No hay dependencias no utilizadas en `package.json`
- [ ] Las versiones están fijadas o usan rangos seguros (`^` o `~`)

### Configuración
- [ ] CORS no usa wildcard `*` en producción
- [ ] Helmet u equivalente de security headers configurado
- [ ] Rate limiting en rutas sensibles (login, registro, formularios públicos)
- [ ] CSP configurado y sin `'unsafe-eval'`
- [ ] `X-Frame-Options: DENY` para prevenir clickjacking
