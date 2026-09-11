# Plan Técnico 019 — Aislamiento del Rate Limiter en Entornos Locales y Pruebas

## 1. Resumen de la Solución Técnica
Se ajustará la función de escape `skip` en los limitadores `publicCitaLimiter` ([citas.js](file:///c:/Users/crist/Documents/Proyectos/Web%20PsicoLau/backend/src/routes/citas.js)) y `contactoLimiter` ([contacto.js](file:///c:/Users/crist/Documents/Proyectos/Web%20PsicoLau/backend/src/routes/contacto.js)). La nueva condición evaluará:
1. Si `process.env.NODE_ENV === 'test'`, se omite incondicionalmente.
2. Si `process.env.NODE_ENV !== 'production'`, se verifica si la IP del cliente (`req.ip`) corresponde a la interfaz de loopback (`127.0.0.1`, `::1`, o `::ffff:127.0.0.1`). En caso afirmativo, se omite el conteo.
3. Si `process.env.NODE_ENV === 'production'`, el resultado es estrictamente `false` y el limitador actúa de manera inflexible con su cuota de 5 peticiones cada 15 minutos.

---

## 2. Alineación con la Constitución
- **Principio #1 (Cifrado)**: No interfiere con datos ni algoritmos criptográficos.
- **Principio #2 (Separación Dev/Prod)**: Se preserva la barrera absoluta entre entornos; el bypass solo se activa en entornos de desarrollo local y pruebas.
- **Principio #5 (CORS y Superficie de Ataque)**: En producción la superficie de ataque permanece 100% blindada contra ataques de spam y fuerza bruta.
- **Principio #6 (No Regresión)**: Los formularios de agendamiento y contacto siguen funcionando de forma idéntica para los usuarios legítimos.

---

## 3. Módulos y Archivos Afectados

```text
Componente       | Archivos                              | Tipo de cambio
-----------------|---------------------------------------|------------------
Backend Routes   | backend/src/routes/citas.js           | Modificar
Backend Routes   | backend/src/routes/contacto.js        | Modificar
Backend Utils    | backend/src/utils/rateLimitHelpers.js | Crear (opcional/helper compartido)
Pruebas          | backend/scripts/testBlindajeEntradas.js| Validación
```

---

## 4. Modelo de Datos y Esquema
**Sin cambios.** No se modifica `schema.prisma` ni la base de datos de PostgreSQL.

---

## 5. Contratos de API / Endpoints
Los contratos de `/api/citas/public` y `/api/contacto` no sufren alteraciones en estructura ni payload. Se preserva la respuesta HTTP 400 ante validaciones fallidas y HTTP 429 ante exceso de peticiones externas en producción.

---

## 6. Decisiones Técnicas y Alternativas Descartadas

| Decisión tomada | Razón técnica | Alternativa descartada y por qué |
|---|---|---|
| Helper de detección de IP local (`esIpLocal(req)`) evaluado solo en modo no-producción | Máxima simplicidad, evita repetición de lógica entre `citas.js` y `contacto.js`. | Desactivar el rate limiter por completo en desarrollo: Descartado porque impediría probar que el rate limiter realmente existe y funciona. |
| Mantener el limitador en el mismo puerto 3001 | No requiere cambiar configuraciones en el frontend ni en `dev.js`. | Forzar un puerto efímero 3002 exclusivo para tests: Descartado por complejidad innecesaria al compartir base de datos dev. |

---

## 7. Estrategia de Pruebas y Validación
1. Ejecución aislada de `node scripts/testBlindajeEntradas.js` con el servidor de desarrollo activo.
2. Ejecución completa de la suite unificada `npm test` verificando 40/40 tests aprobados al 100%.
3. Prueba de llamada simulada con IP simulada en producción para verificar que HTTP 429 se activa correctamente cuando corresponde.
