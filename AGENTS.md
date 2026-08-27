# AGENTS.md — Web PsicoLau & Suite Clínica

> Instrucciones de contexto para cualquier agente de IA (Claude, Antigravity, etc.) que trabaje en este repo.
> Principios innegociables del proyecto: ver [`docs/constitution.md`](./docs/constitution.md).
> `CLAUDE.md` se limita a `@AGENTS.md`.

## 🧠 Contexto del Proyecto
Sitio web profesional y sistema de gestión clínica para **Ana Laura Gómez Díaz**, psicóloga clínica, bajo la marca **PSICOLAU — Psicología y Resiliencia** (dominio oficial: `psicolau.com`).
Es un espacio de salud mental: prioriza la calidez, claridad, ética y confianza clínica por encima de plantillas corporativas genéricas.

---

## 🔁 Flujo de trabajo: Spec-Driven Development (SDD)

Este proyecto sigue un flujo SDD para toda funcionalidad nueva o cambio significativo:

**Constitución → Spec → Clarificación → Plan → Tareas → Implementación (una tarea a la vez, tests primero) → Validación → Cambio (primero la spec, luego el código)**

- Los principios no negociables están en [`docs/constitution.md`](./docs/constitution.md). No se contradicen sin discutirlo explícitamente primero.
- Cada feature nueva vive en `specs/00X-nombre-feature/`, con `spec.md` (requisitos RF-x en notación EARS), `plan.md` (módulos, modelo de datos, decisiones técnicas) y `tasks.md` (tareas T1..Tn con "Hecho cuando: ...").
- Antes de escribir código para una feature nueva, debe existir su `spec.md` aprobado. Cambios pequeños de mantenimiento (fixes, ajustes menores) no requieren spec formal, pero sí deben respetar la constitución.
- Al terminar una tarea, no se marca como hecha sin cumplir la "Verificación obligatoria" (más abajo).

---

## 📜 Fuente de Verdad para Contenido
- **Datos Profesionales**: Toda la información sobre formación, credenciales, experiencia, libros y publicaciones proviene del currículum vitae oficial en `Recursos para que use la IA/Currículum Vitae Laura Gómez-3.pdf` (ignorado en git por privacidad).
- **Recursos Gráficos**: El logo oficial y fotografías se encuentran en la carpeta `assets/`.
- **Regla Estricta**: No inventar credenciales, cifras ni diagnósticos clínicos. Si falta un dato o testimonio, consultar en lugar de asumir.

---

## 🌐 Estructura del Proyecto

### 1. Sitio Web Público (Multipágina)
* `index.html` — Inicio, presentación, resumen de áreas y testimonios destacados.
* `sobre-mi.html` — Biografía profesional, enfoque terapéutico y formación de Laura Gómez.
* `areas-de-atencion.html` — 5 áreas de atención especializadas (Neurodivergencias en adultos, Trauma/Violencia, Ansiedad/Depresión, Neuropsicología clínica, Relaciones y vínculos).
* `experiencia.html` — Trayectoria, medios de comunicación, artículos de divulgación y ponencias.
* `libros.html` — Libros y publicaciones recomendadas.
* `preguntas-frecuentes.html` — Acordeón interactivo con 15 preguntas frecuentes sobre el proceso terapéutico.
* `terapias-grupales.html` — Convocatoria y detalles para módulos de terapia grupal (Autismo en adultos).
* `testimonios.html` — Muro de testimonios (tarjetas, videos integrados y audios reales).
* `contacto.html` — Formulario de contacto directo conectado al backend.

### 2. Panel Administrativo & Agenda Clínica (`/panel`)
* `panel/index.html` — Inicio de sesión seguro para la psicóloga mediante autenticación JWT.
* `panel/agenda.html` — Suite de gestión y calendario semanal tipo Easy Table con:
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

