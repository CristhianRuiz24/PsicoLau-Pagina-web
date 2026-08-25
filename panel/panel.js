const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:' || !window.location.hostname)
  ? 'http://localhost:3000/api'
  : (window.PSICOLAU_API_URL || 'https://api.psicolau.com/api');

const PALETA_COLORES = [
  // Rosas y Corales (Marca PsicoLau)
  { nombre: 'Rosa PsicoLau (Oficial)', hex: '#EC5E86' },
  { nombre: 'Fucsia / Rosa Intenso', hex: '#ec4899' },
  { nombre: 'Rosa Pastel', hex: '#f472b6' },
  { nombre: 'Coral Suave', hex: '#fb7185' },
  
  // Turquesas y Azules
  { nombre: 'Turquesa PsicoLau (Oficial)', hex: '#3EB8CC' },
  { nombre: 'Cian / Aguamarina', hex: '#06b6d4' },
  { nombre: 'Azul Cielo Pastel', hex: '#38bdf8' },
  { nombre: 'Azul Eléctrico', hex: '#6366f1' },
  { nombre: 'Azul Marino / Zafiro', hex: '#2563eb' },
  
  // Morados y Lavandas
  { nombre: 'Morado Intenso', hex: '#9333ea' },
  { nombre: 'Lavanda Suave', hex: '#c084fc' },
  { nombre: 'Violeta Real', hex: '#7c3aed' },
  { nombre: 'Orquídea', hex: '#a855f7' },
  
  // Verdes y Mentas
  { nombre: 'Verde Esmeralda', hex: '#10b981' },
  { nombre: 'Verde Menta', hex: '#14b8a6' },
  { nombre: 'Verde Lima', hex: '#84cc16' },
  { nombre: 'Verde Jade', hex: '#059669' },
  
  // Amarillos y Naranjas
  { nombre: 'Amarillo Mostaza', hex: '#eab308' },
  { nombre: 'Ámbar Cálido', hex: '#f59e0b' },
  { nombre: 'Naranja Mandarina', hex: '#f97316' },
  { nombre: 'Terracota', hex: '#ea580c' },
  
  // Neutros y Bloqueos
  { nombre: 'Gris Neutro / Bloqueo', hex: '#94a3b8' },
  { nombre: 'Pizarra / Grafito', hex: '#475569' },
  { nombre: 'Moka / Café Cálido', hex: '#78350f' }
];

let citasCache = [];
let currentWeekOffset = 0;
let filtroDias = parseInt(localStorage.getItem('psicolau_filtro_dias')) || 7;
let terminoBusqueda = '';
let tipoRegistroActual = 'CITA'; // 'CITA' | 'BLOQUEO'

// Verificar autenticación en páginas privadas
if (window.location.pathname.includes('agenda.html')) {
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

// Cerrar sesión
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('psicolau_token');
    window.location.href = 'index.html';
  });
}

// --- Carga y Renderizado de Agenda ---

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

// Navegación entre semanas
window.cambiarSemana = function(offset) {
  currentWeekOffset += offset;
  renderEasyTable();
};

window.irHoy = function() {
  currentWeekOffset = 0;
  renderEasyTable();
};

// Filtro de días (5 vs 7 días)
window.setFiltroDias = function(dias) {
  filtroDias = dias;
  localStorage.setItem('psicolau_filtro_dias', dias);
  actualizarUIFiltroDias();
  renderEasyTable();
};

function actualizarUIFiltroDias() {
  const btn5 = document.getElementById('btnFiltro5');
  const btn7 = document.getElementById('btnFiltro7');
  if (btn5 && btn7) {
    btn5.classList.toggle('active', filtroDias === 5);
    btn7.classList.toggle('active', filtroDias === 7);
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
        const esCompletada = c.estado_cita === 'CONFIRMADA';

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
  
  // Encontrar el lunes de la semana de hoy (offset 0)
  const diaSemanaHoy = hoy.getDay();
  const diffHoy = hoy.getDate() - diaSemanaHoy + (diaSemanaHoy === 0 ? -6 : 1);
  const lunesActual = new Date(hoy.getFullYear(), hoy.getMonth(), diffHoy);
  lunesActual.setHours(0, 0, 0, 0);

  // Encontrar el lunes de la semana de la fecha de la cita
  const targetDayOfWeek = targetDate.getDay();
  const diffTarget = targetDate.getDate() - targetDayOfWeek + (targetDayOfWeek === 0 ? -6 : 1);
  const lunesTarget = new Date(targetDate.getFullYear(), targetDate.getMonth(), diffTarget);
  lunesTarget.setHours(0, 0, 0, 0);

  // Calcular diferencia exacta en semanas
  const diffTime = lunesTarget.getTime() - lunesActual.getTime();
  const diffWeeks = Math.round(diffTime / (7 * 24 * 60 * 60 * 1000));

  currentWeekOffset = diffWeeks;
  renderEasyTable();

  // Cerrar panel de búsqueda
  const panel = document.getElementById('panelResultadosBusqueda');
  if (panel) panel.style.display = 'none';
};

// Cerrar panel de búsqueda al hacer clic fuera
document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-box-wrapper')) {
    const panel = document.getElementById('panelResultadosBusqueda');
    if (panel) panel.style.display = 'none';
  }
});

window.limpiarBusqueda = function() {
  const input = document.getElementById('busquedaInput');
  if (input) input.value = '';
  const panel = document.getElementById('panelResultadosBusqueda');
  if (panel) panel.style.display = 'none';
  window.filtrarCitasEnTabla('');
};

// Impresión de agenda semanal
window.imprimirAgenda = function() {
  window.print();
};

