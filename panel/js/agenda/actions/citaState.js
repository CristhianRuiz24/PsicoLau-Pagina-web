// panel/js/agenda/actions/citaState.js
// RF-06: Gestión de estados de cita (completar, cancelar, reactivar), Zoom, WhatsApp, edición y eliminación (individual y series)

import { renderSwatches } from '../utils/colors.js';
import { parsearTelefono } from '../utils/phone.js';
import { renderEasyTable } from '../render/weeklyTable.js';
import { abrirModal, cerrarModal, mostrarModalDirecto, seleccionarTipoRegistro, seleccionarEstadoModal, setModoFormulario } from '../form/modal.js';
import { actualizarDatalistPacientes } from '../form/autocomplete.js';
import { asegurarModal } from '../utils/modalLoader.js';

export function abrirZoomSesion(citaId, event) {
  if (event) event.stopPropagation();
  const cache = (typeof window !== 'undefined' && Array.isArray(window.citasCache)) ? window.citasCache : [];
  const cita = cache.find(c => c.id === citaId);
  if (!cita) return;

  const link = cita.paciente && cita.paciente.enlaceZoom ? cita.paciente.enlaceZoom.trim() : null;
  if (link) {
    let urlFinal = link;
    if (!urlFinal.startsWith('http://') && !urlFinal.startsWith('https://')) {
      urlFinal = `https://${urlFinal}`;
    }
    window.open(urlFinal, '_blank');
  } else {
    alert(`El paciente "${cita.paciente?.nombre || 'Paciente'}" aún no tiene configurado su enlace de Zoom.\n\nA continuación se abrirá el formulario para que puedas pegarlo en un segundo.`);
    editarCita(cita.id);
    setTimeout(() => {
      const zoomInput = document.getElementById('nc_enlace_zoom');
      if (zoomInput) zoomInput.focus();
    }, 150);
  }
}

export async function toggleCompletarCita(id, e) {
  if (e) e.stopPropagation();
  const cache = (typeof window !== 'undefined' && Array.isArray(window.citasCache)) ? window.citasCache : [];
  const cita = cache.find(c => c.id === id);
  if (!cita) return;

  const esActualmenteHecha = cita.estado_cita === 'REALIZADA' || cita.estado_cita === 'CONFIRMADA';
  const nuevoEstado = esActualmenteHecha ? 'PENDIENTE' : 'REALIZADA';
  const esMarcarComoHecha = nuevoEstado === 'REALIZADA';

  if (esMarcarComoHecha) {
    if (typeof window !== 'undefined' && typeof window.reproducirSonidoCompletada === 'function') {
      window.reproducirSonidoCompletada();
    }
    const blockEl = document.getElementById(`cita-block-${id}`);
    if (blockEl) {
      blockEl.classList.remove('anim-pop-complete');
      void blockEl.offsetWidth;
      blockEl.classList.add('anim-pop-complete');
    }
  }

  const token = localStorage.getItem('psicolau_token');
  const apiUrl = (typeof window !== 'undefined' && window.API_URL) ? window.API_URL : '/api';
  try {
    const res = await fetch(`${apiUrl}/agenda/citas/${id}/estado`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ estado_cita: nuevoEstado })
    });
    const data = await res.json();
    if (data.success) {
      cita.estado_cita = nuevoEstado;
      renderEasyTable();

      if (esMarcarComoHecha) {
        setTimeout(() => {
          const newBlock = document.getElementById(`cita-block-${id}`);
          if (newBlock) {
            newBlock.classList.add('anim-pop-complete');
          }
        }, 30);
      }
    }
  } catch (error) {
    console.error('Error al actualizar estado:', error);
  }
}

