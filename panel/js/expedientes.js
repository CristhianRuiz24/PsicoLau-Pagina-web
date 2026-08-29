// =========================================================
// MÓDULO DE EXPEDIENTES CLÍNICOS (PSICOLAU)
// Gestión confidencial, notas de sesión y cifrado AES-256-GCM
// =========================================================

window.directorioPacientesCache = [];
let pacienteActivoExpediente = null;
let notasCacheExpediente = [];
let debounceBusquedaExpediente = null;

/**
 * Obtiene el token JWT almacenado
 */
function getAuthHeaders() {
  const token = localStorage.getItem('psicolau_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

/**
 * Carga el directorio de pacientes en segundo plano para que el buscador global siempre tenga acceso instantáneo
 */
window.cargarDirectorioEnSegundoPlano = async function() {
  try {
    const res = await fetch(`${API_URL}/pacientes`, {
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
};

// Cargar al iniciar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.cargarDirectorioEnSegundoPlano());
} else {
  window.cargarDirectorioEnSegundoPlano();
}

// ---------------------------------------------------------
// 1. DIRECTORIO / MENÚ GENERAL DE EXPEDIENTES
// ---------------------------------------------------------

/**
 * Abre el modal del Directorio de Expedientes y carga todos los pacientes
 */
window.abrirDirectorioExpedientes = async function() {
  const modal = document.getElementById('modalDirectorioExpedientes');
  const container = document.getElementById('directorioPacientesLista');
  const inputBusqueda = document.getElementById('busquedaDirectorioInput');

  if (inputBusqueda) inputBusqueda.value = '';
  if (modal) modal.style.display = 'flex';
  if (container) container.innerHTML = '<div style="text-align: center; padding: 2rem; color: #64748b;"><i class="fa-solid fa-spinner fa-spin" style="font-size: 1.8rem; color: var(--turquesa);"></i><p style="margin-top: 0.6rem;">Cargando directorio de expedientes...</p></div>';

  try {
    const res = await fetch(`${API_URL}/pacientes`, {
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
      if (container) container.innerHTML = `<div style="text-align: center; padding: 2rem; color: #ef4444;"><i class="fa-solid fa-circle-exclamation"></i> ${data.message || 'Error al cargar directorio'}</div>`;
    }
  } catch (error) {
    console.error('Error al abrir directorio:', error);
    if (container) container.innerHTML = '<div style="text-align: center; padding: 2rem; color: #ef4444;"><i class="fa-solid fa-triangle-exclamation"></i> Error de conexión con el servidor.</div>';
  }
};


window.cerrarDirectorioExpedientes = function() {
  const modal = document.getElementById('modalDirectorioExpedientes');
  if (modal) modal.style.display = 'none';
};

/**
 * Renderiza la lista de pacientes en el directorio
 */
function renderDirectorioPacientes(pacientes, query = '') {
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
              <button type="button" class="btn btn-borrar-paciente-directorio is-disabled" onclick="event.stopPropagation(); alert('No se puede eliminar a \'${escapeHtmlText(p.nombre)}\' porque tiene ${numCitas} cita(s) agendada(s) en el calendario.\\n\\nPara eliminar este expediente, primero cancela o elimina sus citas en la agenda.');" title="No se puede borrar: paciente con citas agendadas">
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

/**
 * Filtro interactivo en el directorio
 */
window.filtrarDirectorioExpedientes = function(query) {
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
};

// ---------------------------------------------------------
// 2. EXPEDIENTE CLÍNICO INDIVIDUAL DE PACIENTE
// ---------------------------------------------------------

/**
 * Vuelve al directorio de expedientes desde el modal individual
 */
window.volverAlDirectorioExpedientes = function() {
  window.cerrarModalExpediente();
  window.abrirDirectorioExpedientes();
};

/**
 * Abre el expediente clínico por ID de paciente
 */
window.abrirExpedientePorId = async function(pacienteId) {
  window.cerrarDirectorioExpedientes();
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
    const res = await fetch(`${API_URL}/pacientes/${pacienteId}/expediente`, {
      headers: getAuthHeaders()
    });

    if (res.status === 401) {
      localStorage.removeItem('psicolau_token');
      window.location.href = '/panel/index.html';
      return;
    }

    const data = await res.json();
    if (data.success) {
      pacienteActivoExpediente = data.paciente;
      notasCacheExpediente = data.data || [];
      actualizarCabeceraExpediente(data.paciente, notasCacheExpediente.length);
      renderListaNotasExpediente(notasCacheExpediente);
    } else {
      if (listaContainer) listaContainer.innerHTML = `<div style="text-align: center; padding: 2rem; color: #ef4444;"><i class="fa-solid fa-circle-exclamation"></i> ${data.message || 'Error al obtener expediente'}</div>`;
    }
  } catch (error) {
    console.error('Error al cargar expediente:', error);
    if (listaContainer) listaContainer.innerHTML = '<div style="text-align: center; padding: 2rem; color: #ef4444;"><i class="fa-solid fa-triangle-exclamation"></i> Error al conectar con el servidor.</div>';
  }
};

/**
 * Abre el expediente clínico directamente desde la tarjeta de una cita
 */
window.abrirExpedientePorCita = function(citaId, event) {
  if (event) event.stopPropagation();
  const cita = citasCache.find(c => c.id === citaId);
  if (!cita || !cita.paciente || !cita.paciente.id) {
    alert('No se pudo localizar el registro del paciente asociado a esta cita.');
    return;
  }
  abrirExpedientePorId(cita.paciente.id);
};

window.cerrarModalExpediente = function() {
  const modal = document.getElementById('modalExpedientePaciente');
  if (modal) modal.style.display = 'none';
  pacienteActivoExpediente = null;
  notasCacheExpediente = [];
};

/**
 * Actualiza el encabezado del modal con los datos del paciente y verifica permisos de borrado
 */
function actualizarCabeceraExpediente(paciente, totalNotas) {
  const nombreEl = document.getElementById('expNombrePaciente');
  const infoEl = document.getElementById('expInfoPaciente');
  const badgeNotas = document.getElementById('expBadgeTotalNotas');
  const contenedorBtnEliminar = document.getElementById('contenedorBtnEliminarExpedienteModal');

  if (nombreEl) nombreEl.innerText = paciente.nombre;
  if (badgeNotas) badgeNotas.innerText = `${totalNotas} ${totalNotas === 1 ? 'Sesión Registrada' : 'Sesiones Registradas'}`;

  // Verificar si el paciente tiene citas en caché o en directorio
  const pDirectorio = (window.directorioPacientesCache || []).find(p => p.id === paciente.id);
  const totalCitas = (pDirectorio && pDirectorio._count) ? pDirectorio._count.citas : (citasCache ? citasCache.filter(c => c.paciente && c.paciente.id === paciente.id).length : 0);

  if (infoEl) {
    const tieneEmail = paciente.email && !paciente.email.startsWith('sin-email-');
    let infoHtml = `<span><i class="fa-brands fa-whatsapp" style="color: #16a34a; margin-right: 4px;"></i> ${paciente.telefono || 'Sin teléfono'}</span>`;
    if (tieneEmail) {
      infoHtml += `<span style="margin-left: 1rem;"><i class="fa-regular fa-envelope" style="color: var(--turquesa); margin-right: 4px;"></i> ${paciente.email}</span>`;
    }
    infoHtml += `<span style="margin-left: 1rem;"><i class="fa-solid fa-calendar-check" style="color: #6366f1; margin-right: 4px;"></i> ${totalCitas} citas</span>`;
    if (paciente.enlaceZoom) {
      infoHtml += `<span style="margin-left: 1rem;"><a href="${paciente.enlaceZoom.startsWith('http') ? paciente.enlaceZoom : 'https://' + paciente.enlaceZoom}" target="_blank" style="color: #2563eb; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-video"></i> Sala Zoom</a></span>`;
    }
    infoEl.innerHTML = infoHtml;
  }

  // Configurar botón de eliminar en el pie según la regla de citas agendadas
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


/**
 * Helper para resaltar coincidencias de búsqueda de forma segura
 */
function resaltarTexto(texto, query) {
  if (!texto) return '';
  if (!query) return escapeHtmlText(texto);
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return escapeHtmlText(texto).replace(regex, '<mark class="highlight-expediente">$1</mark>');
}

function escapeHtmlText(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Renderiza la lista cronológica de notas de sesión
 */
function renderListaNotasExpediente(notas, query = '') {
  const container = document.getElementById('listaNotasExpediente');
  if (!container) return;

  if (notas.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem 1.5rem; background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; margin: 1rem 0;">
        <i class="fa-solid fa-notes-medical" style="font-size: 2.6rem; color: #94a3b8; margin-bottom: 0.8rem;"></i>
        <h4 style="color: #334155; margin-bottom: 0.3rem; font-size: 1.1rem;">
          ${query ? 'No se encontraron notas con esa búsqueda' : 'Expediente sin notas de sesión registradas'}
        </h4>
        <p style="color: #64748b; font-size: 0.88rem; max-width: 420px; margin: 0 auto 1.2rem auto;">
          ${query ? `No hay coincidencias para "<strong>${escapeHtmlText(query)}</strong>" en ningún campo clínico de este paciente.` : 'Comienza a documentar las sesiones terapéuticas de Laura con este paciente.'}
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
    const sesionNumero = notas.length - index; // Numeración histórica
    const d = new Date(nota.fechaSesion);
    const fechaTxt = d.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const fechaCapitalizada = fechaTxt.charAt(0).toUpperCase() + fechaTxt.slice(1);

    // Contenido de los 8 campos clínicos
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

        <!-- Resumen Breve Destacado (si existe) -->
        ${resumen ? `
          <div class="nota-resumen-box" onclick="abrirDetalleSesion(${nota.id})" style="cursor: pointer;" title="Clic para agrandar y ver sesión completa">
            <i class="fa-solid fa-quote-left" style="color: var(--turquesa); opacity: 0.6; margin-right: 6px;"></i>
            <span>${resaltarTexto(resumen, query)}</span>
          </div>
        ` : ''}

        <!-- Secciones Clínicas Pobladas -->
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


/**
 * Búsqueda en memoria dentro de las notas del paciente activo (endpoint de búsqueda)
 */
window.buscarEnNotasExpediente = function(query) {
  if (debounceBusquedaExpediente) clearTimeout(debounceBusquedaExpediente);
  const q = (query || '').trim();

  debounceBusquedaExpediente = setTimeout(async () => {
    if (!pacienteActivoExpediente) return;

    if (!q) {
      renderListaNotasExpediente(notasCacheExpediente);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/pacientes/${pacienteActivoExpediente.id}/expediente/buscar?q=${encodeURIComponent(q)}`, {
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
};

// ---------------------------------------------------------
// 3. FORMULARIO DE NUEVA NOTA / EDICIÓN
// ---------------------------------------------------------

window.mostrarFormularioNuevaNota = function(fechaPrefill = null) {
  const formSeccion = document.getElementById('seccionFormNotaExpediente');
  const form = document.getElementById('formNotaExpediente');
  const titulo = document.getElementById('formNotaTitulo');
  const idInput = document.getElementById('exp_nota_id');

  if (form) form.reset();
  if (idInput) idInput.value = '';

  if (titulo) {
    titulo.innerHTML = '<i class="fa-solid fa-plus-circle" style="color: var(--turquesa);"></i> Registrar Nueva Nota de Sesión';
  }

  // Establecer fecha por defecto (hoy en formato YYYY-MM-DD)
  const fechaInput = document.getElementById('exp_fechaSesion');
  if (fechaInput) {
    if (fechaPrefill) {
      const d = new Date(fechaPrefill);
      fechaInput.value = d.toISOString().split('T')[0];
    } else {
      const hoy = new Date();
      fechaInput.value = hoy.toISOString().split('T')[0];
    }
  }

  if (formSeccion) {
    formSeccion.style.display = 'block';
    formSeccion.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
};

window.ocultarFormularioNota = function() {
  const formSeccion = document.getElementById('seccionFormNotaExpediente');
  const form = document.getElementById('formNotaExpediente');
  if (form) form.reset();
  if (formSeccion) formSeccion.style.display = 'none';
};

window.guardarNotaExpediente = async function(event) {
  event.preventDefault();
  if (!pacienteActivoExpediente) return;

  const btnGuardar = document.getElementById('btnGuardarNotaExpediente');
  const textoOriginal = btnGuardar ? btnGuardar.innerHTML : '';
  if (btnGuardar) {
    btnGuardar.disabled = true;
    btnGuardar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Cifrando y Guardando...';
  }

  const idNota = document.getElementById('exp_nota_id').value;
  const fechaSesion = document.getElementById('exp_fechaSesion').value;

  const payload = {
    fechaSesion,
    resumenBreve: document.getElementById('exp_resumenBreve').value.trim(),
    estadoActual: document.getElementById('exp_estadoActual').value.trim(),
    insightPaciente: document.getElementById('exp_insightPaciente').value.trim(),
    eventoPrincipal: document.getElementById('exp_eventoPrincipal').value.trim(),
    intervenciones: document.getElementById('exp_intervenciones').value.trim(),
    formulacionClinica: document.getElementById('exp_formulacionClinica').value.trim(),
    tareasAsignadas: document.getElementById('exp_tareasAsignadas').value.trim(),
    pendientesProximaSesion: document.getElementById('exp_pendientesProximaSesion').value.trim()
  };

  try {
    let url = `${API_URL}/pacientes/${pacienteActivoExpediente.id}/expediente`;
    let method = 'POST';

    if (idNota) {
      url = `${API_URL}/expediente/${idNota}`;
      method = 'PUT';
    }

    const res = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.success) {
      ocultarFormularioNota();
      // Recargar expediente
      await abrirExpedientePorId(pacienteActivoExpediente.id);
    } else {
      alert(data.message || 'Error al guardar la nota clínica');
    }
  } catch (error) {
    console.error('Error al guardar nota:', error);
    alert('Error de conexión al guardar la nota clínica');
  } finally {
    if (btnGuardar) {
      btnGuardar.disabled = false;
      btnGuardar.innerHTML = textoOriginal;
    }
  }
};

window.editarNotaExpedienteModal = function(notaId) {
  const nota = notasCacheExpediente.find(n => n.id === notaId);
  if (!nota) return;

  mostrarFormularioNuevaNota();

  const titulo = document.getElementById('formNotaTitulo');
  if (titulo) {
    titulo.innerHTML = '<i class="fa-solid fa-pen-to-square" style="color: var(--rosa-coral);"></i> Editar Nota de Sesión';
  }

  document.getElementById('exp_nota_id').value = nota.id;
  
  if (nota.fechaSesion) {
    const d = new Date(nota.fechaSesion);
    document.getElementById('exp_fechaSesion').value = d.toISOString().split('T')[0];
  }

  document.getElementById('exp_resumenBreve').value = nota.resumenBreve || '';
  document.getElementById('exp_estadoActual').value = nota.estadoActual || '';
  document.getElementById('exp_insightPaciente').value = nota.insightPaciente || '';
  document.getElementById('exp_eventoPrincipal').value = nota.eventoPrincipal || '';
  document.getElementById('exp_intervenciones').value = nota.intervenciones || '';
  document.getElementById('exp_formulacionClinica').value = nota.formulacionClinica || '';
  document.getElementById('exp_tareasAsignadas').value = nota.tareasAsignadas || '';
  document.getElementById('exp_pendientesProximaSesion').value = nota.pendientesProximaSesion || '';

  const formSeccion = document.getElementById('seccionFormNotaExpediente');
  if (formSeccion) {
    formSeccion.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

window.eliminarNotaExpedienteConfirm = async function(notaId) {
  if (!confirm('¿Estás segura de que deseas eliminar permanentemente esta nota clínica? Esta acción no se puede deshacer.')) {
    return;
  }

  try {
    const res = await fetch(`${API_URL}/expediente/${notaId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    const data = await res.json();
    if (data.success) {
      if (pacienteActivoExpediente) {
        await abrirExpedientePorId(pacienteActivoExpediente.id);
      }
    } else {
      alert(data.message || 'Error al eliminar la nota clínica');
    }
  } catch (error) {
    console.error('Error al eliminar nota:', error);
    alert('Error de conexión al eliminar nota clínica');
  }
};

/**
 * Elimina un paciente completo y todo su expediente clínico con confirmación (solo si no tiene citas)
 */
window.eliminarPacienteDirectorio = async function(pacienteId, nombrePaciente, numCitas = 0) {
  const nombre = nombrePaciente || 'este paciente';

  if (numCitas > 0) {
    alert(`No se puede eliminar a "${nombre}" porque tiene ${numCitas} cita(s) agendada(s) en el calendario.\n\nPara eliminar su expediente, primero cancela o elimina sus citas en la agenda.`);
    return;
  }

  if (!confirm(`¿Estás segura de que deseas eliminar permanentemente a "${nombre}" y todo su expediente clínico?\n\nEsta acción es irreversible.`)) {
    return;
  }

  try {
    const res = await fetch(`${API_URL}/pacientes/${pacienteId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    const data = await res.json();
    if (data.success) {
      // Cerrar modal de expediente si estaba abierto
      window.cerrarModalExpediente();
      // Recargar directorio en segundo plano y actualizar lista si el modal de directorio está visible
      await window.cargarDirectorioEnSegundoPlano();
      const modalDir = document.getElementById('modalDirectorioExpedientes');
      if (modalDir && modalDir.style.display === 'flex') {
        renderDirectorioPacientes(window.directorioPacientesCache);
      }
      // Recargar agenda
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
};


// ---------------------------------------------------------
// 4. VISTA CÓMODA / AGRANDADA DE SESIÓN INDIVIDUAL CON EDICIÓN IN SITU
// ---------------------------------------------------------

let notaActivaDetalleId = null;
let esDetalleMaximizado = false;
let esModalExpedienteMaximizado = false;
let esModoEdicionDetalle = false;

/**
 * Abre la vista cómoda y agrandada de una sesión individual
 */
window.abrirDetalleSesion = function(notaId) {
  if (!notasCacheExpediente || !pacienteActivoExpediente) return;

  const nota = notasCacheExpediente.find(n => n.id === notaId);
  if (!nota) return;

  notaActivaDetalleId = notaId;
  esModoEdicionDetalle = false;
  const index = notasCacheExpediente.findIndex(n => n.id === notaId);
  const sesionNumero = notasCacheExpediente.length - index;

  const modal = document.getElementById('modalDetalleSesionExpediente');
  const badgeNum = document.getElementById('detalleSesionBadgeNum');
  const fechaEl = document.getElementById('detalleSesionFecha');
  const pacienteEl = document.getElementById('detalleSesionPaciente');
  const contenido = document.getElementById('detalleSesionContenido');

  const d = new Date(nota.fechaSesion);
  const fechaTxt = d.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const fechaCap = fechaTxt.charAt(0).toUpperCase() + fechaTxt.slice(1);

  if (badgeNum) badgeNum.innerText = `Sesión #${sesionNumero}`;
  if (fechaEl) fechaEl.innerText = fechaCap;
  if (pacienteEl) pacienteEl.innerHTML = `<i class="fa-solid fa-user-check" style="margin-right: 4px;"></i> Paciente: <strong>${escapeHtmlText(pacienteActivoExpediente.nombre)}</strong>`;

  // Renderizar barra de botones en modo lectura
  actualizarBotonesBarraDetalle(false);

  // Renderizar contenido amplio de los 8 campos clínicos
  let html = `
    <div style="display: flex; flex-direction: column; gap: 1.2rem; padding: 0.5rem 0;">
  `;

  if (nota.resumenBreve) {
    html += `
      <div style="background: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 0 10px 10px 0; padding: 1.1rem 1.4rem; box-shadow: 0 2px 8px rgba(34,197,94,0.08);">
        <div style="font-size: 0.85rem; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.3rem;">
          <i class="fa-solid fa-quote-left" style="margin-right: 4px;"></i> Resumen Principal de la Sesión
        </div>
        <div style="font-size: 1.1rem; color: #14532d; font-weight: 600; line-height: 1.5; white-space: pre-line;">
          ${escapeHtmlText(nota.resumenBreve)}
        </div>
      </div>
    `;
  }

  html += `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 1.2rem;">`;

  const campos = [
    { key: 'estadoActual', label: '1. Estado Actual / Motivo de Consulta', icon: 'fa-heart-pulse', color: '#ec4899', bg: '#fdf2f8' },
    { key: 'insightPaciente', label: '2. Insight del Paciente', icon: 'fa-lightbulb', color: '#eab308', bg: '#fefce8' },
    { key: 'eventoPrincipal', label: '3. Evento Principal / Relevante', icon: 'fa-star', color: '#f97316', bg: '#fff7ed' },
    { key: 'intervenciones', label: '4. Intervenciones Clínicas Realizadas', icon: 'fa-hand-holding-medical', color: '#0284c7', bg: '#f0f9ff' },
    { key: 'formulacionClinica', label: '5. Formulación Clínica en Evolución', icon: 'fa-brain', color: '#8b5cf6', bg: '#f5f3ff' },
    { key: 'tareasAsignadas', label: '6. Tareas y Acuerdos Asignados', icon: 'fa-list-check', color: '#10b981', bg: '#ecfdf5' },
    { key: 'pendientesProximaSesion', label: '7. Pendientes para Próxima Sesión', icon: 'fa-clipboard-question', color: '#ea580c', bg: '#fff7ed' }
  ];

  campos.forEach(c => {
    const valor = nota[c.key];
    if (valor) {
      html += `
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.2rem; box-shadow: 0 2px 10px rgba(0,0,0,0.03);">
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.6rem; padding-bottom: 0.5rem; border-bottom: 1px solid #f1f5f9;">
            <div style="width: 28px; height: 28px; border-radius: 6px; background: ${c.bg}; color: ${c.color}; display: flex; align-items: center; justify-content: center; font-size: 0.9rem;">
              <i class="fa-solid ${c.icon}"></i>
            </div>
            <span style="font-size: 0.88rem; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 0.3px;">
              ${c.label}
            </span>
          </div>
          <div style="font-size: 0.98rem; color: #334155; line-height: 1.6; white-space: pre-line; padding-left: 2px;">
            ${escapeHtmlText(valor)}
          </div>
        </div>
      `;
    }
  });

  html += `
      </div>
      <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 0.5rem; text-align: right;">
        Nota registrada el ${new Date(nota.creadoEn).toLocaleDateString('es-MX')} · Cifrado AES-256-GCM
      </div>
    </div>
  `;

  if (contenido) contenido.innerHTML = html;
  if (modal) modal.style.display = 'flex';
};

/**
 * Actualiza la barra de acciones superior e inferior según si está en modo lectura o edición in situ
 */
function actualizarBotonesBarraDetalle(modoEdicion) {
  const container = document.getElementById('detalleSesionAccionesTop');
  if (!container) return;

  if (modoEdicion) {
    container.innerHTML = `
      <button type="button" class="btn" style="width: auto; padding: 0.55rem 1.1rem; font-size: 0.86rem; background: var(--turquesa); color: white; font-weight: 700;" onclick="guardarEdicionInSituDetalle(event)" id="btnGuardarDetalleInSitu">
        <i class="fa-solid fa-floppy-disk" style="margin-right: 4px;"></i> Guardar Cambios
      </button>
      <button type="button" class="btn" style="width: auto; padding: 0.55rem 0.95rem; font-size: 0.86rem; background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1;" onclick="cancelarEdicionInSituDetalle()">
        <i class="fa-solid fa-xmark" style="margin-right: 4px;"></i> Cancelar
      </button>
      <button type="button" class="btn" style="width: auto; padding: 0.55rem 0.85rem; font-size: 0.85rem; background: #f8fafc; color: #475569; border: 1px solid #cbd5e1;" onclick="toggleAgrandarDetalleSesion()" title="Agrandar o reducir tamaño">
        <i class="fa-solid fa-expand" id="iconAgrandarDetalle"></i>
      </button>
    `;
  } else {
    container.innerHTML = `
      <button type="button" class="btn" style="width: auto; padding: 0.55rem 0.95rem; font-size: 0.85rem; background: #0284c7; color: white;" onclick="imprimirNotaActualDetalle()" title="Imprimir o guardar en PDF únicamente esta sesión">
        <i class="fa-solid fa-file-pdf" style="margin-right: 4px;"></i> Imprimir PDF
      </button>
      <button type="button" class="btn" style="width: auto; padding: 0.55rem 0.95rem; font-size: 0.85rem; background: #475569; color: white;" onclick="descargarNotaActualTxt()" title="Descargar nota en archivo de texto (.txt)">
        <i class="fa-solid fa-file-lines" style="margin-right: 4px;"></i> Guardar .txt
      </button>
      <button type="button" class="btn" style="width: auto; padding: 0.55rem 0.95rem; font-size: 0.85rem; background: #f8fafc; color: var(--texto-oscuro); border: 1px solid #cbd5e1;" onclick="editarNotaDesdeDetalle()" title="Editar nota clínica en esta misma vista">
        <i class="fa-solid fa-pen-to-square" style="color: var(--turquesa); margin-right: 4px;"></i> Editar
      </button>
      <button type="button" class="btn" style="width: auto; padding: 0.55rem 0.85rem; font-size: 0.85rem; background: #f8fafc; color: #475569; border: 1px solid #cbd5e1;" onclick="toggleAgrandarDetalleSesion()" title="Agrandar o reducir tamaño">
        <i class="fa-solid fa-expand" id="iconAgrandarDetalle"></i>
      </button>
      <button type="button" class="btn-close-modal" onclick="cerrarDetalleSesion()" title="Cerrar vista">&times;</button>
    `;
  }
}

/**
 * Habilita el formulario de edición DIRECTAMENTE dentro de la vista ampliada de sesión
 */
window.editarNotaDesdeDetalle = function() {
  if (!notaActivaDetalleId || !notasCacheExpediente) return;

  const nota = notasCacheExpediente.find(n => n.id === notaActivaDetalleId);
  if (!nota) return;

  esModoEdicionDetalle = true;
  actualizarBotonesBarraDetalle(true);

  const contenido = document.getElementById('detalleSesionContenido');
  const d = new Date(nota.fechaSesion);
  const fechaIso = d.toISOString().split('T')[0];

  let html = `
    <form id="formEdicionInSituDetalle" onsubmit="guardarEdicionInSituDetalle(event)" style="display: flex; flex-direction: column; gap: 1rem; padding: 0.5rem 0;">
      <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 1rem;">
        <div>
          <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.3rem;">
            <i class="fa-regular fa-calendar" style="color: var(--turquesa);"></i> Fecha de la Sesión:
          </label>
          <input type="date" id="insitu_fechaSesion" value="${fechaIso}" required style="width: 100%; padding: 0.65rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem; background: #f8fafc;">
        </div>
        <div>
          <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.3rem;">
            <i class="fa-solid fa-quote-left" style="color: var(--turquesa);"></i> Resumen Breve / Título Clínico:
          </label>
          <input type="text" id="insitu_resumenBreve" value="${escapeHtmlText(nota.resumenBreve || '')}" placeholder="Resumen clave de la sesión..." style="width: 100%; padding: 0.65rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem;">
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 1rem;">
        <div>
          <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #ec4899; margin-bottom: 0.3rem;">
            <i class="fa-solid fa-heart-pulse"></i> 1. Estado Actual / Motivo de Consulta:
          </label>
          <textarea id="insitu_estadoActual" rows="4" placeholder="Síntomas, afecto, regulación emocional..." style="width: 100%; padding: 0.65rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; resize: vertical; font-family: inherit;">${escapeHtmlText(nota.estadoActual || '')}</textarea>
        </div>

        <div>
          <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #b45309; margin-bottom: 0.3rem;">
            <i class="fa-solid fa-lightbulb"></i> 2. Insight del Paciente:
          </label>
          <textarea id="insitu_insightPaciente" rows="4" placeholder="Comprensión, tomas de conciencia del paciente..." style="width: 100%; padding: 0.65rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; resize: vertical; font-family: inherit;">${escapeHtmlText(nota.insightPaciente || '')}</textarea>
        </div>

        <div>
          <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #c2410c; margin-bottom: 0.3rem;">
            <i class="fa-solid fa-star"></i> 3. Evento Principal / Relevante:
          </label>
          <textarea id="insitu_eventoPrincipal" rows="4" placeholder="Lo más relevante ocurrido en la semana o sesión..." style="width: 100%; padding: 0.65rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; resize: vertical; font-family: inherit;">${escapeHtmlText(nota.eventoPrincipal || '')}</textarea>
        </div>

        <div>
          <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #0284c7; margin-bottom: 0.3rem;">
            <i class="fa-solid fa-hand-holding-medical"></i> 4. Intervenciones Clínicas Realizadas:
          </label>
          <textarea id="insitu_intervenciones" rows="4" placeholder="Técnicas aplicadas, psicoeducación, reestructuración..." style="width: 100%; padding: 0.65rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; resize: vertical; font-family: inherit;">${escapeHtmlText(nota.intervenciones || '')}</textarea>
        </div>

        <div>
          <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #7c3aed; margin-bottom: 0.3rem;">
            <i class="fa-solid fa-brain"></i> 5. Formulación Clínica en Evolución:
          </label>
          <textarea id="insitu_formulacionClinica" rows="4" placeholder="Hipótesis de trabajo, patrones identificados..." style="width: 100%; padding: 0.65rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; resize: vertical; font-family: inherit;">${escapeHtmlText(nota.formulacionClinica || '')}</textarea>
        </div>

        <div>
          <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #15803d; margin-bottom: 0.3rem;">
            <i class="fa-solid fa-list-check"></i> 6. Tareas y Acuerdos Asignados:
          </label>
          <textarea id="insitu_tareasAsignadas" rows="4" placeholder="Ejercicios entre sesiones, registros, compromisos..." style="width: 100%; padding: 0.65rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; resize: vertical; font-family: inherit;">${escapeHtmlText(nota.tareasAsignadas || '')}</textarea>
        </div>

        <div style="grid-column: 1 / -1;">
          <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #9a3412; margin-bottom: 0.3rem;">
            <i class="fa-solid fa-clipboard-question"></i> 7. Pendientes para Próxima Sesión:
          </label>
          <textarea id="insitu_pendientesProximaSesion" rows="3" placeholder="Puntos a retomar o evaluar en la siguiente cita..." style="width: 100%; padding: 0.65rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; resize: vertical; font-family: inherit;">${escapeHtmlText(nota.pendientesProximaSesion || '')}</textarea>
        </div>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 0.6rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; margin-top: 0.5rem;">
        <button type="button" class="btn" style="background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; width: auto; padding: 0.6rem 1.2rem;" onclick="cancelarEdicionInSituDetalle()">Cancelar</button>
        <button type="submit" class="btn" style="background: var(--turquesa); color: white; width: auto; padding: 0.6rem 1.6rem; font-weight: 700;" id="btnGuardarDetalleInSituSubmit">
          <i class="fa-solid fa-floppy-disk" style="margin-right: 4px;"></i> Guardar Cambios
        </button>
      </div>
    </form>
  `;

  if (contenido) {
    contenido.innerHTML = html;
    contenido.scrollTop = 0;
  }
};

/**
 * Guarda los cambios editados directamente dentro de la vista ampliada
 */
window.guardarEdicionInSituDetalle = async function(event) {
  if (event) event.preventDefault();
  if (!notaActivaDetalleId || !pacienteActivoExpediente) return;

  const btnSubmit = document.getElementById('btnGuardarDetalleInSituSubmit') || document.getElementById('btnGuardarDetalleInSitu');
  const txtOriginal = btnSubmit ? btnSubmit.innerHTML : '';
  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';
  }

  const payload = {
    fechaSesion: document.getElementById('insitu_fechaSesion').value,
    resumenBreve: (document.getElementById('insitu_resumenBreve').value || '').trim(),
    estadoActual: (document.getElementById('insitu_estadoActual').value || '').trim(),
    insightPaciente: (document.getElementById('insitu_insightPaciente').value || '').trim(),
    eventoPrincipal: (document.getElementById('insitu_eventoPrincipal').value || '').trim(),
    intervenciones: (document.getElementById('insitu_intervenciones').value || '').trim(),
    formulacionClinica: (document.getElementById('insitu_formulacionClinica').value || '').trim(),
    tareasAsignadas: (document.getElementById('insitu_tareasAsignadas').value || '').trim(),
    pendientesProximaSesion: (document.getElementById('insitu_pendientesProximaSesion').value || '').trim()
  };

  try {
    const res = await fetch(`${API_URL}/expediente/${notaActivaDetalleId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.success) {
      // Actualizar caché de notas
      const index = notasCacheExpediente.findIndex(n => n.id === notaActivaDetalleId);
      if (index !== -1) {
        notasCacheExpediente[index] = data.data;
      }
      // Actualizar lista en el fondo
      renderListaNotasExpediente(notasCacheExpediente);
      // Volver a mostrar en modo lectura con los datos actualizados
      abrirDetalleSesion(notaActivaDetalleId);
    } else {
      alert(data.message || 'Error al guardar la nota clínica');
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = txtOriginal;
      }
    }
  } catch (error) {
    console.error('Error al guardar edición in situ:', error);
    alert('Error de conexión al guardar nota clínica');
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = txtOriginal;
    }
  }
};

window.cancelarEdicionInSituDetalle = function() {
  if (notaActivaDetalleId) {
    abrirDetalleSesion(notaActivaDetalleId);
  }
};

window.cerrarDetalleSesion = function() {
  const modal = document.getElementById('modalDetalleSesionExpediente');
  if (modal) modal.style.display = 'none';
  notaActivaDetalleId = null;
  esModoEdicionDetalle = false;
};

/**
 * Alterna el modo ampliado / pantalla completa para la vista de sesión individual
 */
window.toggleAgrandarDetalleSesion = function() {
  const dialogo = document.getElementById('dialogoDetalleSesion');
  const icono = document.getElementById('iconAgrandarDetalle');
  esDetalleMaximizado = !esDetalleMaximizado;

  if (dialogo) {
    if (esDetalleMaximizado) {
      dialogo.style.maxWidth = '98vw';
      dialogo.style.height = '96vh';
      dialogo.style.maxHeight = '96vh';
      if (icono) icono.className = 'fa-solid fa-compress';
    } else {
      dialogo.style.maxWidth = '960px';
      dialogo.style.height = 'auto';
      dialogo.style.maxHeight = '94vh';
      if (icono) icono.className = 'fa-solid fa-expand';
    }
  }
};

/**
 * Alterna el modo ampliado / pantalla completa para el modal general del expediente
 */
window.toggleMaximizarModalExpediente = function() {
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
};

// ---------------------------------------------------------
// 5. IMPRESIÓN Y DESCARGA INDIVIDUAL POR SESIÓN (AJUSTADA A 1 PÁGINA)
// ---------------------------------------------------------

/**
 * Genera el documento HTML formateado exclusivamente para una sola sesión ajustado a 1 página
 */
function generarHtmlNotaIndividualImprimible(p, nota, sesionNumero, fechaHoy) {
  const d = new Date(nota.fechaSesion);
  const fechaTxt = d.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const fechaCap = fechaTxt.charAt(0).toUpperCase() + fechaTxt.slice(1);

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Nota de Sesión #${sesionNumero} — ${escapeHtmlText(p.nombre)} — PsicoLau</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      <style>
        @page {
          size: letter portrait;
          margin: 8mm 12mm;
        }
        * {
          box-sizing: border-box;
        }
        html, body {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          color: #1e293b;
          background: #ffffff;
          line-height: 1.35;
          font-size: 9pt;
          margin: 0;
          padding: 0;
        }
        .header-membrete {
          border-bottom: 2px solid #EC5E86;
          padding-bottom: 6px;
          margin-bottom: 8px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .brand-title {
          color: #EC5E86;
          font-size: 16pt;
          font-weight: 800;
          margin: 0;
          letter-spacing: -0.5px;
          line-height: 1.1;
        }
        .brand-sub {
          color: #3EB8CC;
          font-size: 9.5pt;
          font-weight: 600;
          margin: 1px 0 0 0;
        }
        .brand-prof {
          color: #64748b;
          font-size: 8.5pt;
          margin: 1px 0 0 0;
        }
        .paciente-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 6px 10px;
          margin-bottom: 8px;
        }
        .paciente-grid {
          display: grid;
          grid-template-columns: 1.4fr 1.3fr 0.9fr;
          gap: 6px;
          font-size: 9pt;
        }
        .paciente-grid strong {
          color: #334155;
        }
        .sesion-num-badge {
          background: #EC5E86;
          color: #ffffff;
          font-size: 8pt;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 4px;
          display: inline-block;
        }
        .resumen-box {
          background: #f0fdf4;
          border-left: 3px solid #22c55e;
          padding: 6px 10px;
          font-size: 9pt;
          color: #166534;
          margin-bottom: 8px;
          border-radius: 0 4px 4px 0;
        }
        .campo-doc {
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 5px 8px;
          margin-bottom: 6px;
          page-break-inside: avoid;
        }
        .campo-doc strong {
          color: #0f172a;
          display: block;
          margin-bottom: 2px;
          font-size: 8.5pt;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .campo-doc p {
          margin: 0;
          color: #334155;
          white-space: pre-line;
          font-size: 8.8pt;
        }
        .firma-area {
          margin-top: 14px;
          display: flex;
          justify-content: flex-end;
          page-break-inside: avoid;
        }
        .firma-box {
          border-top: 1px solid #94a3b8;
          width: 240px;
          text-align: center;
          padding-top: 4px;
          font-size: 8.5pt;
          color: #334155;
        }
        .footer-confidencial {
          margin-top: 8px;
          border-top: 1px solid #cbd5e1;
          padding-top: 4px;
          font-size: 7.5pt;
          color: #94a3b8;
          text-align: center;
          page-break-inside: avoid;
        }
      </style>
    </head>
    <body>
      <div class="header-membrete">
        <div>
          <h1 class="brand-title">PSICOLAU</h1>
          <p class="brand-sub">Psicología Clínica y Resiliencia</p>
          <p class="brand-prof">Ana Laura Gómez Díaz · Psicoterapia y Neuropsicología</p>
        </div>
        <div style="text-align: right; font-size: 8.5pt; color: #64748b;">
          <div><strong>NOTA CLÍNICA INDIVIDUAL</strong></div>
          <div>Fecha de emisión: ${fechaHoy}</div>
          <div>Dominio: psicolau.com</div>
        </div>
      </div>

      <div class="paciente-box">
        <div class="paciente-grid">
          <div><strong>Paciente:</strong> ${escapeHtmlText(p.nombre)}</div>
          <div><strong>Fecha de Sesión:</strong> ${fechaCap}</div>
          <div><strong>Sesión:</strong> <span class="sesion-num-badge">Sesión #${sesionNumero}</span></div>
        </div>
      </div>

      ${nota.resumenBreve ? `
        <div class="resumen-box">
          <strong style="display: block; margin-bottom: 1px;">Resumen Clínico:</strong>
          ${escapeHtmlText(nota.resumenBreve)}
        </div>
      ` : ''}

      ${nota.estadoActual ? `
        <div class="campo-doc">
          <strong style="color: #ec4899;">1. Estado Actual / Motivo de Consulta:</strong>
          <p>${escapeHtmlText(nota.estadoActual)}</p>
        </div>
      ` : ''}

      ${nota.insightPaciente ? `
        <div class="campo-doc">
          <strong style="color: #b45309;">2. Insight del Paciente:</strong>
          <p>${escapeHtmlText(nota.insightPaciente)}</p>
        </div>
      ` : ''}

      ${nota.eventoPrincipal ? `
        <div class="campo-doc">
          <strong style="color: #c2410c;">3. Evento Principal / Relevante:</strong>
          <p>${escapeHtmlText(nota.eventoPrincipal)}</p>
        </div>
      ` : ''}

      ${nota.intervenciones ? `
        <div class="campo-doc">
          <strong style="color: #0284c7;">4. Intervenciones Clínicas Realizadas:</strong>
          <p>${escapeHtmlText(nota.intervenciones)}</p>
        </div>
      ` : ''}

      ${nota.formulacionClinica ? `
        <div class="campo-doc">
          <strong style="color: #7c3aed;">5. Formulación Clínica en Evolución:</strong>
          <p>${escapeHtmlText(nota.formulacionClinica)}</p>
        </div>
      ` : ''}

      ${nota.tareasAsignadas ? `
        <div class="campo-doc">
          <strong style="color: #15803d;">6. Tareas y Acuerdos Asignados:</strong>
          <p>${escapeHtmlText(nota.tareasAsignadas)}</p>
        </div>
      ` : ''}

      ${nota.pendientesProximaSesion ? `
        <div class="campo-doc">
          <strong style="color: #9a3412;">7. Pendientes para Próxima Sesión:</strong>
          <p>${escapeHtmlText(nota.pendientesProximaSesion)}</p>
        </div>
      ` : ''}

      <div class="firma-area">
        <div class="firma-box">
          <strong>Psic. Ana Laura Gómez Díaz</strong><br>
          Psicóloga Clínica y Neuropsicóloga
        </div>
      </div>

      <div class="footer-confidencial">
        Documento médico confidencial emitido bajo secreto profesional deontológico.
        <br>© PsicoLau — psicolau.com
      </div>
    </body>
    </html>
  `;
}


/**
 * Imprime una sola sesión en PDF limpio sin marcas "about:blank"
 */
window.imprimirNotaIndividual = function(notaId) {
  if (!pacienteActivoExpediente || !notasCacheExpediente) return;

  const nota = notasCacheExpediente.find(n => n.id === notaId);
  if (!nota) return;

  const index = notasCacheExpediente.findIndex(n => n.id === notaId);
  const sesionNumero = notasCacheExpediente.length - index;
  const fechaHoy = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

  const htmlDoc = generarHtmlNotaIndividualImprimible(pacienteActivoExpediente, nota, sesionNumero, fechaHoy);

  let iframe = document.getElementById('iframeImpresionExpediente');
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'iframeImpresionExpediente';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
  }

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(htmlDoc);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  }, 350);
};

/**
 * Imprime la nota abierta actualmente en el modal de detalle
 */
window.imprimirNotaActualDetalle = function() {
  if (notaActivaDetalleId) {
    imprimirNotaIndividual(notaActivaDetalleId);
  }
};

/**
 * Descarga el archivo .txt de una sola sesión
 */
window.descargarNotaIndividualTxt = function(notaId) {
  if (!pacienteActivoExpediente || !notasCacheExpediente) return;

  const nota = notasCacheExpediente.find(n => n.id === notaId);
  if (!nota) return;

  const index = notasCacheExpediente.findIndex(n => n.id === notaId);
  const sesionNumero = notasCacheExpediente.length - index;
  const p = pacienteActivoExpediente;
  const d = new Date(nota.fechaSesion);
  const fechaTxt = d.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const fechaHoy = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

  let txt = `=======================================================\n`;
  txt += `PSICOLAU — NOTA CLÍNICA DE SESIÓN #${sesionNumero}\n`;
  txt += `Psicología Clínica y Neuropsicología · Ana Laura Gómez Díaz\n`;
  txt += `Dominio: psicolau.com | Fecha de emisión: ${fechaHoy}\n`;
  txt += `=======================================================\n\n`;
  txt += `DATOS DEL PACIENTE:\n`;
  txt += `• Paciente: ${p.nombre}\n`;
  txt += `• Teléfono: ${p.telefono || 'No registrado'}\n`;
  txt += `• Fecha de Sesión: ${fechaTxt.toUpperCase()}\n`;
  txt += `• Número de Sesión: Sesión #${sesionNumero}\n\n`;
  txt += `=======================================================\n`;
  txt += `CONTENIDO DE LA SESIÓN:\n`;
  txt += `=======================================================\n\n`;

  if (nota.resumenBreve) txt += `RESUMEN CLÍNICO:\n${nota.resumenBreve}\n\n`;
  if (nota.estadoActual) txt += `1. ESTADO ACTUAL / MOTIVO DE CONSULTA:\n${nota.estadoActual}\n\n`;
  if (nota.insightPaciente) txt += `2. INSIGHT DEL PACIENTE:\n${nota.insightPaciente}\n\n`;
  if (nota.eventoPrincipal) txt += `3. EVENTO PRINCIPAL / RELEVANTE:\n${nota.eventoPrincipal}\n\n`;
  if (nota.intervenciones) txt += `4. INTERVENCIONES CLÍNICAS REALIZADAS:\n${nota.intervenciones}\n\n`;
  if (nota.formulacionClinica) txt += `5. FORMULACIÓN CLÍNICA EN EVOLUCIÓN:\n${nota.formulacionClinica}\n\n`;
  if (nota.tareasAsignadas) txt += `6. TAREAS Y ACUERDOS ASIGNADOS:\n${nota.tareasAsignadas}\n\n`;
  if (nota.pendientesProximaSesion) txt += `7. PENDIENTES PRÓXIMA SESIÓN:\n${nota.pendientesProximaSesion}\n\n`;

  txt += `=======================================================\n`;
  txt += `Documento médico confidencial emitido bajo secreto profesional.\n`;

  const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const nombreSanitizado = (p.nombre || 'paciente').replace(/\s+/g, '_').toLowerCase();
  const fechaIso = d.toISOString().split('T')[0];
  link.download = `Nota_Sesion_${sesionNumero}_${nombreSanitizado}_${fechaIso}.txt`;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Descarga el .txt de la nota abierta actualmente en el modal de detalle
 */
window.descargarNotaActualTxt = function() {
  if (notaActivaDetalleId) {
    descargarNotaIndividualTxt(notaActivaDetalleId);
  }
};


