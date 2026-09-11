// panel/js/expedientes/paciente.js
// RF-11: Gestión del expediente clínico individual del paciente (apertura, cabecera cifrada, maximizar y navegación)

import { getAuthHeaders, getApiUrl } from './utils/api.js';
import { renderListaNotasExpediente, escapeHtmlText } from './render/notasList.js';
import { abrirDirectorioExpedientes, cerrarDirectorioExpedientes } from './directorio.js';
import { asegurarModal } from '../agenda/utils/modalLoader.js';

let pacienteActivoExpediente = null;
let notasCacheExpediente = [];
let esModalExpedienteMaximizado = false;

export function getPacienteActivoExpediente() {
  return pacienteActivoExpediente || (typeof window !== 'undefined' ? window.pacienteActivoExpediente : null);
}

export function setPacienteActivoExpediente(p) {
  pacienteActivoExpediente = p;
  if (typeof window !== 'undefined') window.pacienteActivoExpediente = p;
}

export function getNotasCacheExpediente() {
  return notasCacheExpediente || (typeof window !== 'undefined' ? window.notasCacheExpediente : []);
}

export function setNotasCacheExpediente(n) {
  notasCacheExpediente = n;
  if (typeof window !== 'undefined') window.notasCacheExpediente = n;
}

export function volverAlDirectorioExpedientes() {
  cerrarModalExpediente();
  abrirDirectorioExpedientes();
}

export async function abrirExpedientePorId(pacienteId) {
  cerrarDirectorioExpedientes();
  await asegurarModal('modalExpedientePaciente', '/panel/partials/modals/modal-expediente-paciente.html');

  const modal = document.getElementById('modalExpedientePaciente');
  const listaContainer = document.getElementById('listaNotasExpediente');
  const formSeccion = document.getElementById('seccionFormNotaExpediente');
  const inputBusqueda = document.getElementById('busquedaNotaExpedienteInput');

  if (inputBusqueda) inputBusqueda.value = '';
  if (formSeccion) formSeccion.style.display = 'none';
  if (modal) modal.style.display = 'flex';
  if (listaContainer) {
    listaContainer.innerHTML = '<div style="text-align: center; padding: 3rem; color: #64748b;"><i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; color: var(--turquesa);"></i><p style="margin-top: 0.8rem; font-weight: 500;">Descifrando notas clínicas con AES-256-GCM...</p></div>';
  }

  try {
    const res = await fetch(`${getApiUrl()}/pacientes/${pacienteId}/expediente`, {
      headers: getAuthHeaders()
    });

    if (res.status === 401) {
      localStorage.removeItem('psicolau_token');
      window.location.href = '/panel/index.html';
      return;
    }

    const data = await res.json();
    if (data.success) {
      setPacienteActivoExpediente(data.paciente);
      setNotasCacheExpediente(data.data || []);
      actualizarCabeceraExpediente(data.paciente, (data.data || []).length);
      renderListaNotasExpediente(data.data || []);
    } else {
      if (listaContainer) {
        listaContainer.innerHTML = `<div style="text-align: center; padding: 2rem; color: #ef4444;"><i class="fa-solid fa-circle-exclamation"></i> ${data.message || 'Error al obtener expediente'}</div>`;
      }
    }
  } catch (error) {
    console.error('Error al cargar expediente:', error);
    if (listaContainer) {
      listaContainer.innerHTML = '<div style="text-align: center; padding: 2rem; color: #ef4444;"><i class="fa-solid fa-triangle-exclamation"></i> Error al conectar con el servidor.</div>';
    }
  }
}

export function abrirExpedientePorCita(citaId, event) {
  if (event) event.stopPropagation();
  const cache = (typeof window !== 'undefined' && Array.isArray(window.citasCache)) ? window.citasCache : [];
  const cita = cache.find(c => c.id === citaId);
  if (!cita || !cita.paciente || !cita.paciente.id) {
    alert('No se pudo localizar el registro del paciente asociado a esta cita.');
    return;
  }
  abrirExpedientePorId(cita.paciente.id);
}

export function cerrarModalExpediente() {
  const modal = document.getElementById('modalExpedientePaciente');
  if (modal) modal.style.display = 'none';
  setPacienteActivoExpediente(null);
  setNotasCacheExpediente([]);
}

