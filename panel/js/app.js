// --- Inicializador Principal y Buscador Global de la Suite Clínica ---

// Verificar autenticación e inicializar en la página de la agenda (soporta Clean URLs de Cloudflare)
if (window.location.pathname.includes('agenda') || document.getElementById('easyTableWrapper')) {
  const token = localStorage.getItem('psicolau_token');
  if (!token) {
    window.location.href = 'index.html';
  } else {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        iniciarApp();
      });
    } else {
      iniciarApp();
    }
  }
}

function iniciarApp() {
  renderSwatches();
  actualizarUIFiltroDias();
  cargarNotasConsultorio();
  initAgenda();
}

// Carga principal de citas desde el backend
async function initAgenda() {
  const token = localStorage.getItem('psicolau_token');
  const loader = document.getElementById('loader');
  const wrapper = document.getElementById('easyTableWrapper');
  
  try {
    const response = await fetch(`${API_URL}/agenda/citas`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.status === 401) {
      localStorage.removeItem('psicolau_token');
      window.location.href = 'index.html';
      return;
    }
    
    const data = await response.json();
    if (data.success) {
      citasCache = data.data || [];
      if (loader) loader.style.display = 'none';
      if (wrapper) wrapper.style.display = 'block';
      renderEasyTable();
    }
  } catch (error) {
    console.error('Error al cargar agenda:', error);
    if (loader) loader.innerText = 'Error al cargar la agenda. Verifica tu conexión.';
  }
}