// Bloc de Notas del consultorio
window.toggleNotasSemana = function() {
  const modal = document.getElementById('modalNotasSemana');
  if (modal) {
    modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
  }
};

function cargarNotasConsultorio() {
  const guardado = localStorage.getItem('psicolau_notas_semana') || '';
  const textarea = document.getElementById('textoNotasConsultorio');
  if (textarea) textarea.value = guardado;
}

window.guardarNotasConsultorio = function(texto) {
  localStorage.setItem('psicolau_notas_semana', texto);
  const label = document.getElementById('labelNotasGuardadas');
  if (label) {
    label.innerHTML = '<i class="fa-solid fa-check"></i> Guardado';
    setTimeout(() => {
      label.innerHTML = '<i class="fa-solid fa-check"></i> Guardado automáticamente';
    }, 1500);
  }
};

// Helper para separar prefijo internacional y número telefónico
function parsearTelefono(telCompleto) {
  if (!telCompleto) return { prefijo: '+52', numero: '' };
  const str = telCompleto.trim();
  const prefijosConocidos = [
    '+593', '+502', '+506', '+503', '+504', '+505', '+507', '+598',
    '+52', '+57', '+54', '+56', '+51', '+58', '+49', '+33', '+44', '+39', '+41', '+34', '+1'
  ];

  for (const p of prefijosConocidos) {
    if (str.startsWith(p)) {
      return { prefijo: p, numero: str.substring(p.length).trim() };
    }
  }

  if (str.startsWith('+')) {
    const partes = str.split(' ');
    if (partes.length > 1) {
      return { prefijo: '', numero: str };
    }
    return { prefijo: '', numero: str };
  }

  // Si no tiene '+' y tiene 10 dígitos, asumir México (+52) por defecto
  return { prefijo: '+52', numero: str };
}

// Actualizar placeholder y comportamiento al cambiar el prefijo de país
window.actualizarPlaceholderTelefono = function(prefijo) {
  const telInput = document.getElementById('nc_telefono');
  if (!telInput) return;
  if (!prefijo) {
    telInput.placeholder = '+[Código] [Número] (ej: +55 11 99999-9999)';
    if (!telInput.value.startsWith('+')) {
      telInput.value = '+';
      telInput.focus();
    }
  } else {
    telInput.placeholder = 'Número de WhatsApp';
    if (telInput.value === '+') {
      telInput.value = '';
    }
  }
};

// --- GESTIÓN DE DATOS DE COBRO Y CUENTAS BANCARIAS ---
function getDatosPago() {
  try {
    const data = localStorage.getItem('psicolau_datos_pago');
    return data ? JSON.parse(data) : {
      banco: '',
      titular: '',
      clabe: '',
      enlace: '',
      monto: '',
      incluirEnRecordatorio: false
    };
  } catch (e) {
    return { banco: '', titular: '', clabe: '', enlace: '', monto: '', incluirEnRecordatorio: false };
  }
}

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
let filtroAuditoriaActual = 'SEMANA';

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
    const nombre = c.paciente ? c.paciente.nombre.replace('[BLOQUEO]', '').trim() : 'Paciente';
    const notas = (c.categoria || '').replace('[BLOQUEO]', '').trim();
    const esCompletada = c.estado_cita === 'CONFIRMADA';

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

// Envío directo de recordatorio de cobro / solicitud de comprobante por WhatsApp
window.enviarWhatsAppCobro = function(id, e) {
  if (e) e.stopPropagation();
  const cita = citasCache.find(c => c.id === id);
  if (!cita) return;

  let telRaw = (cita.paciente.telefono || '').trim();
  if (!telRaw) {
    telRaw = prompt(`Ingresa el número de WhatsApp para ${cita.paciente.nombre} (con prefijo internacional, ej: +52 para México, +1 para USA, +34 para España):`, '+52 ');
    if (!telRaw) return;
  }

  let telLimpio = telRaw.replace(/\D/g, '');
  if (telLimpio.length === 10 && !telRaw.startsWith('+')) {
    telLimpio = '52' + telLimpio;
  }

  const d = new Date(cita.fechaHora);
  const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  
  const diaTexto = diasSemana[d.getDay()];
  const diaNum = d.getDate();
  const mesTexto = meses[d.getMonth()];
  const horaTexto = d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
  const nombrePaciente = cita.paciente ? cita.paciente.nombre.replace('[BLOQUEO]', '').trim() : 'Paciente';

  const datosPago = getDatosPago();
  let bloqueDatos = '';
  if (datosPago.banco || datosPago.clabe || datosPago.titular || datosPago.monto) {
    bloqueDatos += '\n\n*Datos de transferencia:*';
    if (datosPago.banco) bloqueDatos += `\n• *Banco:* ${datosPago.banco}`;
    if (datosPago.clabe) bloqueDatos += `\n• *CLABE:* ${datosPago.clabe}`;
    if (datosPago.titular) bloqueDatos += `\n• *Titular:* ${datosPago.titular}`;
    if (datosPago.monto) bloqueDatos += `\n• *Cuota:* ${datosPago.monto}`;
  }
  if (datosPago.enlace) {
    bloqueDatos += `\n• *Pago internacional (PayPal/Tarjeta):* ${datosPago.enlace}`;
  }

  if (!bloqueDatos) {
    bloqueDatos = '\n\n*(Recuerda ingresar a "Datos de Cobro" en el panel para configurar tus datos bancarios automáticos)*';
  }

  const mensaje = encodeURIComponent(`Hola ${nombrePaciente}, te saludo con gusto. Te comparto este mensaje respecto a tu sesión de terapia del ${diaTexto} ${diaNum} de ${mesTexto} a las ${horaTexto}.\n\nPara confirmar y mantener al día tu registro de sesiones, te dejo los datos para tu aportación:${bloqueDatos}\n\nUna vez realizado, te agradecería mucho compartirme tu comprobante por este medio. Si ya lo enviaste, haz caso omiso a este mensaje. ¡Muchas gracias!\n\n- PsicoLau (Laura Gómez)`);

  window.open(`https://wa.me/${telLimpio}?text=${mensaje}`, '_blank');
};

