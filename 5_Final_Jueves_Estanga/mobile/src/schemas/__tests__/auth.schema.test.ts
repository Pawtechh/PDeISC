import { registerSchema, loginSchema, calcularEdad } from '../auth.schema';

describe('Auth Zod Schemas Unit Tests (Bloque 2)', () => {
  describe('calcularEdad', () => {
    it('debe calcular correctamente la edad para una persona nacida hace 20 años', () => {
      const fecha = new Date();
      fecha.setFullYear(fecha.getFullYear() - 20);
      expect(calcularEdad(fecha)).toBeGreaterThanOrEqual(20);
    });

    it('debe calcular menor de 18 si nació hace 17 años', () => {
      const fecha = new Date();
      fecha.setFullYear(fecha.getFullYear() - 17);
      expect(calcularEdad(fecha)).toBeLessThan(18);
    });
  });

  describe('registerSchema validation', () => {
    const validData = {
      nombre: 'Lucas',
      apellido: 'Peralta',
      email: 'lucas.peralta@surfmdp.com',
      dni: '38123456',
      telefono: '2235123456',
      password: 'Password123!',
      confirmarPassword: 'Password123!',
      fechaNacimiento: '1995-05-15',
      aceptaTerminos: true,
    };

    it('debe validar exitosamente datos completos y correctos', () => {
      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('lucas.peralta@surfmdp.com');
        expect(result.data.telefono).toBe('2235123456');
      }
    });

    it('debe aceptar números de teléfono con +54 y formatearlos a dígitos', () => {
      const result = registerSchema.safeParse({
        ...validData,
        telefono: '+542235123456',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.telefono).toBe('542235123456');
      }
    });

    it('debe rechazar nombres con números o caracteres inválidos', () => {
      const result = registerSchema.safeParse({
        ...validData,
        nombre: 'Lucas123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('nombre');
      }
    });

    it('debe rechazar apellido menor a 2 caracteres', () => {
      const result = registerSchema.safeParse({
        ...validData,
        apellido: 'A',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('apellido');
      }
    });

    it('debe rechazar DNI con puntos o letras', () => {
      const resultWithDots = registerSchema.safeParse({
        ...validData,
        dni: '38.123.456',
      });
      expect(resultWithDots.success).toBe(false);

      const resultWithLetters = registerSchema.safeParse({
        ...validData,
        dni: '3812345A',
      });
      expect(resultWithLetters.success).toBe(false);
    });

    it('debe rechazar DNI con longitud menor a 7 o mayor a 8 dígitos', () => {
      const resultShort = registerSchema.safeParse({
        ...validData,
        dni: '12345',
      });
      expect(resultShort.success).toBe(false);

      const resultLong = registerSchema.safeParse({
        ...validData,
        dni: '123456789',
      });
      expect(resultLong.success).toBe(false);
    });

    it('debe rechazar contraseñas que no cumplen requisitos de complejidad', () => {
      // Sin mayúscula
      expect(
        registerSchema.safeParse({
          ...validData,
          password: 'password123!',
          confirmarPassword: 'password123!',
        }).success
      ).toBe(false);

      // Sin número
      expect(
        registerSchema.safeParse({
          ...validData,
          password: 'Password!',
          confirmarPassword: 'Password!',
        }).success
      ).toBe(false);

      // Sin símbolo
      expect(
        registerSchema.safeParse({
          ...validData,
          password: 'Password123',
          confirmarPassword: 'Password123',
        }).success
      ).toBe(false);

      // Menor a 8 caracteres
      expect(
        registerSchema.safeParse({
          ...validData,
          password: 'Pass1!',
          confirmarPassword: 'Pass1!',
        }).success
      ).toBe(false);
    });

    it('debe rechazar si confirmarPassword no coincide con password', () => {
      const result = registerSchema.safeParse({
        ...validData,
        confirmarPassword: 'DifferentPassword123!',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('confirmarPassword');
        expect(result.error.issues[0].message).toBe('Las contraseñas no coinciden');
      }
    });

    it('debe rechazar nombres absurdos como WW, aaaa, o solo consonantes', () => {
      // Repetido absurdo de 2 letras
      const resWW = registerSchema.safeParse({ ...validData, nombre: 'WW' });
      expect(resWW.success).toBe(false);

      // Repetido de 3+ letras
      const resAaaa = registerSchema.safeParse({ ...validData, apellido: 'aaaa' });
      expect(resAaaa.success).toBe(false);

      // Solo consonantes
      const resWWWW = registerSchema.safeParse({ ...validData, nombre: 'WWWW' });
      expect(resWWWW.success).toBe(false);
    });

    it('debe rechazar menores de 18 años si se provee fechaNacimiento', () => {
      const fechaMenor = new Date();
      fechaMenor.setFullYear(fechaMenor.getFullYear() - 16);
      const isoMenor = fechaMenor.toISOString().split('T')[0];

      const result = registerSchema.safeParse({
        ...validData,
        fechaNacimiento: isoMenor,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('fechaNacimiento');
        expect(result.error.issues[0].message).toContain('Debés ser mayor de 18 años');
      }
    });

    it('debe rechazar fecha de nacimiento futura o mayor a 120 años', () => {
      // Fecha futura
      const fechaFutura = new Date();
      fechaFutura.setFullYear(fechaFutura.getFullYear() + 2);
      const isoFutura = fechaFutura.toISOString().split('T')[0];

      const resFutura = registerSchema.safeParse({
        ...validData,
        fechaNacimiento: isoFutura,
      });
      expect(resFutura.success).toBe(false);

      // Mayor a 120 años
      const resAntigua = registerSchema.safeParse({
        ...validData,
        fechaNacimiento: '1890-01-01',
      });
      expect(resAntigua.success).toBe(false);
    });

    it('debe aceptar si no se proporciona fechaNacimiento (campo opcional)', () => {
      const resSinFecha = registerSchema.safeParse({
        ...validData,
        fechaNacimiento: undefined,
      });
      expect(resSinFecha.success).toBe(true);

      const resFechaVacia = registerSchema.safeParse({
        ...validData,
        fechaNacimiento: '',
      });
      expect(resFechaVacia.success).toBe(true);
    });

    it('debe rechazar si no se aceptan los términos y condiciones', () => {
      const result = registerSchema.safeParse({
        ...validData,
        aceptaTerminos: false,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('aceptaTerminos');
      }
    });
  });

  describe('loginSchema validation', () => {
    it('debe validar email y password correctamente', () => {
      const result = loginSchema.safeParse({
        email: 'SURFISTA@MDP.COM',
        password: 'Password123!',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('surfista@mdp.com');
      }
    });

    it('debe rechazar emails inválidos', () => {
      const result = loginSchema.safeParse({
        email: 'no-es-un-email',
        password: 'Password123!',
      });
      expect(result.success).toBe(false);
    });

    it('debe rechazar passwords vacíos', () => {
      const result = loginSchema.safeParse({
        email: 'test@surf.com',
        password: '',
      });
      expect(result.success).toBe(false);
    });
  });
});
