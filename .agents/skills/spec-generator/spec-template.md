# Spec 00X — <Nombre de la Funcionalidad>

## 1. Contexto y Objetivo
<Qué problema resuelve y por qué es valiosa esta funcionalidad. 1 o 2 párrafos concisos.>

## 2. Usuarios / Actores
- **<Rol 1>**: <Quién es y cómo interactúa con esta funcionalidad.>
- **<Rol 2>**: <...>

## 3. Historias de Usuario
- **H1**: Como `<actor>` quiero `<acción / objetivo>` para `<beneficio / valor>`.
- **H2**: Como `<actor>` quiero `<acción / objetivo>` para `<beneficio / valor>`.

## 4. Requisitos Funcionales (Criterios en Notación EARS)
- **RF-1**: CUANDO `<evento / acción del usuario>`, EL SISTEMA `<resultado esperado>`.
- **RF-2**: SI `<condición no deseada / error / dato inválido>`, ENTONCES EL SISTEMA `<respuesta o mensaje claro>`.
- **RF-3**: MIENTRAS `<estado o condición activa>`, EL SISTEMA `<comportamiento continuo>`.
- **RF-4**: EL SISTEMA `<comportamiento permanente / regla global>`.
- **RF-5**: DONDE `<característica opcional o flag>`, EL SISTEMA `<comportamiento específico>`.

## 5. Requisitos No Funcionales & Seguridad
- **Seguridad**: <Cifrado, autenticación, protección de datos sensibles, CORS según docs/constitution.md.>
- **Rendimiento / Usabilidad**: <Tiempos de respuesta, accesibilidad, compatibilidad móvil.>

## 6. Casos Límite y Manejo de Errores
- <Qué ocurre si el usuario cancela a mitad del flujo.>
- <Qué ocurre si no hay conexión a internet o la DB responde con error.>
- <Qué ocurre con entradas duplicadas o vacías.>

## 7. Fuera de Alcance (Out of Scope)
- <Qué NO se va a construir en esta iteración para evitar scope creep.>

## 8. Criterios de Finalización (Definition of Done)
- [ ] Todos los requisitos funcionales (RF-1..n) comprobados y funcionando.
- [ ] Respeta los principios de `docs/constitution.md`.
- [ ] No rompe flujos existentes del sistema.
- [ ] Verificación obligatoria de `AGENTS.md` cumplida.

## 9. Dudas Abiertas / Pendientes de Aclaración
- [ ] `[NECESITA ACLARACIÓN: ...]`
