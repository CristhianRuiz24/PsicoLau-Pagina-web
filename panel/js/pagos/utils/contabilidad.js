// --- Módulo Utilitario de Contabilidad y Normalización Financiera ---

const currencyFormatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

/**
 * Detecta el tipo de cita a partir de sus metadatos y paciente
 * @param {Object} c - Objeto de cita
 * @returns {'BLOQUEO' | 'GRUPAL' | 'EVALUACION' | 'INDIVIDUAL'}
 */
export function detectarTipoCita(c) {
  if (!c) return 'INDIVIDUAL';
  const cat = c.categoria || '';
  const nom = (c.paciente && c.paciente.nombre) ? c.paciente.nombre : '';
  const email = (c.paciente && c.paciente.email) ? c.paciente.email : '';

  if (cat.startsWith('[BLOQUEO]') || nom.startsWith('[BLOQUEO]')) return 'BLOQUEO';
  if (cat.startsWith('[GRUPAL]') || nom.startsWith('[GRUPAL]') || email.startsWith('grupal-')) return 'GRUPAL';
  if (cat.startsWith('[EVALUACION]') || nom.startsWith('[EVALUACION]')) return 'EVALUACION';
  return 'INDIVIDUAL';
}

/**
 * Obtiene el monto normalizado de una sesión considerando defaults por tipo
 * @param {Object} c - Objeto de cita
 * @param {string} [tipo] - Tipo opcional ya detectado
 * @returns {number} Monto en MXN
 */
export function obtenerMontoSesion(c, tipo) {
  if (!c) return 0;
  const tipoReal = tipo || detectarTipoCita(c);
  if (tipoReal === 'BLOQUEO') return 0;
  if (typeof c.monto === 'number') return c.monto;
  return tipoReal === 'EVALUACION' ? 4000 : 500;
}

/**
 * Formatea un valor numérico a moneda mexicana (MXN)
 * @param {number} monto 
 * @returns {string} Ejemplo: "$1,500.00"
 */
export function formatearMoneda(monto) {
  return currencyFormatter.format(monto || 0);
}

/**
 * Obtiene las citas correspondientes al periodo contable filtrado
 * @param {Array} citas 
 * @param {number} mes - Índice del mes (0 a 11)
 * @param {number} anio - Año (ej. 2026)
 * @returns {Array} Citas filtradas y ordenadas cronológicamente
 */
export function obtenerCitasReportePeriodo(citas, mes, anio) {
  if (!Array.isArray(citas)) return [];

  return citas.filter(c => {
    // Excluir canceladas a menos que ya se hayan pagado previamente (ingreso real)
    if (c.estado_cita === 'CANCELADA' && c.estado_pago !== 'PAGADO') return false;

    // Excluir bloqueos de agenda
    if (detectarTipoCita(c) === 'BLOQUEO') return false;

    const d = new Date(c.fechaHora);
    return d.getMonth() === mes && d.getFullYear() === anio;
  }).sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora));
}
