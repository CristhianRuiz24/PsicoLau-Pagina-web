// panel/js/expedientes/index.js
// RF-09, RF-22: Punto de entrada lazy-load para la Suite de Expedientes Clínicos PsicoLau

import { getAuthHeaders, getApiUrl, fetchWithAuth } from './utils/api.js';
import { cargarDirectorioEnSegundoPlano, abrirDirectorioExpedientes, cerrarDirectorioExpedientes, renderDirectorioPacientes, filtrarDirectorioExpedientes, eliminarPacienteDirectorio } from './directorio.js';
import { abrirExpedientePorId, abrirExpedientePorCita, cerrarModalExpediente, actualizarCabeceraExpediente, volverAlDirectorioExpedientes, toggleMaximizarModalExpediente, getPacienteActivoExpediente, setPacienteActivoExpediente, getNotasCacheExpediente, setNotasCacheExpediente } from './paciente.js';
import { renderListaNotasExpediente, resaltarTexto, escapeHtmlText, buscarEnNotasExpediente } from './render/notasList.js';
import { mostrarFormularioNuevaNota, ocultarFormularioNota, guardarNotaExpediente, editarNotaExpedienteModal, eliminarNotaExpedienteConfirm } from './form/notaForm.js';
import { abrirDetalleSesion, cerrarDetalleSesion, actualizarBotonesBarraDetalle, editarNotaDesdeDetalle, guardarEdicionInSituDetalle, cancelarEdicionInSituDetalle, toggleAgrandarDetalleSesion, imprimirNotaIndividual, imprimirNotaActualDetalle, descargarNotaIndividualTxt, descargarNotaActualTxt } from './ui/detalleSesion.js';

export {
  getAuthHeaders,
  getApiUrl,
  fetchWithAuth,
  cargarDirectorioEnSegundoPlano,
  abrirDirectorioExpedientes,
  cerrarDirectorioExpedientes,
  renderDirectorioPacientes,
  filtrarDirectorioExpedientes,
  eliminarPacienteDirectorio,
  abrirExpedientePorId,
  abrirExpedientePorCita,
  cerrarModalExpediente,
  actualizarCabeceraExpediente,
  volverAlDirectorioExpedientes,
  toggleMaximizarModalExpediente,
  getPacienteActivoExpediente,
  setPacienteActivoExpediente,
  getNotasCacheExpediente,
  setNotasCacheExpediente,
  renderListaNotasExpediente,
  resaltarTexto,
  escapeHtmlText,
  buscarEnNotasExpediente,
  mostrarFormularioNuevaNota,
  ocultarFormularioNota,
  guardarNotaExpediente,
  editarNotaExpedienteModal,
  eliminarNotaExpedienteConfirm,
  abrirDetalleSesion,
  cerrarDetalleSesion,
  actualizarBotonesBarraDetalle,
  editarNotaDesdeDetalle,
  guardarEdicionInSituDetalle,
  cancelarEdicionInSituDetalle,
  toggleAgrandarDetalleSesion,
  imprimirNotaIndividual,
  imprimirNotaActualDetalle,
  descargarNotaIndividualTxt,
  descargarNotaActualTxt
};

// Exposición global
if (typeof window !== 'undefined') {
  window.cargarDirectorioEnSegundoPlano = cargarDirectorioEnSegundoPlano;
  window.abrirDirectorioExpedientes = abrirDirectorioExpedientes;
  window.cerrarDirectorioExpedientes = cerrarDirectorioExpedientes;
  window.renderDirectorioPacientes = renderDirectorioPacientes;
  window.filtrarDirectorioExpedientes = filtrarDirectorioExpedientes;
  window.eliminarPacienteDirectorio = eliminarPacienteDirectorio;
  window.abrirExpedientePorId = abrirExpedientePorId;
  window.abrirExpedientePorCita = abrirExpedientePorCita;
  window.cerrarModalExpediente = cerrarModalExpediente;
  window.actualizarCabeceraExpediente = actualizarCabeceraExpediente;
  window.volverAlDirectorioExpedientes = volverAlDirectorioExpedientes;
  window.toggleMaximizarModalExpediente = toggleMaximizarModalExpediente;
  window.renderListaNotasExpediente = renderListaNotasExpediente;
  window.resaltarTexto = resaltarTexto;
  window.escapeHtmlText = escapeHtmlText;
  window.buscarEnNotasExpediente = buscarEnNotasExpediente;
  window.mostrarFormularioNuevaNota = mostrarFormularioNuevaNota;
  window.ocultarFormularioNota = ocultarFormularioNota;
  window.guardarNotaExpediente = guardarNotaExpediente;
  window.editarNotaExpedienteModal = editarNotaExpedienteModal;
  window.eliminarNotaExpedienteConfirm = eliminarNotaExpedienteConfirm;
  window.abrirDetalleSesion = abrirDetalleSesion;
  window.cerrarDetalleSesion = cerrarDetalleSesion;
  window.actualizarBotonesBarraDetalle = actualizarBotonesBarraDetalle;
  window.editarNotaDesdeDetalle = editarNotaDesdeDetalle;
  window.guardarEdicionInSituDetalle = guardarEdicionInSituDetalle;
  window.cancelarEdicionInSituDetalle = cancelarEdicionInSituDetalle;
  window.toggleAgrandarDetalleSesion = toggleAgrandarDetalleSesion;
  window.imprimirNotaIndividual = imprimirNotaIndividual;
  window.imprimirNotaActualDetalle = imprimirNotaActualDetalle;
  window.descargarNotaIndividualTxt = descargarNotaIndividualTxt;
  window.descargarNotaActualTxt = descargarNotaActualTxt;
}

// Cargar en segundo plano al inicializar el módulo
cargarDirectorioEnSegundoPlano();
