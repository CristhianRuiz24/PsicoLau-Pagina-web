# Spec 013: Refactorización y Modularización de Pagos

## 1. Objetivo
Eliminar la duplicación de lógica de negocio contable (cálculo de tarifas base, normalización monetaria, agrupación por tipo de sesión) que actualmente se repite en la renderización y los tres formatos de exportación (WhatsApp, CSV, PDF) dentro de `pagos.js`. Además, se adaptará este módulo al nuevo estándar arquitectónico de ES Modules (ESM) implementado en la Spec 010.

*(Nota: Aunque el roadmap mencionaba `pagosController`, la auditoría confirmó que toda la lógica de exportación y consolidación financiera de PsicoLau reside y se ejecuta en el cliente dentro de `pagos.js`, por lo que el esfuerzo se centrará en el frontend).*

## 2. Requisitos Funcionales (EARS)

### 2.1. Centralización de Lógica de Negocio
- **RF-01 (Ubicuo)**: EL SISTEMA debe calcular el monto de la sesión en una única función utilitaria `obtenerMontoSesion(cita)`, respetando el valor explícito en `c.monto` si existe, o aplicando las tarifas por defecto vigentes (Ej. $4000 para Evaluaciones, $500 para Individual/Grupal).
- **RF-02 (Ubicuo)**: EL SISTEMA debe centralizar la detección del tipo de servicio en `detectarTipoCita(cita)`, garantizando que el reporte en pantalla, el CSV y el mensaje de WhatsApp clasifiquen exactamente igual a las sesiones.
- **RF-03 (Ubicuo)**: EL SISTEMA debe aplicar el formateo de moneda a través de una función central `formatearMoneda(monto)` utilizando `Intl.NumberFormat('es-MX')` para mantener consistencia visual.

### 2.2. Modularización (Arquitectura ESM)
- **RF-04 (Ubicuo)**: EL SISTEMA debe fragmentar el archivo monolítico `panel/js/pagos.js` en submódulos (ej. `utils/`, `render/`, `export/`, `actions/`) cargados bajo demanda o a través de un `index.js` principal, siguiendo el patrón de la `Spec 010`.
- **RF-05 (Evento)**: CUANDO la aplicación arranca, EL SISTEMA debe registrar las funciones globales necesarias para que los botones del HTML (ej. `onclick="abrirModalReporteMensual()"`) sigan funcionando sin requerir una reescritura masiva del DOM.

### 2.3. Funcionalidad Intacta
- **RF-06 (Evento)**: CUANDO el usuario exporta los datos (Copiar para Contadora o Descargar CSV), EL SISTEMA debe arrojar exactamente los mismos totales, subtotales y categorizaciones que la versión pre-refactorización.

## 3. Fuera de Alcance
- Creación de nuevos KPIs o vistas financieras.
- Modificaciones en la base de datos (Supabase) o en controladores de Express (la vista ya cuenta con toda la información necesaria en `citasCache`).
- Cambios de diseño CSS en las tarjetas y tablas de auditoría.
