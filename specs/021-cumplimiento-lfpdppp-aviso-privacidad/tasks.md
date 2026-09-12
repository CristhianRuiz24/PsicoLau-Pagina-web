# Tareas de Implementación 021 — Cumplimiento Integral de la LFPDPPP, Aviso de Privacidad y Consentimiento

> **Regla de ejecución**: Implementar y verificar una sola tarea a la vez antes de avanzar a la siguiente.

---

## 📋 Lista de Tareas

### [x] T1: Actualización del Aviso de Privacidad Integral (`privacidad.html`)
- **Archivos**:
  - `privacidad.html`
- **Acción**:
  - Incorporar la sección 6 sobre Cookies, Almacenamiento Local Técnico (`localStorage`) y Analítica sin Cookies (Cloudflare Web Analytics).
  - Incorporar la sección 7 sobre Transferencias de Datos y Remisiones a Proveedores Tecnológicos en la Nube (Supabase, Render, Cloudflare, Resend) bajo los Artículos 36 y 37 fracciones IV y VII de la LFPDPPP y 49 del RLFPDPPP.
  - Actualizar la sección 8 (Derechos ARCO) para documentar la regla sanitaria de retención obligatoria de 5 años para expedientes clínicos y el procedimiento de bloqueo preventivo (NOM-004-SSA3-2012 y Art. 26 Fracc. II de la LFPDPPP).
  - Actualizar los plazos formales de respuesta y ejecución ARCO (20 días hábiles de respuesta + 15 días hábiles de cumplimiento según Art. 32 LFPDPPP).
  - Actualizar la fecha de última modificación a septiembre de 2026.
- **Hecho cuando**:
  - `privacidad.html` renderice limpiamente los nuevos apartados legales con estilos tipográficos accesibles y consistentes con la paleta de marca.

---

### [x] T2: Validación Obligatoria de Consentimiento en Backend (`validators.js`)
- **Archivos**:
  - `backend/src/utils/validators.js`
- **Acción**:
  - Incorporar en `contactoSchema` la regla:
    ```javascript
    privacyCheck: z.literal(true, {
      errorMap: () => ({ message: 'Debes aceptar el Aviso de Privacidad para enviar tu consulta' })
    })
    ```
- **Hecho cuando**:
  - `contactoSchema.safeParse` devuelva `success: false` si `privacyCheck` es omitido, `false` o no booleano.

---

### [x] T3: Transmisión de Consentimiento desde el Formulario Frontend (`js/main.js`)
- **Archivos**:
  - `js/main.js`
- **Acción**:
  - Modificar el manejador de envío del formulario de contacto para extraer el valor booleano del checkbox:
    ```javascript
    privacyCheck: document.getElementById('privacyCheck').checked
    ```
  - Incluir `privacyCheck` en el payload JSON enviado a `POST /api/contacto`.
- **Hecho cuando**:
  - El envío de formulario en `contacto.html` transmita `privacyCheck: true` al endpoint `/contacto`.

---

### [x] T4: Creación de Suite Automatizada de Pruebas (`testConsentimientoLFPDPPP.js`)
- **Archivos**:
  - `backend/scripts/testConsentimientoLFPDPPP.js`
- **Acción**:
  - Crear suite con `node:test` y `node:assert` probando:
    1. Rechazo con HTTP 400 al enviar formulario sin `privacyCheck`.
    2. Rechazo con HTTP 400 al enviar formulario con `privacyCheck: false`.
    3. Aceptación con HTTP 200 al enviar formulario con datos válidos y `privacyCheck: true`.
  - Asegurar aislamiento en modo test sin envíos reales de correo.
- **Hecho cuando**:
  - `node --test backend/scripts/testConsentimientoLFPDPPP.js` pase el 100% de las aserciones en verde.

---

### [x] T5: Verificación Integral de No-Regresión y Linter
- **Archivos**:
  - Todos los archivos modificados
- **Acción**:
  - Ejecutar `npm run lint` en `backend/`.
  - Ejecutar la suite unificada `npm test` en `backend/`.
- **Hecho cuando**:
  - `npm run lint` reporte 0 errores y 0 advertencias.
  - `npm test` ejecute todas las suites de prueba (48 tests) con 100% PASS.

---

### [x] T6: Documentación SDD y Cierre
- **Archivos**:
  - `overview/session.md`
  - `overview/tasks.md`
- **Acción**:
  - Registrar el avance y finalización de la Spec 021 en la memoria del proyecto.
- **Hecho cuando**:
  - `session.md` y `tasks.md` reflejen el estado verificado de la Spec 021.