// Envío directo de recordatorio por WhatsApp con soporte para pacientes internacionales
window.enviarWhatsAppRecordatorio = function(id, e) {
  if (e) e.stopPropagation();
  const cita = citasCache.find(c => c.id === id);
  if (!cita) return;

  let telRaw = (cita.paciente.telefono || '').trim();
  
  if (!telRaw) {
    telRaw = prompt(`Ingresa el número de WhatsApp para ${cita.paciente.nombre} (con prefijo internacional, ej: +52 para México, +1 para USA, +34 para España):`, '+52 ');
    if (!telRaw) return;
  }

  let telLimpio = telRaw.replace(/\D/g, '');
  
  // Si ingresó 10 dígitos y no colocó prefijo explícito con '+', asumir México (+52)
  if (telLimpio.length === 10 && !telRaw.startsWith('+')) {
    telLimpio = '52' + telLimpio;
  }

  const d = new Date(cita.fechaHora);
  const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  
  const diaTexto = diasSemana[d.getDay()];
  const diaNum = d.getDate();
  const mesTexto = meses[d.getMonth()];
  const horaTexto = d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });

  const nombrePaciente = cita.paciente ? cita.paciente.nombre.replace('[BLOQUEO]', '').trim() : 'Paciente';
  
  const datosPago = getDatosPago();
  let bloquePagoRecordatorio = '';
  if (datosPago.incluirEnRecordatorio && (datosPago.banco || datosPago.clabe || datosPago.enlace)) {
    bloquePagoRecordatorio += '\n\n*Datos para tu aportación:*';
    if (datosPago.banco) bloquePagoRecordatorio += `\n• *Banco:* ${datosPago.banco}`;
    if (datosPago.clabe) bloquePagoRecordatorio += `\n• *CLABE:* ${datosPago.clabe}`;
    if (datosPago.titular) bloquePagoRecordatorio += `\n• *Titular:* ${datosPago.titular}`;
    if (datosPago.enlace) bloquePagoRecordatorio += `\n• *Pago internacional:* ${datosPago.enlace}`;
    bloquePagoRecordatorio += '\n_Te agradeceré mucho compartirme tu comprobante previo a la sesión._';
  }

  const mensaje = encodeURIComponent(`Hola ${nombrePaciente}, te recuerdo con gusto nuestra sesión de terapia agendada para este ${diaTexto} ${diaNum} de ${mesTexto} a las ${horaTexto}.${bloquePagoRecordatorio}\n\nNos vemos pronto.\n\n- PsicoLau (Laura Gómez)`);

  window.open(`https://wa.me/${telLimpio}?text=${mensaje}`, '_blank');
};

// Obtener el siguiente color de la paleta que no se haya usado aún (o el menos usado)
function obtenerSiguienteColorDisponible() {
  // Colores clínicos disponibles para pacientes (excluyendo tonos de bloqueo/neutros)
  const coloresDisponibles = PALETA_COLORES
    .map(c => c.hex)
    .filter(hex => hex.toLowerCase() !== '#94a3b8' && hex.toLowerCase() !== '#475569' && hex.toLowerCase() !== '#78350f');

  // Contar frecuencias de uso de cada color en las citas activas de la base de datos
  const frecuencias = {};
  coloresDisponibles.forEach(hex => {
    frecuencias[hex.toLowerCase()] = 0;
  });

  citasCache.forEach(cita => {
    if (cita.estado_cita !== 'CANCELADA' && cita.color) {
      const hex = cita.color.toLowerCase();
      if (frecuencias[hex] !== undefined) {
        frecuencias[hex]++;
      }
    }
  });

  // 1. Prioridad: Buscar un color que tenga 0 usos
  const noUsado = coloresDisponibles.find(hex => frecuencias[hex.toLowerCase()] === 0);
  if (noUsado) {
    return noUsado;
  }

  // 2. Si todos ya se usaron al menos una vez, elegir el que tenga menor frecuencia
  let menorFrecuencia = Infinity;
  let colorMenosUsado = coloresDisponibles[0];

  for (const hex of coloresDisponibles) {
    const freq = frecuencias[hex.toLowerCase()] || 0;
    if (freq < menorFrecuencia) {
      menorFrecuencia = freq;
      colorMenosUsado = hex;
    }
  }

  return colorMenosUsado;
}

// Recordar color por paciente
window.autoDetectarColorPaciente = function(nombre) {
  if (!nombre || tipoRegistroActual === 'BLOQUEO') return;
  const nombreLimpio = nombre.toLowerCase().trim();
  if (nombreLimpio.length < 3) return;

  const previa = citasCache.find(c => c.paciente && c.paciente.nombre.toLowerCase().trim() === nombreLimpio && c.color);
  if (previa && previa.color) {
    document.getElementById('nc_color').value = previa.color;
    renderSwatches(previa.color);
  }
};

