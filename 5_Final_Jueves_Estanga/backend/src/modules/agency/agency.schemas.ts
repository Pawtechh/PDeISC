import { z } from 'zod';

export const agencyCheckInSchema = z.object({
  rentalId: z.string().min(1, 'ID de alquiler inválido'),
  fotosRetiro: z
    .array(z.string().min(1, 'URL de foto de inspección inválida'))
    .min(1, 'Se requiere al menos 1 fotografía del estado inicial de la tabla'),
  firmaRetiroUrl: z
    .string()
    .min(5, 'Se requiere la firma digital o trazo de conformidad del surfista'),
  dniVerificado: z.boolean().refine((val) => val === true, {
    message: 'Es obligatorio verificar la identidad física del surfista (+18 años) en mostrador',
  }),
});

export type AgencyCheckInInput = z.infer<typeof agencyCheckInSchema>;

export const agencyCheckOutSchema = z.object({
  rentalId: z.string().min(1, 'ID de alquiler inválido'),
  fotosDevolucion: z
    .array(z.string().min(1, 'URL de foto de inspección inválida'))
    .min(1, 'Se requiere al menos 1 fotografía del estado de devolución'),
  lavada: z.boolean({
    required_error: 'Debe indicarse si la tabla fue enjuagada con agua dulce sin salitre',
  }),
  tieneDanio: z.boolean().default(false),
  descripcionDanio: z.string().optional(),
  fotoDanio: z.string().optional(),
}).refine(
  (data) => {
    if (data.tieneDanio) {
      if (!data.descripcionDanio || data.descripcionDanio.trim().length < 5) return false;
      // Debe contener letras (descripción alfanumérica, no solo números)
      const hasLetters = /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(data.descripcionDanio);
      return hasLetters;
    }
    return true;
  },
  {
    message: 'La descripción del daño es obligatoria y debe ser descriptiva con letras y números (mínimo 5 caracteres)',
    path: ['descripcionDanio'],
  }
).refine(
  (data) => {
    if (data.tieneDanio) {
      const hasPhoto = Boolean(data.fotoDanio && data.fotoDanio.trim().length >= 5) || (Boolean(data.fotosDevolucion && data.fotosDevolucion.length > 0));
      return hasPhoto;
    }
    return true;
  },
  {
    message: 'Es obligatorio adjuntar o capturar la fotografía del daño para que el propietario la revise',
    path: ['fotoDanio'],
  }
);

export type AgencyCheckOutInput = z.infer<typeof agencyCheckOutSchema>;
