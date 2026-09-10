# Tareas de Implementación 009 — Plantilla Base y Clon Demo Comercial (PsicoTemplate / PsicoDemo)

> **Regla de ejecución**: Implementar y verificar una sola tarea a la vez antes de avanzar a la siguiente.

---

## 📋 Lista de Tareas

### [x] T1: Inicialización del Directorio Aislado y Copia Base
- **Ubicación objetivo**: `c:\Users\crist\Documents\Proyectos\Web PsicoLau\demo` (aislado mediante `.gitignore` y con su propio `.git`)
- **Acción**:
  - Crear la estructura base en el directorio aislado `demo/`.
  - Copiar los archivos estáticos de frontend, estilos CSS optimizados, módulos del panel y backend Node.js.
  - Excluir explícitamente el historial `.git`, archivos `.env`, credenciales reales de Laura y backups de base de datos.
  - Inicializar un nuevo repositorio Git limpio (`git init -b main`) en `demo/`.
- **Hecho cuando**:
  - El directorio `demo/` existe de forma completamente independiente de `Web PsicoLau` con su propio `.gitignore`, su propio repositorio git y sin ningún archivo `.env` o credencial heredada.

---

### [x] T2: Anonimización y Nueva Identidad Ficticia ("Dra. Sofía Ramos")
- **Archivos**:
  - `demo/index.html` y las 9 páginas públicas secundarias
  - `demo/assets/`
  - `demo/js/main.js`
- **Acción**:
  - Asignar retrato profesional y activos para la "Dra. Sofía Ramos" en `demo/assets/foto-perfil.webp`.
  - Reemplazar sistemáticamente todas las menciones de Laura, PsicoLau, correo personal y teléfono en las 10 páginas públicas y controladores de backend por la identidad de la "Dra. Sofía Ramos — Psicología Clínica".
  - Ajustar datos de contacto de pie de página y formularios hacia valores de prueba seguros (`contacto@psicoclinica.com`, `+52 55 0000 0000`).
- **Hecho cuando**:
  - Las 10 páginas públicas visualizan la identidad de la Dra. Sofía Ramos sin ninguna mención residual a Laura y manteniendo las métricas de rendimiento y accesibilidad (0 resultados de "Laura", "PsicoLau" o "Gómez").

---

### [x] T3: Adaptación del Panel Clínico con Acceso Demo en 1 Clic
- **Archivos**:
  - `demo/panel/index.html`
  - `demo/panel/js/login.js`
  - `demo/panel/agenda.html`
  - `demo/panel/js/whatsapp.js`
  - `demo/panel/js/config.js`
- **Acción**:
  - Añadir botón interactivo `[ 🚀 Probar Demo en 1 Clic ]` en el formulario de login que precarga `demo@psicoclinica.com` / `Demo2026!` y envía el formulario automáticamente.
  - Agregar banner informativo superior en `agenda.html` indicando: *"Entorno Demo Interactivo — Datos clínicos simulados"*.
  - Configurar `whatsapp.js` para firmar automáticamente como "Dra. Sofía Ramos" y usar números seguros.
- **Hecho cuando**:
  - Al pulsar el botón de demo en `panel/index.html`, se accede directamente a la agenda clínica de la Dra. Sofía Ramos sin fricción.

---

### [x] T4: Backend Demo, Dockerfile para Coolify y Scripts de Semilla/Reset
- **Archivos**:
  - `demo/backend/package.json`
  - `demo/backend/scripts/seedDemo.js`
  - `demo/backend/scripts/resetDemo.js`
  - `demo/backend/Dockerfile`
  - `demo/backend/docker-compose.yml`
  - `demo/backend/.env.example`
  - `demo/README.md`
- **Acción**:
  - Crear script `seedDemo.js` que genera el usuario demo, 6 pacientes con expedientes cifrados en AES-256-GCM y 15 citas de la semana actual (individuales, evaluaciones de $4,000 y grupales).
  - Crear script `resetDemo.js` ejecutable mediante `npm run demo:reset` para restaurar la base de datos a sus valores iniciales.
  - Crear `Dockerfile` optimizado y `docker-compose.yml` para desplegar el backend y PostgreSQL en Coolify / VPS en 1 clic.
  - Crear `README.md` con instrucciones comerciales y de despliegue.
- **Hecho cuando**:
  - Los scripts y archivos de contenedor están creados y versionados en el repositorio independiente de la demo.

---

### [x] T5: Verificación Integral de la Demo y Ensayo Comercial
- **Archivos**: Todos los componentes de `demo/` y repositorio raíz
- **Acción**:
  - Verificar aislamiento estricto de repositorios (`git -C demo status` limpio con 3 commits de producto; `git status` en `Web PsicoLau` sin archivos huérfanos).
  - Validar anonimización de datos (0 ocurrencias de "Laura", "PsicoLau" o "Gómez" en la demo).
  - Verificar que el script `verifySecurityHeaders.js` en el proyecto principal continúe pasando al 100% (22/22 checks OK).
  - Validar botones y banners en `demo/panel/index.html` y `demo/panel/agenda.html`.
- **Hecho cuando**:
  - Todo el producto demo está empaquetado, versionado y listo para ser desplegado en Coolify/Cloudflare o presentado en vivo a prospectos, con cero regresiones en la web de Laura.
