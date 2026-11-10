# Spec 023 — Adopción de Arquitectura de Orquestación Multiagente SDD, Catálogo de Skills, Compuertas Fail-Fast y Homologación de Plantilla Universal (`samples/`)

## 1. Contexto y Objetivo
Actualmente, el repositorio **Web PsicoLau** cuenta con una base sólida de Spec-Driven Development (SDD) hasta la Spec 022, pero aún opera bajo un esquema de agente único monolítico: carece de la regla maestra del Orquestador (`.agents/rules/orchestrator.md`), no dispone de los 4 subagentes especializados de runtime en `.agents/agents/` (`builder-frontend`, `builder-backend`, `auditor-calidad`, `devops`), no tiene configuradas las compuertas automáticas *fail-fast* post-edición (`.agents/hooks.json` + `quickCheck.js`), solo posee 4 de las 14 skills del ecosistema, mantiene una regla obsoleta en `GEMINI.md` que bloquea la delegación en `$work`, y acumula en `overview/session.md` y `overview/tasks.md` todo el historial desde el inicio del proyecto sin rotación de ventana deslizante.

Paralelamente, tras auditar la plantilla maestra universal en `/home/cris/Documentos/Proyectos/samples`, se identificó que, aunque ya cuenta con `.agents/agents/` y `orchestrator.md` (Spec 191 de `demo`), presenta desfases documentales y de catálogo: `samples/AGENTS.md`, `samples/GEMINI.md`, `samples/README.md`, `samples/prompt-inicial-sdd.md` y `samples/prompts.md` aún describen a `spec-generator` como un subagente delegado o no reflejan la carpeta `.agents/agents/` en su anatomía, además de faltar en `samples/.agents/skills/` las skills de auditoría `code-audit` y `sdd-compliance` (en versión agnóstica sin fugas de marca) y el directorio `samples/overview/archive/`.

El objetivo de esta especificación es:
1. Implantar en **Web PsicoLau** el flujo completo SDD + Orquestación Multiagente de `demo` (Specs 024, 140, 163 y 191), estrictamente adaptado a la identidad de marca de la Lic. Ana Laura Gómez Díaz (`#EC5E86`, `#1E94A8`, `#FDFBF9`) y su infraestructura (Supabase Dev/Prod, Cloudflare Pages y Render).
2. Homologar y actualizar la plantilla universal **`samples/`** como un *Starter Kit* 100% consistente, agnóstico de dominio y libre de referencias a clientes específicos.

---

## 2. Usuarios / Actores
- **Desarrollador Principal (Cristhian)**: Dirige la evolución de Web PsicoLau y reutiliza `samples/` para iniciar nuevos proyectos con un flujo SDD + Multiagente estandarizado y eficiente en consumo de tokens.
- **Orquestador Central (Agente Principal de Antigravity)**: Coordina el ciclo de vida SDD, asume la skill `spec-generator` en el chat principal, delega tareas atómicas en subagentes mediante *Handshakes* formales y mantiene sincronizada la memoria de sesión.
- **Subagentes Especialistas en Runtime (`builder-frontend`, `builder-backend`, `auditor-calidad`, `devops`)**: Ejecutan tareas acotadas por dominio bajo controles estrictos de herramientas y permisos.

---

## 3. Historias de Usuario
- **H1**: Como desarrollador, quiero que `Web PsicoLau` cuente con el mismo flujo de Orquestador Central, 4 subagentes de runtime, compuertas *fail-fast* (`hooks.json`) y catálogo completo de skills que tengo en `demo`, adaptado a la marca e infraestructura de PsicoLau, para desarrollar y auditar nuevas funcionalidades con máxima calidad y menor consumo de contexto.
- **H2**: Como Orquestador Central, quiero contar con un `auditor-calidad` en modo estricto de solo lectura y validadores automáticos de sintaxis ESM e imports (`testFrontendSyntax.js`, `testModuleImports.js`), para garantizar que ningún cambio de código se dé por válido sin verificación independiente.
- **H3**: Como desarrollador, quiero que `overview/session.md` y `overview/tasks.md` utilicen una ventana deslizante con archivo histórico en `overview/archive/`, para que el comando `$boot` sea rápido y económico en tokens.
- **H4**: Como desarrollador, quiero que la carpeta `/home/cris/Documentos/Proyectos/samples` tenga toda su documentación, catálogo de skills y estructura de archivos 100% alineados con la arquitectura vigente (Spec 191) y libre de fugas de nombres propios, para usarla como plantilla limpia en futuros proyectos.

---

## 4. Requisitos Funcionales (Criterios en Notación EARS)

