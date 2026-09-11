// --- Entry Point ESM del Módulo de Pagos, Cobranza y Reportes Contables ---

import {
  detectarTipoCita,
  obtenerMontoSesion,
  formatearMoneda,
  obtenerCitasReportePeriodo
} from './utils/contabilidad.js';

import {
  getMesReporte,
  getAnioReporte,
  setPeriodo,
  actualizarSelectorAnios,
  cambiarMesReporte as cambiarMesReportePeriodo,
  actualizarPeriodoReporte as actualizarPeriodoReportePeriodo,
  irMesActualReporte as irMesActualReportePeriodo
} from './utils/periodo.js';

import {
  cambiarPagoDirecto,
  togglePagoDirecto,
  togglePagoDesdeAuditoria as togglePagoAuditoriaAction,
  togglePagoDesdeReporte as togglePagoReporteAction
} from './actions/pagoState.js';

import {
  abrirModalDatosPago,
  cerrarModalDatosPago,
  guardarDatosPago,
  abrirModalAuditoriaPagos,
  cerrarModalAuditoriaPagos,
  abrirModalReporteMensual,
  cerrarModalReporteMensual,
  imprimirReporteMensual
} from './actions/modal.js';

import {
  cambiarFiltroAuditoria,
  renderAuditoriaPagos
} from './render/auditoria.js';

import {
  renderReporteMensual
} from './render/reporte.js';

import {
  copiarReporteParaContadora
} from './export/contadora.js';

import {
  descargarReporteCSV
} from './export/csv.js';

// Wrappers adaptadores para callbacks visuales
export function cambiarMesReporte(delta) {
  cambiarMesReportePeriodo(delta, renderReporteMensual);
}

export function actualizarPeriodoReporte() {
  actualizarPeriodoReportePeriodo(renderReporteMensual);
}

export function irMesActualReporte() {
  irMesActualReportePeriodo(renderReporteMensual);
}

export async function togglePagoDesdeAuditoria(id) {
  await togglePagoAuditoriaAction(id, renderAuditoriaPagos);
}

export async function togglePagoDesdeReporte(id) {
  await togglePagoReporteAction(id, renderReporteMensual);
}

// Exportación modular completa
export {
  detectarTipoCita,
  obtenerMontoSesion,
  formatearMoneda,
  obtenerCitasReportePeriodo,
  getMesReporte,
  getAnioReporte,
  setPeriodo,
  actualizarSelectorAnios,
  cambiarPagoDirecto,
  togglePagoDirecto,
  abrirModalDatosPago,
  cerrarModalDatosPago,
  guardarDatosPago,
  abrirModalAuditoriaPagos,
  cerrarModalAuditoriaPagos,
  abrirModalReporteMensual,
  cerrarModalReporteMensual,
  imprimirReporteMensual,
  cambiarFiltroAuditoria,
  renderAuditoriaPagos,
  renderReporteMensual,
  copiarReporteParaContadora,
  descargarReporteCSV
};

// Exposición en el objeto global `window` para preservar compatibilidad con atributos onclick y módulos legados
if (typeof window !== 'undefined') {
  window.abrirModalDatosPago = abrirModalDatosPago;
  window.cerrarModalDatosPago = cerrarModalDatosPago;
  window.guardarDatosPago = guardarDatosPago;

  window.cambiarFiltroAuditoria = cambiarFiltroAuditoria;
  window.abrirModalAuditoriaPagos = abrirModalAuditoriaPagos;
  window.cerrarModalAuditoriaPagos = cerrarModalAuditoriaPagos;
  window.togglePagoDesdeAuditoria = togglePagoDesdeAuditoria;
  window.renderAuditoriaPagos = renderAuditoriaPagos;

  window.cambiarPagoDirecto = cambiarPagoDirecto;
  window.togglePagoDirecto = togglePagoDirecto;

  window.abrirModalReporteMensual = abrirModalReporteMensual;
  window.cerrarModalReporteMensual = cerrarModalReporteMensual;
  window.cambiarMesReporte = cambiarMesReporte;
  window.actualizarPeriodoReporte = actualizarPeriodoReporte;
  window.irMesActualReporte = irMesActualReporte;
  window.renderReporteMensual = renderReporteMensual;
  window.togglePagoDesdeReporte = togglePagoDesdeReporte;

  window.copiarReporteParaContadora = copiarReporteParaContadora;
  window.descargarReporteCSV = descargarReporteCSV;
  window.imprimirReporteMensual = imprimirReporteMensual;

  window.detectarTipoCita = detectarTipoCita;
  window.obtenerMontoSesion = obtenerMontoSesion;
  window.formatearMoneda = formatearMoneda;
}
