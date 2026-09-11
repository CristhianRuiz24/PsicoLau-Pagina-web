# Tareas - Spec 011 (Migración a bcryptjs)

- [x] **T1:** Desinstalar dependencia antigua. Ejecutar `npm uninstall bcrypt` en el directorio `backend`.
  - *Hecho cuando:* `bcrypt` ya no exista en el `package.json`.
- [x] **T2:** Instalar nueva dependencia. Ejecutar `npm install bcryptjs` en el directorio `backend`.
  - *Hecho cuando:* `bcryptjs` aparezca en las dependencias del `package.json`.
- [x] **T3:** Refactorizar controlador de autenticación. Cambiar el import `require('bcrypt')` a `require('bcryptjs')` en `backend/src/controllers/authController.js`.
  - *Hecho cuando:* `login` y `cambiarPassword` funcionen sin lanzar errores de importación.
- [x] **T4:** Refactorizar scripts de test y utilería. Cambiar los imports en `backend/scripts/seedUser.js` y `backend/scripts/testCambioPassword.js` (y cualquier otro script en `backend/scripts/` que lo use).
  - *Hecho cuando:* Ningún archivo en `backend/` contenga `require('bcrypt')` o dependencias a `bcrypt`.
- [x] **T5:** Validar pruebas. Ejecutar `node backend/scripts/testCambioPassword.js` y `node backend/scripts/testContabilidad.js`.
  - *Hecho cuando:* Todas las suites de pruebas corran exitosamente y no se rompa la validación de tokens o passwords.
- [x] **T6:** Validar seguridad. Ejecutar `npm audit`.
  - *Hecho cuando:* Las alertas críticas sobre `@mapbox/node-pre-gyp` y `tar` hayan desaparecido.
