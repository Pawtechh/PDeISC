import { z } from 'zod';
import { validarLuhn, noEstaVencida } from '../utils/cardValidation';

export const cardSchema = z.object({
  numeroTarjeta: z
    .string()
    .min(15, 'Número incompleto (mín. 15 dígitos)')
    .max(19, 'Número demasiado largo')
    .refine((val) => validarLuhn(val.replace(/\s/g, '')), {
      message: 'Número de tarjeta inválido (Luhn fail)',
    }),
  nombreTitular: z
    .string()
    .min(3, 'Nombre del titular requerido')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s']+$/, 'Solo letras y espacios'),
  vencimiento: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Formato MM/AA')
    .refine((val) => noEstaVencida(val), {
      message: 'La tarjeta está vencida',
    }),
  cvv: z
    .string()
    .regex(/^\d{3,4}$/, 'CVV de 3 o 4 dígitos'),
  dniTitular: z
    .string()
    .regex(/^\d{7,8}$/, 'DNI debe tener 7 u 8 dígitos (sin puntos)'),
  guardarTarjeta: z.boolean().optional(),
  aceptaPreautorizacion: z.boolean().refine((val) => val === true, {
    message: 'Debés aceptar la pre-autorización de garantía de $50.000',
  }),
});

export type CardFormData = z.infer<typeof cardSchema>;
