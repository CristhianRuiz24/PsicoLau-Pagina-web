# Plan Técnico 023 — Adopción de Arquitectura de Orquestación Multiagente SDD, Catálogo de Skills, Compuertas Fail-Fast y Homologación de Plantilla Universal (`samples/`)

## 1. Resumen de la Solución Técnica
Implantar en `Web PsicoLau` la arquitectura de Orquestación Multiagente, el catálogo completo de 14 skills, los hooks reactivos *fail-fast* (`PostToolUse`) y la rotación de memoria deslizante provenientes del repositorio maestro `demo` (Specs 024, 140, 163 y 191), adaptando las reglas de dominio a la identidad visual de PsicoLau (`#EC5E86`, `#1E94A8`, `#FDFBF9`) y su stack de producción (Cloudflare Pages + Render + Supabase).

Simultáneamente, actualizar y homologar la plantilla universal `/home/cris/Documentos/Proyectos/samples` para subsanar los desfases documentales respecto a la Spec 191 (clarificando `spec-generator` como Skill del Orquestador y documentando `.agents/agents/`), añadir las skills universales de auditoría faltantes (`code-audit` y `sdd-compliance` agnóstica) e incorporar la estructura de archivo deslizante `overview/archive/`.

---

## 2. Alineación con la Constitución (`docs/constitution.md`)
- **Principio 1 (Datos sensibles siempre cifrados)**: `builder-backend` y `auditor-calidad` incorporan como regla innegociable la verificación de cifrado `AES-256-GCM` y Blind Index `HMAC-SHA256` en cualquier tarea que toque modelos o endpoints clínicos.
- **Principio 2 (Entornos dev y producción separados)**: `devops` y `builder-backend` refuerzan la prohibición absoluta de correr tests o seeds contra Supabase Producción y exigen el protocolo de 4 fases Zero Data Loss (§6.11).
- **Principio 3 (Frontend simple, sin dependencias innecesarias)**: `builder-frontend` y `quickCheck.js` validan que el sitio público y `/panel` se mantengan en HTML5, CSS3 Vanilla y JS ESM nativo sin frameworks ni build steps pesados.
- **Principio 4 y 5 (Auth real y CORS explícito)**: `auditor-calidad` audita en modo solo lectura que ningún endpoint quede sin JWT y que `allowedOrigins` no use comodines `*`.
- **Principio 6 (No romper lo que ya funciona para Laura)**: Ningún cambio toca la lógica funcional actual de la agenda, pagos o expedientes; además, se añaden guardias estáticas (`testFrontendSyntax.js` y `testModuleImports.js`) para prevenir regresiones en los módulos ESM del panel.

---

## 3. Módulos y Archivos Afectados

### A. Repositorio `Web PsicoLau` (`/home/cris/Documentos/Proyectos/Web PsicoLau`)

| Componente | Archivo / Ruta | Acción | Cubre |
|---|---|---|---|
| Regla Orquestador | `.agents/rules/orchestrator.md` | Crear | RF-1, RF-2 |
| Subagente Frontend | `.agents/agents/builder-frontend/agent.md` | Crear | RF-3, RF-5 |
| Subagente Backend | `.agents/agents/builder-backend/agent.md` | Crear | RF-3, RF-6 |
| Subagente Auditor | `.agents/agents/auditor-calidad/agent.md` | Crear (Solo lectura) | RF-3, RF-4 |
| Subagente DevOps | `.agents/agents/devops/agent.md` | Crear | RF-3, RF-6 |
| Skills de Agentes | `.agents/skills/{builder-frontend,builder-backend,auditor-calidad,devops}/SKILL.md` | Crear (4 skills) | RF-5, RF-6, RF-7 |
| Skills de Auditoría/UX | `.agents/skills/{code-audit,ui-design-review,ux-audit-rethink,wcag-accessibility-audit,cognitive-walkthrough,don-norman-principles-audit}/` | Copiar y adaptar desde `demo` (6 skills) | RF-7 |
| Hook PostToolUse | `.agents/hooks.json` | Crear | RF-8 |
| Ejecutor Hook | `scripts/hooks/quickCheck.js` | Crear | RF-8 |
| Validador ESM | `scripts/testFrontendSyntax.js` | Crear | RF-8, RF-9 |
| Validador Imports | `scripts/testModuleImports.js` | Crear | RF-9 |
| Scripts NPM Raíz | `package.json` | Modificar (`test:syntax`, `test:imports`) | RF-9 |
| Gobernanza Agentes | `AGENTS.md` y `GEMINI.md` | Modificar (§2.1, §8, `$work`) | RF-10 |
| Memoria Deslizante | `overview/session.md`, `overview/tasks.md`, `overview/archive/{session-history.md,tasks-history.md}` | Modificar / Crear | RF-11 |
| Suite de Pruebas | `backend/scripts/testSubagentesRuntimeSpec023.js` | Crear | RF-1 a RF-14 |

