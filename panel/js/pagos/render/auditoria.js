// --- Renderizado del Modal de Auditoría de Pagos y Cuentas por Cobrar ---

import { detectarTipoCita } from '../utils/contabilidad.js';

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
 * Cambia el filtro activo de auditoría entre 'SEMANA' y 'TODAS'
 * @param {'SEMANA' | 'TODAS'} filtro 
 */
export function cambiarFiltroAuditoria(filtro) {
  if (typeof window !== 'undefined') {
    window.filtroAuditoriaActual = filtro;
  }
  const btnSemana = document.getElementById('tabAuditSemana');
  const btnTodas = document.getElementById('tabAuditTodas');
  if (btnSemana && btnTodas) {
    btnSemana.classList.toggle('active', filtro === 'SEMANA');
    btnTodas.classList.toggle('active', filtro === 'TODAS');
  }
  renderAuditoriaPagos();
}

/**
 * Renderiza la lista de sesiones pendientes de cobro en el modal de auditoría
 */
export function renderAuditoriaPagos() {
  const container = document.getElementById('auditListaContainer');
  const subtitulo = document.getElementById('auditSubtitulo');
  if (!container) return;

  const cache = (typeof window !== 'undefined' && Array.isArray(window.citasCache)) ? window.citasCache : [];
  const filtro = (typeof window !== 'undefined' && window.filtroAuditoriaActual) ? window.filtroAuditoriaActual : 'SEMANA';

  // Filtrar citas no canceladas, no pagadas y que no sean bloqueos
  let pendientes = cache.filter(c => {
    if (c.estado_cita === 'CANCELADA') return false;
    if (c.estado_pago === 'PAGADO') return false;
    if (detectarTipoCita(c) === 'BLOQUEO') return false;
    return true;
  });

  if (filtro === 'SEMANA') {
    const hoy = new Date();
    const diaSemanaHoy = hoy.getDay();
    const diffHoy = hoy.getDate() - diaSemanaHoy + (diaSemanaHoy === 0 ? -6 : 1);
    const offset = (typeof window !== 'undefined' && typeof window.currentWeekOffset === 'number') ? window.currentWeekOffset : 0;
    const lunes = new Date(hoy.getFullYear(), hoy.getMonth(), diffHoy + (offset * 7));
    lunes.setHours(0, 0, 0, 0);

    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 7);

    pendientes = pendientes.filter(c => {
      const cDate = new Date(c.fechaHora);
      return cDate >= lunes && cDate < domingo;
    });
  }

  // Ordenar cronológicamente
  pendientes.sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora));

  if (subtitulo) {
    const periodoTxt = filtro === 'SEMANA' ? 'en la semana visible' : 'en todo el historial';
    subtitulo.innerHTML = `<strong>${pendientes.length}</strong> sesión${pendientes.length === 1 ? '' : 'es'} pendiente${pendientes.length === 1 ? '' : 's'} por cobrar ${periodoTxt}`;
  }

  if (pendientes.length === 0) {
    container.innerHTML = `
      <div class="audit-empty-state">
        <i class="fa-solid fa-circle-check"></i>
        <div style="font-size: 1.1rem; font-weight: 800; margin-bottom: 0.3rem;">¡Todo al día!</div>
        <p style="font-size: 0.88rem; margin: 0; opacity: 0.9;">No tienes sesiones pendientes de cobro ${filtro === 'SEMANA' ? 'para esta semana' : 'en tu historial'}.</p>
      </div>
    `;
    return;
  }

  let html = '';
  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  pendientes.forEach(c => {
    const d = new Date(c.fechaHora);
    const fechaTxt = `${diasSemana[d.getDay()]} ${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()} — ${d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
    const nombre = c.paciente ? c.paciente.nombre.replace(/^\[(BLOQUEO|GRUPAL|EVALUACION)\]\s*/i, '').trim() : 'Paciente';
    const notas = (c.categoria || '').replace(/^\[(BLOQUEO|GRUPAL|EVALUACION)\]\s*/i, '').trim();
    const esCompletada = c.estado_cita === 'REALIZADA' || c.estado_cita === 'CONFIRMADA';

    html += `
      <div class="audit-card">
        <div class="audit-card-info">
          <div class="audit-card-title">
            <span>${escapeHtml(nombre)}</span>
            ${esCompletada ? `<span style="font-size: 0.65rem; padding: 1px 6px; border-radius: 4px; background: #dcfce7; color: #15803d; font-weight: 700;">✓ Realizada</span>` : `<span style="font-size: 0.65rem; padding: 1px 6px; border-radius: 4px; background: #fef9c3; color: #854d0e; font-weight: 700;">Por realizar</span>`}
          </div>
          <div class="audit-card-meta">
            <span><i class="fa-solid fa-calendar-day" style="color: var(--turquesa); margin-right: 3px;"></i> ${fechaTxt}</span>
            ${notas ? `<span>· <i class="fa-solid fa-tag" style="margin-right: 2px;"></i> ${escapeHtml(notas)}</span>` : ''}
            ${c.paciente && c.paciente.telefono ? `<span>· <i class="fa-brands fa-whatsapp" style="color: #16a34a; margin-right: 2px;"></i> ${escapeHtml(c.paciente.telefono)}</span>` : ''}
          </div>
        </div>
        <div class="audit-card-actions">
          <button type="button" class="btn-audit-whatsapp" onclick="enviarWhatsAppCobro(${c.id}, event)" title="Enviar recordatorio cordial de cobro con datos bancarios">
            <i class="fa-brands fa-whatsapp"></i> <span>Pedir Pago</span>
          </button>
          <button type="button" class="btn-audit-pay-toggle" onclick="togglePagoDesdeAuditoria(${c.id})" title="Marcar como pagada">
            <i class="fa-solid fa-check"></i> <span>Pagado</span>
          </button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}
