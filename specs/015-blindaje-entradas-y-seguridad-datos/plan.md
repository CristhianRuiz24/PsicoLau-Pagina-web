# Plan Técnico 015 — Blindaje de Entradas, Sanitización Anti-Inyecciones (XSS / CSV) y Purga de Datos

## 1. Resumen de la Solución Técnica
Implementación de un blindaje semántico de validación por lista blanca (*whitelist*) en todos los esquemas de entrada de la API (`backend/src/utils/validators.js`) utilizando Zod y expresiones regulares Unicode. Se neutraliza el vector de inyección de fórmulas CSV (CWE-1236) en `panel/js/pagos/export/csv.js` mediante el estándar OWASP de prefijado seguro con apóstrofe (`'`). Se crea un script de purga transaccional idempotente (`backend/scripts/purgeTestData.js`) para restaurar la higiene de la base de datos eliminando registros residuales de escaneos y tests. Finalmente, se diseña una suite automatizada de pruebas negativas de abuso (`backend/scripts/testBlindajeEntradas.js`) conectada al test runner `npm test`.

---

## 2. Alineación con la Constitución

- **Principio 1 (Cifrado de datos sensibles)**: No se alteran ni debilitan los 8 campos clínicos cifrados con `AES-256-GCM` en `Expediente`.
- **Principio 2 (Separación Dev / Producción)**: El script de purga opera exclusivamente sobre registros identificados mediante firmas unívocas de prueba (`ZAP`, `http://`, `Paciente Test`, `paciente random`), protegiendo los datos clínicos reales en cualquier entorno.
- **Principio 3 (Frontend simple sin dependencias)**: La neutralización en `csv.js` se implementa en Vanilla JS puro sin librerías externas.
- **Principio 4 (Autenticación real)**: Se respeta el aislamiento entre formularios públicos y el panel administrativo autenticado con JWT.
- **Principio 5 (Superficie de ataque reducida)**: Se mitigan de raíz los vectores CWE-20 (Improper Input Validation), CWE-1236 (CSV Injection) y CWE-79 (Stored XSS latente).
- **Principio 6 (No romper lo que ya funciona)**: Se preserva la compatibilidad con nombres con acentos, diéresis, ñ y los prefijos clínicos `[GRUPAL]`, `[BLOQUEO]` y `[EVALUACION]`.

---

## 3. Módulos y Archivos Afectados

```text
Componente       | Archivos                                    | Tipo de cambio
-----------------|---------------------------------------------|------------------
Backend Core     | backend/src/utils/validators.js             | Modificar (Regex de nombre, teléfono y mensaje)
Panel Clínico    | panel/js/pagos/export/csv.js                | Modificar (Mitigación de fórmulas CSV CWE-1236)
Base de Datos    | backend/scripts/purgeTestData.js            | Crear (Script transaccional de purga)
QA / Seguridad   | backend/scripts/testBlindajeEntradas.js     | Crear (Suite de pruebas adversarias en npm test)
```

---

## 4. Decisiones Técnicas y Alternativas Descartadas

### D1: Expresión Regular Unicode para Nombres Humanos
- **Estrategia Elegida**: `/^[\p{L}\s.'\-]+$/u` con longitud entre 2 y 100 caracteres, complementada con rechazo explícito de secuencias de protocolo (`http://`, `https://`, `www.`).
- **Alternativa Descartada**: Expresión regular ASCII básica (`/^[a-zA-Z\s]+$/`).
  - *Motivo del descarte*: Rechazaría de forma errónea nombres hispanos legítimos con tildes (Ángel, María), eñes (Peña, Muñoz), diéresis (Argüelles) o apellidos compuestos con guiones o apóstrofes (O'Connor, Ruiz-Gómez).

### D2: Validación Estricta de Teléfonos
- **Estrategia Elegida**: Permitir únicamente dígitos, espacios y caracteres de marcación internacional (`+`, `-`, `()`, `.`), exigiendo entre 7 y 20 dígitos numéricos reales tras remover símbolos de formato:
  `telefono.replace(/\D/g, '').length >= 7 && telefono.replace(/\D/g, '').length <= 20`.
- **Alternativa Descartada**: Validación basada únicamente en longitud de cadena de texto (`min(8).max(20)`).
  - *Motivo del descarte*: Permitió en el pasado inyectar cadenas de texto y scripts si cumplían con la longitud requerida.

### D3: Control de Spam en Mensaje de Contacto
- **Estrategia Elegida**: Rechazar mensajes con más de 2 URLs (conteo de `https?://` o `www.`) o que contengan etiquetas HTML ejecutables (`<script>`, `<iframe>`, `<object>`, `<embed>`, `<a `).
- **Alternativa Descartada**: Prohibir el 100% de los enlaces.
  - *Motivo del descarte*: Afectaría negativamente a pacientes reales que adjuntan un enlace a su caso o perfil legítimo.

### D4: Neutralización de Inyección CSV (CWE-1236)
- **Estrategia Elegida**: Función `sanitizarCeldaCSV(valor)` que antepone un apóstrofe (`'`) si el valor (tras eliminar espacios) comienza con `=`, `+`, `-` o `@`.
- **Alternativa Descartada**: Borrar los caracteres maliciosos o depender de que el usuario no use signos contables.
  - *Motivo del descarte*: Borrar caracteres corrompe datos legítimos (ej. un teléfono que empieza con `+` o una nota que empieza con guion). El apóstrofe le indica explícitamente a Excel que debe renderizar la celda como texto puro.

---

## 5. Modelo de Datos y Esquema
No se requieren modificaciones en `backend/prisma/schema.prisma`. El script de purga ejecuta consultas Prisma estándar con `deleteMany` para garantizar integridad referencial.
