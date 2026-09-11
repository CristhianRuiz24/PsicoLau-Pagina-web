const prisma = require('../config/db');
const { citaSchema } = require('../utils/validators');
const { enviarConfirmacionPaciente, enviarAvisoLaura } = require('../services/emailService');
const { cifrarPaciente, generarBlindIndex } = require('../utils/crypto');
const logger = require('../utils/logger');

const crearCitaPublica = async (req, res) => {
  // 1. Validar entrada (evita inyección y asegura datos consistentes)
  const validData = citaSchema.parse(req.body);

  // 2. Transacción lógica: Buscar al paciente existente por Blind Index o crearlo cifrado
  const emailHash = generarBlindIndex(validData.email);
  let paciente = await prisma.paciente.findFirst({
    where: { emailHash }
  });

  if (!paciente) {
    const datosCifrados = cifrarPaciente({
      nombre: validData.nombre,
      telefono: validData.telefono,
      email: validData.email
    });
    paciente = await prisma.paciente.create({
      data: datosCifrados
    });
  }

  // 3. Crear la cita (sólo inserción desde el endpoint público)
  const nuevaCita = await prisma.cita.create({
    data: {
      pacienteId: paciente.id,
      fechaHora: validData.fechaHora,
      categoria: validData.categoria
    }
  });

  // 4. Enviar correos de notificación (se envían en segundo plano sin bloquear)
  if (process.env.RESEND_API_KEY) {
    Promise.all([
      enviarConfirmacionPaciente(validData.email, validData.nombre, nuevaCita.fechaHora),
      enviarAvisoLaura({ 
        paciente: { nombre: validData.nombre, email: validData.email, telefono: validData.telefono }, 
        fechaHora: nuevaCita.fechaHora, 
        categoria: nuevaCita.categoria 
      })
    ]).catch(err => logger.error('Error asíncrono al enviar correos de notificación de cita', err));
  }

  res.status(201).json({
    success: true,
    message: 'Cita solicitada exitosamente. Nos pondremos en contacto pronto.'
  });
};

module.exports = {
  crearCitaPublica
};
