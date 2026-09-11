// panel/js/expedientes/directorio.js
// RF-10: Directorio general de expedientes clínicos, filtrado interactivo y eliminación de fichas de pacientes

import { getAuthHeaders, getApiUrl } from './utils/api.js';
import { asegurarModal } from '../agenda/utils/modalLoader.js';

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

export async function cargarDirectorioEnSegundoPlano() {
  try {
    const res = await fetch(`${getApiUrl()}/pacientes`, {
      headers: getAuthHeaders()
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        window.directorioPacientesCache = data.data || [];
      }
    }
  } catch (e) {
    // Silencioso en segundo plano
  }
}

export async function abrirDirectorioExpedientes() {
  await asegurarModal('modalDirectorioExpedientes', '/panel/partials/modals/modal-directorio-expedientes.html');

  const modal = document.getElementById('modalDirectorioExpedientes');
  const container = document.getElementById('directorioPacientesLista');
  const inputBusqueda = document.getElementById('busquedaDirectorioInput');

  if (inputBusqueda) inputBusqueda.value = '';
  if (modal) modal.style.display = 'flex';
  if (container) {
    container.innerHTML = '<div style="text-align: center; padding: 2rem; color: #64748b;"><i class="fa-solid fa-spinner fa-spin" style="font-size: 1.8rem; color: var(--turquesa);"></i><p style="margin-top: 0.6rem;">Cargando directorio de expedientes...</p></div>';
  }

  try {
    const res = await fetch(`${getApiUrl()}/pacientes`, {
      headers: getAuthHeaders()
    });

    if (res.status === 401) {
      localStorage.removeItem('psicolau_token');
      window.location.href = '/panel/index.html';
      return;
    }

    const data = await res.json();
    if (data.success) {
      window.directorioPacientesCache = data.data || [];
      renderDirectorioPacientes(window.directorioPacientesCache);
    } else {
      if (container) {
        container.innerHTML = `<div style="text-align: center; padding: 2rem; color: #ef4444;"><i class="fa-solid fa-circle-exclamation"></i> ${data.message || 'Error al cargar directorio'}</div>`;
      }
    }
  } catch (error) {
    console.error('Error al abrir directorio:', error);
    if (container) {
      container.innerHTML = '<div style="text-align: center; padding: 2rem; color: #ef4444;"><i class="fa-solid fa-triangle-exclamation"></i> Error de conexión con el servidor.</div>';
    }
  }
}

export function cerrarDirectorioExpedientes() {
  const modal = document.getElementById('modalDirectorioExpedientes');
  if (modal) modal.style.display = 'none';
}

