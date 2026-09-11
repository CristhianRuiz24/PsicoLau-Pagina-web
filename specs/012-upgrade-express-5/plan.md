# Plan Técnico - Spec 012 (Express 5.x)

## 1. Módulos Afectados
- `backend/package.json` (Dependencia `express`)
- `backend/src/controllers/*.js` (Refactorización de todos los controladores para remover `try/catch`)
- `backend/src/index.js` (Verificación del error handler global)

## 2. Modelo de Datos
- **Sin cambios.** La migración de framework no toca a Prisma ni la base de datos subyacente.

## 3. Decisiones Técnicas
- **Remoción de try/catch:** En Express 4, si una promesa era rechazada (ej. un query a BD fallaba), Node finalizaba la app si no se envolvía en un `try/catch(err){ next(err) }`. En Express 5, devolver una Promesa rechazada en un route handler automáticamente llama a `next(err)`. Dado que nuestros controladores retornan el valor de la Promesa (por el uso de `await`), removeremos todos los bloques envolventes de `try/catch` que pasen el error usando `next(error)` y aquellos que retornen manualmente un `res.status(500)` genérico, confiando en el manejador 500 global ya existente.
- **Mantener excepciones de negocio:** Solo se removerán los `try/catch` orientados a cazar fallos de infraestructura genéricos. Los flujos de negocio condicionales (ej. un if que retorna error si no hay cita) se mantienen.
