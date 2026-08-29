# PSICOLAU — Psicología y Resiliencia

Sitio web profesional y **Suite de Gestión Clínica** para **Ana Laura Gómez Díaz**, psicóloga clínica especializada en neurodivergencias en adultos (TEA/TDAH), evaluación neuropsicológica, trauma y relaciones interpersonales.

🌐 **Dominio oficial**: [psicolau.com](https://psicolau.com)  
🔒 **API Backend**: [api.psicolau.com](https://api.psicolau.com)

---

## 🏛️ Arquitectura del Sistema

El proyecto se compone de tres capas desacopladas y de alta seguridad:

```
├── Sitio Web Público (Frontend Multipágina) ──► Cloudflare Pages (psicolau.com)
├── Panel de Administración & Agenda Clínica ──► /panel (Autenticación JWT + Web Audio API)
└── Backend API & Base de Datos ──────────────► Render (Node.js/Express) + Supabase (PostgreSQL)
```

---

## 🌐 1. Sitio Web Público (Multipágina)

Sitio rápido, accesible (WCAG 2.1) y optimizado para SEO:

* **Inicio (`index.html`)**: Presentación profesional, áreas destacadas y testimonios.
* **Sobre mí (`sobre-mi.html`)**: Trayectoria clínica, enfoque terapéutico y formación académica.
* **Áreas de atención (`areas-de-atencion.html`)**: 5 especialidades clínicas detalladas.
* **Experiencia (`experiencia.html`)**: Medios de comunicación, ponencias y artículos de divulgación.
* **Libros (`libros.html`)**: Publicaciones y bibliografía recomendada.
* **Preguntas Frecuentes (`preguntas-frecuentes.html`)**: Acordeón interactivo accesible (ARIA).
* **Terapias Grupales (`terapias-grupales.html`)**: Información para módulos grupales (Autismo en adultos).
* **Testimonios (`testimonios.html`)**: Reseñas de pacientes en formato de texto, video y audio.
* **Contacto (`contacto.html`)**: Formulario con validación y banner de emergencia médica (Línea de la Vida).
* **Aviso de Privacidad (`privacidad.html`)**: Política legal de protección de datos clínicos y personales.

---

## 💼 2. Panel Administrativo & Suite Clínica (`/panel`)

Espacio privado para la psicóloga con autenticación segura:

* **Matriz Semanal Continua (Easy Table)**: Visualización horaria de 07:00 a.m. a 12:00 a.m., con selector de 5 o 7 días y navegación fluida entre semanas.
* **Citas Recurrentes**: Programación automatizada en lote de 2 a 24 sesiones semanales o quincenales.
* **Expedientes Clínicos Cifrados (AES-256-GCM)**: Historial clínico confidencial por paciente con 8 campos clínicos cifrados a nivel de aplicación, búsqueda en memoria, visor individual, descarga en `.txt` e impresión formal.
* **Reporte Contable Mensual**: Cálculo instantáneo de ingresos cobrados, sesiones realizadas, sesiones de cortesía ($0) y saldo pendiente por cobrar, con exportación estructurada a WhatsApp, descarga en Excel (CSV UTF-8 con BOM) e impresión en PDF.
* **Auditoría de Pagos**: Panel de control de cuentas por cobrar con recordatorio cordial por WhatsApp.
* **Integración WhatsApp & Zoom**: Mensajes prediseñados con detección automática de prefijos internacionales (+52, +1, +34) y autocompletado de enlaces de Zoom por paciente.
* **Buscador Global en Tiempo Real**: Búsqueda instantánea en citas pasadas, presentes y futuras, y acceso directo a expedientes clínicos.
* **Personalización Visual**: Paleta de 24 tonos clínicos con cálculo de contraste YIQ y selector libre de color hexadecimal con gotero.

---

## ⚙️ 3. Backend API (`/backend`)

Servicio robusto en Node.js y Express estructurado bajo arquitectura limpia:

* **Base de Datos**: PostgreSQL alojado en Supabase gestionado con **Prisma ORM**.
* **Seguridad & Autenticación**:
  - Tokens JWT firmados con clave criptográfica de 256 bits (vigencia de 8 horas).
  - Contraseñas protegidas mediante hashing con **bcrypt**.
  - **Criptografía AES-256-GCM**: Cifrado simétrico de datos clínicos antes de tocar la base de datos.
  - **Rate Limiting**: Limitación estricta de peticiones en login y formularios públicos contra ataques de fuerza bruta y DoS.
  - **CORS Estricto & Helmet**: Lista blanca explícita de dominios autorizados y cabeceras HTTP seguras.
* **Servicio de Correo**: Integración transaccional con la **API REST oficial de Resend** (HTTPS / Puerto 443) con remitente verificado `@psicolau.com` y `replyTo` directo al paciente.

---

## 💻 Pila Tecnológica (Tech Stack)

| Capa | Tecnologías |
|---|---|
| **Frontend** | HTML5 Semántico, CSS3 Vanilla (Tokens & CSS Variables), JavaScript Vanilla (ES6+) |
| **Backend** | Node.js, Express, Prisma ORM, Zod, Helmet, Express Rate Limit, JWT, Bcrypt |
| **Base de Datos** | PostgreSQL (Supabase con Connection Pooler) |
| **Correo Transaccional** | Resend REST API |
| **Despliegue** | Cloudflare Pages (Frontend) + Render Web Service (Backend API) |

---

## 🛠️ Instalación y Desarrollo Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/CristhianRuiz24/PsicoLau-Pagina-web.git
cd PsicoLau-Pagina-web
```

### 2. Configurar el Backend
```bash
cd backend
npm install
cp .env.example .env
# Configura tus variables de entorno en backend/.env
```

### 3. Sincronizar Base de Datos (Desarrollo)
```bash
npx prisma generate
npx prisma db push
```

### 4. Iniciar Servidores Locales
```bash
# Terminal 1 - Backend API (Puerto 3000)
cd backend
npm start

# Terminal 2 - Frontend (Puerto 5500)
npx serve -p 5500 .
```

* **Frontend Local**: `http://localhost:5500`
* **Panel Administrativo**: `http://localhost:5500/panel/index.html`
* **API Backend**: `http://localhost:3000/api/health`

---

## 🔑 Variables de Entorno (`backend/.env`)

| Variable | Descripción | Ejemplo / Valor |
|---|---|---|
| `NODE_ENV` | Entorno de ejecución (`development` / `production`) | `production` |
| `PORT` | Puerto del servidor API | `3000` o asignado por Render |
| `DATABASE_URL` | Cadena de conexión PostgreSQL (Supabase Pooler) | `postgresql://...` |
| `JWT_SECRET` | Clave secreta para firma de tokens JWT | Cadena segura de 256 bits |
| `ENCRYPTION_KEY` | Clave de 32 bytes en hexadecimal (64 caracteres) para AES-256-GCM | Clave criptográfica hex |
| `FRONTEND_URL` | URL autorizada para CORS | `https://psicolau.com` |
| `RESEND_API_KEY` | API Key para envíos de correo | `re_xxxxxxxxxxxx` |
| `REMITENTE` | Remitente oficial de notificaciones | `PsicoLau <contacto@psicolau.com>` |
| `CORREO_LAURA` | Correo receptor de avisos clínicos | `lince_lg@yahoo.com.mx` |

---

## 📄 Licencia y Derechos

© 2026 **PSICOLAU — Psicología y Resiliencia**. Todos los derechos reservados.  
Diseñado y desarrollado para la Lic. **Ana Laura Gómez Díaz**.
