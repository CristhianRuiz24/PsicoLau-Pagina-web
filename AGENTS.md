# AGENTS.md — Web PsicoLau & Suite Clínica

> Instrucciones de contexto operativo para cualquier agente de IA (Antigravity, Claude, etc.) que trabaje en este repositorio.
> Principios innegociables del proyecto: ver [`docs/constitution.md`](./docs/constitution.md).
> Reglas específicas de Antigravity: ver [`GEMINI.md`](./GEMINI.md).
> Bitácora de sesiones y decisiones históricas: ver [`docs/historial.md`](./docs/historial.md).

---

## 🧠 1. Contexto del Proyecto
Sitio web profesional y sistema de gestión clínica para **Ana Laura Gómez Díaz**, psicóloga clínica, bajo la marca **PSICOLAU — Psicología y Resiliencia** (dominio oficial: `psicolau.com`).
Es un espacio de salud mental que prioriza calidez, claridad, ética, confidencialidad médica y confianza clínica por encima de plantillas corporativas genéricas.

---

## 🔁 2. Flujo de Trabajo: Spec-Driven Development (SDD)

El proyecto sigue rigurosamente el flujo SDD para cualquier funcionalidad o cambio:

**Constitución → Spec (EARS) → Clarificación (QA) → Plan → Tareas (atómicas) → Implementación (tests primero) → Validación (RF por RF) → Cambio (spec primero, luego código)**

1. **Constitución**: Principios innegociables en [`docs/constitution.md`](./docs/constitution.md). Nunca se modifican sin solicitud explícita del usuario.
2. **Especificación**: Cada feature nueva se gestiona en `specs/00X-[nombre]/spec.md` con requisitos funcionales numerados (`RF-1`, `RF-2`...) en notación EARS.
3. **Memoria de Sesión Persistente**:
   - `overview/session.md`: Estado actual, qué se logró, próximo paso.
   - `overview/tasks.md`: Tareas activas, estado y bloqueos.
   - `overview/architecture.md`: Diagrama vivo de arquitectura y decisiones técnicas.
   - `overview/learning.md`: Propuestas de reglas para revisión del usuario.

---

## 🛠️ 3. Stack Tecnológico y Arquitectura

### 🌐 Frontend Público (Multipágina Estática)
- **Tecnologías**: HTML5 semántico, CSS3 Vanilla, JavaScript Vanilla (sin frameworks ni build steps).
- **Alojamiento**: Cloudflare Pages (`psicolau.com`) con cabeceras de seguridad CSP/HSTS en `_headers`.
- **Estructura**: `index.html`, `sobre-mi.html`, `areas-de-atencion.html`, `experiencia.html`, `libros.html`, `preguntas-frecuentes.html`, `terapias-grupales.html`, `testimonios.html`, `contacto.html`, `privacidad.html`.

### 🩺 Panel Administrativo & Suite Clínica (`/panel`)
- **Tecnologías**: HTML5, CSS3, JavaScript modularizado en `panel/js/`:
  - `config.js`: Configuración dinámica de API (local `localhost:3000` vs producción `api.psicolau.com`) y soporte LAN para móviles.
  - `audio.js`: Notificaciones acústicas y retroalimentación armónica con Web Audio API.
  - `whatsapp.js`: Integración de mensajes preformateados para `wa.me` con prefijos internacionales (+20 países).
  - `pagos.js`: Auditoría de pagos en 1 clic y reporte contable mensual con KPIs y exportación (WhatsApp, CSV UTF-8 BOM, Impresión/PDF).
  - `agenda.js`: Matriz semanal interactiva (7:00 a.m. - 12:00 a.m.), citas recurrentes (2 a 12 sesiones), autocompletado y paleta de 24 colores + gotero.
  - `expedientes.js`: Suite de expedientes médicos cifrados, historial cronológico interactivo, buscador y edición in-place (97vh).
  - `app.js`: Inicialización, buscador global a pantalla completa y orquestación de vistas.