export function actualizarCabeceraExpediente(paciente, totalNotas) {
  const nombreEl = document.getElementById('expNombrePaciente');
  const infoEl = document.getElementById('expInfoPaciente');
  const badgeNotas = document.getElementById('expBadgeTotalNotas');
  const contenedorBtnEliminar = document.getElementById('contenedorBtnEliminarExpedienteModal');

  if (nombreEl) nombreEl.innerText = paciente.nombre;
  if (badgeNotas) badgeNotas.innerText = `${totalNotas} ${totalNotas === 1 ? 'Sesión Registrada' : 'Sesiones Registradas'}`;

  const directorio = (typeof window !== 'undefined' && window.directorioPacientesCache) ? window.directorioPacientesCache : [];
  const pDirectorio = directorio.find(p => p.id === paciente.id);
  const citasCache = (typeof window !== 'undefined' && Array.isArray(window.citasCache)) ? window.citasCache : [];
  const totalCitas = (pDirectorio && pDirectorio._count) ? pDirectorio._count.citas : citasCache.filter(c => c.paciente && c.paciente.id === paciente.id).length;

  if (infoEl) {
    const tieneEmail = paciente.email && !paciente.email.startsWith('sin-email-');
    let infoHtml = `<div class="exp-info-chips-container">
      <span class="exp-info-chip"><i class="fa-brands fa-whatsapp" style="color: #16a34a; margin-right: 4px;"></i> ${escapeHtmlText(paciente.telefono || 'Sin teléfono')}</span>`;
    if (tieneEmail) {
      infoHtml += `<span class="exp-info-chip"><i class="fa-regular fa-envelope" style="color: var(--turquesa); margin-right: 4px;"></i> ${escapeHtmlText(paciente.email)}</span>`;
    }
    infoHtml += `<span class="exp-info-chip"><i class="fa-solid fa-calendar-check" style="color: #6366f1; margin-right: 4px;"></i> ${totalCitas} citas</span>`;
    if (paciente.enlaceZoom) {
      infoHtml += `<span class="exp-info-chip"><a href="${paciente.enlaceZoom.startsWith('http') ? paciente.enlaceZoom : 'https://' + paciente.enlaceZoom}" target="_blank" style="color: #2563eb; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-video"></i> Sala Zoom</a></span>`;
    }
    infoHtml += `</div>`;
    infoEl.innerHTML = infoHtml;
  }

  if (contenedorBtnEliminar) {
    if (totalCitas > 0) {
      contenedorBtnEliminar.innerHTML = `
        <span style="font-size: 0.78rem; color: #94a3b8; display: inline-flex; align-items: center; gap: 4px; padding: 0.3rem 0;">
          <i class="fa-solid fa-lock" style="color: #94a3b8;"></i> Paciente con citas agendadas (no se puede borrar)
        </span>
      `;
    } else {
      contenedorBtnEliminar.innerHTML = `
        <button type="button" class="btn" style="background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; width: auto; padding: 0.45rem 1rem; font-size: 0.84rem; font-weight: 600;" onclick="eliminarPacienteDirectorio(${paciente.id}, '${escapeHtmlText(paciente.nombre)}', 0)" title="Eliminar paciente y expediente permanentemente">
          <i class="fa-solid fa-trash-can" style="margin-right: 4px;"></i> Eliminar Expediente de este Paciente
        </button>
      `;
    }
  }
}

export function toggleMaximizarModalExpediente() {
  const modal = document.getElementById('modalExpedientePaciente');
  if (!modal) return;
  const dialogo = modal.querySelector('div');
  const icono = document.getElementById('iconAgrandarModalExpediente');
  esModalExpedienteMaximizado = !esModalExpedienteMaximizado;

  if (dialogo) {
    if (esModalExpedienteMaximizado) {
      dialogo.style.maxWidth = '98vw';
      dialogo.style.height = '96vh';
      dialogo.style.maxHeight = '96vh';
      if (icono) icono.className = 'fa-solid fa-compress';
    } else {
      dialogo.style.maxWidth = '860px';
      dialogo.style.height = 'auto';
      dialogo.style.maxHeight = '94vh';
      if (icono) icono.className = 'fa-solid fa-expand';
    }
  }
}

// Compatibilidad global
if (typeof window !== 'undefined') {
  window.volverAlDirectorioExpedientes = volverAlDirectorioExpedientes;
  window.abrirExpedientePorId = abrirExpedientePorId;
  window.abrirExpedientePorCita = abrirExpedientePorCita;
  window.cerrarModalExpediente = cerrarModalExpediente;
  window.actualizarCabeceraExpediente = actualizarCabeceraExpediente;
  window.toggleMaximizarModalExpediente = toggleMaximizarModalExpediente;
}
