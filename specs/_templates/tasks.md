# Tareas de Implementación 00X — <Nombre de la Funcionalidad>

> **Regla de ejecución**: Implementar y verificar una sola tarea a la vez antes de avanzar a la siguiente.

---

## 📋 Lista de Tareas

### [ ] T1: <Título de la Tarea 1 (ej. Modelo de Datos / Prisma)>
- **Archivos**:
  - `backend/prisma/schema.prisma`
- **Acción**:
  - <Detalle concreto de lo que se debe hacer.>
- **Hecho cuando**:
  - `npx prisma db push` o `npx prisma generate` corran sin errores en el entorno dev de pruebas.

---

### [ ] T2: <Título de la Tarea 2 (ej. Controlador y Rutas Backend)>
- **Archivos**:
  - `backend/src/controllers/...`
  - `backend/src/routes/...`
- **Acción**:
  - <Detalle de endpoints, validaciones y lógica de negocio.>
- **Hecho cuando**:
  - Script de prueba automatizado (`node backend/scripts/test...js`) responde con 200 y maneja errores con 400/401.

---

### [ ] T3: <Título de la Tarea 3 (ej. Interfaz de Usuario / Frontend)>
- **Archivos**:
  - `panel/js/...`
  - `panel/...html`
- **Acción**:
  - <Integración visual y conexión con los endpoints.>
- **Hecho cuando**:
  - El usuario puede interactuar con el componente en `http://127.0.0.1:5500` y observar la respuesta visual esperada.

---

### [ ] T4: <Título de la Tarea 4 (ej. Validación Final y No-Regresiones)>
- **Archivos**:
  - Todos los involucrados
- **Acción**:
  - Ejecutar verificación obligatoria de `AGENTS.md`.
- **Hecho cuando**:
  - Se valida que la agenda, el login y las citas siguen funcionando al 100% sin efectos secundarios.
