# Aprendizajes / propuestas de regla

Cuando el agente nota un patrón que debería volverse regla fija
(en GEMINI.md, AGENTS.md o la constitución) pero no está autorizado a
aplicarlo solo, lo anota aquí para que tú decidas si lo promueves.

## Propuestas pendientes

- [ ] **Aislamiento explícito de CSP en Cloudflare Pages para suites privadas**: En proyectos de Cloudflare Pages, nunca declarar directivas restrictivas de `Content-Security-Policy` (como la ausencia de `'unsafe-inline'` o restricción de CDNs de iconos/fuentes) bajo el comodín global `/*` si existen subdirectorios con requerimientos interactivos (como `/panel`). Dado que Cloudflare Pages hereda y concatena cabeceras aditivamente y los navegadores ejecutan la intersección más estricta, la CSP pública y la CSP del panel deben definirse explícitamente en bloques de ruta separados.


## Reglas promovidas y aplicadas

- [x] **Limpieza obligatoria en scripts de test**: Promovida a [`AGENTS.md`](../AGENTS.md) (§7.6). Todo script en `backend/scripts/` debe contar con limpieza automática de registros de prueba en bloque `finally` para mantener limpio el entorno de desarrollo y evitar pacientes huérfanos. — [Aprobado y promovido: 2026-09-04]
- [x] **Prohibición de timers en bucle (`schedule`) durante comandos CLI**: Promovida a [`GEMINI.md`](../GEMINI.md) (Reglas fijas). Prohibido encadenar temporizadores de sondeo `schedule` en comandos de desarrollo o auditoría que emitan notificaciones reactivas. — [Aprobado y promovido: 2026-09-04]
- [x] **Prioridad innegociable de la paleta oficial de marca sobre contrastes automáticos**: Promovida a [`AGENTS.md`](../AGENTS.md) (§4) y [`GEMINI.md`](../GEMINI.md) (Reglas fijas). La identidad visual institucional de Laura (rosa `#EC5E86`, turquesa `#1E94A8`) debe preservarse intacta frente a sugerencias algorítmicas de contraste. — [Aprobado y promovido: 2026-09-04]
