# Tareas de Implementación 024 — Blindaje de Errores de Servidor, Sanitización de Respuestas y Resiliencia en UI

> **Regla de ejecución**: Implementar y verificar una sola tarea atómica a la vez delegando en el subagente especialista correspondiente, y validar con el auditor antes de avanzar a la siguiente.

---

## 📋 Lista de Tareas Atómicas

### [ ] T1: Middleware Centralizado de Errores Sanitizado en Backend
- **Subagente asignado**: `builder-backend`
- **Archivos**:
  - `backend/src/middlewares/errorHandler.js` (Crear)
  - `backend/src/index.js` (Modificar)
- **Acción**:
  - Crear `errorHandler.js` extrayendo y robusteciendo el middleware de errores de `index.js`.
  - Mapear instancias y mensajes de Prisma (`PrismaClientInitializationError`, `PrismaClientRustPanicError`, `PrismaClientUnknownRequestError`, errores de conector `FATAL: (ENOTFOUND) tenant/user`, `Can't reach database server`) a HTTP 503 con el mensaje seguro: *"El servicio clínico no se encuentra disponible momentáneamente. Por favor, intenta de nuevo en unos minutos."*.
  - Garantizar que errores 500 respondan con mensaje seguro sin traza (`stack: undefined`), preservando el volcado completo en `logger.error`.
  - Preservar mensajes legítimos de validación Zod (400) y Prisma P2002 (400).
  - Conectar el middleware en `backend/src/index.js`.
- **Hecho cuando**:
  - `npm run lint` en backend corra con 0 errores y el middleware exporte y gestione las excepciones sanitizando las respuestas.

---

### [ ] T2: Helper Transversal de Sanitización y Botón de Reintento en Frontend
- **Subagente asignado**: `builder-frontend`
- **Archivos**:
  - `panel/js/errorHelper.js` (Crear módulo ESM)
  - `panel/css/components/login.css` (Modificar)
- **Acción**:
  - Crear `panel/js/errorHelper.js` con las funciones:
    - `sanitizarMensajeError(error, fallbackMsg)`: detecta cadenas técnicas (`prisma`, `tenant`, `database`, `stack`, etc.) o longitud > 120 caracteres y devuelve el mensaje institucional amigable.
    - `renderizarErrorConReintento(contenedor, mensaje, onRetry)`: inyecta el mensaje sanitizado junto con el botón de reintento estilizado con `#1E94A8`.
  - Añadir estilos responsivos en `panel/css/components/login.css` para el botón de reintento (`.btn-reintentar`) con hover, foco accesible y transición suave.
- **Hecho cuando**:
  - `npm run test:syntax` y `npm run test:imports` ejecuten con 0 errores reconociendo el nuevo módulo `panel/js/errorHelper.js`.

---

### [ ] T3: Integración de Resiliencia en Login y Manejo Defensivo en Panel
- **Subagente asignado**: `builder-frontend`
- **Archivos**:
  - `panel/js/login.js` (Modificar)
  - `panel/agenda.html` o scripts relacionados si aplica
- **Acción**:
  - Actualizar `panel/js/login.js` para importar y utilizar `sanitizarMensajeError` y `renderizarErrorConReintento`.
  - Al fallar la petición de autenticación (sea por HTTP 500/503 o por `Failed to fetch`), renderizar la alerta segura con el botón para "Reintentar".
  - Al pulsar "Reintentar", limpiar el mensaje y volver a disparar el flujo de autenticación sin recargar la página.
- **Hecho cuando**:
  - Se verifique en el login que un fallo simulado (servidor apagado o desconectado) despliega el mensaje empático con el botón "Reintentar", y que `npm run test:syntax` valide todos los módulos del panel.

---

### [ ] T4: Suite Automatizada de Verificación y Compuertas de Pre-Vuelo
- **Subagente asignado**: `builder-backend` & `auditor-calidad`
- **Archivos**:
  - `backend/scripts/testSanitizacionErroresSpec024.js` (Crear)
- **Acción**:
  - Crear suite de prueba automatizada que levante la app de Express en un puerto efímero e inyecte:
    1. Error de conexión de base de datos simulado -> Verifica HTTP 503, JSON `{ success: false, message: ... }` y 0 fugas de `stack` o `tenant`.
    2. Excepción inesperada 500 -> Verifica HTTP 500, mensaje seguro y 0 fugas de `stack`.
    3. Error 400 de validación -> Verifica que el mensaje funcional no es bloqueado indebidamente.
  - Ejecutar todas las compuertas de pre-vuelo:
    - `npm run test:syntax`
    - `npm run test:imports`
    - `npm run lint`
    - `node backend/scripts/testSanitizacionErroresSpec024.js`
- **Hecho cuando**:
  - La suite `testSanitizacionErroresSpec024.js` apruebe al 100% y el `auditor-calidad` emita su dictamen formal de APROBADO.

