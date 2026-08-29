const prisma = require('../config/db');
const { cifrar, descifrar } = require('../utils/crypto');
const { parseId, notaExpedienteSchema } = require('../utils/validators');


// Lista de los 8 campos clínicos confidenciales que deben ser cifrados/descifrados
const CAMPOS_CLINICOS = [
  'estadoActual',
  'insightPaciente',
  'eventoPrincipal',
  'intervenciones',
  'formulacionClinica',
  'tareasAsignadas',
  'pendientesProximaSesion',
  'resumenBreve'
];

/**
 * Helper para descifrar un registro de Expediente en memoria.
 */
const descifrarExpediente = (exp) => {
  if (!exp) return null;
  const copia = { ...exp };
  for (const campo of CAMPOS_CLINICOS) {
    if (copia[campo]) {
      copia[campo] = descifrar(copia[campo]);
    }
  }
  return copia;
};

/**
 * Helper para preparar y cifrar el payload de un Expediente antes de persistir.
 */
const cifrarPayloadExpediente = (body) => {
  const payload = {};
  for (const campo of CAMPOS_CLINICOS) {
    if (campo in body) {
      const valor = body[campo];
      // Si el valor es null o string vacío, guardamos null
      payload[campo] = (valor !== null && valor !== undefined && String(valor).trim() !== '') 
        ? cifrar(String(valor).trim()) 
        : null;
    }
  }
  return payload;
};

/**
 * GET /api/pacientes/:id/expediente
 * Obtiene todas las notas de sesión de un paciente, ordenadas por fecha descendente y descifradas en memoria.
 */
const obtenerExpedientePaciente = async (req, res) => {
  try {
    const pacienteId = parseId(req.params.id);
    if (!pacienteId) {
      return res.status(400).json({ success: false, message: 'ID de paciente inválido' });
    }

    const paciente = await prisma.paciente.findUnique({
      where: { id: pacienteId },
      select: {
        id: true,
        nombre: true,
        telefono: true,
        email: true,
        enlaceZoom: true,
        createdAt: true
      }
    });

    if (!paciente) {
      return res.status(404).json({ success: false, message: 'Paciente no encontrado' });
    }

    const nomUpper = (paciente.nombre || '').toUpperCase().trim();
    if (nomUpper.startsWith('[BLOQUEO]') || nomUpper.startsWith('[GRUPAL]')) {
      return res.status(400).json({ success: false, message: 'Este registro corresponde a un evento de agenda y no posee expediente clínico' });
    }

    const notas = await prisma.expediente.findMany({
      where: { pacienteId },
      orderBy: [
        { fechaSesion: 'desc' },
        { id: 'desc' }
      ]
    });

    // Descifrado en memoria de todas las notas
    const notasDescifradas = notas.map(descifrarExpediente);

    res.json({
      success: true,
      paciente,
      data: notasDescifradas,
      total: notasDescifradas.length
    });
  } catch (error) {
    console.error('Error al obtener expediente del paciente:', error);
    res.status(500).json({ success: false, message: 'Error interno al consultar expediente' });
  }
};

/**
 * POST /api/pacientes/:id/expediente
 * Crea una nueva nota de sesión clínica cifrando todos los campos antes de guardar en BD.
 */
const crearNotaExpediente = async (req, res) => {
  try {
    const pacienteId = parseId(req.params.id);
    if (!pacienteId) {
      return res.status(400).json({ success: false, message: 'ID de paciente inválido' });
    }

    const validData = notaExpedienteSchema.parse(req.body);
    const fechaValida = new Date(validData.fechaSesion);

    // Verificar que el paciente exista
    const paciente = await prisma.paciente.findUnique({
      where: { id: pacienteId }
    });

    if (!paciente) {
      return res.status(404).json({ success: false, message: 'Paciente no encontrado' });
    }

    // Cifrar los 8 campos clínicos
    const datosCifrados = cifrarPayloadExpediente(validData);

    const nuevaNota = await prisma.expediente.create({
      data: {
        pacienteId,
        fechaSesion: fechaValida,
        ...datosCifrados
      }
    });

    // Devolver la nota recién creada ya descifrada para el frontend
    const notaDescifrada = descifrarExpediente(nuevaNota);

    res.status(201).json({
      success: true,
      message: 'Nota de sesión clínica guardada de forma segura',
      data: notaDescifrada
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      const msg = error.errors.map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: msg, errors: error.errors });
    }
    console.error('Error al crear nota de expediente:', error);
    res.status(500).json({ success: false, message: 'Error interno al guardar nota clínica' });
  }
};

