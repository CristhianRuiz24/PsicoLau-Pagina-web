# Especificación: Aislamiento de Correos en Entornos de Pruebas y Desarrollo (016-aislamiento-emails-entorno-pruebas)

## Contexto y Motivación
Durante la ejecución de las pruebas adversarias y de integración de la [Spec 015](file:///c:/Users/crist/Documents/Proyectos/Web%20PsicoLau/specs/015-blindaje-entradas-y-seguridad-datos/spec.md) (`testBlindajeEntradas.js`), se enviaron solicitudes legítimas simuladas a `POST /api/citas/public` con datos ficticios (`María José Peña-Nieto de Müller`, con correo `paciente.legitimo.1789152...@local.com`).

Dado que la variable `RESEND_API_KEY` se encuentra configurada en el archivo `backend/.env`, el servicio de correos [`backend/src/services/emailService.js`](file:///c:/Users/crist/Documents/Proyectos/Web%20PsicoLau/backend/src/services/emailService.js) disparó peticiones HTTP reales a la API de Resend (`https://api.resend.com/emails`), provocando los siguientes efectos no deseados:
1. **Rebotes (`Bounced`) en Resend**: Al enviar correos a dominios locales ficticios (`@local.com`), los correos rebotaron en los servidores de correo, aumentando la tasa de rebote del dominio y arriesgando la reputación de entrega en la plataforma.
2. **Saturación en la bandeja real de Laura**: Se enviaron 4 notificaciones reales con asunto *"Nueva solicitud de cita - María José Peña-N..."* a la cuenta de Laura (`lince_lg@yahoo.com.mx`), confundiéndola con citas reales.
3. **Consumo innecesario de créditos**: Cada ejecución de `npm test` consume peticiones de la cuota mensual de Resend.

Esta especificación formaliza una arquitectura de **Defensa en Profundidad (3 capas)** para interceptar y simular de forma segura todo envío de correos durante pruebas y desarrollo local.

---

## Objetivos
1. **Aislamiento por Entorno (`NODE_ENV === 'test'`)**: Silenciar y simular el 100% de los envíos de correo en modo de prueba sin realizar peticiones HTTP a Resend.
2. **Filtro Anti-Rebote por Dominio Ficticio**: Detectar dominios de prueba (`@local.com`, `@test.com`, `@example.com`, `@fake.com`, `.local`, `sin-email-`) y omitir el envío real incluso si no se declaró explícitamente `NODE_ENV`.
3. **Protección de la Bandeja de Laura en Desarrollo**: Evitar que el correo real de Laura (`lince_lg@yahoo.com.mx`) reciba notificaciones de prueba originadas desde entornos que no sean estrictamente `production`, salvo autorización explícita por variable de entorno (`ENABLE_REAL_EMAILS_DEV=true`).
4. **Determinismo en el Test Runner**: Configurar `backend/scripts/runTests.js` para inyectar automáticamente `NODE_ENV=test` tanto al servidor efímero como al proceso de pruebas.
5. **Suite de Verificación de Aislamiento**: Crear la prueba automatizada `testAislamientoEmail.js` que verifique que ninguna llamada a la API pública de citas o contacto efectúe peticiones de red salientes durante las pruebas.

---

## Requisitos Funcionales (Notación EARS)

### Módulo 1: Intercepción y Simulación en `emailService.js`
- **RF-1 (Condicional - Modo Test):** DONDE la variable de entorno `NODE_ENV` sea igual a `'test'`, EL SISTEMA interceptará cualquier llamada a `enviarEmailResend()`, registrando un log informativo y retornando `{ success: true, simulated: true, id: 'test-mock-id', message: 'Envío simulado en entorno de pruebas' }` sin realizar ninguna petición de red a `api.resend.com`.
- **RF-2 (Excepción - Dominios Ficticios / Blacklist):** SI el destinatario (`to`) contiene un dominio ficticio o reservado de prueba (`@local.com`, `@test.com`, `@example.com`, `@fake.com`, `@invalid`, subdominios `.local` o prefijos `sin-email-`), ENTONCES EL SISTEMA omitirá la llamada HTTP a Resend y retornará `{ success: true, simulated: true, id: 'mock-ficticio-id', message: 'Envío simulado para dominio de prueba' }`, evitando rebotes en la cuenta de correo.
- **RF-3 (Condicional - Protección Bandeja Laura en Dev):** DONDE el entorno no sea de producción (`NODE_ENV !== 'production'`) Y el destinatario sea el correo oficial de Laura (`CORREO_DESTINO`) Y la variable `ENABLE_REAL_EMAILS_DEV` no esté en `'true'`, EL SISTEMA simulará el envío de la notificación sin contactar a Resend, protegiendo su bandeja de entrada de datos de prueba.

### Módulo 2: Orquestador y Configuración del Test Runner
- **RF-4 (Evento - Test Runner Unificado):** CUANDO se ejecute `node scripts/runTests.js` (o `npm test`), EL SISTEMA inyectará de forma estricta `NODE_ENV: 'test'` en el entorno del proceso hijo del servidor efímero (`spawn('node', ['src/index.js'])`) y en el runner de pruebas (`node --test`).

### Módulo 3: Suite de Pruebas Automatizadas
- **RF-5 (Evento - Verificación de Aislamiento):** CUANDO se ejecute la suite `testAislamientoEmail.js`, EL SISTEMA comprobará que:
  1. El envío de confirmación de cita a un paciente ficticio retorna `simulated: true` y no genera errores de red.
  2. El aviso a Laura en entorno local o test retorna `simulated: true`.
  3. Las peticiones a `POST /api/citas/public` y `POST /api/contacto` responden con `201 Created` y `200 OK` respectivamente sin ejecutar peticiones HTTP externas.

---

## Fuera de Alcance (Out of Scope)
- Modificar las plantillas HTML o el diseño visual de los correos existentes.
- Cambiar de proveedor de correo (Resend continúa siendo el proveedor oficial).
- Alterar la lógica del controlador de citas o contacto (el blindaje se encapsula en el servicio `emailService.js` y el runner `runTests.js`).

---

## Casos Límite y Mitigaciones
- **Pruebas manuales en desarrollo de correo real**: Si en algún momento el desarrollador desea probar el envío real de un correo a Laura en desarrollo, podrá hacerlo activando `ENABLE_REAL_EMAILS_DEV=true` en `.env` de forma consciente y deliberada.
- **Múltiples destinatarios en array**: Si `to` es un arreglo de correos, la verificación de dominios ficticios inspeccionará cada elemento individualmente.
