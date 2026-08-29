# Plan Técnico 001 — Reporte Contable Mensual y Control de Ingresos

## 1. Resumen de la Solución Técnica
Esta funcionalidad introduce el control de montos y tarifas por sesión en la Suite Clínica PsicoLau, junto con un módulo de consolidación contable mensual que calcula ingresos cobrados, citas por cobrar y sesiones de cortesía ($0), con exportación a WhatsApp, CSV (Excel) y PDF.

La arquitectura se divide en 3 capas:
1. **Base de Datos (Prisma/PostgreSQL)**: Se añade `monto` a `Cita` (por defecto `500.00`) y `tarifaDefecto` a `Paciente` (por defecto `500.00`).
2. **Backend API (Express/Node.js)**: Los controladores de agenda gestionan el guardado de `monto` en citas individuales y recurrentes, sincronizando la tarifa habitual del paciente.
3. **Frontend (Vanilla JS/CSS)**:
   - Integración del campo de monto en el modal de citas con autocompletado y botón `$0 Cortesía`.
   - Nuevo modal de "Reporte Contable Mensual" con filtros de mes/año, tarjetas de KPIs, tabla de desglose y exportadores en 1 clic.

---

## 2. Alineación con la Constitución

| Principio | Cumplimiento en esta feature |
|---|---|
| **1. Cifrado y Privacidad** | El reporte contable maneja únicamente metadatos administrativos (fecha, nombre, monto, estado de pago). **Nunca** incluye notas clínicas ni diagnósticos. |
| **2. Separación Dev / Prod** | El esquema y pruebas se ejecutan primero en la base de datos de desarrollo en Supabase. |
| **3. Frontend Simple** | Implementado con HTML5, CSS vanilla y JS vanilla, sin dependencias externas de reporting. |
| **4. Autenticación Real** | Todas las llamadas al backend requieren cabecera `Authorization: Bearer <token_jwt>`. |
| **5. CORS Explícito** | Sin modificaciones al middleware seguro existente. |
| **6. No Regresiones** | El flujo de agendamiento, visualización semanal y confirmación de citas permanece 100% intacto. |

---

## 3. Módulos y Archivos Afectados

```text
Componente       | Archivos                           | Tipo de cambio
-----------------|-----------------------------------|------------------
Base de Datos    | backend/prisma/schema.prisma      | Modificar (campos monto y tarifaDefecto)
Backend API      | backend/src/controllers/agendaController.js | Modificar (soporte monto y tarifa)
Backend API      | backend/src/controllers/pacienteController.js (si aplica) | Modificar
Backend Script   | backend/scripts/testContabilidad.js | Crear (test automatizado de endpoints)
Frontend Layout  | panel/agenda.html                 | Modificar (botón cabecera, inputs y modal reporte)
Frontend Lógica  | panel/js/pagos.js (o contabilidad.js) | Modificar / Crear (lógica de reporte y exportación)
Frontend Lógica  | panel/js/agenda.js                | Modificar (autocompletado de tarifa al agendar)
Frontend Estilos | panel/panel.css                   | Modificar (diseño de modal, tarjetas KPI y print)
```

---

## 4. Modelo de Datos y Esquema

```prisma
model Paciente {
  id            Int          @id @default(autoincrement())
  nombre        String
  telefono      String
  email         String       @unique
  enlaceZoom    String?
  tarifaDefecto Float?       @default(500) // Tarifa habitual acordada con el paciente
  citas         Cita[]
  expedientes   Expediente[]
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
}

model Cita {
  id             Int                @id @default(autoincrement())
  pacienteId     Int
  paciente       Paciente           @relation(fields: [pacienteId], references: [id], onDelete: Cascade)
  fechaHora      DateTime
  categoria      String?            
  color          String?            @default("#3EB8CC")
  monto          Float              @default(500) // Monto de la sesión en MXN
  estado_cita    EstadoCita         @default(PENDIENTE)
  estado_pago    EstadoPago         @default(PENDIENTE)
  notificaciones LogNotificacion[]
  createdAt      DateTime           @default(now())
  updatedAt      DateTime           @updatedAt
}
```

---

## 5. Contratos de API / Endpoints

### `POST /api/agenda/citas` (Modificado)
- **Headers**: `Authorization: Bearer <jwt_token>`
- **Body**:
  ```json
  {
    "nombre": "Paciente Ejemplo",
    "telefono": "+525512345678",
    "fechaHora": "2026-08-28T10:00:00.000Z",
    "monto": 1000.00,
    "categoria": "Sesión Individual",
    "color": "#EC5E86",
    "repeticiones": 1,
    "frecuencia": "SEMANAL"
  }
  ```
- **Respuesta 201 Created**: Cita creada con `monto: 1000.00` y `Paciente.tarifaDefecto` actualizado a `1000.00`.

### `PUT /api/agenda/citas/:id` (Modificado)
- **Headers**: `Authorization: Bearer <jwt_token>`
- **Body**:
  ```json
  {
    "nombre": "Paciente Ejemplo",
    "fechaHora": "2026-08-28T10:00:00.000Z",
    "monto": 800.00,
    "categoria": "...",
    "color": "#3EB8CC"
  }
  ```
- **Respuesta 200 OK**: Cita actualizada con nuevo `monto`.

### `PATCH /api/agenda/citas/:id/monto` (Nuevo)
- **Headers**: `Authorization: Bearer <jwt_token>`
- **Body**:
  ```json
  {
    "monto": 800.00
  }
  ```
- **Respuesta 200 OK**: Actualización rápida del monto.

---

## 6. Decisiones Técnicas y Alternativas Descartadas

| Decisión tomada | Razón técnica | Alternativa descartada y por qué |
|---|---|---|
| **Monto en Cita + Tarifa en Paciente** | Permite que cada cita conserve su precio histórico inmutable aunque el paciente cambie de tarifa a futuro. | *Tarifa solo en Paciente*: Descartado porque si Laura sube precios en 2027, alteraría retrospectivamente los reportes contables de 2026. |
| **Generación de CSV y WhatsApp en Frontend** | Cero latencia, no requiere procesamiento en servidor ni librerías pesadas en Node.js. Formato UTF-8 con BOM garantiza compatibilidad con Excel en Windows/Mac. | *Generación de reportes PDF/Excel en backend con librerías*: Descartado por sobrecarga de dependencias (Puppeteer, xlsx) innecesarias. |
| **Filtro de reportes en memoria del cliente** | Las citas ya residen en caché en el panel; calcular el reporte mensual en cliente toma < 5 ms sin peticiones de red redundantes. | *Endpoint dedicado con aggregation queries*: Descartado para mantener el panel ultra responsivo sin latencia de red. |

---

## 7. Estrategia de Pruebas y Validación
1. **Prueba de Base de Datos**: `npx prisma db push` y verificación de columnas `monto` y `tarifaDefecto`.
2. **Script de Prueba Backend**: `node backend/scripts/testContabilidad.js` validando creación con monto, edición de monto, y actualización de tarifa en paciente.
3. **Prueba Manual de Frontend**:
   - Agendar cita con monto $1000 y verificar autocompletado en siguiente cita.
   - Probar botón `$0 Cortesía`.
   - Abrir Reporte Mensual, cambiar entre meses, verificar sumas y probar las 3 exportaciones (WhatsApp, CSV, Imprimir).
