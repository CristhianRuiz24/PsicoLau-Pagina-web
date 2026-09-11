# Tareas: Cifrado Integral de Datos Personales Identificables (PII) de Pacientes (Spec 017)

- [x] **T1. Actualización del Modelo Prisma y Base de Datos (RF-1, RF-2)**
  - Archivos: `backend/prisma/schema.prisma`
  - Añadir `emailHash String? @unique` y eliminar el constraint `@unique` sobre `email` (que ahora será ciphertext no determinista).
  - Ejecutar `npx prisma db push` y `npx prisma generate`.
  - *Hecho cuando*: El cliente Prisma exponga la propiedad `emailHash` y el esquema se sincronice con Supabase Dev sin errores.

- [x] **T2. Helpers Criptográficos de PII en `crypto.js` (RF-1, RF-2, RF-3)**
  - Archivos: `backend/src/utils/crypto.js`
  - Implementar `generarBlindIndex(valor)` con HMAC-SHA256 y la clave secreta.
  - Implementar `cifrarPaciente(datos)` y `descifrarPaciente(row)`.
  - Implementar validador de formato `esCifrado(cadena)`.
  - *Hecho cuando*: Tests unitarios en memoria validen que cifrar y descifrar un paciente restaure sus campos originales idénticos y genere un hash reproducible.

- [x] **T3. Script de Migración de Pacientes Existentes (RF-7)**
  - Archivos: `backend/scripts/migrateEncryptPacientes.js`
  - Implementar migración transaccional con modo `--dry-run` y ejecución real.
  - Cifrar los 10 pacientes existentes en la base de datos dev sin alterar sus IDs ni relaciones.
  - *Hecho cuando*: La base de datos dev tenga 0 pacientes en texto plano y todas las citas y expedientes permanezcan vinculados.

- [x] **T4. Adaptación de Controladores y Lógica de Negocio (RF-3, RF-4, RF-5)**
  - Archivos: `backend/src/utils/agendaHelpers.js`, `backend/src/controllers/agendaController.js`, `backend/src/controllers/citaController.js`, `backend/src/controllers/expedienteController.js`
  - Adaptar `buscarOCrearPacienteParaCita` para buscar por `emailHash` y descifrar el resultado.
  - En `obtenerCitas`: mapear y descifrar `cita.paciente`.
  - En `crearCitaPublica`: buscar por `emailHash` y persistir los campos cifrados.
  - En `expedienteController`: descifrar datos de paciente en directorio y cabecera de expediente.
  - *Hecho cuando*: Todos los endpoints retornen objetos JSON legibles a clientes autorizados y persistan únicamente texto cifrado en la base de datos.

- [x] **T5. Suite Automatizada de Pruebas de Cifrado (RF-1, RF-2, RF-5)**
  - Archivos: `backend/scripts/testCifradoPacientes.js`
  - Crear pruebas con `node:test` verificando:
    1. Que la consulta directa a Prisma devuelve `nombre`, `telefono`, `email` y `enlaceZoom` con formato `iv:tag:ciphertext`.
    2. Que `emailHash` corresponde al HMAC-SHA256 esperado.
    3. Que los endpoints HTTP autenticados devuelven los campos descifrados.
    4. Que un cliente no autenticado no puede acceder a los datos.
    5. Limpieza automática en bloque `finally`.
  - *Hecho cuando*: La suite apruebe el 100% de los casos.

- [x] **T6. Verificación de No-Regresión y Runner Unificado**
  - Archivos: Toda la suite
  - Ejecutar `npm test` en `backend/` asegurando 100% PASS de todas las suites anteriores (contabilidad, blindaje de entradas, contraseñas, citas recurrentes, etc.).
  - *Hecho cuando*: `npm test` apruebe todos los tests sin ningún fallo ni warning.
