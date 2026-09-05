# GEMINI.md — Reglas de Antigravity para este proyecto

Este archivo tiene prioridad sobre AGENTS.md en Antigravity. Mantenlo corto:
solo lo que es específico de cómo trabajamos AQUÍ dentro de Antigravity.
El resto (contexto de proyecto, comandos, estilo) vive en AGENTS.md.

## Al iniciar cualquier sesión (`$boot`)

1. Lee, en este orden: `AGENTS.md` → `docs/constitution.md` → `overview/session.md` → `overview/tasks.md`.
2. Resume en 5 líneas: en qué quedó el proyecto, qué tarea estaba activa,
   qué sigue según `overview/tasks.md`, y si hay algo pendiente en
   `overview/learning.md`.
3. No toques código todavía. Espera confirmación antes de continuar.

## Durante el trabajo (`$work`)

- Sigue el flujo SDD definido en el prompt inicial del proyecto
  (constitución → spec → clarificación → plan → tareas → implementación →
  validación → cambio). No te saltes fases.
- Cada vez que cierres una tarea de `overview/tasks.md`, márcala y anota
  brevemente qué se hizo.

## Al cerrar la sesión (`$close`)

1. Actualiza `overview/session.md`: qué se logró, en qué quedó, próximo paso.
2. Actualiza `overview/tasks.md`: tareas completadas/pendientes.
3. Si hubo cambios estructurales (nuevos módulos, escenas, endpoints),
   actualiza el diagrama en `overview/architecture.md`.
4. Si notaste algo que debería ser una regla nueva pero no estás seguro,
   anótalo en `overview/learning.md` en vez de aplicarlo por tu cuenta.

## Reglas fijas

- Nunca modifiques `docs/constitution.md` sin que yo lo pida explícitamente.
- Ante cualquier cambio de comportamiento ya especificado: primero se
  actualiza la spec correspondiente en `specs/`, después el código.
- Prohibición de timers en bucle (`schedule`) durante comandos CLI: Cuando se
  ejecute un comando de desarrollo o auditoría que genere notificaciones
  reactivas automáticas, no se deben encadenar temporizadores de sondeo `schedule`
  para evitar generar mensajes repetitivos en la interfaz de usuario.
- Prioridad innegociable de la paleta oficial de marca sobre contrastes automáticos:
  La identidad visual oficial de Laura (rosa `#EC5E86`, turquesa `#1E94A8`) debe
  preservarse intacta y prevalecer sobre sugerencias algorítmicas de contraste.
