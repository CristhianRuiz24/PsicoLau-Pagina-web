# Spec 005 — Cambio de Contraseña desde el Panel Clínico

## 1. Contexto y Objetivo
Actualmente, las credenciales del panel administrativo de PsicoLau se gestionan mediante scripts en el backend (`seedUser.js`). Para garantizar la autonomía, privacidad y tranquilidad de Ana Laura Gómez Díaz, se requiere una funcionalidad in-app que le permita cambiar su contraseña de acceso cuando lo desee de forma simple y segura. La nueva contraseña se almacena exclusivamente como un hash `bcrypt`, garantizando que nadie (ni siquiera el equipo técnico) pueda conocer la clave en texto plano.

---

## 2. Usuarios / Actores
- **Psicóloga / Administradora (Ana Laura Gómez Díaz)**: Única usuaria del panel clínico, quien debe tener control absoluto sobre su contraseña personal de acceso.

---

## 3. Historias de Usuario
- **H1**: Como psicóloga clínica, quiero poder cambiar mi contraseña directamente desde mi panel para tener la certeza de que solo yo conozco la clave de acceso a mi consultorio virtual.
- **H2**: Como usuaria del panel, quiero poder ver u ocultar lo que escribo en los campos de contraseña para evitar errores tipográficos al teclear en móvil o computadora.
- **H3**: Como usuaria, quiero que al cambiar mi contraseña mi sesión se mantenga abierta para poder continuar trabajando de inmediato sin tener que volver a iniciar sesión.

---

## 4. Requisitos Funcionales (Criterios en Notación EARS)

- **RF-1 (Evento)**: CUANDO la usuaria hace clic en el botón `[ 🔒 Seguridad ]` en la cabecera (ubicado inmediatamente a la izquierda del botón `Salir`), EL SISTEMA abre el modal de cambio de contraseña.
- **RF-2 (Ubicuo)**: EL SISTEMA presenta un formulario con tres campos: "Contraseña actual", "Nueva contraseña" y "Confirmar nueva contraseña", cada uno con un botón interactivo (icono de ojo 👁️) para alternar la visibilidad entre texto plano y enmascarado.
- **RF-3 (Excepción)**: SI la nueva contraseña tiene menos de 8 caracteres, ENTONCES EL SISTEMA bloquea el envío y muestra el mensaje: *"La nueva contraseña debe tener al menos 8 caracteres."*
- **RF-4 (Excepción)**: SI la confirmación no coincide con la nueva contraseña, ENTONCES EL SISTEMA bloquea el envío y muestra el mensaje: *"Las contraseñas no coinciden."*
- **RF-5 (Excepción)**: SI la nueva contraseña es idéntica a la contraseña actual, ENTONCES EL SISTEMA bloquea el envío y muestra el mensaje: *"La nueva contraseña no puede ser igual a la anterior."*
- **RF-6 (Excepción)**: SI la contraseña actual ingresada no coincide con la registrada en la base de datos, ENTONCES EL SISTEMA responde con error `400 Bad Request` y muestra: *"La contraseña actual es incorrecta."*
- **RF-7 (Evento)**: CUANDO las validaciones son exitosas, EL SISTEMA genera el hash `bcrypt` (costo 10), actualiza el usuario en la base de datos, renueva el token JWT en `localStorage`, muestra una notificación verde (*"¡Contraseña actualizada exitosamente!"*) y cierra el modal.
- **RF-8 (Estado)**: MIENTRAS la usuaria actualiza su contraseña, EL SISTEMA mantiene la sesión activa en el panel sin forzar el cierre de sesión ni redirigir a la pantalla de login.
- **RF-9 (Excepción)**: SI se superan 5 intentos en una ventana de 15 minutos en el endpoint de cambio de clave, ENTONCES EL SISTEMA bloquea temporalmente las peticiones con código `429 Too Many Requests`.

---

## 5. Requisitos No Funcionales & Seguridad
- **Autenticación real**: Endpoint protegido estrictamente con el middleware `verificarToken` (requiere JWT válido).
- **Criptografía**: La contraseña viaja protegida por HTTPS/TLS en producción y se hashea en el backend con `bcrypt` (factor de costo 10). Cero contraseñas en logs ni texto plano.
- **Rate Limiting**: Limitador de tasa dedicado de 5 peticiones / 15 min por IP/usuario.
- **Constitución**: Cumplimiento íntegro de `docs/constitution.md` (separación dev/prod, autenticación sin bypasses y no-regresión en la agenda).

---

## 6. Casos Límite y Manejo de Errores
- **Cancelación**: Si la usuaria hace clic en "Cancelar", en la cruz `×` o presiona la tecla Escape, el modal se cierra y los campos se limpian de memoria.
- **Token expirado**: Si el token JWT de la sesión ya expiró al momento de enviar el formulario, el backend responde `401 Unauthorized` y el frontend redirige limpiamente al login.
- **Espacios accidentales**: El sistema recorta espacios en blanco al inicio y final (`trim`) de las entradas antes de evaluar.

---

## 7. Fuera de Alcance (Out of Scope)
- Recuperación o restablecimiento de contraseña vía enlace por correo electrónico (flujo sin sesión activa).
- Gestión de múltiples usuarios o roles administrativos (PsicoLau es de usuario único).
- Reglas forzadas de complejidad con mayúsculas y símbolos obligatorios (estándar acordado: mínimo 8 caracteres libres).

---

## 8. Criterios de Finalización (Definition of Done)
- [ ] Todos los requisitos funcionales (RF-1 a RF-9) verificados con tests automatizados y pruebas de navegador.
- [ ] Endpoint `PUT /api/auth/cambiar-password` protegido con JWT y rate limit estricto.
- [ ] Modal en `panel/agenda.html` con botón `[ 🔒 Seguridad ]` en cabecera junto a `Salir`.
- [ ] Alternancia de visibilidad (mostrar/ocultar contraseña con 👁️) operativa en los 3 campos.
- [ ] Respeta `docs/constitution.md` y no degrada ninguna funcionalidad de la suite clínica.
- [ ] Suite completa de tests backend pasando al 100%.

---

## 9. Dudas Abiertas / Pendientes de Aclaración
*Ninguna duda pendiente. Todos los requisitos fueron aclarados y acordados en la entrevista previa.*
