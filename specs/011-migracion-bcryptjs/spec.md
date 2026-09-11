# Spec 011 - Migración de bcrypt a bcryptjs

> **Proyecto:** PsicoLau — Backend API
> **Tipo:** Refactor / Seguridad (Resolución de Vulnerabilidades)
> **Estado:** Borrador para revisión (Fase SDD: Spec)

---

## 1. Contexto y Justificación

La auditoría de seguridad del 11 de septiembre de 2026 (y previos chequeos con `npm audit`) detectó vulnerabilidades críticas asociadas a la librería `tar` (<=7.5.20). Esta librería no es utilizada directamente por nosotros, sino que es una dependencia transitiva de `@mapbox/node-pre-gyp`, el cual a su vez es utilizado por `bcrypt` (la versión en C++) para compilarse durante la instalación.

Dado que actualizar `bcrypt` no resuelve el problema (la dependencia de `tar` sigue presente en sus herramientas de *build*), la estrategia más limpia y recomendada es sustituir `bcrypt` por `bcryptjs`, una implementación escrita enteramente en JavaScript que no requiere compilación y elimina esta cadena de vulnerabilidades sin requerir cambios estructurales en la API.

---

## 2. Objetivo

Sustituir la dependencia `bcrypt` por `bcryptjs` en todo el backend, asegurando que el mecanismo de autenticación (comparación y generación de hashes) mantenga exactamente el mismo nivel de seguridad y rendimiento relativo, y eliminando las vulnerabilidades de `npm audit`.

---

## 3. Requisitos Funcionales (EARS)

**RF-01** — **CUANDO** un usuario intente iniciar sesión o cambiar su contraseña, **EL SISTEMA DEBERÁ** utilizar `bcryptjs` para comparar o generar los hashes, manteniendo un *salt rounds* (costo) fijo de **10**.

**RF-02** — **CUANDO** el administrador ejecute los scripts locales (`seedUser.js` y las suites de test en `backend/scripts/`), **EL SISTEMA DEBERÁ** encriptar correctamente usando `bcryptjs`.

**RF-03** — **SI** se ejecuta el comando `npm audit` tras la migración, **ENTONCES EL SISTEMA DEBERÁ** mostrar `0` vulnerabilidades relacionadas con `tar` o `@mapbox/node-pre-gyp`.

**RF-04** — **EL SISTEMA DEBERÁ** seguir validando correctamente los hashes existentes en la base de datos (PostgreSQL / Supabase) previamente generados por la versión en C++ de `bcrypt`, garantizando cero impacto en los usuarios activos (retrocompatibilidad garantizada por el estándar BCrypt).

---

## 4. Requisitos No Funcionales

**RNF-01** — **Rendimiento:** El costo del hash se mantendrá en `10`. Dado que `bcryptjs` es ~30% más lento que el C++ nativo, el tiempo de respuesta del endpoint de login seguirá estando por debajo del umbral tolerable (< 300ms local).

**RNF-02** — **Mantenibilidad:** El uso de `bcryptjs` simplifica los despliegues en la nube (Render) y configuraciones de CI/CD al no requerir binarios de Python ni `node-gyp`.

---

## 5. Criterios de Aceptación (Definition of Done)

1. Spec aprobada.
2. Dependencia `bcrypt` desinstalada y eliminada del `package.json`.
3. Dependencia `bcryptjs` instalada.
4. Código actualizado en:
   - `backend/src/controllers/authController.js`
   - `backend/scripts/seedUser.js`
   - `backend/scripts/testCambioPassword.js` (y cualquier otro test relevante).
5. Todo el suite de pruebas (`testContabilidad.js`, etc.) pasa con 100% de éxito.
6. Login manual probado exitosamente con base de datos de desarrollo.
7. `npm audit` arroja cero alertas relacionadas con `tar`.