// Renderizado principal de la tabla semanal
function renderEasyTable() {
  const thead = document.getElementById('easyTableHead');
  const tbody = document.getElementById('easyTableBody');
  const rangoEl = document.getElementById('rangoSemana');
  const printRangoEl = document.getElementById('printRangoSemana');
  if (!thead || !tbody) return;

  // Calcular el lunes de la semana visible
  const hoy = new Date();
  const diaSemanaHoy = hoy.getDay(); // 0 = Dom, 1 = Lun
  const diffHoy = hoy.getDate() - diaSemanaHoy + (diaSemanaHoy === 0 ? -6 : 1);
  const lunes = new Date(hoy.getFullYear(), hoy.getMonth(), diffHoy + (currentWeekOffset * 7));

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
    const esBloqueo = (c.categoria && c.categoria.startsWith('[BLOQUEO]')) || (c.paciente && c.paciente.nombre.startsWith('[BLOQUEO]'));
    if (!esBloqueo) {
      countTotal++;
      if (c.estado_pago === 'PAGADO') {
        countPagadas++;
      } else {
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

  // Franjas horarias completas de 07:00 a.m. hasta 11:00 p.m. / 12:00 a.m.
  const horasSlots = [
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

  let tbodyHtml = '';
  horasSlots.forEach(slot => {
    tbodyHtml += `<tr><td class="time-col">${slot.label}</td>`;

    diasSemana.forEach(d => {
      // Filtrar citas para esta celda [día, hora] excluyendo canceladas
      const citasCelda = citasCache.filter(c => {
        if (c.estado_cita === 'CANCELADA') return false;
        const cDate = new Date(c.fechaHora);
        return cDate.toDateString() === d.toDateString() && cDate.getHours() === slot.hora;
      });

      if (citasCelda.length > 0) {
        // Ordenar por hora/minuto
        citasCelda.sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora));

        tbodyHtml += `<td class="slot-cell" style="padding: 2px;"><div class="cell-appointments-container">`;
        citasCelda.forEach(cita => {
          const cDate = new Date(cita.fechaHora);
          const cTime = cDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
          const color = cita.color || '#3EB8CC';
          const textColor = getContrastColor(color);
          const esPagado = cita.estado_pago === 'PAGADO';
          const payLabel = esPagado ? 'Pagado' : 'Por Pagar';
          const payClass = esPagado ? 'paid' : 'unpaid';

          const esBloqueo = (cita.categoria && cita.categoria.startsWith('[BLOQUEO]')) || (cita.paciente && cita.paciente.nombre.startsWith('[BLOQUEO]'));
          const nombreLimpio = cita.paciente.nombre.replace('[BLOQUEO]', '').trim();
          const notasLimpias = (cita.categoria || '').replace('[BLOQUEO]', '').trim();
          const esCompletada = cita.estado_cita === 'CONFIRMADA';

          // Lógica de filtrado de búsqueda
          let matchesBusqueda = true;
          let blockClass = esBloqueo ? 'appointment-block is-blocked' : (esCompletada ? 'appointment-block is-completed' : 'appointment-block');

          if (terminoBusqueda) {
            const textoCompleto = `${nombreLimpio} ${notasLimpias} ${cita.paciente.telefono || ''}`.toLowerCase();
            matchesBusqueda = textoCompleto.includes(terminoBusqueda);
            if (matchesBusqueda) {
              blockClass += ' is-highlighted';
            } else {
              blockClass += ' is-dimmed';
            }
          }

          tbodyHtml += `
            <div id="cita-block-${cita.id}" class="${blockClass}" style="background-color: ${color}; color: ${textColor};" onclick="event.stopPropagation()">
              <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 2px;">
                <span class="time-badge">${cTime}</span>
                <div class="card-actions-capsule">
                  ${!esBloqueo ? `
                    <button type="button" class="btn-check-completada ${esCompletada ? 'completed' : 'pending'}" onclick="toggleCompletarCita(${cita.id}, event)" title="${esCompletada ? 'Sesión realizada (clic para desmarcar)' : 'Marcar sesión como realizada / completada'}">
                      <i class="${esCompletada ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'}"></i>
                    </button>
                    <button type="button" class="card-btn" onclick="enviarWhatsAppRecordatorio(${cita.id}, event)" title="Recordatorio de cita por WhatsApp" style="color: #16a34a;">
                      <i class="fa-brands fa-whatsapp"></i>
                    </button>
                    ${!esPagado ? `
                      <button type="button" class="card-btn" onclick="enviarWhatsAppCobro(${cita.id}, event)" title="Recordar pago y enviar datos bancarios por WhatsApp" style="color: #ea580c;">
                        <i class="fa-solid fa-file-invoice-dollar"></i>
                      </button>
                    ` : ''}
                  ` : ''}
                  <button type="button" class="card-btn" onclick="editarCita(${cita.id})" style="color: #334155;" title="Editar cita">
                    <i class="fa-solid fa-pen"></i>
                  </button>
                  <button type="button" class="card-btn" onclick="eliminarCita(${cita.id})" style="color: #dc2626;" title="Eliminar cita">
                    <i class="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              </div>

              <div class="patient-name">${esBloqueo ? `<i class="fa-solid fa-ban" style="margin-right: 3px;"></i>${nombreLimpio}` : nombreLimpio}</div>
              ${notasLimpias ? `<div class="appointment-note">${notasLimpias}</div>` : ''}
              ${esCompletada && !esBloqueo ? `<div class="badge-completada"><i class="fa-solid fa-check"></i> Realizada</div>` : ''}
              
              ${!esBloqueo ? `
                <div style="margin-top: 4px;">
                  <button type="button" class="mini-pay-btn ${payClass}" onclick="togglePagoDirecto(${cita.id}, event)" title="Clic para alternar estado de pago">
                    <i class="fa-solid ${esPagado ? 'fa-circle-check' : 'fa-clock'}"></i> ${payLabel}
                  </button>
                </div>
              ` : ''}
            </div>
          `;
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

// Reproducción de sonido armónico y satisfactorio usando Web Audio API nativa
function reproducirSonidoCompletada() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const t = ctx.currentTime;

    // Nota 1: Mi agudo (E5 - 659.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, t);
    gain1.gain.setValueAtTime(0.18, t);
    gain1.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.3);

    // Nota 2: Si brillante (B5 - 987.77 Hz - armónico de campana)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(987.77, t + 0.08);
    gain2.gain.setValueAtTime(0.24, t + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t + 0.08);
    osc2.stop(t + 0.55);
  } catch (err) {
    console.warn('Audio no disponible:', err);
  }
}

// Alternar estado de Cita Realizada / Completada
window.toggleCompletarCita = async function(id, e) {
  if (e) e.stopPropagation();
  const cita = citasCache.find(c => c.id === id);
  if (!cita) return;

  const nuevoEstado = cita.estado_cita === 'CONFIRMADA' ? 'PENDIENTE' : 'CONFIRMADA';
  const esMarcarComoHecha = nuevoEstado === 'CONFIRMADA';

  if (esMarcarComoHecha) {
    reproducirSonidoCompletada();
    const blockEl = document.getElementById(`cita-block-${id}`);
    if (blockEl) {
      blockEl.classList.remove('anim-pop-complete');
      void blockEl.offsetWidth; // Reflow para reiniciar la animación
      blockEl.classList.add('anim-pop-complete');
    }
  }

  const token = localStorage.getItem('psicolau_token');
  try {
    const res = await fetch(`${API_URL}/agenda/citas/${id}/estado`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ estado_cita: nuevoEstado })
    });
    const data = await res.json();
    if (data.success) {
      cita.estado_cita = nuevoEstado;
      renderEasyTable();

      if (esMarcarComoHecha) {
        setTimeout(() => {
          const newBlock = document.getElementById(`cita-block-${id}`);
          if (newBlock) {
            newBlock.classList.add('anim-pop-complete');
          }
        }, 30);
      }
    }
  } catch (error) {
    console.error('Error al actualizar estado:', error);
  }
};

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

// Abrir modal con fecha y hora de la celda pulsada
window.agendarEnCelda = function(fecha, hora) {
  window.abrirModal();
  document.getElementById('nc_fecha').value = fecha;
  document.getElementById('nc_hora').value = hora;
};

// Cálculo de contraste de texto
function getContrastColor(hexColor) {
  if (!hexColor) return '#ffffff';
  let hex = hexColor.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 145 ? '#0f172a' : '#ffffff';
}

// Renderizado de paleta de colores en el Modal
function renderSwatches(colorSeleccionado = '#3EB8CC') {
  const container = document.getElementById('swatchesContainer');
  if (!container) return;
  container.innerHTML = '';

  let esColorDePaleta = false;

  PALETA_COLORES.forEach(c => {
    const swatch = document.createElement('div');
    const esActivo = c.hex.toLowerCase() === colorSeleccionado.toLowerCase();
    if (esActivo) esColorDePaleta = true;

    swatch.className = `color-swatch ${esActivo ? 'active' : ''}`;
    swatch.style.backgroundColor = c.hex;
    swatch.title = `${c.nombre} (${c.hex})`;

    swatch.onclick = () => {
      document.querySelectorAll('.color-swatch, .color-swatch-custom').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      document.getElementById('nc_color').value = c.hex;
      if (customPicker) customPicker.value = c.hex;
    };
    container.appendChild(swatch);
  });

  // Selector de Color Personalizado (Gotero / Paleta Libre)
  const customWrapper = document.createElement('div');
  customWrapper.className = `color-swatch-custom ${!esColorDePaleta ? 'active' : ''}`;
  customWrapper.title = 'Elegir color personalizado...';

  const customPicker = document.createElement('input');
  customPicker.type = 'color';
  customPicker.id = 'customColorPicker';
  customPicker.value = colorSeleccionado.startsWith('#') ? colorSeleccionado : '#3EB8CC';
  customPicker.className = 'custom-color-input';

  const iconPalette = document.createElement('i');
  iconPalette.className = 'fa-solid fa-eye-dropper';

  customWrapper.appendChild(customPicker);
  customWrapper.appendChild(iconPalette);

  customPicker.oninput = (e) => {
    const customHex = e.target.value;
    document.querySelectorAll('.color-swatch, .color-swatch-custom').forEach(s => s.classList.remove('active'));
    customWrapper.classList.add('active');
    document.getElementById('nc_color').value = customHex;
  };

  container.appendChild(customWrapper);
}

// --- Manejo del Modal de Nueva / Editar Cita ---

function mostrarModalDirecto() {
  const modal = document.getElementById('modalNuevaCita');
  if (modal) modal.style.display = 'flex';
}

window.seleccionarTipoRegistro = function(tipo) {
  tipoRegistroActual = tipo;
  const tabCita = document.getElementById('tabTipoCita');
  const tabBloqueo = document.getElementById('tabTipoBloqueo');
  const camposContacto = document.getElementById('camposContactoPaciente');
  const seccionRecurrencia = document.getElementById('seccionRecurrencia');
  const lblNombre = document.getElementById('lblNombre');
  const inputNombre = document.getElementById('nc_nombre');

  if (tipo === 'BLOQUEO') {
    tabCita.classList.remove('active');
    tabBloqueo.classList.add('active');
    if (camposContacto) camposContacto.style.display = 'none';
    if (seccionRecurrencia) seccionRecurrencia.style.display = 'none';
    if (lblNombre) lblNombre.innerHTML = '<i class="fa-solid fa-ban" style="color: #ef4444; margin-right: 4px;"></i> Motivo del Bloqueo / Horario No Disponible *';
    if (inputNombre) inputNombre.placeholder = 'Ej: Comida, Supervisión, Asunto personal...';
    document.getElementById('nc_color').value = '#94a3b8';
    renderSwatches('#94a3b8');
  } else {
    tabBloqueo.classList.remove('active');
    tabCita.classList.add('active');
    if (camposContacto) camposContacto.style.display = 'grid';
    if (seccionRecurrencia) seccionRecurrencia.style.display = 'block';
    if (lblNombre) lblNombre.innerHTML = '<i class="fa-solid fa-user" style="color: var(--turquesa); margin-right: 4px;"></i> Nombre del paciente / Asunto *';
    if (inputNombre) inputNombre.placeholder = 'Ej: Mariana López, Carlos Ruiz...';
    
    // Si es una nueva cita (no edición), pre-seleccionar un color que no se haya usado
    const idInput = document.getElementById('nc_id');
    if (!idInput || !idInput.value) {
      const colorNuevo = obtenerSiguienteColorDisponible();
      document.getElementById('nc_color').value = colorNuevo;
      renderSwatches(colorNuevo);
    } else {
      const colorExistente = document.getElementById('nc_color').value || '#3EB8CC';
      renderSwatches(colorExistente);
    }
  }
};

window.toggleOpcionesRecurrencia = function(checked) {
  const detalle = document.getElementById('opcionesRecurrenciaDetalle');
  if (detalle) detalle.style.display = checked ? 'block' : 'none';
};

// Configurar estado del modal (Editable vs Solo Lectura para Citas Canceladas)
function setModoFormulario(modo) {
  const campos = ['nc_nombre', 'nc_email', 'nc_telefono', 'nc_fecha', 'nc_hora', 'nc_notas'];
  const tabs = document.getElementById('seccionTabsTipo');
  const seccionRec = document.getElementById('seccionRecurrencia');
  const seccionColor = document.getElementById('seccionColorBloque');
  const camposContacto = document.getElementById('camposContactoPaciente');
  const prefijoEl = document.getElementById('nc_prefijo');

  if (modo === 'READONLY_CANCELADA') {
    if (tabs) tabs.style.display = 'none';
    if (seccionRec) seccionRec.style.display = 'none';
    if (seccionColor) seccionColor.style.display = 'none';
    if (camposContacto) camposContacto.style.display = 'grid';
    if (prefijoEl) {
      prefijoEl.disabled = true;
      prefijoEl.style.backgroundColor = '#f8fafc';
    }

    campos.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.readOnly = true;
        el.style.backgroundColor = '#f8fafc';
        el.style.borderColor = '#e2e8f0';
        el.style.color = '#334155';
        el.style.cursor = 'default';
      }
    });
  } else {
    if (tabs) tabs.style.display = 'flex';
    if (seccionColor) seccionColor.style.display = 'block';
    if (prefijoEl) {
      prefijoEl.disabled = false;
      prefijoEl.style.backgroundColor = '#f8fafc';
    }

    campos.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.readOnly = false;
        el.style.backgroundColor = '';
        el.style.borderColor = '';
        el.style.color = '';
        el.style.cursor = '';
      }
    });
  }
}

