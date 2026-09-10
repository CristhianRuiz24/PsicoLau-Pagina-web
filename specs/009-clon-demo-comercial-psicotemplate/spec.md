# Spec 009 — Plantilla Base y Clon Demo Comercial (PsicoTemplate / PsicoDemo)

## 1. Contexto y Objetivo
A partir del éxito operativo, estabilidad clínica y optimización de rendimiento alcanzados en la plataforma de PsicoLau, surge la oportunidad de negocio de escalar un servicio boutique de desarrollo de páginas web con panel administrativo y agenda de citas para psicólogos independientes.

Para salir a captar clientes y cerrar ventas sin comprometer la privacidad médica de Laura ni alterar su sistema de producción, se requiere construir una **solución clon/plantilla desacoplada ("PsicoTemplate / PsicoDemo")** alojada en un repositorio/directorio independiente (`Web PsicoDemo`).

Esta versión servirá como:
1. **Herramienta de Demostración Comercial en Vivo**: Capaz de correr localmente o desplegarse en una URL pública compartible con prospectos (Cloudflare Pages + VPS/Coolify).
2. **Entorno de Demostración Interactivo y Seguro**: Con identidad ficticia profesional ("Dra. Sofía Ramos — Psicología y Bienestar Emocional"), datos clínicos y citas simuladas realistas (individuales, evaluaciones, calculadora grupal), botón de acceso demo en 1 clic y capacidad de reinicio/restauración de datos de fábrica.
3. **Plantilla Base (White-label Starter)**: Lista para ser personalizada estéticamente (logo, colores, textos) para cada nuevo psicólogo que contrate el servicio.

---

## 2. Usuarios y Actores
- **Desarrollador / Consultor de Software (Tú)**: Presenta la solución en videollamadas comerciales, comparte enlaces de prueba con psicólogos prospectos y ejecuta restauraciones de datos demo.
- **Psicólogo Prospecto (Cliente Potencial)**: Visita la web pública demostrativa, ingresa al panel mediante credenciales demo, prueba la agenda semanal, visualiza el expediente clínico y comprueba la agilidad del sistema.
- **Ana Laura Gómez Díaz (PsicoLau)**: Cliente real en producción cuya base de datos, credenciales, dominio y código permanecen 100% aislados e inalterados.

---

## 3. Historias de Usuario
- **H1**: Como desarrollador en una videollamada de ventas, quiero proyectar una plataforma clínica idéntica a la de producción pero con datos ficticios para que el prospecto aprecie el valor real sin exponer el secreto médico de pacientes reales.
- **H2**: Como psicólogo prospecto que recibe un enlace demo, quiero acceder al panel clínico con un solo clic (o credenciales sugeridas) sin tener que registrarme ni crear contraseñas.
- **H3**: Como psicólogo prospecto, quiero interactuar con la agenda (crear citas, cambiar estados de pago, abrir la calculadora grupal) y ver que los números y reportes se actualizan al instante.
- **H4**: Como desarrollador, quiero contar con un mecanismo de reinicio automático o manual de datos para devolver el entorno demo a su estado inicial impecable tras las pruebas de un prospecto.

---

## 4. Requisitos Funcionales (Notación EARS)

### Aislamiento de Proyecto y Desacoplamiento
- **RF-1 (Ubicuo)**: EL SISTEMA se estructurará en un directorio y repositorio git independiente (`Web PsicoDemo`), sin ninguna vinculación a las variables de entorno, llaves de cifrado o bases de datos de `Web PsicoLau`.
- **RF-2 (Ubicuo)**: EL SISTEMA mantendrá la arquitectura desacoplada existente: Frontend estático compatible con Cloudflare Pages y Backend Node.js/Express con Prisma ORM preparado para ejecutarse en local o en VPS/Coolify.

### Identidad Ficticia y Personalización Demostrativa
- **RF-3 (Ubicuo)**: EL SISTEMA sustituirá toda referencia personal, fotográfica y de marca de Laura por una identidad ficticia profesional y coherente ("Dra. Sofía Ramos — Psicología y Bienestar Emocional").
- **RF-4 (Ubicuo)**: EL SISTEMA preservará la estructura visual multipágina del frontend público (`index`, `sobre-mi`, `areas-de-atencion`, `terapias-grupales`, `testimonios`, `contacto`, `privacidad`), adaptando los textos para ejemplificar servicios de psicología clínica general.

