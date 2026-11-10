---
name: sdd-compliance
description: >-
  Usa esta skill cuando el usuario solicite verificar el cumplimiento del flujo
  Spec-Driven Development (SDD) en Web PsicoLau. Audita la trazabilidad entre specs,
  código, constitución, documentación de sesión y diagrama de arquitectura. Verifica
  que cada feature implementada tenga su spec correspondiente y que los principios
  constitucionales se respeten en el código.
---

# SDD Compliance — Auditoría de Cumplimiento Spec-Driven Development (PsicoLau)

Verifica que el flujo SDD definido en `AGENTS.md` se cumple en el proyecto:

**Constitución → Spec (EARS) → Clarificación → Plan → Tareas → Implementación → Validación → Cambio**

El resultado es un artefacto `sdd_compliance_report.md` con hallazgos y estado de cumplimiento.

> **Regla**: No modifiques código ni specs durante la auditoría. Solo diagnostica y reporta.

---

## Fase 1 — Verificación Constitucional

Lee `docs/constitution.md` y verifica cada principio contra el código real:

| # | Principio | Qué verificar |
|---|---|---|
| 1 | Cifrado AES-256-GCM | Buscar `cifrar`/`descifrar`/`cifrarPaciente` en controllers y helpers. Verificar que los campos clínicos de `Expediente` y la PII de `Paciente` se cifran antes de persistir. |
| 2 | Separación Dev y Producción | Verificar que `DATABASE_URL` es por `.env`, que ningún script de test apunta a producción y que `emailService.js` aísla envíos en modo `test`/`dev`. |
| 3 | Frontend ligero sin build | Verificar que el sitio público y `/panel` usan HTML5 + CSS3 Vanilla + JS ESM nativo sin frameworks pesados. |
| 4 | Autenticación real | Verificar JWT con expiración, `bcryptjs` con costo ≥ 10, sin bypasses en rutas de pacientes/agenda/expedientes. |
| 5 | CORS y superficie explícita | Verificar `allowedOrigins` sin `*` en producción, Helmet, CSP segmentada en `_headers`, Zod (`privacyCheck: z.literal(true)`) y rate-limiting. |
| 6 | No romper flujos de Laura | Verificar que Agenda, Expedientes, Pagos y WhatsApp/Contacto mantienen integridad de sintaxis, imports y pruebas. |

---

## Fase 2 — Trazabilidad Spec → Código

### 2.1 Inventario de Specs
Listar todas las specs en `specs/`:
```bash
ls -la specs/
```

Para cada spec evaluada:
1. Leer `specs/00X-nombre/spec.md`.
2. Extraer los requisitos funcionales numerados (`RF-1`, `RF-2`...).
3. Verificar que cada RF tiene implementación correspondiente en el código.
4. Documentar el estado de cada RF:

| RF | Descripción | ¿Implementado? | Archivo(s) | Evidencia |
|---|---|---|---|---|
| RF-1 | ... | ✅ / ❌ | ... | ... |

### 2.2 Features sin Spec
Buscar funcionalidades implementadas que **no tienen spec documentada**:
- Revisar los módulos del panel (`panel/js/`) y controllers del backend (`backend/src/controllers/`).
- Comparar con el listado de specs.

---

## Fase 3 — Estado de la Documentación Operativa

### 3.1 `overview/session.md` y `overview/archive/session-history.md`
- ¿Refleja el estado actual del proyecto con ventana deslizante activa?
- ¿Las secciones "Qué se logró", "En qué quedó" y "Próximo paso" están completas?

### 3.2 `overview/tasks.md` y `overview/archive/tasks-history.md`
- ¿Las tareas "En Progreso" y "Completadas Recientemente" están sincronizadas?

### 3.3 `overview/architecture.md`
- ¿El diagrama Mermaid refleja los módulos ESM actuales de `panel/js/` y los controladores de `backend/src/`?

### 3.4 `overview/learning.md`
- ¿Las reglas propuestas han sido revisadas o promovidas a `AGENTS.md` / `GEMINI.md`?

---

## Fase 4 — Identidad Visual e Higiene de Marca

Verificar que se preserva la paleta oficial innegociable de PsicoLau según `AGENTS.md`:
- Rosa/Coral Marca: `#EC5E86`
- Turquesa Acción: `#1E94A8` / `#3EB8CC`
- Fondo Marfil: `#FDFBF9`

```bash
grep -rn "#EC5E86" css/ panel/css/
grep -rn "#1E94A8" css/ panel/css/
```

---

## Fase 5 — Generación del Reporte

Crear el artefacto `sdd_compliance_report.md` con:
1. **Cumplimiento Constitucional**: Tabla principio por principio con veredicto y evidencia.
2. **Trazabilidad de Specs**: Tabla RF por RF de cada spec evaluada.
3. **Features sin Spec**: Lista de funcionalidades sin spec documentada.
4. **Estado de Documentación**: Veredicto por cada archivo de `overview/`.
5. **Integridad Visual y Seguridad**: Paleta oficial, CSP y aislamiento.
6. **Recomendaciones**: Priorizadas por impacto en el proceso SDD.