window.abrirModal = function() {
  const form = document.getElementById('formNuevaCita');
  if (form) form.reset();

  setModoFormulario('EDITABLE');

  const prefijoEl = document.getElementById('nc_prefijo');
  if (prefijoEl) prefijoEl.value = '+52';

  const idInput = document.getElementById('nc_id');
  if (idInput) idInput.value = '';

  const titulo = document.getElementById('modalTitulo');
  if (titulo) titulo.innerHTML = '<i class="fa-solid fa-calendar-plus"></i> <span>Agendar Cita</span>';

  const subtitulo = document.getElementById('modalSubtitulo');
  if (subtitulo) subtitulo.style.display = 'none';

  const editExtra = document.getElementById('editExtraActions');
  if (editExtra) editExtra.style.display = 'none';

  const footer = document.getElementById('modalFooterActions');
  if (footer) {
    footer.innerHTML = `
      <button type="submit" id="btnGuardarModal" class="btn" style="flex: 1.5;"><i class="fa-solid fa-check" style="margin-right: 4px;"></i> Confirmar y Guardar</button>
      <button type="button" id="btnCancelarModal" class="btn" style="flex: 1; background: var(--gris-calido);" onclick="cerrarModal()">Cancelar</button>
    `;
  }

  const seccionRec = document.getElementById('seccionRecurrencia');
  if (seccionRec) seccionRec.style.display = 'block';

  const checkRepetir = document.getElementById('nc_repetir');
  if (checkRepetir) checkRepetir.checked = false;
  window.toggleOpcionesRecurrencia(false);

  window.seleccionarTipoRegistro('CITA');

  mostrarModalDirecto();
};

