// panel/js/agenda/render/appointmentCard.js
// RF-03: Generación del HTML de tarjetas de cita (.appointment-block), badges y acciones rápidas

import { getContrastColor } from '../utils/colors.js';

function escapeHtmlText(str) {
  if (typeof window !== 'undefined' && typeof window.escapeHtml === 'function') {
    return window.escapeHtml(str);
  }
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Genera el HTML de una tarjeta de cita individual (.appointment-block)
 * @param {Object} cita - Datos de la cita
 * @param {string} terminoBusqueda - Término de filtro activo
 * @returns {string} Fragmento de HTML
 */
export function renderAppointmentCard(cita, terminoBusqueda = '') {
  const cDate = new Date(cita.fechaHora);
  const cTime = cDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
  const color = cita.color || '#3EB8CC';
  const textColor = getContrastColor(color);
  const esPagado = cita.estado_pago === 'PAGADO';
  const payLabel = esPagado ? 'Pagado' : 'Por Pagar';
  const payClass = esPagado ? 'paid' : 'unpaid';

  const esCancelada = cita.estado_cita === 'CANCELADA';
  const esBloqueo = (cita.categoria && cita.categoria.startsWith('[BLOQUEO]')) || (cita.paciente && cita.paciente.nombre && cita.paciente.nombre.startsWith('[BLOQUEO]'));
  const esGrupal = (cita.categoria && cita.categoria.startsWith('[GRUPAL]')) || (cita.paciente && cita.paciente.nombre && cita.paciente.nombre.startsWith('[GRUPAL]'));
  const esEvaluacion = (cita.categoria && cita.categoria.startsWith('[EVALUACION]')) || (cita.paciente && cita.paciente.nombre && cita.paciente.nombre.startsWith('[EVALUACION]'));
  const rawNombre = cita.paciente ? cita.paciente.nombre : '';
  const nombreLimpio = rawNombre.replace(/^\[(BLOQUEO|GRUPAL|EVALUACION)\]\s*/i, '').trim();
  const notasLimpias = (cita.categoria || '').replace(/^\[(BLOQUEO|GRUPAL|EVALUACION)\]\s*/i, '').trim();
  const esCompletada = !esCancelada && (cita.estado_cita === 'REALIZADA' || cita.estado_cita === 'CONFIRMADA');

  let matchesBusqueda = true;
  let blockClass = esBloqueo ? 'appointment-block is-blocked' : (esGrupal ? 'appointment-block is-group' : (esEvaluacion ? 'appointment-block is-evaluacion' : (esCompletada ? 'appointment-block is-completed' : 'appointment-block')));
  if ((esGrupal || esEvaluacion) && esCompletada) blockClass += ' is-completed';
  if (esCancelada) blockClass += ' is-cancelled';

  if (terminoBusqueda) {
    const tel = (cita.paciente && cita.paciente.telefono) ? cita.paciente.telefono : '';
    const textoCompleto = `${nombreLimpio} ${notasLimpias} ${tel} ${esGrupal ? 'grupal grupo taller' : ''} ${esEvaluacion ? 'evaluacion diagnóstico neuro' : ''} ${esCancelada ? 'cancelada cancelado' : ''}`.toLowerCase();
    matchesBusqueda = textoCompleto.includes(terminoBusqueda);
    if (matchesBusqueda) {
      blockClass += ' is-highlighted';
    } else {
      blockClass += ' is-dimmed';
    }
  }

  return `
    <div id="cita-block-${cita.id}" class="${blockClass}" style="background-color: ${color}; color: ${textColor};" onclick="event.stopPropagation()">
      <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 3px;">
        <span class="time-badge">${cTime}</span>
        <div class="card-actions-capsule">
          ${esCancelada ? `
            <button type="button" class="btn-check-cancelada" onclick="toggleReactivarCita(${cita.id}, event)" title="Cita cancelada (clic para reactivar)">
              <i class="fa-solid fa-circle-xmark"></i>
            </button>
            ${!esGrupal ? `
              <button type="button" class="card-btn" onclick="abrirExpedientePorCita(${cita.id}, event)" title="Expediente clínico del paciente (notas y sesiones)" style="color: var(--rosa-coral);">
                <i class="fa-solid fa-folder-open"></i>
              </button>
            ` : ''}
          ` : (!esBloqueo ? `
            <button type="button" class="btn-check-completada ${esCompletada ? 'completed' : 'pending'}" onclick="toggleCompletarCita(${cita.id}, event)" title="${esCompletada ? (esGrupal ? 'Sesión grupal realizada (clic para desmarcar)' : 'Sesión realizada (clic para desmarcar)') : (esGrupal ? 'Marcar sesión grupal como realizada' : 'Marcar sesión como realizada / completada')}">
              <i class="${esCompletada ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'}"></i>
            </button>
            <button type="button" class="btn-cancel-quick" onclick="toggleCancelarCita(${cita.id}, event)" title="Marcar cita como cancelada (paciente avisó que no asistirá)">
              <i class="fa-solid fa-xmark"></i>
            </button>
            ${!esGrupal ? `
              <button type="button" class="card-btn" onclick="abrirExpedientePorCita(${cita.id}, event)" title="Expediente clínico del paciente (notas y sesiones)" style="color: var(--rosa-coral);">
                <i class="fa-solid fa-folder-open"></i>
              </button>
            ` : ''}
          ` : '')}
        </div>
      </div>

      <div class="patient-name">${esBloqueo ? `<i class="fa-solid fa-ban" style="margin-right: 3px;"></i>${escapeHtmlText(nombreLimpio)}` : (esGrupal ? `<i class="fa-solid fa-users" style="margin-right: 4px;"></i>${escapeHtmlText(nombreLimpio)}` : (esEvaluacion ? `<i class="fa-solid fa-brain" style="margin-right: 4px;"></i>${escapeHtmlText(nombreLimpio)}` : escapeHtmlText(nombreLimpio)))}</div>
      ${notasLimpias ? `<div class="appointment-note">${escapeHtmlText(notasLimpias)}</div>` : ''}
      ${(esCancelada || esGrupal || esEvaluacion || (esCompletada && !esBloqueo)) ? `
        <div class="card-badges-row">
          ${esCancelada ? `<div class="badge-cancelada"><i class="fa-solid fa-xmark"></i> Cancelada</div>` : ''}
          ${esGrupal ? `<div class="badge-grupal"><i class="fa-solid fa-people-group"></i> Grupal</div>` : ''}
          ${esEvaluacion ? `<div class="badge-evaluacion"><i class="fa-solid fa-brain"></i> Evaluación</div>` : ''}
          ${esCompletada && !esBloqueo && !esCancelada ? `<div class="badge-completada"><i class="fa-solid fa-check"></i> Realizada</div>` : ''}
        </div>
      ` : ''}

      <!-- Barra de Acciones Rápidas (Zoom, WA, Cobro, Reactivar, Editar, Borrar) -->
      <div class="card-quick-actions-bar">
        ${esCancelada ? `
          <button type="button" class="card-btn btn-reactivar" onclick="toggleReactivarCita(${cita.id}, event)" style="color: #16a34a;" title="Reactivar cita en la agenda activa">
            <i class="fa-solid fa-rotate-left"></i>
          </button>
        ` : (!esBloqueo ? `
          <button type="button" class="card-btn btn-zoom" onclick="abrirZoomSesion(${cita.id}, event)" title="${cita.paciente && cita.paciente.enlaceZoom ? (esGrupal ? 'Entrar a la sala grupal de Zoom' : (esEvaluacion ? 'Entrar a la evaluación de Zoom (' + nombreLimpio + ')' : 'Entrar a la sesión de Zoom (' + nombreLimpio + ')')) : 'Configurar enlace de Zoom'}" style="color: ${cita.paciente && cita.paciente.enlaceZoom ? '#2563eb' : '#94a3b8'};">
            <i class="fa-solid fa-video"></i>
          </button>
          ${!esGrupal ? `
            <button type="button" class="card-btn btn-wa" onclick="enviarWhatsAppRecordatorio(${cita.id}, event)" title="Recordatorio de cita por WhatsApp" style="color: #16a34a;">
              <i class="fa-brands fa-whatsapp"></i>
            </button>
          ` : ''}
          ${!esPagado && !esGrupal ? `
            <button type="button" class="card-btn btn-cobro" onclick="enviarWhatsAppCobro(${cita.id}, event)" title="Recordar pago y enviar datos bancarios por WhatsApp" style="color: #ea580c;">
              <i class="fa-solid fa-file-invoice-dollar"></i>
            </button>
          ` : ''}
        ` : '')}
        <button type="button" class="card-btn btn-edit" onclick="editarCita(${cita.id})" style="color: #334155;" title="${esGrupal ? 'Editar sesión grupal' : (esEvaluacion ? 'Editar evaluación' : 'Editar cita')}">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button type="button" class="card-btn btn-del" onclick="eliminarCita(${cita.id}, event)" style="color: #dc2626;" title="${esGrupal ? 'Borrar sesión grupal' : (esEvaluacion ? 'Borrar evaluación' : 'Borrar cita de la agenda')}">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
      
      ${!esBloqueo && !esCancelada ? `
        <div style="margin-top: 4px;">
          <button type="button" class="mini-pay-btn ${payClass}" onclick="togglePagoDirecto(${cita.id}, event)" title="Clic para alternar estado de pago">
            <i class="fa-solid ${esPagado ? 'fa-circle-check' : 'fa-clock'}"></i> ${payLabel}
          </button>
        </div>
      ` : ''}
    </div>
  `;
}

if (typeof window !== 'undefined') {
  window.renderAppointmentCard = renderAppointmentCard;
}
