# Aprendizajes / propuestas de regla

Cuando el agente nota un patrón que debería volverse regla fija
(en GEMINI.md, AGENTS.md o la constitución) pero no está autorizado a
aplicarlo solo, lo anota aquí para que tú decidas si lo promueves.

## Propuestas pendientes

- [ ] **Limpieza obligatoria en scripts de test**: Todo script de prueba o verificación en `backend/scripts/` que inserte registros temporales en base de datos debe incluir un bloque `finally` con limpieza automática (`delete`) o ejecutarse en transacción revertida para evitar registros huérfanos o duplicados en el entorno de desarrollo que confundan el directorio clínico. — [Surgió tras detectar registros duplicados de prueba de Elena Morales Rivera generados por verifyEndpoints.js, 2026-09-02]
- [ ] **Prohibición de timers en bucle (`schedule`) durante comandos CLI**: Cuando se ejecute un comando de desarrollo o auditoría que genere notificaciones reactivas automáticas, no se deben encadenar temporizadores de sondeo `schedule` para evitar generar mensajes repetitivos en la interfaz de usuario. — [Surgió durante las pruebas locales de Lighthouse, 2026-09-02]
- [ ] **Prioridad innegociable de la paleta oficial de marca sobre contrastes automáticos**: La identidad visual oficial de Laura (rosa `#EC5E86`, turquesa `#1E94A8`) definida en AGENTS.md debe preservarse intacta y prevalecer sobre sugerencias de contraste algorítmicas (Lighthouse/WCAG) que oscurezcan o apaguen los colores del logotipo y alteren la calidez de marca. — [Surgió tras la corrección del usuario sobre colores del logo, 2026-09-02]
