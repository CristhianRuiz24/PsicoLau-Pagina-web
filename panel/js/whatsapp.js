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
    telInput.placeholder = 'Número de WhatsApp';
    if (telInput.value === '+') {
      telInput.value = '';
    }
  }
};

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

  const esGrupal = (cita.categoria && cita.categoria.startsWith('[GRUPAL]')) || (cita.paciente && cita.paciente.nombre.startsWith('[GRUPAL]'));
  const nombrePaciente = cita.paciente ? cita.paciente.nombre.replace('[BLOQUEO]', '').replace('[GRUPAL]', '').trim() : (esGrupal ? 'Grupo' : 'Paciente');
  const temaSesion = (cita.categoria || '').replace('[BLOQUEO]', '').replace('[GRUPAL]', '').trim();

  if (esGrupal) {
    let bloqueTema = temaSesion ? `\n📌 *Tema / Módulo:* ${temaSesion}` : '';
    let bloqueZoomGrupal = (cita.paciente && cita.paciente.enlaceZoom) ? `\n\n📹 *Enlace de Zoom para la sesión:*\n${cita.paciente.enlaceZoom.trim()}` : '';
    
    const mensaje = encodeURIComponent(`Hola a todos, les saludo con gusto. Les comparto los detalles para nuestra sesión de *${nombrePaciente}* de este *${diaTexto} ${diaNum} de ${mesTexto} a las ${horaTexto}*:${bloqueTema}${bloqueZoomGrupal}\n\n¡Nos vemos en la sesión grupal!\n\n- PsicoLau (Laura Gómez)`);
    
    if (telLimpio) {
      window.open(`https://wa.me/${telLimpio}?text=${mensaje}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${mensaje}`, '_blank');
    }
    return;
  }

  let bloqueZoom = '';
  if (cita.paciente && cita.paciente.enlaceZoom) {
    bloqueZoom = `\n\n📹 *Enlace para conectarte (Zoom):*\n${cita.paciente.enlaceZoom.trim()}`;
  }

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

  const mensaje = encodeURIComponent(`Hola ${nombrePaciente}, te recuerdo con gusto nuestra sesión de terapia agendada para este ${diaTexto} ${diaNum} de ${mesTexto} a las ${horaTexto}.${bloqueZoom}${bloquePagoRecordatorio}\n\nNos vemos pronto.\n\n- PsicoLau (Laura Gómez)`);

  window.open(`https://wa.me/${telLimpio}?text=${mensaje}`, '_blank');
};
