const express = require('express');
const router = express.Router();
const { 
  editarNotaExpediente, 
  eliminarNotaExpediente 
} = require('../controllers/expedienteController');
const { verificarToken } = require('../middlewares/authMiddleware');
const rateLimit = require('express-rate-limit');

// Rate limiting para modificación de notas clínicas (120 req / 1 min)
const expedientesLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 120,
  validate: { xForwardedForHeader: false },
  message: { success: false, message: 'Demasiadas solicitudes. Por favor, espera un momento.' }
});

// Todas las rutas de expedientes individuales están protegidas con JWT
router.use(verificarToken);
router.use(expedientesLimiter);

// Editar una nota de sesión existente (cifra campos actualizados)
router.put('/:id', editarNotaExpediente);

// Eliminar una nota clínica
router.delete('/:id', eliminarNotaExpediente);

module.exports = router;
