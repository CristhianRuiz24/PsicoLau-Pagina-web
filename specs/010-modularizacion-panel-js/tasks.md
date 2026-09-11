# Tareas - Spec 010 (Modularización de JS y CSS del Panel Clínico)

> **Estado:** COMPLETADO

## Fase 1: CSS Modular
- [x] **T1:** Crear estructura de carpetas en `panel/css/components/`.
- [x] **T2:** Extraer CSS de modales a `modal.css`.
- [x] **T3:** Extraer CSS de agenda a `agenda.css`.
- [x] **T4:** Configurar `panel.css` como entry point con `@import` de la W3C.

## Fase 2: Extracción HTML (Lazy Loading)
- [x] **T5:** Crear `panel/partials/modals/` y mover el HTML de los 8 modales allí (Cita, Excepción, Reporte, Expedientes, Notas, Configuración, etc.).
- [x] **T6:** Implementar `modalLoader.js` (`asegurarModal`) con caché en memoria.
- [x] **T7:** Limpiar `agenda.html` de los modales incrustados (reducción del 69% del DOM).

## Fase 3: Modularización de Agenda (`agenda.js`)
- [x] **T8:** Separar configuración y estado global (utils).
- [x] **T9:** Extraer lógica de pintado del calendario (render).
- [x] **T10:** Extraer lógica del formulario y selectores de colores (form).
- [x] **T11:** Extraer listeners y manipulación de estado (actions, ui).
- [x] **T12:** Cargar scripts como `type="module"` en `agenda.html`.

## Fase 4: Modularización de Expedientes (`expedientes.js`)
- [x] **T13:** Aislar cifrado/descifrado clínico AES-256-GCM.
- [x] **T14:** Extraer el directorio de pacientes y barra de búsqueda.
- [x] **T15:** Extraer formulario de notas in-place.
- [x] **T16:** Implementar lazy-loading: solo importar el módulo de expedientes cuando se presione el botón "Expedientes".

## Fase 5: Estabilización y QA
- [x] **T17:** Probar todo el flujo clínico manualmente sin API externa.
- [x] **T18:** Pasar suite completa del backend y validar CSP de `_headers`.
