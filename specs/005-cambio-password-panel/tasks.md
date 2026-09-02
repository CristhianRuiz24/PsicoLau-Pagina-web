# Tareas de Implementación 005 — Cambio de Contraseña desde el Panel Clínico

> **Regla de ejecución**: Implementar y verificar una sola tarea a la vez antes de avanzar a la siguiente.

---

## 📋 Lista de Tareas

### [x] T1: Validación Zod y Endpoint Backend de Cambio de Contraseña
- **Archivos**:
  - `backend/src/utils/validators.js`
  - `backend/src/controllers/authController.js`
  - `backend/src/routes/auth.js`
  - `backend/scripts/testCambioPassword.js`
- **Acción**:
  - Crear esquema `cambiarPasswordSchema` con Zod (mínimo 8 caracteres, coincidencia y diferencia con la anterior).
  - Implementar controlador `cambiarPassword` en `authController.js` con verificación `bcrypt.compare`, nuevo hash con costo 10 y generación de nuevo token JWT.
  - Añadir ruta `PUT /api/auth/cambiar-password` con `verificarToken` y rate limiter dedicado (5 req / 15 min).
  - Crear y ejecutar script de prueba automatizado `backend/scripts/testCambioPassword.js`.
- **Hecho cuando**:
  - El script `node backend/scripts/testCambioPassword.js` responde con código 200 y valida todos los casos de error (400) al 100%. *(Completado: 7/7 pruebas superadas al 100%)*

---

### [x] T2: Interfaz Visual (Botón en Cabecera y Modal de Seguridad)
- **Archivos**:
  - `panel/agenda.html`
  - `panel/panel.css`
- **Acción**:
  - Añadir botón `[ 🔒 Seguridad ]` en la cabecera `dashboard-header` inmediatamente antes del botón `Salir`.
  - Maquetar el modal `#modalCambiarPassword` con título, subtítulo, 3 campos (`passwordActual`, `passwordNueva`, `confirmarPassword`), botones interactivos de ojo (👁️) para alternar visibilidad, contenedor de alertas y botones `Cancelar` / `Guardar Contraseña`.
  - Estilar inputs con botón de ojo embebido en `panel.css`.
- **Hecho cuando**:
  - El modal abre visualmente centrado, accesible, con diseño idéntico al resto de la suite clínica y responsive. *(Completado: Botón y modal maquetados con diseño estético y responsive)*

---

### [x] T3: Lógica de Frontend y Renovación de Sesión
- **Archivos**:
  - `panel/js/app.js`
- **Acción**:
  - Conectar funciones globales: `abrirModalCambiarPassword()`, `cerrarModalCambiarPassword()`, `toggleVerPassword(inputId, iconId)`.
  - Implementar manejador de envío `guardarCambioPassword(event)` con validaciones previas en cliente.
  - Conectar llamada a la API con token JWT actual; al recibir 200 OK, actualizar `psicolau_token` en `localStorage` con el nuevo token, mostrar notificación verde y cerrar el modal.
  - Si el backend responde con error 400 o 429, mostrar el mensaje de error dentro del modal en color rojo sin cerrarlo.
- **Hecho cuando**:
  - Se puede cambiar la contraseña desde el navegador, los mensajes de error/éxito se muestran adecuadamente y la sesión de Laura permanece activa sin interrupciones. *(Completado: Controlador frontend conectado con validaciones y renovación de JWT)*

---

### [x] T4: Verificación Integral de No-Regresiones
- **Archivos**:
  - Todos los involucrados
- **Acción**:
  - Ejecutar la batería completa de tests en `backend/scripts/`.
  - Verificar en navegador que la agenda, expedientes, reporte mensual y auditoría de pagos siguen funcionando al 100%.
- **Hecho cuando**:
  - Cero regresiones en la suite clínica, tests en verde y aprobación lista para desplegar a producción. *(Completado: Batería completa de 8 tests automatizados al 100% y modal verificado en navegador)*
