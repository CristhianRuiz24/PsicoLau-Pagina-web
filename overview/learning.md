# Aprendizajes / propuestas de regla

Cuando el agente nota un patrón que debería volverse regla fija
(en GEMINI.md, AGENTS.md o la constitución) pero no está autorizado a
aplicarlo solo, lo anota aquí para que tú decidas si lo promueves.

## Propuestas pendientes

- [ ] **Limpieza obligatoria en scripts de test**: Todo script de prueba o verificación en `backend/scripts/` que inserte registros temporales en base de datos debe incluir un bloque `finally` con limpieza automática (`delete`) o ejecutarse en transacción revertida para evitar registros huérfanos o duplicados en el entorno de desarrollo que confundan el directorio clínico. — [Surgió tras detectar registros duplicados de prueba de Elena Morales Rivera generados por verifyEndpoints.js, 2026-09-02]

