import {
  validarLuhn,
  detectarMarca,
  noEstaVencida,
  diagnosticarNumeroTarjeta,
  diagnosticarVencimiento,
  formatearNumeroTarjeta,
  formatearVencimiento,
  formatearCVV,
  formatearDNI,
  TEST_CARDS,
} from '../cardValidation';

describe('Card Validation and Utilities (Bloque 2 & 3)', () => {
  describe('validarLuhn', () => {
    it('debe validar números de tarjeta válidos (Visa, Mastercard, Amex test cards)', () => {
      // Visa test cards
      expect(validarLuhn('4532015112830366')).toBe(true);
      expect(validarLuhn('4509 9535 6623 3704')).toBe(true);
      // Mastercard test cards
      expect(validarLuhn('5425233430109903')).toBe(true);
      expect(validarLuhn('5031 7557 3453 0604')).toBe(true);
      // Amex test cards
      expect(validarLuhn('3782 822463 10005')).toBe(true);
    });

    it('debe rechazar números de tarjeta que fallan la prueba de Luhn', () => {
      // Mismo número pero con último dígito cambiado
      expect(validarLuhn('4532015112830367')).toBe(false);
      expect(validarLuhn('4520 0151 1283 0366')).toBe(false);
      expect(validarLuhn('1234567890123456')).toBe(false);
      expect(validarLuhn('0000000000000000')).toBe(false);
      expect(validarLuhn('')).toBe(false);
      expect(validarLuhn('12345')).toBe(false);
    });
  });

  describe('diagnosticarNumeroTarjeta', () => {
    it('debe detectar si la tarjeta empieza con 0', () => {
      const res = diagnosticarNumeroTarjeta('0123456789012345');
      expect(res.esValido).toBe(false);
      expect(res.error).toBe('Las tarjetas no empiezan con 0');
    });

    it('debe detectar si faltan dígitos (<13)', () => {
      const res = diagnosticarNumeroTarjeta('4532 0151');
      expect(res.esValido).toBe(false);
      expect(res.error).toContain('Faltan dígitos');
    });

    it('debe detectar dígitos repetidos absurdos (1111111111111111)', () => {
      const res = diagnosticarNumeroTarjeta('1111 1111 1111 1111');
      expect(res.esValido).toBe(false);
      expect(res.error).toBe('Número inválido (dígitos repetidos)');
    });

    it('debe advertir específicamente si falla el checksum de Luhn', () => {
      const res = diagnosticarNumeroTarjeta('4520 0151 1283 0366');
      expect(res.esValido).toBe(false);
      expect(res.error).toBe('Número inválido. Revisá que esté bien escrito.');
    });

    it('debe aprobar tarjetas de prueba válidas', () => {
      const res = diagnosticarNumeroTarjeta('4509 9535 6623 3704');
      expect(res.esValido).toBe(true);
      expect(res.error).toBeUndefined();
    });
  });

  describe('diagnosticarVencimiento', () => {
    it('debe rechazar tarjetas vencidas en años anteriores', () => {
      const res = diagnosticarVencimiento('05/20');
      expect(res.esValido).toBe(false);
      expect(res.error).toBe('Tarjeta vencida');
    });

    it('debe rechazar tarjetas a más de 10 años en el futuro', () => {
      const hoy = new Date();
      const anioLejano = (hoy.getFullYear() % 100) + 12;
      const res = diagnosticarVencimiento(`12/${anioLejano}`);
      expect(res.esValido).toBe(false);
      expect(res.error).toContain('máximo 10 años');
    });

    it('debe emitir advertencia si la tarjeta vence este mes', () => {
      const hoy = new Date();
      const mesStr = String(hoy.getMonth() + 1).padStart(2, '0');
      const anioStr = String(hoy.getFullYear() % 100).padStart(2, '0');
      const res = diagnosticarVencimiento(`${mesStr}/${anioStr}`);
      expect(res.esValido).toBe(true);
      expect(res.advertencia).toBe('⚠️ Vence este mes');
    });

    it('debe aprobar fechas válidas en el futuro próximo', () => {
      const res = diagnosticarVencimiento('12/28');
      expect(res.esValido).toBe(true);
      expect(res.error).toBeUndefined();
    });
  });

  describe('detectarMarca', () => {
    it('debe detectar Visa correctamente', () => {
      expect(detectarMarca('4532 0151 1283 0366')).toBe('visa');
      expect(detectarMarca('4509 9535 6623 3704')).toBe('visa');
    });

    it('debe detectar Mastercard correctamente (51-55 y 2221-2720)', () => {
      expect(detectarMarca('5425 2334 3010 9903')).toBe('mastercard');
      expect(detectarMarca('5031 7557 3453 0604')).toBe('mastercard');
    });

    it('debe detectar American Express correctamente (34 o 37)', () => {
      expect(detectarMarca('3782 822463 10005')).toBe('amex');
    });

    it('debe clasificar tarjetas no reconocidas como desconocida', () => {
      expect(detectarMarca('6011 0000 0000 0000')).toBe('desconocida');
    });
  });

  describe('TEST_CARDS constantes para entorno DEV', () => {
    it('todas las tarjetas de prueba deben pasar el algoritmo de Luhn', () => {
      TEST_CARDS.forEach((card) => {
        expect(validarLuhn(card.numero)).toBe(true);
      });
    });
  });

  describe('Formateadores en tiempo real', () => {
    it('debe formatear número de tarjeta con espacios cada 4 dígitos', () => {
      expect(formatearNumeroTarjeta('4509953566233704')).toBe('4509 9535 6623 3704');
    });

    it('debe formatear vencimiento agregando la barra diagonal', () => {
      expect(formatearVencimiento('1228')).toBe('12/28');
    });

    it('debe formatear CVV restringiendo longitud según la marca', () => {
      expect(formatearCVV('12345', 'visa')).toBe('123');
      expect(formatearCVV('12345', 'amex')).toBe('1234');
    });

    it('debe formatear DNI hasta 8 dígitos numéricos', () => {
      expect(formatearDNI('3812345678')).toBe('38123456');
    });
  });
});
