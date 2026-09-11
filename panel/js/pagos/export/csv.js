// --- Exportador a Archivo CSV para Excel con UTF-8 BOM ---

import { detectarTipoCita, obtenerMontoSesion, obtenerCitasReportePeriodo } from '../utils/contabilidad.js';
import { getMesReporte, getAnioReporte } from '../utils/periodo.js';

const MESES_NOMBRES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Sanitiza valores para prevenir Inyección de Fórmulas en CSV (CWE-1236).
 * Si el contenido comienza con '=', '+', '-', '@', '\t' o '\r', antepone un apóstrofe (')
 * para obligar a Excel y hojas de cálculo a interpretarlo estrictamente como texto plano.
 */
export function sanitizarCeldaCSV(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).trim();
  const esFormula = /^[\s]*[=+\-@\t\r]/.test(str);
  const textoSeguro = esFormula ? `'${str}` : str;
  return `"${textoSeguro.replace(/"/g, '""')}"`;
}

/**
 * Genera y descarga el archivo CSV contable del periodo seleccionado
 */
export function descargarReporteCSV() {
  const cache = (typeof window !== 'undefined' && Array.isArray(window.citasCache)) ? window.citasCache : [];
  const mes = getMesReporte();
  const anio = getAnioReporte();
  const citasMes = obtenerCitasReportePeriodo(cache, mes, anio);
  const mesNombre = MESES_NOMBRES[mes];

  let csvContent = '\uFEFF'; // BOM para que Excel respete caracteres UTF-8 (acentos, ñ)
  csvContent += 'Fecha,Hora,Paciente,Tipo_Servicio,Monto_MXN,Estado_Pago,Estado_Sesion\n';

  citasMes.forEach(c => {
    const d = new Date(c.fechaHora);
    const fecha = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const hora = d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
    const tipo = detectarTipoCita(c);
    const tipoStr = tipo === 'GRUPAL' ? 'Grupal' : (tipo === 'EVALUACION' ? 'Evaluación' : 'Individual');
    const nombreCrudo = c.paciente ? c.paciente.nombre.replace(/^\[(BLOQUEO|GRUPAL|EVALUACION)\]\s*/i, '').trim() : 'Paciente';
    const nombre = sanitizarCeldaCSV(nombreCrudo);
    const tipoCelda = sanitizarCeldaCSV(tipoStr);
    const monto = obtenerMontoSesion(c, tipo);
    const estadoPago = sanitizarCeldaCSV(c.estado_pago || 'PENDIENTE');
    const estadoSesion = sanitizarCeldaCSV(c.estado_cita || 'PENDIENTE');

    csvContent += `${fecha},${hora},${nombre},${tipoCelda},${monto},${estadoPago},${estadoSesion}\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Reporte_PsicoLau_${mesNombre}_${anio}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
