const express = require('express');
const router = express.Router();
const { 
  obtenerCitas, 
  actualizarEstadoCita, 
  actualizarEstadoPago, 
  actualizarMontoCita,
  crearCita, 
  editarCita, 
  cancelarCita, 
  eliminarCita 
} = require('../controllers/agendaController');
const { verificarToken } = require('../middlewares/authMiddleware');
const rateLimit = require('express-rate-limit');

// Rate limiting para rutas autenticadas de la agenda (lecturas: 120 req / 1 min)
const agendaLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 120,
  validate: { xForwardedForHeader: false },
  message: { success: false, message: 'Demasiadas solicitudes a la agenda. Por favor, espera un momento.' }
});

// Rate limiting específico para mutaciones de datos en agenda (escrituras: 45 req / 1 min)
const agendaMutationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 45,
  validate: { xForwardedForHeader: false },
  message: { success: false, message: 'Demasiadas operaciones de escritura. Por favor, espera un momento.' }
});

// Todas las rutas de la agenda están protegidas por el middleware JWT
router.use(verificarToken);
router.use(agendaLimiter);

// Obtener todas las citas (lectura)
router.get('/citas', obtenerCitas);

// Crear, editar, cancelar y eliminar citas (mutaciones protegidas con rate limit estricto)
router.post('/citas', agendaMutationLimiter, crearCita);
router.put('/citas/:id', agendaMutationLimiter, editarCita);
router.patch('/citas/:id/cancelar', agendaMutationLimiter, cancelarCita);
router.delete('/citas/:id', agendaMutationLimiter, eliminarCita);

// Actualizar estados y montos
router.patch('/citas/:id/estado', agendaMutationLimiter, actualizarEstadoCita);
router.patch('/citas/:id/pago', agendaMutationLimiter, actualizarEstadoPago);
router.patch('/citas/:id/monto', agendaMutationLimiter, actualizarMontoCita);

module.exports = router;
