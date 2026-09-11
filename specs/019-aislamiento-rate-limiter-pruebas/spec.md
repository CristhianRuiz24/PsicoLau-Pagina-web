# Spec 019 — Aislamiento del Rate Limiter en Entornos Locales y Pruebas

## 1. Contexto y Objetivo
El backend de PsicoLau implementa limitadores de tasa (`express-rate-limit`) en los endpoints públicos de agendamiento (`/api/citas/public`) y contacto (`/api/contacto`) con una cuota estricta de 5 peticiones por ventana de 15 minutos para mitigar spam y ataques de denegación de servicio.

Actualmente, ambos limitadores cuentan con una condición de omisión `skip: () => process.env.NODE_ENV === 'test'`. Sin embargo, durante el flujo diario de trabajo con `scripts/dev.js`, el backend corre bajo `NODE_ENV=development`. Cuando el desarrollador o la suite automatizada ejecuta `npm test` en paralelo, el orquestador `runTests.js` reutiliza la instancia activa en `localhost:3001`. Al procesar la suite de pruebas adversarias `testBlindajeEntradas.js`, las peticiones originadas desde la dirección de loopback local (`127.0.0.1`) superan el umbral de 5 solicitudes, provocando que el servidor responda con HTTP 429 Too Many Requests en lugar del código esperado HTTP 400 Bad Request, arrojando un falso positivo en la suite de pruebas.

El objetivo de esta spec es garantizar que en entornos locales de desarrollo y pruebas las solicitudes de loopback no queden bloqueadas prematuramente por el rate limiter, manteniendo la protección estricta al 100% en el entorno de producción.

---

## 2. Usuarios / Actores
- **Desarrollador / Agente de IA**: Ejecuta la suite de pruebas automatizadas (`npm test`) y comandos de desarrollo continuo sin fricción ni falsos positivos por limitación de tasa.
- **Paciente / Usuario Público**: Interactúa con los formularios públicos en producción bajo la protección completa anti-spam.
- **Laura (Administradora)**: Utiliza la suite clínica con máxima disponibilidad y seguridad.

---

## 3. Historias de Usuario
- **H1**: Como desarrollador, quiero ejecutar la suite completa de pruebas unitarias y de integración (`npm test`) mientras el entorno de desarrollo local está activo, para verificar la integridad del sistema sin bloqueos imprevistos de HTTP 429.
- **H2**: Como administrador del sistema, quiero que en producción todas las solicitudes públicas continúen estrictamente limitadas a 5 peticiones por cada 15 minutos por IP, para evitar saturación o abuso del servidor.

---

## 4. Requisitos Funcionales (Criterios en Notación EARS)

### RF-1: Omisión de Rate Limit en Solicitudes de Loopback en Modo Desarrollo
- **MIENTRAS** el servidor se ejecute en un entorno no productivo (`process.env.NODE_ENV !== 'production'`), **EL SISTEMA** omitirá el conteo y la restricción del rate limiter para solicitudes provenientes de direcciones de loopback local (`127.0.0.1`, `::1`, `::ffff:127.0.0.1`).

### RF-2: Omisión Total en Modo Test Explícito
- **MIENTRAS** el servidor se ejecute con `process.env.NODE_ENV === 'test'`, **EL SISTEMA** omitirá de manera incondicional la restricción de los limitadores de tasa en todas las rutas de prueba.

### RF-3: Imparcialidad y Blindaje Estricto en Producción
- **MIENTRAS** el servidor se ejecute en entorno productivo (`process.env.NODE_ENV === 'production'`), **EL SISTEMA** aplicará el limitador de tasa de manera homogénea e ineludible a todas las solicitudes recibidas, denegando el acceso con HTTP 429 a partir de la 6ª petición por ventana de 15 minutos por dirección IP.

### RF-4: Preservación Semántica de Respuestas de Validación
- **CUANDO** una solicitud a un endpoint público contenga datos inválidos o maliciosos (ej. inyecciones XSS, payloads ZAP, teléfonos con letras), **EL SISTEMA** responderá invariablemente con HTTP 400 Bad Request y formato `{ success: false, message: '...' }`, independientemente de cuántas solicitudes previas se hayan efectuado en el entorno local.

---

## 5. Requisitos No Funcionales & Seguridad
- **Alineación Constitucional**: Cumple el Principio #2 (separación dev/producción) y Principio #5 (superficie de ataque explícita). No debilita ninguna defensa en producción.
- **Rendimiento**: La verificación de IP local y entorno se realiza en memoria mediante comparación de cadenas O(1), sin sobrecarga perceptible en el ciclo de vida de la petición.
- **Seguridad**: En producción (`NODE_ENV === 'production'`), la condición de bypass local se desactiva estrictamente.

---

## 6. Casos Límite y Manejo de Errores
- **Proxy reverso (Render / Cloudflare)**: En producción con `app.set('trust proxy', 1)`, la IP del cliente se resuelve mediante `req.ip` de las cabeceras del proxy; las solicitudes externas jamás tendrán IP de loopback.
- **IPv4 vs IPv6**: Se reconocen tanto formatos IPv4 (`127.0.0.1`), IPv6 (`::1`), como IPv4 mapeado sobre IPv6 (`::ffff:127.0.0.1`).

---

## 7. Fuera de Alcance (Out of Scope)
- Modificación de límites en endpoints administrativos autenticados (`loginLimiter`, `cambiarPasswordLimiter`).
- Modificación del esquema de base de datos o modelos Prisma.
- Refactorizaciones estructurales de controladores.

---

## 8. Criterios de Finalización (Definition of Done)
- [ ] `backend/src/routes/citas.js` actualizado con bypass local seguro en modo no productivo.
- [ ] `backend/src/routes/contacto.js` actualizado con bypass local seguro en modo no productivo.
- [ ] `node scripts/testBlindajeEntradas.js` ejecutado contra el servidor de desarrollo activo pasando al 100% con HTTP 400.
- [ ] Suite completa `npm test` ejecutada con 40/40 pruebas pasando exitosamente (100% PASS).
- [ ] Verificación de no-regresión en entorno de desarrollo.
- [ ] Cero modificaciones en base de datos.