window.cerrarModal = function() {
  const modal = document.getElementById('modalNuevaCita');
  if (modal) modal.style.display = 'none';

  const form = document.getElementById('formNuevaCita');
  if (form) form.reset();

  setModoFormulario('EDITABLE');

  const idInput = document.getElementById('nc_id');
  if (idInput) idInput.value = '';

  const titulo = document.getElementById('modalTitulo');
  if (titulo) titulo.innerHTML = '<i class="fa-solid fa-calendar-plus"></i> <span>Agendar Cita</span>';

  const subtitulo = document.getElementById('modalSubtitulo');
  if (subtitulo) subtitulo.style.display = 'none';

  const editExtra = document.getElementById('editExtraActions');
  if (editExtra) {
    editExtra.style.display = 'none';
    editExtra.innerHTML = `
      <button type="button" id="btnEliminarModal" style="background: none; border: none; color: #dc2626; font-size: 0.88rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
        <i class="fa-solid fa-trash-can"></i> Eliminar esta cita
      </button>
    `;
  }

  const footer = document.getElementById('modalFooterActions');
  if (footer) {
    footer.innerHTML = `
      <button type="submit" id="btnGuardarModal" class="btn" style="flex: 1.5;"><i class="fa-solid fa-check" style="margin-right: 4px;"></i> Confirmar y Guardar</button>
      <button type="button" id="btnCancelarModal" class="btn" style="flex: 1; background: var(--gris-calido);" onclick="cerrarModal()">Cancelar</button>
    `;
  }

  const seccionRec = document.getElementById('seccionRecurrencia');
  if (seccionRec) seccionRec.style.display = 'block';

  const checkRepetir = document.getElementById('nc_repetir');
  if (checkRepetir) checkRepetir.checked = false;
  window.toggleOpcionesRecurrencia(false);

  window.seleccionarTipoRegistro('CITA');
};

