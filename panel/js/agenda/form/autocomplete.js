// panel/js/agenda/form/autocomplete.js
// RF-05: Autocompletado inteligente de pacientes, detección de tarifas, Zoom, colores y cálculo de terapia grupal

import { renderSwatches, obtenerSiguienteColorDisponible } from '../utils/colors.js';
import { parsearTelefono } from '../utils/phone.js';

let datosAutocompletados = null;

export function limpiarEstadoAutocompletado() {
  datosAutocompletados = null;
}

function limpiarCamposPorDefecto(tipoRegistro) {
  const badge = document.getElementById('badgePacienteDetectado');
  if (badge) badge.style.display = 'none';

  if (tipoRegistro === 'GRUPAL') {
    const zoomEl = document.getElementById('nc_enlace_zoom');
    if (zoomEl) zoomEl.value = '';
    const colorInput = document.getElementById('nc_color');
    if (colorInput) {
      colorInput.value = '#8b5cf6';
      renderSwatches('#8b5cf6');
    }
    return;
  }

  const emailEl = document.getElementById('nc_email');
  const telEl = document.getElementById('nc_telefono');
  const prefijoEl = document.getElementById('nc_prefijo');
  const zoomEl = document.getElementById('nc_enlace_zoom');
  const montoEl = document.getElementById('nc_monto');
  const colorInput = document.getElementById('nc_color');

  if (emailEl) emailEl.value = '';
  if (telEl) telEl.value = '';
  if (prefijoEl) prefijoEl.value = '+52';
  if (zoomEl) zoomEl.value = '';

  if (tipoRegistro === 'EVALUACION') {
    if (montoEl) montoEl.value = '4000';
    if (colorInput) {
      colorInput.value = '#6366f1';
      renderSwatches('#6366f1');
    }
  } else {
    if (montoEl) montoEl.value = '500';
    const colorSiguiente = obtenerSiguienteColorDisponible();
    if (colorInput) {
      colorInput.value = colorSiguiente;
      renderSwatches(colorSiguiente);
    }
  }
}

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

export function establecerMontoCortesia() {
  const montoInput = document.getElementById('nc_monto');
  if (montoInput) {
    montoInput.value = '0';
    montoInput.focus();
  }
}

export function actualizarDatalistPacientes() {
  const datalist = document.getElementById('listaPacientesAutocompletar');
  if (!datalist) return;
  const listaDirectorio = (typeof window !== 'undefined' && window.directorioPacientesCache) ? window.directorioPacientesCache : [];
  const nombresVistos = new Set();
  let html = '';

  listaDirectorio.forEach(p => {
    if (p.nombre && !p.nombre.startsWith('[BLOQUEO]') && !nombresVistos.has(p.nombre.toLowerCase().trim())) {
      nombresVistos.add(p.nombre.toLowerCase().trim());
      html += `<option value="${escapeHtmlText(p.nombre)}">`;
    }
  });

  const cache = (typeof window !== 'undefined' && Array.isArray(window.citasCache)) ? window.citasCache : [];
  cache.forEach(c => {
    if (c.paciente && c.paciente.nombre && !c.paciente.nombre.startsWith('[BLOQUEO]')) {
      const nomLimpio = c.paciente.nombre.toLowerCase().trim();
      if (!nombresVistos.has(nomLimpio)) {
        nombresVistos.add(nomLimpio);
        html += `<option value="${escapeHtmlText(c.paciente.nombre)}">`;
      }
    }
  });

  datalist.innerHTML = html;
}

