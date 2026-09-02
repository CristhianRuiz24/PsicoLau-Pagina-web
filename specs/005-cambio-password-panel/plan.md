# Plan Técnico 005 — Cambio de Contraseña desde el Panel Clínico

## 1. Resumen de la Solución Técnica
Implementar una solución de cambio de credenciales in-app segura, sencilla y ergonómica. Se añade un endpoint autenticado `PUT /api/auth/cambiar-password` protegido con rate limiting y validación criptográfica `bcrypt`. En el frontend, se incorpora un botón `[ 🔒 Seguridad ]` en la cabecera (junto al botón de `Salir`) que despliega un modal accesible con alternancia de visibilidad de contraseñas (mostrar/ocultar con icono de ojo) y renovación transparente del token JWT en `localStorage`.

---

## 2. Alineación con la Constitución
- **Autenticación real (Principio 4)**: El endpoint exige token JWT válido mediante `verificarToken`. No se admiten bypasses ni atajos.
- **Seguridad y Criptografía**: Hash `bcrypt` con costo 10 antes de persistir en base de datos.
- **Aislamiento Dev / Prod (Principio 2)**: Las pruebas automatizadas corren exclusivamente contra Supabase Dev y limpian/restauran la contraseña original.
- **No-regresión (Principio 6)**: No altera la sesión activa de Laura ni interfiere con la visualización de la agenda semanal.

---

## 3. Módulos y Archivos Afectados

```text
Componente       | Archivos                                    | Tipo de cambio
-----------------|---------------------------------------------|------------------
Backend Rutas    | backend/src/routes/auth.js                  | Modificar (Ruta y rate limiter)
Backend Lógica   | backend/src/controllers/authController.js   | Modificar (Función cambiarPassword)
Backend Validación| backend/src/utils/validators.js             | Modificar (Esquema cambiarPasswordSchema)
Frontend Vistas  | panel/agenda.html                           | Modificar (Botón cabecera y modal)
Frontend Lógica  | panel/js/app.js                             | Modificar (Controlador del modal y submit)
Frontend Estilos | panel/panel.css                             | Modificar (Estilos del modal y toggles 👁️)
Pruebas Auto     | backend/scripts/testCambioPassword.js       | Crear (Suite de regresión automatizada)
```

---

## 4. Modelo de Datos y Esquema (Prisma)
No se requieren migraciones ni cambios en `schema.prisma`. Se utiliza el modelo existente:
```prisma
model Usuario {
  id            Int      @id @default(autoincrement())
  email         String   @unique
  password_hash String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

---

## 5. Contratos de API / Endpoints

### `PUT /api/auth/cambiar-password`
- **Headers**:
  ```http
  Authorization: Bearer <token_jwt>
  Content-Type: application/json
  ```
- **Body**:
  ```json
  {
    "passwordActual": "MiClaveActual123",
    "passwordNueva": "MiNuevaClaveSegura2026",
    "confirmarPassword": "MiNuevaClaveSegura2026"
  }
  ```
- **Respuesta 200 OK**:
  ```json
  {
    "success": true,
    "message": "Contraseña actualizada exitosamente",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Respuestas de Error**:
  - `400 Bad Request`: Contraseña actual incorrecta, longitud menor a 8 caracteres, contraseñas no coinciden o nueva clave igual a la anterior.
  - `401 Unauthorized`: Token ausente, inválido o expirado.
  - `429 Too Many Requests`: Más de 5 intentos fallidos en 15 minutos.
  - `500 Internal Server Error`: Error no controlado.

---

## 6. Decisiones Técnicas y Alternativas Descartadas

| Decisión tomada | Razón técnica | Alternativa descartada y por qué |
|---|---|---|
| **Renovar JWT y mantener sesión abierta** | Maximiza la ergonomía y comodidad de Laura evitando interrupciones en su jornada. | *Cerrar sesión y forzar re-login*: Descartado porque rompe el flujo de trabajo de la usuaria sin aportar beneficio de seguridad adicional dado que ya demostró poseer la contraseña actual. |
| **Estándar de mínimo 8 caracteres libres** | Proporciona seguridad adecuada sin crear fricción con caracteres especiales forzados. | *Complejidad estricta (mayúscula, número y símbolo)*: Descartado por ser propenso a olvidos y errores tipográficos en dispositivos táctiles. |
| **Alternar visibilidad con icono 👁️** | Reduce drásticamente los errores al escribir contraseñas en pantallas táctiles o móviles. | *Solo campos enmascarados*: Descartado por frustración recurrente en usuarias al cometer erratas invisibles. |
| **Rate limiter dedicado (5 req / 15 min)** | Previene intentos automatizados de adivinación de la contraseña actual. | *Sin rate limit*: Descartado por vulnerabilidad a ataques de fuerza bruta. |

---

## 7. Estrategia de Pruebas y Validación
1. **Suite Automatizada (`backend/scripts/testCambioPassword.js`)**:
   - Validación de contraseña actual errónea (400).
   - Validación de longitud insuficiente < 8 caracteres (400).
   - Validación de discrepancia en confirmación (400).
   - Validación de nueva contraseña igual a la anterior (400).
   - Cambio exitoso (200) y verificación de login con la nueva clave.
   - Restauración segura de la clave original al finalizar el test.
2. **Verificación en Navegador**:
   - Abrir modal con botón `[ 🔒 Seguridad ]`.
   - Probar alternancia de visibilidad (👁️).
   - Probar flujo exitoso y comprobar permanencia de sesión sin recargas forzadas.
