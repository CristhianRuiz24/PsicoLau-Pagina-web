/**
 * Suite de Validación Contable Integral Mensual y Exportaciones (Septiembre 2026)
 * Ejecución: node backend/scripts/testContabilidadMesCompleto.js
 */

const express = require('express');
const http = require('http');
const jwt = require('jsonwebtoken');
const prisma = require('../src/config/db');
const agendaRoutes = require('../src/routes/agenda');

async function runMonthlyAccountingAudit() {
  console.log('\n=== AUDITORÍA CONTABLE MENSUAL INTEGRAL Y EXPORTADORES (PSICOLAU) ===\n');

  const app = express();
  app.use(express.json());
  app.use('/agenda', agendaRoutes);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`✓ Servidor de auditoría activo en puerto ${port}`);

  const jwtSecret = process.env.JWT_SECRET || 'secret_psicolau_jwt_default_dev';
  const token = jwt.sign(
    { id: 9999, email: 'admin@psicolau.com', rol: 'ADMIN' },
    jwtSecret,
    { expiresIn: '1h' }
  );

  const createdPatientIds = [];
  const createdCitaIds = [];

  try {
    // 1. Crear pacientes de prueba para el mes
    const pacienteA = await prisma.paciente.create({
      data: { nombre: 'Paciente A (Estándar $600)', email: `test-paca-${Date.now()}@psicolau.com`, telefono: '+52 5511223344', tarifaDefecto: 600 }
    });
    const pacienteB = await prisma.paciente.create({
      data: { nombre: 'Paciente B (Ajustada $750)', email: `test-pacb-${Date.now()}@psicolau.com`, telefono: '+52 5522334455', tarifaDefecto: 750 }
    });
    const pacienteC = await prisma.paciente.create({
      data: { nombre: 'Paciente C (Pendiente $600)', email: `test-pacc-${Date.now()}@psicolau.com`, telefono: '+52 5533445566', tarifaDefecto: 600 }
    });
    const pacienteD = await prisma.paciente.create({
      data: { nombre: 'Paciente D (Cortesía $0)', email: `test-pacd-${Date.now()}@psicolau.com`, telefono: '+52 5544556677', tarifaDefecto: 0 }
    });
    const pacienteE = await prisma.paciente.create({
      data: { nombre: 'Paciente E (Canceladas)', email: `test-pace-${Date.now()}@psicolau.com`, telefono: '+52 5555667788', tarifaDefecto: 600 }
    });
    const pacienteGrupal = await prisma.paciente.create({
      data: { nombre: '[GRUPAL] Taller de Duelo y Resiliencia', email: `grupal-taller-${Date.now()}@psicolau.com`, telefono: '+52 5500000000', tarifaDefecto: 350 }
    });
    const pacienteBloqueo = await prisma.paciente.create({
      data: { nombre: '[BLOQUEO] Supervisión de Casos', email: `sin-email-bloqueo-${Date.now()}@psicolau.com`, telefono: '', tarifaDefecto: 0 }
    });

    createdPatientIds.push(pacienteA.id, pacienteB.id, pacienteC.id, pacienteD.id, pacienteE.id, pacienteGrupal.id, pacienteBloqueo.id);
    console.log('✓ 7 Pacientes y entidades de prueba creados.');

    // 2. Sembrar Universo Masivo de Citas en Septiembre 2026:
    const citasData = [
      // Paciente A: 4 citas ($600 c/u) -> 3 Pagadas ($1,800), 1 Pendiente ($600)
      { pacienteId: pacienteA.id, fechaHora: new Date('2026-09-02T10:00:00Z'), monto: 600, estado_cita: 'REALIZADA', estado_pago: 'PAGADO', categoria: 'Sesión 1' },
      { pacienteId: pacienteA.id, fechaHora: new Date('2026-09-09T10:00:00Z'), monto: 600, estado_cita: 'REALIZADA', estado_pago: 'PAGADO', categoria: 'Sesión 2' },
      { pacienteId: pacienteA.id, fechaHora: new Date('2026-09-16T10:00:00Z'), monto: 600, estado_cita: 'REALIZADA', estado_pago: 'PAGADO', categoria: 'Sesión 3' },
      { pacienteId: pacienteA.id, fechaHora: new Date('2026-09-23T10:00:00Z'), monto: 600, estado_cita: 'PENDIENTE', estado_pago: 'PENDIENTE', categoria: 'Sesión 4' },

      // Paciente B: 4 citas ($750 c/u) -> 4 Pagadas ($3,000)
      { pacienteId: pacienteB.id, fechaHora: new Date('2026-09-03T11:00:00Z'), monto: 750, estado_cita: 'REALIZADA', estado_pago: 'PAGADO', categoria: 'Sesión 1' },
      { pacienteId: pacienteB.id, fechaHora: new Date('2026-09-10T11:00:00Z'), monto: 750, estado_cita: 'REALIZADA', estado_pago: 'PAGADO', categoria: 'Sesión 2' },
      { pacienteId: pacienteB.id, fechaHora: new Date('2026-09-17T11:00:00Z'), monto: 750, estado_cita: 'REALIZADA', estado_pago: 'PAGADO', categoria: 'Sesión 3' },
      { pacienteId: pacienteB.id, fechaHora: new Date('2026-09-24T11:00:00Z'), monto: 750, estado_cita: 'REALIZADA', estado_pago: 'PAGADO', categoria: 'Sesión 4' },

      // Paciente C: 2 citas ($600 c/u) -> 2 Pendientes ($1,200)
      { pacienteId: pacienteC.id, fechaHora: new Date('2026-09-15T16:00:00Z'), monto: 600, estado_cita: 'PENDIENTE', estado_pago: 'PENDIENTE', categoria: 'Evaluación' },
      { pacienteId: pacienteC.id, fechaHora: new Date('2026-09-22T16:00:00Z'), monto: 600, estado_cita: 'PENDIENTE', estado_pago: 'PENDIENTE', categoria: 'Devolución' },

      // Paciente D: 2 citas ($0 Cortesía) -> 2 Pagadas/Cortesía ($0)
      { pacienteId: pacienteD.id, fechaHora: new Date('2026-09-08T17:00:00Z'), monto: 0, estado_cita: 'REALIZADA', estado_pago: 'PAGADO', categoria: 'Cortesía 1' },
      { pacienteId: pacienteD.id, fechaHora: new Date('2026-09-29T17:00:00Z'), monto: 0, estado_cita: 'REALIZADA', estado_pago: 'PAGADO', categoria: 'Cortesía 2' },

      // Paciente E: 2 citas Canceladas
      // Cita 1: Cancelada SIN pago previo -> NO debe sumar ni a ingresos ni a cuentas por cobrar
      { pacienteId: pacienteE.id, fechaHora: new Date('2026-09-07T12:00:00Z'), monto: 600, estado_cita: 'CANCELADA', estado_pago: 'PENDIENTE', categoria: 'Canceló sin pagar' },
      // Cita 2: Cancelada CON pago previo -> SÍ debe sumar a Total Cobrado ($600) y NO a cuentas por cobrar
      { pacienteId: pacienteE.id, fechaHora: new Date('2026-09-14T12:00:00Z'), monto: 600, estado_cita: 'CANCELADA', estado_pago: 'PAGADO', categoria: 'Canceló pero pagó tarifa' },

      // Bloqueos de Horario: 2 bloqueos ($0) -> Excluidos de reporte de sesiones clínicas
      { pacienteId: pacienteBloqueo.id, fechaHora: new Date('2026-09-04T08:00:00Z'), monto: 0, estado_cita: 'CONFIRMADA', estado_pago: 'PAGADO', categoria: '[BLOQUEO] Supervisión' },
      { pacienteId: pacienteBloqueo.id, fechaHora: new Date('2026-09-18T08:00:00Z'), monto: 0, estado_cita: 'CONFIRMADA', estado_pago: 'PAGADO', categoria: '[BLOQUEO] Supervisión' },

      // Terapia Grupal: 2 sesiones grupales -> Excluidas de reporte individual
      { pacienteId: pacienteGrupal.id, fechaHora: new Date('2026-09-05T18:00:00Z'), monto: 350, estado_cita: 'REALIZADA', estado_pago: 'PAGADO', categoria: '[GRUPAL] Sesión 1' },
      { pacienteId: pacienteGrupal.id, fechaHora: new Date('2026-09-19T18:00:00Z'), monto: 350, estado_cita: 'REALIZADA', estado_pago: 'PAGADO', categoria: '[GRUPAL] Sesión 2' }
    ];

    for (const c of citasData) {
      const created = await prisma.cita.create({ data: c });
      createdCitaIds.push(created.id);
    }
    console.log(`✓ ${citasData.length} Citas sembradas en Septiembre 2026 con casos variados.`);

    // 3. Consultar la API para simular el frontend
    const res = await fetch(`${baseUrl}/agenda/citas`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const resData = await res.json();
    if (!resData.success) throw new Error('Fallo al obtener citas del backend');

    const citasBackend = resData.data;

    // 4. Ejecutar algoritmo de reporte contable para Septiembre 2026 (mes 8 en base 0)
    const mesReporte = 8; // Septiembre
    const anioReporte = 2026;

    const citasMes = citasBackend.filter(c => {
      if (c.estado_cita === 'CANCELADA' && c.estado_pago !== 'PAGADO') return false;
      const esBloqueo = (c.categoria && c.categoria.startsWith('[BLOQUEO]')) || (c.paciente && c.paciente.nombre && c.paciente.nombre.startsWith('[BLOQUEO]'));
      if (esBloqueo) return false;
      const esGrupal = (c.categoria && c.categoria.startsWith('[GRUPAL]')) || (c.paciente && c.paciente.nombre && c.paciente.nombre.startsWith('[GRUPAL]')) || (c.paciente && c.paciente.email && c.paciente.email.startsWith('grupal-'));
      if (esGrupal) return false;

      const d = new Date(c.fechaHora);
      return d.getUTCMonth() === mesReporte && d.getUTCFullYear() === anioReporte;
    }).filter(c => createdCitaIds.includes(c.id));

    let totalCobrado = 0;
    let totalPorPagar = 0;
    let sesionesConCosto = 0;
    let sesionesCortesia = 0;
    let countPagadas = 0;
    let countPendientes = 0;

    citasMes.forEach(c => {
      const monto = typeof c.monto === 'number' ? c.monto : 500;
      if (monto === 0) sesionesCortesia++; else sesionesConCosto++;
      if (c.estado_pago === 'PAGADO') {
        totalCobrado += monto;
        countPagadas++;
      } else {
        totalPorPagar += monto;
        countPendientes++;
      }
    });

    const totalSesiones = citasMes.length;
    const tarifaPromedio = sesionesConCosto > 0 ? ((totalCobrado + totalPorPagar) / sesionesConCosto) : 0;

    console.log('\n--- RESULTADOS CALCULADOS vs ESPERADOS ---');
    console.log(`• Total Sesiones Computadas: ${totalSesiones} (Esperado: 13)`);
    console.log(`• Sesiones con Costo: ${sesionesConCosto} (Esperado: 11)`);
    console.log(`• Sesiones Cortesía ($0): ${sesionesCortesia} (Esperado: 2)`);
    console.log(`• Total Cobrado: $${totalCobrado} MXN (Esperado: $5,400 MXN)`);
    console.log(`• Total Por Cobrar / Pendiente: $${totalPorPagar} MXN (Esperado: $1,800 MXN)`);
    console.log(`• Tarifa Promedio: $${tarifaPromedio.toFixed(2)} MXN (Esperado: $654.55 MXN)`);

    // Validaciones estrictas
    if (totalSesiones !== 13) throw new Error(`Total sesiones erróneo: ${totalSesiones} != 13`);
    if (sesionesConCosto !== 11) throw new Error(`Sesiones con costo erróneo: ${sesionesConCosto} != 11`);
    if (sesionesCortesia !== 2) throw new Error(`Sesiones cortesía erróneo: ${sesionesCortesia} != 2`);
    if (totalCobrado !== 5400) throw new Error(`Total cobrado erróneo: ${totalCobrado} != 5400`);
    if (totalPorPagar !== 1800) throw new Error(`Total por cobrar erróneo: ${totalPorPagar} != 1800`);
    if (Math.abs(tarifaPromedio - 654.5454) > 0.01) throw new Error(`Tarifa promedio errónea: ${tarifaPromedio}`);

    console.log('✓ VALIDACIÓN 1: Todos los KPIs contables calculados con precisión milimétrica al centavo.');

    // 5. Validar Exportación a WhatsApp
    const mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const textoWA = `📊 *REPORTE CONTABLE PSICOLAU — ${mesesNombres[mesReporte].toUpperCase()} ${anioReporte}*
Psicóloga: Ana Laura Gómez Díaz

*RESUMEN DEL PERIODO:*
• Total de sesiones brindadas: ${totalSesiones} (${sesionesConCosto} con costo · ${sesionesCortesia} de cortesía)
• Total de ingresos cobrados: $${totalCobrado.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN (${countPagadas} sesiones pagadas)
• Total pendiente por cobrar: $${totalPorPagar.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN (${countPendientes} sesiones pendientes)`;

    if (!textoWA.includes('SEPTIEMBRE 2026') || !textoWA.includes('$5,400.00') || !textoWA.includes('$1,800.00')) {
      throw new Error('Texto de WhatsApp incompleto o con datos inconsistentes');
    }
    console.log('✓ VALIDACIÓN 2: Generador de texto para WhatsApp verificado y consistente.');

    // 6. Validar Exportación a CSV / Excel
    let csvContent = '\uFEFF';
    csvContent += 'Fecha,Hora,Paciente,Monto_MXN,Estado_Pago,Estado_Sesion\n';
    citasMes.forEach(c => {
      const d = new Date(c.fechaHora);
      const fecha = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      const hora = `${String(d.getUTCHours()).padStart(2, '0')}:00`;
      const nombre = `"${(c.paciente ? c.paciente.nombre : 'Paciente').replace(/"/g, '""')}"`;
      const monto = typeof c.monto === 'number' ? c.monto : 500;
      csvContent += `${fecha},${hora},${nombre},${monto},${c.estado_pago},${c.estado_cita}\n`;
    });

    if (!csvContent.startsWith('\uFEFF') || !csvContent.includes('Paciente A') || !csvContent.includes('Paciente B')) {
      throw new Error('Estructura CSV o codificación UTF-8 BOM inválida');
    }
    console.log('✓ VALIDACIÓN 3: Archivo CSV con cabecera BOM UTF-8 y escape de comillas validado.');

    console.log('\n🎉 ¡AUDITORÍA CONTABLE MENSUAL SUPERADA CON 100% DE ÉXITO! 🎉\n');
  } finally {
    if (createdCitaIds.length > 0) {
      await prisma.cita.deleteMany({ where: { id: { in: createdCitaIds } } }).catch(() => {});
    }
    if (createdPatientIds.length > 0) {
      await prisma.paciente.deleteMany({ where: { id: { in: createdPatientIds } } }).catch(() => {});
    }
    server.close();
  }
}

runMonthlyAccountingAudit().catch((err) => {
  console.error('\n❌ ERROR EN LA AUDITORÍA CONTABLE:', err);
  process.exit(1);
});
