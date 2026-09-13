# Tareas de Implementación 022 — Rediseño Visual de Plantillas de Correo HTML Transaccionales

> **Regla de ejecución**: Implementar y verificar una sola tarea a la vez antes de avanzar a la siguiente.

---

## 📋 Lista de Tareas

### [x] T1: Helper de Layout Base y Rediseño de `enviarAvisoLaura`
- **Archivos**:
  - `backend/src/services/emailService.js`
- **Acción**:
  - Implementar la función auxiliar `construirPlantillaBase` con soporte para cabecera corporativa de PsicoLau, diseño de tarjeta responsiva, CSS inline amigable con Outlook/Gmail y pie de confidencialidad.
  - Rediseñar `enviarAvisoLaura`: sustituir la lista cruda por una tabla limpia con datos de la cita, destacar fecha/hora en badge suave, y reemplazar definitivamente el texto plano *"Revisa el panel de administración para confirmarla"* por un botón de acción (*CTA*) en turquesa (`#1E94A8`) que enlace a `https://psicolau.com/panel`.
- **Hecho cuando**:
  - La función genere HTML visualmente estructurado y no contenga la cadena de texto legacy.

---

### [x] T2: Rediseño de `enviarConfirmacionPaciente` y `enviarMensajeContacto`
- **Archivos**:
  - `backend/src/services/emailService.js`
- **Acción**:
  - Adaptar `enviarConfirmacionPaciente` para usar `construirPlantillaBase` con un mensaje cálido de bienvenida, resumen visual de la cita solicitada, botón de consulta por WhatsApp y firma profesional.
  - Adaptar `enviarMensajeContacto` unificando su diseño con la plantilla base, conservando el bloque del mensaje del paciente y el enlace de respuesta.
- **Hecho cuando**:
  - Todas las plantillas de correo en `emailService.js` compartan la misma identidad visual, cabecera y pie institucional.

---

### [x] T3: Script de Previsualización Visual y Verificación en Navegador
- **Archivos**:
  - `backend/scripts/previewEmails.js`
- **Acción**:
  - Crear un script que invoque la generación de los 3 correos con datos simulados seguros y los guarde como archivos HTML en disco para visualizarlos en el navegador.
- **Hecho cuando**:
  - Los 3 correos se puedan abrir y constatar visualmente con un diseño limpio, moderno y responsivo.

---

### [x] T4: Verificación Integral de No-Regresión y Linter
- **Archivos**:
  - `backend/src/services/emailService.js`
- **Acción**:
  - Ejecutar `npm run lint` en el backend (0 errores).
  - Ejecutar la suite unificada de pruebas `npm test` verificando que las 48 pruebas de integración pasen al 100%.
- **Hecho cuando**:
  - `npm test` reporta 48/48 PASS y `npm run lint` pasa limpio.

---

### [x] T5: Documentación de Sesión y Cierre
- **Archivos**:
  - `overview/session.md`
  - `overview/tasks.md`
- **Acción**:
  - Documentar las mejoras visuales implementadas en `session.md` y actualizar `tasks.md`.
- **Hecho cuando**:
  - La documentación refleje con precisión el nuevo estado del proyecto.
