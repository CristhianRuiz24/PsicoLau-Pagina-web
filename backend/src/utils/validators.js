const { z } = require('zod');

const citaSchema = z.object({
  nombre: z.string().min(2, "El nombre es muy corto").max(100),
  telefono: z.string().min(8, "Teléfono inválido").max(20),
  email: z.string().email("Correo inválido"),
  // z.coerce.date() intentará parsear la fecha enviada desde el frontend a un objeto Date real
  fechaHora: z.coerce.date({
    required_error: "La fecha y hora son requeridas",
    invalid_type_error: "Formato de fecha inválido",
  }),
  categoria: z.string().optional()
});

module.exports = {
  citaSchema
};
