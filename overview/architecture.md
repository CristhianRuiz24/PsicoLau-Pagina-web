# Arquitectura Viva - PsicoLau

\\\mermaid
graph TD
    subgraph Frontend_Publico ["Sitio Web Público (HTML5 + CSS3 + JS Vanilla)"]
        A[index.html / sobre-mi.html / areas.html / experiencia.html]
        B[contacto.html Formulario Web]
        C[terapias-grupales.html / testimonios.html]
    end

    subgraph Suite_Clinica ["Panel Administrativo (/panel)"]
        D[panel/index.html + js/login.js - Login JWT Desacoplado]
        E[panel/agenda.html - Easy Table Semanal]
        F[panel/js/agenda/ - ESM Entry Point + 9 Submódulos]
        F2[panel/js/expedientes/ - Dynamic import lazy-load + 6 Submódulos]
        F3[panel/partials/modals/ - 8 Modales HTML Lazy-Loaded vía fetch]
        F4[panel/css/components/ - 15 Componentes CSS vía @import]
        F5[panel/js/pagos/ - ESM Entry Point + 8 Submódulos de contabilidad y exportación]
        F6[Global Scripts: config.js, whatsapp.js, audio.js, app.js]
    end

    subgraph Backend_API ["Backend API (Node.js + Express)"]
        G[index.js / Rutas API + Rate Limiting Diferenciado]
        H[authMiddleware - JWT 8h]
        I[crypto.js - AES-256-GCM Cifrado Clínico]
        J[Controllers: agenda, pacientes, expedientes, pagos, auth, contacto]
        O[agendaHelpers.js - Normalización, Series & P2002 Safe]
        P[logger.js - Sanitización y Seguridad en Producción]
        K[emailService.js - Resend API / HTTPS]
    end

    subgraph Base_de_Datos ["PostgreSQL (Supabase)"]
        L[(DB Desarrollo)]
        M[(DB Producción)]
        N[Modelos Prisma: Usuario, Paciente, Cita, Expediente, LogNotificacion]
    end

    A -.->|Navegación / Lectura| Frontend_Publico
    B -->|POST /api/contacto| J
    D -->|POST /api/auth/login| H
    E -->|Carga ESM| F
    E -->|Import dinámico on-demand| F2
    F -->|Inyecta bajo demanda| F3
    F2 -->|Inyecta bajo demanda| F3
    E -->|Aplica estilos modulares| F4
    F -->|REST API + JWT Auth| G
    F2 -->|REST API + JWT Auth| G
    G --> H
    H --> J
    J --> I
    I <-->|Cifra / Descifra en memoria| J
    J <-->|Prisma ORM| N
    N -->|Dev| L
    N -->|Prod| M
    J -->|Notificaciones por Correo| K
\\\

## Decisiones Técnicas Relevantes

- **Cifrado Simétrico AES-256-GCM en Aplicación (2026-08-26)**: Los 8 campos clínicos de notas de sesión se cifran en memoria con clave de 256 bits y tag de autenticación. Cero texto médico en claro en la DB.
- **Separación de Proyectos Supabase Dev / Prod (2026-08-25)**: Aislamiento total de base de datos para no comprometer citas reales durante pruebas locales.
- **Modularización del Panel en 7 Archivos JS (2026-08-25)**: Descomposición de 1,600+ líneas monolíticas en módulos especializados con responsabilidades desacopladas.
- **Autenticación Estricta JWT de 8 Horas (2026-08-28)**: Alineación de sesión de login con la jornada laboral clínica y supresión de accesos de prueba.
- **Resend API por HTTPS (2026-08-28)**: Envío de correos por puerto 443 para evitar bloqueos SMTP tradicionales en Render.
- **Gestión Atómica de Citas Recurrentes en Serie \serieId\ (2026-09-01)**: Vinculación de citas en serie mediante \serieId\ UUID único, con modales de alcance (\SOLO_ESTA\ vs \ESTA_Y_SIGUIENTES\), protección de sesiones \REALIZADA\ y preservación de pagos previos.
- **Visibilidad y Control de Asistencia de Citas Canceladas (2026-09-01)**: Permanencia visual atenuada en matriz semanal para evitar sobreagendamiento involuntario, toggles rápidos en 1 clic y cómputo contable exacto.
- **Gestión de Costos en Terapia Grupal, Evaluaciones y Desglose Contable por Tarifas (2026-09-02)**: Cuatro pestañas de registro (\Individual\, \Evaluación\, \Grupal\, \Bloqueo\), calculadora reactiva para grupales (\cuota × participantes\), persistencia y edición de montos no-individuales, integración financiera total en KPIs contables y motor de agrupación por tarifas para la contadora con exportación a WhatsApp y CSV Excel (\Tipo_Servicio\).
- **Hardening de Seguridad, Logging y Modularización Post-Auditoría (2026-09-02)**:
  - **Modularización de Agenda**: Extracción de helpers puros a \ ackend/src/utils/agendaHelpers.js\ (normalización de prefijos clínicos, validación de unicidad de emails P2002, consulta de series y cálculo de tarifas).
  - **Logging Seguro en Producción**: Implementación de \ ackend/src/utils/logger.js\ que en producción oculta stack traces, rutas internas y queries de base de datos para prevenir fugas de información.
  - **Rate Limiting Diferenciado en Agenda**: Aplicación de \ gendaMutationLimiter\ (45 req/min) en rutas de escritura (\POST\, \PUT\, \DELETE\, \PATCH\) preservando 120 req/min para lecturas (\GET\).
  - **Hardening CSP en Cloudflare**: Inclusión de \object-src 'none';\ y \ ase-uri 'self';\ en \_headers\.
