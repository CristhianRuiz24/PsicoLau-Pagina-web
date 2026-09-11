# Spec 017 — Cifrado Integral de Datos Personales Identificables (PII) de Pacientes y Blindaje Clínico

## 1. Contexto y Objetivo
Actualmente, el sistema cumple con el Principio #1 de la Constitución garantizando que los **8 campos clínicos sensibles** de la tabla `Expediente` (`estadoActual`, `insightPaciente`, `eventoPrincipal`, `intervenciones`, `formulacionClinica`, `tareasAsignadas`, `pendientesProximaSesion`, `resumenBreve`) se almacenen cifrados con `AES-256-GCM` a nivel de aplicación.

Sin embargo, los datos personales identificables (**PII**) de los pacientes en la tabla `Paciente` (`nombre`, `telefono`, `email` y `enlaceZoom`) residen actualmente en texto plano en la base de datos de PostgreSQL. Si un atacante obtuviera acceso directo de lectura a la base de datos o a un volcado de respaldo (backup leak), podría correlacionar la identidad real de las personas atendidas por Laura (violando la confidencialidad médica y regulaciones de protección de datos personales como RGPD/HIPAA/LFPDPPP).

El objetivo de esta especificación es implementar el **cifrado simétrico transparente con `AES-256-GCM`** para los campos de datos personales de la tabla `Paciente`, implementando un mecanismo de **Índice Ciego Determinista (`emailHash` mediante HMAC-SHA256)** para preservar la integridad relacional, la búsqueda de citas y la unicidad del correo electrónico sin exponer la información personal en reposo, garantizando a la vez que la agenda, el autocompletado y la suite clínica de Laura continúen operando con 100% de fluidez (Principio Constitucional #6).

---

## 2. Usuarios / Actores
- **Laura (Psicóloga / Administradora)**: Accede al panel administrativo autenticado (`/panel/agenda.html`), visualiza los nombres reales de sus pacientes en las citas semanales, expedientes y buscador, sin notar retardos ni diferencias funcionales.
- **Paciente Público**: Solicita una cita desde el formulario web (`/contacto.html` o modal de citas públicas) ingresando su nombre, correo y teléfono; sus datos se cifran inmediatamente en el backend antes de insertarse en la base de datos.
- **Auditor / Sistema de Base de Datos (Supabase)**: Observa únicamente cadenas cifradas (`iv:tag:ciphertext`) y hashes unidireccionales en las columnas de pacientes y expedientes; ningún dato personal sensible ni clínico es legible en reposo.

---

## 3. Historias de Usuario
- **H1**: Como **Laura**, quiero que los nombres, teléfonos, correos y enlaces de Zoom de mis pacientes estén completamente cifrados en la base de datos para garantizar el secreto profesional médico y la máxima privacidad de mis pacientes frente a cualquier filtración técnica.
- **H2**: Como **Laura**, quiero seguir buscando, autocompletando y gestionando citas y expedientes por nombre y teléfono en mi panel con la misma agilidad y exactitud de siempre.
- **H3**: Como **Paciente**, quiero solicitar una cita en la web sabiendo que mis datos personales se guardan bajo cifrado militar que nadie salvo mi terapeuta puede descifrar.

---

## 4. Requisitos Funcionales (Criterios en Notación EARS)

### Módulo 1: Cifrado en Tabla `Paciente` (Datos Personales Identificables)
- **RF-1 (Ubicuo):** EL SISTEMA cifrará a nivel de aplicación con `AES-256-GCM` (utilizando la clave secreta `ENCRYPTION_KEY` de 256 bits y un vector de inicialización aleatorio de 96 bits) los campos `nombre`, `telefono`, `email` y `enlaceZoom` de todo registro en la tabla `Paciente` antes de su persistencia en la base de datos.
- **RF-2 (Ubicuo):** EL SISTEMA generará un índice ciego determinista (`emailHash`) mediante `HMAC-SHA256(emailNormalizado, ENCRYPTION_KEY)` para cada paciente, almacenándolo en una columna indexada para garantizar la unicidad del paciente y permitir búsquedas exactas en O(1) sin revelar el correo en texto plano.
- **RF-3 (Evento):** CUANDO un endpoint autenticado del backend (`/api/agenda/citas`, `/api/agenda/pacientes`, `/api/pacientes/:id/expediente`, `/api/citas`) obtenga registros de `Paciente`, EL SISTEMA descifrará en memoria de forma transparente los campos `nombre`, `telefono`, `email` y `enlaceZoom` antes de entregar la respuesta JSON al cliente autenticado.
- **RF-4 (Evento):** CUANDO un usuario no autenticado envíe una solicitud de cita a `POST /api/citas/public`, EL SISTEMA calculará el `emailHash`, buscará si el paciente ya existe por su hash o lo creará con sus datos personales cifrados, vinculando la nueva cita sin exponer datos en claro en la base de datos.

### Módulo 2: Ratificación de Cifrado en Tabla `Expediente` (Datos Clínicos)
- **RF-5 (Ubicuo):** EL SISTEMA mantendrá permanentemente el cifrado `AES-256-GCM` en los 8 campos clínicos confidenciales de `Expediente`: `estadoActual`, `insightPaciente`, `eventoPrincipal`, `intervenciones`, `formulacionClinica`, `tareasAsignadas`, `pendientesProximaSesion` y `resumenBreve`.
- **RF-6 (Excepción):** SI un registro en `Expediente` o `Paciente` no presenta el formato canónico de autenticación `ivHex:authTagHex:encryptedHex` al momento de ser procesado por el helper de descifrado, ENTONCES EL SISTEMA manejará la excepción de forma controlada sin tumbar el servidor (fallback seguro a texto plano si fuera un registro legacy no migrado o log de advertencia).

### Módulo 3: Migración Idempotente de Pacientes Existentes
- **RF-7 (Evento):** CUANDO se ejecute el script de migración `backend/scripts/migrateEncryptPacientes.js`, EL SISTEMA:
  1. Identificará todos los pacientes en la base de datos que aún tengan datos en texto plano.
  2. Calculará el `emailHash` correspondiente para cada uno.
  3. Cifrará `nombre`, `telefono`, `email` y `enlaceZoom` con `AES-256-GCM`.
  4. Actualizará los registros dentro de una transacción atómica segura, reportando el conteo de registros migrados y verificando que el 100% de las citas y expedientes vinculados permanezcan íntegros.

---

## 5. Requisitos No Funcionales & Seguridad

### Análisis de la Base de Datos: ¿Qué se debe cifrar y qué NO?

| Tabla | Columna | Tipo | ¿Cifrar? | Justificación Técnica & Clínica |
| :--- | :--- | :--- | :---: | :--- |
| **`Paciente`** | `nombre` | Text | **SÍ** | **PII Directa**. Identifica al paciente atendido en terapia. Cifrado AES-256-GCM. |
| **`Paciente`** | `telefono` | Text | **SÍ** | **PII Directa**. Canal de contacto privado. Cifrado AES-256-GCM. |
| **`Paciente`** | `email` | Text | **SÍ** | **PII Directa**. Canal de comunicación y facturación. Cifrado AES-256-GCM. |
| **`Paciente`** | `enlaceZoom` | Text | **SÍ** | **Sensible**. Contiene IDs y tokens/passwords de teleconsulta (`?pwd=...`). Cifrado AES-256-GCM. |
| **`Paciente`** | `emailHash` | Text | **Hash** | **Índice Ciego HMAC-SHA256**. Permite constraint `@unique` y búsqueda O(1) sin revelar el correo. |
| **`Paciente`** | `id` | Int | **NO** | Clave primaria relacional interna requerida para foreign keys en `Cita` y `Expediente`. |
| **`Paciente`** | `tarifaDefecto`| Float | **NO** | Parámetro contable operativo (ej. 500, 4000). No contiene datos personales ni médicos. |
| **`Paciente`** | `createdAt`, `updatedAt` | Date | **NO** | Metadatos técnicos de auditoría de registros. |
| **`Expediente`**| *8 campos clínicos* | Text | **SÍ** | **Datos de Salud Protegidos (PHI)**. Ya cifrados con AES-256-GCM. Se mantiene al 100%. |
| **`Expediente`**| `id`, `pacienteId`, `fechaSesion` | Int/Date | **NO** | Necesarios para relaciones relacionales y ordenación cronológica del historial clínico. |
| **`Cita`** | `fechaHora` | Date | **NO** | Requerido para indexar y renderizar la matriz semanal (7:00 a.m. a medianoche). |
| **`Cita`** | `color`, `monto`, `serieId` | Misc | **NO** | Usados en interfaz visual, sumatorias matemáticas contables (reporte de contadora) y series. |
| **`Cita`** | `estado_cita`, `estado_pago` | Enums | **NO** | Máquina de estados de la agenda y auditoría de pagos en un clic. |
| **`Cita`** | `categoria` | Text | **NO** | Almacena prefijos de control de interfaz (`[GRUPAL]`, `[BLOQUEO]`, `[EVALUACION]`). |
| **`Usuario`** | `email` | Text | **NO** | Identificador de login administrativo de Laura (`admin@psicolau.com`). |
| **`Usuario`** | `password_hash` | Text | **Hash** | Ya protegido con hash unidireccional bcryptjs + salt. Nunca se cifra de forma reversible. |
| **`LogNotificacion`** | Todas | Misc | **NO** | Logs técnicos de auditoría interna de envíos. |

---

## 6. Casos Límite y Manejo de Errores
- **Pacientes sin correo real (`sin-email-...@local.com`)**: Al crearse citas directas en la agenda para pacientes sin correo, el valor generado se cifra con AES-256-GCM y su hash correspondiente se indexa normalmente.
- **Búsqueda por nombre en panel**: El panel carga el conjunto de citas y pacientes descifrados en memoria tras autenticación JWT, permitiendo que el buscador en tiempo real (`filter()`) funcione instantáneamente sin necesidad de índices de texto completo no cifrados.
- **Prefijos institucionales (`[GRUPAL]`, `[BLOQUEO]`)**: Los nombres que contengan estos prefijos se cifran de forma íntegra; al descifrarse en el controlador se normalizan con los helpers de agenda existentes.

---

## 7. Fuera de Alcance (Out of Scope)
- Cifrado a nivel de disco o tablespace en PostgreSQL (TDE) provisto por Supabase (esta spec atañe a cifrado a nivel de aplicación Zero-Knowledge).
- Cifrado de fechas y montos de citas (alteraría el motor de cálculo contable y la matriz semanal).

---

## 8. Criterios de Finalización (Definition of Done)
- [ ] Esquema Prisma actualizado con `emailHash` opcional o migrado, y campos `nombre`, `telefono`, `email`, `enlaceZoom` documentados como cifrados.
- [ ] Helpers centralizados en `backend/src/utils/crypto.js` para cifrado/descifrado de pacientes y generación de `emailHash`.
- [ ] Controladores (`agendaController.js`, `citaController.js`, `expedienteController.js`) actualizados con cifrado antes de guardar y descifrado transparente al responder.
- [ ] Script de migración `migrateEncryptPacientes.js` ejecutado con éxito en la base de datos de desarrollo (0 pacientes en texto plano restantes).
- [ ] Suite de pruebas unificada `npm test` aprobada al 100% (incluyendo verificación de que consultas directas a Prisma retornan ciphertext con formato `iv:tag:ciphertext`).
- [ ] No-regresión en la agenda semanal, visualización de citas, autocompletado y cálculo de pagos.
