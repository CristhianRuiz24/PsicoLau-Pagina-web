// panel/js/expedientes/render/notasList.js
// RF-12: Renderizado cronológico de notas de sesión (.nota-expediente-card con 8 campos clínicos) y búsqueda interactiva

import { getAuthHeaders, getApiUrl } from '../utils/api.js';

let debounceBusquedaExpediente = null;

export function escapeHtmlText(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function resaltarTexto(texto, query) {
  if (!texto) return '';
  if (!query) return escapeHtmlText(texto);
  
  const cleanQ = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (!cleanQ) return escapeHtmlText(texto);

  try {
    const regex = new RegExp(`(${cleanQ})`, 'gi');
    return escapeHtmlText(texto).replace(regex, '<mark class="highlight-expediente">$1</mark>');
  } catch (e) {
    return escapeHtmlText(texto);
  }
}

export function renderListaNotasExpediente(notas, query = '') {
  const container = document.getElementById('listaNotasExpediente');
  if (!container) return;

  if (!notas || notas.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem 1.5rem; background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; margin: 1rem 0;">
        <i class="fa-solid fa-notes-medical" style="font-size: 2.6rem; color: #94a3b8; margin-bottom: 0.8rem;"></i>
        <h4 style="color: #334155; margin-bottom: 0.3rem; font-size: 1.1rem;">
          ${query ? 'No se encontraron notas con esa búsqueda' : 'Expediente sin notas de sesión registradas'}
        </h4>
        <p style="color: #64748b; font-size: 0.88rem; max-width: 420px; margin: 0 auto 1.2rem auto;">
          ${query ? `No hay coincidencias para "<strong>${escapeHtmlText(query)}</strong>" en este expediente.` : 'Comienza a documentar las sesiones terapéuticas de Laura con este paciente.'}
        </p>
        ${!query ? `
          <button type="button" class="btn" style="width: auto; padding: 0.6rem 1.4rem; font-size: 0.92rem;" onclick="mostrarFormularioNuevaNota()">
            <i class="fa-solid fa-plus" style="margin-right: 4px;"></i> Registrar Primera Sesión
          </button>
        ` : ''}
      </div>
    `;
    return;
  }

  let html = '';
  notas.forEach((nota, index) => {
    const sesionNumero = nota.numeroSesion !== undefined ? nota.numeroSesion : (notas.length - index);
    const d = new Date(nota.fechaSesion);
    const fechaTxt = d.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const fechaCapitalizada = fechaTxt.charAt(0).toUpperCase() + fechaTxt.slice(1);

    const resumen = nota.resumenBreve;
    const estado = nota.estadoActual;
    const insight = nota.insightPaciente;
    const evento = nota.eventoPrincipal;
    const intervenciones = nota.intervenciones;
    const formulacion = nota.formulacionClinica;
    const tareas = nota.tareasAsignadas;
    const pendientes = nota.pendientesProximaSesion;

    html += `
      <div class="nota-expediente-card" id="nota-exp-${nota.id}">
        <!-- Cabecera de la Nota -->
        <div class="nota-card-header">
          <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; cursor: pointer;" onclick="abrirDetalleSesion(${nota.id})" title="Clic para agrandar y ver sesión completa">
            <span class="badge-numero-sesion">
              <i class="fa-solid fa-hashtag"></i> Sesión ${sesionNumero}
            </span>
            <h4 class="nota-fecha-titulo">
              <i class="fa-solid fa-calendar-day" style="color: var(--turquesa); margin-right: 4px;"></i>
              ${fechaCapitalizada}
            </h4>
          </div>

          <div class="nota-actions-group">
            <button type="button" class="btn-nota-action enlarge" onclick="abrirDetalleSesion(${nota.id})" title="Agrandar expediente para ver esta sesión con máxima comodidad">
              <i class="fa-solid fa-expand"></i> <span>Agrandar</span>
            </button>
            <button type="button" class="btn-nota-action print" onclick="imprimirNotaIndividual(${nota.id})" title="Imprimir PDF de esta sesión únicamente">
              <i class="fa-solid fa-file-pdf" style="color: #0284c7;"></i>
            </button>
            <button type="button" class="btn-nota-action file" onclick="descargarNotaIndividualTxt(${nota.id})" title="Guardar archivo .txt de esta sesión">
              <i class="fa-solid fa-file-lines" style="color: #475569;"></i>
            </button>
            <button type="button" class="btn-nota-action edit" onclick="editarNotaExpedienteModal(${nota.id})" title="Editar nota clínica">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button type="button" class="btn-nota-action delete" onclick="eliminarNotaExpedienteConfirm(${nota.id})" title="Eliminar nota clínica">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>

        ${resumen ? `
          <div class="nota-resumen-box" onclick="abrirDetalleSesion(${nota.id})" style="cursor: pointer;" title="Clic para agrandar y ver sesión completa">
            <i class="fa-solid fa-quote-left" style="color: var(--turquesa); opacity: 0.6; margin-right: 6px;"></i>
            <span>${resaltarTexto(resumen, query)}</span>
          </div>
        ` : ''}

        <div class="nota-campos-grid">
          ${estado ? `
            <div class="campo-clinico-item">
              <div class="campo-label"><i class="fa-solid fa-heart-pulse" style="color: #ec4899;"></i> Estado Actual / Motivo de Sesión:</div>
              <div class="campo-contenido">${resaltarTexto(estado, query)}</div>
            </div>
          ` : ''}

          ${insight ? `
            <div class="campo-clinico-item">
              <div class="campo-label"><i class="fa-solid fa-lightbulb" style="color: #eab308;"></i> Insight del Paciente:</div>
              <div class="campo-contenido">${resaltarTexto(insight, query)}</div>
            </div>
          ` : ''}

          ${evento ? `
            <div class="campo-clinico-item">
              <div class="campo-label"><i class="fa-solid fa-star" style="color: #f97316;"></i> Evento Principal / Relevante:</div>
              <div class="campo-contenido">${resaltarTexto(evento, query)}</div>
            </div>
          ` : ''}

          ${intervenciones ? `
            <div class="campo-clinico-item">
              <div class="campo-label"><i class="fa-solid fa-hand-holding-medical" style="color: var(--turquesa);"></i> Intervenciones Clínicas Realizadas:</div>
              <div class="campo-contenido">${resaltarTexto(intervenciones, query)}</div>
            </div>
          ` : ''}

          ${formulacion ? `
            <div class="campo-clinico-item">
              <div class="campo-label"><i class="fa-solid fa-brain" style="color: #8b5cf6;"></i> Formulación Clínica en Evolución:</div>
              <div class="campo-contenido">${resaltarTexto(formulacion, query)}</div>
            </div>
          ` : ''}

          ${tareas ? `
            <div class="campo-clinico-item">
              <div class="campo-label"><i class="fa-solid fa-list-check" style="color: #10b981;"></i> Tareas / Acuerdos Asignados:</div>
              <div class="campo-contenido">${resaltarTexto(tareas, query)}</div>
            </div>
          ` : ''}

          ${pendientes ? `
            <div class="campo-clinico-item">
              <div class="campo-label"><i class="fa-solid fa-clipboard-question" style="color: #ea580c;"></i> Pendientes para Próxima Sesión:</div>
              <div class="campo-contenido">${resaltarTexto(pendientes, query)}</div>
            </div>
          ` : ''}
        </div>

        <div class="nota-footer-meta">
          <span onclick="abrirDetalleSesion(${nota.id})" style="cursor: pointer; color: var(--turquesa); font-weight: 600;">
            <i class="fa-solid fa-arrow-up-right-from-square" style="margin-right: 3px;"></i> Ver sesión ampliada
          </span>
          <span><i class="fa-solid fa-lock" style="color: #16a34a; margin-right: 3px;"></i> Cifrado AES-256-GCM</span>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

export function buscarEnNotasExpediente(query) {
  if (debounceBusquedaExpediente) clearTimeout(debounceBusquedaExpediente);
  const q = (query || '').trim();

  debounceBusquedaExpediente = setTimeout(async () => {
    const paciente = window.pacienteActivoExpediente;
    if (!paciente) return;

    if (!q) {
      renderListaNotasExpediente(window.notasCacheExpediente || []);
      return;
    }

    try {
      const res = await fetch(`${getApiUrl()}/pacientes/${paciente.id}/expediente/buscar?q=${encodeURIComponent(q)}`, {
        headers: getAuthHeaders()
      });

      const data = await res.json();
      if (data.success) {
        renderListaNotasExpediente(data.data || [], q);
      }
    } catch (error) {
      console.error('Error en búsqueda de notas:', error);
    }
  }, 250);
}

if (typeof window !== 'undefined') {
  window.renderListaNotasExpediente = renderListaNotasExpediente;
  window.resaltarTexto = resaltarTexto;
  window.escapeHtmlText = escapeHtmlText;
  window.buscarEnNotasExpediente = buscarEnNotasExpediente;
}
