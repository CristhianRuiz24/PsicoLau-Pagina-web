// --- Módulo de Integración con WhatsApp y Comunicación con Pacientes ---

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
    telInput.placeholder = 'Número de WhatsApp (opcional)';
    if (telInput.value === '+') {
      telInput.value = '';
    }
  }
};

// Helper para abrir enlaces de WhatsApp evitando bloqueadores de ventanas emergentes (Brave / Chrome)
function abrirEnlaceWhatsApp(url) {
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    if (document.body.contains(link)) {
      document.body.removeChild(link);
    }
  }, 150);
}

// Guardar número de WhatsApp en la ficha del paciente para que nunca vuelva a pedirse
async function persistirTelefonoPaciente(cita, telFormateado) {
  try {
    if (cita.paciente) {
      cita.paciente.telefono = telFormateado;
    }
    const token = localStorage.getItem('psicolau_token');
    if (!token || !cita.id) return;
    await fetch(`${API_URL}/agenda/citas/${cita.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ telefono: telFormateado })
    });
  } catch (err) {
    console.warn('No se pudo guardar el teléfono en la base de datos:', err);
  }
}

// Envío directo de recordatorio de cobro / solicitud de comprobante por WhatsApp
window.enviarWhatsAppCobro = function(id, e) {
  if (e) e.stopPropagation();
  const cita = citasCache.find(c => c.id === id);
  if (!cita) return;

  const esBloqueo = (cita.categoria && cita.categoria.startsWith('[BLOQUEO]')) || (cita.paciente && cita.paciente.nombre && cita.paciente.nombre.startsWith('[BLOQUEO]'));
  const esGrupal = (cita.categoria && cita.categoria.startsWith('[GRUPAL]')) || (cita.paciente && cita.paciente.nombre && cita.paciente.nombre.startsWith('[GRUPAL]'));
  const esEvaluacion = (cita.categoria && cita.categoria.startsWith('[EVALUACION]')) || (cita.paciente && cita.paciente.nombre && cita.paciente.nombre.startsWith('[EVALUACION]'));
  const nombrePaciente = cita.paciente ? cita.paciente.nombre.replace(/^\[(BLOQUEO|GRUPAL|EVALUACION)\]\s*/i, '').trim() : 'Paciente';

  let telRaw = (cita.paciente && cita.paciente.telefono ? cita.paciente.telefono : '').trim();
  if (!telRaw) {
    telRaw = prompt(`Ingresa el número de WhatsApp para ${nombrePaciente} (con prefijo internacional, ej: +52 para México, +1 para USA, +34 para España):`, '+52 ');
    if (!telRaw) return;
  }

  let telLimpio = telRaw.replace(/\D/g, '');
  if (telLimpio.length === 10 && !telRaw.startsWith('+')) {
    telLimpio = '52' + telLimpio;
  }

  if (telLimpio.length < 10) {
    alert('Por favor ingresa un número de teléfono válido con al menos 10 dígitos.');
    return;
  }

  const telFormateado = telRaw.trim().startsWith('+') ? telRaw.trim() : `+${telLimpio}`;
  persistirTelefonoPaciente(cita, telFormateado);

  const d = new Date(cita.fechaHora);
  const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  
  const diaTexto = diasSemana[d.getDay()];
  const diaNum = d.getDate();
  const mesTexto = meses[d.getMonth()];
  const horaTexto = d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
  const horaLimpia = horaTexto.endsWith('.') ? horaTexto.slice(0, -1) : horaTexto;

  const datosPago = getDatosPago();
  const montoCita = (cita.monto !== undefined && cita.monto !== null) 
    ? cita.monto 
    : (cita.paciente && cita.paciente.tarifaDefecto !== undefined && cita.paciente.tarifaDefecto !== null ? cita.paciente.tarifaDefecto : (esEvaluacion ? 4000 : 500));

  let bloqueDatos = '';
  if (datosPago.banco || datosPago.clabe || datosPago.titular || (montoCita !== null && montoCita > 0)) {
    bloqueDatos += '\n\n*Datos de transferencia:*';
    if (montoCita !== null && montoCita > 0) {
      bloqueDatos += `\n• *Aportación:* $${montoCita.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`;
    }
    if (datosPago.banco) bloqueDatos += `\n• *Banco:* ${datosPago.banco}`;
    if (datosPago.clabe) bloqueDatos += `\n• *CLABE:* ${datosPago.clabe}`;
    if (datosPago.titular) bloqueDatos += `\n• *Titular:* ${datosPago.titular}`;
  }
  if (datosPago.enlace) {
    bloqueDatos += `\n• *Pago internacional (PayPal/Tarjeta):* ${datosPago.enlace}`;
  }

  if (!bloqueDatos) {
    bloqueDatos = '\n\n*(Recuerda ingresar a "Datos de Cobro" en el panel para configurar tus datos bancarios)*';
  }

  const tipoTexto = esEvaluacion ? 'evaluación' : (esGrupal ? 'terapia grupal' : 'terapia');
  const mensaje = encodeURIComponent(`Hola ${nombrePaciente}, te saludo con gusto. Te comparto este mensaje respecto a tu sesión de ${tipoTexto} del ${diaTexto} ${diaNum} de ${mesTexto} a las ${horaLimpia}.\n\nPara confirmar y mantener al día tu registro de sesiones, te dejo los datos para tu aportación:${bloqueDatos}\n\nUna vez realizado, te agradecería mucho compartirme tu comprobante por este medio. Si ya lo enviaste, haz caso omiso a este mensaje. ¡Muchas gracias!\n\n- PsicoLau (Laura Gómez)`);

  abrirEnlaceWhatsApp(`https://wa.me/${telLimpio}?text=${mensaje}`);
};

// Envío directo de recordatorio por WhatsApp con soporte para pacientes internacionales
window.enviarWhatsAppRecordatorio = function(id, e) {
  if (e) e.stopPropagation();
  const cita = citasCache.find(c => c.id === id);
  if (!cita) return;

  const esBloqueo = (cita.categoria && cita.categoria.startsWith('[BLOQUEO]')) || (cita.paciente && cita.paciente.nombre && cita.paciente.nombre.startsWith('[BLOQUEO]'));
  const esGrupal = (cita.categoria && cita.categoria.startsWith('[GRUPAL]')) || (cita.paciente && cita.paciente.nombre && cita.paciente.nombre.startsWith('[GRUPAL]'));
  const esEvaluacion = (cita.categoria && cita.categoria.startsWith('[EVALUACION]')) || (cita.paciente && cita.paciente.nombre && cita.paciente.nombre.startsWith('[EVALUACION]'));
  const nombrePaciente = cita.paciente ? cita.paciente.nombre.replace(/^\[(BLOQUEO|GRUPAL|EVALUACION)\]\s*/i, '').trim() : (esGrupal ? 'Grupo' : 'Paciente');
  const temaSesion = (cita.categoria || '').replace(/^\[(BLOQUEO|GRUPAL|EVALUACION)\]\s*/i, '').trim();

  let telRaw = (cita.paciente && cita.paciente.telefono ? cita.paciente.telefono : '').trim();
  
  if (!telRaw) {
    telRaw = prompt(`Ingresa el número de WhatsApp para ${nombrePaciente} (con prefijo internacional, ej: +52 para México, +1 para USA, +34 para España):`, '+52 ');
    if (!telRaw) return;
  }

  let telLimpio = telRaw.replace(/\D/g, '');
  
  // Si ingresó 10 dígitos y no colocó prefijo explícito con '+', asumir México (+52)
  if (telLimpio.length === 10 && !telRaw.startsWith('+')) {
    telLimpio = '52' + telLimpio;
  }

  if (telLimpio.length < 10) {
    alert('Por favor ingresa un número de teléfono válido con al menos 10 dígitos.');
    return;
  }

  const telFormateado = telRaw.trim().startsWith('+') ? telRaw.trim() : `+${telLimpio}`;
  persistirTelefonoPaciente(cita, telFormateado);

  const d = new Date(cita.fechaHora);
  const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  
  const diaTexto = diasSemana[d.getDay()];
  const diaNum = d.getDate();
  const mesTexto = meses[d.getMonth()];
  const horaTexto = d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
  const horaLimpia = horaTexto.endsWith('.') ? horaTexto.slice(0, -1) : horaTexto;

  if (esGrupal) {
    let bloqueTema = temaSesion ? `\n• *Tema / Módulo:* ${temaSesion}` : '';
    let bloqueZoomGrupal = (cita.paciente && cita.paciente.enlaceZoom) ? `\n\n*Enlace de Zoom para la sesión:*\n${cita.paciente.enlaceZoom.trim()}` : '';
    
    const mensaje = encodeURIComponent(`Hola a todos, les saludo con gusto. Les comparto los detalles para nuestra sesión de *${nombrePaciente}* de este *${diaTexto} ${diaNum} de ${mesTexto} a las ${horaLimpia}*:${bloqueTema}${bloqueZoomGrupal}\n\n¡Nos vemos en la sesión grupal!\n\n- PsicoLau (Laura Gómez)`);
    
    if (telLimpio) {
      abrirEnlaceWhatsApp(`https://wa.me/${telLimpio}?text=${mensaje}`);
    } else {
      abrirEnlaceWhatsApp(`https://wa.me/?text=${mensaje}`);
    }
    return;
  }

  let bloqueZoom = '';
  if (cita.paciente && cita.paciente.enlaceZoom) {
    const tituloZoom = esEvaluacion ? '*Enlace para conectarte a tu evaluación (Zoom):*' : '*Enlace para conectarte (Zoom):*';
    bloqueZoom = `\n\n${tituloZoom}\n${cita.paciente.enlaceZoom.trim()}`;
  }

  const tipoTexto = esEvaluacion ? 'evaluación' : 'terapia';
  const mensaje = encodeURIComponent(`Hola ${nombrePaciente}, te recuerdo con gusto nuestra sesión de ${tipoTexto} agendada para este ${diaTexto} ${diaNum} de ${mesTexto} a las ${horaLimpia}.${bloqueZoom}\n\nNos vemos pronto.\n\n- PsicoLau (Laura Gómez)`);

  abrirEnlaceWhatsApp(`https://wa.me/${telLimpio}?text=${mensaje}`);
};
