// --- Módulo de Gestión de Pagos, Cuentas Bancarias y Auditoría ---

// --- GESTIÓN DE DATOS DE COBRO Y CUENTAS BANCARIAS ---
window.abrirModalDatosPago = function() {
  const datos = getDatosPago();
  document.getElementById('dp_banco').value = datos.banco || '';
  document.getElementById('dp_titular').value = datos.titular || '';
  document.getElementById('dp_clabe').value = datos.clabe || '';
  document.getElementById('dp_enlace').value = datos.enlace || '';
  
  const modal = document.getElementById('modalDatosPago');
  if (modal) modal.style.display = 'flex';
};

window.cerrarModalDatosPago = function() {
  const modal = document.getElementById('modalDatosPago');
  if (modal) modal.style.display = 'none';
};

window.guardarDatosPago = function(e) {
  if (e) e.preventDefault();
  const datos = {
    banco: document.getElementById('dp_banco').value.trim(),
    titular: document.getElementById('dp_titular').value.trim(),
    clabe: document.getElementById('dp_clabe').value.trim(),
    enlace: document.getElementById('dp_enlace').value.trim()
  };
  localStorage.setItem('psicolau_datos_pago', JSON.stringify(datos));
  window.cerrarModalDatosPago();
  alert('✅ Datos de cobro guardados correctamente.');
};

// --- AUDITORÍA DE PAGOS Y CUENTAS POR COBRAR ---
window.cambiarFiltroAuditoria = function(filtro) {
  filtroAuditoriaActual = filtro;
  const btnSemana = document.getElementById('tabAuditSemana');
  const btnTodas = document.getElementById('tabAuditTodas');
  if (btnSemana && btnTodas) {
    btnSemana.classList.toggle('active', filtro === 'SEMANA');
    btnTodas.classList.toggle('active', filtro === 'TODAS');
  }
  renderAuditoriaPagos();
};

window.abrirModalAuditoriaPagos = function() {
  const modal = document.getElementById('modalAuditoriaPagos');
  if (modal) modal.style.display = 'flex';
  renderAuditoriaPagos();
};

window.cerrarModalAuditoriaPagos = function() {
  const modal = document.getElementById('modalAuditoriaPagos');
  if (modal) modal.style.display = 'none';
};

window.togglePagoDesdeAuditoria = async function(id) {
  await window.cambiarPagoDirecto(id, 'PAGADO');
  renderAuditoriaPagos();
};

