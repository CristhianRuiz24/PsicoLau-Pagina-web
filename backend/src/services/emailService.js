const { escapeHtml } = require('../utils/sanitizer');
const logger = require('../utils/logger');

// Remitente y Destinatario oficial
const REMITENTE = process.env.REMITENTE || 'PsicoLau <contacto@psicolau.com>';
const CORREO_DESTINO = process.env.CORREO_LAURA || 'lince_lg@yahoo.com.mx';

/**
 * Determina si una dirección de correo pertenece a un dominio ficticio o de prueba.
 * @param {string} email
 * @returns {boolean}
 */
const esDominioFicticio = (email) => {
  if (!email || typeof email !== 'string') return true;
  const limpio = email.trim().toLowerCase();
  return /@(local\.com|test\.com|example\.com|fake\.com|invalid)$/i.test(limpio) ||
         /\.local$/i.test(limpio) ||
         limpio.startsWith('sin-email-');
};

/**
 * Envío de correos mediante la API REST oficial de Resend (HTTPS / Puerto 443).
 * Evita bloqueos de puertos SMTP (465/587) en proveedores como Render y responde en <200ms.
 */
const enviarEmailResend = async ({ to, subject, html, replyTo }) => {
  const destinatarios = Array.isArray(to) ? to : [to];

  // 1. Aislamiento estricto en entorno de pruebas (Spec 016 - RF-1)
  if (process.env.NODE_ENV === 'test') {
    return {
      success: true,
      simulated: true,
      id: 'test-mock-id',
      message: 'Envío simulado en entorno de pruebas',
      subject,
      html
    };
  }

  // 2. Filtro anti-rebote: Detectar dominios ficticios o de prueba (Spec 016 - RF-2)
  if (destinatarios.some(d => esDominioFicticio(d))) {
    return {
      success: true,
      simulated: true,
      id: 'test-ficticio-mock-id',
      message: 'Envío simulado para dominio de prueba (anti-rebote)'
    };
  }

  // 3. Protección de la bandeja de Laura en desarrollo local (Spec 016 - RF-3)
  if (process.env.NODE_ENV !== 'production' && process.env.ENABLE_REAL_EMAILS_DEV !== 'true') {
    const destinoLauraNormalizado = CORREO_DESTINO.trim().toLowerCase();
    if (destinatarios.some(d => (d || '').trim().toLowerCase() === destinoLauraNormalizado)) {
      return {
        success: true,
        simulated: true,
        id: 'dev-laura-mock-id',
        message: 'Aviso a Laura simulado en desarrollo local'
      };
    }
  }

  const apiKey = process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.trim() : '';
  if (!apiKey) {
    console.warn('[Resend API] RESEND_API_KEY no está configurada en las variables de entorno. Omitiendo envío de correo.');
    return { success: false, message: 'RESEND_API_KEY no configurada' };
  }

  const payload = {
    from: REMITENTE,
    to: destinatarios,
    subject,
    html
  };

  if (replyTo && String(replyTo).trim().length > 0) {
    payload.reply_to = String(replyTo).trim();
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error('[Resend API Error]', data);
      throw new Error(data.message || `Error en Resend API (${response.status})`);
    }

    return data;
  } catch (error) {
    logger.error('[Resend Network Error]', error);
    throw error;
  }
};

/**
 * Renderiza el layout base para correos electrónicos transaccionales de PsicoLau.
 * Implementa tablas HTML con estilos inline compatibles con Outlook, Gmail, Apple Mail y Yahoo.
 */
