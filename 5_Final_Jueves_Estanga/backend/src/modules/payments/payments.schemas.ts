import { z } from 'zod';

export const createPreferenceSchema = z.object({
  rentalId: z.string().min(1, 'ID de alquiler inválido'),
  installments: z.number().int().min(1).max(12).optional().default(1),
});

export type CreatePreferenceInput = z.infer<typeof createPreferenceSchema>;

export const createPreAuthSchema = z.object({
  rentalId: z.string().min(1, 'ID de alquiler inválido'),
  cardToken: z.string().min(5, 'Token de tarjeta inválido'),
  montoGarantia: z.number().positive('El monto de garantía debe ser mayor a 0').optional(),
});

export type CreatePreAuthInput = z.infer<typeof createPreAuthSchema>;

export const webhookQuerySchema = z.object({
  id: z.string().optional(),
  topic: z.string().optional(),
  type: z.string().optional(),
  'data.id': z.string().optional(),
});

export const simulatePaymentSchema = z.object({
  rentalId: z.string().min(1, 'ID de alquiler inválido'),
  status: z.enum(['approved', 'rejected', 'pending']),
  tipo: z.enum(['ALQUILER', 'PRE_AUTH_DANO', 'MULTA']).optional().default('ALQUILER'),
});

export type SimulatePaymentInput = z.infer<typeof simulatePaymentSchema>;
