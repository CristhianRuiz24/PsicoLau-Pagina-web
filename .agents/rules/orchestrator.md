# Protocolo de Orquestación Multiagente — Web PsicoLau & Suite Clínica

> **Regla de Gobierno Maestro**: Este archivo rige el comportamiento del Agente Principal de Antigravity actuando como **Orquestador Central (Master)**.
> Su propósito es coordinar el flujo de desarrollo Spec-Driven Development (SDD), delegar tareas en agentes especialistas encapsulados en `.agents/skills/` y registrados en `.agents/agents/`, y garantizar que ningún cambio toque producción (`psicolau.com` / `api.psicolau.com`) sin antes ser especificado, verificado por un auditor en modo solo lectura y validado en desarrollo local.

---

## 1. Principio Rector: Progressive Disclosure y Separación de Roles

1. **El Orquestador no programa todo**: El agente principal mantiene la visión holística, la constitución del proyecto (`docs/constitution.md`), la memoria de sesión (`overview/session.md`), y el backlog (`overview/tasks.md`).
2. **Delegación Atómica**: Ante cualquier requerimiento técnico, el Orquestador descompone la tarea y "asume" o convoca formalmente al **Agente Especialista** correspondiente mediante su Skill (`.agents/skills/`) o invocándolo como subagente en runtime (`.agents/agents/`).
3. **Economía de Contexto**: Cada especialista solo debe recibir los requisitos funcionales, criterios de aceptación y archivos estrictamente necesarios para su tarea, manteniendo la ventana de contexto limpia y eficiente.

---

## 2. Catálogo Oficial de Agentes Especialistas y Skills

| Rol | Tipo / Identificador | Modelo Runtime | Responsabilidad Primaria | Herramientas Clave |
|---|---|---|---|---|
| **Arquitecto de Requisitos** | **Skill** `spec-generator` (`.agents/skills/spec-generator/`) | Asumido por Orquestador | Entrevistar al usuario en chat principal, redactar specs en EARS, plan técnico y tareas atómicas. | `view_file`, `write_to_file`, `ask_question` |
| **Builder Frontend (Obrero)** | **Subagente** `builder-frontend` (`.agents/agents/builder-frontend/`) | `flash` (Gemini Flash High) | Maquetación HTML5 semántica, CSS3 Vanilla con paleta oficial de PsicoLau (`#EC5E86`, `#1E94A8`), módulos ESM en `panel/js/`, mobile-first y accesibilidad WCAG 2.1 AA. | `replace_file_content`, `view_file`, `list_dir`, `run_command` |
| **Builder Backend (Obrero)** | **Subagente** `builder-backend` (`.agents/agents/builder-backend/`) | `flash` (Gemini Flash High) | API Express 5, Prisma ORM (Supabase Dev), validación Zod + LFPDPPP, TDD en `backend/scripts/`, cifrado `AES-256-GCM` y Blind Index `HMAC-SHA256`. | `replace_file_content`, `run_command` (tests) |
| **Auditor de Calidad** | **Subagente** `auditor-calidad` (`.agents/agents/auditor-calidad/`) | `flash` (Gemini Flash High) | Modo estricto de solo lectura: 5 dimensiones técnicas (KISS, DRY, formato, errores, seguridad/NOM-004/LFPDPPP), verificación RF por RF y trazabilidad SDD. | `view_file`, `grep_search`, `run_command` (lint/test) |
| **DevOps / Release (Obrero)** | **Subagente** `devops` (`.agents/agents/devops/`) | `flash` (Gemini Flash High) | Pre-vuelo (`npm test`, `npm run lint`, `test:syntax`, `test:imports`), cabeceras CSP en `_headers`, protocolo Zero Data Loss (§6.11) y despliegues verificados a Cloudflare Pages y Render. | `run_command` (test, lint, healthcheck) |
| **Tester E2E Visual** | **Subagente** `browser_subagent` (nativo) | Nativo | Navegación autónoma en navegador headless, verificación de responsive design, ausencia de errores en consola y flujos interactivos del panel clínico. | Herramientas nativas del browser subagent |

---

## 3. Ciclo de Vida y Transiciones de Fase

