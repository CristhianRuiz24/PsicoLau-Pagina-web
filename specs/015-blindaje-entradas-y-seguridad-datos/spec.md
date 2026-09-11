# Especificación: Blindaje de Entradas, Sanitización Anti-Inyecciones (XSS / CSV) y Purga de Datos (015-blindaje-entradas-y-seguridad-datos)

## Contexto y Motivación
Durante una auditoría profunda de la base de datos tras la modularización del panel clínico, se identificó la persistencia de 10 registros de pacientes espurios con nombres en formato de URL (`http://www.google.com:80/search?q=ZAP`), inyectados durante una auditoría dinámica DAST con OWASP ZAP el 5 de septiembre de 2026. Asimismo, se detectaron 14 registros huérfanos de pruebas manuales (`Paciente Test A/B`, `paciente random` con fecha anómala en 1980).

Este hallazgo reveló una debilidad crítica de seguridad clasificada como **CWE-20 (Improper Input Validation)** en los esquemas de validación con Zod (`backend/src/utils/validators.js`), donde el campo `nombre` únicamente comprobaba longitud (`min`, `max`) sin validar formato ni restringir URLs ni código. Adicionalmente, se identificó una vulnerabilidad de **CWE-1236 (CSV Formula Injection)** en el exportador contable `panel/js/pagos/export/csv.js` al no neutralizar caracteres de inicio de fórmula (`=`, `+`, `-`, `@`).

Esta especificación establece el blindaje integral de todas las entradas de datos en backend, la sanitización estricta para exportación CSV, la purga segura de registros de prueba en la base de datos y la incorporación de una suite de pruebas adversarias obligatoria en el test runner.

## Objetivos
1. **Blindaje de Validación por Lista Blanca (Whitelist)**: Restringir los campos `nombre` y `telefono` en formularios públicos para admitir exclusivamente nombres humanos reales y teléfonos internacionales válidos, bloqueando tajantemente URLs, scripts y caracteres de inyección.
2. **Soporte Seguro en Panel Administrativo**: Permitir en el panel administrativo los prefijos oficiales de trabajo (`[GRUPAL]`, `[BLOQUEO]`, `[EVALUACION]`), manteniendo el bloqueo estricto contra URLs, HTML y caracteres sospechosos.
3. **Control Anti-Spam en Mensajería de Contacto**: Limitar URLs a un máximo de 2 y prohibir etiquetas HTML en el mensaje del formulario público de contacto.
4. **Mitigación de Inyección CSV (CWE-1236)**: Neutralizar fórmulas en la exportación contable anteponiendo una comilla simple (`'`) a campos que inicien con `=`, `+`, `-` o `@`.
5. **Purga Segura de Base de Datos**: Crear un script idempotente para eliminar todos los registros anómalos y de test (ZAP, `paciente random`, `Paciente Test A/B`), restaurando la higiene del directorio médico.
6. **Pruebas Adversarias Automatizadas**: Crear la suite `testBlindajeEntradas.js` integrada en `npm test` para garantizar de forma permanente que ninguna inyección pase sin ser rechazada con `400 Bad Request`.

---

## Requisitos Funcionales (Notación EARS)

### Módulo 1: Validación de Entradas Públicas (Citas y Contacto)
- **RF-1 (Excepción):** SI una petición a `POST /api/citas/public` o `POST /api/contacto` contiene un campo `nombre` que no coincida con el formato de nombre humano (letras Unicode con acentos/diéresis/ñ, espacios, puntos o guiones: `/^[\p{L}\s.'\-]+$/u`), o contenga URLs (`http://`, `https://`, `www.`), etiquetas HTML (`<`, `>`), corchetes `[...]` o caracteres de control, ENTONCES EL SISTEMA responderá con código de estado `400 Bad Request` y mensaje descriptivo, sin persistir registros en base de datos.
- **RF-2 (Excepción):** SI una petición a `POST /api/citas/public` o `POST /api/contacto` contiene un campo `telefono` con caracteres diferentes a dígitos numéricos y signos estándar de marcación internacional (`+`, `-`, `()`, `.`), o su conteo neto de dígitos numéricos es menor a 7 o mayor a 20, ENTONCES EL SISTEMA responderá con código `400 Bad Request`.
- **RF-3 (Excepción):** SI una petición al formulario de contacto `POST /api/contacto` contiene un campo `mensaje` con más de 2 URLs (patrones `https?://` o `www.`) o contiene etiquetas HTML ejecutables (`<script>`, `<iframe>`, `<object>`, `<embed>`, `<a `), ENTONCES EL SISTEMA responderá con código `400 Bad Request` bloqueando el intento de spam.

