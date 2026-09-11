// panel/js/expedientes/form/notaForm.js
// RF-13: Formulario clínico para creación, edición y eliminación de notas de sesión con los 8 campos clínicos

import { getAuthHeaders, getApiUrl } from '../utils/api.js';
import { getPacienteActivoExpediente, getNotasCacheExpediente, abrirExpedientePorId } from '../paciente.js';

export function mostrarFormularioNuevaNota(fechaPrefill = null) {
  const formSeccion = document.getElementById('seccionFormNotaExpediente');
  const form = document.getElementById('formNotaExpediente');
  const titulo = document.getElementById('formNotaTitulo');
  const idInput = document.getElementById('exp_nota_id');
  const listaContainer = document.getElementById('listaNotasExpediente');

  if (formSeccion && listaContainer && formSeccion.parentElement) {
    listaContainer.parentElement.insertBefore(formSeccion, listaContainer);
  }

  if (form) form.reset();
  if (idInput) idInput.value = '';

  if (titulo) {
    titulo.innerHTML = '<i class="fa-solid fa-plus-circle" style="color: var(--turquesa);"></i> Registrar Nueva Nota de Sesión';
  }

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
}

export function ocultarFormularioNota() {
  const formSeccion = document.getElementById('seccionFormNotaExpediente');
  const form = document.getElementById('formNotaExpediente');
  const listaContainer = document.getElementById('listaNotasExpediente');

  if (form) form.reset();
  if (formSeccion) {
    formSeccion.style.display = 'none';
    if (listaContainer && listaContainer.parentElement) {
      listaContainer.parentElement.insertBefore(formSeccion, listaContainer);
    }
  }
}

export async function guardarNotaExpediente(event) {
  if (event) event.preventDefault();
  const paciente = getPacienteActivoExpediente();
  if (!paciente) return;

  const btnGuardar = document.getElementById('btnGuardarNotaExpediente');
  const textoOriginal = btnGuardar ? btnGuardar.innerHTML : '';
  if (btnGuardar) {
    btnGuardar.disabled = true;
    btnGuardar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Cifrando y Guardando...';
  }

  const idNota = document.getElementById('exp_nota_id')?.value;
  const fechaSesion = document.getElementById('exp_fechaSesion')?.value;

  const payload = {
    fechaSesion,
    resumenBreve: document.getElementById('exp_resumenBreve')?.value.trim() || '',
    estadoActual: document.getElementById('exp_estadoActual')?.value.trim() || '',
    insightPaciente: document.getElementById('exp_insightPaciente')?.value.trim() || '',
    eventoPrincipal: document.getElementById('exp_eventoPrincipal')?.value.trim() || '',
    intervenciones: document.getElementById('exp_intervenciones')?.value.trim() || '',
    formulacionClinica: document.getElementById('exp_formulacionClinica')?.value.trim() || '',
    tareasAsignadas: document.getElementById('exp_tareasAsignadas')?.value.trim() || '',
    pendientesProximaSesion: document.getElementById('exp_pendientesProximaSesion')?.value.trim() || ''
  };

  try {
    let url = `${getApiUrl()}/pacientes/${paciente.id}/expediente`;
    let method = 'POST';

    if (idNota) {
      url = `${getApiUrl()}/expediente/${idNota}`;
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
      await abrirExpedientePorId(paciente.id);
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
}

export function editarNotaExpedienteModal(notaId) {
  const cache = getNotasCacheExpediente();
  const nota = cache.find(n => n.id === notaId);
  if (!nota) return;

  const formSeccion = document.getElementById('seccionFormNotaExpediente');
  const cardEl = document.getElementById(`nota-exp-${notaId}`);
  
  if (formSeccion && cardEl) {
    cardEl.insertAdjacentElement('afterend', formSeccion);
  }

  const form = document.getElementById('formNotaExpediente');
  if (form) form.reset();

  const titulo = document.getElementById('formNotaTitulo');
  if (titulo) {
    const d = new Date(nota.fechaSesion);
    const fechaTxt = d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
    titulo.innerHTML = `<i class="fa-solid fa-pen-to-square" style="color: var(--rosa-coral);"></i> Editando Nota de Sesión (${fechaTxt})`;
  }

  const idInput = document.getElementById('exp_nota_id');
  if (idInput) idInput.value = nota.id;
  
  if (nota.fechaSesion) {
    const d = new Date(nota.fechaSesion);
    const fechaInput = document.getElementById('exp_fechaSesion');
    if (fechaInput) fechaInput.value = d.toISOString().split('T')[0];
  }

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  };

  setVal('exp_resumenBreve', nota.resumenBreve);
  setVal('exp_estadoActual', nota.estadoActual);
  setVal('exp_insightPaciente', nota.insightPaciente);
  setVal('exp_eventoPrincipal', nota.eventoPrincipal);
  setVal('exp_intervenciones', nota.intervenciones);
  setVal('exp_formulacionClinica', nota.formulacionClinica);
  setVal('exp_tareasAsignadas', nota.tareasAsignadas);
  setVal('exp_pendientesProximaSesion', nota.pendientesProximaSesion);

  if (formSeccion) {
    formSeccion.style.display = 'block';
    formSeccion.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

export async function eliminarNotaExpedienteConfirm(notaId) {
  if (!confirm('¿Estás segura de que deseas eliminar permanentemente esta nota clínica? Esta acción no se puede deshacer.')) {
    return;
  }

  try {
    const res = await fetch(`${getApiUrl()}/expediente/${notaId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    const data = await res.json();
    if (data.success) {
      const paciente = getPacienteActivoExpediente();
      if (paciente) {
        await abrirExpedientePorId(paciente.id);
      }
    } else {
      alert(data.message || 'Error al eliminar la nota clínica');
    }
  } catch (error) {
    console.error('Error al eliminar nota:', error);
    alert('Error de conexión al eliminar nota clínica');
  }
}

// Compatibilidad global
if (typeof window !== 'undefined') {
  window.mostrarFormularioNuevaNota = mostrarFormularioNuevaNota;
  window.ocultarFormularioNota = ocultarFormularioNota;
  window.guardarNotaExpediente = guardarNotaExpediente;
  window.editarNotaExpedienteModal = editarNotaExpedienteModal;
  window.eliminarNotaExpedienteConfirm = eliminarNotaExpedienteConfirm;
}