/**
 * PUT /api/expediente/:id
 * Edita una nota de sesión existente cifrando los datos actualizados.
 */
const editarNotaExpediente = async (req, res) => {
  try {
    const expedienteId = parseId(req.params.id);
    if (!expedienteId) {
      return res.status(400).json({ success: false, message: 'ID de nota clínica inválido' });
    }

    const validData = notaExpedienteSchema.partial().parse(req.body);

    const notaExistente = await prisma.expediente.findUnique({
      where: { id: expedienteId }
    });

    if (!notaExistente) {
      return res.status(404).json({ success: false, message: 'Nota clínica no encontrada' });
    }

    const dataToUpdate = {};

    if (validData.fechaSesion) {
      dataToUpdate.fechaSesion = new Date(validData.fechaSesion);
    }

    // Cifrar los campos actualizados
    const datosCifrados = cifrarPayloadExpediente(validData);
    Object.assign(dataToUpdate, datosCifrados);

    const notaActualizada = await prisma.expediente.update({
      where: { id: expedienteId },
      data: dataToUpdate
    });

    const notaDescifrada = descifrarExpediente(notaActualizada);

    res.json({
      success: true,
      message: 'Nota de sesión clínica actualizada correctamente',
      data: notaDescifrada
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      const msg = error.errors.map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: msg, errors: error.errors });
    }
    console.error('Error al actualizar nota de expediente:', error);
    res.status(500).json({ success: false, message: 'Error interno al actualizar nota clínica' });
  }
};

/**
 * GET /api/pacientes/:id/expediente/buscar?q=texto
 * Busca dentro de las notas de sesión de un paciente descifrando en memoria y filtrando por coincidencia.
 */
const buscarEnExpediente = async (req, res) => {
  try {
    const pacienteId = parseId(req.params.id);
    if (!pacienteId) {
      return res.status(400).json({ success: false, message: 'ID de paciente inválido' });
    }

    const { q } = req.query;
    const queryTerm = (q || '').toLowerCase().trim();

    const paciente = await prisma.paciente.findUnique({
      where: { id: pacienteId },
      select: { id: true, nombre: true, telefono: true, email: true }
    });

    if (!paciente) {
      return res.status(404).json({ success: false, message: 'Paciente no encontrado' });
    }

    // Traemos todas las notas de este paciente
    const notas = await prisma.expediente.findMany({
      where: { pacienteId },
      orderBy: [
        { fechaSesion: 'desc' },
        { id: 'desc' }
      ]
    });

    // Descifrado en memoria
    const notasDescifradas = notas.map(descifrarExpediente);

    // Si no hay término de búsqueda, devolvemos todo
    if (!queryTerm) {
      return res.json({
        success: true,
        paciente,
        query: '',
        data: notasDescifradas,
        total: notasDescifradas.length
      });
    }

    // Filtrar en memoria por coincidencia case-insensitive en los 8 campos clínicos
    const resultados = notasDescifradas.filter(nota => {
      return CAMPOS_CLINICOS.some(campo => {
        const valor = nota[campo];
        return valor && typeof valor === 'string' && valor.toLowerCase().includes(queryTerm);
      });
    });

    res.json({
      success: true,
      paciente,
      query: queryTerm,
      data: resultados,
      total: resultados.length
    });
  } catch (error) {
    console.error('Error al buscar en expediente:', error);
    res.status(500).json({ success: false, message: 'Error interno en la búsqueda de notas' });
  }
};

/**
 * DELETE /api/expediente/:id
 * Elimina una nota de sesión específica.
 */
