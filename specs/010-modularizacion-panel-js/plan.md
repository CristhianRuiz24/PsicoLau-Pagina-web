# Plan Técnico - Spec 010 (Modularización de JS y CSS del Panel Clínico)

> **Estado:** COMPLETADO

## 1. Módulos Afectados
- `panel/js/agenda.js` (Monolito original) → Se divide en `panel/js/agenda/` (utils, ui, form, render, actions).
- `panel/js/expedientes.js` (Monolito original) → Se divide en `panel/js/expedientes/` (utils, ui, form, render, paciente, directorio).
- `panel/agenda.html` → Se extraen los 8 modales a `panel/partials/modals/` y se inyectan bajo demanda con `fetch()`.
- `panel/css/panel.css` → Se divide en 15 componentes en `panel/css/components/` (modal.css, agenda.css, forms.css, etc.).

## 2. Modelo de Datos
- **Sin cambios.** La interacción con Prisma y la base de datos se mantiene idéntica. El refactor es puramente de frontend.

## 3. Decisiones Técnicas
- **Alternativa Descartada:** Migrar el frontend a React/Vite.
- **Motivo del Descarte:** Viola el principio constitucional de "Frontend Ligero sin build steps".
- **Decisión Final:** Utilizar Vanilla JS nativo con ES Modules (`type="module"`). Se usarán importaciones estáticas para la Agenda (carga crítica) e importaciones dinámicas (`import()`) para los Expedientes, ahorrando +60KB iniciales.
- **Carga de Modales HTML:** Se desarrolló la utilidad `modalLoader.js` con la función `asegurarModal()` que usa `fetch()` para traer el HTML de los modales solo cuando el usuario los abre, reduciendo el tamaño del DOM de `agenda.html` en un 69%.
