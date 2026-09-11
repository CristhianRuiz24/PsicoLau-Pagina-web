# Aprendizajes / propuestas de regla

Cuando el agente nota un patrón que debería volverse regla fija
(en GEMINI.md, AGENTS.md o la constitución) pero no está autorizado a
aplicarlo solo, lo anota aquí para que tú decidas si lo promueves.

## Propuestas pendientes

*(Ninguna propuesta pendiente por el momento)*

## Reglas promovidas y aplicadas

- [x] **Carga Dinámica Asíncrona Obligatoria en Modales Desacoplados**: Promovida a [`AGENTS.md`](../AGENTS.md) (§6.10). Toda interacción con modales desacoplados debe asegurar su inyección en el DOM mediante `await asegurarModal(...)` y evitar sobreescrituras sincrónicas en scripts auxiliares (`if (!modal) return;`). — [Aprobado y promovido: 2026-09-11]
- [x] **Validación Semántica Estricta y Pruebas Adversarias Obligatorias (Defensa en Profundidad)**: Promovida a [`AGENTS.md`](../AGENTS.md) (§6.8 y §7.8). Todo campo de entrada se valida por lista blanca y la suite de pruebas incluye ataques adversarios (XSS/DAST). — [Aprobado y promovido: 2026-09-11]
- [x] **Descifrado Transparente en Controladores y Búsqueda Ciega de PII**: Promovida a [`AGENTS.md`](../AGENTS.md) (§6.9). Backend siempre descifra la PII; búsquedas en DB cifrada se hacen vía Blind Indexing (`emailHash`). — [Aprobado y promovido: 2026-09-11]
- [x] **Aislamiento explícito de CSP en Cloudflare Pages para suites privadas**: Promovida a [`AGENTS.md`](../AGENTS.md) (§6.7). En proyectos de Cloudflare Pages, nunca declarar directivas restrictivas de `Content-Security-Policy` bajo el comodín global `/*` si existen subdirectorios con requerimientos interactivos (como `/panel`). Dado que los navegadores aplican la intersección más restrictiva de cabeceras, la CSP pública y la CSP del panel deben definirse explícitamente en bloques de ruta separados. — [Aprobado y promovido: 2026-09-11]
- [x] **Ejecución secuencial determinista en suites de integración contra base de datos (`--test-concurrency=1`)**: Promovida a [`AGENTS.md`](../AGENTS.md) (§5 y §7.7). Al ejecutar pruebas automatizadas contra la base de datos de desarrollo, debe mantenerse la ejecución secuencial (`--test-concurrency=1` en `runTests.js`) para prevenir condiciones de carrera, falsos positivos por colisiones de datos y bloqueos en contadores globales. — [Aprobado y promovido: 2026-09-11]
- [x] **Limpieza obligatoria en scripts de test**: Promovida a [`AGENTS.md`](../AGENTS.md) (§7.6). Todo script en `backend/scripts/` debe contar con limpieza automática de registros de prueba en bloque `finally` para mantener limpio el entorno de desarrollo y evitar pacientes huérfanos. — [Aprobado y promovido: 2026-09-04]
- [x] **Prohibición de timers en bucle (`schedule`) durante comandos CLI**: Promovida a [`GEMINI.md`](../GEMINI.md) (Reglas fijas). Prohibido encadenar temporizadores de sondeo `schedule` en comandos de desarrollo o auditoría que emitan notificaciones reactivas. — [Aprobado y promovido: 2026-09-04]
- [x] **Prioridad innegociable de la paleta oficial de marca sobre contrastes automáticos**: Promovida a [`AGENTS.md`](../AGENTS.md) (§4) y [`GEMINI.md`](../GEMINI.md) (Reglas fijas). La identidad visual institucional de Laura (rosa `#EC5E86`, turquesa `#1E94A8`) debe preservarse intacta frente a sugerencias algorítmicas de contraste. — [Aprobado y promovido: 2026-09-04]
