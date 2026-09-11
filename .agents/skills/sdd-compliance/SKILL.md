---
name: sdd-compliance
description: >-
  Usa esta skill cuando el usuario solicite verificar el cumplimiento del flujo
  Spec-Driven Development (SDD) en la plantilla maestra PsicoTemplate. Audita la
  trazabilidad entre specs, código, constitución, documentación de sesión y diagrama
  de arquitectura. Verifica que cada feature implementada tenga su spec correspondiente
  y que los principios constitucionales se respeten en el código.
---

# SDD Compliance — Auditoría de Cumplimiento Spec-Driven Development

Verifica que el flujo SDD definido en `AGENTS.md` se cumple en el proyecto:

**Constitución → Spec (EARS) → Clarificación → Plan → Tareas → Implementación → Validación → Cambio**

El resultado es un artefacto `sdd_compliance_report.md` con hallazgos y estado de cumplimiento.

> **Regla**: No modifiques código ni specs durante la auditoría. Solo diagnostica y reporta.

---

## Fase 1 — Verificación Constitucional

Lee `docs/constitution.md` y verifica cada principio contra el código real:

| # | Principio | Qué verificar |
|---|---|---|
| 1 | Cifrado AES-256-GCM | Buscar `cifrar`/`descifrar` en controllers. Verificar que los campos clínicos del schema Prisma se cifran antes de persistir. |
| 2 | Aislamiento Single-Tenant | Verificar que `DATABASE_URL` es por `.env`, que no hay `tenantId` mezclando datos. |
| 3 | Frontend ligero sin build | Verificar que no hay `package.json` en el frontend público, no hay webpack/vite/React. |
| 4 | Autenticación robusta | Verificar JWT con expiración, bcrypt con costo ≥ 10, sin bypasses. |
| 5 | Seguridad en profundidad | Verificar Helmet, CSP, HSTS, Zod, rate-limiting, 0 SQL raw. |
| 6 | Integridad de la Plantilla | Verificar que los 4 módulos (Agenda, Expedientes, Pagos, WhatsApp/Contacto) están presentes y funcionales. |

### Cómo verificar
- Leer los archivos de implementación relevantes (crypto.js, authMiddleware.js, index.js, schema.prisma).
- Usar `grep_search` para patrones clave (`$queryRaw`, `eval(`, bypass, etc.).
- Documentar cada principio como ✅ Cumple / ⚠️ Parcial / ❌ No cumple con evidencia.

---

## Fase 2 — Trazabilidad Spec → Código

### 2.1 Inventario de Specs
Listar todas las specs en `specs/`:
```bash
ls -la specs/
```

Para cada spec encontrada:
1. Leer `specs/00X-nombre/spec.md`.
2. Extraer los requisitos funcionales numerados (RF-1, RF-2...).
3. Verificar que cada RF tiene implementación correspondiente en el código.
4. Documentar el estado de cada RF:

| RF | Descripción | ¿Implementado? | Archivo(s) | Evidencia |
|---|---|---|---|---|
| RF-1 | ... | ✅ / ❌ | ... | ... |

### 2.2 Features sin Spec
Buscar funcionalidades implementadas que **no tienen spec documentada**:
- Revisar los módulos del panel (`panel/js/*.js`) y controllers del backend.
- Comparar con el listado de specs.
- Features sin spec son hallazgos de severidad media (proceso SDD no se siguió).

### 2.3 Orden Spec → Código en Git
Verificar que las specs se crearon/actualizaron **antes** del código:
```bash
# Ver cuándo se creó/modificó la spec vs el código
git log --follow --format="%h %ai %s" -- specs/001-*/spec.md
git log --format="%h %ai %s" -- contacto.html js/main.js
```
Si el código se implementó antes de la spec, documentar como hallazgo.

---

## Fase 3 — Estado de la Documentación Operativa

### 3.1 `overview/session.md`
- ¿Refleja el estado actual del proyecto?
- ¿Las secciones "Qué se logró", "En qué quedó" y "Próximo paso" están completas?
- ¿Hay contenido duplicado o desactualizado?

### 3.2 `overview/tasks.md`
- ¿Las tareas "En Progreso" reflejan trabajo actual o están abandonadas?
- ¿Las tareas "Completadas" se corresponden con commits reales?
- ¿El "Backlog" está priorizado y es realista?
- ¿Hay tareas que deberían estar completadas pero no se marcaron?

### 3.3 `overview/architecture.md`
Verificar que el diagrama Mermaid refleja la estructura real:
- ¿Todos los módulos JS del panel están listados?
- ¿Todos los controllers y routes del backend están representados?
- ¿Las relaciones (flechas) son correctas?
- ¿Se mencionan tecnologías/servicios que ya no existen o faltan los nuevos?

Comparar el diagrama con:
```bash
ls panel/js/
ls backend/src/controllers/
ls backend/src/routes/
```

### 3.4 `overview/learning.md`
- ¿Hay propuestas pendientes de revisión que deberían haberse promovido a regla?
- ¿Los aprendizajes documentados siguen siendo relevantes?

---

## Fase 4 — Integridad de la Plantilla Maestra

### 4.1 Datos Residuales
Buscar datos de otros clientes o datos reales que no deberían estar en la plantilla:
```bash
# Buscar nombres, ciudades o datos de clientes anteriores
grep -rniE "(nombre_cliente_real|ciudad_real)" --include="*.html" --include="*.js" --include="*.json"
```

Ajustar la búsqueda según el historial del proyecto.

### 4.2 Paleta Oficial
Verificar que se preservan los colores de marca de la plantilla según `AGENTS.md`:
- Teal Clínico: `#0D9488`
- Azul Zafiro: `#2563EB`

```bash
grep -rn "#0D9488" --include="*.css" --include="*.html"
grep -rn "#2563EB" --include="*.css" --include="*.html"
```

### 4.3 Checklist de Onboarding
Verificar que la guía de onboarding en `AGENTS.md` §6 es completa y funcional:
- ¿Los pasos son ejecutables paso a paso?
- ¿Los scripts mencionados existen (`seedUser.js`, etc.)?
- ¿Hay pasos faltantes que deberían documentarse?

---

## Fase 5 — Generación del Reporte

Crear el artefacto `sdd_compliance_report.md` con:

1. **Cumplimiento Constitucional**: Tabla principio por principio con veredicto y evidencia.
2. **Trazabilidad de Specs**: Tabla RF por RF de cada spec, con estado de implementación.
3. **Features sin Spec**: Lista de funcionalidades implementadas sin spec documentada.
4. **Estado de Documentación**: Veredicto por cada archivo de `overview/`.
5. **Integridad de Plantilla**: Datos residuales, paleta, onboarding.
6. **Recomendaciones**: Priorizadas por impacto en el proceso SDD.

---

## Guardrails

- **No modifiques** código, specs ni documentación durante la auditoría.
- **Lee `docs/constitution.md` y `AGENTS.md` primero** — son la fuente de verdad del proceso SDD.
- **Sé estricto**: Si una feature no tiene spec, es un hallazgo aunque funcione correctamente.
- **Optimiza tokens**: Usa `grep_search` antes de leer archivos completos.
