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

- **Iniciar Todo (Frontend + Backend)**: Doble clic en `scripts/iniciar.bat` en Windows, o ejecutar `node scripts/dev.js` (levanta ambos servidores en puertos 5500 y 3001 y abre el panel en el navegador).
- **Frontend local**: Servidor estático en la raíz (ej. `npm start`, Live Server en `http://127.0.0.1:5500` o `npx serve -l 5500`).
- **Backend local**: `cd backend && npm install && npm run dev` (o `npm start`, puerto `3001`).
- **Generar cliente Prisma**: `cd backend && npx prisma generate`.
- **Sincronizar esquema DB Dev**: `cd backend && npx prisma db push`.
- **Crear/actualizar usuario admin real**: `node backend/scripts/seedUser.js <email> <password>`.
- **Ejecutar tests automatizados**: `cd backend && npm test` (o `node scripts/runTests.js` que orquesta la suite con `--test-concurrency=1`).

---

## 🔐 6. Reglas Innegociables de Seguridad y Despliegue
1. **Cifrado de datos sensibles**: Todo dato clínico de expedientes se cifra/descifra exclusivamente en backend con AES-256-GCM.
2. **Separación Dev / Producción**: Nunca ejecutar pruebas, scripts de seed o migraciones contra la base de datos de producción de Supabase.
3. **Autenticación real**: Sin bypasses ni usuarios por defecto (`admin/admin`). Tokens JWT de 8h con `JWT_SECRET` criptográfico.
4. **CORS explícito**: Lista blanca estricta (`psicolau.com`, `www.psicolau.com`, `api.psicolau.com` y `FRONTEND_URL` local). Sin `*` en producción.
5. **Protección de Secretos**: `.env` completamente blindado en `.gitignore`. Nunca registrar credenciales ni datos clínicos en Git.
6. **No push prematuro**: No ejecutar `git push` a `origin/main` sin verificación y aprobación explícita del usuario tras probar en local.
7. **Aislamiento explícito de CSP en Cloudflare Pages**: En `_headers`, nunca aplicar directivas restrictivas de `Content-Security-Policy` bajo el comodín global `/*` si existen subdirectorios con requerimientos interactivos (como `/panel`). Dado que los navegadores aplican la intersección más restrictiva de cabeceras, la CSP pública y la CSP del panel deben definirse explícitamente en bloques de ruta separados para evitar romper la funcionalidad clínica.
8. **Validación Semántica Estricta (Defensa en Profundidad)**: Todo campo de entrada público o administrativo debe contar con validación por lista blanca (ej. regex Unicode para nombres, validación estricta de dominios).
9. **Descifrado Transparente y Búsqueda Ciega**: El backend siempre se encarga de descifrar la PII antes de enviarla al cliente autorizado. Las búsquedas en base de datos sobre PII cifrada deben utilizar índices ciegos (Blind Indexing) como `emailHash` vía HMAC-SHA256.
10. **Carga Dinámica Asíncrona Obligatoria en Modales Desacoplados**: Cuando se extraigan modales HTML a partials independientes (lazy loading vía fetch), toda función global, helper o manejador de eventos que interactúe con el modal debe asegurar su existencia en el DOM mediante el helper asíncrono (`await asegurarModal(...)`) y jamás asumir la presencia estática del elemento en el HTML base. Asimismo, queda prohibido duplicar funciones de apertura o gestión de modales en scripts auxiliares (ej. `app.js`) que sobreescriban módulos ESM con salidas sincrónicas prematuras (`if (!modal) return;`).
11. **Protocolo Seguro de Migración en Base de Datos de Producción (Zero Data Loss)**: Toda modificación estructural de esquema (DDL) o migración de datos en la base de datos de producción de Supabase debe seguir obligatoriamente el protocolo de 4 fases antes del despliegue de código:
    1. *Respaldo preventivo*: Exportación física de seguridad (CSV o SQL dump) de todas las tablas descargada en local antes de iniciar.
    2. *DDL pre-despliegue en SQL Editor*: Aplicación manual de cambios estructurales no destructivos (ej. añadir columnas con soporte `NULL` o eliminar constraints antiguos) antes de compilar o arrancar el backend en producción.
    3. *Simulación `--dry-run`*: Todo script de migración de datos debe contar con un modo `--dry-run` de solo lectura que reporte con precisión los registros afectados antes de mutar la base de datos.
    4. *Transacción Atómica (`prisma.$transaction`)*: Las mutaciones deben ejecutarse en un bloque transaccional ACID con verificación post-migración que certifique la integridad de los datos.
12. **Validación Semántica Obligatoria de Consentimiento Informado en Formularios Web**: Todo formulario que capture datos de contacto, solicitud de cita o consulta psicológica debe validar la aceptación expresa del Aviso de Privacidad (`privacyCheck: true`) con defensa en profundidad (en el DOM del cliente mediante atributo `required` y en el esquema del servidor con `z.literal(true)`), rechazando con HTTP 400 cualquier solicitud sin consentimiento antes de persistir o remitir información, garantizando certeza y trazabilidad jurídica bajo la LFPDPPP.


---

## ✅ 7. Verificación Obligatoria al Terminar Cualquier Tarea

Ningún cambio o tarea se da por terminado sin comprobar:
1. **No-regresión en la suite clínica**: La agenda semanal, login, creación de citas, visualización de expedientes y cálculo de pagos continúan funcionando al 100%.
2. **Cumplimiento de la Constitución**: Verificar cifrado, autenticación JWT, CORS y aislamiento dev/prod.
3. **Verificación de la Spec**: Cada Requisito Funcional (`RF-x`) de la spec activa cuenta con su prueba (script o verificación guiada) superada.
4. **Validación de tests backend**: Ejecutar la suite unificada con `npm test` dentro de `backend/`.
5. **Revisión de no-exposición de secretos**: Ningún secreto, token o variable sensible queda expuesta en código ni commits.
6. **Limpieza obligatoria en scripts de test**: Todo script de prueba o verificación en `backend/scripts/` que inserte registros temporales en base de datos debe incluir un bloque `finally` con limpieza automática (`delete`) o ejecutarse en transacción revertida para evitar registros huérfanos o duplicados en el entorno de desarrollo que confundan el directorio clínico.
7. **Ejecución secuencial determinista (`--test-concurrency=1`)**: Al ejecutar pruebas automatizadas contra la base de datos de desarrollo, debe mantenerse la ejecución secuencial (`--test-concurrency=1` en `runTests.js`) para prevenir condiciones de carrera, falsos positivos por colisiones de datos y bloqueos en contadores globales.
8. **Pruebas Adversarias Obligatorias**: La suite de pruebas de integración debe incluir pruebas adversarias negativas que simulen ataques (XSS, inyección CSV, payloads DAST) y aseguren que el servidor los bloquea con HTTP 400 sin alterar la base de datos.