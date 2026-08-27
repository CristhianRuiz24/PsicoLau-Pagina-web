---
name: spec-generator
description: Usa esta skill cuando el usuario pida crear, redactar o revisar una especificación (spec), plan técnico o desglose de tareas para una funcionalidad nueva bajo el flujo Spec-Driven Development (SDD). Guía una entrevista de requisitos EARS y produce specs estructuradas.
---

# Generador de Especificaciones (Spec-Driven Development)

Convierte una idea o requerimiento en una especificación acordada (**spec**), un plan técnico justificado (**plan**) y una lista atómica de tareas (**tasks**).

> **Principio Clave**: La spec es el contrato entre el usuario y la IA. Si algo no está en la spec, no se implementa. Si los requisitos cambian a mitad de camino, se actualiza la spec primero y luego el código.

---

## 🔁 Proceso de Creación de una Feature

### 1. Lectura del Contexto
- Lee siempre `docs/constitution.md` para conocer los principios innegociables (cifrado, separación dev/prod, autenticación, etc.).
- Revisa las specs anteriores en `specs/` para mantener convenciones y evitar contradicciones.

### 2. Entrevista al Usuario (Modo Analista)
- **Regla estricta**: Haz preguntas de **UNA en UNA**, máximo 6 en total.
- Espera la respuesta del usuario antes de formular la siguiente.
- Enfócate en:
  - Casos límite y situaciones de error.
  - Qué queda expresamente fuera de alcance (*Out of Scope*).
  - Actores y permisos.
- **Prohibido discutir código o arquitectura**: La spec describe el **QUÉ** y el **POR QUÉ**. Si el usuario pregunta "¿cómo lo implementarías?", redirige la conversación al QUÉ.

### 3. Asignación de Número y Carpeta
- Consulta la carpeta `specs/` y toma el siguiente número libre de 3 dígitos: `specs/00X-nombre-kebab-case/`.
- Crea el archivo `specs/00X-nombre-kebab-case/spec.md` usando la plantilla base.

### 4. Redacción con Notación EARS
Los criterios de aceptación funcionales **deben** redactarse estrictamente con los 5 patrones EARS:
- **RF-x (Ubicuo)**: `EL SISTEMA <comportamiento permanente>`.
- **RF-x (Evento)**: `CUANDO <evento / acción>, EL SISTEMA <resultado esperado>`.
- **RF-x (Estado)**: `MIENTRAS <estado / modo activo>, EL SISTEMA <comportamiento continuo>`.
- **RF-x (Excepción)**: `SI <condición de error>, ENTONCES EL SISTEMA <respuesta o mensaje>`.
- **RF-x (Opcional)**: `DONDE <característica opcional>, EL SISTEMA <comportamiento específico>`.

> Si algo no se sabe con certeza, márcalo como `[NECESITA ACLARACIÓN: pregunta concreta]`. Nunca asumas ni inventes.

### 5. Aprobación y Clarificación (QA)
- Solicita la aprobación explícita del usuario sobre la `spec.md`.
- Si el usuario pide auditar la spec, revísala como QA: busca ambigüedades, contradicciones, casos no cubiertos y roces con `docs/constitution.md`.

### 6. Plan Técnico y Tareas Atómicas
- Una vez aprobada la `spec.md`, genera `specs/00X-nombre/plan.md` con:
  - Módulos afectados y contratos de API.
  - Modelo de datos (Prisma).
  - Decisiones técnicas con **alternativa descartada y motivo**.
- Luego genera `specs/00X-nombre/tasks.md` con tareas atómicas `T1..Tn`, cada una con archivos afectados y la condición obligatoria `Hecho cuando: [criterio verificable]`.

### 7. Implementación
- Implementa **una sola tarea a la vez**.
- Valida la tarea antes de pasar a la siguiente.
- Al finalizar, ejecuta la verificación obligatoria de `AGENTS.md`.
