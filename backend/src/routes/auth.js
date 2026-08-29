const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');
const rateLimit = require('express-rate-limit');

// Limitar intentos de login para prevenir ataques de fuerza bruta (5 intentos / 15 min)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  validate: { xForwardedForHeader: false },
  message: { success: false, message: 'Demasiados intentos de login. Por favor, intenta de nuevo en 15 minutos.' }
});

router.post('/login', loginLimiter, login);

module.exports = router;
