// panel/js/agenda/form/modal.js
// RF-04: Control del modal de Agendar / Editar Cita, tipos de registro, campos condicionales y recurrencias

import { renderSwatches, obtenerSiguienteColorDisponible } from '../utils/colors.js';
import { actualizarDatalistPacientes, calcularTotalGrupal, limpiarEstadoAutocompletado } from './autocomplete.js';
import { asegurarModal } from '../utils/modalLoader.js';

export async function mostrarModalDirecto() {
  await asegurarModal('modalNuevaCita', '/panel/partials/modals/modal-nueva-cita.html');
  const modal = document.getElementById('modalNuevaCita');
  if (modal) modal.style.display = 'flex';
}

export function setModoFormulario(modo) {
  const campos = ['nc_nombre', 'nc_email', 'nc_telefono', 'nc_fecha', 'nc_hora', 'nc_notas', 'nc_enlace_zoom'];
  const tabs = document.getElementById('seccionTabsTipo');
  const seccionRec = document.getElementById('seccionRecurrencia');
  const seccionColor = document.getElementById('seccionColorBloque');
  const camposContacto = document.getElementById('camposContactoIndividual');
  const campoZoomContainer = document.getElementById('campoZoomContainer');
  const prefijoEl = document.getElementById('nc_prefijo');

  if (modo === 'READONLY_CANCELADA') {
    if (tabs) tabs.style.display = 'none';
    if (seccionRec) seccionRec.style.display = 'none';
    if (seccionColor) seccionColor.style.display = 'none';
    if (camposContacto) camposContacto.style.display = 'grid';
    if (campoZoomContainer) campoZoomContainer.style.display = 'block';
    if (prefijoEl) {
      prefijoEl.disabled = true;
      prefijoEl.style.backgroundColor = '#f8fafc';
    }

    campos.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        if (el.tagName === 'SELECT') {
          el.disabled = true;
        } else {
          el.readOnly = true;
        }
        el.style.backgroundColor = '#f8fafc';
        el.style.borderColor = '#e2e8f0';
        el.style.color = '#334155';
        el.style.cursor = 'default';
      }
    });
  } else {
    if (tabs) tabs.style.display = 'flex';
    if (seccionColor) seccionColor.style.display = 'block';
    if (prefijoEl) {
      prefijoEl.disabled = false;
      prefijoEl.style.backgroundColor = '';
    }

    campos.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        if (el.tagName === 'SELECT') {
          el.disabled = false;
        } else {
          el.readOnly = false;
        }
        el.style.backgroundColor = '';
        el.style.borderColor = '';
        el.style.color = '';
        el.style.cursor = '';
      }
    });
  }
}