### Módulo 2: Validación en Panel Administrativo (Agenda y Citas)
- **RF-4 (Condicional):** DONDE una cita sea creada o editada desde el panel administrativo autenticado (`POST /api/agenda/citas` o `PUT /api/agenda/citas/:id`), EL SISTEMA admitirá nombres humanos válidos y adicionalmente nombres que inicien con los prefijos oficiales `[GRUPAL]`, `[BLOQUEO]` o `[EVALUACION]`.
- **RF-5 (Excepción):** SI una cita en el panel administrativo contiene URLs (`http://`, `https://`, `www.`), etiquetas HTML (`<`, `>`) o caracteres de comando en el nombre, ENTONCES EL SISTEMA responderá con código `400 Bad Request` impidiendo su almacenamiento.

### Módulo 3: Protección contra Inyección CSV (CWE-1236)
- **RF-6 (Ubicuo):** EL SISTEMA neutralizará en `panel/js/pagos/export/csv.js` cualquier valor de celda que comience con los caracteres `=`, `+`, `-` o `@`, anteponiendo un apóstrofe (`'`) en el archivo CSV generado, asegurando que las hojas de cálculo (Excel, LibreOffice, Google Sheets) interpreten el dato estrictamente como texto plano sin ejecutar fórmulas.

### Módulo 4: Purga e Higiene de Base de Datos
- **RF-7 (Evento):** CUANDO se ejecute el script de purga (`backend/scripts/purgeTestData.js`), EL SISTEMA eliminará de forma transaccional y atómica:
  1. Las citas y pacientes generados por OWASP ZAP (`nombre` que contenga `http://`, `www.` o `ZAP`).
  2. Las citas y pacientes asociados a pruebas huérfanas (`nombre` que contenga `Paciente Test` o `paciente random`).
  3. Citas con fechas anómalas previas al año 2020.
  Manteniendo intactos todos los pacientes legítimos y las configuraciones de Laura.

### Módulo 5: Verificación Automatizada y Suite de Pruebas
- **RF-8 (Evento):** CUANDO se ejecute `npm test` en el backend, EL SISTEMA ejecutará automáticamente la suite `backend/scripts/testBlindajeEntradas.js`, comprobando que:
  1. Cargas de inyección ZAP (`http://www.google.com:80/search?q=ZAP`) son rechazadas con `400 Bad Request`.
  2. Payloads XSS (`<script>alert(1)</script>`) en nombre, teléfono o mensaje son rechazados con `400 Bad Request`.
  3. Fórmulas maliciosas (`=cmd|' /C calc'!A0`) en nombres son rechazadas en formularios públicos.
  4. Nombres legítimos con tildes, mayúsculas, diéresis y guiones compuestos son aprobados con éxito.
  5. Prefijos de agenda (`[GRUPAL]`, `[BLOQUEO]`) funcionan exclusivamente en rutas administrativas.

---

## Fuera de Alcance (Out of Scope)
- Modificar el esquema relacional de Prisma (`schema.prisma` permanece idéntico).
- Alterar el cifrado AES-256-GCM de notas clínicas (ya verificado y 100% seguro).
- Rediseñar interfaces visuales del panel o del sitio web público.
- Implementar servicios de captcha de terceros (hCaptcha / Turnstile) en esta etapa (se prioriza validación semántica nativa sin dependencias).

---

## Casos Límite y Mitigaciones
- **Nombres con caracteres internacionales legítimos**: Nombres como *"María José Peña-Nieto"*, *"René O'Connor"* o *"Dr. Müller"* deben ser aceptados sin error. **Mitigación**: Expresión regular con flag Unicode `u` (`/^[\p{L}\s.'\-]+$/u`).
- **Números de teléfono con código de país**: Teléfonos como `+52 55 1234 5678` o `(55) 1234-5678` deben ser aceptados. **Mitigación**: Regex telefónica que permita `+`, `-`, espacios y paréntesis, exigiendo entre 7 y 20 dígitos numéricos netos.
- **Integridad de datos en la Purga**: El script de purga debe utilizar transacciones o eliminación en orden (`Cita` -> `Paciente`) respetando las claves foráneas y la integridad referencial.