export async function toggleCancelarCita(id, e) {
  if (e) e.stopPropagation();
  const cache = (typeof window !== 'undefined' && Array.isArray(window.citasCache)) ? window.citasCache : [];
  const cita = cache.find(c => c.id === id);
  if (!cita) return;

  if (typeof window !== 'undefined' && typeof window.reproducirSonidoPop === 'function') {
    window.reproducirSonidoPop();
  }

  cita.estado_cita = 'CANCELADA';
  renderEasyTable();

  const token = localStorage.getItem('psicolau_token');
  const apiUrl = (typeof window !== 'undefined' && window.API_URL) ? window.API_URL : '/api';
  try {
    const res = await fetch(`${apiUrl}/agenda/citas/${id}/estado`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ estado_cita: 'CANCELADA' })
    });
    const data = await res.json();
    if (!data.success) {
      alert(data.message || 'Error al marcar cita como cancelada');
      if (typeof window !== 'undefined' && typeof window.initAgenda === 'function') {
        await window.initAgenda();
      }
    }
  } catch (error) {
    console.error('Error al cancelar cita:', error);
    if (typeof window !== 'undefined' && typeof window.initAgenda === 'function') {
      await window.initAgenda();
    }
  }
}

export async function toggleReactivarCita(id, e) {
  if (e) e.stopPropagation();
  const cache = (typeof window !== 'undefined' && Array.isArray(window.citasCache)) ? window.citasCache : [];
  const cita = cache.find(c => c.id === id);
  if (!cita) return;

  if (typeof window !== 'undefined' && typeof window.reproducirSonidoPop === 'function') {
    window.reproducirSonidoPop();
  }

  cita.estado_cita = 'PENDIENTE';
  renderEasyTable();

  const token = localStorage.getItem('psicolau_token');
  const apiUrl = (typeof window !== 'undefined' && window.API_URL) ? window.API_URL : '/api';
  try {
    const res = await fetch(`${apiUrl}/agenda/citas/${id}/estado`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ estado_cita: 'PENDIENTE' })
    });
    const data = await res.json();
    if (!data.success) {
      alert(data.message || 'Error al reactivar cita');
      if (typeof window !== 'undefined' && typeof window.initAgenda === 'function') {
        await window.initAgenda();
      }
    }
  } catch (error) {
    console.error('Error al reactivar cita:', error);
    if (typeof window !== 'undefined' && typeof window.initAgenda === 'function') {
      await window.initAgenda();
    }
  }
}

export async function agendarEnCelda(fecha, hora) {
  await abrirModal(fecha, hora);
  const fechaInput = document.getElementById('nc_fecha');
  const horaInput = document.getElementById('nc_hora');
  if (fechaInput && fecha) fechaInput.value = fecha;
  if (horaInput && hora) horaInput.value = hora;
}

