const prisma = require('../config/db');

// Obtener todas las citas para la agenda visual
const obtenerCitas = async (req, res) => {
  try {
    const { inicio, fin } = req.query; // opcional: filtrar por semana o mes

    let whereClause = {};
    if (inicio && fin) {
      whereClause.fechaHora = {
        gte: new Date(inicio),
        lte: new Date(fin)
      };
    }

    const citas = await prisma.cita.findMany({
      where: whereClause,
      include: {
        paciente: true // incluimos los datos del paciente (nombre, teléfono, email)
      },
      orderBy: {
        fechaHora: 'asc'
      }
    });

    res.json({ success: true, data: citas });
  } catch (error) {
    console.error('Error al obtener citas:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// Actualizar el estado de la cita (Confirmada, Cancelada, etc)
const actualizarEstadoCita = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado_cita } = req.body; // 'PENDIENTE', 'CONFIRMADA', 'CANCELADA'

    if (!['PENDIENTE', 'CONFIRMADA', 'CANCELADA'].includes(estado_cita)) {
      return res.status(400).json({ success: false, message: 'Estado de cita inválido' });
    }

    const citaActualizada = await prisma.cita.update({
      where: { id: parseInt(id) },
      data: { estado_cita }
    });

    res.json({ success: true, message: 'Estado de cita actualizado', data: citaActualizada });
  } catch (error) {
    console.error('Error al actualizar estado de cita:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// Actualizar estado de pago (Pendiente, Pagado)
const actualizarEstadoPago = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado_pago } = req.body; // 'PENDIENTE', 'PAGADO'

    if (!['PENDIENTE', 'PAGADO'].includes(estado_pago)) {
      return res.status(400).json({ success: false, message: 'Estado de pago inválido' });
    }

    const citaActualizada = await prisma.cita.update({
      where: { id: parseInt(id) },
      data: { estado_pago }
    });

    res.json({ success: true, message: 'Estado de pago actualizado', data: citaActualizada });
  } catch (error) {
    console.error('Error al actualizar pago:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// Crear cita manualmente desde el panel (con soporte para citas recurrentes)
const crearCita = async (req, res) => {
  try {
    const { nombre, telefono, email, fechaHora, categoria, notas, color, repeticiones = 1, frecuencia = 'SEMANAL' } = req.body;
    
    if (!nombre || !fechaHora) {
      return res.status(400).json({ success: false, message: 'Nombre y fecha/hora son obligatorios' });
    }

    // Buscar o asociar paciente existente
    let paciente;
    if (email) {
      paciente = await prisma.paciente.findUnique({ where: { email } });
    } else if (telefono) {
      paciente = await prisma.paciente.findFirst({ where: { nombre, telefono } });
    } else {
      paciente = await prisma.paciente.findFirst({ where: { nombre } });
    }
    
    if (!paciente) {
      const emailSeguro = email || `sin-email-${Date.now()}-${Math.random().toString(36).substring(2, 9)}@local.com`;
      paciente = await prisma.paciente.create({
        data: {
          nombre,
          telefono: telefono || '',
          email: emailSeguro
        }
      });
    } else if (telefono && paciente.telefono !== telefono) {
      await prisma.paciente.update({
        where: { id: paciente.id },
        data: { telefono }
      });
    }

    const totalSesiones = Math.min(Math.max(parseInt(repeticiones) || 1, 1), 24);
    const diasSalto = frecuencia === 'QUINCENAL' ? 14 : 7;
    const citasCreadas = [];
    const fechaBase = new Date(fechaHora);

    for (let i = 0; i < totalSesiones; i++) {
      const fechaSesion = new Date(fechaBase);
      fechaSesion.setDate(fechaBase.getDate() + (i * diasSalto));

      const notaSesion = totalSesiones > 1 
        ? `${notas || categoria || ''}${notas || categoria ? ' · ' : ''}(Sesión ${i + 1}/${totalSesiones})`
        : (notas || categoria || null);

      const nuevaCita = await prisma.cita.create({
        data: {
          pacienteId: paciente.id,
          fechaHora: fechaSesion,
          categoria: notaSesion,
          color: color || '#3EB8CC'
        },
        include: { paciente: true }
      });
      citasCreadas.push(nuevaCita);
    }

    res.status(201).json({ 
      success: true, 
      message: totalSesiones > 1 ? `${totalSesiones} citas recurrentes creadas exitosamente` : 'Cita creada exitosamente', 
      data: citasCreadas[0],
      total: citasCreadas.length
    });
  } catch (error) {
    console.error('Error al crear cita:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// Cancelar cita (Soft Delete: cambia estado_cita a 'CANCELADA')
const cancelarCita = async (req, res) => {
  try {
    const { id } = req.params;

    const citaActualizada = await prisma.cita.update({
      where: { id: parseInt(id) },
      data: { estado_cita: 'CANCELADA' },
      include: { paciente: true }
    });

    res.json({ success: true, message: 'Cita cancelada correctamente', data: citaActualizada });
  } catch (error) {
    console.error('Error al cancelar cita:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// Eliminar cita permanentemente de la base de datos (Hard Delete)
const eliminarCita = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Primero eliminar registros relacionados (notificaciones si las hay)
    await prisma.logNotificacion.deleteMany({
      where: { citaId: parseInt(id) }
    });
    
    await prisma.cita.delete({
      where: { id: parseInt(id) }
    });

    res.json({ success: true, message: 'Cita eliminada permanentemente' });
  } catch (error) {
    console.error('Error al eliminar cita:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// Actualizar cita completa (editar datos del paciente, fecha/hora, notas y color)
const editarCita = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, telefono, email, fechaHora, categoria, notas, color } = req.body;

    const citaExistente = await prisma.cita.findUnique({
      where: { id: parseInt(id) },
      include: { paciente: true }
    });

    if (!citaExistente) {
      return res.status(404).json({ success: false, message: 'Cita no encontrada' });
    }

    // Actualizar datos del paciente
    if (nombre || telefono || email) {
      await prisma.paciente.update({
        where: { id: citaExistente.pacienteId },
        data: {
          ...(nombre && { nombre }),
          ...(telefono !== undefined && { telefono }),
          ...(email && { email })
        }
      });
    }

    // Actualizar cita
    const citaActualizada = await prisma.cita.update({
      where: { id: parseInt(id) },
      data: {
        ...(fechaHora && { fechaHora: new Date(fechaHora) }),
        categoria: notas !== undefined ? notas : (categoria !== undefined ? categoria : citaExistente.categoria),
        ...(color && { color })
      },
      include: { paciente: true }
    });

    res.json({ success: true, message: 'Cita actualizada exitosamente', data: citaActualizada });
  } catch (error) {
    console.error('Error al editar cita:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

module.exports = {
  obtenerCitas,
  actualizarEstadoCita,
  actualizarEstadoPago,
  crearCita,
  editarCita,
  cancelarCita,
  eliminarCita
};
