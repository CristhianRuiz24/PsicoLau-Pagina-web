// --- Renderizado del Reporte Contable Mensual y Tarjetas de KPIs ---

import { detectarTipoCita, obtenerMontoSesion, formatearMoneda, obtenerCitasReportePeriodo } from '../utils/contabilidad.js';
import { getMesReporte, getAnioReporte } from '../utils/periodo.js';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Renderiza el reporte mensual contable, calcula KPIs y llena la tabla
 */
export function renderReporteMensual() {
  const cache = (typeof window !== 'undefined' && Array.isArray(window.citasCache)) ? window.citasCache : [];
  const mes = getMesReporte();
  const anio = getAnioReporte();
  const citasMes = obtenerCitasReportePeriodo(cache, mes, anio);
  const tbody = document.getElementById('reporteTablaBody');

  let totalSesiones = citasMes.length;
  let sesionesConCosto = 0;
  let sesionesCortesia = 0;
  let totalCobrado = 0;
  let totalPorPagar = 0;
  let sumaMontosConCosto = 0;
  let countPendientes = 0;
  let countPagadas = 0;

  citasMes.forEach(c => {
    const tipo = detectarTipoCita(c);
    const monto = obtenerMontoSesion(c, tipo);

    if (monto === 0) {
      sesionesCortesia++;
    } else {
      sesionesConCosto++;
      sumaMontosConCosto += monto;
    }

    if (c.estado_pago === 'PAGADO') {
      totalCobrado += monto;
      countPagadas++;
    } else {
      totalPorPagar += monto;
      countPendientes++;
    }
  });

  const tarifaPromedio = sesionesConCosto > 0 ? (sumaMontosConCosto / sesionesConCosto) : 0;

  // Actualizar Tarjetas KPIs
  const kpiCobrado = document.getElementById('kpiTotalCobrado');
  const kpiSubCobrado = document.getElementById('kpiSubCobrado');
  const kpiSesiones = document.getElementById('kpiTotalSesiones');
  const kpiSubSesiones = document.getElementById('kpiSubSesiones');
  const kpiPorCobrar = document.getElementById('kpiTotalPorCobrar');
  const kpiSubPorCobrar = document.getElementById('kpiSubPorCobrar');
  const kpiPromedio = document.getElementById('kpiTarifaPromedio');

  if (kpiCobrado) kpiCobrado.textContent = formatearMoneda(totalCobrado);
  if (kpiSubCobrado) kpiSubCobrado.textContent = `${countPagadas} sesión${countPagadas === 1 ? '' : 'es'} pagada${countPagadas === 1 ? '' : 's'}`;
  
  if (kpiSesiones) kpiSesiones.textContent = totalSesiones;
  if (kpiSubSesiones) kpiSubSesiones.textContent = `${sesionesConCosto} con costo · ${sesionesCortesia} cortesía ($0)`;

  if (kpiPorCobrar) kpiPorCobrar.textContent = formatearMoneda(totalPorPagar);
  if (kpiSubPorCobrar) kpiSubPorCobrar.textContent = `${countPendientes} sesión${countPendientes === 1 ? '' : 'es'} pendiente${countPendientes === 1 ? '' : 's'}`;

  if (kpiPromedio) kpiPromedio.textContent = formatearMoneda(tarifaPromedio);

  if (!tbody) return;

  if (citasMes.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 3rem 1rem; color: #64748b;">
          <i class="fa-solid fa-calendar-xmark" style="font-size: 2rem; color: #cbd5e1; margin-bottom: 0.5rem; display: block;"></i>
          <strong style="color: #334155; font-size: 1rem;">No hay sesiones registradas en este periodo</strong>
          <p style="font-size: 0.85rem; margin: 0.3rem 0 0 0;">Las citas agendadas y realizadas aparecerán automáticamente aquí.</p>
        </td>
      </tr>
    `;
    return;
  }

  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  let html = '';
  citasMes.forEach(c => {
    const d = new Date(c.fechaHora);
    const fechaTxt = `${diasSemana[d.getDay()]} ${d.getDate()} ${meses[d.getMonth()]}`;
    const horaTxt = d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
    const tipo = detectarTipoCita(c);
    const nombre = c.paciente ? c.paciente.nombre.replace(/^\[(BLOQUEO|GRUPAL|EVALUACION)\]\s*/i, '').trim() : 'Paciente';
    const monto = obtenerMontoSesion(c, tipo);
    const esPagado = c.estado_pago === 'PAGADO';
    const esCancelada = c.estado_cita === 'CANCELADA';
    const esRealizada = !esCancelada && (c.estado_cita === 'REALIZADA' || c.estado_cita === 'CONFIRMADA');

    let badgeTipoHtml = '';
    if (tipo === 'GRUPAL') {
      badgeTipoHtml = '<span class="badge-servicio-grupal" style="font-size: 0.7rem; font-weight: 800; background: #f3e8ff; color: #6b21a8; padding: 2px 7px; border-radius: 4px; display: inline-flex; align-items: center; gap: 3px;"><i class="fa-solid fa-people-group"></i> Grupal</span>';
    } else if (tipo === 'EVALUACION') {
      badgeTipoHtml = '<span class="badge-servicio-evaluacion" style="font-size: 0.7rem; font-weight: 800; background: #e0e7ff; color: #4338ca; padding: 2px 7px; border-radius: 4px; display: inline-flex; align-items: center; gap: 3px;"><i class="fa-solid fa-brain"></i> Evaluación</span>';
    } else {
      badgeTipoHtml = '<span class="badge-servicio-individual" style="font-size: 0.7rem; font-weight: 700; background: #e0f2fe; color: #0369a1; padding: 2px 7px; border-radius: 4px; display: inline-flex; align-items: center; gap: 3px;"><i class="fa-solid fa-user"></i> Individual</span>';
    }

    html += `
      <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s;">
        <td style="padding: 0.65rem 0.8rem; font-weight: 600; color: #0f172a; white-space: nowrap;">
          <span>${fechaTxt}</span> <span style="font-size: 0.8rem; color: #64748b; font-weight: 500;">· ${horaTxt}</span>
        </td>
        <td style="padding: 0.65rem 0.8rem; font-weight: 600; color: #334155;">
          <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            <span>${escapeHtml(nombre)}</span>
            ${badgeTipoHtml}
          </div>
        </td>
        <td style="padding: 0.65rem 0.8rem; text-align: right; font-weight: 800; color: ${monto === 0 ? '#64748b' : '#0f172a'};">
          ${monto === 0 ? '<span style="background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 4px; font-size: 0.78rem;">$0 Cortesía</span>' : formatearMoneda(monto)}
        </td>
        <td style="padding: 0.65rem 0.8rem; text-align: center;">
          ${esCancelada
            ? `<span style="font-size: 0.72rem; padding: 2px 7px; border-radius: 4px; background: #fee2e2; color: #991b1b; font-weight: 700;">✕ Cancelada (Pagada)</span>`
            : (esRealizada 
              ? `<span style="font-size: 0.72rem; padding: 2px 7px; border-radius: 4px; background: #dcfce7; color: #15803d; font-weight: 700;">✓ Realizada</span>`
              : `<span style="font-size: 0.72rem; padding: 2px 7px; border-radius: 4px; background: #fef9c3; color: #854d0e; font-weight: 700;">Agendada</span>`
            )
          }
        </td>
        <td style="padding: 0.65rem 0.8rem; text-align: center;">
          <button type="button" onclick="togglePagoDesdeReporte(${c.id})" title="Clic para alternar estado de pago" style="cursor: pointer; border: none; background: none; padding: 0;">
            ${esPagado 
              ? `<span style="font-size: 0.72rem; padding: 3px 8px; border-radius: 4px; background: #dcfce7; color: #166534; font-weight: 700; display: inline-flex; align-items: center; gap: 3px;"><i class="fa-solid fa-circle-check"></i> Pagado</span>`
              : `<span style="font-size: 0.72rem; padding: 3px 8px; border-radius: 4px; background: #fee2e2; color: #991b1b; font-weight: 700; display: inline-flex; align-items: center; gap: 3px;"><i class="fa-solid fa-clock"></i> Por pagar</span>`
            }
          </button>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}