### ⚙️ Backend & Base de Datos (`/backend`)
- **Tecnologías**: Node.js, Express, Prisma ORM, CORS, Helmet, dotenv, jsonwebtoken, bcrypt, Resend API / Nodemailer, Zod.
- **Base de Datos**: PostgreSQL en Supabase (`DATABASE_URL`), con proyectos completamente separados para Desarrollo y Producción.
- **Cifrado Clínico**: `AES-256-GCM` simétrico a nivel de aplicación (`backend/src/utils/crypto.js`) con `ENCRYPTION_KEY` de 256 bits y tag de autenticación. Datos sensibles nunca tocan la base de datos en texto plano.
- **Modelos Prisma** (`backend/prisma/schema.prisma`):
  - `Usuario`: Credenciales administrativas con hash bcrypt.
  - `Paciente`: Directorio de pacientes (nombre, email, teléfono, tarifaDefecto, enlaceZoom, notas).
  - `Cita`: Citas programadas y recurrentes (`fechaHora`, `estado_cita`, `estado_pago`, `categoria`, `color`, `monto`, `esGrupal`).
  - `Expediente`: Notas de sesiones con 8 campos clínicos cifrados en AES-256-GCM.

---

## 🎨 4. Identidad Visual y Paleta Oficial
- **Rosa/Coral Marca**: `#EC5E86` — Títulos, identidad institucional y acentos cálidos.
- **Turquesa Acción**: `#1E94A8` (calibrado WCAG 2.1 AA) / `#3EB8CC` — Botones de acción, enlaces activos y foco.
- **Gris Cálido Texto**: `#8C8C8C` / `#4A4A4A` — Texto de lectura (evitar negro puro para reducir fatiga visual).
- **Fondo General**: `#FDFBF9` — Tono marfil suave y cálido.
- **Tipografía**: Sans-serif moderna, legible y accesible (Google Fonts: Outfit / Inter).

> **Prioridad innegociable de la paleta oficial sobre contrastes automáticos**: La identidad visual oficial de Laura (rosa `#EC5E86`, turquesa `#1E94A8`) debe preservarse intacta y prevalecer sobre sugerencias de contraste algorítmicas (Lighthouse/WCAG) que oscurezcan o apaguen los colores del logotipo y alteren la calidez de marca.

---

## 💻 5. Comandos de Desarrollo

- **Frontend local**: Servidor estático en la raíz (ej. Live Server en `http://127.0.0.1:5500` o `npx serve -l 5500`).
- **Backend local**: `cd backend && npm install && npm run dev` (o `npm start`, puerto `3000`).
- **Generar cliente Prisma**: `cd backend && npx prisma generate`.
- **Sincronizar esquema DB Dev**: `cd backend && npx prisma db push`.
- **Crear/actualizar usuario admin real**: `node backend/scripts/seedUser.js <email> <password>`.
- **Ejecutar tests automatizados**: `node backend/scripts/testContabilidad.js` (y scripts correspondientes en `backend/scripts/`).

---

## 🔐 6. Reglas Innegociables de Seguridad y Despliegue
1. **Cifrado de datos sensibles**: Todo dato clínico de expedientes se cifra/descifra exclusivamente en backend con AES-256-GCM.
2. **Separación Dev / Producción**: Nunca ejecutar pruebas, scripts de seed o migraciones contra la base de datos de producción de Supabase.
3. **Autenticación real**: Sin bypasses ni usuarios por defecto (`admin/admin`). Tokens JWT de 8h con `JWT_SECRET` criptográfico.
4. **CORS explícito**: Lista blanca estricta (`psicolau.com`, `www.psicolau.com`, `api.psicolau.com` y `FRONTEND_URL` local). Sin `*` en producción.
5. **Protección de Secretos**: `.env` completamente blindado en `.gitignore`. Nunca registrar credenciales ni datos clínicos en Git.
6. **No push prematuro**: No ejecutar `git push` a `origin/main` sin verificación y aprobación explícita del usuario tras probar en local.

---

## ✅ 7. Verificación Obligatoria al Terminar Cualquier Tarea

Ningún cambio o tarea se da por terminado sin comprobar:
1. **No-regresión en la suite clínica**: La agenda semanal, login, creación de citas, visualización de expedientes y cálculo de pagos continúan funcionando al 100%.
2. **Cumplimiento de la Constitución**: Verificar cifrado, autenticación JWT, CORS y aislamiento dev/prod.
3. **Verificación de la Spec**: Cada Requisito Funcional (`RF-x`) de la spec activa cuenta con su prueba (script o verificación guiada) superada.
4. **Validación de tests backend**: Ejecutar los scripts de verificación en `backend/scripts/` relevantes.
5. **Revisión de no-exposición de secretos**: Ningún secreto, token o variable sensible queda expuesta en código ni commits.
6. **Limpieza obligatoria en scripts de test**: Todo script de prueba o verificación en `backend/scripts/` que inserte registros temporales en base de datos debe incluir un bloque `finally` con limpieza automática (`delete`) o ejecutarse en transacción revertida para evitar registros huérfanos o duplicados en el entorno de desarrollo que confundan el directorio clínico.