// --- Módulo de Agenda Semanal, Matriz Horaria y Gestión de Citas ---

// Obtener colores personalizados guardados en localStorage
window.getColoresPersonalizados = function() {
  try {
    const raw = localStorage.getItem('psicolau_colores_personalizados');
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
};

// Guardar un nuevo color personalizado en localStorage
window.guardarColorPersonalizado = function(hex) {
  if (!hex || typeof hex !== 'string') return;
  const hexNorm = hex.trim().toUpperCase();
  if (!hexNorm.startsWith('#') || (hexNorm.length !== 4 && hexNorm.length !== 7)) return;

  // Verificar si ya existe en la paleta oficial predefinida
  const yaEnPaleta = PALETA_COLORES.some(c => c.hex.toUpperCase() === hexNorm);
  if (yaEnPaleta) return;

  const guardados = window.getColoresPersonalizados();
  const filtrados = guardados.filter(c => c.toUpperCase() !== hexNorm);
  filtrados.unshift(hexNorm);

  // Mantener un máximo de 10 colores recientes guardados
  const maxGuardados = filtrados.slice(0, 10);
  try {
    localStorage.setItem('psicolau_colores_personalizados', JSON.stringify(maxGuardados));
  } catch (e) {
    console.warn('No se pudo guardar color personalizado en localStorage', e);
  }
};

// Renderizado de paleta de colores en el Modal
function renderSwatches(colorSeleccionado = '#3EB8CC') {
  const container = document.getElementById('swatchesContainer');
  if (!container) return;
  container.innerHTML = '';

  const colorSelNorm = (colorSeleccionado || '#3EB8CC').toUpperCase();
  let colorEncontrado = false;

  // 1. Renderizar los 24 colores estándar
  PALETA_COLORES.forEach(c => {
    const swatch = document.createElement('div');
    const esActivo = c.hex.toUpperCase() === colorSelNorm;
    if (esActivo) colorEncontrado = true;

    swatch.className = `color-swatch ${esActivo ? 'active' : ''}`;
    swatch.style.backgroundColor = c.hex;
    swatch.title = `${c.nombre} (${c.hex})`;

    swatch.onclick = () => {
      document.querySelectorAll('.color-swatch, .color-swatch-custom').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      document.getElementById('nc_color').value = c.hex;
      const cp = document.getElementById('customColorPicker');
      if (cp) cp.value = c.hex;
    };
    container.appendChild(swatch);
  });

  // 2. Renderizar los colores personalizados guardados
  const personalizados = window.getColoresPersonalizados();
  personalizados.forEach(hex => {
    const swatch = document.createElement('div');
    const esActivo = hex.toUpperCase() === colorSelNorm;
    if (esActivo) colorEncontrado = true;

    swatch.className = `color-swatch custom-saved-swatch ${esActivo ? 'active' : ''}`;
    swatch.style.backgroundColor = hex;
    swatch.title = `Color personalizado guardado (${hex})`;

    swatch.onclick = () => {
      document.querySelectorAll('.color-swatch, .color-swatch-custom').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      document.getElementById('nc_color').value = hex;
      const cp = document.getElementById('customColorPicker');
      if (cp) cp.value = hex;
    };
    container.appendChild(swatch);
  });

  // 3. Selector de Color Personalizado (Gotero / Paleta Libre)
  const customWrapper = document.createElement('div');
  customWrapper.className = `color-swatch-custom ${!colorEncontrado ? 'active' : ''}`;
  customWrapper.title = 'Elegir color personalizado con gotero...';

  const customPicker = document.createElement('input');
  customPicker.type = 'color';
  customPicker.id = 'customColorPicker';
  customPicker.value = colorSeleccionado.startsWith('#') ? colorSeleccionado : '#3EB8CC';
  customPicker.className = 'custom-color-input';

  const iconPalette = document.createElement('i');
  iconPalette.className = 'fa-solid fa-eye-dropper';

  customWrapper.appendChild(customPicker);
  customWrapper.appendChild(iconPalette);

  // Vista previa al arrastrar el cursor en la paleta
  customPicker.oninput = (e) => {
    const customHex = e.target.value;
    document.querySelectorAll('.color-swatch, .color-swatch-custom').forEach(s => s.classList.remove('active'));
    customWrapper.classList.add('active');
    document.getElementById('nc_color').value = customHex;
  };

  // Guardado persistente inmediato al seleccionar el color
  customPicker.onchange = (e) => {
    const customHex = e.target.value;
    window.guardarColorPersonalizado(customHex);
    renderSwatches(customHex);
  };

  container.appendChild(customWrapper);
}

// Establecer monto rápido de cortesía ($0)
window.establecerMontoCortesia = function() {
  const montoInput = document.getElementById('nc_monto');
  if (montoInput) {
    montoInput.value = '0';
    montoInput.focus();
  }
};

// Actualizar lista predictiva de pacientes para el datalist del formulario
window.actualizarDatalistPacientes = function() {
  const datalist = document.getElementById('listaPacientesAutocompletar');
  if (!datalist) return;
  const listaDirectorio = window.directorioPacientesCache || [];
  const nombresVistos = new Set();
  let html = '';

  listaDirectorio.forEach(p => {
    if (p.nombre && !p.nombre.startsWith('[BLOQUEO]') && !nombresVistos.has(p.nombre.toLowerCase().trim())) {
      nombresVistos.add(p.nombre.toLowerCase().trim());
      html += `<option value="${escapeHtml(p.nombre)}">`;
    }
  });

  if (typeof citasCache !== 'undefined' && Array.isArray(citasCache)) {
    citasCache.forEach(c => {
      if (c.paciente && c.paciente.nombre && !c.paciente.nombre.startsWith('[BLOQUEO]')) {
        const nomLimpio = c.paciente.nombre.toLowerCase().trim();
        if (!nombresVistos.has(nomLimpio)) {
          nombresVistos.add(nomLimpio);
          html += `<option value="${escapeHtml(c.paciente.nombre)}">`;
        }
      }
    });
  }

  datalist.innerHTML = html;
};

// Manejo reactivo de autocompletado inteligente al escribir o seleccionar nombre
window.manejarInputNombrePaciente = function(valor) {
  if (tipoRegistroActual === 'BLOQUEO') return;
  const badge = document.getElementById('badgePacienteDetectado');
  const nombreLimpio = (valor || '').trim().toLowerCase().replace(/^\[(bloqueo|grupal)\]\s*/i, '');
  
  if (!nombreLimpio) {
    if (badge) badge.style.display = 'none';
    const idInput = document.getElementById('nc_id');
    if (!idInput || !idInput.value) {
      const emailEl = document.getElementById('nc_email');
      const telEl = document.getElementById('nc_telefono');
      const zoomEl = document.getElementById('nc_enlace_zoom');
      if (emailEl) emailEl.value = '';
      if (telEl) telEl.value = '';
      if (zoomEl) zoomEl.value = '';
    }
    return;
  }

  // Si estamos en modo TERAPIA GRUPAL
  if (tipoRegistroActual === 'GRUPAL') {
    let citaGrupalPrevia = null;
    if (typeof citasCache !== 'undefined' && Array.isArray(citasCache)) {
      citaGrupalPrevia = citasCache.find(c => {
        if (!c.paciente || !c.paciente.nombre) return false;
        const esGrup = (c.categoria && c.categoria.startsWith('[GRUPAL]')) || (c.paciente.nombre.startsWith('[GRUPAL]'));
        if (!esGrup) return false;
        const nom = c.paciente.nombre.toLowerCase().replace(/^\[(bloqueo|grupal)\]\s*/i, '').trim();
        return nom === nombreLimpio;
      });
    }

    if (citaGrupalPrevia && citaGrupalPrevia.paciente) {
      if (badge) {
        badge.innerHTML = '<i class="fa-solid fa-circle-check"></i> Grupo detectado';
        badge.style.background = '#f3e8ff';
        badge.style.color = '#7c3aed';
        badge.style.display = 'inline-flex';
      }

      // Autocompletar Enlace de Zoom grupal si la cita previa lo tenía
      const zoomEl = document.getElementById('nc_enlace_zoom');
      if (zoomEl && citaGrupalPrevia.paciente.enlaceZoom) {
        zoomEl.value = citaGrupalPrevia.paciente.enlaceZoom;
      }

      // Autocompletar Color de la sesión grupal
      if (citaGrupalPrevia.color) {
        document.getElementById('nc_color').value = citaGrupalPrevia.color;
        renderSwatches(citaGrupalPrevia.color);
      }
    } else {
      if (badge) badge.style.display = 'none';
    }
    return;
  }

  // Modo CITA INDIVIDUAL: Buscar coincidencia en directorio de pacientes O en citasCache
  const lista = window.directorioPacientesCache || [];
  let coincidencia = lista.find(p => {
    if (!p.nombre) return false;
    const nom = p.nombre.toLowerCase().replace(/^\[(bloqueo|grupal)\]\s*/i, '').trim();
    return nom === nombreLimpio;
  });

  if (!coincidencia && typeof citasCache !== 'undefined' && Array.isArray(citasCache)) {
    const citaPrevia = citasCache.find(c => {
      if (!c.paciente || !c.paciente.nombre) return false;
      const esBloq = (c.categoria && c.categoria.startsWith('[BLOQUEO]')) || (c.paciente.nombre.startsWith('[BLOQUEO]'));
      const esGrup = (c.categoria && c.categoria.startsWith('[GRUPAL]')) || (c.paciente.nombre.startsWith('[GRUPAL]'));
      if (esBloq || esGrup) return false;
      const nom = c.paciente.nombre.toLowerCase().replace(/^\[(bloqueo|grupal)\]\s*/i, '').trim();
      return nom === nombreLimpio;
    });
    if (citaPrevia && citaPrevia.paciente) {
      coincidencia = {
        ...citaPrevia.paciente,
        monto: citaPrevia.monto
      };
    }
  }

  if (coincidencia) {
    if (badge) {
      badge.innerHTML = '<i class="fa-solid fa-circle-check"></i> Paciente registrado';
      badge.style.background = '#dcfce7';
      badge.style.color = '#15803d';
      badge.style.display = 'inline-flex';
    }
    
    // Autocompletar Correo (si no es generado automáticamente)
    const emailEl = document.getElementById('nc_email');
    if (emailEl && coincidencia.email && !coincidencia.email.startsWith('sin-email-') && !coincidencia.email.startsWith('grupal-')) {
      emailEl.value = coincidencia.email;
    }

    // Autocompletar Teléfono con prefijo internacional
    if (coincidencia.telefono) {
      const parsedTel = parsearTelefono(coincidencia.telefono);
      const prefijoEl = document.getElementById('nc_prefijo');
      const telEl = document.getElementById('nc_telefono');
      if (prefijoEl) prefijoEl.value = parsedTel.prefijo || '+52';
      if (telEl) telEl.value = parsedTel.numero || '';
    }

    // Autocompletar Enlace de Zoom (solo si el paciente ya tiene uno registrado)
    const zoomEl = document.getElementById('nc_enlace_zoom');
    if (zoomEl && coincidencia.enlaceZoom) {
      zoomEl.value = coincidencia.enlaceZoom;
    }

    // Autocompletar Tarifa / Monto de sesión
    const montoEl = document.getElementById('nc_monto');
    if (montoEl) {
      if (coincidencia.tarifaDefecto !== undefined && coincidencia.tarifaDefecto !== null) {
        montoEl.value = coincidencia.tarifaDefecto;
      } else if (coincidencia.monto !== undefined && coincidencia.monto !== null) {
        montoEl.value = coincidencia.monto;
      }
    }

    // Autocompletar Color de la paleta
    window.autoDetectarColorPaciente(coincidencia.nombre);
  } else {
    if (badge) badge.style.display = 'none';
    window.autoDetectarColorPaciente(valor);
  }
};

// Auto-detectar color usado previamente para el mismo paciente o grupo
window.autoDetectarColorPaciente = function(nombre) {
  if (!nombre || tipoRegistroActual === 'BLOQUEO') return;
  const nombreLimpio = nombre.toLowerCase().replace(/^\[(bloqueo|grupal)\]\s*/i, '').trim();
  if (nombreLimpio.length < 3) return;

  const previa = citasCache.find(c => {
    if (!c.paciente || !c.paciente.nombre || !c.color) return false;
    const nom = c.paciente.nombre.toLowerCase().replace(/^\[(bloqueo|grupal)\]\s*/i, '').trim();
    return nom === nombreLimpio;
  });
  if (previa && previa.color) {
    document.getElementById('nc_color').value = previa.color;
    renderSwatches(previa.color);
  }
};

// Abrir sala de Zoom de la cita
window.abrirZoomSesion = function(citaId, event) {
  if (event) event.stopPropagation();
  const cita = citasCache.find(c => c.id === citaId);
  if (!cita) return;

  const link = cita.paciente && cita.paciente.enlaceZoom ? cita.paciente.enlaceZoom.trim() : null;
  if (link) {
    let urlFinal = link;
    if (!urlFinal.startsWith('http://') && !urlFinal.startsWith('https://')) {
      urlFinal = `https://${urlFinal}`;
    }
    window.open(urlFinal, '_blank');
  } else {
    alert(`El paciente "${cita.paciente.nombre}" aún no tiene configurado su enlace de Zoom.\n\nA continuación se abrirá el formulario para que puedas pegarlo en un segundo.`);
    window.editarCita(cita.id);
    setTimeout(() => {
      const zoomInput = document.getElementById('nc_enlace_zoom');
      if (zoomInput) zoomInput.focus();
    }, 150);
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
    const esGrupal = (c.categoria && c.categoria.startsWith('[GRUPAL]')) || (c.paciente && c.paciente.nombre.startsWith('[GRUPAL]'));
    if (!esBloqueo && !esGrupal) {
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
          const esGrupal = (cita.categoria && cita.categoria.startsWith('[GRUPAL]')) || (cita.paciente && cita.paciente.nombre.startsWith('[GRUPAL]'));
          const nombreLimpio = cita.paciente.nombre.replace('[BLOQUEO]', '').replace('[GRUPAL]', '').trim();
          const notasLimpias = (cita.categoria || '').replace('[BLOQUEO]', '').replace('[GRUPAL]', '').trim();
          const esCompletada = cita.estado_cita === 'REALIZADA' || cita.estado_cita === 'CONFIRMADA';

          let matchesBusqueda = true;
          let blockClass = esBloqueo ? 'appointment-block is-blocked' : (esGrupal ? 'appointment-block is-group' : (esCompletada ? 'appointment-block is-completed' : 'appointment-block'));
          if (esGrupal && esCompletada) blockClass += ' is-completed';

          if (terminoBusqueda) {
            const textoCompleto = `${nombreLimpio} ${notasLimpias} ${cita.paciente.telefono || ''} ${esGrupal ? 'grupal grupo taller' : ''}`.toLowerCase();
            matchesBusqueda = textoCompleto.includes(terminoBusqueda);
            if (matchesBusqueda) {
              blockClass += ' is-highlighted';
            } else {
              blockClass += ' is-dimmed';
            }
          }

          tbodyHtml += `
            <div id="cita-block-${cita.id}" class="${blockClass}" style="background-color: ${color}; color: ${textColor};" onclick="event.stopPropagation()">
              <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 3px;">
                <span class="time-badge">${cTime}</span>
                <div class="card-actions-capsule">
                  ${!esBloqueo ? `
                    <button type="button" class="btn-check-completada ${esCompletada ? 'completed' : 'pending'}" onclick="toggleCompletarCita(${cita.id}, event)" title="${esCompletada ? (esGrupal ? 'Sesión grupal realizada (clic para desmarcar)' : 'Sesión realizada (clic para desmarcar)') : (esGrupal ? 'Marcar sesión grupal como realizada' : 'Marcar sesión como realizada / completada')}">
                      <i class="${esCompletada ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'}"></i>
                    </button>
                    ${!esGrupal ? `
                      <button type="button" class="card-btn" onclick="abrirExpedientePorCita(${cita.id}, event)" title="Expediente clínico del paciente (notas y sesiones)" style="color: var(--rosa-coral);">
                        <i class="fa-solid fa-folder-open"></i>
                      </button>
                    ` : ''}
                  ` : ''}
                </div>
              </div>

              <div class="patient-name">${esBloqueo ? `<i class="fa-solid fa-ban" style="margin-right: 3px;"></i>${escapeHtml(nombreLimpio)}` : (esGrupal ? `<i class="fa-solid fa-users" style="margin-right: 4px;"></i>${escapeHtml(nombreLimpio)}` : escapeHtml(nombreLimpio))}</div>
              ${notasLimpias ? `<div class="appointment-note">${escapeHtml(notasLimpias)}</div>` : ''}
              ${(esGrupal || (esCompletada && !esBloqueo)) ? `
                <div class="card-badges-row">
                  ${esGrupal ? `<div class="badge-grupal"><i class="fa-solid fa-people-group"></i> Grupal</div>` : ''}
                  ${esCompletada && !esBloqueo ? `<div class="badge-completada"><i class="fa-solid fa-check"></i> Realizada</div>` : ''}
                </div>
              ` : ''}

              <!-- Barra de Acciones Rápidas (Zoom, WA, Cobro, Editar, Eliminar) -->
              <div class="card-quick-actions-bar">
                ${!esBloqueo ? `
                  <button type="button" class="card-btn btn-zoom" onclick="abrirZoomSesion(${cita.id}, event)" title="${cita.paciente && cita.paciente.enlaceZoom ? (esGrupal ? 'Entrar a la sala grupal de Zoom' : 'Entrar a la sesión de Zoom (' + nombreLimpio + ')') : 'Configurar enlace de Zoom'}" style="color: ${cita.paciente && cita.paciente.enlaceZoom ? '#2563eb' : '#94a3b8'};">
                    <i class="fa-solid fa-video"></i>
                  </button>
                  ${!esGrupal ? `
                    <button type="button" class="card-btn btn-wa" onclick="enviarWhatsAppRecordatorio(${cita.id}, event)" title="Recordatorio de cita por WhatsApp" style="color: #16a34a;">
                      <i class="fa-brands fa-whatsapp"></i>
                    </button>
                  ` : ''}
                  ${!esPagado && !esGrupal ? `
                    <button type="button" class="card-btn btn-cobro" onclick="enviarWhatsAppCobro(${cita.id}, event)" title="Recordar pago y enviar datos bancarios por WhatsApp" style="color: #ea580c;">
                      <i class="fa-solid fa-file-invoice-dollar"></i>
                    </button>
                  ` : ''}
                ` : ''}
                <button type="button" class="card-btn btn-edit" onclick="editarCita(${cita.id})" style="color: #334155;" title="${esGrupal ? 'Editar sesión grupal' : 'Editar cita'}">
                  <i class="fa-solid fa-pen"></i>
                </button>
                <button type="button" class="card-btn btn-del" onclick="eliminarCita(${cita.id})" style="color: #dc2626;" title="${esGrupal ? 'Eliminar sesión grupal' : 'Eliminar cita'}">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
              
              ${!esBloqueo && !esGrupal ? `
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

// Alternar estado de Cita Realizada / Completada
window.toggleCompletarCita = async function(id, e) {
  if (e) e.stopPropagation();
  const cita = citasCache.find(c => c.id === id);
  if (!cita) return;

  const esActualmenteHecha = cita.estado_cita === 'REALIZADA' || cita.estado_cita === 'CONFIRMADA';
  const nuevoEstado = esActualmenteHecha ? 'PENDIENTE' : 'REALIZADA';
  const esMarcarComoHecha = nuevoEstado === 'REALIZADA';

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

// Abrir modal con fecha y hora de la celda pulsada
window.agendarEnCelda = function(fecha, hora) {
  window.abrirModal();
  document.getElementById('nc_fecha').value = fecha;
  document.getElementById('nc_hora').value = hora;
};

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

// Impresión de agenda semanal
window.imprimirAgenda = function() {
  const rangoEl = document.getElementById('rangoSemana');
  const printRangoEl = document.getElementById('printRangoSemana');
  if (rangoEl && printRangoEl) {
    printRangoEl.textContent = rangoEl.textContent;
  }
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

// --- Manejo del Modal de Nueva / Editar Cita ---
function mostrarModalDirecto() {
  const modal = document.getElementById('modalNuevaCita');
  if (modal) modal.style.display = 'flex';
}

window.seleccionarTipoRegistro = function(tipo) {
  tipoRegistroActual = tipo;
  const tabCita = document.getElementById('tabTipoCita');
  const tabGrupal = document.getElementById('tabTipoGrupal');
  const tabBloqueo = document.getElementById('tabTipoBloqueo');
  const camposContacto = document.getElementById('camposContactoIndividual');
  const campoZoomContainer = document.getElementById('campoZoomContainer');
  const seccionRecurrencia = document.getElementById('seccionRecurrencia');
  const seccionMonto = document.getElementById('seccionMontoSesion');
  const lblNombre = document.getElementById('lblNombre');
  const lblZoom = document.getElementById('lblZoom');
  const inputNombre = document.getElementById('nc_nombre');
  const inputZoom = document.getElementById('nc_enlace_zoom');
  const inputMonto = document.getElementById('nc_monto');
  const badge = document.getElementById('badgePacienteDetectado');

  if (tabCita) tabCita.classList.remove('active');
  if (tabGrupal) tabGrupal.classList.remove('active');
  if (tabBloqueo) tabBloqueo.classList.remove('active');

  if (tipo === 'BLOQUEO') {
    if (tabBloqueo) tabBloqueo.classList.add('active');
    if (camposContacto) camposContacto.style.display = 'none';
    if (campoZoomContainer) campoZoomContainer.style.display = 'none';
    if (seccionRecurrencia) seccionRecurrencia.style.display = 'none';
    if (seccionMonto) seccionMonto.style.display = 'none';
    if (inputMonto) inputMonto.value = '0';
    if (badge) badge.style.display = 'none';
    if (lblNombre) lblNombre.innerHTML = '<i class="fa-solid fa-ban" style="color: #ef4444; margin-right: 4px;"></i> Motivo del Bloqueo / Horario No Disponible *';
    if (inputNombre) {
      inputNombre.placeholder = 'Ej: Comida, Supervisión, Asunto personal...';
    }
    document.getElementById('nc_color').value = '#94a3b8';
    renderSwatches('#94a3b8');
  } else if (tipo === 'GRUPAL') {
    if (tabGrupal) tabGrupal.classList.add('active');
    if (camposContacto) camposContacto.style.display = 'none';
    if (campoZoomContainer) campoZoomContainer.style.display = 'block';
    if (seccionRecurrencia) seccionRecurrencia.style.display = 'block';
    if (seccionMonto) seccionMonto.style.display = 'none';
    if (inputMonto) inputMonto.value = '0';
    if (badge) badge.style.display = 'none';
    if (lblNombre) lblNombre.innerHTML = '<i class="fa-solid fa-users" style="color: #8b5cf6; margin-right: 4px;"></i> Tipo / Nombre del Grupo o Programa *';
    if (lblZoom) lblZoom.innerHTML = '<i class="fa-solid fa-video" style="color: #8b5cf6; margin-right: 4px;"></i> Enlace de Zoom de la Sala Grupal (opcional)';
    if (inputZoom) inputZoom.placeholder = 'https://zoom.us/j/... (Enlace para todos los participantes)';
    if (inputNombre) {
      inputNombre.placeholder = 'Ej: Terapia Grupal para Autistas Adultos...';
    }
    
    const idInput = document.getElementById('nc_id');
    if (!idInput || !idInput.value) {
      document.getElementById('nc_color').value = '#8b5cf6';
      renderSwatches('#8b5cf6');
      const repInput = document.getElementById('nc_repeticiones');
      if (repInput) repInput.value = '12';
    } else {
      const colorExistente = document.getElementById('nc_color').value || '#8b5cf6';
      renderSwatches(colorExistente);
    }
  } else {
    // CITA individual
    if (tabCita) tabCita.classList.add('active');
    if (camposContacto) camposContacto.style.display = 'grid';
    if (campoZoomContainer) campoZoomContainer.style.display = 'block';
    if (seccionRecurrencia) seccionRecurrencia.style.display = 'block';
    if (seccionMonto) seccionMonto.style.display = 'block';
    if (lblNombre) lblNombre.innerHTML = '<i class="fa-solid fa-user" style="color: var(--turquesa); margin-right: 4px;"></i> Nombre del paciente / Asunto *';
    if (lblZoom) lblZoom.innerHTML = '<i class="fa-solid fa-video" style="color: #2563eb; margin-right: 4px;"></i> Enlace personal de Zoom / Videollamada (opcional)';
    if (inputZoom) inputZoom.placeholder = 'https://zoom.us/j/... o Google Meet';
    if (inputNombre) {
      inputNombre.placeholder = 'Ej: Mariana López, Carlos Ruiz...';
    }
    
    const idInput = document.getElementById('nc_id');
    if (!idInput || !idInput.value) {
      const colorNuevo = obtenerSiguienteColorDisponible();
      document.getElementById('nc_color').value = colorNuevo;
      renderSwatches(colorNuevo);
      const repInput = document.getElementById('nc_repeticiones');
      if (repInput) repInput.value = '4';
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

function setModoFormulario(modo) {
  const campos = ['nc_nombre', 'nc_email', 'nc_telefono', 'nc_fecha', 'nc_hora', 'nc_notas', 'nc_enlace_zoom'];
  const tabs = document.getElementById('seccionTabsTipo');
  const seccionRec = document.getElementById('seccionRecurrencia');
  const seccionColor = document.getElementById('seccionColorBloque');
  const camposContacto = document.getElementById('camposContactoIndividual');
  const campoZoomContainer = document.getElementById('campoZoomContainer');
  const prefijoEl = document.getElementById('nc_prefijo');

  if (modo === 'READONLY_CANCELADA') {
    if (tabs) tabs.style.display = 'none';
    if (seccionRec) seccionRec.style.display = 'none';
    if (seccionColor) seccionColor.style.display = 'none';
    if (camposContacto) camposContacto.style.display = 'grid';
    if (campoZoomContainer) campoZoomContainer.style.display = 'block';
    if (prefijoEl) {
      prefijoEl.disabled = true;
      prefijoEl.style.backgroundColor = '#f8fafc';
    }

    campos.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        if (el.tagName === 'SELECT') {
          el.disabled = true;
        } else {
          el.readOnly = true;
        }
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
      prefijoEl.style.backgroundColor = '';
    }

    campos.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        if (el.tagName === 'SELECT') {
          el.disabled = false;
        } else {
          el.readOnly = false;
        }
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

  const montoInput = document.getElementById('nc_monto');
  if (montoInput) montoInput.value = '500';

  const zoomInput = document.getElementById('nc_enlace_zoom');
  if (zoomInput) zoomInput.value = '';

  const badge = document.getElementById('badgePacienteDetectado');
  if (badge) badge.style.display = 'none';

  if (window.actualizarDatalistPacientes) {
    window.actualizarDatalistPacientes();
  }

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

  const tabs = document.getElementById('seccionTabsTipo');
  if (tabs) tabs.style.display = 'flex';

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

  const zoomInput = document.getElementById('nc_enlace_zoom');
  if (zoomInput) zoomInput.value = '';

  const badge = document.getElementById('badgePacienteDetectado');
  if (badge) badge.style.display = 'none';

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

  const tabs = document.getElementById('seccionTabsTipo');
  if (tabs) tabs.style.display = 'flex';

  const checkRepetir = document.getElementById('nc_repetir');
  if (checkRepetir) checkRepetir.checked = false;
  window.toggleOpcionesRecurrencia(false);

  window.seleccionarTipoRegistro('CITA');
};

// Cargar datos de cita para edición
window.editarCita = function(id) {
  const cita = citasCache.find(c => c.id === id);
  if (!cita) return;

  if (window.actualizarDatalistPacientes) {
    window.actualizarDatalistPacientes();
  }

  setModoFormulario('EDITABLE');

  const idInput = document.getElementById('nc_id');
  if (idInput) idInput.value = cita.id;

  const esBloqueo = (cita.categoria && cita.categoria.startsWith('[BLOQUEO]')) || (cita.paciente && cita.paciente.nombre.startsWith('[BLOQUEO]'));
  const esGrupal = (cita.categoria && cita.categoria.startsWith('[GRUPAL]')) || (cita.paciente && cita.paciente.nombre.startsWith('[GRUPAL]'));

  const titulo = document.getElementById('modalTitulo');
  if (titulo) {
    if (esGrupal) {
      titulo.innerHTML = '<i class="fa-solid fa-pen-to-square" style="color: #8b5cf6;"></i> <span>Editar Sesión Grupal</span>';
    } else if (esBloqueo) {
      titulo.innerHTML = '<i class="fa-solid fa-pen-to-square" style="color: #ef4444;"></i> <span>Editar Bloqueo</span>';
    } else {
      titulo.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> <span>Editar Cita</span>';
    }
  }

  const subtitulo = document.getElementById('modalSubtitulo');
  if (subtitulo) {
    if (esGrupal) {
      subtitulo.innerHTML = '<span class="badge-tipo-info info-grupal"><i class="fa-solid fa-people-group"></i> Terapia Grupal</span>';
    } else if (esBloqueo) {
      subtitulo.innerHTML = '<span class="badge-tipo-info info-bloqueo"><i class="fa-solid fa-ban"></i> Bloqueo de Horario</span>';
    } else {
      subtitulo.innerHTML = '<span class="badge-tipo-info info-cita"><i class="fa-solid fa-user-doctor"></i> Cita Individual</span>';
    }
    subtitulo.style.display = 'block';
  }

  const footer = document.getElementById('modalFooterActions');
  if (footer) {
    footer.innerHTML = `
      <button type="submit" id="btnGuardarModal" class="btn" style="flex: 1.5;"><i class="fa-solid fa-check" style="margin-right: 4px;"></i> Guardar Cambios</button>
      <button type="button" id="btnCancelarModal" class="btn" style="flex: 1; background: var(--gris-calido);" onclick="cerrarModal()">Cancelar</button>
    `;
  }
  
  if (esBloqueo) {
    window.seleccionarTipoRegistro('BLOQUEO');
  } else if (esGrupal) {
    window.seleccionarTipoRegistro('GRUPAL');
  } else {
    window.seleccionarTipoRegistro('CITA');
  }

  // Ocultar pestañas de tipo para evitar cambiar la naturaleza de la cita al editarla
  const tabs = document.getElementById('seccionTabsTipo');
  if (tabs) tabs.style.display = 'none';

  const seccionRec = document.getElementById('seccionRecurrencia');
  if (seccionRec) seccionRec.style.display = 'none';

  const nombreLimpio = cita.paciente.nombre.replace('[BLOQUEO]', '').replace('[GRUPAL]', '').trim() || '';
  document.getElementById('nc_nombre').value = nombreLimpio;
  document.getElementById('nc_email').value = cita.paciente.email && !cita.paciente.email.startsWith('sin-email-') && !cita.paciente.email.startsWith('grupal-') ? cita.paciente.email : '';
  
  const parsedTel = parsearTelefono(cita.paciente.telefono);
  const prefijoEl = document.getElementById('nc_prefijo');
  if (prefijoEl) prefijoEl.value = parsedTel.prefijo;
  document.getElementById('nc_telefono').value = parsedTel.numero;

  const zoomEl = document.getElementById('nc_enlace_zoom');
  if (zoomEl) {
    zoomEl.value = (cita.paciente && cita.paciente.enlaceZoom) ? cita.paciente.enlaceZoom : '';
  }

  const montoEl = document.getElementById('nc_monto');
  if (montoEl) {
    montoEl.value = (cita.monto !== undefined && cita.monto !== null) 
      ? cita.monto 
      : (cita.paciente && cita.paciente.tarifaDefecto !== null && cita.paciente.tarifaDefecto !== undefined ? cita.paciente.tarifaDefecto : 500);
  }

  const badge = document.getElementById('badgePacienteDetectado');
  if (badge) {
    badge.style.display = (!esBloqueo && !esGrupal) ? 'inline-flex' : 'none';
  }

  document.getElementById('nc_notas').value = (cita.categoria || '').replace('[BLOQUEO]', '').replace('[GRUPAL]', '').trim();

  const colorCita = cita.color || (esBloqueo ? '#94a3b8' : (esGrupal ? '#8b5cf6' : '#3EB8CC'));
  document.getElementById('nc_color').value = colorCita;
  renderSwatches(colorCita);

  if (cita.fechaHora) {
    const d = new Date(cita.fechaHora);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const minRaw = d.getMinutes();
    const min = minRaw >= 30 ? '30' : '00';

    document.getElementById('nc_fecha').value = `${yyyy}-${mm}-${dd}`;
    const horaSelect = document.getElementById('nc_hora');
    if (horaSelect) {
      horaSelect.value = `${hh}:${min}`;
      if (!horaSelect.value) {
        horaSelect.value = '07:00';
      }
    }
  }

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

  document.getElementById('nc_nombre').value = cita.paciente.nombre.replace('[BLOQUEO]', '').trim() || '';
  document.getElementById('nc_email').value = cita.paciente.email && !cita.paciente.email.startsWith('sin-email-') ? cita.paciente.email : '';
  
  const parsedTel = parsearTelefono(cita.paciente.telefono);
  const prefijoEl = document.getElementById('nc_prefijo');
  if (prefijoEl) prefijoEl.value = parsedTel.prefijo;
  document.getElementById('nc_telefono').value = parsedTel.numero;

  const zoomEl = document.getElementById('nc_enlace_zoom');
  if (zoomEl) {
    zoomEl.value = (cita.paciente && cita.paciente.enlaceZoom) ? cita.paciente.enlaceZoom : '';
  }

  document.getElementById('nc_notas').value = (cita.categoria || '').replace('[BLOQUEO]', '').trim();

  if (cita.fechaHora) {
    const d = new Date(cita.fechaHora);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const minRaw = d.getMinutes();
    const min = minRaw >= 30 ? '30' : '00';

    document.getElementById('nc_fecha').value = `${yyyy}-${mm}-${dd}`;
    const horaSelect = document.getElementById('nc_hora');
    if (horaSelect) {
      horaSelect.value = `${hh}:${min}`;
      if (!horaSelect.value) {
        horaSelect.value = '07:00';
      }
    }
  }

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

// Cancelar cita (Soft Delete: cambia estado_cita a 'CANCELADA')
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
      await initAgenda();
      
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
      await initAgenda();
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