export function manejarInputNombrePaciente(valor) {
  const tipoRegistro = typeof window !== 'undefined' ? window.tipoRegistroActual : 'CITA';
  if (tipoRegistro === 'BLOQUEO') return;
  const badge = document.getElementById('badgePacienteDetectado');
  const nombreLimpio = (valor || '').trim().toLowerCase().replace(/^\[(bloqueo|grupal|evaluacion)\]\s*/i, '');
  const idInput = document.getElementById('nc_id');
  const esNueva = !idInput || !idInput.value;
  
  if (!nombreLimpio) {
    if (esNueva) {
      limpiarCamposPorDefecto(tipoRegistro);
    } else {
      if (badge) badge.style.display = 'none';
    }
    datosAutocompletados = null;
    return;
  }

  const cache = (typeof window !== 'undefined' && Array.isArray(window.citasCache)) ? window.citasCache : [];

  // Si estamos en modo TERAPIA GRUPAL
  if (tipoRegistro === 'GRUPAL') {
    let citaGrupalPrevia = cache.find(c => {
      if (!c.paciente || !c.paciente.nombre) return false;
      const esGrup = (c.categoria && c.categoria.startsWith('[GRUPAL]')) || (c.paciente.nombre.startsWith('[GRUPAL]'));
      if (!esGrup) return false;
      const nom = c.paciente.nombre.toLowerCase().replace(/^\[(bloqueo|grupal)\]\s*/i, '').trim();
      return nom === nombreLimpio;
    });

    if (citaGrupalPrevia && citaGrupalPrevia.paciente) {
      if (badge) {
        badge.innerHTML = '<i class="fa-solid fa-circle-check"></i> Grupo detectado';
        badge.style.background = '#f3e8ff';
        badge.style.color = '#7c3aed';
        badge.style.display = 'inline-flex';
      }

      // Autocompletar Enlace de Zoom grupal
      const zoomEl = document.getElementById('nc_enlace_zoom');
      const zoomVal = citaGrupalPrevia.paciente.enlaceZoom || '';
      if (zoomEl && zoomVal) {
        zoomEl.value = zoomVal;
      }

      // Autocompletar Color
      const colorVal = citaGrupalPrevia.color || '#8b5cf6';
      const inputColor = document.getElementById('nc_color');
      if (inputColor) {
        inputColor.value = colorVal;
        renderSwatches(colorVal);
      }

      datosAutocompletados = {
        tipo: 'GRUPAL',
        nombreLimpio: nombreLimpio,
        enlaceZoom: zoomVal,
        color: colorVal
      };
    } else {
      if (badge) badge.style.display = 'none';
      if (esNueva && datosAutocompletados && datosAutocompletados.tipo === 'GRUPAL') {
        const zoomEl = document.getElementById('nc_enlace_zoom');
        if (zoomEl && zoomEl.value === datosAutocompletados.enlaceZoom) {
          zoomEl.value = '';
        }
        const inputColor = document.getElementById('nc_color');
        if (inputColor && inputColor.value.toLowerCase() === (datosAutocompletados.color || '').toLowerCase()) {
          inputColor.value = '#8b5cf6';
          renderSwatches('#8b5cf6');
        }
        datosAutocompletados = null;
      }
    }
    return;
  }

  // Modo CITA INDIVIDUAL / EVALUACION: Buscar coincidencia en directorio de pacientes O en citasCache
  const lista = (typeof window !== 'undefined' && window.directorioPacientesCache) ? window.directorioPacientesCache : [];
  let coincidencia = lista.find(p => {
    if (!p.nombre) return false;
    const nom = p.nombre.toLowerCase().replace(/^\[(bloqueo|grupal|evaluacion)\]\s*/i, '').trim();
    return nom === nombreLimpio;
  });

  if (!coincidencia && cache.length > 0) {
    const citaPrevia = cache.find(c => {
      if (!c.paciente || !c.paciente.nombre) return false;
      const esBloq = (c.categoria && c.categoria.startsWith('[BLOQUEO]')) || (c.paciente.nombre.startsWith('[BLOQUEO]'));
      const esGrup = (c.categoria && c.categoria.startsWith('[GRUPAL]')) || (c.paciente.nombre.startsWith('[GRUPAL]'));
      if (esBloq || esGrup) return false;
      const nom = c.paciente.nombre.toLowerCase().replace(/^\[(bloqueo|grupal|evaluacion)\]\s*/i, '').trim();
      return nom === nombreLimpio;
    });
    if (citaPrevia && citaPrevia.paciente) {
      coincidencia = {
        ...citaPrevia.paciente,
        monto: citaPrevia.monto
      };
    }
  }

  if (coincidencia) {
    if (badge) {
      badge.innerHTML = '<i class="fa-solid fa-circle-check"></i> Paciente registrado';
      badge.style.background = '#dcfce7';
      badge.style.color = '#15803d';
      badge.style.display = 'inline-flex';
    }
    
    // Autocompletar Correo (si no es generado automáticamente)
    const emailEl = document.getElementById('nc_email');
    const emailVal = (coincidencia.email && !coincidencia.email.startsWith('sin-email-') && !coincidencia.email.startsWith('grupal-')) ? coincidencia.email : '';
    if (emailEl && emailVal) {
      emailEl.value = emailVal;
    }

    // Autocompletar Teléfono con prefijo internacional
    let telVal = '';
    let prefijoVal = '+52';
    if (coincidencia.telefono) {
      const parsedTel = parsearTelefono(coincidencia.telefono);
      prefijoVal = parsedTel.prefijo || '+52';
      telVal = parsedTel.numero || '';
      const prefijoEl = document.getElementById('nc_prefijo');
      const telEl = document.getElementById('nc_telefono');
      if (prefijoEl) prefijoEl.value = prefijoVal;
      if (telEl) telEl.value = telVal;
    }

    // Autocompletar Enlace de Zoom (solo si el paciente ya tiene uno registrado)
    const zoomEl = document.getElementById('nc_enlace_zoom');
    const zoomVal = coincidencia.enlaceZoom || '';
    if (zoomEl && zoomVal) {
      zoomEl.value = zoomVal;
    }

    // Autocompletar Tarifa / Monto de sesión (solo si no es evaluación)
    const montoEl = document.getElementById('nc_monto');
    let montoVal = null;
    if (montoEl && tipoRegistro !== 'EVALUACION') {
      if (coincidencia.tarifaDefecto !== undefined && coincidencia.tarifaDefecto !== null) {
        montoVal = String(coincidencia.tarifaDefecto);
        montoEl.value = montoVal;
      } else if (coincidencia.monto !== undefined && coincidencia.monto !== null) {
        montoVal = String(coincidencia.monto);
        montoEl.value = montoVal;
      }
    }

    // Autocompletar Color de la paleta
    autoDetectarColorPaciente(coincidencia.nombre);
    const colorVal = document.getElementById('nc_color')?.value || '';

    datosAutocompletados = {
      tipo: tipoRegistro,
      nombreLimpio: nombreLimpio,
      email: emailVal,
      telefono: telVal,
      prefijo: prefijoVal,
      enlaceZoom: zoomVal,
      monto: montoVal,
      color: colorVal
    };
  } else {
    if (badge) badge.style.display = 'none';

    if (esNueva && datosAutocompletados && (datosAutocompletados.tipo === 'CITA' || datosAutocompletados.tipo === 'EVALUACION')) {
      const emailEl = document.getElementById('nc_email');
      if (emailEl && (emailEl.value === datosAutocompletados.email || !datosAutocompletados.email)) {
        emailEl.value = '';
      }

      const telEl = document.getElementById('nc_telefono');
      if (telEl && (telEl.value === datosAutocompletados.telefono || !datosAutocompletados.telefono)) {
        telEl.value = '';
      }

      const prefijoEl = document.getElementById('nc_prefijo');
      if (prefijoEl && prefijoEl.value === datosAutocompletados.prefijo) {
        prefijoEl.value = '+52';
      }

      const zoomEl = document.getElementById('nc_enlace_zoom');
      if (zoomEl && (zoomEl.value === datosAutocompletados.enlaceZoom || !datosAutocompletados.enlaceZoom)) {
        zoomEl.value = '';
      }

      const montoEl = document.getElementById('nc_monto');
      if (montoEl && datosAutocompletados.monto !== null && montoEl.value === datosAutocompletados.monto) {
        montoEl.value = (tipoRegistro === 'EVALUACION') ? '4000' : '500';
      }

      const colorInput = document.getElementById('nc_color');
      if (colorInput && colorInput.value.toLowerCase() === (datosAutocompletados.color || '').toLowerCase()) {
        const colorDefault = (tipoRegistro === 'EVALUACION') ? '#6366f1' : obtenerSiguienteColorDisponible();
        colorInput.value = colorDefault;
        renderSwatches(colorDefault);
      }

      datosAutocompletados = null;
    }

    autoDetectarColorPaciente(valor);
  }
}