export async function editarCita(id) {
  const cache = (typeof window !== 'undefined' && Array.isArray(window.citasCache)) ? window.citasCache : [];
  const cita = cache.find(c => c.id === id);
  if (!cita) return;

  await asegurarModal('modalNuevaCita', '/panel/partials/modals/modal-nueva-cita.html');

  actualizarDatalistPacientes();
  setModoFormulario('EDITABLE');

  const idInput = document.getElementById('nc_id');
  if (idInput) idInput.value = cita.id;

  const esBloqueo = (cita.categoria && cita.categoria.startsWith('[BLOQUEO]')) || (cita.paciente && cita.paciente.nombre && cita.paciente.nombre.startsWith('[BLOQUEO]'));
  const esGrupal = (cita.categoria && cita.categoria.startsWith('[GRUPAL]')) || (cita.paciente && cita.paciente.nombre && cita.paciente.nombre.startsWith('[GRUPAL]'));
  const esEvaluacion = (cita.categoria && cita.categoria.startsWith('[EVALUACION]')) || (cita.paciente && cita.paciente.nombre && cita.paciente.nombre.startsWith('[EVALUACION]'));

  const titulo = document.getElementById('modalTitulo');
  if (titulo) {
    if (esGrupal) {
      titulo.innerHTML = '<i class="fa-solid fa-pen-to-square" style="color: #8b5cf6;"></i> <span>Editar Sesión Grupal</span>';
    } else if (esBloqueo) {
      titulo.innerHTML = '<i class="fa-solid fa-pen-to-square" style="color: #ef4444;"></i> <span>Editar Bloqueo</span>';
    } else if (esEvaluacion) {
      titulo.innerHTML = '<i class="fa-solid fa-pen-to-square" style="color: #6366f1;"></i> <span>Editar Evaluación</span>';
    } else {
      titulo.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> <span>Editar Cita</span>';
    }
  }

  const subtitulo = document.getElementById('modalSubtitulo');
  if (subtitulo) {
    let badgeTipoHtml = '';
    if (esGrupal) {
      badgeTipoHtml = '<span class="badge-tipo-info info-grupal"><i class="fa-solid fa-people-group"></i> Terapia Grupal</span>';
    } else if (esBloqueo) {
      badgeTipoHtml = '<span class="badge-tipo-info info-bloqueo"><i class="fa-solid fa-ban"></i> Bloqueo de Horario</span>';
    } else if (esEvaluacion) {
      badgeTipoHtml = '<span class="badge-tipo-info info-evaluacion"><i class="fa-solid fa-brain"></i> Evaluación</span>';
    } else {
      badgeTipoHtml = '<span class="badge-tipo-info info-cita"><i class="fa-solid fa-user-doctor"></i> Cita Individual</span>';
    }

    let badgeSerieHtml = '';
    if (cita.serieId && cache.length) {
      const citasSerie = cache
        .filter(c => c.serieId === cita.serieId && c.estado_cita !== 'CANCELADA')
        .sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora));

      if (citasSerie.length > 1) {
        const pos = citasSerie.findIndex(c => c.id === cita.id);
        const sesionNum = pos >= 0 ? pos + 1 : 1;
        badgeSerieHtml = `<span id="badgeSerieRecurrente" class="badge-tipo-info info-serie" title="Cita vinculada a una serie recurrente"><i class="fa-solid fa-repeat"></i> Serie recurrente (Sesión ${sesionNum} de ${citasSerie.length})</span>`;
      } else {
        badgeSerieHtml = `<span id="badgeSerieRecurrente" class="badge-tipo-info info-serie" title="Cita vinculada a una serie recurrente"><i class="fa-solid fa-repeat"></i> Serie recurrente</span>`;
      }
    } else {
      const matchSesion = (cita.categoria || '').match(/\(Sesión\s+(\d+)\/(\d+)\)/i);
      if (matchSesion) {
        badgeSerieHtml = `<span id="badgeSerieRecurrente" class="badge-tipo-info info-serie" title="Cita vinculada a una serie recurrente"><i class="fa-solid fa-repeat"></i> Serie recurrente (Sesión ${matchSesion[1]} de ${matchSesion[2]})</span>`;
      }
    }

    subtitulo.innerHTML = `<div style="display: flex; flex-wrap: wrap; gap: 6px; align-items: center;">${badgeTipoHtml}${badgeSerieHtml}</div>`;
    subtitulo.style.display = 'block';
  }

  const footer = document.getElementById('modalFooterActions');
  if (footer) {
    footer.innerHTML = `
      <button type="submit" id="btnGuardarModal" class="btn" style="flex: 1.5;"><i class="fa-solid fa-check" style="margin-right: 4px;"></i> Guardar Cambios</button>
      <button type="button" id="btnCancelarModal" class="btn" style="flex: 1; background: var(--gris-calido);" onclick="cerrarModal()">Cancelar</button>
    `;
  }
  
  if (esBloqueo) {
    seleccionarTipoRegistro('BLOQUEO');
  } else if (esGrupal) {
    seleccionarTipoRegistro('GRUPAL');
  } else if (esEvaluacion) {
    seleccionarTipoRegistro('EVALUACION');
  } else {
    seleccionarTipoRegistro('CITA');
  }

  const tabs = document.getElementById('seccionTabsTipo');
  if (tabs) tabs.style.display = 'none';

  const seccionRec = document.getElementById('seccionRecurrencia');
  if (seccionRec) seccionRec.style.display = 'none';

  const seccionEstado = document.getElementById('seccionEstadoCita');
  if (seccionEstado) {
    seccionEstado.style.display = (!esBloqueo) ? 'block' : 'none';
  }
  seleccionarEstadoModal(cita.estado_cita || 'PENDIENTE');

  const nombreLimpio = cita.paciente?.nombre ? cita.paciente.nombre.replace(/^\[(BLOQUEO|GRUPAL|EVALUACION)\]\s*/i, '').trim() : '';
  const inputNombre = document.getElementById('nc_nombre');
  if (inputNombre) inputNombre.value = nombreLimpio;

  const emailEl = document.getElementById('nc_email');
  if (emailEl) {
    emailEl.value = cita.paciente?.email && !cita.paciente.email.startsWith('sin-email-') && !cita.paciente.email.startsWith('grupal-') ? cita.paciente.email : '';
  }
  
  const parsedTel = parsearTelefono(cita.paciente?.telefono);
  const prefijoEl = document.getElementById('nc_prefijo');
  if (prefijoEl) prefijoEl.value = parsedTel.prefijo;
  const telEl = document.getElementById('nc_telefono');
  if (telEl) telEl.value = parsedTel.numero;

  const zoomEl = document.getElementById('nc_enlace_zoom');
  if (zoomEl) {
    zoomEl.value = (cita.paciente && cita.paciente.enlaceZoom) ? cita.paciente.enlaceZoom : '';
  }

  const montoEl = document.getElementById('nc_monto');
  if (montoEl) {
    montoEl.value = (cita.monto !== undefined && cita.monto !== null) 
      ? cita.monto 
      : (cita.paciente && cita.paciente.tarifaDefecto !== null && cita.paciente.tarifaDefecto !== undefined ? cita.paciente.tarifaDefecto : (esEvaluacion ? 4000 : 500));
  }

  const badge = document.getElementById('badgePacienteDetectado');
  if (badge) {
    badge.style.display = (!esBloqueo && !esGrupal) ? 'inline-flex' : 'none';
  }

  const notasLimpias = (cita.categoria || '')
    .replace(/^\[(BLOQUEO|GRUPAL|EVALUACION)\]\s*/i, '')
    .replace(/\(Sesión\s+\d+\/\d+\)/i, '')
    .replace(/·\s*$/, '')
    .trim();
  const notasEl = document.getElementById('nc_notas');
  if (notasEl) notasEl.value = notasLimpias;

  const colorCita = cita.color || (esBloqueo ? '#94a3b8' : (esGrupal ? '#8b5cf6' : (esEvaluacion ? '#6366f1' : '#3EB8CC')));
  const colorInput = document.getElementById('nc_color');
  if (colorInput) colorInput.value = colorCita;
  renderSwatches(colorCita);

  if (cita.fechaHora) {
    const d = new Date(cita.fechaHora);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const minRaw = d.getMinutes();
    const min = minRaw >= 30 ? '30' : '00';

    const fechaEl = document.getElementById('nc_fecha');
    if (fechaEl) fechaEl.value = `${yyyy}-${mm}-${dd}`;
    const horaSelect = document.getElementById('nc_hora');
    if (horaSelect) {
      horaSelect.value = `${hh}:${min}`;
      if (!horaSelect.value) {
        horaSelect.value = '07:00';
      }
    }
  }

  const editExtra = document.getElementById('editExtraActions');
  if (editExtra) {
    editExtra.style.display = 'block';
    editExtra.innerHTML = `
      <button type="button" id="btnEliminarModal" onclick="eliminarCita(document.getElementById('nc_id')?.value, event)" style="background: none; border: none; color: #dc2626; font-size: 0.88rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
        <i class="fa-solid fa-trash-can"></i> Eliminar esta cita
      </button>
    `;
    const btnEliminar = document.getElementById('btnEliminarModal');
    if (btnEliminar) {
      btnEliminar.onclick = (e) => eliminarCita(cita.id, e);
    }
  }

  await mostrarModalDirecto();
}