const construirPlantillaBase = ({
  titulo,
  subtitulo,
  badge,
  contenidoHtml,
  botonAccion,
  textoFooter
}) => {
  const badgeHtml = badge ? `
    <div style="margin-bottom: 16px;">
      <span style="display: inline-block; background-color: #FEF2F5; color: #EC5E86; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; padding: 5px 14px; border-radius: 20px; border: 1px solid #FCE4EC;">
        ${badge}
      </span>
    </div>` : '';

  const botonHtml = botonAccion ? `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top: 26px; margin-bottom: 8px;">
      <tr>
        <td align="center" style="border-radius: 8px; background-color: ${botonAccion.color || '#1E94A8'};">
          <a href="${botonAccion.url}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 13px 26px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 600; color: #FFFFFF; text-decoration: none; border-radius: 8px; letter-spacing: 0.3px;">
            ${botonAccion.texto}
          </a>
        </td>
      </tr>
    </table>` : '';

  const footerCustom = textoFooter ? `
    <p style="margin: 0 0 10px; font-size: 12px; color: #718096; line-height: 1.5;">
      ${textoFooter}
    </p>` : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(titulo)}</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #F8F9FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #2D3748; line-height: 1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid #EAEAEA;" cellspacing="0" cellpadding="0" border="0">
          
          <!-- CABECERA INSTITUCIONAL PSICOLAU -->
          <tr>
            <td style="background: linear-gradient(135deg, #EC5E86 0%, #D84872 100%); padding: 26px 24px; text-align: center;">
              <h1 style="margin: 0; color: #FFFFFF; font-size: 22px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">
                PSICOLAU
              </h1>
              <p style="margin: 5px 0 0; color: #FFE4EC; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 1.5px;">
                Psicología y Resiliencia
              </p>
            </td>
          </tr>

          <!-- CONTENIDO PRINCIPAL -->
          <tr>
            <td style="padding: 30px 28px 26px;">
              ${badgeHtml}
              <h2 style="margin: 0 0 8px; color: #1A202C; font-size: 19px; font-weight: 700; line-height: 1.3;">
                ${titulo}
              </h2>
              ${subtitulo ? `<p style="margin: 0 0 20px; color: #718096; font-size: 14px;">${subtitulo}</p>` : '<div style="height: 12px;"></div>'}

              ${contenidoHtml}

              ${botonHtml}
            </td>
          </tr>

          <!-- PIE DE PÁGINA Y CONFIDENCIALIDAD -->
          <tr>
            <td style="background-color: #FDFBF9; padding: 22px 24px; text-align: center; border-top: 1px solid #F0ECE7; font-size: 11px; color: #A0AEC0; line-height: 1.6;">
              ${footerCustom}
              <p style="margin: 0 0 4px; font-weight: 600; color: #718096;">
                Lic. Laura Gómez Díaz · Psicóloga Clínica
              </p>
              <p style="margin: 0;">
                <a href="https://psicolau.com" target="_blank" rel="noopener noreferrer" style="color: #1E94A8; text-decoration: none; font-weight: 500;">psicolau.com</a> · Atención Psicológica en Línea
              </p>
              <p style="margin: 8px 0 0; font-size: 10px; color: #CBD5E0;">
                Este correo electrónico contiene información confidencial bajo secreto profesional.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

const enviarConfirmacionPaciente = async (emailPaciente, nombrePaciente, _fechaHora) => {
  try {
    const sNombre = escapeHtml(nombrePaciente);

    const contenidoHtml = `
      <p style="margin: 0 0 16px; font-size: 15px; color: #2D3748; line-height: 1.6;">
        Hola <strong>${sNombre}</strong>, hemos recibido con éxito tu solicitud de atención a través de nuestro sitio web.
      </p>

      <div style="background-color: #FDFBF9; border: 1px solid #FCE4EC; border-left: 4px solid #EC5E86; border-radius: 8px; padding: 14px 18px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; font-weight: 500; color: #1A202C; line-height: 1.5;">
          La <strong>Lic. Laura Gómez Díaz</strong> revisará tu solicitud y se pondrá en contacto contigo a la brevedad vía WhatsApp o correo para acordar el horario de tu sesión y brindarte los detalles para tu atención en línea.
        </p>
      </div>

      <p style="margin: 0; font-size: 14px; color: #4A5568; line-height: 1.6;">
        Gracias por dar este paso y confiar en <strong>PsicoLau — Psicología y Resiliencia</strong>.
      </p>
    `;

    const html = construirPlantillaBase({
      titulo: '¡Solicitud Recibida!',
      subtitulo: 'Nos pondremos en contacto contigo muy pronto para coordinar tu cita.',
      badge: 'Confirmación',
      contenidoHtml,
      botonAccion: {
        texto: 'Escribir por WhatsApp',
        url: 'https://wa.me/525539268393?text=Hola%20Lic.%20Laura%2C%20acabo%20de%20dejar%20mis%20datos%20en%20el%20sitio%20web',
        color: '#25D366'
      },
      textoFooter: 'Si no solicitaste este contacto, puedes hacer caso omiso de este correo.'
    });

    return await enviarEmailResend({
      to: emailPaciente,
      subject: 'Solicitud Recibida - PsicoLau',
      html
    });
  } catch (error) {
    console.warn('Aviso: No se pudo enviar confirmación al paciente:', error.message);
  }
};

