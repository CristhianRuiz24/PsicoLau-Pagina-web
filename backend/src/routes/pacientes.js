const express = require('express');
const router = express.Router();
const { 
  obtenerExpedientePaciente, 
  crearNotaExpediente, 
  buscarEnExpediente,
  listarDirectorioPacientes,
  eliminarPaciente
} = require('../controllers/expedienteController');
const { verificarToken } = require('../middlewares/authMiddleware');
const rateLimit = require('express-rate-limit');

// Rate limiting para rutas autenticadas de pacientes y expedientes (120 req / 1 min)
const pacientesLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 120,
  validate: { xForwardedForHeader: false },
  message: { success: false, message: 'Demasiadas solicitudes. Por favor, espera un momento.' }
});

// Todas las rutas de pacientes y expedientes están estrictamente protegidas con JWT
router.use(verificarToken);
router.use(pacientesLimiter);

// Directorio general de pacientes con conteo de sesiones
router.get('/', listarDirectorioPacientes);

// Búsqueda en expediente de un paciente (descifrada en memoria en servidor)
router.get('/:id/expediente/buscar', buscarEnExpediente);

// Obtener todas las notas de sesión descifradas de un paciente
router.get('/:id/expediente', obtenerExpedientePaciente);

// Crear nueva nota de sesión clínica cifrada
router.post('/:id/expediente', crearNotaExpediente);

// Eliminar paciente completo y todo su expediente clínico
router.delete('/:id', eliminarPaciente);

module.exports = router;

