# Tareas de Implementación 018 — Modularización del Formulario de Citas (`app.js`)

> **Regla de ejecución**: Implementar y verificar una sola tarea a la vez antes de avanzar a la siguiente.

---

## 📋 Lista de Tareas

### [ ] T1: Crear módulo ESM `submitHandler.js` en `panel/js/agenda/form/`
- **Archivos**:
  - `panel/js/agenda/form/submitHandler.js` [NEW]
- **Acción**:
  - Implementar la lógica completa de captura y procesamiento del formulario `#formNuevaCita`:
    - Validación de campos requeridos (nombre, teléfono mínimo 10 dígitos, fecha/hora).
    - Parseo de prefijos semánticos (`[GRUPAL]`, `[BLOQUEO]`, `[EVALUACION]`).
    - Formateo de teléfono con prefijo internacional (`+52` etc.) y URL de Zoom.
    - Detección de edición de citas y modal interactivo de alcance de serie (`pedirAlcanceSerie`).
    - Invocación a `POST /api/agenda/citas` o `PUT /api/agenda/citas/:id`.
    - Cierre de modal, reseteo de formulario, reproducción de tono armónico (`tocarCampanaSuave`) y llamada al refresco `window.initAgenda()`.
- **Hecho cuando**:
  - El archivo `submitHandler.js` se encuentre creado y exporte `initSubmitHandler` y `procesarSubmitCita` sin errores sintácticos ESM.

---

### [ ] T2: Integrar `submitHandler` en `panel/js/agenda/index.js`
- **Archivos**:
  - `panel/js/agenda/index.js` [MODIFY]
- **Acción**:
  - Importar `initSubmitHandler` desde `./form/submitHandler.js`.
  - Ejecutar `initSubmitHandler()` al cargar el módulo ESM para activar el listener global de forma resiliente.
  - Re-exportar `initSubmitHandler` y exponerlo en `window` para depuración o compatibilidad si fuera necesario.
- **Hecho cuando**:
  - Al cargar la página del panel, el evento `submit` de `#formNuevaCita` quede registrado y atendido desde la arquitectura modular de agenda.

---

### [ ] T3: Desacoplar `panel/js/app.js` y exponer `window.initAgenda`
- **Archivos**:
  - `panel/js/app.js` [MODIFY]
- **Acción**:
  - Exponer explícitamente `window.initAgenda = initAgenda;` para asegurar la invocación global del refresco de matriz horaria desde cualquier submódulo.
  - Remover completamente el bloque procedimental de 173 líneas de `document.addEventListener('submit', ...)` en `app.js`.
  - Mantener intacto el buscador global (`filtrarCitasEnTabla`), la navegación de fechas y los controles de sesión.
- **Hecho cuando**:
  - `panel/js/app.js` quede reducido a su función de orquestador general y buscador, sin ninguna lógica de payload de citas en su interior.

---

### [ ] T4: Verificación Integral de No-Regresión en Local y Backend
- **Archivos**:
  - Todos los módulos afectados
- **Acción**:
  - Iniciar el entorno de desarrollo con `node scripts/dev.js`.
  - Probar en navegador la creación de:
    1. Una cita individual estándar.
    2. Un bloqueo de agenda con motivo.
    3. Una terapia grupal.
    4. Una serie recurrente de 2 sesiones semanales.
  - Probar la edición de una cita existente y verificar que el modal de alcance de serie (`#modalAlcanceSerie`) aparece y responde correctamente.
  - Verificar que la cancelación del modal de alcance mantiene los datos en pantalla sin descartarlos.
  - Ejecutar `npm test` en backend para asegurar que la suite de 40 tests continúa al 100% verde.
- **Hecho cuando**:
  - Todos los flujos de agenda operan con 100% de paridad funcional, la campana armónica suena tras guardar y ningún error aparece en la consola del navegador.