export async function revisarCitaCancelada(id) {
  const cache = (typeof window !== 'undefined' && Array.isArray(window.citasCache)) ? window.citasCache : [];
  const cita = cache.find(c => c.id === id);
  if (!cita) return;

  await asegurarModal('modalNuevaCita', '/panel/partials/modals/modal-nueva-cita.html');

  const panel = document.getElementById('panelResultadosBusqueda');
  if (panel) panel.style.display = 'none';

  const form = document.getElementById('formNuevaCita');
  if (form) form.reset();

  setModoFormulario('READONLY_CANCELADA');

  const idInput = document.getElementById('nc_id');
  if (idInput) idInput.value = cita.id;

  const titulo = document.getElementById('modalTitulo');
  if (titulo) {
    titulo.innerHTML = `
      <i class="fa-solid fa-file-circle-xmark" style="color: #ef4444;"></i>
      <span>Detalle de Cita</span>
    `;
  }

  const subtitulo = document.getElementById('modalSubtitulo');
  if (subtitulo) {
    subtitulo.innerHTML = `
      <span style="font-size: 0.72rem; padding: 2px 8px; border-radius: 4px; background: #fee2e2; color: #b91c1c; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
        <i class="fa-solid fa-ban"></i> Cancelada / Borrada
      </span>
    `;
    subtitulo.style.display = 'inline-block';
  }

  const nombreEl = document.getElementById('nc_nombre');
  if (nombreEl) nombreEl.value = cita.paciente?.nombre?.replace('[BLOQUEO]', '').trim() || '';

  const emailEl = document.getElementById('nc_email');
  if (emailEl) emailEl.value = cita.paciente?.email && !cita.paciente.email.startsWith('sin-email-') ? cita.paciente.email : '';
  
  const parsedTel = parsearTelefono(cita.paciente?.telefono);
  const prefijoEl = document.getElementById('nc_prefijo');
  if (prefijoEl) prefijoEl.value = parsedTel.prefijo;
  const telEl = document.getElementById('nc_telefono');
  if (telEl) telEl.value = parsedTel.numero;

  const zoomEl = document.getElementById('nc_enlace_zoom');
  if (zoomEl) {
    zoomEl.value = (cita.paciente && cita.paciente.enlaceZoom) ? cita.paciente.enlaceZoom : '';
  }

  const notasEl = document.getElementById('nc_notas');
  if (notasEl) notasEl.value = (cita.categoria || '').replace('[BLOQUEO]', '').trim();

  if (cita.fechaHora) {
    const d = new Date(cita.fechaHora);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const minRaw = d.getMinutes();
    const min = minRaw >= 30 ? '30' : '00';

    const fechaEl = document.getElementById('nc_fecha');
    if (fechaEl) fechaEl.value = `${yyyy}-${mm}-${dd}`;
    const horaSelect = document.getElementById('nc_hora');
    if (horaSelect) {
      horaSelect.value = `${hh}:${min}`;
      if (!horaSelect.value) {
        horaSelect.value = '07:00';
      }
    }
  }

  const editExtra = document.getElementById('editExtraActions');
  if (editExtra) {
    editExtra.style.display = 'block';
    editExtra.innerHTML = `
      <div style="text-align: right; margin-bottom: 0.6rem;">
        <button type="button" id="btnEliminarDefinitivoModal" style="background: none; border: none; color: #dc2626; font-size: 0.84rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; padding: 4px 6px; border-radius: 4px;">
          <i class="fa-solid fa-trash-can"></i> Borrar definitivamente de la base de datos
        </button>
      </div>
    `;
    const btnDelDef = document.getElementById('btnEliminarDefinitivoModal');
    if (btnDelDef) {
      btnDelDef.onclick = () => eliminarDefinitivamente(cita.id);
    }
  }

  const footer = document.getElementById('modalFooterActions');
  if (footer) {
    footer.innerHTML = `
      <button type="button" id="btnReactivarModal" class="btn" style="flex: 1.5; background: #16a34a;">
        <i class="fa-solid fa-rotate-left" style="margin-right: 4px;"></i> Reactivar en Agenda
      </button>
      <button type="button" class="btn" style="flex: 1; background: var(--gris-calido);" onclick="cerrarModal()">Cerrar</button>
    `;
    const btnReact = document.getElementById('btnReactivarModal');
    if (btnReact) {
      btnReact.onclick = () => reactivarCita(cita.id);
    }
  }

  await mostrarModalDirecto();
}

