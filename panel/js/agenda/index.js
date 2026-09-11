// panel/js/agenda/index.js
// RF-01, RF-21, RF-23: Punto de entrada principal ESM para la Suite de Agenda Clínica PsicoLau

// 1. Importación de submódulos
import { PALETA_COLORES, getColoresPersonalizados, guardarColorPersonalizado, renderSwatches, getContrastColor, obtenerSiguienteColorDisponible } from './utils/colors.js';
import { parsearTelefono, actualizarPlaceholderTelefono } from './utils/phone.js';
import { asegurarModal } from './utils/modalLoader.js';
import { horasSlots, renderEasyTable, cambiarSemana, irHoy, setFiltroDias, actualizarUIFiltroDias, imprimirAgenda } from './render/weeklyTable.js';
import { renderAppointmentCard } from './render/appointmentCard.js';
import { establecerMontoCortesia, actualizarDatalistPacientes, manejarInputNombrePaciente, autoDetectarColorPaciente, calcularTotalGrupal } from './form/autocomplete.js';
import { abrirModal, cerrarModal, seleccionarTipoRegistro, setModoFormulario, mostrarModalDirecto, toggleOpcionesRecurrencia, seleccionarEstadoModal } from './form/modal.js';
import { initSubmitHandler, procesarSubmitCita } from './form/submitHandler.js';
import { abrirZoomSesion, toggleCompletarCita, toggleCancelarCita, toggleReactivarCita, agendarEnCelda, editarCita, revisarCitaCancelada, reactivarCita, detectarCitasFuturasEnMemoria, pedirAlcanceSerie, eliminarCita, eliminarDefinitivamente } from './actions/citaState.js';
import { toggleNotasSemana, cargarNotasConsultorio, guardarNotasConsultorio } from './ui/notasSemana.js';

// 2. Exportación de funciones y constantes
export {
  PALETA_COLORES,
  getColoresPersonalizados,
  guardarColorPersonalizado,
  renderSwatches,
  getContrastColor,
  obtenerSiguienteColorDisponible,
  parsearTelefono,
  actualizarPlaceholderTelefono,
  asegurarModal,
  horasSlots,
  renderEasyTable,
  cambiarSemana,
  irHoy,
  setFiltroDias,
  actualizarUIFiltroDias,
  imprimirAgenda,
  renderAppointmentCard,
  establecerMontoCortesia,
  actualizarDatalistPacientes,
  manejarInputNombrePaciente,
  autoDetectarColorPaciente,
  calcularTotalGrupal,
  abrirModal,
  cerrarModal,
  seleccionarTipoRegistro,
  setModoFormulario,
  mostrarModalDirecto,
  toggleOpcionesRecurrencia,
  seleccionarEstadoModal,
  initSubmitHandler,
  procesarSubmitCita,
  abrirZoomSesion,
  toggleCompletarCita,
  toggleCancelarCita,
  toggleReactivarCita,
  agendarEnCelda,
  editarCita,
  revisarCitaCancelada,
  reactivarCita,
  detectarCitasFuturasEnMemoria,
  pedirAlcanceSerie,
  eliminarCita,
  eliminarDefinitivamente,
  toggleNotasSemana,
  cargarNotasConsultorio,
  guardarNotasConsultorio
};

import { abrirModalDatosPago, abrirModalAuditoriaPagos } from '../pagos/index.js';

// 3. Lazy loaders para modales desacoplados
export { abrirModalAuditoriaPagos, abrirModalDatosPago };

export async function abrirModalCambiarPassword() {
  await asegurarModal('modalCambiarPassword', '/panel/partials/modals/modal-cambiar-password.html');
  const modal = document.getElementById('modalCambiarPassword');
  const form = document.getElementById('formCambiarPassword');
  if (form) form.reset();

  const alerta = document.getElementById('alertaCambioPassword');
  if (alerta) {
    alerta.style.display = 'none';
    alerta.textContent = '';
  }

  ['cp_passwordActual', 'cp_passwordNueva', 'cp_confirmarPassword'].forEach(id => {
    const input = document.getElementById(id);
    if (input) input.type = 'password';
  });
  ['icon_cp_actual', 'icon_cp_nueva', 'icon_cp_confirmar'].forEach(id => {
    const icon = document.getElementById(id);
    if (icon) icon.className = 'fa-regular fa-eye';
  });

  if (modal) modal.style.display = 'flex';
  setTimeout(() => {
    document.getElementById('cp_passwordActual')?.focus();
  }, 100);
}

export function cerrarModalCambiarPassword() {
  const modal = document.getElementById('modalCambiarPassword');
  if (modal) modal.style.display = 'none';
}

export async function abrirDirectorioExpedientes() {
  const expedientesModule = await import('../expedientes/index.js');
  return expedientesModule.abrirDirectorioExpedientes();
}

export async function abrirExpedientePorCita(citaId, event) {
  if (event) event.stopPropagation();
  const expedientesModule = await import('../expedientes/index.js');
  return expedientesModule.abrirExpedientePorCita(citaId);
}

export async function abrirExpedientePorId(pacienteId) {
  const expedientesModule = await import('../expedientes/index.js');
  return expedientesModule.abrirExpedientePorId(pacienteId);
}

export function logout() {
  localStorage.removeItem('psicolau_token');
  window.location.href = '/panel/index.html';
}

// 4. Exposición en window para compatibilidad estricta con HTML legacy (RF-23)
if (typeof window !== 'undefined') {
  // RF-23 Mínimo indispensable
  window.abrirModalAuditoriaPagos = abrirModalAuditoriaPagos;
  window.abrirModalDatosPago = abrirModalDatosPago;
  window.abrirModalCambiarPassword = abrirModalCambiarPassword;
  window.cerrarModalCambiarPassword = cerrarModalCambiarPassword;
  window.abrirDirectorioExpedientes = abrirDirectorioExpedientes;
  window.abrirExpedientePorCita = abrirExpedientePorCita;
  window.abrirExpedientePorId = abrirExpedientePorId;
  window.toggleNotasSemana = toggleNotasSemana;
  window.logout = logout;

  // Hooks esenciales para la agenda interactiva
  window.abrirModal = abrirModal;
  window.cerrarModal = cerrarModal;
  window.seleccionarTipoRegistro = seleccionarTipoRegistro;
  window.toggleOpcionesRecurrencia = toggleOpcionesRecurrencia;
  window.establecerMontoCortesia = establecerMontoCortesia;
  window.calcularTotalGrupal = calcularTotalGrupal;
  window.editarCita = editarCita;
  window.eliminarCita = eliminarCita;
  window.agendarEnCelda = agendarEnCelda;
  window.abrirZoomSesion = abrirZoomSesion;
  window.toggleCompletarCita = toggleCompletarCita;
  window.toggleCancelarCita = toggleCancelarCita;
  window.toggleReactivarCita = toggleReactivarCita;
  window.cambiarSemana = cambiarSemana;
  window.irHoy = irHoy;
  window.setFiltroDias = setFiltroDias;
  window.imprimirAgenda = imprimirAgenda;
  window.seleccionarEstadoModal = seleccionarEstadoModal;
  window.renderEasyTable = renderEasyTable;
  window.manejarInputNombrePaciente = manejarInputNombrePaciente;
  window.autoDetectarColorPaciente = autoDetectarColorPaciente;
  window.initSubmitHandler = initSubmitHandler;
  window.procesarSubmitCita = procesarSubmitCita;
}

// Inicializar automáticamente el manejador del formulario de citas
initSubmitHandler();