export function autoDetectarColorPaciente(nombre) {
  const tipoRegistro = typeof window !== 'undefined' ? window.tipoRegistroActual : 'CITA';
  if (!nombre || tipoRegistro === 'BLOQUEO') return;
  const nombreLimpio = nombre.toLowerCase().replace(/^\[(bloqueo|grupal|evaluacion)\]\s*/i, '').trim();
  if (nombreLimpio.length < 3) return;

  const cache = (typeof window !== 'undefined' && Array.isArray(window.citasCache)) ? window.citasCache : [];
  const previa = cache.find(c => {
    if (!c.paciente || !c.paciente.nombre || !c.color) return false;
    const nom = c.paciente.nombre.toLowerCase().replace(/^\[(bloqueo|grupal)\]\s*/i, '').trim();
    return nom === nombreLimpio;
  });
  if (previa && previa.color) {
    const inputColor = document.getElementById('nc_color');
    if (inputColor) inputColor.value = previa.color;
    renderSwatches(previa.color);
  }
}

export function calcularTotalGrupal() {
  const cuotaInput = document.getElementById('nc_cuota_persona');
  const partInput = document.getElementById('nc_num_participantes');
  const montoInput = document.getElementById('nc_monto');
  if (!montoInput) return;

  const cuota = parseFloat(cuotaInput?.value) || 0;
  const part = parseFloat(partInput?.value) || 0;
  const total = Math.round(cuota * part * 100) / 100;
  montoInput.value = total;
}

// Compatibilidad global
if (typeof window !== 'undefined') {
  window.establecerMontoCortesia = establecerMontoCortesia;
  window.actualizarDatalistPacientes = actualizarDatalistPacientes;
  window.manejarInputNombrePaciente = manejarInputNombrePaciente;
  window.autoDetectarColorPaciente = autoDetectarColorPaciente;
  window.calcularTotalGrupal = calcularTotalGrupal;
  window.limpiarEstadoAutocompletado = limpiarEstadoAutocompletado;
}

