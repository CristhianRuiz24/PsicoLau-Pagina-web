const express = require('express');
const router = express.Router();
const citasRoutes = require('./citas');
const authRoutes = require('./auth');
const agendaRoutes = require('./agenda');
const contactoRoutes = require('./contacto');
const pacientesRoutes = require('./pacientes');
const expedientesRoutes = require('./expedientes');

router.use('/citas', citasRoutes);
router.use('/auth', authRoutes);
router.use('/agenda', agendaRoutes);
router.use('/contacto', contactoRoutes);
router.use('/pacientes', pacientesRoutes);
router.use('/expediente', expedientesRoutes);

module.exports = router;