export async function reactivarCita(id) {
  const token = localStorage.getItem('psicolau_token');
  const apiUrl = (typeof window !== 'undefined' && window.API_URL) ? window.API_URL : '/api';
  try {
    const res = await fetch(`${apiUrl}/agenda/citas/${id}/estado`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ estado_cita: 'PENDIENTE' })
    });
    const data = await res.json();
    if (data.success) {
      cerrarModal();
      if (typeof window !== 'undefined' && typeof window.initAgenda === 'function') {
        await window.initAgenda();
      }
      const queryActual = (document.getElementById('busquedaInput')?.value || '').trim();
      if (queryActual && typeof window !== 'undefined' && typeof window.filtrarCitasEnTabla === 'function') {
        window.filtrarCitasEnTabla(queryActual);
      }
      alert('✅ Cita reactivada con éxito en la agenda activa.');
    } else {
      alert(data.message || 'Error al reactivar la cita');
    }
  } catch (err) {
    alert('Error de conexión al reactivar la cita');
  }
}

export function detectarCitasFuturasEnMemoria(cita) {
  const cache = (typeof window !== 'undefined' && Array.isArray(window.citasCache)) ? window.citasCache : [];
  if (!cita || !cache.length) return [];
  
  const fechaCitaTime = new Date(cita.fechaHora).getTime();

  if (cita.serieId) {
    return cache.filter(c => 
      c.serieId === cita.serieId && 
      c.id !== cita.id && 
      new Date(c.fechaHora).getTime() >= fechaCitaTime && 
      c.estado_cita !== 'CANCELADA'
    );
  }

  const match = (cita.categoria || '').match(/\(Sesión\s+(\d+)\/(\d+)\)/i);
  if (match && cita.pacienteId) {
    const totalSerie = parseInt(match[2], 10);
    const sesionActual = parseInt(match[1], 10);
    if (totalSerie > 1 && sesionActual < totalSerie) {
      const regex = new RegExp(`\\(Sesión\\s+\\d+\\/${totalSerie}\\)`, 'i');
      return cache.filter(c =>
        c.pacienteId === cita.pacienteId &&
        c.id !== cita.id &&
        new Date(c.fechaHora).getTime() >= fechaCitaTime &&
        c.estado_cita !== 'CANCELADA' &&
        regex.test(c.categoria || '')
      );
    }
  }

  return [];
}