function renderAuditoriaPagos() {
  const container = document.getElementById('auditListaContainer');
  const subtitulo = document.getElementById('auditSubtitulo');
  if (!container) return;

  // Filtrar citas no canceladas, que no sean bloqueos y que tengan estado de pago PENDIENTE
  let pendientes = citasCache.filter(c => {
    if (c.estado_cita === 'CANCELADA') return false;
    if (c.estado_pago === 'PAGADO') return false;
    const esBloqueo = (c.categoria && c.categoria.startsWith('[BLOQUEO]')) || (c.paciente && c.paciente.nombre && c.paciente.nombre.startsWith('[BLOQUEO]'));
    return !esBloqueo;
  });

  if (filtroAuditoriaActual === 'SEMANA') {
    const hoy = new Date();
    const diaSemanaHoy = hoy.getDay();
    const diffHoy = hoy.getDate() - diaSemanaHoy + (diaSemanaHoy === 0 ? -6 : 1);
    const lunes = new Date(hoy.getFullYear(), hoy.getMonth(), diffHoy + (currentWeekOffset * 7));
    lunes.setHours(0, 0, 0, 0);

    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 7);

    pendientes = pendientes.filter(c => {
      const cDate = new Date(c.fechaHora);
      return cDate >= lunes && cDate < domingo;
    });
  }

  // Ordenar cronológicamente
  pendientes.sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora));

  if (subtitulo) {
    const periodoTxt = filtroAuditoriaActual === 'SEMANA' ? 'en la semana visible' : 'en todo el historial';
    subtitulo.innerHTML = `<strong>${pendientes.length}</strong> sesión${pendientes.length === 1 ? '' : 'es'} pendiente${pendientes.length === 1 ? '' : 's'} por cobrar ${periodoTxt}`;
  }

  if (pendientes.length === 0) {
    container.innerHTML = `
      <div class="audit-empty-state">
        <i class="fa-solid fa-circle-check"></i>
        <div style="font-size: 1.1rem; font-weight: 800; margin-bottom: 0.3rem;">¡Todo al día!</div>
        <p style="font-size: 0.88rem; margin: 0; opacity: 0.9;">No tienes sesiones pendientes de cobro ${filtroAuditoriaActual === 'SEMANA' ? 'para esta semana' : 'en tu historial'}.</p>
      </div>
    `;
    return;
  }

  let html = '';
  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  pendientes.forEach(c => {
    const d = new Date(c.fechaHora);
    const fechaTxt = `${diasSemana[d.getDay()]} ${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()} — ${d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
    const nombre = c.paciente ? c.paciente.nombre.replace(/^\[(BLOQUEO|GRUPAL|EVALUACION)\]\s*/i, '').trim() : 'Paciente';
    const notas = (c.categoria || '').replace(/^\[(BLOQUEO|GRUPAL|EVALUACION)\]\s*/i, '').trim();
    const esCompletada = c.estado_cita === 'REALIZADA' || c.estado_cita === 'CONFIRMADA';

    html += `
      <div class="audit-card">
        <div class="audit-card-info">
          <div class="audit-card-title">
            <span>${escapeHtml(nombre)}</span>
            ${esCompletada ? `<span style="font-size: 0.65rem; padding: 1px 6px; border-radius: 4px; background: #dcfce7; color: #15803d; font-weight: 700;">✓ Realizada</span>` : `<span style="font-size: 0.65rem; padding: 1px 6px; border-radius: 4px; background: #fef9c3; color: #854d0e; font-weight: 700;">Por realizar</span>`}
          </div>
          <div class="audit-card-meta">
            <span><i class="fa-solid fa-calendar-day" style="color: var(--turquesa); margin-right: 3px;"></i> ${fechaTxt}</span>
            ${notas ? `<span>· <i class="fa-solid fa-tag" style="margin-right: 2px;"></i> ${escapeHtml(notas)}</span>` : ''}
            ${c.paciente && c.paciente.telefono ? `<span>· <i class="fa-brands fa-whatsapp" style="color: #16a34a; margin-right: 2px;"></i> ${escapeHtml(c.paciente.telefono)}</span>` : ''}
          </div>
        </div>
        <div class="audit-card-actions">
          <button type="button" class="btn-audit-whatsapp" onclick="enviarWhatsAppCobro(${c.id}, event)" title="Enviar recordatorio cordial de cobro con datos bancarios">
            <i class="fa-brands fa-whatsapp"></i> <span>Pedir Pago</span>
          </button>
          <button type="button" class="btn-audit-pay-toggle" onclick="togglePagoDesdeAuditoria(${c.id})" title="Marcar como pagada">
            <i class="fa-solid fa-check"></i> <span>Pagado</span>
          </button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// Actualización directa de pago
window.cambiarPagoDirecto = async function(id, nuevoPago) {
  const token = localStorage.getItem('psicolau_token');
  try {
    const res = await fetch(`${API_URL}/agenda/citas/${id}/pago`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ estado_pago: nuevoPago })
    });
    const data = await res.json();
    if (data.success) {
      const cita = citasCache.find(c => c.id === id);
      if (cita) cita.estado_pago = nuevoPago;
      renderEasyTable();
    }
  } catch (error) {
    alert('Error al actualizar el estado de pago');
  }
};

window.togglePagoDirecto = async function(id, e) {
  if (e) e.stopPropagation();
  const cita = citasCache.find(c => c.id === id);
  if (!cita) return;
  const nuevoPago = cita.estado_pago === 'PAGADO' ? 'PENDIENTE' : 'PAGADO';
  await window.cambiarPagoDirecto(id, nuevoPago);
};

// --- MÓDULO DE REPORTE CONTABLE MENSUAL Y CONTROL DE INGRESOS ---

let mesReporteSeleccionado = new Date().getMonth();
let anioReporteSeleccionado = new Date().getFullYear();

