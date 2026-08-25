const express = require('express');
const router = express.Router();
const citasRoutes = require('./citas');
const authRoutes = require('./auth');
const agendaRoutes = require('./agenda');
const contactoRoutes = require('./contacto');

router.use('/citas', citasRoutes);
router.use('/auth', authRoutes);
router.use('/agenda', agendaRoutes);
router.use('/contacto', contactoRoutes);

module.exports = router;