### B. Plantilla Maestra Universal (`samples/` en `/home/cris/Documentos/Proyectos/samples`)

| Componente | Archivo / Ruta | Acción | Cubre |
|---|---|---|---|
| Contexto Agentes | `samples/AGENTS.md` y `samples/GEMINI.md` | Actualizar §2.1 y reglas multiagente (Spec 191) | RF-12, RF-14 |
| Documentación Kit | `samples/README.md`, `samples/prompt-inicial-sdd.md`, `samples/prompts.md` | Actualizar árbol `.agents/agents/` y rol `spec-generator` | RF-12, RF-14 |
| Skills Faltantes | `samples/.agents/skills/code-audit/` y `samples/.agents/skills/sdd-compliance/SKILL.md` | Crear / copiar versión agnóstica sin marcas | RF-13, RF-14 |
| Archivo Deslizante | `samples/overview/archive/{session-history.md,tasks-history.md}` | Crear plantillas base de archivo histórico | RF-13, RF-14 |

---

## 4. Decisiones Técnicas y Alternativas Descartadas

| Decisión Tomada | Razón Técnica | Alternativa Descartada y Motivo |
|---|---|---|
| **Nombrar al 4.º subagente `devops` en `Web PsicoLau` (como en `samples/`) en lugar de `waas-devops`** | `Web PsicoLau` es una aplicación single-tenant dedicada para la Lic. Laura Gómez (Cloudflare Pages + Render + Supabase), no un generador multicliente WaaS en VPS Hetzner. `devops` refleja con precisión su rol de pre-vuelo, verificación de migraciones Supabase y despliegue. | Usar `waas-devops`: descartado porque induciría a confusión al buscar scripts inexistentes como `waas.js` o `buildSite.js` en este repositorio. |
| **Mantener `spec-generator` como Skill pura del Orquestador (Spec 191)** | La entrevista de requisitos EARS requiere interacción conversacional directa con el usuario (`ask_question`) en el hilo principal. Ejecutarla como subagente en background añade latencia y doble salto innecesario. | Crear `.agents/agents/spec-generator/agent.md`: descartado expresamente en la Spec 191 de `demo`. |
| **Configurar `model: flash` en `.agents/agents/*/agent.md` de `Web PsicoLau` y preservar `model: inherit` en `samples/`** | En proyectos concretos (`demo`, `Web PsicoLau`), `flash` optimiza velocidad y cuota en tareas acotadas de obreros/auditor; mientras que en `samples/` se preserva `model: inherit` como estándar agnóstico y para mantener 100% verdes los tests cruzados de `demo` (`testSubagentesRuntimeSpec163.js`). | Cambiar `samples/` a `flash`: descartado porque rompería la aserción `CA-05` de `testSubagentesRuntimeSpec163.js` en el repositorio `demo`. |
| **Candado físico de herramientas en `auditor-calidad`** | Declarar exclusivamente `view_file`, `grep_search` y `run_command` en el frontmatter YAML impide a nivel de plataforma que el auditor edite archivos accidentalmente. | Confiar solo en instrucciones de texto en el prompt: descartado por menor garantía de aislamiento. |

---

## 5. Estrategia de Pruebas y Validación
1. **Validación de Sintaxis e Imports Frontend (`Web PsicoLau`)**:
   - Ejecutar `node scripts/testFrontendSyntax.js` y `node scripts/testModuleImports.js` verificando 0 errores en los módulos ESM de `panel/js/`.
2. **Validación del Hook Fail-Fast (`quickCheck.js`)**:
   - Ejecutar `node scripts/hooks/quickCheck.js` verificando que devuelva `{}` en `< 300ms` con código de salida `0`.
3. **Suite Automatizada de Gobernanza (`backend/scripts/testSubagentesRuntimeSpec023.js`)**:
   - Verificar existencia, frontmatter YAML, herramientas por dominio y candado de solo lectura de los 4 subagentes en `Web PsicoLau`.
   - Verificar la existencia de las 14 skills en `Web PsicoLau/.agents/skills/` y la ausencia de referencias a la Dra. Sofía Ramos.
   - Verificar la actualización de `samples/` (13 skills incluyendo `code-audit` y `sdd-compliance`, documentación alineada con Spec 191 y 0 fugas de marcas o nombres propios).
4. **No-Regresión Cruzada con `demo`**:
   - Ejecutar desde `/home/cris/Documentos/Proyectos/demo` el test `node --test backend/scripts/testSubagentesRuntimeSpec163.js` para certificar que las mejoras en `samples/` mantienen intactos los contratos esperados por `demo`.
5. **Linter Backend**:
   - Ejecutar `npm --prefix backend run lint` asegurando 0 errores y 0 advertencias.
