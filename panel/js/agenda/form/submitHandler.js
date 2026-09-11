// panel/js/agenda/form/submitHandler.js
// RF-01 a RF-08 (Spec 018): Módulo ESM para validación, procesamiento y persistencia del formulario de citas

import { guardarColorPersonalizado } from '../utils/colors.js';
import { cerrarModal } from './modal.js';
import { detectarCitasFuturasEnMemoria, pedirAlcanceSerie } from '../actions/citaState.js';

/**
 * Procesa el envío del formulario de creación y edición de citas (#formNuevaCita).
 * Valida campos obligatorios, sanitiza prefijos y persiste mediante POST o PUT en la API.
 * @param {Event} e Evento submit del DOM
 */
export async function procesarSubmitCita(e) {
  if (!e.target || e.target.id !== 'formNuevaCita') return;
  e.preventDefault();

  const formNuevaCita = e.target;
  const token = localStorage.getItem('psicolau_token');
  const btn = formNuevaCita.querySelector('button[type="submit"]');
  const id = document.getElementById('nc_id')?.value;
  const esEdicion = Boolean(id);

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';
  }

  const fecha = document.getElementById('nc_fecha')?.value;
  const hora = document.getElementById('nc_hora')?.value;

  if (!fecha) {
    alert('Por favor selecciona una fecha válida para la cita.');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = esEdicion 
        ? '<i class="fa-solid fa-check" style="margin-right: 4px;"></i> Guardar Cambios' 
        : '<i class="fa-solid fa-check" style="margin-right: 4px;"></i> Confirmar y Guardar';
    }
    return;
  }

  const [yyyy, mm, dd] = fecha.split('-').map(Number);
  const [hh, min] = (hora || '07:00').split(':').map(Number);
  const fechaLocal = new Date(yyyy, mm - 1, dd, hh, min, 0);
  const fechaHora = fechaLocal.toISOString();

  // Obtener tipo de registro efectivo
  const cache = (typeof window !== 'undefined' && Array.isArray(window.citasCache)) ? window.citasCache : [];
  let tipoEfectivo = (typeof window !== 'undefined' && window.tipoRegistroActual) ? window.tipoRegistroActual : 'CITA';

  if (esEdicion && cache.length > 0) {
    const citaOriginal = cache.find(c => c.id === parseInt(id));
    if (citaOriginal) {
      const eraBloqueo = (citaOriginal.categoria && citaOriginal.categoria.startsWith('[BLOQUEO]')) || 
                         (citaOriginal.paciente && citaOriginal.paciente.nombre && citaOriginal.paciente.nombre.startsWith('[BLOQUEO]'));
      const eraGrupal = (citaOriginal.categoria && citaOriginal.categoria.startsWith('[GRUPAL]')) || 
                        (citaOriginal.paciente && citaOriginal.paciente.nombre && citaOriginal.paciente.nombre.startsWith('[GRUPAL]'));
      const eraEvaluacion = (citaOriginal.categoria && citaOriginal.categoria.startsWith('[EVALUACION]')) || 
                            (citaOriginal.paciente && citaOriginal.paciente.nombre && citaOriginal.paciente.nombre.startsWith('[EVALUACION]'));
      tipoEfectivo = eraBloqueo ? 'BLOQUEO' : (eraGrupal ? 'GRUPAL' : (eraEvaluacion ? 'EVALUACION' : 'CITA'));
    }
  }

  let nombre = (document.getElementById('nc_nombre')?.value || '').trim();
  let notas = (document.getElementById('nc_notas')?.value || '').trim();

  // Limpiar prefijos antes de asignar estrictamente según el tipo efectivo
  nombre = nombre.replace(/^\[(BLOQUEO|GRUPAL|EVALUACION)\]\s*/i, '').trim();
  notas = notas.replace(/^\[(BLOQUEO|GRUPAL|EVALUACION)\]\s*/i, '').trim();

  if (tipoEfectivo === 'BLOQUEO') {
    nombre = `[BLOQUEO] ${nombre}`;
    notas = `[BLOQUEO] ${notas}`.trim();
  } else if (tipoEfectivo === 'GRUPAL') {
    nombre = `[GRUPAL] ${nombre}`;
    notas = `[GRUPAL] ${notas}`.trim();
  } else if (tipoEfectivo === 'EVALUACION') {
    notas = `[EVALUACION] ${notas}`.trim();
  }

  const prefijo = document.getElementById('nc_prefijo')?.value || '';
  const telInput = (document.getElementById('nc_telefono')?.value || '').trim();
  let telefonoFinal = '';
  if (telInput && tipoEfectivo !== 'BLOQUEO' && tipoEfectivo !== 'GRUPAL') {
    if (telInput.startsWith('+')) {
      telefonoFinal = telInput;
    } else if (prefijo) {
      telefonoFinal = `${prefijo} ${telInput}`;
    } else {
      telefonoFinal = telInput;
    }
  }

  const zoomInput = document.getElementById('nc_enlace_zoom');
  let enlaceZoomVal = (zoomInput && tipoEfectivo !== 'BLOQUEO') ? zoomInput.value.trim() : '';
  if (enlaceZoomVal && !enlaceZoomVal.startsWith('http://') && !enlaceZoomVal.startsWith('https://')) {
    enlaceZoomVal = `https://${enlaceZoomVal}`;
  }

  let emailFinal = '';
  if (tipoEfectivo === 'BLOQUEO') {
    emailFinal = '';
  } else if (tipoEfectivo === 'GRUPAL') {
    emailFinal = `grupal-${Date.now()}@psicolau.com`;
  } else {
    emailFinal = (document.getElementById('nc_email')?.value || '').trim();
  }

  const montoVal = document.getElementById('nc_monto')?.value;
  let montoFinal = (tipoEfectivo === 'EVALUACION') ? 4000 : 500;
  if (tipoEfectivo === 'BLOQUEO') {
    montoFinal = 0;
  } else if (montoVal !== undefined && montoVal !== null && montoVal !== '') {
    const parsed = parseFloat(montoVal);
    if (isNaN(parsed) || parsed < 0) {
      alert('Por favor introduce un monto de tarifa válido (mayor o igual a 0).');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = esEdicion 
          ? '<i class="fa-solid fa-check" style="margin-right: 4px;"></i> Guardar Cambios' 
          : '<i class="fa-solid fa-check" style="margin-right: 4px;"></i> Confirmar y Guardar';
      }
      return;
    }
    montoFinal = parsed;
  }

  const data = {
    nombre: nombre,
    email: emailFinal,
    telefono: telefonoFinal,
    enlaceZoom: enlaceZoomVal,
    fechaHora: fechaHora,
    categoria: notas,
    notas: notas,
    color: document.getElementById('nc_color')?.value || '#3EB8CC',
    monto: montoFinal
  };

  if (!esEdicion && document.getElementById('nc_repetir')?.checked) {
    data.repeticiones = parseInt(document.getElementById('nc_repeticiones')?.value) || 1;
    data.frecuencia = document.getElementById('nc_frecuencia')?.value || 'SEMANAL';
  }

  if (esEdicion && tipoEfectivo !== 'BLOQUEO') {
    const estadoCitaVal = document.getElementById('nc_estado_cita')?.value;
    if (estadoCitaVal) {
      data.estado_cita = estadoCitaVal;
    }
  }

  // Comprobar si la cita forma parte de una serie recurrente y consultar alcance
  if (esEdicion && cache.length > 0) {
    const citaOriginal = cache.find(c => c.id === parseInt(id));
    if (citaOriginal) {
      const fnDetectar = window.detectarCitasFuturasEnMemoria || detectarCitasFuturasEnMemoria;
      const fnPedirAlcance = window.pedirAlcanceSerie || pedirAlcanceSerie;
      const futuras = fnDetectar ? fnDetectar(citaOriginal) : [];
      if (futuras.length > 0 && fnPedirAlcance) {
        const alcanceElegido = await fnPedirAlcance('EDITAR', futuras.length);
        if (!alcanceElegido) {
          // Si el usuario cancela la selección de serie, preservar el formulario abierto
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-check" style="margin-right: 4px;"></i> Guardar Cambios';
          }
          return;
        }
        data.alcance = alcanceElegido;
      }
    }
  }

  try {
    const baseUrl = (typeof API_URL !== 'undefined' ? API_URL : (window.API_URL || 'http://localhost:3000/api'));
    const url = esEdicion ? `${baseUrl}/agenda/citas/${id}` : `${baseUrl}/agenda/citas`;
    const method = esEdicion ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    const resData = await response.json();
    if (resData.success) {
      if (data.color) {
        const fnGuardarColor = window.guardarColorPersonalizado || guardarColorPersonalizado;
        if (fnGuardarColor) fnGuardarColor(data.color);
      }

      const fnCerrar = window.cerrarModal || cerrarModal;
      if (fnCerrar) fnCerrar();

      if (typeof window !== 'undefined' && typeof window.reproducirSonidoCompletada === 'function') {
        window.reproducirSonidoCompletada();
      }

      if (typeof window !== 'undefined' && typeof window.initAgenda === 'function') {
        await window.initAgenda();
      }

      if (typeof window !== 'undefined' && typeof window.cargarDirectorioEnSegundoPlano === 'function') {
        window.cargarDirectorioEnSegundoPlano();
      }

      if (data.repeticiones && data.repeticiones > 1) {
        alert(`✅ Se han programado con éxito las ${data.repeticiones} sesiones recurrentes (${data.frecuencia === 'QUINCENAL' ? 'quincenales' : 'semanales'}).`);
      }

      const queryActual = (document.getElementById('busquedaInput')?.value || '').trim();
      if (queryActual && typeof window !== 'undefined' && typeof window.filtrarCitasEnTabla === 'function') {
        window.filtrarCitasEnTabla(queryActual);
      }
    } else {
      alert(resData.message || 'Error al guardar la cita');
    }
  } catch (err) {
    console.error('Error al guardar cita:', err);
    alert('Error de conexión con el servidor');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-check" style="margin-right: 4px;"></i> Confirmar y Guardar';
    }
  }
}

/**
 * Registra el listener global para el formulario de citas mediante delegación de eventos.
 */
export function initSubmitHandler() {
  document.addEventListener('submit', async (e) => {
    if (e.target && e.target.id === 'formNuevaCita') {
      await procesarSubmitCita(e);
    }
  });
}