- **Cambio Seguro de Contraseña in-app con Rate Limiting y Renovación JWT (2026-09-02, Spec 005)**: Endpoint \PUT /api/auth/cambiar-password\ protegido con \ erificarToken\, \cambiarPasswordLimiter\ (5 req / 15 min), validación Zod y hash \ crypt\ (costo 10). Renovación transparente de JWT en \localStorage\ manteniendo la sesión activa sin forzar relogin y modal con alternancia de visibilidad 👁️.
- **Optimización Web Integral y Core Web Vitals (2026-09-02, Spec 006)**: Activos WebP de alto rendimiento (\ ssets/*.webp\), fachadas Click-to-Play con \youtube-nocookie.com\ para testimonios (ahorro de 2 MB y cookies), dimensionado geométrico de imágenes para erradicar CLS y autorización de Cloudflare Web Analytics en CSP de \_headers\.
- **Hardening de Seguridad Web y Segmentación de Cabeceras HTTP (2026-09-05, Spec 008)**: Segmentación perimetral en \_headers\ entre el sitio público (\/*\) con CSP estricto (eliminación total de \'unsafe-inline'\ en \script-src\), \Cross-Origin-Opener-Policy: same-origin-allow-popups\, \Cross-Origin-Resource-Policy: same-origin\ y supresión de dependencias de CDN no utilizadas, mientras que la suite clínica (\/panel/*\) conserva una política dedicada e independiente que preserva la funcionalidad de la agenda interactiva y Web Audio API sin degradar la seguridad pública. Desacoplamiento total de eventos inline hacia \js/main.js\ y script automatizado \ erifySecurityHeaders.js\ para certificar el Grado A+ en Mozilla Observatory.
- **Segmentación Estricta de CSP y Desacoplamiento de Login en Suite Clínica (2026-09-05)**: Corrección de la herencia acumulativa de Cloudflare Pages mediante la asignación de la CSP estricta exclusivamente a rutas públicas (\/\, \/sobre-mi*\, etc.) y una CSP independiente para \/panel\ y \/panel/*\ (permitiendo Font Awesome y scripts interactivos). Desacoplamiento de la lógica de autenticación a \panel/js/login.js\ como script propio \'self'\, erradicando por completo los scripts inline del formulario de login.
- **Modularización Profunda del Panel Clínico - Spec 010 (2026-09-11, Implementado)**: Descomposición total de los monolitos de frontend clínico:
  - **Modularización JS ESM**: Descomposición de `agenda.js` (66 KB / 1800+ líneas) en 10 submódulos organizados por carpetas funcionales (`actions/`, `form/`, `render/`, `ui/`, `utils/`), orquestados desde `panel/js/agenda/index.js` (`type="module"`).
  - **Lazy-Loading de Expedientes Clínicos**: Descomposición de `expedientes.js` (64 KB / 1300+ líneas) en 7 submódulos bajo `panel/js/expedientes/`, cargados dinámicamente (`import()`) exclusivamente cuando el usuario abre el directorio o expediente clínico, reduciendo el footprint inicial del panel en más de 60 KB.
  - **Partials HTML de Modales (DOM bajo demanda)**: Extracción de 8 modales clínicos a `panel/partials/modals/` con inyección lazy-load segura vía helper reutilizable `asegurarModal` (`fetch`), reduciendo `agenda.html` de 972 líneas a 303 líneas (~69% de reducción de peso DOM).
  - **Componentes CSS Desacoplados**: Descomposición de `panel.css` (49 KB) en 15 componentes CSS temáticos en `panel/css/components/`, importados limpiamente mediante `@import` en `panel/css/panel.css` y manteniendo compatibilidad total mediante el alias `panel/panel.css`.
  - **Cero Regresiones**: 100% de la suite de pruebas automatizadas y scripts de verificación superados sin alterar APIs, tokens, contratos ni identidad de marca. API `window` reducida a 11 hooks legacy mínimos. Sin bundler, sin TypeScript - vanilla JS ES2020 modules.
- **Migración a bcryptjs y Eliminación de Dependencias C++ (2026-09-11, Spec 011)**: Adopción de `bcryptjs` en lugar del paquete nativo C++ `bcrypt`, erradicando por completo vulnerabilidades de `tar` y `@mapbox/node-pre-gyp` manteniendo compatibilidad 100% con los hashes de contraseñas existentes.
- **Upgrade a Express 5.x y Manejo Centralizado de Errores Asíncronos (2026-09-11, Spec 012)**: Actualización a `express@5.2.1` con 0 vulnerabilidades en `npm audit`. Aprovechamiento del soporte nativo de excepciones asíncronas en el error handler global de Express 5, formateo automático de `ZodError` y `P2002`, y simplificación de los controladores eliminando bloques `try/catch` redundantes.
- **Modularización ESM de Pagos y Unificación Contable (2026-09-11, Spec 013)**: Descomposición de `panel/js/pagos.js` en 8 submódulos ESM bajo `panel/js/pagos/` (`utils/`, `render/`, `export/`, `actions/`, `index.js`). Centralización de la matemática contable en `utils/contabilidad.js` eliminando la duplicación en reportes, WhatsApp y CSV con codificación UTF-8 BOM.
- **Test Runner Unificado Nativo (2026-09-11, Spec 014)**: Consolidación de los 21 scripts de pruebas e integración en `backend/scripts/` bajo `npm test` con `node scripts/runTests.js`. Orquestador con verificación de salud en `localhost:3001` y arranque/cierre automático de servidor efímero. Estandarización en `node:test` y `node:assert` ejecutados secuencialmente de manera determinista (`--test-concurrency=1`) y con limpieza estricta en base de datos.
- **Aislamiento Seguro de Notificaciones por Correo (2026-09-11, Spec 016)**: Implementación de 3 capas de protección en `emailService.js` (redirección a buzón seguro, validación de dominio `@psicolau.com` y whitelist de pruebas) para evitar fugas de correos a pacientes reales durante el desarrollo.
- **Cifrado PII Clínico y Búsqueda Ciega con HMAC-SHA256 (2026-09-11, Spec 017)**: Ampliación del cifrado AES-256-GCM a la tabla `Paciente` (nombre, email, teléfono, zoom). Implementación de `emailHash` criptográfico determinista (HMAC-SHA256) para permitir búsquedas y unificación de expedientes por correo electrónico en tiempo constante $O(1)$ sin comprometer el texto plano del correo en la base de datos. Orquestación transparente de descifrado en memoria desde los controladores hacia el Frontend Panel.
- **Modularización del Formulario de Citas y Blindaje de Acciones de Agenda (2026-09-11, Spec 018)**: Desacoplamiento del listener procedural de 173 líneas de `app.js` al módulo ESM `panel/js/agenda/form/submitHandler.js` (validación, prefijos clínicos, series y actualización reactiva). Blindaje de la eliminación de citas con modal visual unificado institucional (`#modalAlcanceSerie`) erradicando la dependencia de `window.confirm`, detención explícita de propagación de eventos (`event.stopPropagation`) y delegación global para `#btnEliminarModal`. Sincronización de carga bajo demanda (`asegurarModal`) para el modal de seguridad y cambio de contraseña erradicando salidas silenciosas por colisiones con scripts legacy.