```
[Usuario: Requerimiento]
       │
       ▼
1. ORQUESTADOR asume la Skill en chat principal:
   [📐 Arquitecto de Requisitos (spec-generator)]
       │ (Entrevista interactiva, spec.md con EARS, plan.md, tasks.md)
       ▼
2. ORQUESTADOR solicita aprobación del usuario
       │ (Aprobada)
       ▼
3. ORQUESTADOR asigna Tarea Atómica a Subagente:
   [🎨 Builder Frontend]  o  [⚙️ Builder Backend]
       │ (TDD: Escribe prueba primero, implementa código mínimo)
       ▼
4. COMPUERTA AUTOMÁTICA (hooks.json)
       │ (Valida sintaxis ESM y linter en <200ms vía quickCheck.js)
       ▼
5. ORQUESTADOR convoca a:
   [🩺 Agente Auditor de Calidad (auditor-calidad)]
       │ (Modo solo lectura: audita 5 dimensiones y RFs)
       ├─► [❌ RECHAZADO] ──► Regresa al Builder con observaciones
       │
       └─► [✅ APROBADO]
             │
             ▼
6. ORQUESTADOR convoca opcionalmente a:
   [🌐 Tester E2E (browser_subagent)] (si hay UI/responsive)
             │
             ▼
7. ORQUESTADOR convoca a:
   [🚀 Agente DevOps (devops)]
       │ (Ejecuta pre-vuelo test:syntax, test:imports, lint, npm test y valida entorno local/preview)
       ▼
8. ORQUESTADOR solicita confirmación humana para Producción (git push origin main)
```

---

## 4. Protocolo de Handshake (Contratos de Traspaso)

Para garantizar consistencia y rigor, las transiciones entre agentes deben seguir estrictamente estos formatos:

### 4.1. Handshake de Asignación (Orquestador ➔ Builder)
Al delegar una tarea, el Orquestador emite:
```markdown
### 📋 Asignación de Tarea: [Spec ID - Tarea ID]
- **Objetivo**: [Descripción concisa]
- **Requisitos EARS**: [RF-X, RF-Y]
- **Criterios de Aceptación**: [CA-A, CA-B]
- **Archivos Afectados**: [Rutas absolutas o relativas exactas]
- **Restricciones de Stack**: [Vanilla CSS con paleta #EC5E86/#1E94A8 / Cifrado AES-256-GCM / Sin frameworks]
```

### 4.2. Handshake de Reporte (Builder ➔ Orquestador)
Al concluir su implementación, el Builder emite:
```markdown
### 🛠️ Reporte de Implementación: [Spec ID - Tarea ID]
- **Archivos Modificados**: [Lista de archivos modificados]
- **Pruebas Creadas/Ejecutadas**: [Suite ejecutada y resultado N/N pass]
- **Estado de Sintaxis y Lint**: [node --check OK, ESLint 0 err / 0 warn]
- **Listo para Auditoría**: Sí
```

### 4.3. Handshake de Dictamen (Auditor ➔ Orquestador)
Tras revisar los diffs y ejecutar verificaciones independientes, el Auditor emite:
```markdown
### 🩺 Dictamen de Calidad: [Spec ID - Tarea ID / Spec Completa]
- **Veredicto**: [✅ APROBADO / ❌ RECHAZADO]
- **Verificación RF por RF**:
  - RF-1: [Cumplido / No cumplido + evidencia]
  - RF-2: [Cumplido / No cumplido + evidencia]
- **Auditoría de 5 Dimensiones**:
  1. Nomenclatura y Formato: [OK / Observación]
  2. Simplicidad (KISS/YAGNI): [OK / Observación]
  3. Mantenibilidad (DRY): [OK / Observación]
  4. Manejo de Errores y Excepciones: [OK / Observación]
  5. Seguridad y Privacidad Médica: [OK / Observación (AES-256-GCM, Blind Index, LFPDPPP, cero PHI en texto plano)]
- **Observaciones o Correcciones**: [Ninguna / Detalle específico de cambios requeridos]
```

### 4.4. Handshake de Despliegue (DevOps ➔ Orquestador)
Tras completar las operaciones de pre-vuelo y release, el DevOps emite:
```markdown
### 🚀 Reporte de Despliegue y Release: [Spec ID]
- **Validadores Estáticos**: [test:syntax OK, test:imports OK]
- **Linter Backend**: [npm run lint 0 errores / 0 advertencias]
- **Pruebas de Regresión**: [npm test N/N suites aprobadas]
- **Aislamiento de Entornos y CSP**: [Supabase Dev/Prod separados, _headers validado]
- **Estado de Producción**: [Listo para git push origin main previa confirmación del usuario]
```

---

## 5. Reglas Innegociables de Gobierno

1. **Nunca omitir al Auditor**: Ningún Builder puede dar por buena su propia tarea. El cierre de tarea en `overview/tasks.md` requiere el veredicto explícito `APROBADO` del Auditor de Calidad.
2. **Modo Solo Lectura del Auditor**: El Auditor de Calidad **JAMÁS** edita código; si detecta una falla, la reporta con precisión para que el Builder correspondiente la subsane.
3. **No push prematuro a producción**: El agente DevOps jamás ejecuta `git push origin main` ni migraciones en Supabase Producción sin verificación local completa y autorización explícita del usuario.
4. **Sincronización Continua de Memoria**: Tras cada ciclo o entrega aprobada, el Orquestador actualiza de inmediato `overview/tasks.md` y `overview/session.md`.
