// --- Exportador Categorizado para Contabilidad (WhatsApp / Portapapeles) ---

import { detectarTipoCita, obtenerMontoSesion, obtenerCitasReportePeriodo } from '../utils/contabilidad.js';
import { getMesReporte, getAnioReporte } from '../utils/periodo.js';

const MESES_NOMBRES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Genera y copia el reporte contable formateado para la contadora al portapapeles
 */
export function copiarReporteParaContadora() {
  const cache = (typeof window !== 'undefined' && Array.isArray(window.citasCache)) ? window.citasCache : [];
  const mes = getMesReporte();
  const anio = getAnioReporte();
  const citasMes = obtenerCitasReportePeriodo(cache, mes, anio);
  const mesNombre = MESES_NOMBRES[mes];

  const individualesPorMonto = {};
  let totalSesionesGrupales = 0;
  let totalIngresoGrupal = 0;
  const evaluacionesPorMonto = {};
  let sesionesGratuitas = 0;
  let totalIngresos = 0;

  citasMes.forEach(c => {
    const tipo = detectarTipoCita(c);
    const monto = obtenerMontoSesion(c, tipo);
    const esPagado = c.estado_pago === 'PAGADO';

    if (monto === 0) {
      sesionesGratuitas++;
    } else if (esPagado) {
      totalIngresos += monto;
      if (tipo === 'GRUPAL') {
        totalSesionesGrupales++;
        totalIngresoGrupal += monto;
      } else if (tipo === 'EVALUACION') {
        evaluacionesPorMonto[monto] = (evaluacionesPorMonto[monto] || 0) + 1;
      } else {
        individualesPorMonto[monto] = (individualesPorMonto[monto] || 0) + 1;
      }
    }
  });

  const lineasDesglose = [];

  // 1. Consultas individuales ordenadas por tarifa descendente
  const tarifasInd = Object.keys(individualesPorMonto).map(Number).sort((a, b) => b - a);
  tarifasInd.forEach(tarifa => {
    const cant = individualesPorMonto[tarifa];
    const subtotal = cant * tarifa;
    const txtSesion = cant === 1 ? 'sesión individual' : 'sesiones individuales';
    lineasDesglose.push(`• ${cant} ${txtSesion} de $${tarifa.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} = $${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  });

  // 2. Terapias grupales
  if (totalSesionesGrupales > 0) {
    const txtGrupal = totalSesionesGrupales === 1 ? 'sesión grupal' : 'sesiones grupales';
    lineasDesglose.push(`• ${totalSesionesGrupales} ${txtGrupal} = $${totalIngresoGrupal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total`);
  }

  // 3. Evaluaciones ordenadas por tarifa descendente
  const tarifasEval = Object.keys(evaluacionesPorMonto).map(Number).sort((a, b) => b - a);
  tarifasEval.forEach(tarifa => {
    const cant = evaluacionesPorMonto[tarifa];
    const subtotal = cant * tarifa;
    const txtEval = cant === 1 ? 'evaluación' : 'evaluaciones';
    lineasDesglose.push(`• ${cant} ${txtEval} de $${tarifa.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} = $${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  });

  // 4. Sesiones gratuitas / cortesías
  if (sesionesGratuitas > 0) {
    const txtGratis = sesionesGratuitas === 1 ? 'sesión gratuita' : 'sesiones gratuitas';
    lineasDesglose.push(`• ${sesionesGratuitas} ${txtGratis} (cortesía $0)`);
  }

  const texto = `📋 *DESGLOSE CONTABLE PSICOLAU — ${mesNombre.toUpperCase()} ${anio}*
Psicóloga: Ana Laura Gómez Díaz

*INGRESOS DEL PERIODO:*
${lineasDesglose.length > 0 ? lineasDesglose.join('\n') : 'No se registraron ingresos en este periodo.'}

━━━━━━━━━━━━━━━━━━━━
💰 *Ingresos totales: $${totalIngresos.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN*
`;

  navigator.clipboard.writeText(texto).then(() => {
    const btn = document.getElementById('btnCopiarReporteContadora');
    if (btn) {
      const orig = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> <span>¡Copiado para Contadora!</span>';
      btn.style.background = '#059669';
      setTimeout(() => {
        btn.innerHTML = orig;
        btn.style.background = '#6366f1';
      }, 2500);
    }
  }).catch(() => {
    alert('No se pudo copiar automáticamente. Por favor copia el texto manualmente.');
  });
}
