/**
 * agendaHelpers.js — Funciones auxiliares para la gestión de citas y series en la agenda.
 * Desacopla la lógica de negocio, normalización y validaciones de agendaController.js.
 */

/**
 * Valida y convierte un monto a número flotante >= 0
 * @param {any} monto 
 * @returns {number|null} Monto numérico o null si no es válido
 */
const parseMontoValido = (monto) => {
  if (monto === undefined || monto === null || monto === '') {
    return null;
  }
  const parsed = parseFloat(monto);
  return (!isNaN(parsed) && parsed >= 0) ? parsed : null;
};

/**
 * Normaliza nombres y categorías/notas preservando o ajustando las etiquetas clínicas
 * @param {Object} params
 * @returns {{ nombreFinal: string, categoriaFinal: string }}
 */
const normalizarNombresYCategorias = ({ nombre, notas, categoria, eraBloqueo, eraGrupal, eraEvaluacion, categoriaExistente }) => {
  let nombreFinal = nombre;
  let categoriaFinal = notas !== undefined ? notas : (categoria !== undefined ? categoria : categoriaExistente);

  if (nombreFinal) {
    const nomLimpio = nombreFinal.replace(/^\[(BLOQUEO|GRUPAL|EVALUACION)\]\s*/i, '').trim();
    if (eraBloqueo) {
      nombreFinal = `[BLOQUEO] ${nomLimpio}`;
    } else if (eraGrupal) {
      nombreFinal = `[GRUPAL] ${nomLimpio}`;
    } else {
      nombreFinal = nomLimpio;
    }
  }

  if (categoriaFinal) {
    const catLimpia = categoriaFinal.replace(/^\[(BLOQUEO|GRUPAL|EVALUACION)\]\s*/i, '').trim();
    if (eraBloqueo) {
      categoriaFinal = `[BLOQUEO] ${catLimpia}`.trim();
    } else if (eraGrupal) {
      categoriaFinal = `[GRUPAL] ${catLimpia}`.trim();
    } else if (eraEvaluacion) {
      categoriaFinal = `[EVALUACION] ${catLimpia}`.trim();
    } else {
      categoriaFinal = catLimpia;
    }
  }

  return { nombreFinal, categoriaFinal };
};

const { cifrarPaciente, descifrarPaciente, generarBlindIndex } = require('./crypto');

/**
 * Valida la unicidad del correo electrónico al editar un paciente para prevenir error P2002
 * @param {Object} prisma - Cliente Prisma
 * @param {Object} params
 * @returns {Promise<{ emailFinal?: string, error?: string }>}
 */
const validarEmailUnicoPaciente = async (prisma, { eraBloqueo, eraGrupal, email, emailLimpio, pacienteActual }) => {
  let emailFinal = pacienteActual ? pacienteActual.email : undefined;

  if (!eraBloqueo && !eraGrupal && email !== undefined) {
    if (emailLimpio) {
      const emailHash = generarBlindIndex(emailLimpio);
      if (!pacienteActual || emailHash !== pacienteActual.emailHash) {
        const pacienteExistente = await prisma.paciente.findFirst({
          where: {
            OR: [
              { emailHash },
              { email: { equals: emailLimpio, mode: 'insensitive' } }
            ],
            ...(pacienteActual && { id: { not: pacienteActual.id } })
          }
        });

        if (pacienteExistente) {
          const pacienteDesc = descifrarPaciente(pacienteExistente);
          return {
            error: `El correo "${emailLimpio}" ya está registrado con el paciente "${pacienteDesc.nombre}". Por favor usa otro o déjalo vacío.`
          };
        }
      }
      emailFinal = emailLimpio;
    } else if (email === '') {
      // Si el usuario vacía el correo (opcional), conservar el placeholder sin-email- o generar uno único
      emailFinal = (pacienteActual && pacienteActual.email && pacienteActual.email.startsWith('sin-email-'))
        ? pacienteActual.email
        : `sin-email-${Date.now()}-${Math.random().toString(36).substring(2, 9)}@local.com`;
    }
  }

  return { emailFinal };
};

/**
 * Busca un paciente existente o crea uno nuevo al agendar una cita
 * @param {Object} prisma - Cliente Prisma
 * @param {Object} params
 * @returns {Promise<Object>} Paciente encontrado o creado (descifrado en memoria)
 */