export function seleccionarTipoRegistro(tipo) {
  if (typeof window !== 'undefined') {
    window.tipoRegistroActual = tipo;
  }
  const tabCita = document.getElementById('tabTipoCita');
  const tabEvaluacion = document.getElementById('tabTipoEvaluacion');
  const tabGrupal = document.getElementById('tabTipoGrupal');
  const tabBloqueo = document.getElementById('tabTipoBloqueo');
  const camposContacto = document.getElementById('camposContactoIndividual');
  const campoZoomContainer = document.getElementById('campoZoomContainer');
  const seccionRecurrencia = document.getElementById('seccionRecurrencia');
  const seccionMonto = document.getElementById('seccionMontoSesion');
  const calculadoraGrupal = document.getElementById('calculadoraGrupal');
  const lblNombre = document.getElementById('lblNombre');
  const lblZoom = document.getElementById('lblZoom');
  const inputNombre = document.getElementById('nc_nombre');
  const inputZoom = document.getElementById('nc_enlace_zoom');
  const inputMonto = document.getElementById('nc_monto');
  const badge = document.getElementById('badgePacienteDetectado');

  if (tabCita) tabCita.classList.remove('active');
  if (tabEvaluacion) tabEvaluacion.classList.remove('active');
  if (tabGrupal) tabGrupal.classList.remove('active');
  if (tabBloqueo) tabBloqueo.classList.remove('active');

  const idInput = document.getElementById('nc_id');
  const esNueva = !idInput || !idInput.value;

  if (tipo === 'BLOQUEO') {
    if (tabBloqueo) tabBloqueo.classList.add('active');
    if (camposContacto) camposContacto.style.display = 'none';
    if (campoZoomContainer) campoZoomContainer.style.display = 'none';
    if (seccionRecurrencia) seccionRecurrencia.style.display = 'none';
    if (seccionMonto) seccionMonto.style.display = 'none';
    if (calculadoraGrupal) calculadoraGrupal.style.display = 'none';
    if (inputMonto) inputMonto.value = '0';
    if (badge) badge.style.display = 'none';
    if (lblNombre) lblNombre.innerHTML = '<i class="fa-solid fa-ban" style="color: #ef4444; margin-right: 4px;"></i> Motivo del Bloqueo / Horario No Disponible *';
    if (inputNombre) {
      inputNombre.placeholder = 'Ej: Comida, Supervisión, Asunto personal...';
    }
    const colorInput = document.getElementById('nc_color');
    if (colorInput) colorInput.value = '#94a3b8';
    renderSwatches('#94a3b8');
  } else if (tipo === 'EVALUACION') {
    if (tabEvaluacion) tabEvaluacion.classList.add('active');
    if (camposContacto) camposContacto.style.display = 'grid';
    if (campoZoomContainer) campoZoomContainer.style.display = 'block';
    if (seccionRecurrencia) seccionRecurrencia.style.display = 'block';
    if (seccionMonto) seccionMonto.style.display = 'block';
    if (calculadoraGrupal) calculadoraGrupal.style.display = 'none';
    if (lblNombre) lblNombre.innerHTML = '<i class="fa-solid fa-brain" style="color: #6366f1; margin-right: 4px;"></i> Nombre del paciente / Evaluación *';
    if (lblZoom) lblZoom.innerHTML = '<i class="fa-solid fa-video" style="color: #6366f1; margin-right: 4px;"></i> Enlace personal de Zoom / Videollamada (opcional)';
    if (inputZoom) inputZoom.placeholder = 'https://zoom.us/j/... o Google Meet';
    if (inputNombre) {
      inputNombre.placeholder = 'Ej: Mariana López (Evaluación neuropsicológica)...';
    }

    if (esNueva) {
      if (inputMonto) inputMonto.value = '4000';
      const colorInput = document.getElementById('nc_color');
      if (colorInput) colorInput.value = '#6366f1';
      renderSwatches('#6366f1');
      const repInput = document.getElementById('nc_repeticiones');
      if (repInput) repInput.value = '2';
    } else {
      const colorExistente = document.getElementById('nc_color')?.value || '#6366f1';
      renderSwatches(colorExistente);
    }
  } else if (tipo === 'GRUPAL') {
    if (tabGrupal) tabGrupal.classList.add('active');
    if (camposContacto) camposContacto.style.display = 'none';
    if (campoZoomContainer) campoZoomContainer.style.display = 'block';
    if (seccionRecurrencia) seccionRecurrencia.style.display = 'block';
    if (seccionMonto) seccionMonto.style.display = 'block';
    if (calculadoraGrupal) calculadoraGrupal.style.display = 'block';
    if (badge) badge.style.display = 'none';
    if (lblNombre) lblNombre.innerHTML = '<i class="fa-solid fa-users" style="color: #8b5cf6; margin-right: 4px;"></i> Tipo / Nombre del Grupo o Programa *';
    if (lblZoom) lblZoom.innerHTML = '<i class="fa-solid fa-video" style="color: #8b5cf6; margin-right: 4px;"></i> Enlace de Zoom de la Sala Grupal (opcional)';
    if (inputZoom) inputZoom.placeholder = 'https://zoom.us/j/... (Enlace para todos los participantes)';
    if (inputNombre) {
      inputNombre.placeholder = 'Ej: Terapia Grupal para Autistas Adultos...';
    }
    
    if (esNueva) {
      const colorInput = document.getElementById('nc_color');
      if (colorInput) colorInput.value = '#8b5cf6';
      renderSwatches('#8b5cf6');
      const repInput = document.getElementById('nc_repeticiones');
      if (repInput) repInput.value = '12';
      const cuotaInput = document.getElementById('nc_cuota_persona');
      const partInput = document.getElementById('nc_num_participantes');
      if (cuotaInput && !cuotaInput.value) {
        cuotaInput.value = '150';
      }
      if (cuotaInput && partInput && cuotaInput.value && partInput.value) {
        calcularTotalGrupal();
      } else if (inputMonto && (inputMonto.value === '500' || inputMonto.value === '4000')) {
        inputMonto.value = '0';
      }
    } else {
      const colorExistente = document.getElementById('nc_color')?.value || '#8b5cf6';
      renderSwatches(colorExistente);
    }
  } else {
    // CITA individual
    if (tabCita) tabCita.classList.add('active');
    if (camposContacto) camposContacto.style.display = 'grid';
    if (campoZoomContainer) campoZoomContainer.style.display = 'block';
    if (seccionRecurrencia) seccionRecurrencia.style.display = 'block';
    if (seccionMonto) seccionMonto.style.display = 'block';
    if (calculadoraGrupal) calculadoraGrupal.style.display = 'none';
    if (lblNombre) lblNombre.innerHTML = '<i class="fa-solid fa-user" style="color: var(--turquesa); margin-right: 4px;"></i> Nombre del paciente / Asunto *';
    if (lblZoom) lblZoom.innerHTML = '<i class="fa-solid fa-video" style="color: #2563eb; margin-right: 4px;"></i> Enlace personal de Zoom / Videollamada (opcional)';
    if (inputZoom) inputZoom.placeholder = 'https://zoom.us/j/... o Google Meet';
    if (inputNombre) {
      inputNombre.placeholder = 'Ej: Mariana López, Carlos Ruiz...';
    }
    
    if (esNueva) {
      const colorNuevo = obtenerSiguienteColorDisponible();
      const colorInput = document.getElementById('nc_color');
      if (colorInput) colorInput.value = colorNuevo;
      renderSwatches(colorNuevo);
      const repInput = document.getElementById('nc_repeticiones');
      if (repInput) repInput.value = '4';
      if (inputMonto && (inputMonto.value === '4000' || inputMonto.value === '0' || !inputMonto.value)) {
        inputMonto.value = '500';
      }
    } else {
      const colorExistente = document.getElementById('nc_color')?.value || '#3EB8CC';
      renderSwatches(colorExistente);
    }
  }
}