function actualizarSelectorAnios() {
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

window.abrirModalReporteMensual = function() {
  const modal = document.getElementById('modalReporteMensual');
  if (modal) modal.style.display = 'flex';

  actualizarSelectorAnios();

  const mesSelect = document.getElementById('reporteSelectMes');
  if (mesSelect) {
    mesSelect.value = String(mesReporteSeleccionado);
  }

  renderReporteMensual();
};

window.cerrarModalReporteMensual = function() {
  const modal = document.getElementById('modalReporteMensual');
  if (modal) modal.style.display = 'none';
};

window.cambiarMesReporte = function(delta) {
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

  renderReporteMensual();
};

window.actualizarPeriodoReporte = function() {
  const mesSelect = document.getElementById('reporteSelectMes');
  const anioSelect = document.getElementById('reporteSelectAnio');
  if (mesSelect) mesReporteSeleccionado = parseInt(mesSelect.value, 10);
  if (anioSelect) anioReporteSeleccionado = parseInt(anioSelect.value, 10);
  renderReporteMensual();
};

window.irMesActualReporte = function() {
  const hoy = new Date();
  mesReporteSeleccionado = hoy.getMonth();
  anioReporteSeleccionado = hoy.getFullYear();

  actualizarSelectorAnios();

  const mesSelect = document.getElementById('reporteSelectMes');
  const anioSelect = document.getElementById('reporteSelectAnio');
  if (mesSelect) mesSelect.value = String(mesReporteSeleccionado);
  if (anioSelect) anioSelect.value = String(anioReporteSeleccionado);

  renderReporteMensual();
};

function detectarTipoCita(c) {
  const cat = c.categoria || '';
  const nom = (c.paciente && c.paciente.nombre) ? c.paciente.nombre : '';
  const email = (c.paciente && c.paciente.email) ? c.paciente.email : '';

  if (cat.startsWith('[BLOQUEO]') || nom.startsWith('[BLOQUEO]')) return 'BLOQUEO';
  if (cat.startsWith('[GRUPAL]') || nom.startsWith('[GRUPAL]') || email.startsWith('grupal-')) return 'GRUPAL';
  if (cat.startsWith('[EVALUACION]') || nom.startsWith('[EVALUACION]')) return 'EVALUACION';
  return 'INDIVIDUAL';
}

function obtenerCitasReportePeriodo() {
  if (!Array.isArray(citasCache)) return [];

  return citasCache.filter(c => {
    // Excluir canceladas a menos que ya se hayan pagado previamente (ingreso real)
    if (c.estado_cita === 'CANCELADA' && c.estado_pago !== 'PAGADO') return false;

    const esBloqueo = (c.categoria && c.categoria.startsWith('[BLOQUEO]')) || (c.paciente && c.paciente.nombre && c.paciente.nombre.startsWith('[BLOQUEO]'));
    if (esBloqueo) return false;

    const d = new Date(c.fechaHora);
    return d.getMonth() === mesReporteSeleccionado && d.getFullYear() === anioReporteSeleccionado;
  }).sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora));
}