const buscarOCrearPacienteParaCita = async (prisma, {
  nombreLimpio,
  emailLimpio,
  telefonoLimpio,
  enlaceZoomLimpio,
  montoValido,
  esBloqueo,
  esGrupal
}) => {
  let paciente;

  // 1. Buscar por emailHash (Blind index exacto O(1))
  if (emailLimpio) {
    const emailHash = generarBlindIndex(emailLimpio);
    paciente = await prisma.paciente.findFirst({
      where: { emailHash }
    });
  }

  // 2. Si no se encontró por email, buscar por teléfono o nombre en memoria descifrada
  if (!paciente && (telefonoLimpio || nombreLimpio)) {
    const todos = await prisma.paciente.findMany();
    const descifrados = todos.map(p => descifrarPaciente(p));

    if (telefonoLimpio) {
      paciente = descifrados.find(p => 
        (p.telefono || '').trim() === telefonoLimpio &&
        (p.nombre || '').trim().toLowerCase() === nombreLimpio.toLowerCase()
      );
    }

    if (!paciente && !esBloqueo && !esGrupal) {
      paciente = descifrados.find(p => {
        const nom = (p.nombre || '').trim().toLowerCase();
        return nom === nombreLimpio.toLowerCase() &&
               !p.nombre.startsWith('[BLOQUEO]') &&
               !p.nombre.startsWith('[GRUPAL]');
      });
    }
  }

  if (!paciente) {
    const emailSeguro = emailLimpio || `sin-email-${Date.now()}-${Math.random().toString(36).substring(2, 9)}@local.com`;
    const datosCifrados = cifrarPaciente({
      nombre: nombreLimpio,
      telefono: telefonoLimpio || '',
      email: emailSeguro,
      enlaceZoom: enlaceZoomLimpio || null,
      tarifaDefecto: (!esBloqueo && !esGrupal && montoValido !== null) ? montoValido : 500
    });

    const creado = await prisma.paciente.create({
      data: datosCifrados
    });
    return descifrarPaciente(creado);
  } else {
    // Actualizar datos de contacto, Zoom y tarifa habitual si cambiaron
    const updatePlano = {};
    if (telefonoLimpio && paciente.telefono !== telefonoLimpio) updatePlano.telefono = telefonoLimpio;
    if (emailLimpio && (!paciente.email || paciente.email.startsWith('sin-email-'))) updatePlano.email = emailLimpio;
    if (enlaceZoomLimpio) updatePlano.enlaceZoom = enlaceZoomLimpio;
    if (!esBloqueo && !esGrupal && montoValido !== null) updatePlano.tarifaDefecto = montoValido;

    if (Object.keys(updatePlano).length > 0) {
      const updateCifrado = cifrarPaciente(updatePlano);
      const actualizado = await prisma.paciente.update({
        where: { id: paciente.id },
        data: updateCifrado
      });
      return descifrarPaciente(actualizado);
    }
    return descifrarPaciente(paciente);
  }
};

/**
 * Obtiene las citas futuras pertenecientes a la misma serie recurrente
 * @param {Object} citaActual - Cita base
 * @param {Object} dbClient - Cliente de base de datos (Prisma o transacción)
 * @returns {Promise<Array>} Lista de citas futuras
 */
const obtenerCitasFuturasDeSerie = async (citaActual, dbClient) => {
  if (!citaActual) return [];

  // 1. Si la cita tiene serieId explícito
  if (citaActual.serieId) {
    return await dbClient.cita.findMany({
      where: {
        serieId: citaActual.serieId,
        id: { not: citaActual.id },
        fechaHora: { gte: citaActual.fechaHora },
        estado_cita: { not: 'CANCELADA' }
      },
      orderBy: { fechaHora: 'asc' },
      include: { paciente: true }
    });
  }

  // 2. Fallback para citas creadas antes de la existencia de serieId:
  // Detectar si la categoría o notas tienen formato "(Sesión X/N)"
  const matchSesion = (citaActual.categoria || '').match(/\(Sesión\s+(\d+)\/(\d+)\)/i);
  if (matchSesion && citaActual.pacienteId) {
    const totalSerie = parseInt(matchSesion[2], 10);
    const sesionActual = parseInt(matchSesion[1], 10);

    if (totalSerie > 1 && sesionActual < totalSerie) {
      // Buscar citas del mismo paciente con fechaHora posterior no canceladas
      const candidatas = await dbClient.cita.findMany({
        where: {
          pacienteId: citaActual.pacienteId,
          id: { not: citaActual.id },
          fechaHora: { gte: citaActual.fechaHora },
          estado_cita: { not: 'CANCELADA' }
        },
        orderBy: { fechaHora: 'asc' },
        include: { paciente: true }
      });

      // Filtrar las que compartan el total de la serie ej "(Sesión Y/totalSerie)"
      const regexCompat = new RegExp(`\\(Sesión\\s+\\d+\\/${totalSerie}\\)`, 'i');
      return candidatas.filter(c => regexCompat.test(c.categoria || ''));
    }
  }

  return [];
};

module.exports = {
  parseMontoValido,
  normalizarNombresYCategorias,
  validarEmailUnicoPaciente,
  buscarOCrearPacienteParaCita,
  obtenerCitasFuturasDeSerie
};
