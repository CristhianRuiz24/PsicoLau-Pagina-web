const { contactoSchema } = require('../utils/validators');
const { enviarMensajeContacto } = require('../services/emailService');

const enviarContacto = async (req, res) => {
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
};

module.exports = {
  enviarContacto
};
