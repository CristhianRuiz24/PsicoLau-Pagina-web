const { z } = require('zod');

// Expresiones regulares y reglas de seguridad para entradas
const REGEX_URL = /https?:\/\/|www\./i;
const REGEX_HTML_TAGS = /<\s*(script|iframe|object|embed|a|link|meta|img|form|[a-z]+)\b/i;
const REGEX_CHARS_PELIGROSOS = /[<>{}]/;

// 1. Nombre para formularios públicos (Estrictamente nombres humanos con acentos/ñ)
const nombreHumanoSchema = z.string().trim()
  .min(2, "El nombre debe tener al menos 2 caracteres")
  .max(100, "El nombre no puede exceder 100 caracteres")
  .refine(val => !REGEX_URL.test(val), {
    message: "El nombre no puede contener enlaces ni URLs"
  })
  .refine(val => !/[<>{}\[\]=]/.test(val), {
    message: "El nombre contiene caracteres no permitidos"
  })
  .refine(val => /^[\p{L}\s.'\-]+$/u.test(val), {
    message: "El nombre solo puede contener letras, espacios, puntos o guiones"
  });

// 2. Teléfono con formato internacional
const telefonoRequeridoSchema = z.string().trim()
  .min(7, "Teléfono demasiado corto")
  .max(25, "Teléfono demasiado largo")
  .refine(val => !REGEX_URL.test(val) && !REGEX_CHARS_PELIGROSOS.test(val), {
    message: "Teléfono no válido"
  })
  .refine(val => /^[0-9+\s().-]+$/.test(val), {
    message: "El teléfono solo puede contener números y signos válidos (+, -, (), .)"
  })
  .refine(val => {
    const digits = val.replace(/\D/g, '');
    return digits.length >= 7 && digits.length <= 20;
  }, {
    message: "El teléfono debe contener entre 7 y 20 dígitos numéricos"
  });

const telefonoOpcionalSchema = z.union([
  telefonoRequeridoSchema,
  z.literal(''),
  z.null()
]).optional();