function renderReporteMensual() {
  const citasMes = obtenerCitasReportePeriodo();
  const tbody = document.getElementById('reporteTablaBody');

  let totalSesiones = citasMes.length;
  let sesionesConCosto = 0;
  let sesionesCortesia = 0;
  let totalCobrado = 0;
  let totalPorPagar = 0;
  let sumaMontosConCosto = 0;
  let countPendientes = 0;
  let countPagadas = 0;

  citasMes.forEach(c => {
    const tipo = detectarTipoCita(c);
    const monto = typeof c.monto === 'number' ? c.monto : (tipo === 'EVALUACION' ? 4000 : 500);
    if (monto === 0) {
      sesionesCortesia++;
    } else {
      sesionesConCosto++;
      sumaMontosConCosto += monto;
    }

    if (c.estado_pago === 'PAGADO') {
      totalCobrado += monto;
      countPagadas++;
    } else {
      totalPorPagar += monto;
      countPendientes++;
    }
  });

  const tarifaPromedio = sesionesConCosto > 0 ? (sumaMontosConCosto / sesionesConCosto) : 0;

  // Actualizar Tarjetas KPIs
  const kpiCobrado = document.getElementById('kpiTotalCobrado');
  const kpiSubCobrado = document.getElementById('kpiSubCobrado');
  const kpiSesiones = document.getElementById('kpiTotalSesiones');
  const kpiSubSesiones = document.getElementById('kpiSubSesiones');
  const kpiPorCobrar = document.getElementById('kpiTotalPorCobrar');
  const kpiSubPorCobrar = document.getElementById('kpiSubPorCobrar');
  const kpiPromedio = document.getElementById('kpiTarifaPromedio');

  const formatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

  if (kpiCobrado) kpiCobrado.textContent = formatter.format(totalCobrado);
  if (kpiSubCobrado) kpiSubCobrado.textContent = `${countPagadas} sesión${countPagadas === 1 ? '' : 'es'} pagada${countPagadas === 1 ? '' : 's'}`;
  
  if (kpiSesiones) kpiSesiones.textContent = totalSesiones;
  if (kpiSubSesiones) kpiSubSesiones.textContent = `${sesionesConCosto} con costo · ${sesionesCortesia} cortesía ($0)`;

  if (kpiPorCobrar) kpiPorCobrar.textContent = formatter.format(totalPorPagar);
  if (kpiSubPorCobrar) kpiSubPorCobrar.textContent = `${countPendientes} sesión${countPendientes === 1 ? '' : 'es'} pendiente${countPendientes === 1 ? '' : 's'}`;

  if (kpiPromedio) kpiPromedio.textContent = formatter.format(tarifaPromedio);

  if (!tbody) return;

  if (citasMes.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 3rem 1rem; color: #64748b;">
          <i class="fa-solid fa-calendar-xmark" style="font-size: 2rem; color: #cbd5e1; margin-bottom: 0.5rem; display: block;"></i>
          <strong style="color: #334155; font-size: 1rem;">No hay sesiones registradas en este periodo</strong>
          <p style="font-size: 0.85rem; margin: 0.3rem 0 0 0;">Las citas agendadas y realizadas aparecerán automáticamente aquí.</p>
        </td>
      </tr>
    `;
    return;
  }

  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  let html = '';
  citasMes.forEach(c => {
    const d = new Date(c.fechaHora);
    const fechaTxt = `${diasSemana[d.getDay()]} ${d.getDate()} ${meses[d.getMonth()]}`;
    const horaTxt = d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
    const tipo = detectarTipoCita(c);
    const nombre = c.paciente ? c.paciente.nombre.replace(/^\[(BLOQUEO|GRUPAL|EVALUACION)\]\s*/i, '').trim() : 'Paciente';
    const monto = typeof c.monto === 'number' ? c.monto : (tipo === 'EVALUACION' ? 4000 : 500);
    const esPagado = c.estado_pago === 'PAGADO';
    const esCancelada = c.estado_cita === 'CANCELADA';
    const esRealizada = !esCancelada && (c.estado_cita === 'REALIZADA' || c.estado_cita === 'CONFIRMADA');

    let badgeTipoHtml = '';
    if (tipo === 'GRUPAL') {
      badgeTipoHtml = '<span class="badge-servicio-grupal" style="font-size: 0.7rem; font-weight: 800; background: #f3e8ff; color: #6b21a8; padding: 2px 7px; border-radius: 4px; display: inline-flex; align-items: center; gap: 3px;"><i class="fa-solid fa-people-group"></i> Grupal</span>';
    } else if (tipo === 'EVALUACION') {
      badgeTipoHtml = '<span class="badge-servicio-evaluacion" style="font-size: 0.7rem; font-weight: 800; background: #e0e7ff; color: #4338ca; padding: 2px 7px; border-radius: 4px; display: inline-flex; align-items: center; gap: 3px;"><i class="fa-solid fa-brain"></i> Evaluación</span>';
    } else {
      badgeTipoHtml = '<span class="badge-servicio-individual" style="font-size: 0.7rem; font-weight: 700; background: #e0f2fe; color: #0369a1; padding: 2px 7px; border-radius: 4px; display: inline-flex; align-items: center; gap: 3px;"><i class="fa-solid fa-user"></i> Individual</span>';
    }

    html += `
      <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s;">
        <td style="padding: 0.65rem 0.8rem; font-weight: 600; color: #0f172a; white-space: nowrap;">
          <span>${fechaTxt}</span> <span style="font-size: 0.8rem; color: #64748b; font-weight: 500;">· ${horaTxt}</span>
        </td>
        <td style="padding: 0.65rem 0.8rem; font-weight: 600; color: #334155;">
          <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            <span>${escapeHtml(nombre)}</span>
            ${badgeTipoHtml}
          </div>
        </td>
        <td style="padding: 0.65rem 0.8rem; text-align: right; font-weight: 800; color: ${monto === 0 ? '#64748b' : '#0f172a'};">
          ${monto === 0 ? '<span style="background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 4px; font-size: 0.78rem;">$0 Cortesía</span>' : formatter.format(monto)}
        </td>
        <td style="padding: 0.65rem 0.8rem; text-align: center;">
          ${esCancelada
            ? `<span style="font-size: 0.72rem; padding: 2px 7px; border-radius: 4px; background: #fee2e2; color: #991b1b; font-weight: 700;">✕ Cancelada (Pagada)</span>`
            : (esRealizada 
              ? `<span style="font-size: 0.72rem; padding: 2px 7px; border-radius: 4px; background: #dcfce7; color: #15803d; font-weight: 700;">✓ Realizada</span>`
              : `<span style="font-size: 0.72rem; padding: 2px 7px; border-radius: 4px; background: #fef9c3; color: #854d0e; font-weight: 700;">Agendada</span>`
            )
          }
        </td>
        <td style="padding: 0.65rem 0.8rem; text-align: center;">
          <button type="button" onclick="togglePagoDesdeReporte(${c.id})" title="Clic para alternar estado de pago" style="cursor: pointer; border: none; background: none; padding: 0;">
            ${esPagado 
              ? `<span style="font-size: 0.72rem; padding: 3px 8px; border-radius: 4px; background: #dcfce7; color: #166534; font-weight: 700; display: inline-flex; align-items: center; gap: 3px;"><i class="fa-solid fa-circle-check"></i> Pagado</span>`
              : `<span style="font-size: 0.72rem; padding: 3px 8px; border-radius: 4px; background: #fee2e2; color: #991b1b; font-weight: 700; display: inline-flex; align-items: center; gap: 3px;"><i class="fa-solid fa-clock"></i> Por pagar</span>`
            }
          </button>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

window.togglePagoDesdeReporte = async function(id) {
  const cita = citasCache.find(c => c.id === id);
  if (!cita) return;
  const nuevoPago = cita.estado_pago === 'PAGADO' ? 'PENDIENTE' : 'PAGADO';
  await window.cambiarPagoDirecto(id, nuevoPago);
  renderReporteMensual();
};

// Exportador oficial categorizado para la contadora de Laura
window.copiarReporteParaContadora = function() {
  const citasMes = obtenerCitasReportePeriodo();
  const mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const mesNombre = mesesNombres[mesReporteSeleccionado];
  const anio = anioReporteSeleccionado;

  const individualesPorMonto = {};
  let totalSesionesGrupales = 0;
  let totalIngresoGrupal = 0;
  const evaluacionesPorMonto = {};
  let sesionesGratuitas = 0;
  let totalIngresos = 0;

  citasMes.forEach(c => {
    const tipo = detectarTipoCita(c);
    const monto = typeof c.monto === 'number' ? c.monto : (tipo === 'EVALUACION' ? 4000 : 500);
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
};


// Exportador a archivo CSV para Excel con Tipo de Servicio
window.descargarReporteCSV = function() {
  const citasMes = obtenerCitasReportePeriodo();
  const mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const mesNombre = mesesNombres[mesReporteSeleccionado];
  const anio = anioReporteSeleccionado;

  let csvContent = '\uFEFF'; // BOM para que Excel respete caracteres UTF-8 (acentos, ñ)
  csvContent += 'Fecha,Hora,Paciente,Tipo_Servicio,Monto_MXN,Estado_Pago,Estado_Sesion\n';

  citasMes.forEach(c => {
    const d = new Date(c.fechaHora);
    const fecha = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const hora = d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
    const tipo = detectarTipoCita(c);
    const tipoStr = tipo === 'GRUPAL' ? 'Grupal' : (tipo === 'EVALUACION' ? 'Evaluación' : 'Individual');
    const nombre = `"${(c.paciente ? c.paciente.nombre.replace(/^\[(BLOQUEO|GRUPAL|EVALUACION)\]\s*/i, '').trim() : 'Paciente').replace(/"/g, '""')}"`;
    const monto = typeof c.monto === 'number' ? c.monto : (tipo === 'EVALUACION' ? 4000 : 500);
    const estadoPago = c.estado_pago || 'PENDIENTE';
    const estadoSesion = c.estado_cita || 'PENDIENTE';

    csvContent += `${fecha},${hora},${nombre},${tipoStr},${monto},${estadoPago},${estadoSesion}\n`;
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
};

// Impresión y guardado en PDF
window.imprimirReporteMensual = function() {
  document.body.classList.add('printing-reporte-mensual');
  window.print();
  setTimeout(() => {
    document.body.classList.remove('printing-reporte-mensual');
  }, 1000);
};
