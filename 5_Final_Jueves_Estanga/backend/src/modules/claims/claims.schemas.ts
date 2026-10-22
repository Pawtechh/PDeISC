import { z } from 'zod';

export const createClaimSchema = z.object({
  rentalId: z.string().min(1, 'ID de alquiler inválido'),
  descripcion: z.string().min(10, 'La descripción del daño debe tener al menos 10 caracteres'),
  fotosDano: z.array(z.string().min(1, 'URL de foto inválida')).min(1, 'Se requiere al menos una foto del daño'),
  montoReclamado: z.number().positive('El monto reclamado debe ser mayor a 0'),
  presupuestoReparacionUrl: z.string().optional(),
});

export type CreateClaimInput = z.infer<typeof createClaimSchema>;

export const consumerRespondClaimSchema = z.object({
  accion: z.enum(['ACEPTAR', 'DISPUTAR'], {
    required_error: 'La acción debe ser ACEPTAR o DISPUTAR',
  }),
  motivoDisputa: z.string().optional(),
  fotosDescargo: z.array(z.string().url('URL de foto inválida')).optional(),
});

export type ConsumerRespondClaimInput = z.infer<typeof consumerRespondClaimSchema>;

export const agencyMediateClaimSchema = z.object({
  resolucion: z.enum(['RESUELTO_OWNER', 'RESUELTO_CONSUMER'], {
    required_error: 'La resolución debe ser RESUELTO_OWNER o RESUELTO_CONSUMER',
  }),
  resolucionAgencia: z
    .string({ required_error: 'El dictamen de la mediación es obligatorio' })
    .min(10, 'El dictamen debe tener al menos 10 caracteres explicativos'),
  montoAprobado: z.number().positive('El monto aprobado debe ser mayor a 0').optional(),
});

export type AgencyMediateClaimInput = z.infer<typeof agencyMediateClaimSchema>;

export const executeChargeSchema = z.object({
  notas: z.string().optional(),
});

export type ExecuteChargeInput = z.infer<typeof executeChargeSchema>;
