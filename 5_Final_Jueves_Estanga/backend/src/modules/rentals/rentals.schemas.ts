import { z } from 'zod';

export const quoteRentalSchema = z.object({
  boardId: z.string().min(1, 'ID de tabla inválido'),
  horas: z.number().int().positive('La cantidad de horas debe ser mayor a 0'),
  fechaInicio: z.string().datetime('Formato de fecha de inicio inválido (ISO 8601)'),
  puntosUsados: z.number().int().nonnegative().optional().default(0),
  incluyeSeguro: z.boolean().optional().default(false),
  incluyeNeoprene: z.boolean().optional().default(false),
  talleNeoprene: z.enum(['S', 'M', 'L', 'XL']).optional(),
  incluyeLeash: z.boolean().optional().default(false),
  incluyeParafina: z.boolean().optional().default(false),
});

export type QuoteRentalInput = z.infer<typeof quoteRentalSchema>;

export const createRentalSchema = z.object({
  boardId: z.string().min(1, 'ID de tabla inválido'),
  horas: z.number().int().positive('La cantidad de horas debe ser mayor a 0'),
  fechaInicio: z.string().datetime('Formato de fecha de inicio inválido (ISO 8601)'),
  puntosUsados: z.number().int().nonnegative().optional().default(0),
  incluyeSeguro: z.boolean().optional().default(false),
  incluyeNeoprene: z.boolean().optional().default(false),
  talleNeoprene: z.enum(['S', 'M', 'L', 'XL']).optional(),
  incluyeLeash: z.boolean().optional().default(false),
  incluyeParafina: z.boolean().optional().default(false),
  versionTerminos: z.string().optional().default('1.0'),
  ipAceptacion: z.string().optional(),
  biometricSignature: z
    .object({
      signatureHash: z.string().optional(),
      signature_hash: z.string().optional(),
      timestamp: z.string().optional(),
      biometricVerified: z.boolean().optional(),
      biometric_verified: z.boolean().optional(),
      authType: z.string().optional(),
      auth_type: z.string().optional(),
    })
    .optional(),
});

export type CreateRentalInput = z.infer<typeof createRentalSchema>;

export const cancelRentalSchema = z.object({
  motivo: z.string().min(3, 'El motivo de cancelación debe tener al menos 3 caracteres'),
});

export type CancelRentalInput = z.infer<typeof cancelRentalSchema>;

export const checkinRentalSchema = z.object({
  fotosRetiro: z.array(z.string().url()).min(1, 'Se requiere al menos 1 fotografía al retirar'),
  firmaRetiroUrl: z.string().min(10, 'Firma digital de retiro requerida'),
});

export type CheckinRentalInput = z.infer<typeof checkinRentalSchema>;

export const checkoutRentalSchema = z.object({
  fotosDevolucion: z.array(z.string().url()).min(1, 'Se requiere al menos 1 fotografía al devolver'),
  lavada: z.boolean().default(true),
});

export type CheckoutRentalInput = z.infer<typeof checkoutRentalSchema>;
