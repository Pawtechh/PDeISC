import { z } from 'zod';

export const createBoardSchema = z.object({
  titulo: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  marca: z.string().min(2, 'La marca es requerida'),
  modelo: z.string().min(2, 'El modelo es requerido'),
  medidas: z.string().min(3, 'Las medidas son requeridas (ej: 6\'1 x 19 1/2 x 2 1/2)'),
  volumenLitros: z.number().positive('El volumen debe ser mayor a 0').optional(),
  tipoTabla: z.enum(['Shortboard', 'Longboard', 'Funboard', 'Fish', 'Bodyboard', 'SUP'], {
    errorMap: () => ({ message: 'Tipo de tabla inválido' }),
  }),
  precioHora: z.number().positive('El precio por hora debe ser mayor a 0'),
  valorTasadoUsd: z.number().positive('El valor tasado en USD debe ser mayor a 0'),
  fotos: z.array(z.string().url('URL de foto inválida')).min(1, 'Se requiere al menos 1 fotografía'),
  polizaSeguroNumero: z.string().optional(),
  polizaAseguradora: z.string().optional(),
});

export type CreateBoardInput = z.infer<typeof createBoardSchema>;

export const updateBoardSchema = createBoardSchema.partial();
export type UpdateBoardInput = z.infer<typeof updateBoardSchema>;

export const boardFiltersSchema = z.object({
  tipo: z.string().optional(),
  marca: z.string().optional(),
  precioMin: z.coerce.number().optional(),
  precioMax: z.coerce.number().optional(),
  disponible: z.coerce.boolean().optional(),
  orden: z.enum(['precio_asc', 'precio_desc', 'recientes']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export type BoardFiltersInput = z.infer<typeof boardFiltersSchema>;