// Cargar datos de cita para edición
window.editarCita = function(id) {
  const cita = citasCache.find(c => c.id === id);
  if (!cita) return;

  setModoFormulario('EDITABLE');

  const idInput = document.getElementById('nc_id');
  if (idInput) idInput.value = cita.id;

  const titulo = document.getElementById('modalTitulo');
  if (titulo) titulo.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> <span>Editar Cita</span>';

  const subtitulo = document.getElementById('modalSubtitulo');
  if (subtitulo) subtitulo.style.display = 'none';

  const footer = document.getElementById('modalFooterActions');
  if (footer) {
    footer.innerHTML = `
      <button type="submit" id="btnGuardarModal" class="btn" style="flex: 1.5;"><i class="fa-solid fa-check" style="margin-right: 4px;"></i> Guardar Cambios</button>
      <button type="button" id="btnCancelarModal" class="btn" style="flex: 1; background: var(--gris-calido);" onclick="cerrarModal()">Cancelar</button>
    `;
  }

  const esBloqueo = (cita.categoria && cita.categoria.startsWith('[BLOQUEO]')) || (cita.paciente && cita.paciente.nombre.startsWith('[BLOQUEO]'));
  
  if (esBloqueo) {
    window.seleccionarTipoRegistro('BLOQUEO');
  } else {
    window.seleccionarTipoRegistro('CITA');
  }

  // En modo edición no mostramos opciones de repetición múltiple
  const seccionRec = document.getElementById('seccionRecurrencia');
  if (seccionRec) seccionRec.style.display = 'none';

  document.getElementById('nc_nombre').value = cita.paciente.nombre.replace('[BLOQUEO]', '').trim() || '';
  document.getElementById('nc_email').value = cita.paciente.email && !cita.paciente.email.startsWith('sin-email-') ? cita.paciente.email : '';
  
  const parsedTel = parsearTelefono(cita.paciente.telefono);
  const prefijoEl = document.getElementById('nc_prefijo');
  if (prefijoEl) prefijoEl.value = parsedTel.prefijo;
  document.getElementById('nc_telefono').value = parsedTel.numero;

  document.getElementById('nc_notas').value = (cita.categoria || '').replace('[BLOQUEO]', '').trim();

  const colorCita = cita.color || (esBloqueo ? '#94a3b8' : '#3EB8CC');
  document.getElementById('nc_color').value = colorCita;
  renderSwatches(colorCita);

  if (cita.fechaHora) {
    const d = new Date(cita.fechaHora);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');

    document.getElementById('nc_fecha').value = `${yyyy}-${mm}-${dd}`;
    document.getElementById('nc_hora').value = `${hh}:${min}`;
  }

  // Mostrar botón eliminar en edición
  const editExtra = document.getElementById('editExtraActions');
  if (editExtra) {
    editExtra.style.display = 'block';
    editExtra.innerHTML = `
      <button type="button" id="btnEliminarModal" style="background: none; border: none; color: #dc2626; font-size: 0.88rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
        <i class="fa-solid fa-trash-can"></i> Eliminar esta cita
      </button>
    `;
    const btnEliminar = document.getElementById('btnEliminarModal');
    if (btnEliminar) {
      btnEliminar.onclick = () => window.eliminarCita(cita.id);
    }
  }

  mostrarModalDirecto();
};