const eliminarNotaExpediente = async (req, res) => {
  try {
    const expedienteId = parseId(req.params.id);
    if (!expedienteId) {
      return res.status(400).json({ success: false, message: 'ID de nota clínica inválido' });
    }

    const nota = await prisma.expediente.findUnique({
      where: { id: expedienteId }
    });

    if (!nota) {
      return res.status(404).json({ success: false, message: 'Nota clínica no encontrada' });
    }

    await prisma.expediente.delete({
      where: { id: expedienteId }
    });

    res.json({
      success: true,
      message: 'Nota clínica eliminada correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar nota clínica:', error);
    res.status(500).json({ success: false, message: 'Error interno al eliminar nota' });
  }
};

/**
 * GET /api/pacientes
 * Directorio general de pacientes con métricas de sesiones y citas para el buscador del panel.
 */
const listarDirectorioPacientes = async (req, res) => {
  try {
    const { q } = req.query;
    const query = (q || '').trim();

    let whereClause = {};
    if (query) {
      whereClause = {
        OR: [
          { nombre: { contains: query, mode: 'insensitive' } },
          { telefono: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } }
        ]
      };
    }

    const pacientes = await prisma.paciente.findMany({
      where: whereClause,
      select: {
        id: true,
        nombre: true,
        telefono: true,
        email: true,
        enlaceZoom: true,
        tarifaDefecto: true,
        createdAt: true,
        _count: {
          select: {
            expedientes: true,
            citas: {
              where: { estado_cita: { not: 'CANCELADA' } }
            }
          }
        },
        expedientes: {
          take: 1,
          orderBy: { fechaSesion: 'desc' },
          select: { fechaSesion: true }
        }
      },
      orderBy: { nombre: 'asc' }
    });

    // Excluir registros automáticos que sean de bloqueos personales o terapias grupales
    const filtrados = pacientes.filter(p => {
      const nomUpper = (p.nombre || '').toUpperCase().trim();
      return !nomUpper.startsWith('[BLOQUEO]') && !nomUpper.startsWith('[GRUPAL]');
    });

    res.json({
      success: true,
      data: filtrados
    });
  } catch (error) {
    console.error('Error al listar directorio de pacientes:', error);
    res.status(500).json({ success: false, message: 'Error interno al listar directorio' });
  }
};

/**
 * DELETE /api/pacientes/:id
 * Elimina un paciente completo y todos sus datos asociados (solo si no tiene citas activas).
 */
const eliminarPaciente = async (req, res) => {
  try {
    const pacienteId = parseId(req.params.id);
    if (!pacienteId) {
      return res.status(400).json({ success: false, message: 'ID de paciente inválido' });
    }

    const paciente = await prisma.paciente.findUnique({
      where: { id: pacienteId }
    });

    if (!paciente) {
      return res.status(404).json({ success: false, message: 'Paciente no encontrado' });
    }

    // Regla de negocio estricta: Solo permitir eliminar expedientes de pacientes NO agendados (o con citas canceladas)
    const citasActivas = await prisma.cita.count({
      where: {
        pacienteId,
        estado_cita: { not: 'CANCELADA' }
      }
    });

    if (citasActivas > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar el expediente de "${paciente.nombre}" porque tiene ${citasActivas} cita(s) activa(s) en la agenda. Primero elimina o cancela sus citas en el calendario.`
      });
    }

    // Transacción para eliminar notas de expediente, citas canceladas residuales y paciente
    await prisma.$transaction(async (tx) => {
      const citasResiduales = await tx.cita.findMany({
        where: { pacienteId },
        select: { id: true }
      });
      const citaIds = citasResiduales.map(c => c.id);

      if (citaIds.length > 0) {
        await tx.logNotificacion.deleteMany({
          where: { citaId: { in: citaIds } }
        });
        await tx.cita.deleteMany({
          where: { id: { in: citaIds } }
        });
      }

      await tx.expediente.deleteMany({
        where: { pacienteId }
      });

      await tx.paciente.delete({
        where: { id: pacienteId }
      });
    });

    res.json({
      success: true,
      message: `Expediente y paciente "${paciente.nombre}" eliminados permanentemente`
    });


  } catch (error) {
    console.error('Error al eliminar paciente:', error);
    res.status(500).json({ success: false, message: 'Error interno al eliminar paciente' });
  }
};

module.exports = {
  obtenerExpedientePaciente,
  crearNotaExpediente,
  editarNotaExpediente,
  buscarEnExpediente,
  eliminarNotaExpediente,
  listarDirectorioPacientes,
  eliminarPaciente
};

