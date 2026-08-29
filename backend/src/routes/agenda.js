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

// Rate limiting para rutas autenticadas de la agenda (120 req / 1 min)
const agendaLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 120,
  validate: { xForwardedForHeader: false },
  message: { success: false, message: 'Demasiadas solicitudes a la agenda. Por favor, espera un momento.' }
});

// Todas las rutas de la agenda están protegidas por el middleware JWT
router.use(verificarToken);
router.use(agendaLimiter);

// Obtener todas las citas
router.get('/citas', obtenerCitas);

// Crear, editar, cancelar y eliminar citas
router.post('/citas', crearCita);
router.put('/citas/:id', editarCita);
router.patch('/citas/:id/cancelar', cancelarCita);
router.delete('/citas/:id', eliminarCita);

// Actualizar estados y montos
router.patch('/citas/:id/estado', actualizarEstadoCita);
router.patch('/citas/:id/pago', actualizarEstadoPago);
router.patch('/citas/:id/monto', actualizarMontoCita);

module.exports = router;