const enviarAvisoLaura = async (citaDetalles) => {
  const { paciente, categoria, destinoOverride } = citaDetalles;
  const sNombre = escapeHtml(paciente.nombre);
  const sEmail = escapeHtml(paciente.email);
  const sTelefono = escapeHtml(paciente.telefono);
  const sCategoria = escapeHtml(categoria || 'Consulta Psicológica');
  const telLimpio = paciente.telefono ? escapeHtml(paciente.telefono.replace(/\D/g, '')) : '';

  const replyTo = paciente.email && !paciente.email.startsWith('sin-email-') ? paciente.email : undefined;

  const contenidoHtml = `
    <!-- FICHA DE DATOS DEL PACIENTE -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse: collapse; font-size: 14px;">
      <tr style="border-bottom: 1px solid #EDF2F7;">
        <td style="padding: 12px 0; color: #718096; width: 36%; font-weight: 500;">Paciente</td>
        <td style="padding: 12px 0; color: #1A202C; font-weight: 700;">${sNombre}</td>
      </tr>
      <tr style="border-bottom: 1px solid #EDF2F7;">
        <td style="padding: 12px 0; color: #718096; font-weight: 500;">Correo Electrónico</td>
        <td style="padding: 12px 0; font-weight: 600;">
          <a href="mailto:${sEmail}" style="color: #1E94A8; text-decoration: none;">${sEmail}</a>
        </td>
      </tr>
      <tr style="border-bottom: 1px solid #EDF2F7;">
        <td style="padding: 12px 0; color: #718096; font-weight: 500;">Teléfono / WhatsApp</td>
        <td style="padding: 12px 0; font-weight: 600;">
          ${telLimpio ? `
            <a href="https://wa.me/${telLimpio}" target="_blank" rel="noopener noreferrer" style="color: #1E94A8; text-decoration: none;">
              ${sTelefono} 💬
            </a>
          ` : (sTelefono || 'No proporcionado')}
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 0; color: #718096; font-weight: 500;">Servicio Solicitado</td>
        <td style="padding: 12px 0; color: #1A202C; font-weight: 600;">
          <span style="background-color: #FEF3C7; color: #92400E; font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 6px;">
            ${sCategoria}
          </span>
        </td>
      </tr>
    </table>
  `;

  // Botón directo enfocado en contactar al paciente
  const botonAccion = telLimpio ? {
    texto: `Contactar por WhatsApp (${sTelefono}) →`,
    url: `https://wa.me/${telLimpio}?text=Hola%20${encodeURIComponent(sNombre)}%2C%20te%20saluda%20la%20Lic.%20Laura%20G%C3%B3mez%20de%20PsicoLau.%20Recib%C3%AD%20tu%20solicitud%20en%20el%20sitio%20web.`,
    color: '#25D366'
  } : {
    texto: `Responder a ${sNombre} por Correo →`,
    url: `mailto:${sEmail}?subject=Contacto%20PsicoLau%20-%20Hola%20${encodeURIComponent(sNombre)}`,
    color: '#1E94A8'
  };

  const html = construirPlantillaBase({
    titulo: 'Nueva Solicitud de Consulta',
    subtitulo: 'Un paciente ha dejado sus datos de contacto para ser atendido.',
    badge: 'Nuevo Paciente',
    contenidoHtml,
    botonAccion,
    textoFooter: 'Puedes hacer clic en el botón para contactar al paciente directamente o responder a este correo.'
  });

  return enviarEmailResend({
    to: destinoOverride || CORREO_DESTINO,
    replyTo,
    subject: `Nueva solicitud de consulta - ${sNombre}`,
    html
  });
};

