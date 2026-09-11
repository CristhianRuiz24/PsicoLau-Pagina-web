# Plan Técnico 018 — Modularización y Desacoplamiento del Formulario de Citas (`app.js`)

## 1. Resumen de la Solución Técnica
Se creará un nuevo submódulo ES Modules en [`panel/js/agenda/form/submitHandler.js`](../../panel/js/agenda/form/submitHandler.js) que encapsulará de forma limpia:
1. La captura y validación del evento `submit` del formulario `#formNuevaCita`.
2. La determinación del tipo de cita (`CITA`, `EVALUACION`, `GRUPAL`, `BLOQUEO`) y la sanitización de prefijos.
3. El cálculo de montos y fechas ISO normalizadas.
4. La interacción con el modal de series recurrentes (`pedirAlcanceSerie`).
5. La comunicación HTTP (`POST` y `PUT`) contra el backend.
6. La retroalimentación sonora (`tocarCampanaSuave`), reseteo del modal y llamada al refresco de la tabla.

Se conectará dicho handler en [`panel/js/agenda/index.js`](../../panel/js/agenda/index.js) mediante una función de inicialización `initSubmitHandler()` y se limpiará el bloque procedimental de 173 líneas en [`panel/js/app.js`](../../panel/js/app.js), asegurando que `window.initAgenda` esté expuesto globalmente.

---

## 2. Alineación con la Constitución
- **Principio 3 (Frontend Simple & Vanilla)**: Se emplean únicamente ES Modules nativos del navegador (`import`/`export`), sin añadir herramientas de empaquetado, dependencias de Node en el cliente ni librerías de terceros.
- **Principio 4 (Autenticación Real)**: Toda llamada al backend envía el token JWT persistido en `localStorage` (`psicolau_token`) en la cabecera `Authorization: Bearer <token>`.
- **Principio 6 (No-Regresión para Laura)**: El formulario y sus modales satélite mantienen el 100% del comportamiento visual y operacional preexistente.

---

## 3. Módulos y Archivos Afectados

```text
Componente       | Archivo                                 | Tipo de cambio
-----------------|-----------------------------------------|------------------
Frontend (Agenda)| panel/js/agenda/form/submitHandler.js   | Crear (Nuevo módulo ESM)
Frontend (Agenda)| panel/js/agenda/index.js                | Modificar (Registrar handler)
Frontend (Core)  | panel/js/app.js                         | Modificar (Remover listener y exponer initAgenda)
```

---

## 4. Modelo de Datos y Esquema
*Sin modificaciones en base de datos ni en Prisma.* Los modelos `Cita` y `Paciente` permanecen idénticos.

---

## 5. Contratos de API / Endpoints Utilizados

### `POST /api/agenda/citas` (Creación de citas y series)
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Body**:
  ```json
  {
    "nombre": "string",
    "email": "string",
    "telefono": "string",
    "enlaceZoom": "string",
    "fechaHora": "ISO8601 string",
    "categoria": "string",
    "notas": "string",
    "color": "#HEX",
    "monto": 500,
    "repeticiones": 1,
    "frecuencia": "SEMANAL"
  }
  ```
- **Respuesta 201**: `{ "success": true, "data": [...] }`

### `PUT /api/agenda/citas/:id` (Edición de cita simple o en serie)
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Body**: Mismos campos que en creación, añadiendo opcionalmente `"alcance": "SOLO_ESTA" | "ESTA_Y_SIGUIENTES"` y `"estado_cita": "PENDIENTE" | "CONFIRMADA" | "REALIZADA" | "CANCELADA"`.
- **Respuesta 200**: `{ "success": true, "data": {...} }`

---

## 6. Decisiones Técnicas y Alternativas Descartadas

| Decisión tomada | Razón técnica | Alternativa descartada y por qué |
|---|---|---|
| **Módulo dedicado `submitHandler.js` en `agenda/form/`** | Agrupa la validación y el payload en el submódulo de formularios de agenda, logrando alta cohesión y SRP. | *Dejar el código en `agenda/index.js`:* Descartado porque incrementaría innecesariamente el tamaño del punto de entrada ESM. |
| **Delegación de eventos sobre `document` con filtro `e.target.id === 'formNuevaCita'`** | Mantiene compatibilidad total con la carga diferida (lazy load) de modales HTML inyectados en el DOM. | *Listener directo `form.addEventListener`:* Riesgo de fallo si el formulario aún no está inyectado en el DOM al momento del arranque. |
| **Exposición explícita de `window.initAgenda` en `app.js`** | Garantiza que tanto `submitHandler.js` como `citaState.js` y `directorio.js` puedan invocar el refresco de citas sin acoplamiento circular. | *Importar `app.js` desde `agenda/`:* Descartado porque `app.js` es un script clásico (`defer`), no un ES Module. |

---

## 7. Estrategia de Pruebas y Validación
1. **Verificación de sintaxis ESM**: Comprobar que el navegador cargue los módulos sin errores de consola (`SyntaxError` o `Uncaught ReferenceError`).
2. **Flujo de Creación**:
   - Crear una cita individual estándar.
   - Crear un bloqueo de agenda (`[BLOQUEO]`).
   - Crear una terapia grupal (`[GRUPAL]`).
   - Crear una serie recurrente de 3 citas.
3. **Flujo de Edición y Series**:
   - Editar una cita simple.
   - Editar una serie y comprobar apertura de `#modalAlcanceSerie`.
   - Cancelar `#modalAlcanceSerie` y verificar que los datos editados persisten en el formulario.
4. **Verificación de No-Regresión Backend**:
   - Ejecutar la suite unificada `npm test` para asegurar que el backend y sus 40 pruebas continúan al 100% verdes.
