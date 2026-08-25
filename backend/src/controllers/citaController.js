const prisma = require('../config/db');
const { citaSchema } = require('../utils/validators');
const { enviarConfirmacionPaciente, enviarAvisoLaura } = require('../services/emailService');

const crearCitaPublica = async (req, res) => {
  try {
    // 1. Validar entrada (evita inyección y asegura datos consistentes)
    const validData = citaSchema.parse(req.body);

    // 2. Transacción lógica: Buscar al paciente existente o crearlo
    let paciente = await prisma.paciente.findUnique({
      where: { email: validData.email }
    });

    if (!paciente) {
      paciente = await prisma.paciente.create({
        data: {
          nombre: validData.nombre,
          telefono: validData.telefono,
          email: validData.email
        }
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
        enviarConfirmacionPaciente(paciente.email, paciente.nombre, nuevaCita.fechaHora),
        enviarAvisoLaura({ paciente, fechaHora: nuevaCita.fechaHora, categoria: nuevaCita.categoria })
      ]).catch(err => console.error('Error al enviar correos:', err));
    }

    res.status(201).json({
      success: true,
      message: 'Cita solicitada exitosamente. Nos pondremos en contacto pronto.',
      data: nuevaCita
    });

  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    console.error('Error al crear cita:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

module.exports = {
  crearCitaPublica
};