// Buscador global en tiempo real con historial completo y navegación directa
window.filtrarCitasEnTabla = function(query) {
  terminoBusqueda = (query || '').toLowerCase().trim();
  const btnLimpiar = document.getElementById('btnLimpiarBusqueda');
  const panel = document.getElementById('panelResultadosBusqueda');
  
  if (btnLimpiar) {
    btnLimpiar.style.display = terminoBusqueda ? 'block' : 'none';
  }

  // Filtrar en la tabla visible
  renderEasyTable();

  // Si la búsqueda está vacía o es muy corta, ocultar dropdown
  if (!terminoBusqueda || terminoBusqueda.length < 2) {
    if (panel) panel.style.display = 'none';
    return;
  }

  // Buscar en TODO el historial (todas las citas pasadas, presentes y futuras)
  const coincidencias = citasCache.filter(c => {
    const nombre = (c.paciente && c.paciente.nombre ? c.paciente.nombre : '').toLowerCase();
    const tel = (c.paciente && c.paciente.telefono ? c.paciente.telefono : '').toLowerCase();
    const email = (c.paciente && c.paciente.email && !c.paciente.email.startsWith('sin-email-') ? c.paciente.email : '').toLowerCase();
    const notas = (c.categoria || '').toLowerCase();
    return nombre.includes(terminoBusqueda) || tel.includes(terminoBusqueda) || email.includes(terminoBusqueda) || notas.includes(terminoBusqueda);
  });

  // Ordenar por fecha más próxima
  coincidencias.sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora));

  if (panel) {
    panel.style.display = 'block';
    if (coincidencias.length === 0) {
      panel.innerHTML = `<div class="no-results-msg"><i class="fa-solid fa-circle-question" style="margin-right: 4px;"></i> No se encontraron citas con "<strong>${query}</strong>"</div>`;
    } else {
      let html = `<div style="font-size: 0.72rem; font-weight: 700; color: #64748b; padding: 0.3rem 0.5rem 0.5rem; text-transform: uppercase; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between;"><span>Resultados encontrados (${coincidencias.length})</span> <span>Clic para ir a la fecha</span></div>`;
      
      coincidencias.slice(0, 20).forEach(c => {
        const d = new Date(c.fechaHora);
        const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const fechaTxt = `${diasSemana[d.getDay()]} ${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()} — ${d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
        
        const esBloqueo = (c.categoria && c.categoria.startsWith('[BLOQUEO]')) || (c.paciente && c.paciente.nombre.startsWith('[BLOQUEO]'));
        const nombre = c.paciente ? c.paciente.nombre.replace('[BLOQUEO]', '').trim() : 'Sin nombre';
        const notas = (c.categoria || '').replace('[BLOQUEO]', '').trim();
        const color = c.color || '#3EB8CC';
        const esPagado = c.estado_pago === 'PAGADO';
        const esCancelada = c.estado_cita === 'CANCELADA';
        const esCompletada = c.estado_cita === 'REALIZADA' || c.estado_cita === 'CONFIRMADA';

        const clickAccion = esCancelada ? `revisarCitaCancelada(${c.id})` : `irAFechaDeCita('${c.fechaHora}')`;
        const btnTexto = esCancelada 
          ? `<button type="button" class="btn-jump" style="background: #f8fafc; color: #475569; border-color: #cbd5e1;"><span>Ver detalle</span> <i class="fa-solid fa-eye"></i></button>`
          : `<button type="button" class="btn-jump"><span>Ir a cita</span> <i class="fa-solid fa-arrow-right"></i></button>`;

        html += `
          <div class="search-result-item ${esCancelada ? 'is-cancelled' : ''}" onclick="${clickAccion}" title="${esCancelada ? 'Ver detalle de la cita cancelada' : `Ir a la semana del ${fechaTxt}`}">
            <div style="flex: 1; min-width: 0; padding-right: 8px;">
              <div class="item-title">
                <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${esCancelada ? '#94a3b8' : color}; flex-shrink: 0;"></span>
                <span style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap; ${esCancelada ? 'text-decoration: line-through; opacity: 0.75;' : ''}">${esBloqueo ? `<i class="fa-solid fa-ban" style="color: #ef4444;"></i> ${nombre}` : nombre}</span>
                ${esCancelada ? `<span style="font-size: 0.65rem; padding: 1px 5px; border-radius: 4px; background: #fee2e2; color: #b91c1c; font-weight: 700;">✕ Cancelada / Borrada</span>` : ''}
                ${esCompletada && !esBloqueo && !esCancelada ? `<span style="font-size: 0.65rem; padding: 1px 5px; border-radius: 4px; background: #dcfce7; color: #15803d; font-weight: 700;">✓ Realizada</span>` : ''}
                ${!esBloqueo && !esCancelada ? `<span style="font-size: 0.65rem; padding: 1px 5px; border-radius: 4px; background: ${esPagado ? '#dcfce7' : '#ffedd5'}; color: ${esPagado ? '#166534' : '#9a3412'};">${esPagado ? 'Pagado' : 'Por pagar'}</span>` : ''}
              </div>
              <div class="item-meta">
                <i class="fa-solid fa-calendar-day" style="margin-right: 3px; color: var(--turquesa);"></i> ${fechaTxt}
                ${notas ? ` · <span style="color: #334155; font-weight: 500;">${notas}</span>` : ''}
              </div>
            </div>
            ${btnTexto}
          </div>
        `;
      });

      panel.innerHTML = html;
    }
  }
};

// Navegar directamente a la semana donde se encuentra una cita encontrada
window.irAFechaDeCita = function(fechaHoraIso) {
  const targetDate = new Date(fechaHoraIso);
  const hoy = new Date();
  
  const diaSemanaHoy = hoy.getDay();
  const diffHoy = hoy.getDate() - diaSemanaHoy + (diaSemanaHoy === 0 ? -6 : 1);
  const lunesActual = new Date(hoy.getFullYear(), hoy.getMonth(), diffHoy);
  lunesActual.setHours(0, 0, 0, 0);

  const targetDayOfWeek = targetDate.getDay();
  const diffTarget = targetDate.getDate() - targetDayOfWeek + (targetDayOfWeek === 0 ? -6 : 1);
  const lunesTarget = new Date(targetDate.getFullYear(), targetDate.getMonth(), diffTarget);
  lunesTarget.setHours(0, 0, 0, 0);

  const diffTime = lunesTarget.getTime() - lunesActual.getTime();
  const diffWeeks = Math.round(diffTime / (7 * 24 * 60 * 60 * 1000));

  currentWeekOffset = diffWeeks;
  renderEasyTable();

  const panel = document.getElementById('panelResultadosBusqueda');
  if (panel) panel.style.display = 'none';
};

window.limpiarBusqueda = function() {
  const input = document.getElementById('busquedaInput');
  if (input) input.value = '';
  const panel = document.getElementById('panelResultadosBusqueda');
  if (panel) panel.style.display = 'none';
  window.filtrarCitasEnTabla('');
};

// Listeners globales del ciclo de vida
document.addEventListener('DOMContentLoaded', () => {
  // Cerrar sesión
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('psicolau_token');
      window.location.href = 'index.html';
    });
  }

  // Cerrar panel de búsqueda al hacer clic fuera
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-box-wrapper')) {
      const panel = document.getElementById('panelResultadosBusqueda');
      if (panel) panel.style.display = 'none';
    }
  });

  // Manejo del formulario de creación y edición de citas
  const formNuevaCita = document.getElementById('formNuevaCita');
  if (formNuevaCita) {
    formNuevaCita.addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = localStorage.getItem('psicolau_token');
      const btn = formNuevaCita.querySelector('button[type="submit"]');
      const id = document.getElementById('nc_id').value;
      const esEdicion = Boolean(id);

      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

      const fecha = document.getElementById('nc_fecha').value;
      const hora = document.getElementById('nc_hora').value;
      
      const [yyyy, mm, dd] = fecha.split('-').map(Number);
      const [hh, min] = (hora || '07:00').split(':').map(Number);
      const fechaLocal = new Date(yyyy, mm - 1, dd, hh, min, 0);
      const fechaHora = fechaLocal.toISOString();

      let nombre = document.getElementById('nc_nombre').value.trim();
      let notas = document.getElementById('nc_notas').value.trim();

      if (tipoRegistroActual === 'BLOQUEO') {
        nombre = `[BLOQUEO] ${nombre}`;
        notas = `[BLOQUEO] ${notas}`.trim();
      }

      const prefijo = document.getElementById('nc_prefijo')?.value || '';
      const telInput = document.getElementById('nc_telefono')?.value.trim() || '';
      let telefonoFinal = '';
      if (telInput && tipoRegistroActual !== 'BLOQUEO') {
        if (telInput.startsWith('+')) {
          telefonoFinal = telInput;
        } else if (prefijo) {
          telefonoFinal = `${prefijo} ${telInput}`;
        } else {
          telefonoFinal = telInput;
        }
      }

      const data = {
        nombre: nombre,
        email: tipoRegistroActual === 'BLOQUEO' ? '' : document.getElementById('nc_email').value.trim(),
        telefono: telefonoFinal,
        fechaHora: fechaHora,
        categoria: notas,
        notas: notas,
        color: document.getElementById('nc_color').value
      };

      if (!esEdicion && document.getElementById('nc_repetir') && document.getElementById('nc_repetir').checked) {
        data.repeticiones = parseInt(document.getElementById('nc_repeticiones').value) || 1;
        data.frecuencia = document.getElementById('nc_frecuencia').value || 'SEMANAL';
      }

      try {
        const url = esEdicion ? `${API_URL}/agenda/citas/${id}` : `${API_URL}/agenda/citas`;
        const method = esEdicion ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(data)
        });
        const resData = await response.json();
        if (resData.success) {
          window.cerrarModal();
          await initAgenda();
          
          if (data.repeticiones && data.repeticiones > 1) {
            alert(`✅ Se han programado con éxito las ${data.repeticiones} sesiones recurrentes (${data.frecuencia === 'QUINCENAL' ? 'quincenales' : 'semanales'}).`);
          }

          const queryActual = (document.getElementById('busquedaInput')?.value || '').trim();
          if (queryActual) {
            window.filtrarCitasEnTabla(queryActual);
          }
        } else {
          alert(resData.message || 'Error al guardar la cita');
        }
      } catch (err) {
        alert('Error de conexión con el servidor');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-check" style="margin-right: 4px;"></i> Confirmar y Guardar';
      }
    });
  }
});
