# Spec 001 — Reporte Contable Mensual y Control de Ingresos

## 1. Contexto y Objetivo
Actualmente, la psicóloga Laura Gómez Díaz debe calcular manualmente cada fin de mes el número total de sesiones clínicas brindadas y el total de ingresos percibidos para reportarlo a su contadora. Dado que atiende pacientes con diversas tarifas históricas (pacientes nuevos, de años anteriores, tarifas especiales al 50% y sesiones de cortesía/supervisión a $0), el cálculo manual es propenso a errores y consume tiempo valioso.

Esta funcionalidad dota a la Suite Clínica de:
1. Registro de monto/tarifa por sesión en cada cita y persistencia de la tarifa habitual de cada paciente.
2. Un módulo de **Reporte Contable Mensual** que calcula automáticamente el total de sesiones, el total de ingresos cobrados y las sesiones pendientes de pago del mes.
3. Exportación en 1 clic mediante texto para WhatsApp, archivo CSV para Excel y vista de impresión/PDF formal.

---

## 2. Usuarios / Actores
- **Psicóloga / Administradora (Laura)**: Única usuaria del panel clínico autenticada con JWT. Requiere consultar métricas mensuales, ajustar montos de citas y exportar el reporte para su contadora.
- **Contadora Externa**: Receptora de los reportes mensuales (resumen numérico, total de ingresos y desglose por sesión en texto o CSV).

---

## 3. Historias de Usuario
- **H1**: Como psicóloga, quiero que cada cita tenga asignado su monto en pesos (MXN) para saber exactamente cuánto se cobró por cada sesión.
- **H2**: Como psicóloga, quiero que al agendar una cita para un paciente existente, el sistema recuerde y autocomplete su tarifa habitual para no tener que escribirla cada vez.
- **H3**: Como psicóloga, quiero seleccionar cualquier mes y año para ver al instante el total de sesiones realizadas y el total de dinero cobrado.
- **H4**: Como psicóloga, quiero exportar el reporte del mes a WhatsApp, Excel (CSV) o PDF para enviárselo a mi contadora en segundos sin hacer cuentas a mano.

---

## 4. Requisitos Funcionales (Criterios en Notación EARS)

### Gestión de Montos en Citas y Pacientes
- **RF-1 (Ubicuo)**: EL SISTEMA mantendrá un campo numérico `monto` (en MXN) para cada cita con un valor predeterminado de `$500.00` para citas nuevas sin tarifa explícita y datos históricos.
- **RF-2 (Evento)**: CUANDO la psicóloga seleccione o busque un paciente en el formulario de cita, EL SISTEMA autocompletará el campo de monto con la tarifa habitual de dicho paciente.
- **RF-3 (Evento)**: CUANDO la psicóloga pulse el botón rápido `$0 (Cortesía)` en el formulario de cita, EL SISTEMA establecerá el monto de la cita en `0`.
- **RF-4 (Evento)**: CUANDO la psicóloga guarde o edite una cita con un nuevo monto válido, EL SISTEMA actualizará el monto de esa sesión y actualizará la tarifa habitual en el perfil del paciente.
- **RF-5 (Excepción)**: SI la psicóloga introduce un monto negativo o no numérico, ENTONCES EL SISTEMA rechazará el guardado e indicará un mensaje de error visible.

### Módulo y Cálculo del Reporte Mensual
- **RF-6 (Evento)**: CUANDO la psicóloga abra el modal de Reporte Contable, EL SISTEMA cargará por defecto el mes y año en curso mostrando el resumen consolidado de dicho periodo.
- **RF-7 (Ubicuo)**: EL SISTEMA contabilizará como sesiones del mes únicamente aquellas citas cuya fecha corresponda al mes seleccionado y cuyo estado de cita sea `REALIZADA` o `CONFIRMADA`.
- **RF-8 (Ubicuo)**: EL SISTEMA excluirá del reporte contable todas las citas marcadas como `CANCELADA`, los registros de tipo `[BLOQUEO]` y los módulos de terapia grupal `[GRUPAL]`.
- **RF-9 (Ubicuo)**: EL SISTEMA calculará el Total de Ingresos Cobrados sumando los montos de las sesiones realizadas/confirmadas que tengan estado de pago `PAGADO`.
- **RF-10 (Ubicuo)**: EL SISTEMA mostrará un desglose claro de:
  - Total de sesiones realizadas (diferenciando sesiones con costo vs. sesiones de cortesía a $0).
  - Total de ingresos cobrados ($ MXN).
  - Total pendiente de cobro ($ MXN y cantidad de sesiones pendientes).
  - Tabla cronológica detallada con: Fecha/Hora, Paciente, Monto, Estado de Cita y Estado de Pago.

