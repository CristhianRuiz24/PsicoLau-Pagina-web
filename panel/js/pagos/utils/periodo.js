// --- Gestión de Periodo para el Reporte Contable Mensual ---

let mesReporteSeleccionado = new Date().getMonth();
let anioReporteSeleccionado = new Date().getFullYear();

export function getMesReporte() {
  return mesReporteSeleccionado;
}

export function getAnioReporte() {
  return anioReporteSeleccionado;
}

export function setPeriodo(mes, anio) {
  mesReporteSeleccionado = mes;
  anioReporteSeleccionado = anio;
}

export function actualizarSelectorAnios() {
  const anioSelect = document.getElementById('reporteSelectAnio');
  if (!anioSelect) return;
  const anioActual = new Date().getFullYear();
  const minAnio = Math.min(2024, anioReporteSeleccionado);
  const maxAnio = Math.max(anioActual + 1, anioReporteSeleccionado);
  
  anioSelect.innerHTML = '';
  for (let a = minAnio; a <= maxAnio; a++) {
    const opt = document.createElement('option');
    opt.value = a;
    opt.textContent = a;
    if (a === anioReporteSeleccionado) opt.selected = true;
    anioSelect.appendChild(opt);
  }
}

export function cambiarMesReporte(delta, renderFn) {
  mesReporteSeleccionado += delta;
  if (mesReporteSeleccionado < 0) {
    mesReporteSeleccionado = 11;
    anioReporteSeleccionado -= 1;
  } else if (mesReporteSeleccionado > 11) {
    mesReporteSeleccionado = 0;
    anioReporteSeleccionado += 1;
  }

  actualizarSelectorAnios();

  const mesSelect = document.getElementById('reporteSelectMes');
  const anioSelect = document.getElementById('reporteSelectAnio');
  if (mesSelect) mesSelect.value = String(mesReporteSeleccionado);
  if (anioSelect) anioSelect.value = String(anioReporteSeleccionado);

  if (typeof renderFn === 'function') renderFn();
}

export function actualizarPeriodoReporte(renderFn) {
  const mesSelect = document.getElementById('reporteSelectMes');
  const anioSelect = document.getElementById('reporteSelectAnio');
  if (mesSelect) mesReporteSeleccionado = parseInt(mesSelect.value, 10);
  if (anioSelect) anioReporteSeleccionado = parseInt(anioSelect.value, 10);
  if (typeof renderFn === 'function') renderFn();
}

export function irMesActualReporte(renderFn) {
  const hoy = new Date();
  mesReporteSeleccionado = hoy.getMonth();
  anioReporteSeleccionado = hoy.getFullYear();

  actualizarSelectorAnios();

  const mesSelect = document.getElementById('reporteSelectMes');
  const anioSelect = document.getElementById('reporteSelectAnio');
  if (mesSelect) mesSelect.value = String(mesReporteSeleccionado);
  if (anioSelect) anioSelect.value = String(anioReporteSeleccionado);

  if (typeof renderFn === 'function') renderFn();
}
