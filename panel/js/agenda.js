// --- Módulo de Agenda Semanal, Matriz Horaria y Gestión de Citas ---

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
      const cp = document.getElementById('customColorPicker');
      if (cp) cp.value = c.hex;
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

// Auto-detectar color usado previamente para el mismo paciente
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
          const esCompletada = cita.estado_cita === 'REALIZADA' || cita.estado_cita === 'CONFIRMADA';

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
                    <button type="button" class="card-btn" onclick="abrirExpedientePorCita(${cita.id}, event)" title="Expediente clínico del paciente (notas y sesiones)" style="color: var(--rosa-coral);">
                      <i class="fa-solid fa-folder-open"></i>
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
      prefijoEl.style.backgroundColor = '#f8fafc';
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
