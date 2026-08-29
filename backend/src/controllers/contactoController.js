const { contactoSchema } = require('../utils/validators');
const { enviarMensajeContacto } = require('../services/emailService');

const enviarContacto = async (req, res) => {
  try {
    const validData = contactoSchema.parse(req.body);

    if (process.env.RESEND_API_KEY) {
      await enviarMensajeContacto({
        nombre: validData.nombre,
        email: validData.email,
        telefono: validData.telefono || '',
        categoria: validData.categoria || '',
        mensaje: validData.mensaje
      });
    }

    res.status(200).json({
      success: true,
      message: 'Mensaje enviado correctamente. La Lic. Laura te contactará pronto.'
    });

  } catch (error) {
    if (error.name === 'ZodError') {
      const msg = error.errors.map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: msg, errors: error.errors });
    }
    console.error('Error al enviar contacto:', error);
    res.status(500).json({ success: false, message: 'Error interno al enviar el mensaje' });
  }
};

module.exports = {
  enviarContacto
};

