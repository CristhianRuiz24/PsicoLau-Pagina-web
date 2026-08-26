# AGENTS.md — Web PsicoLau & Suite Clínica

## 🧠 Contexto del Proyecto
Sitio web profesional y sistema de gestión clínica para **Ana Laura Gómez Díaz**, psicóloga clínica, bajo la marca **PSICOLAU — Psicología y Resiliencia** (dominio oficial: `psicolau.com`).
Es un espacio de salud mental: prioriza la calidez, claridad, ética y confianza clínica por encima de plantillas corporativas genéricas.

---

## 📜 Fuente de Verdad para Contenido
- **Datos Profesionales**: Toda la información sobre formación, credenciales, experiencia, libros y publicaciones proviene del currículum vitae oficial en `Recursos para que use la IA/Currículum Vitae Laura Gómez-3.pdf` (ignorado en git por privacidad).
- **Recursos Gráficos**: El logo oficial y fotografías se encuentran en la carpeta `assets/`.
- **Regla Estricta**: No inventar credenciales, cifras ni diagnósticos clínicos. Si falta un dato o testimonio, consultar en lugar de asumir.

---

## 🌐 Estructura del Proyecto

### 1. Sitio Web Público (Multipágina)
* [`index.html`](file:///c:/Users/crist/Documents/Proyectos/Web%20PsicoLau/index.html) — Inicio, presentación, resumen de áreas y testimonios destacados.
* [`sobre-mi.html`](file:///c:/Users/crist/Documents/Proyectos/Web%20PsicoLau/sobre-mi.html) — Biografía profesional, enfoque terapéutico y formación de Laura Gómez.
* [`areas-de-atencion.html`](file:///c:/Users/crist/Documents/Proyectos/Web%20PsicoLau/areas-de-atencion.html) — 5 áreas de atención especializadas (Neurodivergencias en adultos, Trauma/Violencia, Ansiedad/Depresión, Neuropsicología clínica, Relaciones y vínculos).
* [`experiencia.html`](file:///c:/Users/crist/Documents/Proyectos/Web%20PsicoLau/experiencia.html) — Trayectoria, medios de comunicación, artículos de divulgación y ponencias.
* [`libros.html`](file:///c:/Users/crist/Documents/Proyectos/Web%20PsicoLau/libros.html) — Libros y publicaciones recomendadas.
* [`preguntas-frecuentes.html`](file:///c:/Users/crist/Documents/Proyectos/Web%20PsicoLau/preguntas-frecuentes.html) — Acordeón interactivo con 15 preguntas frecuentes sobre el proceso terapéutico.
* [`terapias-grupales.html`](file:///c:/Users/crist/Documents/Proyectos/Web%20PsicoLau/terapias-grupales.html) — Convocatoria y detalles para módulos de terapia grupal (Autismo en adultos).
* [`testimonios.html`](file:///c:/Users/crist/Documents/Proyectos/Web%20PsicoLau/testimonios.html) — Muro de testimonios (tarjetas, videos integrados y audios reales).
* [`contacto.html`](file:///c:/Users/crist/Documents/Proyectos/Web%20PsicoLau/contacto.html) — Formulario de contacto directo conectado al backend.

---

### 2. Panel Administrativo & Agenda Clínica (`/panel`)
* [`panel/index.html`](file:///c:/Users/crist/Documents/Proyectos/Web%20PsicoLau/panel/index.html) — Inicio de sesión seguro para la psicóloga mediante autenticación JWT.
* [`panel/agenda.html`](file:///c:/Users/crist/Documents/Proyectos/Web%20PsicoLau/panel/agenda.html) — Suite de gestión y calendario semanal tipo Easy Table con:
  - **Matriz Semanal Continua**: Rango horario de 07:00 a.m. a 12:00 a.m.
  - **Citas Recurrentes**: Creación automatizada en lote de 2 a 12 sesiones semanales/quincenales con numeración `(Sesión X/N)`.
  - **Buscador Global de Pacientes**: Búsqueda en tiempo real con historial (pasado, presente y futuro) y navegación directa a la semana de la cita (`irAFechaDeCita`).
  - **Cita Realizada / Completada**: Botón interactivo con sonido armónico generado por Web Audio API (`reproducirSonidoCompletada`), animación pop (`@keyframes popComplete`) y etiqueta `✓ Realizada`.
  - **Paleta de 24 Colores + Selector Libre**: 24 tonos clínicos/vibrantes organizados por familias más botón con gotero para selección personalizada de cualquier color hexadecimal con cálculo automático de contraste.
  - **Cápsula Flotante de Acciones**: Botones de WhatsApp, edición, papelera y verificación en fondo translúcido (`.card-actions-capsule`) para 100% de contraste visual.
  - **Recordatorios por WhatsApp**: Integración directa con `wa.me` y formato internacional (+52).
  - **Control de Pagos y Métricas en Vivo**: Alternador `[ 💳 Pagado / ⏳ Por Pagar ]` con cálculo instantáneo de ingresos y citas pendientes.
  - **Bloqueos de Horario**: Marcado de horarios no disponibles con textura rayada distintiva.
  - **Bloc de Notas Semanal**: Espacio para pendientes clínicos con autoguardado en `localStorage`.
  - **Modo de Impresión Limpio**: Reglas `@media print` optimizadas para PDF o papel.

---

### 3. Backend & Base de Datos (`/backend`)
* **Stack**: Node.js, Express, Prisma ORM, CORS, Helmet, dotenv, jsonwebtoken, bcryptjs, Nodemailer.
* **Base de Datos**: PostgreSQL en Supabase (`DATABASE_URL`).
* **Modelos Prisma** (`backend/prisma/schema.prisma`):
  - `Usuario`: Credenciales administrativas protegidas con bcrypt.
  - `Paciente`: Directorio de pacientes (nombre, email, teléfono, notas).
  - `Cita`: Citas programadas (`fechaHora`, `estado_cita`, `estado_pago`, `categoria`, `color`, relación con paciente).
* **Seguridad & Autenticación**:
  - Tokens JWT firmados con clave criptográfica de 256 bits (`JWT_SECRET`).
  - Middleware de protección de rutas `authMiddleware.js`.
* **Servicio de Correo Oficial**:
  - Proveedor: Resend API a través de SMTP (`smtp.resend.com`).
  - Dominio Verificado: `psicolau.com`.
  - Remitente Oficial: `PsicoLau <contacto@psicolau.com>` (`REMITENTE` en `.env`).
  - Correo de Destino: `lince_lg@yahoo.com.mx` (`CORREO_LAURA` en `.env`).
  - Encabezado `replyTo`: Configurado con el correo del paciente para respuesta inmediata con un clic.
  - *Nota*: Ya no se utiliza Formspree; todos los correos se procesan mediante el endpoint propio `POST /api/contacto`.

---

## 🎨 Identidad Visual y Paleta Oficial
- **Rosa/Coral Marca**: `#EC5E86` — Títulos, elementos de marca y acentos cálidos.
- **Turquesa Oficial**: `#3EB8CC` — Botones de acción, enlaces principales y estados activos.
- **Gris Cálido**: `#8C8C8C` — Texto de cuerpo (nunca negro puro para reducir fatiga visual).
- **Tipografía**: Sans-serif limpia, moderna y accesible (Google Fonts).

---

## 🔒 Reglas de Seguridad y Despliegue
1. **Cloudflare Pages**: Despliegue estático del frontend desde GitHub con headers de seguridad CSP en `_headers`.
2. **Render (Backend API)**: Alojamiento del servicio Node.js (`/backend`) con root directory `backend`, build command `npm install && npx prisma generate`, start command `npm start` y subdominio oficial `api.psicolau.com`.
3. **📌 Recordatorio para Despliegue en Producción (UptimeRobot)**:
   - En el plan gratuito de Render, el servicio se suspende tras 15 minutos de inactividad.
   - **Acción requerida al desplegar**: Configurar un monitor gratuito en [UptimeRobot](https://uptimerobot.com/) o [cron-job.org](https://cron-job.org/) que envíe una petición HTTP cada 10 minutos a `https://api.psicolau.com/api/health`. Esto mantendrá la API despierta 24/7 con respuesta instantánea sin costo.
4. **Blindaje `.gitignore`**:
   - Variables de entorno (`.env`, `.env.*`, `**/.env`).
   - Dependencias (`node_modules/`, `**/node_modules/`).
   - Documentos privados (`Recursos para que use la IA/`, `caso-estudio/`).
   - Archivos de sistema y logs (`*.log`, `.DS_Store`, `Thumbs.db`).
   - Plantilla de configuración pública: `backend/.env.example`.

---

## 📝 Historial de Trabajo y Decisiones Técnicas

- **2026-08-21 (Sesión 1)**: Creación del sitio multipágina estático con HTML/CSS/JS clásico.
- **2026-08-21 (Sesión 2 - Seguridad y Despliegue)**: Conexión con Cloudflare Pages (`psicolau.com`), cabeceras CSP, `robots.txt` y `sitemap.xml`.
- **2026-08-21 (Sesión 3 - Ajustes de Contenido y UI)**: Reestructuración de 5 áreas de atención y ajuste de especificidad en CSS.
- **2026-08-21 (Sesión 4 - Experiencia y Divulgación)**: Integración de artículos y publicaciones de Saberes y Ciencias.
- **2026-08-22 (Sesión 5 - Preguntas Frecuentes)**: Creación de `preguntas-frecuentes.html` con sistema acordeón.
- **2026-08-22 (Sesión 6 - Terapias Grupales)**: Creación de `terapias-grupales.html` con botón de inscripción directa a WhatsApp.
- **2026-08-23 (Sesión 7 - Testimonios)**: Creación de `testimonios.html` con formato tarjeta, videos embebidos y reproductor de audio.
- **2026-08-23 (Sesión 8 - Corrección de Menú Activo)**: Unificación de la clase `.active` en la navegación.
- **2026-08-23 (Sesión 9 - Limpieza de Repositorio)**: Eliminación de archivos confidenciales del seguimiento de Git y corrección de `.gitignore`.
- **2026-08-24 (Sesión 10 - Rediseño Easy Table, Suite Clínica y Configuración de Correo)**:
  - Implementación de la matriz semanal completa (07:00 a.m. - 12:00 a.m.).
  - Soporte completo para citas recurrentes en lote (2 a 12 sesiones con salto semanal/quincenal).
  - Buscador global de pacientes con salto directo a fecha (`irAFechaDeCita`).
  - Botón de cita realizada con sonido armónico Web Audio API y animación pop.
  - Cápsula flotante blanca (`.card-actions-capsule`) para garantizar legibilidad de iconos.
  - Corrección de preservación de datos en el modal de edición de citas.
  - Migración definitiva del formulario de contacto hacia el backend con Resend y dominio verificado `psicolau.com`.
  - Generación de `JWT_SECRET` criptográfico de 256 bits y blindaje de `.gitignore`.
- **2026-08-25 (Sesión 11 - Expansión de Paleta, Soft Delete y Mantenimiento)**:
  - Corrección de advertencias de CSS en acordeón de FAQs.
  - Ampliación de la paleta a 24 colores clínicos/vibrantes organizados por familias.
  - Integración del selector libre de color con gotero (`<input type="color">`) para personalización sin límites.
  - Implementación de **Soft Delete** para citas: Endpoint `PATCH /api/agenda/citas/:id/cancelar` que actualiza `estado_cita` a `CANCELADA`, ocultándola de la matriz semanal activa pero conservando el histórico completo en el buscador global con la etiqueta `✕ Cancelada / Borrada`, modal de consulta en solo lectura (sin campos editables ni selector de color/recurrencia) y opción de borrado físico definitivo con confirmación.
  - Integración de **Prefijos Telefónicos Internacionales para WhatsApp**: Selector con más de 20 países (México `+52`, EE. UU./Canadá `+1`, España `+34`, Colombia `+57`, Argentina `+54`, Chile `+56`, Perú `+51`, Europa y opción `🌐 Otro` con placeholder guiado dinámico) para envío directo de recordatorios a pacientes internacionales.
  - **Saneamiento de Citas Simultáneas y Pacientes**: Generación aleatoria criptográfica para registros sin correo (`sin-email-${Date.now()}-${random}`) y optimización de búsqueda por nombre/teléfono, asegurando tolerancia a citas paralelas o en el mismo milisegundo.
  - Reducción del tiempo de expiración del token **JWT a 24 horas** (`expiresIn: '24h'`) en el login.
  - **Suite de Cobranza y Auditoría de Pagos**: Módulo completo para eliminar la conciliación manual de fin de semana con:
    - **Auditoría de Pagos en 1 Clic** (`#modalAuditoriaPagos`): Filtros por semana activa e historial completo, listado de pacientes con sesiones por cobrar, botón para pedir pago y toggle rápido de `[ 💳 Pagado ]`.
    - **Configuración de Datos Bancarios y Enlaces** (`#modalDatosPago`): Banco, CLABE, Titular, Cuota sugerida, Enlace de pago internacional (PayPal/Stripe) y opción de incluir datos en recordatorios previos.
    - **Recordatorios Cordiales de Cobro por WhatsApp** (`enviarWhatsAppCobro`): Mensajes empáticos y clínicos preformateados con datos bancarios y solicitud de comprobante listos para enviar en 1 clic.
    - **Botón Rápido de Cobro en Tarjeta**: Icono de factura (`fa-file-invoice-dollar`) visible en tarjetas con pago pendiente en la matriz semanal.
    - **Saneamiento de Formato WhatsApp**: Sustitución de emojis y caracteres especiales por viñetas limpias (`•`) y negritas nativas (`*texto*`) para garantizar compatibilidad multiplataforma sin caracteres corruptos (``).
- **2026-08-25 (Sesión 12 - Auditoría Integral y Optimización de Producción)**:
  - **Auditoría Técnica Completa**: Revisión exhaustiva de frontend, panel, backend, seguridad, base de datos, CSP y SEO.
  - **Control de Versiones Integral**: Seguimiento de todo el backend (`/backend`) y panel administrativo (`/panel`) en Git con blindaje de secretos y `.env`.
  - **Centralización y Flexibilidad de API**: Configuración dinámica de `API_URL` / `API_BASE` en `panel.js`, `panel/index.html` y `main.js` para detección automática de entorno local (`localhost:3000`) o producción (`api.psicolau.com` / `window.PSICOLAU_API_URL`).
  - **Actualización de Seguridad CSP (`_headers`)**: Eliminación definitiva de Formspree y adición de directivas `connect-src` (`http://localhost:3000`, `https://api.psicolau.com`) y `script-src 'unsafe-inline'`.
  - **Optimización de SEO y Rastreo**: Bloqueo del panel administrativo en `robots.txt` (`Disallow: /panel/`), referencia directa a `sitemap.xml` y adición de etiquetas `<lastmod>` en cada URL.
  - **Prevención de Saturación de Conexiones**: Documentación de parámetros de Connection Pooling (`connection_limit=5&pool_timeout=20`) para optimización de Supabase Free Tier en `.env.example`.
- **2026-08-25 (Sesión 13 - Blindaje de Seguridad y Limpieza de Entornos)**:
  - **Restricción Estricta de CORS**: Reemplazo de la política abierta por un arreglo explícito de dominios (`psicolau.com`, `www.psicolau.com` y `FRONTEND_URL` local) en `backend/src/index.js`, bloqueando peticiones no autorizadas.
  - **Eliminación de Bypass de Desarrollo**: Supresión total del bloque de código que permitía acceso local (y accidentalmente remoto) con la cuenta `admin/admin` sin consultar la base de datos en `authController.js`.
  - **Credenciales Reales para Desarrollo**: Consolidación del uso exclusivo de `node backend/scripts/seedUser.js <email> <password>` para generar usuarios reales con contraseñas encriptadas mediante bcrypt para pruebas.
  - **Limpieza Completa de Base de Datos**: Ejecución de script directo para borrar definitivamente 7 citas de prueba generadas por problemas previos de UTC y limpieza de registros de pacientes huérfanos.
  - **Rotación de Credenciales de Producción**: Reconfiguración de `DATABASE_URL` y rotación del password administrativo en Supabase tras la eliminación del bypass de login de desarrollo.
  - **Flexibilización CORS Local (`file://`)**: Reestructuración de CORS en `index.js` mediante la variable `process.env.NODE_ENV`. Se permite acceso total en local para facilitar pruebas (incluso abriendo HTML con doble clic) pero se mantiene la política estricta si `NODE_ENV === 'production'`. **Ojo:** Asegurarse de que en Render exista la variable de entorno `NODE_ENV=production` para que la restricción se active automáticamente sin cambiar código.
