const express = require('express');
const router = express.Router();
const { crearCitaPublica } = require('../controllers/citaController');
const rateLimit = require('express-rate-limit');

// Rate limiting específico para evitar spam en el formulario público
const publicCitaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Limita cada IP a 5 peticiones por ventana
  message: { success: false, message: 'Demasiadas solicitudes. Por favor, intenta de nuevo más tarde.' }
});

// Endpoint público para crear citas
router.post('/public', publicCitaLimiter, crearCitaPublica);

module.exports = router;
