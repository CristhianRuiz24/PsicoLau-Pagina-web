// --- Apertura, Cierre y Manejo de Modales de Pagos, Auditoría y Reportes ---

import { renderAuditoriaPagos } from '../render/auditoria.js';
import { renderReporteMensual } from '../render/reporte.js';
import { actualizarSelectorAnios, getMesReporte } from '../utils/periodo.js';
import { asegurarModal } from '../../agenda/utils/modalLoader.js';

/**
 * Abre el modal de configuración de datos de pago bancarios
 */
export async function abrirModalDatosPago() {
  await asegurarModal('modalDatosPago', '/panel/partials/modals/modal-datos-pago.html');
  const datos = (typeof window !== 'undefined' && typeof window.getDatosPago === 'function') 
    ? window.getDatosPago() 
    : JSON.parse(localStorage.getItem('psicolau_datos_pago') || '{}');

  const b = document.getElementById('dp_banco'); if (b) b.value = datos.banco || '';
  const t = document.getElementById('dp_titular'); if (t) t.value = datos.titular || '';
  const c = document.getElementById('dp_clabe'); if (c) c.value = datos.clabe || '';
  const e = document.getElementById('dp_enlace'); if (e) e.value = datos.enlace || '';

  const modal = document.getElementById('modalDatosPago');
  if (modal) modal.style.display = 'flex';
}

/**
 * Cierra el modal de datos de pago
 */
export function cerrarModalDatosPago() {
  const modal = document.getElementById('modalDatosPago');
  if (modal) modal.style.display = 'none';
}

/**
 * Guarda en localStorage los datos de cuenta bancaria
 * @param {Event} [e] 
 */
export function guardarDatosPago(e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();
  const datos = {
    banco: document.getElementById('dp_banco')?.value.trim() || '',
    titular: document.getElementById('dp_titular')?.value.trim() || '',
    clabe: document.getElementById('dp_clabe')?.value.trim() || '',
    enlace: document.getElementById('dp_enlace')?.value.trim() || ''
  };
  localStorage.setItem('psicolau_datos_pago', JSON.stringify(datos));
  cerrarModalDatosPago();
  alert('✅ Datos de cobro guardados correctamente.');
}

/**
 * Abre el modal de auditoría de pagos pendientes
 */
export async function abrirModalAuditoriaPagos() {
  await asegurarModal('modalAuditoriaPagos', '/panel/partials/modals/modal-auditoria-pagos.html');
  const modal = document.getElementById('modalAuditoriaPagos');
  if (modal) modal.style.display = 'flex';
  renderAuditoriaPagos();
}

/**
 * Cierra el modal de auditoría de pagos
 */
export function cerrarModalAuditoriaPagos() {
  const modal = document.getElementById('modalAuditoriaPagos');
  if (modal) modal.style.display = 'none';
}

/**
 * Abre el modal del reporte contable mensual
 */
export function abrirModalReporteMensual() {
  const modal = document.getElementById('modalReporteMensual');
  if (modal) modal.style.display = 'flex';

  actualizarSelectorAnios();

  const mesSelect = document.getElementById('reporteSelectMes');
  if (mesSelect) {
    mesSelect.value = String(getMesReporte());
  }

  renderReporteMensual();
}

/**
 * Cierra el modal del reporte mensual
 */
export function cerrarModalReporteMensual() {
  const modal = document.getElementById('modalReporteMensual');
  if (modal) modal.style.display = 'none';
}

/**
 * Imprime el reporte mensual o genera vista previa en PDF
 */
export function imprimirReporteMensual() {
  document.body.classList.add('printing-reporte-mensual');
  window.print();
  setTimeout(() => {
    document.body.classList.remove('printing-reporte-mensual');
  }, 1000);
}
