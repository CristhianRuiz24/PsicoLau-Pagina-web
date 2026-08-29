// --- Inicializador Principal y Buscador Global de la Suite Clínica ---

// Verificar autenticación e inicializar en la página de la agenda (soporta Clean URLs de Cloudflare)
if (window.location.pathname.includes('agenda') || document.getElementById('easyTableWrapper')) {
  const token = localStorage.getItem('psicolau_token');
  if (!token) {
    window.location.href = '/panel/index.html';
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
  if (window.cargarDirectorioEnSegundoPlano) {
    window.cargarDirectorioEnSegundoPlano();
  }
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
      window.location.href = '/panel/index.html';
      return;
    }
    
    const data = await response.json();
    if (data.success) {
      citasCache = data.data || [];
      if (loader) loader.style.display = 'none';
      if (wrapper) wrapper.style.display = 'block';
      if (window.actualizarDatalistPacientes) {
        window.actualizarDatalistPacientes();
      }
      renderEasyTable();
    }
  } catch (error) {
    console.error('Error al cargar agenda:', error);
    if (loader) loader.innerText = 'Error al cargar la agenda. Verifica tu conexión.';
  }
}

// Helper para normalizar cadenas (sin acentos, minúsculas, espacios recortados)
function normalizarTexto(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// Buscador global en tiempo real con historial completo, navegación directa y acceso a Expedientes
window.filtrarCitasEnTabla = function(query) {
  const queryLimpia = (query || '').trim();
  terminoBusqueda = normalizarTexto(queryLimpia);
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

  // 1. Buscar en Directorio de Pacientes / Expedientes (excluyendo estrictamente bloqueos y grupos)
  const pacientesCoincidentes = (window.directorioPacientesCache || []).filter(p => {
    if (!p.nombre) return false;
    const nomUpper = p.nombre.toUpperCase().trim();
    if (nomUpper.startsWith('[BLOQUEO]') || nomUpper.startsWith('[GRUPAL]')) return false;
    const nom = normalizarTexto(p.nombre);
    const tel = normalizarTexto(p.telefono);
    const email = normalizarTexto(p.email && !p.email.startsWith('sin-email-') ? p.email : '');
    return nom.includes(terminoBusqueda) || tel.includes(terminoBusqueda) || email.includes(terminoBusqueda);
  });

  // 2. Buscar en Citas Agendadas (todas las citas pasadas, presentes y futuras)
  const citasCoincidentes = citasCache.filter(c => {
    const nombre = normalizarTexto(c.paciente && c.paciente.nombre ? c.paciente.nombre : '');
    const tel = normalizarTexto(c.paciente && c.paciente.telefono ? c.paciente.telefono : '');
    const email = normalizarTexto(c.paciente && c.paciente.email && !c.paciente.email.startsWith('sin-email-') ? c.paciente.email : '');
    const notas = normalizarTexto(c.categoria || '');
    return nombre.includes(terminoBusqueda) || tel.includes(terminoBusqueda) || email.includes(terminoBusqueda) || notas.includes(terminoBusqueda);
  });

  // Ordenar citas por fecha
  citasCoincidentes.sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora));

  if (panel) {
    panel.style.display = 'block';

    if (pacientesCoincidentes.length === 0 && citasCoincidentes.length === 0) {
      panel.innerHTML = `<div class="no-results-msg"><i class="fa-solid fa-circle-question" style="margin-right: 4px;"></i> No se encontraron pacientes ni citas con "<strong>${queryLimpia}</strong>"</div>`;
      return;
    }

    let html = '';

    // SECCIÓN 1: EXPEDIENTES / PACIENTES COINCIDENTES
    if (pacientesCoincidentes.length > 0) {
      html += `
        <div style="font-size: 0.72rem; font-weight: 800; color: var(--rosa-coral); padding: 0.4rem 0.6rem; text-transform: uppercase; background: #fff1f2; border-bottom: 1px solid #ffe4e6; display: flex; align-items: center; justify-content: space-between; letter-spacing: 0.3px;">
          <span><i class="fa-solid fa-folder-open" style="margin-right: 4px;"></i> Expedientes Clínicos (${pacientesCoincidentes.length})</span>
          <span style="font-size: 0.68rem; color: #9f1239; text-transform: none;">Clic para abrir expediente</span>
        </div>
      `;

      pacientesCoincidentes.forEach(p => {
        const numNotas = p._count ? p._count.expedientes : 0;
        const numCitas = p._count ? p._count.citas : 0;
        html += `
          <div class="search-result-item" onclick="abrirExpedientePorId(${p.id})" title="Abrir expediente clínico de ${p.nombre}">
            <div style="flex: 1; min-width: 0; padding-right: 8px;">
              <div class="item-title">
                <i class="fa-solid fa-user-check" style="color: var(--turquesa); font-size: 0.85rem;"></i>
                <span style="font-weight: 700; color: #0f172a;">${p.nombre}</span>
                <span style="font-size: 0.68rem; padding: 1px 6px; border-radius: 4px; background: #fdf2f8; color: var(--rosa-coral); font-weight: 700; border: 1px solid #fbcfe8;">
                  <i class="fa-solid fa-notes-medical"></i> ${numNotas} ${numNotas === 1 ? 'nota' : 'notas'}
                </span>
              </div>
              <div class="item-meta">
                ${p.telefono ? `<i class="fa-brands fa-whatsapp" style="color: #16a34a; margin-right: 2px;"></i> ${p.telefono} · ` : ''}
                <span><i class="fa-solid fa-calendar-check" style="color: #6366f1; margin-right: 2px;"></i> ${numCitas} citas</span>
              </div>
            </div>
            <button type="button" class="btn-jump" style="background: #fdf2f8; color: var(--rosa-coral); border-color: #fbcfe8;">
              <i class="fa-solid fa-folder-open"></i> <span>Abrir Expediente</span>
            </button>
          </div>
        `;
      });
    }

    // SECCIÓN 2: CITAS AGENDADAS
    if (citasCoincidentes.length > 0) {
      html += `
        <div style="font-size: 0.72rem; font-weight: 800; color: #475569; padding: 0.4rem 0.6rem; text-transform: uppercase; background: #f8fafc; border-bottom: 1px solid #e2e8f0; border-top: ${pacientesCoincidentes.length > 0 ? '1px solid #e2e8f0' : 'none'}; display: flex; align-items: center; justify-content: space-between; letter-spacing: 0.3px;">
          <span><i class="fa-solid fa-calendar-days" style="margin-right: 4px; color: var(--turquesa);"></i> Citas Agendadas (${citasCoincidentes.length})</span>
          <span style="font-size: 0.68rem; color: #64748b; text-transform: none;">Clic para ir a la fecha</span>
        </div>
      `;

      citasCoincidentes.slice(0, 15).forEach(c => {
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
        const btnExpediente = (!esBloqueo && c.paciente && c.paciente.id)
          ? `<button type="button" class="btn-jump" onclick="event.stopPropagation(); abrirExpedientePorId(${c.paciente.id});" style="background: #fdf2f8; color: var(--rosa-coral); border-color: #fbcfe8;" title="Ver expediente clínico de ${nombre}"><i class="fa-solid fa-folder-open"></i></button>`
          : '';

        const btnTexto = esCancelada 
          ? `<button type="button" class="btn-jump" style="background: #f8fafc; color: #475569; border-color: #cbd5e1;"><span>Ver</span> <i class="fa-solid fa-eye"></i></button>`
          : `<button type="button" class="btn-jump"><span>Ir a cita</span> <i class="fa-solid fa-arrow-right"></i></button>`;

        html += `
          <div class="search-result-item ${esCancelada ? 'is-cancelled' : ''}" onclick="${clickAccion}" title="${esCancelada ? 'Ver detalle de la cita cancelada' : `Ir a la semana del ${fechaTxt}`}">
            <div style="flex: 1; min-width: 0; padding-right: 8px;">
              <div class="item-title">
                <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${esCancelada ? '#94a3b8' : color}; flex-shrink: 0;"></span>
                <span style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap; ${esCancelada ? 'text-decoration: line-through; opacity: 0.75;' : ''}">${esBloqueo ? `<i class="fa-solid fa-ban" style="color: #ef4444;"></i> ${escapeHtml(nombre)}` : escapeHtml(nombre)}</span>
                ${esCancelada ? `<span style="font-size: 0.65rem; padding: 1px 5px; border-radius: 4px; background: #fee2e2; color: #b91c1c; font-weight: 700;">✕ Cancelada / Borrada</span>` : ''}
                ${esCompletada && !esBloqueo && !esCancelada ? `<span style="font-size: 0.65rem; padding: 1px 5px; border-radius: 4px; background: #dcfce7; color: #15803d; font-weight: 700;">✓ Realizada</span>` : ''}
                ${!esBloqueo && !esCancelada ? `<span style="font-size: 0.65rem; padding: 1px 5px; border-radius: 4px; background: ${esPagado ? '#dcfce7' : '#ffedd5'}; color: ${esPagado ? '#166534' : '#9a3412'};">${esPagado ? 'Pagado' : 'Por pagar'}</span>` : ''}
              </div>
              <div class="item-meta">
                <i class="fa-solid fa-calendar-day" style="margin-right: 3px; color: var(--turquesa);"></i> ${fechaTxt}
                ${notas ? ` · <span style="color: #334155; font-weight: 500;">${escapeHtml(notas)}</span>` : ''}
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 4px;">
              ${btnExpediente}
              ${btnTexto}
            </div>
          </div>
        `;
      });
    }

    panel.innerHTML = html;
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
      window.location.href = '/panel/index.html';
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

      let tipoEfectivo = tipoRegistroActual;
      if (esEdicion && typeof citasCache !== 'undefined') {
        const citaOriginal = citasCache.find(c => c.id === parseInt(id));
        if (citaOriginal) {
          const eraBloqueo = (citaOriginal.categoria && citaOriginal.categoria.startsWith('[BLOQUEO]')) || (citaOriginal.paciente && citaOriginal.paciente.nombre.startsWith('[BLOQUEO]'));
          const eraGrupal = (citaOriginal.categoria && citaOriginal.categoria.startsWith('[GRUPAL]')) || (citaOriginal.paciente && citaOriginal.paciente.nombre.startsWith('[GRUPAL]'));
          tipoEfectivo = eraBloqueo ? 'BLOQUEO' : (eraGrupal ? 'GRUPAL' : 'CITA');
        }
      }

      let nombre = document.getElementById('nc_nombre').value.trim();
      let notas = document.getElementById('nc_notas').value.trim();

      // Limpiar prefijos antes de asignar estrictamente según el tipo efectivo
      nombre = nombre.replace(/^\[(BLOQUEO|GRUPAL)\]\s*/i, '').trim();
      notas = notas.replace(/^\[(BLOQUEO|GRUPAL)\]\s*/i, '').trim();

      if (tipoEfectivo === 'BLOQUEO') {
        nombre = `[BLOQUEO] ${nombre}`;
        notas = `[BLOQUEO] ${notas}`.trim();
      } else if (tipoEfectivo === 'GRUPAL') {
        nombre = `[GRUPAL] ${nombre}`;
        notas = `[GRUPAL] ${notas}`.trim();
      }

      const prefijo = document.getElementById('nc_prefijo')?.value || '';
      const telInput = document.getElementById('nc_telefono')?.value.trim() || '';
      let telefonoFinal = '';
      if (telInput && tipoEfectivo !== 'BLOQUEO' && tipoEfectivo !== 'GRUPAL') {
        if (telInput.startsWith('+')) {
          telefonoFinal = telInput;
        } else if (prefijo) {
          telefonoFinal = `${prefijo} ${telInput}`;
        } else {
          telefonoFinal = telInput;
        }
      }

      const zoomInput = document.getElementById('nc_enlace_zoom');
      let enlaceZoomVal = (zoomInput && tipoEfectivo !== 'BLOQUEO') ? zoomInput.value.trim() : '';
      if (enlaceZoomVal && !enlaceZoomVal.startsWith('http://') && !enlaceZoomVal.startsWith('https://')) {
        enlaceZoomVal = `https://${enlaceZoomVal}`;
      }

      let emailFinal = '';
      if (tipoEfectivo === 'BLOQUEO') {
        emailFinal = '';
      } else if (tipoEfectivo === 'GRUPAL') {
        emailFinal = `grupal-${Date.now()}@psicolau.com`;
      } else {
        emailFinal = document.getElementById('nc_email').value.trim();
      }

      const montoVal = document.getElementById('nc_monto')?.value;
      let montoFinal = 500;
      if (tipoEfectivo === 'BLOQUEO' || tipoEfectivo === 'GRUPAL') {
        montoFinal = 0;
      } else if (montoVal !== undefined && montoVal !== null && montoVal !== '') {
        const parsed = parseFloat(montoVal);
        if (isNaN(parsed) || parsed < 0) {
          alert('Por favor introduce un monto de tarifa válido (mayor o igual a 0).');
          btn.disabled = false;
          btn.innerHTML = '<i class="fa-solid fa-check" style="margin-right: 4px;"></i> Confirmar y Guardar';
          return;
        }
        montoFinal = parsed;
      }

      const data = {
        nombre: nombre,
        email: emailFinal,
        telefono: telefonoFinal,
        enlaceZoom: enlaceZoomVal,
        fechaHora: fechaHora,
        categoria: notas,
        notas: notas,
        color: document.getElementById('nc_color').value,
        monto: montoFinal
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
          if (data.color && window.guardarColorPersonalizado) {
            window.guardarColorPersonalizado(data.color);
          }
          window.cerrarModal();
          await initAgenda();
          if (window.cargarDirectorioEnSegundoPlano) {
            window.cargarDirectorioEnSegundoPlano();
          }
          
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
