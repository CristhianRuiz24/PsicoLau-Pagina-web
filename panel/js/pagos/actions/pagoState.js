// --- Módulo de Mutaciones de Estado de Pago e Interacción con API ---

/**
 * Actualiza directamente el estado de pago de una cita en el backend
 * @param {number} id - ID de la cita
 * @param {'PENDIENTE' | 'PAGADO'} nuevoPago 
 */
export async function cambiarPagoDirecto(id, nuevoPago) {
  const token = localStorage.getItem('psicolau_token');
  const apiUrl = (typeof window !== 'undefined' && window.API_URL) ? window.API_URL : '';

  try {
    const res = await fetch(`${apiUrl}/agenda/citas/${id}/pago`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ estado_pago: nuevoPago })
    });
    const data = await res.json();
    if (data.success) {
      const cache = (typeof window !== 'undefined' && Array.isArray(window.citasCache)) ? window.citasCache : [];
      const cita = cache.find(c => c.id === id);
      if (cita) cita.estado_pago = nuevoPago;

      if (typeof window !== 'undefined' && typeof window.renderEasyTable === 'function') {
        window.renderEasyTable();
      }
    } else {
      alert(data.message || 'Error al actualizar el estado de pago');
    }
  } catch (error) {
    console.error('Error al actualizar estado de pago:', error);
    alert('Error al actualizar el estado de pago');
  }
}

/**
 * Alterna el estado de pago entre PENDIENTE y PAGADO desde la vista semanal o tarjeta
 * @param {number} id 
 * @param {Event} [e] 
 */
export async function togglePagoDirecto(id, e) {
  if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
  const cache = (typeof window !== 'undefined' && Array.isArray(window.citasCache)) ? window.citasCache : [];
  const cita = cache.find(c => c.id === id);
  if (!cita) return;
  const nuevoPago = cita.estado_pago === 'PAGADO' ? 'PENDIENTE' : 'PAGADO';
  await cambiarPagoDirecto(id, nuevoPago);
}

/**
 * Marca una cita como PAGADO desde el modal de auditoría de pagos
 * @param {number} id 
 * @param {Function} renderAuditoriaFn 
 */
export async function togglePagoDesdeAuditoria(id, renderAuditoriaFn) {
  await cambiarPagoDirecto(id, 'PAGADO');
  if (typeof renderAuditoriaFn === 'function') {
    renderAuditoriaFn();
  }
}

/**
 * Alterna el estado de pago desde la tabla del reporte contable mensual
 * @param {number} id 
 * @param {Function} renderReporteFn 
 */
export async function togglePagoDesdeReporte(id, renderReporteFn) {
  const cache = (typeof window !== 'undefined' && Array.isArray(window.citasCache)) ? window.citasCache : [];
  const cita = cache.find(c => c.id === id);
  if (!cita) return;
  const nuevoPago = cita.estado_pago === 'PAGADO' ? 'PENDIENTE' : 'PAGADO';
  await cambiarPagoDirecto(id, nuevoPago);
  if (typeof renderReporteFn === 'function') {
    renderReporteFn();
  }
}
