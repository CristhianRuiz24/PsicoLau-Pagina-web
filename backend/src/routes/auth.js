const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');
const rateLimit = require('express-rate-limit');

// Limitar intentos de login para prevenir ataques de fuerza bruta (10 intentos / 15 min)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10, 
  validate: { xForwardedForHeader: false },
  message: { success: false, message: 'Demasiados intentos de login, por favor intenta más tarde.' }
});

router.post('/login', loginLimiter, login);

module.exports = router;