### Bloque A: Orquestación Multiagente y Subagentes en `Web PsicoLau`
- **RF-1 (Ubicuo)**: EL SISTEMA contará con el protocolo maestro `.agents/rules/orchestrator.md` que rige al Agente Principal como Orquestador Central, definiendo el principio de *Progressive Disclosure*, el catálogo de especialistas, el ciclo de vida de 8 pasos y los 4 contratos formales de traspaso (*Handshakes* de Asignación, Reporte, Dictamen y Despliegue).
- **RF-2 (Ubicuo)**: EL SISTEMA mantendrá `spec-generator` exclusivamente como una **Skill pura** en `.agents/skills/spec-generator/` asumida por el Orquestador en el chat principal, sin existir como subagente en `.agents/agents/`.
- **RF-3 (Ubicuo)**: EL SISTEMA registrará en `.agents/agents/` exactamente 4 subagentes ejecutables en runtime (`builder-frontend`, `builder-backend`, `auditor-calidad`, `devops`), cada uno con su archivo `agent.md` provisto de frontmatter YAML válido (`name`, `description`, `tools`, `subagent: true`, `mainAgent: true`, `model: flash`, `commandExecutionPolicy`, `skills`).
- **RF-4 (Ubicuo)**: EL SISTEMA aplicará un **candado constitucional de solo lectura** sobre `.agents/agents/auditor-calidad/agent.md`, otorgándole únicamente herramientas de inspección (`view_file`, `grep_search`, `run_command`) y prohibiendo cualquier herramienta de escritura (`write_to_file`, `replace_file_content`, `multi_replace_file_content`).
- **RF-5 (Ubicuo)**: EL SISTEMA adaptará las directrices de `.agents/agents/builder-frontend/agent.md` y `.agents/skills/builder-frontend/SKILL.md` en `Web PsicoLau` a la paleta oficial innegociable de PsicoLau (Rosa `#EC5E86`, Turquesa `#1E94A8` / `#3EB8CC`, Gris cálido `#4A4A4A` / `#8C8C8C`, Fondo marfil `#FDFBF9`, tipografía Outfit/Inter) y módulos ESM en `panel/js/`, sin referencias a la Dra. Sofía Ramos ni a la paleta de `demo`.
- **RF-6 (Ubicuo)**: EL SISTEMA adaptará las directrices de `.agents/agents/builder-backend/agent.md` y `.agents/agents/devops/agent.md` en `Web PsicoLau` al stack real del proyecto: Express 5, Prisma ORM sobre PostgreSQL en Supabase (entornos Dev y Producción estrictamente separados), cifrado `AES-256-GCM` + Blind Index `HMAC-SHA256`, validación Zod + LFPDPPP (`privacyCheck: z.literal(true)`), protocolo Zero Data Loss (§6.11) y despliegue en Cloudflare Pages (`psicolau.com` con CSP segmentada en `_headers`) y Render (`api.psicolau.com`).

### Bloque B: Catálogo de Skills y Compuertas Fail-Fast en `Web PsicoLau`
- **RF-7 (Ubicuo)**: EL SISTEMA incorporará en `.agents/skills/` de `Web PsicoLau` las 10 skills faltantes del ecosistema:
  1. `builder-frontend/SKILL.md`
  2. `builder-backend/SKILL.md`
  3. `auditor-calidad/SKILL.md`
  4. `devops/SKILL.md`
  5. `code-audit/SKILL.md` (y su carpeta `references/`)
  6. `ui-design-review/SKILL.md`
  7. `ux-audit-rethink/SKILL.md`
  8. `wcag-accessibility-audit/SKILL.md` (y `nielsen-heuristics-audit/SKILL.md`)
  9. `cognitive-walkthrough/SKILL.md`
  10. `don-norman-principles-audit/SKILL.md`
- **RF-8 (Evento)**: CUANDO un agente modifique o cree un archivo mediante herramientas de edición (`replace_file_content`, `multi_replace_file_content`, `write_to_file`), EL SISTEMA ejecutará automáticamente el hook `PostToolUse` definido en `.agents/hooks.json` invocando `scripts/hooks/quickCheck.js`, el cual validará la sintaxis de archivos `.js` con `node --check`, ejecutará `scripts/testFrontendSyntax.js` si el cambio toca `panel/js/`, y emitirá `{}` por `stdout` conforme al contrato de Antigravity.
- **RF-9 (Evento)**: CUANDO se ejecute `scripts/testFrontendSyntax.js` o `scripts/testModuleImports.js`, EL SISTEMA verificará respectivamente que el 100% de los módulos ESM en `panel/js/` carezcan de errores sintácticos (`node --input-type=module --check`) y que el 100% de las sentencias `import`/`export` relativas resuelvan a archivos existentes en disco.

### Bloque C: Gobernanza Documental y Ventana Deslizante en `Web PsicoLau`
- **RF-10 (Ubicuo)**: EL SISTEMA actualizará `AGENTS.md` (añadiendo §2.1 *Arquitectura de Orquestación Multiagente* y §8 *Eficiencia de Contexto y Gestión de Tokens*) y `GEMINI.md` (actualizando la sección `$work` y *Reglas fijas* para habilitar la delegación del Orquestador en los 4 subagentes y exigir el dictamen de `auditor-calidad`).
- **RF-11 (Ubicuo)**: EL SISTEMA implementará la rotación de memoria deslizante (Spec 024), trasladando el historial de las Specs 001 a 018 hacia `overview/archive/session-history.md` y `overview/archive/tasks-history.md`, y conservando en `overview/session.md` y `overview/tasks.md` únicamente la ventana activa reciente (Specs 019 a 023).

