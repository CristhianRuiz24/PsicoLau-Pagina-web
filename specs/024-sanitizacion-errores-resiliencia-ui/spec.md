# Spec 024 — Blindaje de Errores de Servidor, Sanitización de Respuestas y Resiliencia en UI

## 1. Contexto y Objetivo
Durante un evento de desconexión o suspensión de la base de datos de producción (Supabase), se evidenció que el backend expone trazas de ejecución completas (`stack`), sentencias internas de Prisma y nombres de infraestructura (`tenant/user postgres.pokzqvttgzzpkjzsdghl not found`). Adicionalmente, el frontend del panel clínico (`panel/js/login.js`) inyecta directamente el texto recibido en el DOM sin sanitización defensiva, provocando que la usuaria (Laura) visualice un bloque de código técnico ilegible que rompe el diseño móvil y deteriora la confianza en la plataforma.

El objetivo de esta especificación es implementar un blindaje integral contra filtración de información técnica (*Information Disclosure*) y dotar a la plataforma de resiliencia en la experiencia de usuario:
1. Sanitizar por diseño el middleware centralizado de errores del backend (`backend/src/index.js`), garantizando que jamás se expongan trazas de ejecución, nombres de infraestructura ni detalles de Prisma/SQL al cliente, registrándolos exclusivamente en los logs internos del servidor.
2. Reconocer de forma tipada caídas de base de datos o fallos de conector (`PrismaClientInitializationError`, `PrismaClientUnknownRequestError`, códigos de red) respondiendo con HTTP 503 y mensajes clínicos controlados.
3. Incorporar en el frontend (Login y vistas del panel clínico: Agenda, Expedientes, Pagos) una capa defensiva de intercepción de errores que sustituya cualquier mensaje técnico anómalo por avisos cálidos y profesionales en la paleta oficial (`#EC5E86`, `#1E94A8`), acompañados de un botón de acción para reintentar la operación.

---

## 2. Usuarios / Actores
- **Lic. Laura Gómez (Administradora / Usuaria del Panel)**: Requiere una experiencia visual limpia, confiable y comprensible ante caídas de servicio o problemas de conexión, con explicaciones humanas y la capacidad de reintentar sin frustración.
- **Paciente / Visitante Web**: En caso de un fallo en formularios públicos (contacto o solicitud de cita), recibe un mensaje amigable y empático sin exposición de detalles internos del sistema.
- **Administrador de Sistemas / Desarrollador (CrisDev)**: Dispone de logs completos y estructurados en el logger del servidor (`logger.error`) para diagnóstico y depuración sin comprometer la seguridad pública.

---

## 3. Historias de Usuario
- **H1**: Como Laura, cuando el servicio presente una interrupción o corte de base de datos al intentar iniciar sesión, quiero ver un aviso claro y amable en lugar de código o errores técnicos incomprensibles, para saber qué ocurre y poder reintentar con tranquilidad.
- **H2**: Como Laura, cuando falle la carga de citas, notas clínicas o pagos por una desconexión momentánea, quiero recibir una notificación amigable con un botón para "Reintentar", para no perder mi trabajo ni tener que recargar toda la página desde cero.
- **H3**: Como administrador, quiero que el servidor nunca exponga trazas de ejecución, nombres de tablas, variables ni credenciales en respuestas HTTP públicas o autenticadas, para preservar la seguridad de la infraestructura y cumplir con las normas de confidencialidad clínica.

---

## 4. Requisitos Funcionales (Criterios en Notación EARS)

### Backend: Sanitización y Manejo Tipado de Errores
- **RF-1 (Ubicuo)**: EL SISTEMA sanitizará permanentemente todas las respuestas HTTP de error del servidor (estatus 500 y 503), garantizando que la propiedad `message` contenga únicamente mensajes seguros en lenguaje natural y omitiendo de forma definitiva la propiedad `stack`, nombres de esquemas, consultas SQL y rutas de archivos locales en la respuesta JSON.
- **RF-2 (Evento)**: CUANDO ocurra una excepción por indisponibilidad, timeout o caída de la base de datos (instancias de `PrismaClientInitializationError`, `PrismaClientRustPanicError` o fallos de conector de red), EL SISTEMA registrará el error detallado en `logger.error` y responderá al cliente con HTTP 503 (Service Unavailable) y el mensaje JSON estandarizado:
  `{ "success": false, "message": "El servicio clínico no se encuentra disponible momentáneamente. Por favor, intenta de nuevo en unos minutos." }`.
- **RF-3 (Excepción)**: SI el servidor captura un error interno no previsto de estatus 500 no asociado a base de datos, ENTONCES EL SISTEMA registrará el incidente en los logs internos y responderá con el mensaje seguro:
  `{ "success": false, "message": "Ha ocurrido un error inesperado al procesar tu solicitud. Por favor, intenta más tarde." }`.
- **RF-4 (Estado)**: MIENTRAS el backend opere en cualquier entorno, EL SISTEMA evaluará `NODE_ENV` asegurando que ninguna variable no productiva active el retorno de trazas hacia clientes remotos; el stack trace permanecerá accesible únicamente en la consola y logs del servidor.
- **RF-5 (Keep-Alive y Diagnóstico)**: CUANDO se consulte `GET /api/health/db`, EL SISTEMA ejecutará una consulta mínima a PostgreSQL (`SELECT 1`); si responde con éxito, devolverá HTTP 200 `{ "status": "ok", "db": "connected" }`, y si la base de datos no está disponible, devolverá HTTP 503 sanitizado, permitiendo a monitores externos (UptimeRobot, cron) prevenir la suspensión por inactividad.