export function pedirAlcanceSerie(accion = 'EDITAR', totalFuturas = 0, nombrePaciente = '') {
  return new Promise((resolve) => {
    const modal = document.getElementById('modalAlcanceSerie');
    const iconContainer = document.getElementById('modalAlcanceIconContainer');
    const iconEl = document.getElementById('modalAlcanceIcon');
    const titulo = document.getElementById('modalAlcanceTitulo');
    const desc = document.getElementById('modalAlcanceDescripcion');
    const btnSolo = document.getElementById('btnAlcanceSoloEsta');
    const btnSerie = document.getElementById('btnAlcanceEstaYSiguientes');
    const lblSolo = document.getElementById('lblAlcanceSoloEsta');
    const lblSerie = document.getElementById('lblAlcanceEstaYSiguientes');
    const btnCancelar = document.getElementById('btnAlcanceCancelar');

    if (!modal) {
      if (accion === 'ELIMINAR_INDIVIDUAL' || accion === 'ELIMINAR') {
        const conf = window.confirm(nombrePaciente ? `¿Deseas eliminar la cita de "${nombrePaciente}" de la agenda?` : '¿Deseas eliminar esta cita de la agenda?');
        return resolve(conf ? 'SOLO_ESTA' : null);
      }
      return resolve('SOLO_ESTA');
    }

    if (accion === 'ELIMINAR_INDIVIDUAL') {
      if (iconContainer) {
        iconContainer.style.background = '#fee2e2';
        iconContainer.style.color = '#dc2626';
      }
      if (iconEl) iconEl.className = 'fa-solid fa-trash-can';
      if (titulo) titulo.textContent = 'Eliminar Cita';
      if (desc) desc.textContent = nombrePaciente
        ? `¿Confirmas que deseas eliminar la cita de "${nombrePaciente}" de la agenda?`
        : '¿Confirmas que deseas eliminar esta cita de la agenda?';
      if (lblSolo) lblSolo.textContent = 'Sí, eliminar cita';
      if (btnSolo) {
        btnSolo.style.display = 'inline-flex';
        btnSolo.className = 'btn btn-alcance-eliminar-serie';
      }
      if (btnSerie) btnSerie.style.display = 'none';
      if (btnCancelar) btnCancelar.textContent = 'Cancelar';
    } else if (accion === 'ELIMINAR' || accion === 'CANCELAR') {
      if (iconContainer) {
        iconContainer.style.background = '#fee2e2';
        iconContainer.style.color = '#dc2626';
      }
      if (iconEl) iconEl.className = 'fa-solid fa-trash-can';
      if (titulo) titulo.textContent = 'Borrar Cita Recurrente';
      if (desc) desc.textContent = `Esta cita pertenece a una serie con ${totalFuturas} sesión(es) futura(s). ¿Qué deseas borrar?`;
      if (lblSolo) lblSolo.textContent = 'Borrar solo esta cita';
      if (lblSerie) lblSerie.textContent = `Borrar esta y la${totalFuturas === 1 ? '' : 's'} ${totalFuturas} siguiente${totalFuturas === 1 ? '' : 's'}`;
      if (btnSolo) {
        btnSolo.style.display = 'inline-flex';
        btnSolo.className = 'btn btn-alcance-solo';
      }
      if (btnSerie) {
        btnSerie.style.display = 'inline-flex';
        btnSerie.className = 'btn btn-alcance-eliminar-serie';
      }
      if (btnCancelar) btnCancelar.textContent = 'Cancelar';
    } else {
      if (iconContainer) {
        iconContainer.style.background = '#ede9fe';
        iconContainer.style.color = '#7c3aed';
      }
      if (iconEl) iconEl.className = 'fa-solid fa-repeat';
      if (titulo) titulo.textContent = 'Guardar Cambios en Serie';
      if (desc) desc.textContent = `Esta cita pertenece a una serie con ${totalFuturas} sesión(es) futura(s). ¿A cuáles sesiones deseas aplicar los cambios?`;
      if (lblSolo) lblSolo.textContent = 'Solo a esta cita';
      if (lblSerie) lblSerie.textContent = `A esta y las ${totalFuturas} siguientes`;
      if (btnSolo) {
        btnSolo.style.display = 'inline-flex';
        btnSolo.className = 'btn btn-alcance-solo';
      }
      if (btnSerie) {
        btnSerie.style.display = 'inline-flex';
        btnSerie.className = 'btn btn-alcance-serie';
      }
      if (btnCancelar) btnCancelar.textContent = 'Cancelar';
    }

    modal.style.display = 'flex';

    const cleanup = (resultado) => {
      modal.style.display = 'none';
      if (btnSerie) btnSerie.style.display = 'inline-flex';
      if (btnSolo) btnSolo.onclick = null;
      if (btnSerie) btnSerie.onclick = null;
      if (btnCancelar) btnCancelar.onclick = null;
      resolve(resultado);
    };

    if (btnSolo) btnSolo.onclick = () => cleanup('SOLO_ESTA');
    if (btnSerie) btnSerie.onclick = () => cleanup('ESTA_Y_SIGUIENTES');
    if (btnCancelar) btnCancelar.onclick = () => cleanup(null);
  });
}

