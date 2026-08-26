// --- Módulo de Gestión de Pagos, Cuentas Bancarias y Auditoría ---

// --- GESTIÓN DE DATOS DE COBRO Y CUENTAS BANCARIAS ---
window.abrirModalDatosPago = function() {
  const datos = getDatosPago();
  document.getElementById('dp_banco').value = datos.banco || '';
  document.getElementById('dp_titular').value = datos.titular || '';
  document.getElementById('dp_clabe').value = datos.clabe || '';
  document.getElementById('dp_enlace').value = datos.enlace || '';
  document.getElementById('dp_monto').value = datos.monto || '';
  document.getElementById('dp_incluir_recordatorio').checked = Boolean(datos.incluirEnRecordatorio);
  
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
    enlace: document.getElementById('dp_enlace').value.trim(),
    monto: document.getElementById('dp_monto').value.trim(),
    incluirEnRecordatorio: document.getElementById('dp_incluir_recordatorio').checked
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

  // Filtrar citas no canceladas, que no sean bloqueos ni terapias grupales y que tengan estado de pago PENDIENTE
  let pendientes = citasCache.filter(c => {
    if (c.estado_cita === 'CANCELADA') return false;
    if (c.estado_pago === 'PAGADO') return false;
    const esBloqueo = (c.categoria && c.categoria.startsWith('[BLOQUEO]')) || (c.paciente && c.paciente.nombre && c.paciente.nombre.startsWith('[BLOQUEO]'));
    const esGrupal = (c.categoria && c.categoria.startsWith('[GRUPAL]')) || (c.paciente && c.paciente.nombre && c.paciente.nombre.startsWith('[GRUPAL]'));
    return !esBloqueo && !esGrupal;
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
    const nombre = c.paciente ? c.paciente.nombre.replace('[BLOQUEO]', '').trim() : 'Paciente';
    const notas = (c.categoria || '').replace('[BLOQUEO]', '').trim();
    const esCompletada = c.estado_cita === 'REALIZADA' || c.estado_cita === 'CONFIRMADA';

    html += `
      <div class="audit-card">
        <div class="audit-card-info">
          <div class="audit-card-title">
            <span>${nombre}</span>
            ${esCompletada ? `<span style="font-size: 0.65rem; padding: 1px 6px; border-radius: 4px; background: #dcfce7; color: #15803d; font-weight: 700;">✓ Realizada</span>` : `<span style="font-size: 0.65rem; padding: 1px 6px; border-radius: 4px; background: #fef9c3; color: #854d0e; font-weight: 700;">Por realizar</span>`}
          </div>
          <div class="audit-card-meta">
            <span><i class="fa-solid fa-calendar-day" style="color: var(--turquesa); margin-right: 3px;"></i> ${fechaTxt}</span>
            ${notas ? `<span>· <i class="fa-solid fa-tag" style="margin-right: 2px;"></i> ${notas}</span>` : ''}
            ${c.paciente && c.paciente.telefono ? `<span>· <i class="fa-brands fa-whatsapp" style="color: #16a34a; margin-right: 2px;"></i> ${c.paciente.telefono}</span>` : ''}
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
