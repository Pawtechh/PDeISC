import { z } from 'zod';

const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'El color debe ser hexadecimal (#RRGGBB)')
  .optional();

export const createZoneSchema = z.object({
  ciudad: z.string().min(2, 'La ciudad es obligatoria').max(60),
  nombre: z.string().min(2, 'El nombre del spot o playa es obligatorio').max(80),
  pais: z.string().min(2).max(60).default('Argentina'),
  latitud: z.coerce.number().min(-90).max(90),
  longitud: z.coerce.number().min(-180).max(180),
  timezone: z.string().min(3).max(60).default('America/Argentina/Buenos_Aires'),
  activa: z.boolean().optional().default(true),
});

export const updateZoneSchema = z.object({
  ciudad: z.string().min(2).max(60).optional(),
  nombre: z.string().min(2).max(80).optional(),
  pais: z.string().min(2).max(60).optional(),
  latitud: z.coerce.number().min(-90).max(90).optional(),
  longitud: z.coerce.number().min(-180).max(180).optional(),
  timezone: z.string().min(3).max(60).optional(),
  activa: z.boolean().optional(),
});

export const adminCreateAgencySchema = z.object({
  nombre: z.string().min(3, 'El nombre del negocio debe tener al menos 3 caracteres').max(80),
  descripcion: z.string().max(800).optional(),
  direccion: z.string().min(4, 'La dirección es obligatoria').max(160),
  whatsapp: z.string().max(40).optional(),
  horario: z.string().max(120).optional(),
  accentColor: hexColorSchema,
  comisionPorcentaje: z.coerce.number().min(0).max(40).optional().default(5),
  multaSalitreArs: z.coerce.number().min(0).max(500000).optional().default(10000),
  zoneId: z.string().min(1, 'Debés elegir una zona o ciudad'),
  verificada: z.boolean().optional().default(true),
  activa: z.boolean().optional().default(true),
  // Cuenta de rango AGENCIA opcional en el mismo paso
  operatorEmail: z.string().email('Email de cuenta agencia inválido').optional().or(z.literal('')),
  operatorPassword: z.string().min(6, 'Mínimo 6 caracteres para la clave').optional().or(z.literal('')),
  operatorNombre: z.string().min(2).max(80).optional().or(z.literal('')),
  operatorTelefono: z.string().max(40).optional().or(z.literal('')),
  existingUserId: z.string().optional(),
});

export const adminUpdateAgencySchema = z.object({
  nombre: z.string().min(3).max(80).optional(),
  descripcion: z.string().max(800).optional(),
  direccion: z.string().min(4).max(160).optional(),
  whatsapp: z.string().max(40).optional().nullable(),
  horario: z.string().max(120).optional().nullable(),
  accentColor: hexColorSchema,
  comisionPorcentaje: z.coerce.number().min(0).max(40).optional(),
  multaSalitreArs: z.coerce.number().min(0).max(500000).optional(),
  zoneId: z.string().optional(),
  verificada: z.boolean().optional(),
  activa: z.boolean().optional(),
});

export const createAgencyOperatorSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  nombre: z.string().min(2, 'El nombre es obligatorio').max(80),
  telefono: z.string().max(40).optional(),
  agencyId: z.string().min(1, 'Debés asociar la cuenta a una agencia'),
  role: z.enum(['AGENCIA', 'OWNER', 'CONSUMER', 'SUPER_ADMIN']).optional().default('AGENCIA'),
});

export const updateUserRoleAdminSchema = z.object({
  role: z.enum(['AGENCIA', 'OWNER', 'CONSUMER', 'SUPER_ADMIN']),
  agencyId: z.string().nullable().optional(),
  activo: z.boolean().optional(),
});

export const adminCreateBoardSchema = z.object({
  titulo: z.string().min(3, 'Título mínimo 3 caracteres').max(100),
  marca: z.string().min(2).max(60),
  modelo: z.string().min(1).max(60),
  medidas: z.string().min(3).max(40),
  volumenLitros: z.coerce.number().min(10).max(300).optional(),
  tipoTabla: z.enum(['Shortboard', 'Longboard', 'Funboard', 'Fish', 'Bodyboard', 'SUP']),
  precioHora: z.coerce.number().positive(),
  valorTasadoUsd: z.coerce.number().positive(),
  fotos: z.array(z.string().min(1)).optional(),
  agencyId: z.string().min(1, 'Seleccioná la agencia propietaria'),
  zoneId: z.string().optional(),
  ownerId: z.string().optional(),
});

export const relocateBoardSchema = z.object({
  agencyId: z.string().min(1, 'La agencia es obligatoria'),
  zoneId: z.string().min(1, 'La zona es obligatoria'),
  estado: z.enum(['DISPONIBLE', 'ALQUILADA', 'MANTENIMIENTO', 'PRIVADA']).optional(),
});
