# Aprendizajes / propuestas de regla

Cuando el agente nota un patrón que debería volverse regla fija
(en GEMINI.md, AGENTS.md o la constitución) pero no está autorizado a
aplicarlo solo, lo anota aquí para que tú decidas si lo promueves.

## Propuestas pendientes

*Ninguna.*

## Reglas promovidas y aplicadas

- [x] **Limpieza obligatoria en scripts de test**: Promovida a [`AGENTS.md`](../AGENTS.md) (§7.6). Todo script en `backend/scripts/` debe contar con limpieza automática de registros de prueba en bloque `finally` para mantener limpio el entorno de desarrollo y evitar pacientes huérfanos. — [Aprobado y promovido: 2026-09-04]
- [x] **Prohibición de timers en bucle (`schedule`) durante comandos CLI**: Promovida a [`GEMINI.md`](../GEMINI.md) (Reglas fijas). Prohibido encadenar temporizadores de sondeo `schedule` en comandos de desarrollo o auditoría que emitan notificaciones reactivas. — [Aprobado y promovido: 2026-09-04]
- [x] **Prioridad innegociable de la paleta oficial de marca sobre contrastes automáticos**: Promovida a [`AGENTS.md`](../AGENTS.md) (§4) y [`GEMINI.md`](../GEMINI.md) (Reglas fijas). La identidad visual institucional de Laura (rosa `#EC5E86`, turquesa `#1E94A8`) debe preservarse intacta frente a sugerencias algorítmicas de contraste. — [Aprobado y promovido: 2026-09-04]
