# Spec 012 - Actualización a Express 5.x

> **Proyecto:** PsicoLau — Backend API
> **Tipo:** Refactor / Seguridad (Resolución de Vulnerabilidades)
> **Estado:** Completada / Verificada (Fase SDD: Validación)

---

## 1. Contexto y Justificación

La auditoría de seguridad y dependencias (`npm audit`) reportó alertas moderadas de seguridad sobre la dependencia transitiva `qs` utilizada internamente por `express@4.x`. Express 4 depende de versiones antiguas de ciertas librerías que ya no reciben parches retroactivos, lo que obliga a migrar a Express 5.x (actualmente la rama *main*) para obtener las últimas actualizaciones de seguridad de sus subdependencias.

Además, Express 5.x introduce una mejora crítica en el lenguaje: el soporte nativo para Promesas (`async/await`) en las rutas y middlewares. Esto permite que los errores asíncronos sean enviados automáticamente al `errorHandler` global sin tener que envolver el cuerpo de cada controlador en un bloque `try/catch`.

---

## 2. Objetivo

Actualizar la dependencia principal del backend de `express@4.22.2` a la última versión disponible de `express@5.x`. Durante esta migración, se limpiará la deuda técnica removiendo los bloques `try/catch` redundantes en los controladores de la API, delegando el manejo de excepciones al manejador de errores global, sin alterar la lógica de negocio ni el formato de respuesta (`JSON`) que recibe el frontend.

---

## 3. Requisitos Funcionales (EARS)

**RF-01** — **CUANDO** el backend se inicialice y responda peticiones, **EL SISTEMA DEBERÁ** operar utilizando el motor de `express` versión 5.x.

**RF-02** — **CUANDO** ocurra una excepción en cualquier controlador asíncrono (`async (req, res, next)`), **EL SISTEMA DEBERÁ** atrapar automáticamente el error y enviarlo al manejador de errores global sin requerir bloques `try/catch` explícitos.

**RF-03** — **MIENTRAS** la aplicación procese solicitudes (ej. crear citas, editar notas, login), **EL SISTEMA DEBERÁ** mantener total compatibilidad con los middlewares actuales de seguridad (`authMiddleware`), registro (`logger`) y límite de peticiones (`rate-limiter`).

**RF-04** — **SI** el administrador ejecuta `npm audit` en el entorno de desarrollo backend tras la migración, **ENTONCES EL SISTEMA DEBERÁ** arrojar 0 vulnerabilidades moderadas, altas o críticas relacionadas con `qs` o `express`.

---

## 4. Requisitos No Funcionales

**RNF-01** — **Cero impacto en Producción:** La remoción de bloques `try/catch` modificará el flujo de control interno pero no alterará en absoluto el cuerpo de las respuestas de error. El usuario final en producción seguirá viendo el mismo comportamiento ante fallos (ej. códigos 400 o 500 estándar).

**RNF-02** — **Legibilidad:** Los controladores en `src/controllers/` (agenda, auth, expedientes, pacientes, pagos) se verán reducidos en nivel de indentación al eliminar la cláusula `try/catch`.

---

## 5. Criterios de Aceptación (Definition of Done)

1. Spec aprobada.
2. `express` actualizado a la versión `^5.0.0` (o superior) en el `package.json`.
3. Eliminados todos los bloques `try/catch` genéricos innecesarios en `backend/src/controllers/`.
4. El manejador de errores global en `backend/src/index.js` ha sido probado comprobando que atrapa rechazos de promesas.
5. El 100% de la suite de pruebas (`testContabilidad.js`, `testExpediente.js`, etc.) pasa con éxito.
6. `npm audit` arroja cero vulnerabilidades en el árbol de dependencias.