### Frontend: Resiliencia y Experiencia de Usuario
- **RF-5 (Evento - Pantalla de Login)**: CUANDO el inicio de sesión falle por un error de servidor (HTTP 500/503) o fallo de red en el navegador (`Failed to fetch`), EL SISTEMA presentará en la tarjeta de acceso un mensaje institucional:
  *"No fue posible conectar con el servicio clínico. Por favor, intenta nuevamente en unos momentos."*, acompañado de un botón visible estilizado con la clase de acción (`#1E94A8`) para **"Reintentar"** que limpie el estado de error y reintente el envío.
- **RF-6 (Excepción - Sanitización Defensiva en Cliente)**: SI cualquier respuesta HTTP recibida por el panel contiene patrones o términos técnicos no aptos para usuarios (ej. `prisma`, `database`, `syntax`, `stack`, `connector`, `tenant`, `pg_`, `sql`), ENTONCES EL SISTEMA en frontend interceptará y reemplazará automáticamente la cadena por el mensaje institucional seguro antes de asignarla a cualquier elemento del DOM.
- **RF-7 (Evento - Vistas Clínicas del Panel)**: CUANDO una petición asíncrona de agenda, expedientes o pagos falle por corte de conexión o HTTP 500/503, EL SISTEMA mostrará un aviso no invasivo (banner o toast de alerta) con texto empático y un botón de acción rápida para reintentar la consulta específica sin perder los datos ya capturados en formularios.

### Suites de Prueba y Gobernanza
- **RF-8 (Opcional / Pruebas)**: DONDE se ejecuten pruebas automatizadas en `NODE_ENV === 'test'`, EL SISTEMA garantizará que los endpoints respondan con códigos HTTP coherentes (400, 401, 404, 500, 503) y estructuras JSON `{ success: false, message: ... }` verificables, manteniendo la compatibilidad total con la suite de tests existente.

---

## 5. Requisitos No Funcionales & Seguridad
- **Confidencialidad y Seguridad (LFPDPPP & OWASP)**: Blindaje absoluto contra *CWE-209 (Generation of Error Message Containing Sensitive Information)*. Ningún dato sensible, ruta del sistema operativo (`/opt/render/...`), identificador de tenant ni estructura de base de datos debe llegar al navegador del usuario.
- **Identidad Visual y Calidez**: Los mensajes de error y botones de reintento en frontend respetarán la paleta oficial (Rosa `#EC5E86`, Turquesa `#1E94A8`, Fondo marfil `#FDFBF9` y texto en gris cálido `#4A4A4A`), manteniendo una comunicación empática y profesional acorde a un espacio de salud mental.
- **Rendimiento y Cero Regresiones**: La intercepción y sanitización en cliente y servidor no añadirá latencia perceptible ni alterará el comportamiento de validaciones funcionales legítimas (como mensajes 400 de Zod o 401 de credenciales inválidas).

---

## 6. Casos Límite y Manejo de Errores
- **Corte total de Internet en el dispositivo del usuario**: `fetch` arroja `TypeError: Failed to fetch`. El frontend lo captura y muestra: *"Comprueba tu conexión a internet e intenta nuevamente."* con botón de reintento.
- **Servidor respondiendo con página HTML de error (ej. Cloudflare 502/504 Bad Gateway)**: `response.json()` falla con `SyntaxError`. El cliente captura el fallo de parseo y renderiza el mensaje seguro en lugar de romper la ejecución.
- **Errores de validación de negocio (HTTP 400) o autenticación (HTTP 401)**: Los mensajes funcionales claros (ej. *"Credenciales inválidas"*, *"Email y contraseña son requeridos"*) se preservan intactos para guiar adecuadamente a la usuaria.

---

## 7. Fuera de Alcance (Out of Scope)
- **Mecanismos de Keep-Alive / Cron automatizado para Supabase Free Tier**: La reactivación o prevención de pausas por inactividad de Supabase se gestiona operativamente a nivel de infraestructura, cron externo o cambio de plan en Supabase, no en el código de esta spec.
- **Modificaciones en el modelo de base de datos (Prisma schema)**: Esta spec no altera tablas ni esquemas de datos.
- **Rediseño completo de la arquitectura de autenticación JWT**: Se mantiene la política vigente de tokens de 8 horas.

---

## 8. Criterios de Finalización (Definition of Done)
- [ ] Backend: Middleware centralizado de errores sanitizado y blindado ante excepciones de Prisma/DB con respuestas HTTP 503/500 seguras (0 fugas de stack trace).
- [ ] Frontend: Pantalla de login y módulos del panel con mensajes amigables y botón "Reintentar".
- [ ] Frontend: Función helper transversal de sanitización defensiva de errores implementada y probada.
- [ ] Suite de pruebas automatizada creada en `backend/scripts/` que simule caídas de BD y valide la sanitización de respuestas JSON.
- [ ] Suite completa de tests (`test:syntax`, `test:imports`, `lint`, `test`) ejecutada y aprobada con 0 regresiones.
- [ ] Verificación de los principios de `docs/constitution.md` y `AGENTS.md`.

---

## 9. Dudas Abiertas / Pendientes de Aclaración
*Ninguna. Todas las dudas sobre alcance, tono de mensajes y exclusión de keep-alive fueron aclaradas durante la entrevista de requisitos.*

