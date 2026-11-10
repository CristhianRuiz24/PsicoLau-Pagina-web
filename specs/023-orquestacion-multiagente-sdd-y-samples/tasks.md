# Tareas de Implementación 023 — Adopción de Arquitectura de Orquestación Multiagente SDD, Catálogo de Skills, Compuertas Fail-Fast y Homologación de Plantilla Universal (`samples/`)

> **Regla de ejecución**: Implementar y verificar una sola tarea a la vez antes de avanzar a la siguiente.

---

## 📋 Lista de Tareas Atómicas

### [x] T1: Protocolo del Orquestador y Subagentes en Runtime para `Web PsicoLau`
- **Requisitos cubiertos**: RF-1, RF-2, RF-3, RF-4, RF-5, RF-6
- **Archivos afectados**:
  - `.agents/rules/orchestrator.md`
  - `.agents/agents/builder-frontend/agent.md`
  - `.agents/agents/builder-backend/agent.md`
  - `.agents/agents/auditor-calidad/agent.md`
  - `.agents/agents/devops/agent.md`
- **Acción**:
  - Crear `.agents/rules/orchestrator.md` definiendo el rol del Orquestador Central, la asunción directa de la skill `spec-generator`, la delegación en los 4 subagentes (`builder-frontend`, `builder-backend`, `auditor-calidad`, `devops`), el ciclo de vida de 8 fases y los 4 contratos formales de *Handshake*.
  - Crear los 4 archivos `agent.md` en `.agents/agents/` con frontmatter YAML canónico (`subagent: true`, `mainAgent: true`, `model: flash`), candado estricto de solo lectura en `auditor-calidad` y directrices adaptadas a la paleta oficial de Laura (`#EC5E86`, `#1E94A8`, `#FDFBF9`) y a la arquitectura Supabase + Cloudflare Pages + Render.
- **Hecho cuando**:
  - Los 5 archivos existen, el frontmatter YAML de los 4 subagentes es válido, `auditor-calidad` carece de herramientas de escritura y no existe `.agents/agents/spec-generator/`.

---

### [x] T2: Ampliación del Catálogo de Skills en `Web PsicoLau` (14 Skills)
- **Requisitos cubiertos**: RF-5, RF-6, RF-7
- **Archivos afectados**:
  - `.agents/skills/builder-frontend/SKILL.md`
  - `.agents/skills/builder-backend/SKILL.md`
  - `.agents/skills/auditor-calidad/SKILL.md`
  - `.agents/skills/devops/SKILL.md`
  - `.agents/skills/code-audit/SKILL.md` y `.agents/skills/code-audit/references/*`
  - `.agents/skills/ui-design-review/SKILL.md`
  - `.agents/skills/ux-audit-rethink/SKILL.md`
  - `.agents/skills/wcag-accessibility-audit/SKILL.md` y `.agents/skills/wcag-accessibility-audit/nielsen-heuristics-audit/SKILL.md`
  - `.agents/skills/cognitive-walkthrough/SKILL.md`
  - `.agents/skills/don-norman-principles-audit/SKILL.md`
  - `.agents/skills/sdd-compliance/SKILL.md` (actualizar referencias a PsicoLau)
- **Acción**:
  - Incorporar las 4 skills de agentes especialistas (`builder-frontend`, `builder-backend`, `auditor-calidad`, `devops`) calibradas al stack, seguridad clínica (`AES-256-GCM`, LFPDPPP, Blind Index) y paleta de `Web PsicoLau`.
  - Incorporar las 6 skills de auditoría de código, diseño UI/UX, heurísticas de Nielsen, Don Norman, recorrido cognitivo y accesibilidad WCAG desde `demo/.agents/skills/`.
  - Ajustar `.agents/skills/sdd-compliance/SKILL.md` en `Web PsicoLau` para referenciar a PsicoLau en lugar de PsicoTemplate.
- **Hecho cuando**:
  - Las 14 skills residen en `.agents/skills/` con su respectivo `SKILL.md` válido y cero referencias residuales a la Dra. Sofía Ramos o paleta Teal/Ocre de la demo.

---

### [x] T3: Compuerta Fail-Fast (`hooks.json`) y Validadores Estáticos Frontend en `Web PsicoLau`
- **Requisitos cubiertos**: RF-8, RF-9
- **Archivos afectados**:
  - `.agents/hooks.json`
  - `scripts/hooks/quickCheck.js`
  - `scripts/testFrontendSyntax.js`
  - `scripts/testModuleImports.js`
  - `package.json`
- **Acción**:
  - Crear `.agents/hooks.json` configurando el hook `PostToolUse` para invocar `node ../scripts/hooks/quickCheck.js`.
  - Crear `scripts/hooks/quickCheck.js`, `scripts/testFrontendSyntax.js` y `scripts/testModuleImports.js`.
  - Añadir los scripts `"test:syntax": "node scripts/testFrontendSyntax.js"` y `"test:imports": "node scripts/testModuleImports.js"` en el `package.json` raíz.
