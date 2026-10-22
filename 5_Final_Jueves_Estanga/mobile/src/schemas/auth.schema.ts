import { z } from 'zod';

export const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s']+$/;
export const soloDigitos = /^\d+$/;

export const calcularEdad = (fechaNacimiento: Date): number => {
  const hoy = new Date();
  let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
  const m = hoy.getMonth() - fechaNacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
    edad--;
  }
  return edad;
};

// Validador estricto de nombres y apellidos (previene "WW", "aaaa", strings solo consonantes)
export const validarNombrePersona = (val: string): { valido: boolean; mensaje?: string } => {
  const trimmed = val.trim();
  if (trimmed.length < 2) {
    return { valido: false, mensaje: 'Debe tener al menos 2 caracteres' };
  }
  if (trimmed.length > 50) {
    return { valido: false, mensaje: 'Máximo 50 caracteres' };
  }
  if (!soloLetras.test(trimmed)) {
    return { valido: false, mensaje: 'Solo letras y espacios' };
  }
  // No permitir caracteres repetidos absurdos (ej: "WW", "aa", "ZZ")
  if (trimmed.length === 2 && trimmed[0].toLowerCase() === trimmed[1].toLowerCase()) {
    return { valido: false, mensaje: 'No puede consistir en caracteres repetidos' };
  }
  // No permitir 3 o más letras iguales consecutivas (ej: "aaaa", "Juuuan")
  if (/(.)\1{2,}/i.test(trimmed)) {
    return { valido: false, mensaje: 'No puede contener caracteres repetidos continuos' };
  }
  // No permitir strings de solo consonantes si tienen más de 3 letras (ej: "WWWW", "BCDF")
  const soloAlfabeto = trimmed.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]/g, '');
  if (soloAlfabeto.length >= 3 && !/[aeiouáéíóúüAEIOUÁÉÍÓÚÜ]/.test(soloAlfabeto)) {
    return { valido: false, mensaje: 'Debe contener vocales válidas' };
  }
  return { valido: true };
};

export const registerSchema = z
  .object({
    nombre: z
      .string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(50, 'Máximo 50 caracteres')
      .regex(soloLetras, 'Solo letras y espacios')
      .superRefine((val, ctx) => {
        const check = validarNombrePersona(val);
        if (!check.valido) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: check.mensaje || 'Nombre inválido',
          });
        }
      }),
    apellido: z
      .string()
      .min(2, 'El apellido debe tener al menos 2 caracteres')
      .max(50, 'Máximo 50 caracteres')
      .regex(soloLetras, 'Solo letras y espacios')
      .superRefine((val, ctx) => {
        const check = validarNombrePersona(val);
        if (!check.valido) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: check.mensaje || 'Apellido inválido',
          });
        }
      }),
    email: z
      .string()
      .email('Email inválido')
      .toLowerCase()
      .trim(),
    dni: z
      .string()
      .regex(/^\d{7,8}$/, 'El DNI debe tener 7 u 8 dígitos (sin puntos)'),
    telefono: z
      .string()
      .regex(/^(\+?54)?\d{10,11}$/, 'Teléfono inválido (ej: 2235123456)')
      .transform((v) => v.replace(/\D/g, '')),
    password: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[a-z]/, 'Debe contener al menos una minúscula')
      .regex(/\d/, 'Debe contener al menos un número')
      .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un símbolo'),
    confirmarPassword: z.string(),
    fechaNacimiento: z
      .string()
      .optional()
      .superRefine((val, ctx) => {
        if (!val || val.trim() === '') return;
        const trimmed = val.trim();
        let y: number, m: number, d: number;
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
          const parts = trimmed.split('-');
          y = parseInt(parts[0], 10);
          m = parseInt(parts[1], 10) - 1;
          d = parseInt(parts[2], 10);
        } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
          const parts = trimmed.split('/');
          d = parseInt(parts[0], 10);
          m = parseInt(parts[1], 10) - 1;
          y = parseInt(parts[2], 10);
        } else {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Formato de fecha inválido (YYYY-MM-DD)',
          });
          return;
        }

        const parsed = new Date(y, m, d);
        if (parsed.getFullYear() !== y || parsed.getMonth() !== m || parsed.getDate() !== d) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Fecha inexistente en el calendario',
          });
          return;
        }

        const hoy = new Date();
        if (parsed > hoy) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'La fecha no puede ser futura',
          });
          return;
        }

        const edad = calcularEdad(parsed);
        if (edad < 18) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Debés ser mayor de 18 años para registrarte',
          });
          return;
        }
        if (edad > 120) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'La fecha no puede superar los 120 años de antigüedad',
          });
          return;
        }
      }),
    aceptaTerminos: z.boolean().refine((val) => val === true, {
      message: 'Debés aceptar los términos y condiciones',
    }),
  })
  .refine((data) => data.password === data.confirmarPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmarPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
export type RegisterForm = RegisterFormData;

export const loginSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .toLowerCase()
    .trim(),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type LoginForm = LoginFormData;
