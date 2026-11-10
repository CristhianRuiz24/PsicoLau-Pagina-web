# Plan Técnico 024 — Blindaje de Errores de Servidor, Sanitización de Respuestas y Resiliencia en UI

## 1. Resumen de la Solución Técnica
Implementación de una arquitectura defensiva en dos niveles (*Defense in Depth*) para erradicar cualquier fuga de información técnica (*Information Disclosure*) ante interrupciones de base de datos o fallos no controlados del servidor:

1. **Nivel Backend (Sanitización por Diseño)**:
   - Extracción y especialización del middleware centralizado de errores a `backend/src/middlewares/errorHandler.js`.
   - Mapeo tipado de excepciones críticas de Prisma (`PrismaClientInitializationError`, `PrismaClientRustPanicError`, `PrismaClientUnknownRequestError`, desconexiones de pooler) respondiendo con **HTTP 503 (Service Unavailable)** y un payload JSON seguro sin trazas.
   - Eliminación incondicional de la propiedad `stack` en respuestas HTTP de error hacia el cliente, asegurando el principio *Secure by Default* sin depender exclusivamente del valor de `NODE_ENV`.
   - Registro de la traza completa y detallada exclusivamente en el logger interno del servidor (`logger.error`).

2. **Nivel Frontend (Sanitización Defensiva y Experiencia Resiliente)**:
   - Creación de un helper ESM transversal (`panel/js/errorHelper.js`) que valida cualquier mensaje recibido antes de presentarlo al usuario: si detecta longitud excesiva o términos técnicos (`prisma`, `tenant`, `database`, `stack`, etc.), lo sustituye por un mensaje institucional empático.
   - Actualización de `panel/js/login.js` y vistas del panel para desplegar una alerta estilizada con la paleta de Laura (`#EC5E86`, `#1E94A8`) junto a un botón interactivo de **"Reintentar"** que restaura el flujo sin forzar una recarga completa de página.
   - Estilos CSS dedicados en `panel/css/components/login.css` y `panel/css/components/modals.css`.

---

## 2. Alineación con la Constitución
- **Principio 1 (Cifrado de datos sensibles)**: Al suprimir volcados de base de datos, se evita la exposición accidental de metadatos o esquemas clínicos en logs de red del cliente.
- **Principio 2 (Entornos dev/prod separados)**: La respuesta HTTP segura rige en todos los entornos por defecto; el logging detallado en terminal local permite depurar sin exponer datos por HTTP.
- **Principio 3 (Frontend simple sin dependencias)**: Todo el manejo frontend se realiza en JavaScript Vanilla y CSS Vanilla puro, sin añadir librerías externas ni empaquetadores.
- **Principio 4 (Autenticación real sin atajos)**: Los errores de autenticación (credenciales inválidas 401) se mantienen claros e inalterados para la usuaria; los fallos de infraestructura se aíslan con 503.
- **Principio 6 (No regresión)**: Se garantiza que la agenda, expedientes y pagos continúen operando al 100% ante respuestas HTTP exitosas (200/201).

---

## 3. Módulos y Archivos Afectados

```text
Componente       | Archivos                                                | Tipo de cambio
-----------------|---------------------------------------------------------|------------------
Backend API      | backend/src/middlewares/errorHandler.js                 | Crear
Backend API      | backend/src/index.js                                     | Modificar (conectar middleware)
Frontend Panel   | panel/js/errorHelper.js                                  | Crear (ESM)
Frontend Panel   | panel/js/login.js                                        | Modificar (usar helper + reintento)
Frontend Panel   | panel/css/components/login.css                           | Modificar (estilos botón reintento)
Pruebas / Verif. | backend/scripts/testSanitizacionErroresSpec024.js        | Crear (suite automatizada)
```

---

## 4. Modelo de Datos y Esquema
*Sin cambios en `backend/prisma/schema.prisma`. No se requieren migraciones ni mutaciones de esquema.*

---

## 5. Contratos de API / Endpoints

### Respuestas de Error del Servidor Sanitizadas

#### 1. Caída de Base de Datos o Pooler (HTTP 503 Service Unavailable)
- **Condición**: Excepciones de conexión Prisma, desconexión de base de datos o pooler de Supabase pausado.
- **Payload**:
  ```json
  {
    "success": false,
    "message": "El servicio clínico no se encuentra disponible momentáneamente. Por favor, intenta de nuevo en unos minutos."
  }
  ```

#### 2. Error Interno No Controlado (HTTP 500 Internal Server Error)
- **Condición**: Cualquier otra excepción no capturada en controladores.
- **Payload**:
  ```json
  {
    "success": false,
    "message": "Ha ocurrido un error inesperado al procesar tu solicitud. Por favor, intenta más tarde."
  }
  ```

#### 3. Errores Funcionales Existentes (Inalterados)
- **HTTP 400 (Bad Request / Validación Zod)**:
  ```json
  {
    "success": false,
    "message": "Email y contraseña son requeridos"
  }
  ```
- **HTTP 401 (Unauthorized / Credenciales)**:
  ```json
  {
    "success": false,
    "message": "Credenciales inválidas"
  }
  ```

---

## 6. Decisiones Técnicas y Alternativas Descartadas

| Decisión tomada | Razón técnica | Alternativa descartada y por qué |
|---|---|---|
| **Omitir `stack` por defecto en HTTP siempre** | Principio *Secure by Default* (OWASP CWE-209); previene fugas en producción si `NODE_ENV` no fue asignada en el host. | *Condicionar `stack` únicamente a `NODE_ENV !== 'production'`: Descartada porque si se omite la variable de entorno en Render, las trazas se filtran en producción.* |
| **Mapear caídas de BD a HTTP 503** | Semánticamente correcto según RFC 9110; indica falla transitoria de servicio y permite al cliente ofrecer reintento claro. | *Dejar HTTP 500 genérico para todo: Descartada porque confunde fallos de código interno con caídas de conectividad de base de datos.* |
| **Sanitización defensiva en cliente (`errorHelper.js`)** | Defensa en profundidad; si por cualquier motivo upstream (CDN, proxy, gateway) emite un error técnico crudo, el frontend protege a la usuaria. | *Confiar únicamente en la respuesta del backend: Descartada porque proxies intermediarios (Cloudflare, Render) pueden emitir respuestas HTML/texto crudo.* |
| **Helper ESM nativo sin librerías** | Cumple con la Constitución (§3); compatible con el panel modularizado existente en `panel/js/`. | *Instalar paquete Toast/Notification npm: Descartada para evitar build steps y dependencias innecesarias.* |

---

## 7. Estrategia de Pruebas y Validación
1. **Suite automatizada (`backend/scripts/testSanitizacionErroresSpec024.js`)**:
   - Inyección de errores simulados de Prisma (`PrismaClientInitializationError`, desconexión) verificando respuesta HTTP 503 sin trazas.
   - Inyección de excepciones genéricas verificando HTTP 500 sin trazas.
   - Verificación de que errores 400 y 401 preservan sus mensajes legítimos.
2. **Validadores de pre-vuelo**:
   - `npm run test:syntax`: Comprueba que `panel/js/errorHelper.js` y `login.js` cumplan con la sintaxis ESM (33/33 módulos).
   - `npm run test:imports`: Valida resolución de dependencias entre módulos.
   - `npm run lint`: 0 errores en backend.
3. **Verificación visual del flujo de reintento**:
   - Comprobación manual de interacción en el login ante corte de red o servidor caído.

