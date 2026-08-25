const { enviarMensajeContacto } = require('../services/emailService');

const enviarContacto = async (req, res) => {
  try {
    const { nombre, email, telefono, categoria, mensaje } = req.body;

    if (!nombre || !email || !mensaje) {
      return res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
    }

    if (process.env.RESEND_API_KEY) {
      await enviarMensajeContacto({ nombre, email, telefono, categoria, mensaje });
    }

    res.status(200).json({
      success: true,
      message: 'Mensaje enviado correctamente. La Lic. Laura te contactará pronto.'
    });

  } catch (error) {
    console.error('Error al enviar contacto:', error);
    res.status(500).json({ success: false, message: 'Error interno al enviar el mensaje' });
  }
};

module.exports = {
  enviarContacto
};
