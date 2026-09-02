const { z } = require('zod');

// Schema para el formulario público de agendamiento
const citaSchema = z.object({
  nombre: z.string().trim().min(2, "El nombre es muy corto").max(100, "El nombre es muy largo"),
  telefono: z.string().trim().min(8, "Teléfono inválido").max(20, "Teléfono inválido"),
  email: z.string().trim().email("Correo inválido"),
  fechaHora: z.coerce.date({
    required_error: "La fecha y hora son requeridas",
    invalid_type_error: "Formato de fecha inválido",
  }),
  categoria: z.string().trim().max(100).optional()
});

// Schema para el formulario de contacto público
const contactoSchema = z.object({
  nombre: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(100, "El nombre es muy largo"),
  email: z.string().trim().email("Correo electrónico inválido"),
  telefono: z.string().trim().max(30, "Teléfono inválido").optional().or(z.literal('')),
  categoria: z.string().trim().max(100).optional().or(z.literal('')),
  mensaje: z.string().trim().min(5, "El mensaje debe tener al menos 5 caracteres").max(3000, "El mensaje no puede exceder 3000 caracteres")
});

// Schema para creación de citas en el panel administrativo
const crearCitaAdminSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(150, "Nombre demasiado largo"),
  telefono: z.string().trim().max(50, "Teléfono inválido").optional().nullable().or(z.literal('')),
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
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(150, "Nombre demasiado largo").optional(),
  telefono: z.string().trim().max(50, "Teléfono inválido").optional().nullable().or(z.literal('')),
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



