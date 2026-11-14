import { z } from 'zod';

const imageUriOrEmpty = z
  .string()
  .refine(
    (val) =>
      val === '' ||
      val.startsWith('http://') ||
      val.startsWith('https://') ||
      val.startsWith('/images/') ||
      val.startsWith('/uploads/') ||
      val.startsWith('data:image/'),
    { message: 'Formato o URL de imagen inválida' }
  )
  .optional()
  .nullable();

const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'El color de marca debe ser un hexadecimal válido (ej: #0E6B74)')
  .optional();

export const listAgenciesQuerySchema = z.object({
  zoneId: z.string().optional(),
  ciudad: z.string().optional(),
  q: z.string().optional(),
});

export const registerAgencySchema = z.object({
  nombre: z.string().min(3, 'El nombre de la agencia debe tener al menos 3 caracteres').max(80),
  descripcion: z.string().max(800).optional(),
  direccion: z.string().min(4, 'La dirección física del local o guardería es obligatoria').max(160),
  whatsapp: z.string().max(40).optional(),
  horario: z.string().max(120).optional(),
  accentColor: hexColorSchema,
  logoUrl: imageUriOrEmpty,
  portadaUrl: imageUriOrEmpty,
  multaSalitreArs: z.coerce.number().min(0).max(500000).optional(),
  comisionPorcentaje: z.coerce.number().min(0).max(40).optional(),
  planTier: z.enum(['STARTER', 'PRO', 'ENTERPRISE']).optional().default('STARTER'),
  mpCollectorId: z.string().max(80).optional(),
  // Selección de zona existente o creación automática de ciudad/spot costero
  zoneId: z.string().optional(),
  ciudad: z.string().min(2).max(60).optional(),
  nombreZona: z.string().min(2).max(80).optional(),
  latitud: z.coerce.number().min(-90).max(90).optional(),
  longitud: z.coerce.number().min(-180).max(180).optional(),
  // Credenciales de nuevo operador si el registro es público (SaaS self-service)
  email: z.string().email('Email corporativo inválido').optional(),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
  nombreResponsable: z.string().min(2).max(80).optional(),
  telefonoResponsable: z.string().max(40).optional(),
});

export type RegisterAgencyInput = z.infer<typeof registerAgencySchema>;

export const updateMyAgencySchema = z.object({
  nombre: z.string().min(3).max(80).optional(),
  descripcion: z.string().max(800).optional().nullable(),
  direccion: z.string().min(4).max(160).optional(),
  whatsapp: z.string().max(40).optional().nullable(),
  horario: z.string().max(120).optional().nullable(),
  accentColor: hexColorSchema,
  logoUrl: imageUriOrEmpty,
  portadaUrl: imageUriOrEmpty,
  multaSalitreArs: z.coerce.number().min(0).max(500000).optional(),
  mpCollectorId: z.string().max(80).optional().nullable(),
  latitud: z.coerce.number().min(-90).max(90).optional(),
  longitud: z.coerce.number().min(-180).max(180).optional(),
  zoneId: z.string().optional(),
  agencyId: z.string().optional(), // Permitido para SUPER_ADMIN al editar una agencia específica
});

export type UpdateMyAgencyInput = z.infer<typeof updateMyAgencySchema>;