export function toggleOpcionesRecurrencia(checked) {
  const detalle = document.getElementById('opcionesRecurrenciaDetalle');
  if (detalle) detalle.style.display = checked ? 'block' : 'none';
}

export async function abrirModal(fecha = null, hora = null) {
  await asegurarModal('modalNuevaCita', '/panel/partials/modals/modal-nueva-cita.html');

  limpiarEstadoAutocompletado();

  const form = document.getElementById('formNuevaCita');
  if (form) form.reset();

  setModoFormulario('EDITABLE');

  const prefijoEl = document.getElementById('nc_prefijo');
  if (prefijoEl) prefijoEl.value = '+52';

  const idInput = document.getElementById('nc_id');
  if (idInput) idInput.value = '';

  const montoInput = document.getElementById('nc_monto');
  if (montoInput) montoInput.value = '500';

  const cuotaInput = document.getElementById('nc_cuota_persona');
  if (cuotaInput) cuotaInput.value = '150';
  const partInput = document.getElementById('nc_num_participantes');
  if (partInput) partInput.value = '';

  const zoomInput = document.getElementById('nc_enlace_zoom');
  if (zoomInput) zoomInput.value = '';

  const badge = document.getElementById('badgePacienteDetectado');
  if (badge) badge.style.display = 'none';

  actualizarDatalistPacientes();

  const titulo = document.getElementById('modalTitulo');
  if (titulo) titulo.innerHTML = '<i class="fa-solid fa-calendar-plus"></i> <span>Agendar Cita</span>';

  const subtitulo = document.getElementById('modalSubtitulo');
  if (subtitulo) subtitulo.style.display = 'none';

  const editExtra = document.getElementById('editExtraActions');
  if (editExtra) editExtra.style.display = 'none';

  const footer = document.getElementById('modalFooterActions');
  if (footer) {
    footer.innerHTML = `
      <button type="submit" id="btnGuardarModal" class="btn" style="flex: 1.5;"><i class="fa-solid fa-check" style="margin-right: 4px;"></i> Confirmar y Guardar</button>
      <button type="button" id="btnCancelarModal" class="btn" style="flex: 1; background: var(--gris-calido);" onclick="cerrarModal()">Cancelar</button>
    `;
  }

  const seccionRec = document.getElementById('seccionRecurrencia');
  if (seccionRec) seccionRec.style.display = 'block';

  const seccionEstado = document.getElementById('seccionEstadoCita');
  if (seccionEstado) seccionEstado.style.display = 'none';
  seleccionarEstadoModal('PENDIENTE');

  const tabs = document.getElementById('seccionTabsTipo');
  if (tabs) tabs.style.display = 'flex';

  const checkRepetir = document.getElementById('nc_repetir');
  if (checkRepetir) checkRepetir.checked = false;
  toggleOpcionesRecurrencia(false);

  seleccionarTipoRegistro('CITA');

  // Pre-llenar fecha y hora tras el form.reset()
  const fechaInput = document.getElementById('nc_fecha');
  if (fechaInput) {
    if (fecha) {
      fechaInput.value = fecha;
    } else {
      const hoy = new Date();
      const yyyy = hoy.getFullYear();
      const mm = String(hoy.getMonth() + 1).padStart(2, '0');
      const dd = String(hoy.getDate()).padStart(2, '0');
      fechaInput.value = `${yyyy}-${mm}-${dd}`;
    }
  }

  const horaInput = document.getElementById('nc_hora');
  if (horaInput) {
    horaInput.value = hora || '07:00';
  }

  await mostrarModalDirecto();
}

