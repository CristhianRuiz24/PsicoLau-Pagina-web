// panel/js/agenda/render/weeklyTable.js
// RF-02: Renderizado de la matriz semanal (EasyTable), franjas horarias, estadísticas y navegación de semanas

import { renderAppointmentCard } from './appointmentCard.js';

export const horasSlots = [
  { hora: 7, label: '07:00 a.m.' },
  { hora: 8, label: '08:00 a.m.' },
  { hora: 9, label: '09:00 a.m.' },
  { hora: 10, label: '10:00 a.m.' },
  { hora: 11, label: '11:00 a.m.' },
  { hora: 12, label: '12:00 p.m.' },
  { hora: 13, label: '01:00 p.m.' },
  { hora: 14, label: '02:00 p.m.' },
  { hora: 15, label: '03:00 p.m.' },
  { hora: 16, label: '04:00 p.m.' },
  { hora: 17, label: '05:00 p.m.' },
  { hora: 18, label: '06:00 p.m.' },
  { hora: 19, label: '07:00 p.m.' },
  { hora: 20, label: '08:00 p.m.' },
  { hora: 21, label: '09:00 p.m.' },
  { hora: 22, label: '10:00 p.m.' },
  { hora: 23, label: '11:00 p.m.' },
  { hora: 0, label: '12:00 a.m.' }
];

export function renderEasyTable() {
  const thead = document.getElementById('easyTableHead');
  const tbody = document.getElementById('easyTableBody');
  const rangoEl = document.getElementById('rangoSemana');
  const printRangoEl = document.getElementById('printRangoSemana');
  if (!thead || !tbody) return;

  const currentOffset = typeof window !== 'undefined' && typeof window.currentWeekOffset === 'number' ? window.currentWeekOffset : 0;
  const filtroDias = typeof window !== 'undefined' && typeof window.filtroDias === 'number' ? window.filtroDias : 7;
  const citasCache = typeof window !== 'undefined' && Array.isArray(window.citasCache) ? window.citasCache : [];
  const terminoBusqueda = typeof window !== 'undefined' && typeof window.terminoBusqueda === 'string' ? window.terminoBusqueda : '';

  // Calcular el lunes de la semana visible
  const hoy = new Date();
  const diaSemanaHoy = hoy.getDay(); // 0 = Dom, 1 = Lun
  const diffHoy = hoy.getDate() - diaSemanaHoy + (diaSemanaHoy === 0 ? -6 : 1);
  const lunes = new Date(hoy.getFullYear(), hoy.getMonth(), diffHoy + (currentOffset * 7));

  const totalDiasMostrar = filtroDias === 5 ? 5 : 7;
  const diasSemana = [];
  for (let i = 0; i < totalDiasMostrar; i++) {
    const d = new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + i);
    diasSemana.push(d);
  }

  // Actualizar título del rango de semana
  const ultimoDia = diasSemana[diasSemana.length - 1];
  const mesInicio = diasSemana[0].toLocaleDateString('es-MX', { month: 'short' });
  const mesFin = ultimoDia.toLocaleDateString('es-MX', { month: 'short' });
  const anio = ultimoDia.getFullYear();
  const textoRango = mesInicio === mesFin 
    ? `Semana del ${diasSemana[0].getDate()} al ${ultimoDia.getDate()} de ${mesInicio} ${anio}`
    : `Semana del ${diasSemana[0].getDate()} ${mesInicio} al ${ultimoDia.getDate()} ${mesFin} ${anio}`;

  if (rangoEl) rangoEl.innerText = textoRango;
  if (printRangoEl) printRangoEl.innerText = textoRango;

  // Calcular estadísticas de la semana visible
  let countTotal = 0;
  let countPagadas = 0;
  let countPorPagar = 0;

  const citasEstaSemana = citasCache.filter(c => {
    if (c.estado_cita === 'CANCELADA') return false;
    const cd = new Date(c.fechaHora);
    return diasSemana.some(d => d.toDateString() === cd.toDateString());
  });

  citasEstaSemana.forEach(c => {
    const esBloqueo = (c.categoria && c.categoria.startsWith('[BLOQUEO]')) || (c.paciente && c.paciente.nombre && c.paciente.nombre.startsWith('[BLOQUEO]'));
    if (!esBloqueo) {
      countTotal++;
      const monto = typeof c.monto === 'number' ? c.monto : 500;
      if (c.estado_pago === 'PAGADO') {
        countPagadas++;
      } else if (monto !== 0) {
        countPorPagar++;
      }
    }
  });

  const statTotalEl = document.getElementById('statTotalCitas');
  const statPagadasEl = document.getElementById('statPagadas');
  const statPorPagarEl = document.getElementById('statPorPagar');
  if (statTotalEl) statTotalEl.innerText = `${countTotal} ${countTotal === 1 ? 'cita' : 'citas'}`;
  if (statPagadasEl) statPagadasEl.innerText = `${countPagadas} pagadas`;
  if (statPorPagarEl) statPorPagarEl.innerText = `${countPorPagar} por pagar`;

  // Generar thead
  const nombresDiasCortos = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
  let theadHtml = `<tr><th class="time-col-header"><i class="fa-solid fa-clock" style="color: var(--turquesa);"></i></th>`;
  diasSemana.forEach((d, idx) => {
    const esHoy = d.toDateString() === new Date().toDateString();
    theadHtml += `<th class="${esHoy ? 'today-header' : ''}">${nombresDiasCortos[idx]} ${d.getDate()}</th>`;
  });
  theadHtml += `</tr>`;
  thead.innerHTML = theadHtml;

  let tbodyHtml = '';
  horasSlots.forEach(slot => {
    tbodyHtml += `<tr><td class="time-col">${slot.label}</td>`;

    diasSemana.forEach(d => {
      // Filtrar citas para esta celda [día, hora]
      const citasCelda = citasCache.filter(c => {
        const cDate = new Date(c.fechaHora);
        return cDate.toDateString() === d.toDateString() && cDate.getHours() === slot.hora;
      });

      if (citasCelda.length > 0) {
        citasCelda.sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora));

        tbodyHtml += `<td class="slot-cell" style="padding: 2px;"><div class="cell-appointments-container">`;
        citasCelda.forEach(cita => {
          tbodyHtml += renderAppointmentCard(cita, terminoBusqueda);
        });
        tbodyHtml += `</div></td>`;
      } else {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const hh = String(slot.hora).padStart(2, '0');
        const fechaStr = `${yyyy}-${mm}-${dd}`;
        const horaStr = `${hh}:00`;

        tbodyHtml += `<td class="slot-cell" onclick="agendarEnCelda('${fechaStr}', '${horaStr}')" title="Clic para agendar el ${dd}/${mm} a las ${slot.label}"></td>`;
      }
    });

    tbodyHtml += `</tr>`;
  });

  tbody.innerHTML = tbodyHtml;
}