### 3. Backend & Base de Datos (`/backend`)
* **Stack**: Node.js, Express, Prisma ORM, CORS, Helmet, dotenv, jsonwebtoken, bcryptjs, Nodemailer.
* **Base de Datos**: PostgreSQL en Supabase (`DATABASE_URL`), con proyectos separados para dev y producción.
* **Modelos Prisma** (`backend/prisma/schema.prisma`):
  - `Usuario`: Credenciales administrativas protegidas con bcrypt.
  - `Paciente`: Directorio de pacientes (nombre, email, teléfono, notas).
  - `Cita`: Citas programadas (`fechaHora`, `estado_cita`, `estado_pago`, `categoria`, `color`, relación con paciente).
* **Seguridad & Autenticación**:
  - Tokens JWT firmados con clave criptográfica de 256 bits (`JWT_SECRET`), expiración de 24 horas.
  - Middleware de protección de rutas `authMiddleware.js`.
  - CORS restringido a un arreglo explícito de dominios permitidos (sin bypass de desarrollo).
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

## ⚙️ Comandos

- **Frontend local**: servir la raíz del repo con Live Server u otro servidor estático (`http://127.0.0.1:5500`).
- **Backend local**: `cd backend && npm install && npm start` (usa `.env` local apuntando al proyecto Supabase de desarrollo).
- **Generar cliente Prisma**: `npx prisma generate`.
- **Sincronizar esquema con la DB de desarrollo**: `npx prisma db push`.
- **Crear usuario admin real (sin bypass)**: `node backend/scripts/seedUser.js <email> <password>`.

---

## 🔒 Reglas de Seguridad y Despliegue
1. **Cloudflare Pages**: Despliegue estático del frontend desde GitHub con headers de seguridad CSP en `_headers`.
2. **Render (Backend API)**: Alojamiento del servicio Node.js (`/backend`) con root directory `backend`, build command `npm install && npx prisma generate`, start command `npm start` y subdominio oficial `api.psicolau.com`.
3. **Recordatorio para Despliegue en Producción (UptimeRobot)**:
   - En el plan gratuito de Render, el servicio se suspende tras 15 minutos de inactividad.
   - **Acción requerida al desplegar**: Configurar un monitor gratuito en [UptimeRobot](https://uptimerobot.com/) o [cron-job.org](https://cron-job.org/) que envíe una petición HTTP cada 10 minutos a `https://api.psicolau.com/api/health`.
4. **Blindaje `.gitignore`**:
   - Variables de entorno (`.env`, `.env.*`, `**/.env`).
   - Dependencias (`node_modules/`, `**/node_modules/`).
   - Documentos privados (`Recursos para que use la IA/`, `caso-estudio/`).
   - Archivos de sistema y logs (`*.log`, `.DS_Store`, `Thumbs.db`).
   - Plantilla de configuración pública: `backend/.env.example`.
5. **Protocolo de Pruebas Locales Obligatorias antes de Despliegue**:
   - Todo cambio nuevo, refactorización o funcionalidad grande debe desarrollarse y probarse **únicamente en el entorno local** (`http://127.0.0.1:5500` con la base de datos de pruebas en Supabase).
   - **No ejecutar `git push origin main`** de forma prematura: solo realizar el push a producción cuando el usuario haya revisado, probado y aprobado explícitamente el resultado en su navegador local.

---

## ✅ Verificación obligatoria al terminar una tarea

Ningún cambio se da por terminado sin comprobar lo siguiente:

1. **No se rompió nada existente**: el flujo de agenda, login y confirmación de citas sigue funcionando en local.
2. **Respeta la constitución**: revisar `docs/constitution.md` — en particular cifrado de datos sensibles, separación dev/prod, ausencia de bypasses de auth y CORS explícito.
3. **Coincide con la spec (si la feature tiene una)**: cada RF de `specs/00X-.../spec.md` tiene al menos un test o verificación manual que lo cubre.
4. **Probado en local antes de producción**: nunca se hace push a `main` sin aprobación explícita del usuario tras probar en su navegador.
5. **Sin secretos filtrados**: ningún `.env`, credencial o dato de paciente en claro queda expuesto en el commit.

---

## 📝 Historial de Trabajo y Registro de Decisiones

La bitácora detallada de sesiones y decisiones técnicas históricas se encuentra en [`docs/historial.md`](./docs/historial.md). Consultar ese archivo bajo demanda si se requiere contexto sobre cambios previos.

