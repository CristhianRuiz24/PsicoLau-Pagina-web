# Spec 018 — Modularización y Desacoplamiento del Formulario de Citas (`app.js`)

## 1. Contexto y Objetivo
Actualmente, el archivo [`panel/js/app.js`](../../panel/js/app.js) actúa como el orquestador principal del panel clínico (manejo de pestañas, layout y atajos globales). Sin embargo, alberga un bloque procedimental de más de 170 líneas (`#formNuevaCita.addEventListener('submit')`) encargado de validar, parsear, determinar alcances de series recurrentes y persistir citas contra la API.

Esta especificación formaliza la extracción de dicha responsabilidad hacia el módulo de agenda ([`panel/js/agenda/form/`](../../panel/js/agenda/form/)), garantizando el Principio de Responsabilidad Única (SRP), alta cohesión y **estricta no-regresión (100% de paridad funcional)** para la práctica clínica de Laura.

---

## 2. Usuarios / Actores
- **Laura (Psicóloga / Administradora)**: Única usuaria autorizada de la suite clínica. Interactúa con el modal para crear citas individuales, terapias grupales, evaluaciones, citas recurrentes y bloqueos de agenda sin percibir ninguna alteración visual o de flujo respecto a la versión anterior.

---

## 3. Historias de Usuario
- **H1**: Como terapeuta clínica, quiero agendar y actualizar citas desde el panel con la misma inmediatez y respuesta visual de siempre para mantener la gestión de mi consultorio fluida y libre de interrupciones.
- **H2**: Como terapeuta clínica, quiero que si ocurre una interrupción de red o decido no aplicar un cambio a una serie recurrente, el formulario conserve mis notas y datos escritos para no tener que redactarlos de nuevo.

---

## 4. Requisitos Funcionales (Criterios en Notación EARS)

- **RF-01 (Evento)**: CUANDO Laura envíe el formulario `#formNuevaCita`, EL SISTEMA validará los campos obligatorios (nombre de paciente o razón de bloqueo, fecha y hora válida, y teléfono con prefijo internacional) antes de iniciar cualquier petición de red.
- **RF-02 (Excepción)**: SI algún campo obligatorio está incompleto o el teléfono contiene menos de 10 dígitos numéricos útiles, ENTONCES EL SISTEMA emitirá una alerta visual a Laura y mantendrá abierto el modal con los valores ingresados intactos.
- **RF-03 (Evento)**: CUANDO se guarde una cita nueva (individual, grupal, evaluación o bloqueo), EL SISTEMA enviará la solicitud `POST /api/agenda/citas` al backend preservando exactamente los prefijos semánticos (`[GRUPAL]`, `[BLOQUEO]`, `[EVALUACION]`), el color y las repeticiones seleccionadas.
- **RF-04 (Evento)**: CUANDO se edite una cita que pertenezca a una serie recurrente (`serieId`), EL SISTEMA presentará el diálogo interactivo `#modalAlcanceSerie` para que Laura seleccione si los cambios aplican a `SOLO_ESTA` cita o a `ESTA_Y_SIGUIENTES`.
- **RF-05 (Excepción)**: SI Laura cancela la selección en `#modalAlcanceSerie`, ENTONCES EL SISTEMA cerrará únicamente el diálogo de selección de serie y mantendrá abierto `#formNuevaCita` con todos sus datos y modificaciones intactas.
- **RF-06 (Evento)**: CUANDO la petición de creación o actualización responda con éxito (HTTP 200/201), EL SISTEMA cerrará el modal `#modalNuevaCita`, reseteará los campos del formulario, reproducirá el tono armónico de confirmación (`tocarCampanaSuave()`) y refrescará inmediatamente la matriz semanal de la agenda (`initAgenda()`).
- **RF-07 (Excepción)**: SI la petición al servidor falla por error de red o código de error HTTP (4xx/5xx), ENTONCES EL SISTEMA notificará el error a Laura mediante alerta descriptiva y mantendrá abierto el modal `#modalNuevaCita` sin descartar la información capturada.
- **RF-08 (Ubicuo)**: EL SISTEMA aislará la lógica de envío y procesamiento del formulario en la arquitectura modular de agenda ([`panel/js/agenda/form/`](../../panel/js/agenda/form/)), dejando [`panel/js/app.js`](../../panel/js/app.js) libre de manipulación directa de payloads de citas.

---

## 5. Requisitos No Funcionales & Seguridad
- **Principio 3 de la Constitución (Frontend Simple & Vanilla)**: Modularización basada exclusivamente en ES Modules nativos del navegador, sin empaquetadores ni dependencias externas.
- **Principio 6 de la Constitución (No Regresión para Laura)**: Cero alteraciones en la experiencia de usuario, diseño responsive o flujos de confirmación sonora.
- **Seguridad**: Inclusión obligatoria del token `psicolau_token` en cabeceras `Authorization: Bearer <token>` para todas las peticiones a la API.

---

## 6. Casos Límite y Manejo de Errores
- **Cancelación de serie recurrente**: El usuario no debe perder el texto escrito en las notas si decide arrepentirse de modificar la serie.
- **Conexión inestable**: En caso de fallo en `fetch`, los campos del formulario deben persistir en pantalla para permitir reintentar sin fricción.
- **Token expirado o inválido**: Si la API responde con 401/403, se notifica la sesión expirada y se redirige limpiamente al login.

---

## 7. Fuera de Alcance (Out of Scope)
- **Buscador global de pacientes (`filtrarCitasEnTabla`)**: Se mantiene íntegramente dentro de `panel/js/app.js` como funcionalidad transversal de nivel de aplicación.
- **Cambios en el diseño visual del modal `#modalNuevaCita`**: No se alteran estilos CSS, disposición de botones ni paleta de colores.
- **Modificaciones al backend o base de datos**: Los endpoints `POST /api/agenda/citas` y `PUT /api/agenda/citas/:id` se mantienen sin cambios.

---

## 8. Criterios de Finalización (Definition of Done)
- [ ] Todos los requisitos funcionales (`RF-01` a `RF-08`) superados y comprobados.
- [ ] [`panel/js/app.js`](../../panel/js/app.js) queda completamente desacoplado del listener `submit` de `#formNuevaCita`.
- [ ] El guardado de citas individuales, grupales, evaluaciones, series recurrentes y bloqueos funciona con 100% de paridad en el entorno local.
- [ ] Cancelación de modal de series preserva los datos de edición.
- [ ] Notificación sonora armónica y refresco de tabla operativa tras guardado exitoso.
- [ ] Suite de pruebas del backend (`npm test`) se mantiene 100% verde (40/40 pasando).
- [ ] Principios innegociables de [`docs/constitution.md`](../../docs/constitution.md) intactos.

---

## 9. Dudas Abiertas / Pendientes de Aclaración
*(Ninguna pendiente — Requisitos acordados y clarificados en su totalidad).*