- **Hecho cuando**:
  - `npm run test:syntax`, `npm run test:imports` y `node scripts/hooks/quickCheck.js` se ejecutan con código de salida `0`, reportando 0 errores sintácticos, 0 imports rotos y salida `{}`.

---

### [x] T4: Actualización de `AGENTS.md`, `GEMINI.md` y Rotación de Memoria Deslizante en `Web PsicoLau`
- **Requisitos cubiertos**: RF-10, RF-11
- **Archivos afectados**:
  - `AGENTS.md`
  - `GEMINI.md`
  - `overview/archive/session-history.md`
  - `overview/archive/tasks-history.md`
  - `overview/session.md`
  - `overview/tasks.md`
- **Acción**:
  - Actualizar `AGENTS.md` incorporando §2.1 (*Arquitectura de Orquestación Multiagente*) y §8 (*Eficiencia de Contexto y Gestión de Tokens*).
  - Actualizar `GEMINI.md` en `$work` y *Reglas fijas* para reflejar el flujo del Orquestador Master con delegación a los 4 subagentes y auditoría obligatoria en modo solo lectura.
  - Crear `overview/archive/session-history.md` y `overview/archive/tasks-history.md` trasladando el historial de las Specs 001 a 018, y compactar `overview/session.md` y `overview/tasks.md` dejando únicamente la ventana activa reciente (Specs 019 a 023).
- **Hecho cuando**:
  - `AGENTS.md` y `GEMINI.md` reflejan el nuevo flujo multiagente y `overview/session.md` / `overview/tasks.md` están compactados (< 120 líneas) con enlaces a `overview/archive/`.

---

### [x] T5: Homologación y Actualización de la Plantilla Universal (`samples/`)
- **Requisitos cubiertos**: RF-12, RF-13, RF-14
- **Archivos afectados**:
  - `/home/cris/Documentos/Proyectos/samples/AGENTS.md`
  - `/home/cris/Documentos/Proyectos/samples/GEMINI.md`
  - `/home/cris/Documentos/Proyectos/samples/README.md`
  - `/home/cris/Documentos/Proyectos/samples/prompt-inicial-sdd.md`
  - `/home/cris/Documentos/Proyectos/samples/prompts.md`
  - `/home/cris/Documentos/Proyectos/samples/.agents/skills/code-audit/SKILL.md` (+ `references/`)
  - `/home/cris/Documentos/Proyectos/samples/.agents/skills/sdd-compliance/SKILL.md`
  - `/home/cris/Documentos/Proyectos/samples/overview/archive/session-history.md`
  - `/home/cris/Documentos/Proyectos/samples/overview/archive/tasks-history.md`
- **Acción**:
  - Actualizar `samples/AGENTS.md`, `samples/GEMINI.md`, `samples/README.md`, `samples/prompt-inicial-sdd.md` y `samples/prompts.md` para alinearlos con `samples/.agents/rules/orchestrator.md` (Spec 191): documentar `.agents/agents/` con los 4 subagentes en runtime (`model: inherit`) y `spec-generator` como Skill asumida por el Orquestador en el chat principal.
  - Añadir `code-audit` (`SKILL.md` + `references/`) y `sdd-compliance` (`SKILL.md` 100% agnóstica, sin menciones a PsicoTemplate ni clientes) en `samples/.agents/skills/`.
  - Crear `samples/overview/archive/session-history.md` y `samples/overview/archive/tasks-history.md` como plantillas de archivo histórico.
- **Hecho cuando**:
  - Toda la documentación y estructura de `samples/` es coherente con la arquitectura Spec 191 y pasa las pruebas de pureza anti-fugas.

---

### [x] T6: Suite Automatizada de Verificación (`testSubagentesRuntimeSpec023.js`) y No-Regresión
- **Requisitos cubiertos**: RF-1 a RF-14
- **Archivos afectados**:
  - `backend/scripts/testSubagentesRuntimeSpec023.js`
  - `backend/scripts/runTests.js`
- **Acción**:
  - Crear `backend/scripts/testSubagentesRuntimeSpec023.js` con `node:test` y `node:assert` validando todos los criterios de aceptación en `Web PsicoLau` y en `samples/`.
  - Registrar la suite en `backend/scripts/runTests.js`.
  - Ejecutar `node --test backend/scripts/testSubagentesRuntimeSpec023.js`, `npm --prefix backend run lint`, `npm run test:syntax`, `npm run test:imports` y verificar que `testSubagentesRuntimeSpec163.js` en `demo` siga pasando al 100%.
- **Hecho cuando**:
  - Todas las pruebas de `testSubagentesRuntimeSpec023.js` (y `testSubagentesRuntimeSpec163.js` en `demo`), el linter y los validadores de sintaxis e imports aprueban al 100% con 0 errores.
