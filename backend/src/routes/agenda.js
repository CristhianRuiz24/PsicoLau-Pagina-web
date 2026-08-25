const express = require('express');
const router = express.Router();
const { obtenerCitas, actualizarEstadoCita, actualizarEstadoPago, crearCita, editarCita, cancelarCita, eliminarCita } = require('../controllers/agendaController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Todas las rutas de la agenda están protegidas por el middleware JWT
router.use(verificarToken);

// Obtener todas las citas
router.get('/citas', obtenerCitas);

// Crear, editar, cancelar y eliminar citas
router.post('/citas', crearCita);
router.put('/citas/:id', editarCita);
router.patch('/citas/:id/cancelar', cancelarCita);
router.delete('/citas/:id', eliminarCita);

// Actualizar estados
router.patch('/citas/:id/estado', actualizarEstadoCita);
router.patch('/citas/:id/pago', actualizarEstadoPago);

module.exports = router;