export function cambiarSemana(offset) {
  if (typeof window !== 'undefined') {
    window.currentWeekOffset = (window.currentWeekOffset || 0) + offset;
  }
  renderEasyTable();
}

export function irHoy() {
  if (typeof window !== 'undefined') {
    window.currentWeekOffset = 0;
  }
  renderEasyTable();
}

export function setFiltroDias(dias) {
  if (typeof window !== 'undefined') {
    window.filtroDias = dias;
    localStorage.setItem('psicolau_filtro_dias', dias);
  }
  actualizarUIFiltroDias();
  renderEasyTable();
}

export function actualizarUIFiltroDias() {
  const currentFiltro = typeof window !== 'undefined' ? window.filtroDias : 7;
  const btn5 = document.getElementById('btnFiltro5');
  const btn7 = document.getElementById('btnFiltro7');
  if (btn5 && btn7) {
    btn5.classList.toggle('active', currentFiltro === 5);
    btn7.classList.toggle('active', currentFiltro === 7);
  }
}

export function imprimirAgenda() {
  const rangoEl = document.getElementById('rangoSemana');
  const printRangoEl = document.getElementById('printRangoSemana');
  if (rangoEl && printRangoEl) {
    printRangoEl.textContent = rangoEl.textContent;
  }
  window.print();
}

// Compatibilidad global
if (typeof window !== 'undefined') {
  window.renderEasyTable = renderEasyTable;
  window.cambiarSemana = cambiarSemana;
  window.irHoy = irHoy;
  window.setFiltroDias = setFiltroDias;
  window.actualizarUIFiltroDias = actualizarUIFiltroDias;
  window.imprimirAgenda = imprimirAgenda;
}
