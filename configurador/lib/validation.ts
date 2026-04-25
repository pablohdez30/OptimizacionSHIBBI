import { z } from 'zod';

export const solicitudSchema = z.object({
  tipo: z.enum(['mesa', 'estanteria', 'espejo', 'otro']),
  material_id: z.string().uuid().optional(),
  grosor: z.number().positive().optional(),
  medidas: z.object({
    largo: z.number().min(0).max(500),
    ancho: z.number().min(0).max(500),
    alto: z.number().min(0).max(500).optional()
  }),
  componentes: z.array(z.object({
    id: z.string().uuid(),
    cantidad: z.number().int().positive().max(20)
  })),
  acabado_id: z.string().uuid().optional(),
  servicios_ids: z.array(z.string().uuid()),
  descripcion_libre: z.string().max(2000).optional(),
  imagenes: z.array(z.string().url()).max(5),
  nombre: z.string().min(2).max(120),
  email: z.string().email(),
  telefono: z.string().max(40).optional(),
  canal_preferido: z.enum(['email', 'whatsapp', 'cualquiera']),
  notas_adicionales: z.string().max(2000).optional()
});

export type SolicitudPayload = z.infer<typeof solicitudSchema>;