export function renderDirectorioPacientes(pacientes, query = '') {
  const container = document.getElementById('directorioPacientesLista');
  const badgeTotal = document.getElementById('directorioTotalPacientes');
  
  // Excluir estrictamente cualquier registro de bloqueo o grupo
  const listaLimpia = (pacientes || []).filter(p => {
    if (!p.nombre) return false;
    const u = p.nombre.toUpperCase().trim();
    return !u.startsWith('[BLOQUEO]') && !u.startsWith('[GRUPAL]');
  });

  if (badgeTotal) badgeTotal.innerText = `${listaLimpia.length} paciente${listaLimpia.length === 1 ? '' : 's'}`;

  if (!container) return;

  if (listaLimpia.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2.5rem 1rem; color: #64748b;">
        <i class="fa-solid fa-folder-open" style="font-size: 2.4rem; color: #cbd5e1; margin-bottom: 0.8rem;"></i>
        <p style="font-weight: 600; font-size: 1rem; margin-bottom: 0.2rem;">No se encontraron pacientes</p>
        <p style="font-size: 0.85rem; color: #94a3b8;">${query ? `No hay coincidencias para "${query}"` : 'Aún no hay pacientes registrados en el sistema.'}</p>
      </div>
    `;
    return;
  }

  let html = '';
  listaLimpia.forEach(p => {
    const numExp = p._count ? p._count.expedientes : 0;
    const numCitas = p._count ? p._count.citas : 0;
    const tieneEmail = p.email && !p.email.startsWith('sin-email-');
    const ultimaSesion = p.expedientes && p.expedientes.length > 0 
      ? new Date(p.expedientes[0].fechaSesion).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
      : null;

    html += `
      <div class="directorio-card" onclick="abrirExpedientePorId(${p.id})">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem;">
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
              <h4 style="margin: 0; font-size: 1.05rem; color: #1e293b; font-weight: 700;">
                <i class="fa-solid fa-user-check" style="color: var(--turquesa); margin-right: 4px; font-size: 0.95rem;"></i>
                ${p.nombre}
              </h4>
              <span class="pill-exp-count ${numExp > 0 ? 'has-notes' : 'no-notes'}">
                <i class="fa-solid fa-notes-medical"></i> ${numExp} ${numExp === 1 ? 'nota clínica' : 'notas clínicas'}
              </span>
            </div>

            <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 0.45rem; font-size: 0.83rem; color: #64748b;">
              ${p.telefono ? `<span><i class="fa-brands fa-whatsapp" style="color: #16a34a; margin-right: 3px;"></i> ${p.telefono}</span>` : ''}
              ${tieneEmail ? `<span><i class="fa-regular fa-envelope" style="color: var(--turquesa); margin-right: 3px;"></i> ${p.email}</span>` : ''}
              <span><i class="fa-solid fa-calendar-check" style="color: #6366f1; margin-right: 3px;"></i> ${numCitas} citas agendadas</span>
              ${p.enlaceZoom ? `<span style="color: #2563eb; font-weight: 600;"><i class="fa-solid fa-video" style="margin-right: 3px;"></i> Zoom vinculado</span>` : ''}
            </div>

            ${ultimaSesion ? `
              <div style="font-size: 0.78rem; color: #059669; font-weight: 600; margin-top: 0.35rem;">
                <i class="fa-solid fa-clock-rotate-left"></i> Última sesión registrada: ${ultimaSesion}
              </div>
            ` : ''}
          </div>

          <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
            <button type="button" class="btn btn-ver-expediente-directorio" onclick="event.stopPropagation(); abrirExpedientePorId(${p.id});">
              <span>Abrir Expediente</span>
              <i class="fa-solid fa-arrow-right"></i>
            </button>
            ${numCitas === 0 ? `
              <button type="button" class="btn btn-borrar-paciente-directorio" onclick="event.stopPropagation(); eliminarPacienteDirectorio(${p.id}, '${escapeHtmlText(p.nombre)}', ${numCitas});" title="Eliminar paciente y expediente (sin citas agendadas)">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            ` : `
              <button type="button" class="btn btn-borrar-paciente-directorio is-disabled" onclick="event.stopPropagation(); alert('No se puede eliminar a \\'${escapeHtmlText(p.nombre)}\\' porque tiene ${numCitas} cita(s) agendada(s) en el calendario.\\n\\nPara eliminar este expediente, primero cancela o elimina sus citas en la agenda.');" title="No se puede borrar: paciente con citas agendadas">
                <i class="fa-solid fa-lock" style="font-size: 0.75rem; color: #94a3b8;"></i>
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

export function filtrarDirectorioExpedientes(query) {
  const q = (query || '').toLowerCase().trim();
  if (!q) {
    renderDirectorioPacientes(window.directorioPacientesCache);
    return;
  }

  const filtrados = (window.directorioPacientesCache || []).filter(p => {
    if (!p.nombre) return false;
    const u = p.nombre.toUpperCase().trim();
    if (u.startsWith('[BLOQUEO]') || u.startsWith('[GRUPAL]')) return false;
    const nombre = (p.nombre || '').toLowerCase();
    const tel = (p.telefono || '').toLowerCase();
    const email = (p.email || '').toLowerCase();
    return nombre.includes(q) || tel.includes(q) || email.includes(q);
  });

  renderDirectorioPacientes(filtrados, query);
}

export async function eliminarPacienteDirectorio(pacienteId, nombrePaciente, numCitas = 0) {
  const nombre = nombrePaciente || 'este paciente';

  if (numCitas > 0) {
    alert(`No se puede eliminar a "${nombre}" porque tiene ${numCitas} cita(s) agendada(s) en el calendario.\n\nPara eliminar su expediente, primero cancela o elimina sus citas en la agenda.`);
    return;
  }

  if (!confirm(`¿Estás segura de que deseas eliminar permanentemente a "${nombre}" y todo su expediente clínico?\n\nEsta acción es irreversible.`)) {
    return;
  }

  try {
    const res = await fetch(`${getApiUrl()}/pacientes/${pacienteId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    const data = await res.json();
    if (data.success) {
      if (typeof window.cerrarModalExpediente === 'function') {
        window.cerrarModalExpediente();
      }
      await cargarDirectorioEnSegundoPlano();
      const modalDir = document.getElementById('modalDirectorioExpedientes');
      if (modalDir && modalDir.style.display === 'flex') {
        renderDirectorioPacientes(window.directorioPacientesCache);
      }
      if (typeof window.initAgenda === 'function') {
        window.initAgenda();
      }
    } else {
      alert(data.message || 'Error al eliminar el paciente y su expediente');
    }
  } catch (error) {
    console.error('Error al eliminar paciente:', error);
    alert('Error de conexión con el servidor al eliminar el paciente');
  }
}

// Compatibilidad global
if (typeof window !== 'undefined') {
  window.cargarDirectorioEnSegundoPlano = cargarDirectorioEnSegundoPlano;
  window.abrirDirectorioExpedientes = abrirDirectorioExpedientes;
  window.cerrarDirectorioExpedientes = cerrarDirectorioExpedientes;
  window.renderDirectorioPacientes = renderDirectorioPacientes;
  window.filtrarDirectorioExpedientes = filtrarDirectorioExpedientes;
  window.eliminarPacienteDirectorio = eliminarPacienteDirectorio;
}
