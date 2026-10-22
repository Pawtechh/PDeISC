import { z } from 'zod';

export const requestPayoutSchema = z.object({
  monto: z
    .number({ required_error: 'El monto es requerido' })
    .positive('El monto debe ser mayor a 0')
    .min(1000, 'El monto mínimo de extracción es $1.000 ARS'),
  cbuAlias: z
    .string({ required_error: 'El CBU o Alias es requerido' })
    .min(6, 'El CBU o Alias debe tener al menos 6 caracteres'),
});

export type RequestPayoutInput = z.infer<typeof requestPayoutSchema>;

export const completeMaintenanceSchema = z.object({
  notas: z.string().optional(),
  piezasReemplazadas: z.array(z.string()).optional(),
  tecnicoResponsable: z.string().optional(),
});

export type CompleteMaintenanceInput = z.infer<typeof completeMaintenanceSchema>;

export const createOwnerClaimSchema = z.object({
  rentalId: z.string().min(1, 'ID de alquiler inválido'),
  descripcion: z.string().min(5, 'La descripción del daño debe tener al menos 5 caracteres'),
  fotosDano: z
    .array(z.string().min(1, 'URL de foto inválida'))
    .optional()
    .default(['https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=800']),
  montoReclamado: z.number().positive('El monto reclamado debe ser mayor a 0'),
  presupuestoReparacionUrl: z.string().optional(),
});

export type CreateOwnerClaimInput = z.infer<typeof createOwnerClaimSchema>;