const enviarMensajeContacto = async (datos) => {
  const { nombre, email, telefono, categoria, mensaje } = datos;
  const sNombre = escapeHtml(nombre);
  const sEmail = escapeHtml(email);
  const sTelefono = escapeHtml(telefono);
  const sCategoria = escapeHtml(categoria || 'Consulta General');
  const sMensaje = escapeHtml(mensaje);
  const telLimpio = telefono ? escapeHtml(telefono.replace(/\D/g, '')) : '';

  const contenidoHtml = `
    <!-- FICHA DEL REMITENTE -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
      <tr style="border-bottom: 1px solid #EDF2F7;">
        <td style="padding: 10px 0; color: #718096; width: 36%; font-weight: 500;">Nombre</td>
        <td style="padding: 10px 0; color: #1A202C; font-weight: 700;">${sNombre}</td>
      </tr>
      <tr style="border-bottom: 1px solid #EDF2F7;">
        <td style="padding: 10px 0; color: #718096; font-weight: 500;">Correo Electrónico</td>
        <td style="padding: 10px 0; font-weight: 600;">
          <a href="mailto:${sEmail}" style="color: #1E94A8; text-decoration: none;">${sEmail}</a>
        </td>
      </tr>
      <tr style="border-bottom: 1px solid #EDF2F7;">
        <td style="padding: 10px 0; color: #718096; font-weight: 500;">Teléfono / WhatsApp</td>
        <td style="padding: 10px 0; font-weight: 600;">
          ${telLimpio ? `
            <a href="https://wa.me/${telLimpio}" target="_blank" rel="noopener noreferrer" style="color: #1E94A8; text-decoration: none;">
              ${sTelefono} 💬
            </a>
          ` : (sTelefono || 'No proporcionado')}
        </td>
      </tr>
      <tr>
        <td style="padding: 10px 0; color: #718096; font-weight: 500;">Motivo de Consulta</td>
        <td style="padding: 10px 0; color: #1A202C; font-weight: 600;">
          <span style="background-color: #FEF3C7; color: #92400E; font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 6px;">
            ${sCategoria}
          </span>
        </td>
      </tr>
    </table>

    <!-- MENSAJE DEL PACIENTE -->
    <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px;">
      Mensaje recibido:
    </p>
    <div style="background-color: #F8FAFC; border-left: 4px solid #EC5E86; padding: 14px 18px; border-radius: 6px; font-size: 14px; line-height: 1.6; color: #1E293B; white-space: pre-wrap;">${sMensaje}</div>
  `;

  const html = construirPlantillaBase({
    titulo: 'Nuevo Mensaje de Contacto',
    subtitulo: 'Un visitante te ha escrito desde el formulario web.',
    badge: 'Contacto Web',
    contenidoHtml,
    botonAccion: {
      texto: `Responder a ${sNombre} →`,
      url: `mailto:${sEmail}?subject=Re:%20Tu%20consulta%20en%20PsicoLau`,
      color: '#1E94A8'
    },
    textoFooter: `Puedes responder directamente haciendo clic en el botón o en "Responder" desde tu correo.`
  });

  return enviarEmailResend({
    to: CORREO_DESTINO,
    replyTo: email,
    subject: `Nuevo mensaje de contacto en web - ${sNombre}`,
    html
  });
};

module.exports = {
  enviarConfirmacionPaciente,
  enviarAvisoLaura,
  enviarMensajeContacto,
  enviarEmailResend,
  esDominioFicticio,
  construirPlantillaBase
};
