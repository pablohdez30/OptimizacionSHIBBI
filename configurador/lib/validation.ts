// Validación con Zod del payload que llega a /api/solicitudes.
// (Deferred — todavía no hay endpoint real. Se usará cuando enchufemos
// Supabase y creemos app/api/solicitudes/route.ts.)

import { z } from 'zod';

export const solicitudSchema = z.object({
  tipo: z.enum(['mesa', 'estanteria', 'espejo', 'otro']),
  material_id: z.string().nullable(),
  grosor: z.number().positive().nullable(),
  medidas: z.object({
    largo: z.union([z.number().min(0).max(500), z.literal('')]),
    ancho: z.union([z.number().min(0).max(500), z.literal('')]),
    alto: z.union([z.number().min(0).max(500), z.literal('')])
  }),
  componentes: z.array(z.object({
    id: z.string(),
    cantidad: z.number().int().positive().max(20)
  })),
  acabado_id: z.string().nullable(),
  servicios_ids: z.array(z.string()),
  nombre: z.string().min(2).max(120),
  email: z.string().email(),
  telefono: z.string().max(40),
  canal_preferido: z.enum(['email', 'whatsapp', 'cualquiera']),
  notas_adicionales: z.string().max(2000),
  imagenes: z.array(z.string()).max(5),
  presupuesto_estimado: z.number(),
  desglose: z.array(z.object({
    id: z.string(),
    titulo: z.string(),
    subtitulo: z.string().nullable(),
    importe: z.number()
  }))
});

export type SolicitudInput = z.infer<typeof solicitudSchema>;