export async function eliminarCita(id, event) {
  if (event) {
    if (typeof event.stopPropagation === 'function') event.stopPropagation();
    if (typeof event.preventDefault === 'function') event.preventDefault();
  }

  const numId = parseInt(id, 10);
  if (!numId || isNaN(numId)) {
    console.error('ID de cita inválido para eliminar:', id);
    return;
  }

  const cache = (typeof window !== 'undefined' && Array.isArray(window.citasCache)) ? window.citasCache : [];
  const cita = cache.find(c => c.id === numId);
  const futuras = cita ? detectarCitasFuturasEnMemoria(cita) : [];
  
  let alcance = 'SOLO_ESTA';
  if (futuras.length > 0) {
    const seleccion = await pedirAlcanceSerie('ELIMINAR', futuras.length);
    if (!seleccion) return;
    alcance = seleccion;
  } else {
    const nombrePaciente = cita?.paciente?.nombre?.replace(/^\[(BLOQUEO|GRUPAL|EVALUACION)\]\s*/i, '').trim() || '';
    const seleccion = await pedirAlcanceSerie('ELIMINAR_INDIVIDUAL', 0, nombrePaciente);
    if (!seleccion) return;
    alcance = seleccion;
  }

  const token = localStorage.getItem('psicolau_token');
  const apiUrl = (typeof window !== 'undefined' && window.API_URL) ? window.API_URL : '/api';
  try {
    const response = await fetch(`${apiUrl}/agenda/citas/${numId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ alcance })
    });
    const data = await response.json();
    if (data.success) {
      cerrarModal();
      if (typeof window !== 'undefined' && typeof window.initAgenda === 'function') {
        await window.initAgenda();
      }
      
      const queryActual = (document.getElementById('busquedaInput')?.value || '').trim();
      if (queryActual && typeof window !== 'undefined' && typeof window.filtrarCitasEnTabla === 'function') {
        window.filtrarCitasEnTabla(queryActual);
      }
    } else {
      alert(data.message || 'Error al eliminar la cita');
    }
  } catch (error) {
    console.error('Error al eliminar cita:', error);
    alert('Error de conexión al intentar eliminar la cita');
  }
}

export async function eliminarDefinitivamente(id, event) {
  if (event) {
    if (typeof event.stopPropagation === 'function') event.stopPropagation();
    if (typeof event.preventDefault === 'function') event.preventDefault();
  }

  const numId = parseInt(id, 10);
  if (!numId || isNaN(numId)) return;

  const confirmado = window.confirm('⚠️ ATENCIÓN: ¿Deseas eliminar esta cita de forma DEFINITIVA y permanente?\n\nEsta acción borrará el registro de la base de datos y no se podrá recuperar.');
  if (!confirmado) return;

  const token = localStorage.getItem('psicolau_token');
  const apiUrl = (typeof window !== 'undefined' && window.API_URL) ? window.API_URL : '/api';
  try {
    const response = await fetch(`${apiUrl}/agenda/citas/${numId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (data.success) {
      cerrarModal();
      if (typeof window !== 'undefined' && typeof window.initAgenda === 'function') {
        await window.initAgenda();
      }
      const queryActual = (document.getElementById('busquedaInput')?.value || '').trim();
      if (queryActual && typeof window !== 'undefined' && typeof window.filtrarCitasEnTabla === 'function') {
        window.filtrarCitasEnTabla(queryActual);
      }
      alert('🗑️ Cita eliminada definitivamente de la base de datos.');
    } else {
      alert(data.message || 'Error al eliminar definitivamente la cita');
    }
  } catch (error) {
    console.error('Error al eliminar definitivamente cita:', error);
    alert('Error de conexión al intentar eliminar definitivamente la cita');
  }
}

// Delegación de eventos global para botón de eliminar en modal
if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('#btnEliminarModal');
    if (btn) {
      e.preventDefault();
      e.stopPropagation();
      const idInput = document.getElementById('nc_id');
      const id = idInput ? idInput.value : null;
      if (id) {
        eliminarCita(id, e);
      }
    }
  });
}

// Compatibilidad global
if (typeof window !== 'undefined') {
  window.abrirZoomSesion = abrirZoomSesion;
  window.toggleCompletarCita = toggleCompletarCita;
  window.toggleCancelarCita = toggleCancelarCita;
  window.toggleReactivarCita = toggleReactivarCita;
  window.agendarEnCelda = agendarEnCelda;
  window.editarCita = editarCita;
  window.revisarCitaCancelada = revisarCitaCancelada;
  window.reactivarCita = reactivarCita;
  window.detectarCitasFuturasEnMemoria = detectarCitasFuturasEnMemoria;
  window.pedirAlcanceSerie = pedirAlcanceSerie;
  window.eliminarCita = eliminarCita;
  window.eliminarDefinitivamente = eliminarDefinitivamente;
}