### Exportación y Entrega
- **RF-11 (Evento)**: CUANDO la psicóloga haga clic en "Copiar para WhatsApp", EL SISTEMA copiará al portapapeles un resumen estructurado y legible con el total de sesiones, total de ingresos y la lista de cobros del mes, mostrando una notificación de confirmación.
- **RF-12 (Evento)**: CUANDO la psicóloga haga clic en "Descargar Excel (CSV)", EL SISTEMA generará y descargará inmediatamente un archivo `.csv` codificado en UTF-8 con BOM compatible con Microsoft Excel conteniendo las columnas de fecha, hora, paciente, monto y estado.
- **RF-13 (Evento)**: CUANDO la psicóloga haga clic en "Imprimir / PDF", EL SISTEMA abrirá el diálogo nativo de impresión con estilos optimizados para hoja membretada de PsicoLau.
- **RF-14 (Evento)**: CUANDO la psicóloga navegue entre meses mediante los selectores o flechas anterior/siguiente, EL SISTEMA recalculará y actualizará instantáneamente todas las métricas y la tabla.

---

## 5. Requisitos No Funcionales & Seguridad
- **Seguridad y Privacidad**:
  - Todo acceso a las rutas del reporte contable y actualización de montos requiere autenticación JWT válida mediante `authMiddleware.js`.
  - Los reportes no exponen notas ni diagnósticos clínicos del paciente (respetando el Principio 1 de `docs/constitution.md`).
- **Rendimiento**:
  - El filtrado y cálculo del reporte debe responder de forma instantánea (< 200 ms) en el navegador del usuario.
- **Compatibilidad**:
  - La interfaz debe ser completamente responsiva en móvil y escritorio, con soporte para modo de impresión en papel o PDF limpio.

---

## 6. Casos Límite y Manejo de Errores
- **Mes sin citas registradas**: El sistema mostrará un estado amigable indicando que no hubo sesiones en el mes seleccionado con valores en $0.00.
- **Citas con monto $0**: Se registran como sesiones válidas realizadas pero no incrementan el total monetario, etiquetándose como "Cortesía / Sin costo".
- **Citas recurrentes en lote**: Al crear citas recurrentes (2 a 12 sesiones), todas las sesiones de la serie heredarán el monto fijado en el formulario.
- **Pérdida de sesión / Token expirado**: Si el token JWT expira mientras se consulta el reporte, se redirige de forma segura a `/panel/index.html`.

---

## 7. Fuera de Alcance (Out of Scope)
- Timbrado fiscal electrónico o emisión de facturas CFDI/SAT (la contadora realiza este trámite fuera de la plataforma).
- Pasarela de cobro integrada con tarjeta en tiempo real (los cobros se reciben de forma externa vía transferencias bancarias o PayPal).
- Gestión de gastos operativos o deducciones fiscales (el módulo se enfoca exclusivamente en sesiones e ingresos).

---

## 8. Criterios de Finalización (Definition of Done)
- [ ] Modelo de base de datos y endpoints del backend actualizados con soporte de `monto` y `tarifaDefecto`.
- [ ] Modal de agendar cita con selector de monto, autocompletado y botón rápido de `$0 Cortesía`.
- [ ] Modal de Reporte Contable Mensual completamente operativo con navegación mensual y métricas en vivo.
- [ ] Los 3 métodos de exportación (WhatsApp, CSV y Print/PDF) probados y funcionales.
- [ ] Citas históricas inicializadas con monto por defecto de $500.00.
- [ ] Principios de `docs/constitution.md` y `AGENTS.md` respetados al 100%.