export function cerrarModal() {
  limpiarEstadoAutocompletado();

  const modal = document.getElementById('modalNuevaCita');
  if (modal) modal.style.display = 'none';

  const form = document.getElementById('formNuevaCita');
  if (form) form.reset();

  setModoFormulario('EDITABLE');

  const idInput = document.getElementById('nc_id');
  if (idInput) idInput.value = '';

  const zoomInput = document.getElementById('nc_enlace_zoom');
  if (zoomInput) zoomInput.value = '';

  const cuotaInput = document.getElementById('nc_cuota_persona');
  if (cuotaInput) cuotaInput.value = '150';
  const partInput = document.getElementById('nc_num_participantes');
  if (partInput) partInput.value = '';

  const badge = document.getElementById('badgePacienteDetectado');
  if (badge) badge.style.display = 'none';

  const titulo = document.getElementById('modalTitulo');
  if (titulo) titulo.innerHTML = '<i class="fa-solid fa-calendar-plus"></i> <span>Agendar Cita</span>';

  const subtitulo = document.getElementById('modalSubtitulo');
  if (subtitulo) subtitulo.style.display = 'none';

  const editExtra = document.getElementById('editExtraActions');
  if (editExtra) {
    editExtra.style.display = 'none';
    editExtra.innerHTML = `
      <button type="button" id="btnEliminarModal" onclick="eliminarCita(document.getElementById('nc_id')?.value, event)" style="background: none; border: none; color: #dc2626; font-size: 0.88rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
        <i class="fa-solid fa-trash-can"></i> Eliminar esta cita
      </button>
    `;
  }

  const footer = document.getElementById('modalFooterActions');
  if (footer) {
    footer.innerHTML = `
      <button type="submit" id="btnGuardarModal" class="btn" style="flex: 1.5;"><i class="fa-solid fa-check" style="margin-right: 4px;"></i> Confirmar y Guardar</button>
      <button type="button" id="btnCancelarModal" class="btn" style="flex: 1; background: var(--gris-calido);" onclick="cerrarModal()">Cancelar</button>
    `;
  }

  const seccionRec = document.getElementById('seccionRecurrencia');
  if (seccionRec) seccionRec.style.display = 'block';

  const seccionEstado = document.getElementById('seccionEstadoCita');
  if (seccionEstado) seccionEstado.style.display = 'none';
  seleccionarEstadoModal('PENDIENTE');

  const tabs = document.getElementById('seccionTabsTipo');
  if (tabs) tabs.style.display = 'flex';

  const checkRepetir = document.getElementById('nc_repetir');
  if (checkRepetir) checkRepetir.checked = false;
  toggleOpcionesRecurrencia(false);

  seleccionarTipoRegistro('CITA');
}

export function seleccionarEstadoModal(estado) {
  const hiddenInput = document.getElementById('nc_estado_cita');
  if (hiddenInput) hiddenInput.value = estado;

  const buttons = document.querySelectorAll('.btn-estado-opt');
  buttons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.estado === estado);
  });
}

// Compatibilidad global
if (typeof window !== 'undefined') {
  window.abrirModal = abrirModal;
  window.cerrarModal = cerrarModal;
  window.seleccionarTipoRegistro = seleccionarTipoRegistro;
  window.setModoFormulario = setModoFormulario;
  window.mostrarModalDirecto = mostrarModalDirecto;
  window.toggleOpcionesRecurrencia = toggleOpcionesRecurrencia;
  window.seleccionarEstadoModal = seleccionarEstadoModal;
}
