# Plan Técnico 009 — Plantilla Base y Clon Demo Comercial (PsicoTemplate / PsicoDemo)

## 1. Resumen de la Solución Técnica
Creación de una suite desacoplada e independiente en `c:\Users\crist\Documents\Proyectos\Web PsicoDemo` basada en la arquitectura probada de PsicoLau, pero completamente anonimizada con identidad ficticia profesional ("Dra. Sofía Ramos"), datos clínicos y citas simuladas, botón de acceso demo en 1 clic y contenedor Docker listo para Coolify / VPS.

---

## 2. Alineación con la Constitución

- **Principio 1 (Cifrado de datos sensibles)**: Los expedientes clínicos de la demo se cifran con AES-256-GCM utilizando una clave `ENCRYPTION_KEY` independiente y única para la demo.
- **Principio 2 (Separación Dev / Producción)**: Aislamiento absoluto. La demo opera en su propio esquema/base de datos y jamás tiene acceso ni referencias a la base de datos de Laura en Supabase.
- **Principio 3 (Frontend simple sin dependencias)**: El frontend se mantiene 100% Vanilla HTML5/CSS3/JS, listo para Cloudflare Pages sin build steps.
- **Principio 4 (Autenticación real)**: La demo utiliza JWT real y contraseñas hasheadas con bcrypt. El botón "One-Click Demo" automatiza el envío del formulario sin vulnerar el middleware de autenticación.
- **Principio 5 (CORS y superficie de ataque)**: CORS explícito configurado en las variables de entorno de la demo.
- **Principio 6 (No romper lo que ya funciona)**: Al construirse en un directorio externo (`Web PsicoDemo`), el sistema de producción de Laura permanece 100% intocado e inmune.

---

## 3. Decisiones Técnicas y Alternativas Descartadas

### D1: Repositorio y Directorio Independiente vs Monorepo en el Mismo Git
- **Decisión**: Crear una carpeta y repositorio independiente (`c:\Users\crist\Documents\Proyectos\Web PsicoDemo`).
- **Alternativa descartada**: Manejar la demo en una rama o subcarpeta dentro de `Web PsicoLau`.
- **Motivo**: Elimina el riesgo de commits accidentales que mezclen datos de clientes, facilita conectar un nuevo repositorio de GitHub a Coolify y Cloudflare Pages, y permite vender la plantilla a terceros de forma limpia.

### D2: Motor de Base de Datos (PostgreSQL vs SQLite)
- **Decisión**: PostgreSQL mediante Prisma ORM (idéntico a la arquitectura actual), soportado localmente o mediante contenedor Docker en Coolify.
- **Alternativa descartada**: Cambiar el backend a SQLite.
- **Motivo**: Mantener PostgreSQL asegura paridad del 100% con las consultas, transacciones, extensiones y tipos de datos de producción, sin necesidad de adaptar código ni scripts.

### D3: Mecanismo de Acceso Demo en el Panel
- **Decisión**: Botón `[ 🚀 Entrar a Modo Demo ]` en la pantalla de login que autocompleta los campos `demo@psicoclinica.com` / `Demo2026!` y ejecuta la llamada normal a `POST /api/auth/login`.
- **Alternativa descartada**: Crear una puerta trasera (bypass) en el backend que entregue un token sin validar credenciales.
- **Motivo**: Demuestra al prospecto la seguridad real del sistema, respeta el Principio 4 de la Constitución y ejercita el flujo idéntico de producción.

---

## 4. Módulos y Estructura del Nuevo Proyecto (`Web PsicoDemo`)

```text
Web PsicoDemo/
├── assets/                    # Identidad visual (foto Dra. Sofía Ramos, logo demo)
├── css/                       # Sistema de diseño calibrado (style.css con CSS crítico)
├── js/                        # main.js (lógica frontend público y fallback)
├── panel/                     # Suite clínica privada
│   ├── index.html             # Login con botón "Entrar a Modo Demo"
│   ├── agenda.html            # Agenda semanal con banner sutil de modo demo
│   ├── js/
│   │   ├── config.js          # API URL configurable (local vs producción demo)
│   │   ├── login.js           # Desacoplado con soporte para auto-fill demo
│   │   ├── agenda.js          # Matriz semanal + calculadora grupal + evaluaciones
│   │   ├── expedientes.js     # Historial clínico cifrado
│   │   ├── pagos.js           # Reporte mensual y desglose contable
│   │   └── whatsapp.js        # Formatos wa.me con prefijos y teléfono seguro (+52 55 0000 0000)
│   └── panel.css
├── backend/                   # API Node.js / Express
│   ├── prisma/                # schema.prisma (PostgreSQL)
│   ├── src/                   # Controladores, rutas y middlewares
│   ├── scripts/
│   │   ├── seedDemo.js        # Generador de datos clínicos y citas realistas
│   │   └── resetDemo.js       # Limpieza y reinicio a valores de fábrica
│   ├── Dockerfile             # Listo para despliegue en Coolify / VPS
│   ├── docker-compose.yml     # Orquestación con PostgreSQL local/servidor
│   └── package.json           # Scripts: dev, start, demo:seed, demo:reset
├── _headers                   # Cabeceras de seguridad Cloudflare Pages (Grado A+)
└── README.md                  # Guía de despliegue y uso comercial
```

---

## 5. Dataset Semilla Ficticio Realista (`seedDemo.js`)

1. **Usuario Demo**:
   - Email: `demo@psicoclinica.com`
   - Password: `Demo2026!` (hash bcrypt costo 10)
   - Nombre: `Dra. Sofía Ramos`
2. **Pacientes de Demostración (6 registros)**:
   - Paciente 1: Carlos Mendoza Ruiz (Tarifa: $1,000 MXN, Zoom demo, notas clínicas de ansiedad y reestructuración cognitiva).
   - Paciente 2: Mariana Torres Vega (Tarifa: $1,200 MXN, Zoom demo, notas de duelo y resiliencia).
   - Paciente 3: Roberto Silva Alarcón (Evaluación Neuropsicológica: $4,000 MXN, notas de evaluación clínica).
   - Paciente 4: Valeria Gómez Estrada (Tarifa: $1,000 MXN, seguimiento de autoestima).
   - Paciente 5: Familia Morales (Terapia familiar: $1,500 MXN).
   - Paciente 6: Grupo de Manejo del Estrés (Participantes de terapia grupal).
3. **Citas Semanales (15 citas distribuidas en la semana en curso)**:
   - Citas individuales confirmadas y pagadas.
   - 1 Evaluación clínica de $4,000 MXN con badge índigo.
   - 1 Sesión grupal de $1,800 MXN (cuota $300 × 6 participantes) calculada en tiempo real.
   - Citas pendientes de cobro para demostrar el filtro "Por Pagar" y los KPIs contables.
