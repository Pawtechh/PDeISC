import { z } from 'zod';

export const redeemPointsSchema = z.object({
  puntos: z
    .number({ required_error: 'La cantidad de puntos es obligatoria' })
    .int('Los puntos deben ser un número entero')
    .positive('Los puntos deben ser mayor a 0')
    .min(50, 'El canje mínimo es de 50 puntos'),
});

export type RedeemPointsInput = z.infer<typeof redeemPointsSchema>;

export const createReviewSchema = z.object({
  rentalId: z.string().min(1, 'ID de alquiler inválido'),
  calificacion: z
    .number({ required_error: 'La calificación es obligatoria' })
    .int('La calificación debe ser un entero')
    .min(1, 'La calificación mínima es 1 estrella')
    .max(5, 'La calificación máxima es 5 estrellas'),
  comentario: z
    .string({ required_error: 'El comentario es obligatorio' })
    .min(5, 'El comentario debe tener al menos 5 caracteres')
    .max(500, 'El comentario no puede superar los 500 caracteres'),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