// Revisar cita cancelada desde el buscador (Solo lectura fija sin bloqueos, recurrencia ni color)
window.revisarCitaCancelada = function(id) {
  const cita = citasCache.find(c => c.id === id);
  if (!cita) return;

  const panel = document.getElementById('panelResultadosBusqueda');
  if (panel) panel.style.display = 'none';

  const form = document.getElementById('formNuevaCita');
  if (form) form.reset();

  setModoFormulario('READONLY_CANCELADA');

  const idInput = document.getElementById('nc_id');
  if (idInput) idInput.value = cita.id;

  const titulo = document.getElementById('modalTitulo');
  if (titulo) {
    titulo.innerHTML = `
      <i class="fa-solid fa-file-circle-xmark" style="color: #ef4444;"></i>
      <span>Detalle de Cita</span>
    `;
  }

  const subtitulo = document.getElementById('modalSubtitulo');
  if (subtitulo) {
    subtitulo.innerHTML = `
      <span style="font-size: 0.72rem; padding: 2px 8px; border-radius: 4px; background: #fee2e2; color: #b91c1c; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
        <i class="fa-solid fa-ban"></i> Cancelada / Borrada
      </span>
    `;
    subtitulo.style.display = 'inline-block';
  }

  const esBloqueo = (cita.categoria && cita.categoria.startsWith('[BLOQUEO]')) || (cita.paciente && cita.paciente.nombre.startsWith('[BLOQUEO]'));

  document.getElementById('nc_nombre').value = cita.paciente.nombre.replace('[BLOQUEO]', '').trim() || '';
  document.getElementById('nc_email').value = cita.paciente.email && !cita.paciente.email.startsWith('sin-email-') ? cita.paciente.email : '';
  
  const parsedTel = parsearTelefono(cita.paciente.telefono);
  const prefijoEl = document.getElementById('nc_prefijo');
  if (prefijoEl) prefijoEl.value = parsedTel.prefijo;
  document.getElementById('nc_telefono').value = parsedTel.numero;

  document.getElementById('nc_notas').value = (cita.categoria || '').replace('[BLOQUEO]', '').trim();

  if (cita.fechaHora) {
    const d = new Date(cita.fechaHora);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');

    document.getElementById('nc_fecha').value = `${yyyy}-${mm}-${dd}`;
    document.getElementById('nc_hora').value = `${hh}:${min}`;
  }

  // Opción para eliminar permanentemente (Hard Delete con confirmación estricta)
  const editExtra = document.getElementById('editExtraActions');
  if (editExtra) {
    editExtra.style.display = 'block';
    editExtra.innerHTML = `
      <div style="text-align: right; margin-bottom: 0.6rem;">
        <button type="button" onclick="eliminarDefinitivamente(${cita.id})" style="background: none; border: none; color: #dc2626; font-size: 0.84rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; padding: 4px 6px; border-radius: 4px;">
          <i class="fa-solid fa-trash-can"></i> Borrar definitivamente de la base de datos
        </button>
      </div>
    `;
  }

  // Configurar los botones principales de acción del pie
  const footer = document.getElementById('modalFooterActions');
  if (footer) {
    footer.innerHTML = `
      <button type="button" class="btn" style="flex: 1.5; background: #16a34a;" onclick="reactivarCita(${cita.id})">
        <i class="fa-solid fa-rotate-left" style="margin-right: 4px;"></i> Reactivar en Agenda
      </button>
      <button type="button" class="btn" style="flex: 1; background: var(--gris-calido);" onclick="cerrarModal()">Cerrar</button>
    `;
  }

  mostrarModalDirecto();
};

// Reactivar cita previamente cancelada
window.reactivarCita = async function(id) {
  const token = localStorage.getItem('psicolau_token');
  try {
    const res = await fetch(`${API_URL}/agenda/citas/${id}/estado`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ estado_cita: 'PENDIENTE' })
    });
    const data = await res.json();
    if (data.success) {
      window.cerrarModal();
      await initAgenda();
      const queryActual = (document.getElementById('busquedaInput')?.value || '').trim();
      if (queryActual) {
        window.filtrarCitasEnTabla(queryActual);
      }
      alert('✅ Cita reactivada con éxito en la agenda activa.');
    } else {
      alert(data.message || 'Error al reactivar la cita');
    }
  } catch (err) {
    alert('Error de conexión al reactivar la cita');
  }
};

// Eliminación física definitiva (Hard Delete) de la base de datos
window.eliminarDefinitivamente = async function(id) {
  const confirmado = window.confirm('⚠️ ATENCIÓN: ¿Deseas eliminar esta cita de forma DEFINITIVA y permanente?\n\nEsta acción borrará el registro de la base de datos y no se podrá recuperar.');
  if (!confirmado) return;

  const token = localStorage.getItem('psicolau_token');
  try {
    const response = await fetch(`${API_URL}/agenda/citas/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (data.success) {
      window.cerrarModal();
      await initAgenda(); // Refrescar matriz y caché
      const queryActual = (document.getElementById('busquedaInput')?.value || '').trim();
      if (queryActual) {
        window.filtrarCitasEnTabla(queryActual);
      }
      alert('🗑️ Cita eliminada definitivamente de la base de datos.');
    } else {
      alert(data.message || 'Error al eliminar definitivamente la cita');
    }
  } catch (error) {
    alert('Error de conexión al intentar eliminar definitivamente la cita');
  }
};

// Manejo del formulario de creación y edición de cita
document.addEventListener('DOMContentLoaded', () => {
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
      const fechaHora = `${fecha}T${hora}`;

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

      // Si es nueva cita y se marcó recurrencia
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
          await initAgenda(); // Recargar todas las citas del servidor
          
          if (data.repeticiones && data.repeticiones > 1) {
            alert(`✅ Se han programado con éxito las ${data.repeticiones} sesiones recurrentes (${data.frecuencia === 'QUINCENAL' ? 'quincenales' : 'semanales'}).`);
          }

          // Si el usuario tenía un término en la barra de búsqueda, refrescar los resultados de inmediato
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

// Confirmación y cancelación de cita (Soft Delete)
window.eliminarCita = async function(id) {
  const confirmado = window.confirm('¿Deseas cancelar y retirar esta cita de la agenda activa? (Permanecerá registrada en el historial de búsqueda)');
  if (!confirmado) return;

  const token = localStorage.getItem('psicolau_token');
  try {
    const response = await fetch(`${API_URL}/agenda/citas/${id}/cancelar`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (data.success) {
      window.cerrarModal();
      await initAgenda(); // Refrescar la tabla de inmediato
      
      const queryActual = (document.getElementById('busquedaInput')?.value || '').trim();
      if (queryActual) {
        window.filtrarCitasEnTabla(queryActual);
      }
    } else {
      alert(data.message || 'Error al cancelar la cita');
    }
  } catch (error) {
    alert('Error de conexión al intentar cancelar la cita');
  }
};