// 3. Nombre para panel administrativo (admite prefijos [GRUPAL], [BLOQUEO], [EVALUACION] pero bloquea URLs y HTML)
const nombreAdminSchema = z.string().trim()
  .min(1, "El nombre es obligatorio")
  .max(150, "Nombre demasiado largo")
  .refine(val => !REGEX_URL.test(val), {
    message: "El nombre no puede ser una URL o enlace externo"
  })
  .refine(val => !REGEX_CHARS_PELIGROSOS.test(val), {
    message: "El nombre contiene caracteres HTML o código no permitido"
  })
  .refine(val => !/^[=+@-]/.test(val), {
    message: "El nombre no puede comenzar con caracteres de fórmula (=, +, -, @)"
  })
  .refine(val => {
    const sinPrefijo = val.replace(/^\[(BLOQUEO|GRUPAL|EVALUACION)\]\s*/i, '').trim();
    if (!sinPrefijo) return false;
    return /^[\p{L}0-9\s.'\-()]+$/u.test(sinPrefijo);
  }, {
    message: "El nombre contiene caracteres no permitidos"
  });

// 4. Mensaje del formulario de contacto (Anti-spam: máximo 2 URLs y cero HTML ejecutable)
const mensajeContactoSchema = z.string().trim()
  .min(5, "El mensaje debe tener al menos 5 caracteres")
  .max(3000, "El mensaje no puede exceder 3000 caracteres")
  .refine(val => !REGEX_HTML_TAGS.test(val), {
    message: "El mensaje contiene etiquetas HTML o código ejecutable no permitido"
  })
  .refine(val => {
    const matches = val.match(/https?:\/\/|www\./gi) || [];
    return matches.length <= 2;
  }, {
    message: "Por motivos de seguridad, el mensaje no puede contener más de 2 enlaces"
  });

// Schema para el formulario público de agendamiento
const citaSchema = z.object({
  nombre: nombreHumanoSchema,
  telefono: telefonoRequeridoSchema,
  email: z.string().trim().email("Correo inválido"),
  fechaHora: z.coerce.date({
    required_error: "La fecha y hora son requeridas",
    invalid_type_error: "Formato de fecha inválido",
  }),
  categoria: z.string().trim().max(100)
    .refine(val => !REGEX_URL.test(val) && !REGEX_CHARS_PELIGROSOS.test(val), {
      message: "La categoría contiene caracteres no permitidos"
    })
    .optional()
});

// Schema para el formulario de contacto público
const contactoSchema = z.object({
  nombre: nombreHumanoSchema,
  email: z.string().trim().email("Correo electrónico inválido"),
  telefono: telefonoOpcionalSchema,
  categoria: z.string().trim().max(100)
    .refine(val => !val || (!REGEX_URL.test(val) && !REGEX_CHARS_PELIGROSOS.test(val)), {
      message: "La categoría contiene caracteres no permitidos"
    })
    .optional().or(z.literal('')),
  mensaje: mensajeContactoSchema
});

// Schema para creación de citas en el panel administrativo
const crearCitaAdminSchema = z.object({
  nombre: nombreAdminSchema,
  telefono: telefonoOpcionalSchema,
  email: z.union([
    z.string().trim().email("Correo inválido"),
    z.literal(''),
    z.null()
  ]).optional(),
  enlaceZoom: z.string().trim().max(500, "Enlace de Zoom demasiado largo").optional().nullable().or(z.literal('')),
  fechaHora: z.coerce.date({
    required_error: "La fecha y hora son obligatorias",
    invalid_type_error: "Formato de fecha y hora inválido"
  }),
  categoria: z.string().trim().max(255, "Categoría demasiado larga").optional().nullable().or(z.literal('')),
  notas: z.string().trim().max(1000, "Notas demasiado largas").optional().nullable().or(z.literal('')),
  color: z.string().trim().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Color hexadecimal inválido").optional().default('#3EB8CC'),
  repeticiones: z.coerce.number().int().min(1).max(24).optional().default(1),
  frecuencia: z.enum(['SEMANAL', 'QUINCENAL']).optional().default('SEMANAL'),
  monto: z.union([
    z.coerce.number().min(0, "El monto debe ser mayor o igual a 0"),
    z.literal(''),
    z.null()
  ]).optional()
});

// Schema para edición de citas en el panel administrativo
const editarCitaAdminSchema = z.object({
  nombre: nombreAdminSchema.optional(),
  telefono: telefonoOpcionalSchema,
  email: z.union([
    z.string().trim().email("Correo inválido"),
    z.literal(''),
    z.null()
  ]).optional(),
  enlaceZoom: z.string().trim().max(500, "Enlace de Zoom demasiado largo").optional().nullable().or(z.literal('')),
  fechaHora: z.coerce.date({
    invalid_type_error: "Formato de fecha y hora inválido"
  }).optional(),
  categoria: z.string().trim().max(255, "Categoría demasiado larga").optional().nullable().or(z.literal('')),
  notas: z.string().trim().max(1000, "Notas demasiado largas").optional().nullable().or(z.literal('')),
  color: z.string().trim().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Color hexadecimal inválido").optional(),
  monto: z.union([
    z.coerce.number().min(0, "El monto debe ser mayor o igual a 0"),
    z.literal(''),
    z.null()
  ]).optional(),
  estado_cita: z.enum(['PENDIENTE', 'CONFIRMADA', 'REALIZADA', 'CANCELADA']).optional(),
  estado_pago: z.enum(['PENDIENTE', 'PAGADO']).optional(),
  alcance: z.enum(['SOLO_ESTA', 'ESTA_Y_SIGUIENTES']).optional().default('SOLO_ESTA')
});

// Schema para notas clínicas de expedientes
const notaExpedienteSchema = z.object({
  fechaSesion: z.coerce.date({
    required_error: "La fecha de sesión es obligatoria",
    invalid_type_error: "Formato de fecha inválido"
  }),
  estadoActual: z.string().trim().max(10000).optional().nullable(),
  insightPaciente: z.string().trim().max(10000).optional().nullable(),
  eventoPrincipal: z.string().trim().max(10000).optional().nullable(),
  intervenciones: z.string().trim().max(10000).optional().nullable(),
  formulacionClinica: z.string().trim().max(10000).optional().nullable(),
  tareasAsignadas: z.string().trim().max(10000).optional().nullable(),
  pendientesProximaSesion: z.string().trim().max(10000).optional().nullable(),
  resumenBreve: z.string().trim().max(5000).optional().nullable()
});

// Schema para cambio de contraseña desde el panel administrativo
const cambiarPasswordSchema = z.object({
  passwordActual: z.string().trim().min(1, "La contraseña actual es requerida"),
  passwordNueva: z.string().trim().min(8, "La nueva contraseña debe tener al menos 8 caracteres"),
  confirmarPassword: z.string().trim().min(1, "Debes confirmar la nueva contraseña")
}).refine((data) => data.passwordNueva === data.confirmarPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmarPassword"]
}).refine((data) => data.passwordActual !== data.passwordNueva, {
  message: "La nueva contraseña no puede ser igual a la anterior",
  path: ["passwordNueva"]
});

// Helper para validar IDs numéricos enteros positivos
const parseId = (id) => {
  const parsed = parseInt(id, 10);
  return (isNaN(parsed) || parsed <= 0) ? null : parsed;
};

module.exports = {
  parseId,
  citaSchema,
  contactoSchema,
  crearCitaAdminSchema,
  editarCitaAdminSchema,
  notaExpedienteSchema,
  cambiarPasswordSchema
};



