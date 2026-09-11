# Tareas Técnicas 015 — Blindaje de Entradas, Sanitización Anti-Inyecciones (XSS / CSV) y Purga de Datos

## Desglose Atómico de Tareas (SDD)

- [x] **T1: Script transaccional de purga e higiene de base de datos**
  - **Archivos:** `backend/scripts/purgeTestData.js`
  - **Acción:** Crear script idempotente que identifique y elimine en transacción segura:
    1. Citas y pacientes asociados a OWASP ZAP (`nombre LIKE 'http%'`, `'www%'`, `'%ZAP%'`).
    2. Citas y pacientes de prueba huérfanos (`Paciente Test%`, `paciente random`).
    3. Citas con fechas anómalas previas a 2020.
  - **Hecho cuando:** Al ejecutar `node backend/scripts/purgeTestData.js`, se reporta la eliminación de los 24 registros de prueba y la base de datos queda con exactamente los pacientes reales y legítimos de Laura, sin errores de claves foráneas.

- [x] **T2: Blindaje semántico en esquemas de validación Zod**
  - **Archivos:** `backend/src/utils/validators.js`
  - **Acción:**
    1. Definir regex para nombres humanos: `/^[\p{L}\s.'\-]+$/u` (longitud 2 a 100 caracteres) rechazando explícitamente secuencias de URL y corchetes en `citaSchema` y `contactoSchema`.
    2. Definir helper de teléfono: permitir caracteres de marcación internacional (`+`, `-`, `()`, `.`, espacios) y validar que el número de dígitos netos se encuentre entre 7 y 20.
    3. Definir regla para `contactoSchema.mensaje`: longitud 5 a 3000, máximo 2 URLs y rechazo de etiquetas HTML ejecutables (`<script>`, `<iframe>`, `<object>`, `<embed>`, `<a `).
    4. En `crearCitaAdminSchema` y `editarCitaAdminSchema`: admitir nombres humanos y prefijos autorizados (`[GRUPAL]`, `[BLOQUEO]`, `[EVALUACION]`), pero bloqueando URLs y tags HTML.
  - **Hecho cuando:** Al pasar objetos inválidos por los esquemas, Zod lanza `ZodError` con mensajes claros y descriptivos en español.

- [x] **T3: Mitigación contra inyección de fórmulas CSV (CWE-1236)**
  - **Archivos:** `panel/js/pagos/export/csv.js`
  - **Acción:** Implementar la función de sanitización `sanitizarCeldaCSV(valor)` que antepone un apóstrofe (`'`) si el valor comienza con `=`, `+`, `-` o `@`. Aplicar esta sanitización en los campos `Paciente`, `Tipo_Servicio`, `Estado_Pago` y `Estado_Sesion` antes de componer las filas del CSV.
  - **Hecho cuando:** Al generar un CSV con un nombre que comience con `=cmd` o `@test`, el archivo descargable contiene `'=cmd` y `'@test`, evitando la ejecución de fórmulas en Excel.

- [x] **T4: Suite de pruebas automatizadas de abuso y seguridad negativa**
  - **Archivos:** `backend/scripts/testBlindajeEntradas.js`
  - **Acción:** Crear suite con `node:test` y `node:assert` que verifique:
    1. Rechazo (400 Bad Request) de cargas ZAP (`http://www.google.com:80/search?q=ZAP`, `www.google.com`).
    2. Rechazo de inyecciones XSS (`<script>alert(1)</script>`) en nombre, teléfono y mensaje.
    3. Rechazo de teléfonos con letras o longitudes inválidas.
    4. Rechazo de spam de más de 2 URLs en mensaje de contacto.
    5. Aceptación de nombres válidos con tildes, eñes y apóstrofes.
    6. Soporte de prefijos `[GRUPAL]` en rutas de agenda autenticadas y rechazo en formularios públicos.
    7. Limpieza en bloque `finally`.
  - **Hecho cuando:** La suite se ejecuta de forma independiente con éxito (`node backend/scripts/testBlindajeEntradas.js` -> 100% PASS).

- [x] **T5: Verificación unificada y no-regresión de la suite completa**
  - **Archivos:** `overview/session.md`, `overview/tasks.md`
  - **Acción:** Ejecutar `npm test` en `backend/` verificando que los 22 archivos de prueba pasen al 100% (27+ tests en total) sin ninguna regresión, y actualizar la memoria de sesión.
  - **Hecho cuando:** `npm test` finaliza con código de salida `0` (100% PASS) y el Directorio de Pacientes en el panel muestra únicamente los pacientes legítimos sin registros de ZAP.
