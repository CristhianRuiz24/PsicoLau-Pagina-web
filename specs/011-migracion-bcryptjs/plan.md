# Plan Técnico - Spec 011 (Migración a bcryptjs)

## 1. Módulos Afectados
- `backend/package.json` (Dependencias)
- `backend/src/controllers/authController.js` (Login y Cambio de Contraseña)
- `backend/scripts/seedUser.js` (Script de sembrado manual)
- `backend/scripts/testCambioPassword.js` (Test automatizado)

## 2. Modelo de Datos
- **Sin cambios.** La base de datos (Prisma/PostgreSQL) seguirá almacenando los hashes en formato estándar BCrypt (cadena de caracteres de 60 bytes, e.g., `$2a$10$...` o `$2b$10$...`). `bcryptjs` es totalmente capaz de verificar hashes generados por `bcrypt` nativo.

## 3. Decisiones Técnicas
- **Alternativa Descartada:** Usar `@node-rs/bcrypt` (Rust nativo).
- **Motivo del Descarte:** Aunque es más rápido que `bcryptjs`, introduce binarios precompilados de Rust. Nuestro objetivo principal es erradicar cualquier tipo de binario de compilación cruzada o dependencias de bajo nivel que nos causen problemas de vulnerabilidades en el árbol de dependencias de `npm audit` o problemas de compatibilidad en Windows/Linux.
- **Decisión Final:** Usar `bcryptjs`. Al ser 100% JavaScript, su instalación es instantánea, sin binarios nativos, garantizando 0 vulnerabilidades (como el problema de `tar`). El costo del hash se mantendrá en `10`.
