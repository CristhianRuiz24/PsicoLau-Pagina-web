const prisma = require('../config/db');
const { parseId, crearCitaAdminSchema, editarCitaAdminSchema } = require('../utils/validators');
const logger = require('../utils/logger');
const {
  parseMontoValido,
  normalizarNombresYCategorias,
  validarEmailUnicoPaciente,
  buscarOCrearPacienteParaCita,
  obtenerCitasFuturasDeSerie
} = require('../utils/agendaHelpers');

// Obtener todas las citas para la agenda visual
const obtenerCitas = async (req, res) => {
  try {
    const { inicio, fin } = req.query; // opcional: filtrar por semana o mes

    let whereClause = {};
    if (inicio && fin) {
      const fechaInicio = new Date(inicio);
      const fechaFin = new Date(fin);

      if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
        return res.status(400).json({ success: false, message: 'Parámetros de fecha inválidos (inicio o fin)' });
      }

      whereClause.fechaHora = {
        gte: fechaInicio,
        lte: fechaFin
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
    logger.error('Error al obtener citas', error);
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
    logger.error('Error al actualizar estado de cita', error);
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
    logger.error('Error al actualizar pago', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// Crear cita manualmente desde el panel (con soporte para citas recurrentes)
const crearCita = async (req, res) => {
  try {
    const validData = crearCitaAdminSchema.parse(req.body);
    const { 
      nombre, 
      telefono, 
      email, 
      enlaceZoom, 
      fechaHora, 
      categoria, 
      notas, 
      color, 
      repeticiones = 1, 
      frecuencia = 'SEMANAL', 
      monto 
    } = validData;

    const montoValido = parseMontoValido(monto);
    const nombreLimpio = nombre.trim();
    const emailLimpio = email ? email.trim() : null;
    const telefonoLimpio = telefono ? telefono.trim() : null;
    const enlaceZoomLimpio = enlaceZoom !== undefined ? (enlaceZoom ? enlaceZoom.trim() : null) : undefined;

    const esBloqueo = (nombreLimpio && nombreLimpio.startsWith('[BLOQUEO]')) || (notas && notas.startsWith('[BLOQUEO]')) || (categoria && categoria.startsWith('[BLOQUEO]'));
    const esGrupal = (nombreLimpio && nombreLimpio.startsWith('[GRUPAL]')) || (notas && notas.startsWith('[GRUPAL]')) || (categoria && categoria.startsWith('[GRUPAL]'));

    const paciente = await buscarOCrearPacienteParaCita(prisma, {
      nombreLimpio,
      emailLimpio,
      telefonoLimpio,
      enlaceZoomLimpio,
      montoValido,
      esBloqueo,
      esGrupal
    });

    const montoFinal = esBloqueo ? 0 : (montoValido !== null ? montoValido : (paciente.tarifaDefecto !== null && paciente.tarifaDefecto !== undefined ? paciente.tarifaDefecto : 500));

    const totalSesiones = Math.min(Math.max(parseInt(repeticiones) || 1, 1), 24);
    const diasSalto = frecuencia === 'QUINCENAL' ? 14 : 7;
    const citasCreadas = [];
    const fechaBase = new Date(fechaHora);
    const serieId = totalSesiones > 1 ? `serie_${Date.now()}_${Math.random().toString(36).substring(2, 9)}` : null;

    for (let i = 0; i < totalSesiones; i++) {
      const fechaSesion = new Date(fechaBase);
      fechaSesion.setDate(fechaBase.getDate() + (i * diasSalto));

      const notaSesion = notas || categoria || null;

      const nuevaCita = await prisma.cita.create({
        data: {
          pacienteId: paciente.id,
          fechaHora: fechaSesion,
          categoria: notaSesion,
          color: color || '#3EB8CC',
          monto: montoFinal,
          serieId: serieId
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
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        success: false, 
        message: 'Ya existe otro paciente registrado con ese correo electrónico en el sistema.' 
      });
    }
    if (error.name === 'ZodError') {
      const msg = error.errors.map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: msg, errors: error.errors });
    }
    logger.error('Error al crear cita', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// Cancelar cita (Soft Delete: cambia estado_cita a 'CANCELADA', con soporte para serie)
const cancelarCita = async (req, res) => {
  try {
    const citaId = parseId(req.params.id);
    if (!citaId) {
      return res.status(400).json({ success: false, message: 'ID de cita inválido' });
    }

    const { alcance = 'SOLO_ESTA' } = req.body || {};

    const citaExistente = await prisma.cita.findUnique({
      where: { id: citaId },
      include: { paciente: true }
    });

    if (!citaExistente) {
      return res.status(404).json({ success: false, message: 'Cita no encontrada' });
    }

    if (alcance === 'ESTA_Y_SIGUIENTES') {
      const citasFuturas = await obtenerCitasFuturasDeSerie(citaExistente, prisma);
      const idsACancelar = [citaId, ...citasFuturas.map(c => c.id)];

      await prisma.cita.updateMany({
        where: { id: { in: idsACancelar } },
        data: { estado_cita: 'CANCELADA' }
      });

      return res.json({ 
        success: true, 
        message: `${idsACancelar.length} citas de la serie canceladas correctamente`,
        totalCanceladas: idsACancelar.length
      });
    }

    const citaActualizada = await prisma.cita.update({
      where: { id: citaId },
      data: { estado_cita: 'CANCELADA' },
      include: { paciente: true }
    });

    res.json({ success: true, message: 'Cita cancelada correctamente', data: citaActualizada });
  } catch (error) {
    logger.error('Error al cancelar cita', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// Eliminar cita permanentemente de la base de datos (Hard Delete con transacción atómica y soporte para serie)
const eliminarCita = async (req, res) => {
  try {
    const citaId = parseId(req.params.id);
    if (!citaId) {
      return res.status(400).json({ success: false, message: 'ID de cita inválido' });
    }

    const { alcance = 'SOLO_ESTA' } = req.body || req.query || {};
    
    // Obtener la cita para conocer el pacienteId y serieId
    const cita = await prisma.cita.findUnique({
      where: { id: citaId }
    });

    if (!cita) {
      return res.status(404).json({ success: false, message: 'Cita no encontrada' });
    }

    if (alcance === 'ESTA_Y_SIGUIENTES') {
      const citasFuturas = await obtenerCitasFuturasDeSerie(cita, prisma);
      const idsAEliminar = [citaId, ...citasFuturas.map(c => c.id)];

      await prisma.$transaction(async (tx) => {
        // Eliminar notificaciones de todas las citas involucradas
        await tx.logNotificacion.deleteMany({
          where: { citaId: { in: idsAEliminar } }
        });
        
        // Eliminar las citas
        await tx.cita.deleteMany({
          where: { id: { in: idsAEliminar } }
        });

        // Si el paciente no tiene más citas ni expedientes, limpiar registro huérfano
        const totalCitasRestantes = await tx.cita.count({ where: { pacienteId: cita.pacienteId } });
        const totalExpRestantes = await tx.expediente.count({ where: { pacienteId: cita.pacienteId } });
        if (totalCitasRestantes === 0 && totalExpRestantes === 0) {
          await tx.paciente.delete({ where: { id: cita.pacienteId } });
        }
      });

      return res.json({ 
        success: true, 
        message: `${idsAEliminar.length} citas de la serie eliminadas permanentemente`,
        totalEliminadas: idsAEliminar.length
      });
    }

    // Ejecutar eliminación atómica individual en transacción
    await prisma.$transaction(async (tx) => {
      // Eliminar notificaciones si las hay
      await tx.logNotificacion.deleteMany({
        where: { citaId: citaId }
      });
      
      // Eliminar la cita
      await tx.cita.delete({
        where: { id: citaId }
      });

      // Si el paciente no tiene más citas ni expedientes, limpiar registro huérfano
      const totalCitasRestantes = await tx.cita.count({ where: { pacienteId: cita.pacienteId } });
      const totalExpRestantes = await tx.expediente.count({ where: { pacienteId: cita.pacienteId } });
      if (totalCitasRestantes === 0 && totalExpRestantes === 0) {
        await tx.paciente.delete({ where: { id: cita.pacienteId } });
      }
    });

    res.json({ success: true, message: 'Cita eliminada permanentemente' });
  } catch (error) {
    logger.error('Error al eliminar cita', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// Actualizar cita completa (editar datos del paciente, fecha/hora, notas, color, monto y propagación en serie)
const editarCita = async (req, res) => {
  try {
    const citaId = parseId(req.params.id);
    if (!citaId) {
      return res.status(400).json({ success: false, message: 'ID de cita inválido' });
    }

    const validData = editarCitaAdminSchema.parse(req.body);
    const { nombre, telefono, email, enlaceZoom, fechaHora, categoria, notas, color, monto, estado_cita, estado_pago, alcance = 'SOLO_ESTA' } = validData;

    const emailLimpio = email ? email.trim() : (email === '' ? '' : null);
    const telefonoLimpio = telefono ? telefono.trim() : (telefono === '' ? '' : null);
    const enlaceZoomLimpio = enlaceZoom !== undefined ? (enlaceZoom ? enlaceZoom.trim() : null) : undefined;

    const citaExistente = await prisma.cita.findUnique({
      where: { id: citaId },
      include: { paciente: true }
    });

    if (!citaExistente) {
      return res.status(404).json({ success: false, message: 'Cita no encontrada' });
    }

    const eraBloqueo = (citaExistente.categoria && citaExistente.categoria.startsWith('[BLOQUEO]')) || (citaExistente.paciente && citaExistente.paciente.nombre.startsWith('[BLOQUEO]'));
    const eraGrupal = (citaExistente.categoria && citaExistente.categoria.startsWith('[GRUPAL]')) || (citaExistente.paciente && citaExistente.paciente.nombre.startsWith('[GRUPAL]'));
    const eraEvaluacion = (citaExistente.categoria && citaExistente.categoria.startsWith('[EVALUACION]')) || (citaExistente.paciente && citaExistente.paciente.nombre.startsWith('[EVALUACION]'));

    const montoValido = parseMontoValido(monto);

    const { nombreFinal, categoriaFinal } = normalizarNombresYCategorias({
      nombre,
      notas,
      categoria,
      eraBloqueo,
      eraGrupal,
      eraEvaluacion,
      categoriaExistente: citaExistente.categoria
    });

    // Validar unicidad de correo si se proporciona uno nuevo para el paciente
    const { emailFinal, error: errorEmail } = await validarEmailUnicoPaciente(prisma, {
      eraBloqueo,
      eraGrupal,
      email,
      emailLimpio,
      pacienteActual: citaExistente.paciente
    });

    if (errorEmail) {
      return res.status(400).json({ success: false, message: errorEmail });
    }

    // 1. Si el alcance es ESTA_Y_SIGUIENTES: ejecutar propagación en serie con transacción atómica
    if (alcance === 'ESTA_Y_SIGUIENTES') {
      let deltaMs = 0;
      if (fechaHora) {
        const nuevaFechaMs = new Date(fechaHora).getTime();
        const fechaOrigMs = new Date(citaExistente.fechaHora).getTime();
        deltaMs = nuevaFechaMs - fechaOrigMs;
      }

      const citasFuturas = await obtenerCitasFuturasDeSerie(citaExistente, prisma);

      const resultado = await prisma.$transaction(async (tx) => {
        // Actualizar datos del paciente
        if (nombreFinal || telefono !== undefined || email !== undefined || enlaceZoom !== undefined || (montoValido !== null && !eraBloqueo && !eraGrupal)) {
          await tx.paciente.update({
            where: { id: citaExistente.pacienteId },
            data: {
              ...(nombreFinal && { nombre: nombreFinal }),
              ...(telefono !== undefined && { telefono: (eraBloqueo || eraGrupal) ? '' : (telefono ? telefono.trim() : '') }),
              ...(email !== undefined && { email: emailFinal }),
              ...(enlaceZoom !== undefined && { enlaceZoom: eraBloqueo ? null : (enlaceZoom ? enlaceZoom.trim() : null) }),
              ...(montoValido !== null && !eraBloqueo && !eraGrupal && { tarifaDefecto: montoValido })
            }
          });
        }

        // Actualizar cita base
        const citaBaseActualizada = await tx.cita.update({
          where: { id: citaId },
          data: {
            ...(fechaHora && { fechaHora: new Date(fechaHora) }),
            categoria: categoriaFinal,
            ...(color && { color }),
            ...(montoValido !== null && { monto: montoValido }),
            ...(estado_cita && { estado_cita }),
            ...(estado_pago && { estado_pago })
          },
          include: { paciente: true }
        });

        // Actualizar citas futuras vinculadas
        let totalActualizadas = 1;
        for (const citaFutura of citasFuturas) {
          const updateData = {};

          // RF-5, RF-6: Desplazar fechaHora solo si no está REALIZADA
          if (deltaMs !== 0 && citaFutura.estado_cita !== 'REALIZADA') {
            const fechaFuturaOrig = new Date(citaFutura.fechaHora).getTime();
            updateData.fechaHora = new Date(fechaFuturaOrig + deltaMs);
          }

          // Color
          if (color) {
            updateData.color = color;
          }

          // RF-7: Monto (si no ha sido pagada, aplicar nuevo monto; si ya está PAGADO, conservar pago)
          if (montoValido !== null && citaFutura.estado_pago !== 'PAGADO') {
            updateData.monto = montoValido;
          }

          // Notas / Categoría limpias
          if (categoriaFinal !== undefined) {
            updateData.categoria = categoriaFinal;
          }

          if (Object.keys(updateData).length > 0) {
            await tx.cita.update({
              where: { id: citaFutura.id },
              data: updateData
            });
            totalActualizadas++;
          }
        }

        return { citaBaseActualizada, totalActualizadas };
      });

      return res.json({ 
        success: true, 
        message: `${resultado.totalActualizadas} citas de la serie actualizadas exitosamente`, 
        data: resultado.citaBaseActualizada,
        totalActualizadas: resultado.totalActualizadas
      });
    }

    // 2. Alcance SOLO_ESTA: Actualización individual
    if (nombreFinal || telefono !== undefined || email !== undefined || enlaceZoom !== undefined || (montoValido !== null && !eraBloqueo && !eraGrupal)) {
      await prisma.paciente.update({
        where: { id: citaExistente.pacienteId },
        data: {
          ...(nombreFinal && { nombre: nombreFinal }),
          ...(telefono !== undefined && { telefono: (eraBloqueo || eraGrupal) ? '' : (telefono ? telefono.trim() : '') }),
          ...(email !== undefined && { email: emailFinal }),
          ...(enlaceZoom !== undefined && { enlaceZoom: eraBloqueo ? null : (enlaceZoom ? enlaceZoom.trim() : null) }),
          ...(montoValido !== null && !eraBloqueo && !eraGrupal && { tarifaDefecto: montoValido })
        }
      });
    }

    // Actualizar cita
    const citaActualizada = await prisma.cita.update({
      where: { id: citaId },
      data: {
        ...(fechaHora && { fechaHora: new Date(fechaHora) }),
        categoria: categoriaFinal,
        ...(color && { color }),
        ...(montoValido !== null && { monto: montoValido }),
        ...(estado_cita && { estado_cita }),
        ...(estado_pago && { estado_pago })
      },
      include: { paciente: true }
    });

    res.json({ success: true, message: 'Cita actualizada exitosamente', data: citaActualizada });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        success: false, 
        message: 'Ya existe otro paciente registrado con ese correo electrónico. Por favor usa otro o déjalo vacío.' 
      });
    }
    if (error.name === 'ZodError') {
      const msg = error.errors.map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: msg, errors: error.errors });
    }
    logger.error('Error al editar cita', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// Actualizar únicamente el monto de una cita (PATCH rápido)
const actualizarMontoCita = async (req, res) => {
  try {
    const citaId = parseId(req.params.id);
    if (!citaId) {
      return res.status(400).json({ success: false, message: 'ID de cita inválido' });
    }

    const { monto } = req.body;
    const parsedMonto = parseFloat(monto);
    if (isNaN(parsedMonto) || parsedMonto < 0) {
      return res.status(400).json({ success: false, message: 'El monto debe ser un número mayor o igual a 0' });
    }

    const citaActualizada = await prisma.cita.update({
      where: { id: citaId },
      data: { monto: parsedMonto },
      include: { paciente: true }
    });

    res.json({ success: true, message: 'Monto actualizado exitosamente', data: citaActualizada });
  } catch (error) {
    logger.error('Error al actualizar monto de cita', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

module.exports = {
  obtenerCitas,
  actualizarEstadoCita,
  actualizarEstadoPago,
  crearCita,
  editarCita,
  actualizarMontoCita,
  cancelarCita,
  eliminarCita,
  obtenerCitasFuturasDeSerie
};