### Bloque D: Verificación y Actualización de la Plantilla Maestra Universal (`samples/`)
- **RF-12 (Ubicuo)**: EL SISTEMA actualizará `samples/AGENTS.md`, `samples/GEMINI.md`, `samples/README.md`, `samples/prompt-inicial-sdd.md` y `samples/prompts.md` para reflejar con exactitud la arquitectura Spec 191:
  - `spec-generator` documentado como **Skill pura** asumida por el Orquestador en el chat principal.
  - `.agents/agents/` documentado en el árbol de anatomía de `samples/README.md` y en `samples/prompt-inicial-sdd.md` con los 4 subagentes de runtime (`builder-frontend`, `builder-backend`, `auditor-calidad`, `devops` con `model: inherit`).
- **RF-13 (Ubicuo)**: EL SISTEMA añadirá en `samples/.agents/skills/` las skills faltantes `code-audit` (`SKILL.md` + `references/`) y `sdd-compliance` (`SKILL.md` redactada de forma 100% genérica/agnóstica), así como la carpeta `samples/overview/archive/` con archivos base `session-history.md` y `tasks-history.md`.
- **RF-14 (Excepción)**: SI algún archivo dentro de `/home/cris/Documentos/Proyectos/samples/` contiene referencias específicas a marcas o clientes (`PsicoTemplate`, `PsicoClínica`, `PsicoLau`, `Sofía`, `Laura`, `Frida`, `Elena`, `César`, `Viviana`, `Hetzner`), ENTONCES EL SISTEMA fallará la prueba de pureza anti-fugas y requerirá su sanitización inmediata.

---

## 5. Requisitos No Funcionales & Seguridad
- **Cumplimiento Constitucional**: No se altera ningún principio de `docs/constitution.md`. Se refuerza la verificación de cifrado `AES-256-GCM`, separación Dev/Prod y validación LFPDPPP mediante la auditoría obligatoria de `auditor-calidad`.
- **Compatibilidad Cross-Repo**: Los cambios en `samples/` deben mantener el 100% de compatibilidad con las suites de gobernanza de `demo` (`testSubagentesRuntimeSpec163.js` y `testVerificacionOperativaSubagentes.js`), preservando `model: inherit` en `samples/.agents/agents/*/agent.md`.
- **Rendimiento de Hooks**: `scripts/hooks/quickCheck.js` debe ejecutarse en `< 300ms` sin bloquear el flujo de edición y devolver siempre `{}` en `stdout`.

---

## 6. Casos Límite y Manejo de Errores
- **Base de datos Dev de Supabase pausada o inalcanzable**: La suite de verificación de subagentes, sintaxis ESM, imports y plantilla `samples/` (`testSubagentesRuntimeSpec023.js`) debe poder ejecutarse de forma estática sin depender de la conexión activa a PostgreSQL, y `runTests.js` debe ser capaz de reportar con claridad el estado de las pruebas estáticas frente a las de base de datos.
- **Invocación de `quickCheck.js` sin stdin (TTY manual)**: Si se ejecuta manualmente en terminal (`node scripts/hooks/quickCheck.js`), no debe bloquearse esperando `stdin`, sino validar `panel/js/` y emitir `{}`.

---

## 7. Fuera de Alcance (Out of Scope)
- No se migra `Web PsicoLau` al motor multicliente SSG (`waas.js` / `buildSite.js` / `clientes/<slug>`) ni al VPS Hetzner/Docker de `demo`, ya que `Web PsicoLau` es el repositorio dedicado single-tenant de Laura desplegado en Cloudflare Pages + Render + Supabase.
- No se modifica ningún endpoint de negocio, esquema Prisma ni lógica funcional de agenda, pagos o expedientes.

---

## 8. Criterios de Finalización (Definition of Done)
- [x] Creados `.agents/rules/orchestrator.md` y los 4 subagentes en `.agents/agents/` en `Web PsicoLau`.
- [x] Completadas las 14 skills en `.agents/skills/` de `Web PsicoLau` sin referencias a la Dra. Sofía Ramos.
- [x] Configurados `.agents/hooks.json`, `scripts/hooks/quickCheck.js`, `scripts/testFrontendSyntax.js` y `scripts/testModuleImports.js` pasando al 100%.
- [x] Actualizados `AGENTS.md`, `GEMINI.md` y rotada la memoria en `overview/archive/` en `Web PsicoLau`.
- [x] Actualizados `AGENTS.md`, `GEMINI.md`, `README.md`, `prompt-inicial-sdd.md`, `prompts.md`, `overview/archive/` y las skills `code-audit` / `sdd-compliance` en `/home/cris/Documentos/Proyectos/samples/` con 0 fugas de nombres propios.
- [x] Suite automatizada `backend/scripts/testSubagentesRuntimeSpec023.js` pasando al 100% (y suite homóloga en `demo` verificada sin regresiones sobre `samples/`).

## 9. Dudas Abiertas / Pendientes de Aclaración
- *Ninguna.* Los requerimientos y el diseño de referencia en `demo` y `samples` están completamente definidos.
