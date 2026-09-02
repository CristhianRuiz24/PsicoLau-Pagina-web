const prisma = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { cambiarPasswordSchema } = require('../utils/validators');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email y contraseña son requeridos' });
    }

    const emailNormalizado = String(email).trim().toLowerCase();

    // Buscar usuaria en la base de datos (búsqueda insensible a mayúsculas)
    const usuario = await prisma.usuario.findFirst({
      where: { email: { equals: emailNormalizado, mode: 'insensitive' } }
    });

    if (!usuario) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    // Verificar contraseña con bcrypt
    const isMatch = await bcrypt.compare(password, usuario.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    // Generar el token JWT (Vigencia ajustada a 8 horas por seguridad clínica)
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      token,
      message: 'Login exitoso'
    });

  } catch (error) {
    logger.error('Error en login', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

const cambiarPassword = async (req, res) => {
  try {
    const usuarioId = req.usuario && req.usuario.id;
    if (!usuarioId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const validacion = cambiarPasswordSchema.safeParse(req.body);
    if (!validacion.success) {
      const errorMsg = validacion.error.errors[0]?.message || 'Datos de contraseña inválidos';
      return res.status(400).json({ success: false, message: errorMsg });
    }

    const { passwordActual, passwordNueva } = validacion.data;

    // Buscar usuaria en la base de datos
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId }
    });

    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    // Verificar si la contraseña actual coincide con el hash en BD
    const isMatch = await bcrypt.compare(passwordActual, usuario.password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'La contraseña actual es incorrecta' });
    }

    // Hashear la nueva contraseña con costo 10
    const nuevoHash = await bcrypt.hash(passwordNueva, 10);

    // Actualizar en base de datos
    const usuarioActualizado = await prisma.usuario.update({
      where: { id: usuarioId },
      data: { password_hash: nuevoHash }
    });

    // Generar un nuevo token JWT para mantener la sesión viva sin interrupciones
    const token = jwt.sign(
      { id: usuarioActualizado.id, email: usuarioActualizado.email },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({
      success: true,
      message: '¡Contraseña actualizada exitosamente!',
      token
    });

  } catch (error) {
    logger.error('Error al cambiar contraseña', error);
    return res.status(500).json({ success: false, message: 'Error interno al actualizar la contraseña' });
  }
};

module.exports = { login, cambiarPassword };