### Acceso al Panel Demo ("One-Click / Pre-filled Login")
- **RF-5 (Evento)**: CUANDO un usuario ingrese a la pantalla de acceso del panel (`/panel` o `/panel/index.html`), EL SISTEMA mostrará un botón de acceso directo `[ 🚀 Probar Demo ]` o campos pre-llenados con las credenciales demo (`demo@psicoclinica.com` / `Demo2026!`).
- **RF-6 (Evento)**: CUANDO el usuario pulse `[ 🚀 Probar Demo ]` o envíe las credenciales sugeridas, EL SISTEMA autenticará la sesión y emitirá un token JWT con permisos completos de visualización y edición en el entorno demo.

### Semilla de Datos y Restauración de Fábrica
- **RF-7 (Ubicuo)**: EL SISTEMA dispondrá de un script de inicialización (`seedDemo.js`) que generará automáticamente un conjunto de datos ficticios pero clínicamente realistas:
  - 1 Usuario administrador demo (`demo@psicoclinica.com`).
  - Al menos 6 pacientes ficticios con historiales clínicos y notas cifradas de ejemplo (individuales y evaluaciones).
  - Al menos 15 citas distribuidas en la semana activa (citas individuales confirmadas, evaluaciones de $4,000 MXN, citas grupales con calculadora de participantes y citas pagadas/por pagar).
- **RF-8 (Evento)**: CUANDO el desarrollador o administrador ejecute el comando de reinicio (`npm run demo:reset`) o invoque el endpoint protegido de restauración, EL SISTEMA restablecerá la base de datos demo al conjunto de datos semilla original sin afectar ningún otro entorno.

### Blindaje de Contactos Ficticios y Prevención de Envíos Accidentales
- **RF-9 (Ubicuo)**: EL SISTEMA utilizará números de teléfono de prueba no asignables (ej. `+52 55 0000 0000`) y enlaces de Zoom genéricos (`https://zoom.us/j/0000000000`) en todas las fichas de pacientes y citas precargadas.
- **RF-10 (Evento)**: CUANDO un usuario haga clic en los botones de WhatsApp de la demo, EL SISTEMA abrirá la interfaz de WhatsApp Web con el mensaje preformateado dirigido al número ficticio de prueba, evitando cualquier contacto involuntario con personas reales.

---

## 5. Requisitos No Funcionales y Seguridad
- **Cumplimiento de la Constitución**:
  - Principio 1: Los expedientes y notas de la demo se cifran mediante AES-256-GCM con su propia clave de entorno independiente.
  - Principio 2: Aislamiento absoluto entre bases de datos; la demo jamás se conectará al Supabase de PsicoLau.
  - Principio 6: Cero modificaciones a la base de código productiva de PsicoLau.
- **Eficiencia de Recursos**: El backend demo debe poder operar en SQLite para desarrollo ultraligero local o en PostgreSQL (en contenedor Docker/Coolify o Supabase Dev independiente) para la versión web.
- **Rendimiento**: El frontend de la demo mantendrá las optimizaciones de Core Web Vitals (imágenes WebP, CSS crítico, SVGs inline, cero dependencias innecesarias).

---

## 6. Fuera de Alcance (Out of Scope)
- Sistema multi-tenant con switcher de múltiples psicólogos en una sola base de datos (se mantendrá arquitectura single-tenant clonable para agilizar las ventas inmediatas de los clientes 2 y 3).
- Pasarela de cobros en línea con tarjeta de crédito (Stripe/MercadoPago); se mantiene el flujo de registro y auditoría contable en 1 clic existente.
- Sincronización bidireccional con Google Calendar o Outlook.

---

## 7. Criterios de Aceptación para la Demo
- [ ] Directorio `Web PsicoDemo` creado de forma completamente independiente de `Web PsicoLau`.
- [ ] Frontend público funcional con identidad de "Dra. Sofía Ramos".
- [ ] Panel clínico accesible con credenciales demo sugeridas en 1 clic.
- [ ] Matriz semanal poblada con citas de ejemplo (individual, grupal, evaluación) con contadores sincronizados.
- [ ] Suite de expedientes médicos poblada con notas clínicas cifradas simuladas.
- [ ] Reporte contable mensual operativo con desglose por tarifas ("Copiar para Contadora" y Excel).
- [ ] Script de restauración de datos (`npm run demo:reset`) probado y verificado.
