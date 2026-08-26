const prisma = require('../config/db');

// Helper para validar IDs numéricos positivos
const parseId = (id) => {
  const parsed = parseInt(id, 10);
  return (isNaN(parsed) || parsed <= 0) ? null : parsed;
};

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

// Actualizar el estado de la cita (Pendiente, Confirmada, Realizada, Cancelada)
const actualizarEstadoCita = async (req, res) => {
  try {
    const citaId = parseId(req.params.id);
    if (!citaId) {
      return res.status(400).json({ success: false, message: 'ID de cita inválido' });
    }

    const { estado_cita } = req.body; // 'PENDIENTE', 'CONFIRMADA', 'REALIZADA', 'CANCELADA'

    if (!['PENDIENTE', 'CONFIRMADA', 'REALIZADA', 'CANCELADA'].includes(estado_cita)) {
      return res.status(400).json({ success: false, message: 'Estado de cita inválido' });
    }

    const citaActualizada = await prisma.cita.update({
      where: { id: citaId },
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
    const citaId = parseId(req.params.id);
    if (!citaId) {
      return res.status(400).json({ success: false, message: 'ID de cita inválido' });
    }

    const { estado_pago } = req.body; // 'PENDIENTE', 'PAGADO'

    if (!['PENDIENTE', 'PAGADO'].includes(estado_pago)) {
      return res.status(400).json({ success: false, message: 'Estado de pago inválido' });
    }

    const citaActualizada = await prisma.cita.update({
      where: { id: citaId },
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
    const { nombre, telefono, email, enlaceZoom, fechaHora, categoria, notas, color, repeticiones = 1, frecuencia = 'SEMANAL' } = req.body;
    
    if (!nombre || !fechaHora) {
      return res.status(400).json({ success: false, message: 'Nombre y fecha/hora son obligatorios' });
    }

    // Buscar o asociar paciente existente (comparación flexible e insensible a mayúsculas/minúsculas)
    const nombreLimpio = nombre.trim();
    const emailLimpio = email ? email.trim() : null;
    const telefonoLimpio = telefono ? telefono.trim() : null;
    const enlaceZoomLimpio = enlaceZoom !== undefined ? (enlaceZoom ? enlaceZoom.trim() : null) : undefined;

    let paciente;
    if (emailLimpio) {
      paciente = await prisma.paciente.findFirst({
        where: { email: { equals: emailLimpio, mode: 'insensitive' } }
      });
    }

    if (!paciente && telefonoLimpio) {
      paciente = await prisma.paciente.findFirst({
        where: {
          telefono: { equals: telefonoLimpio },
          nombre: { equals: nombreLimpio, mode: 'insensitive' }
        }
      });
    }

    if (!paciente) {
      paciente = await prisma.paciente.findFirst({
        where: { nombre: { equals: nombreLimpio, mode: 'insensitive' } }
      });
    }
    
    if (!paciente) {
      const emailSeguro = emailLimpio || `sin-email-${Date.now()}-${Math.random().toString(36).substring(2, 9)}@local.com`;
      paciente = await prisma.paciente.create({
        data: {
          nombre: nombreLimpio,
          telefono: telefonoLimpio || '',
          email: emailSeguro,
          enlaceZoom: enlaceZoomLimpio || null
        }
      });
    } else {
      // Actualizar datos de contacto y Zoom si cambiaron
      const dataUpdate = {};
      if (telefonoLimpio && paciente.telefono !== telefonoLimpio) dataUpdate.telefono = telefonoLimpio;
      if (emailLimpio && (!paciente.email || paciente.email.startsWith('sin-email-'))) dataUpdate.email = emailLimpio;
      if (enlaceZoomLimpio) dataUpdate.enlaceZoom = enlaceZoomLimpio;
      if (Object.keys(dataUpdate).length > 0) {
        await prisma.paciente.update({
          where: { id: paciente.id },
          data: dataUpdate
        });
      }
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
    const citaId = parseId(req.params.id);
    if (!citaId) {
      return res.status(400).json({ success: false, message: 'ID de cita inválido' });
    }

    const citaActualizada = await prisma.cita.update({
      where: { id: citaId },
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
    const citaId = parseId(req.params.id);
    if (!citaId) {
      return res.status(400).json({ success: false, message: 'ID de cita inválido' });
    }
    
    // Obtener la cita para conocer el pacienteId
    const cita = await prisma.cita.findUnique({
      where: { id: citaId }
    });

    if (!cita) {
      return res.status(404).json({ success: false, message: 'Cita no encontrada' });
    }

    // Eliminar notificaciones si las hay
    await prisma.logNotificacion.deleteMany({
      where: { citaId: citaId }
    });
    
    // Eliminar la cita
    await prisma.cita.delete({
      where: { id: citaId }
    });

    // Si el paciente no tiene más citas ni expedientes, limpiar registro huérfano
    const totalCitasRestantes = await prisma.cita.count({ where: { pacienteId: cita.pacienteId } });
    const totalExpRestantes = await prisma.expediente.count({ where: { pacienteId: cita.pacienteId } });
    if (totalCitasRestantes === 0 && totalExpRestantes === 0) {
      await prisma.paciente.delete({ where: { id: cita.pacienteId } }).catch(() => {});
    }

    res.json({ success: true, message: 'Cita eliminada permanentemente' });
  } catch (error) {
    console.error('Error al eliminar cita:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};


// Actualizar cita completa (editar datos del paciente, fecha/hora, notas y color)
const editarCita = async (req, res) => {
  try {
    const citaId = parseId(req.params.id);
    if (!citaId) {
      return res.status(400).json({ success: false, message: 'ID de cita inválido' });
    }

    const { nombre, telefono, email, enlaceZoom, fechaHora, categoria, notas, color } = req.body;

    const citaExistente = await prisma.cita.findUnique({
      where: { id: citaId },
      include: { paciente: true }
    });

    if (!citaExistente) {
      return res.status(404).json({ success: false, message: 'Cita no encontrada' });
    }

    const eraBloqueo = (citaExistente.categoria && citaExistente.categoria.startsWith('[BLOQUEO]')) || (citaExistente.paciente && citaExistente.paciente.nombre.startsWith('[BLOQUEO]'));
    const eraGrupal = (citaExistente.categoria && citaExistente.categoria.startsWith('[GRUPAL]')) || (citaExistente.paciente && citaExistente.paciente.nombre.startsWith('[GRUPAL]'));

    let nombreFinal = nombre;
    let categoriaFinal = notas !== undefined ? notas : (categoria !== undefined ? categoria : citaExistente.categoria);

    if (nombreFinal) {
      const nomLimpio = nombreFinal.replace(/^\[(BLOQUEO|GRUPAL)\]\s*/i, '').trim();
      if (eraBloqueo) {
        nombreFinal = `[BLOQUEO] ${nomLimpio}`;
      } else if (eraGrupal) {
        nombreFinal = `[GRUPAL] ${nomLimpio}`;
      } else {
        nombreFinal = nomLimpio;
      }
    }

    if (categoriaFinal) {
      const catLimpia = categoriaFinal.replace(/^\[(BLOQUEO|GRUPAL)\]\s*/i, '').trim();
      if (eraBloqueo) {
        categoriaFinal = `[BLOQUEO] ${catLimpia}`.trim();
      } else if (eraGrupal) {
        categoriaFinal = `[GRUPAL] ${catLimpia}`.trim();
      } else {
        categoriaFinal = catLimpia;
      }
    }

    // Actualizar datos del paciente preservando naturaleza de origen
    if (nombreFinal || telefono !== undefined || email !== undefined || enlaceZoom !== undefined) {
      await prisma.paciente.update({
        where: { id: citaExistente.pacienteId },
        data: {
          ...(nombreFinal && { nombre: nombreFinal }),
          ...(telefono !== undefined && { telefono: (eraBloqueo || eraGrupal) ? '' : telefono }),
          ...(email !== undefined && { email: eraBloqueo ? '' : (eraGrupal ? citaExistente.paciente.email : email) }),
          ...(enlaceZoom !== undefined && { enlaceZoom: eraBloqueo ? null : (enlaceZoom ? enlaceZoom.trim() : null) })
        }
      });
    }

    // Actualizar cita
    const citaActualizada = await prisma.cita.update({
      where: { id: citaId },
      data: {
        ...(fechaHora && { fechaHora: new Date(fechaHora) }),
        categoria: categoriaFinal,
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
