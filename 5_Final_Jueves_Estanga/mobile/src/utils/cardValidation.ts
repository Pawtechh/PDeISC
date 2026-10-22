/**
 * Utilidades de validación y formateo de tarjetas para Surf Rental MDP
 * Modo Dev / Sandbox - Validación exhaustiva local (Algoritmo de Luhn, marcas, vencimiento)
 */

export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'desconocida';

/**
 * Algoritmo de Luhn (Checksum Mod 10)
 */
export const validarLuhn = (numero: string): boolean => {
  const digitsOnly = numero.replace(/\D/g, '');
  if (!digitsOnly || digitsOnly.length < 13 || digitsOnly.length > 19) {
    return false;
  }

  let sum = 0;
  let shouldDouble = false;

  for (let i = digitsOnly.length - 1; i >= 0; i--) {
    let digit = parseInt(digitsOnly.charAt(i), 10);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  if (sum === 0) return false;

  return sum % 10 === 0;
};

/**
 * Detección de marca de tarjeta por prefijo (IIN / BIN)
 */
export const detectarMarca = (numero: string): CardBrand => {
  const clean = numero.replace(/\D/g, '');
  if (!clean) return 'desconocida';

  // Visa: empieza con 4
  if (/^4/.test(clean)) {
    return 'visa';
  }

  // Mastercard / Mastercard Débito (50-58 o 2221-2720)
  const prefix2 = parseInt(clean.slice(0, 2), 10);
  const prefix4 = parseInt(clean.slice(0, 4), 10);
  if ((prefix2 >= 50 && prefix2 <= 58) || (prefix4 >= 2221 && prefix4 <= 2720)) {
    return 'mastercard';
  }

  // American Express: 34 o 37
  if (/^3[47]/.test(clean)) {
    return 'amex';
  }

  return 'desconocida';
};

/**
 * Validador de fecha de vencimiento (MM/AA)
 */
export const noEstaVencida = (mmYY: string): boolean => {
  return diagnosticarVencimiento(mmYY).esValido;
};

export interface CardNumberValidationResult {
  esValido: boolean;
  error?: string;
  advertencia?: string;
}

/**
 * Diagnóstico detallado del número de tarjeta con mensajes amigables y específicos
 */
export const diagnosticarNumeroTarjeta = (numero: string): CardNumberValidationResult => {
  const clean = numero.replace(/\D/g, '');
  if (!clean) {
    return { esValido: false, error: 'Ingresá el número de tarjeta' };
  }
  if (clean.startsWith('0')) {
    return { esValido: false, error: 'Las tarjetas no empiezan con 0' };
  }
  if (clean.length < 13) {
    return { esValido: false, error: 'Faltan dígitos (mínimo 13 dígitos)' };
  }
  if (/^(\d)\1+$/.test(clean)) {
    return { esValido: false, error: 'Número inválido (dígitos repetidos)' };
  }
  if (!validarLuhn(clean)) {
    return { esValido: false, error: 'Número inválido. Revisá que esté bien escrito.' };
  }
  return { esValido: true };
};

export interface ExpirationValidationResult {
  esValido: boolean;
  error?: string;
  advertencia?: string;
}

/**
 * Diagnóstico detallado del vencimiento (MM/AA)
 */
export const diagnosticarVencimiento = (mmYY: string): ExpirationValidationResult => {
  if (!mmYY || !mmYY.trim()) {
    return { esValido: false, error: 'Ingresá el vencimiento (MM/AA)' };
  }
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(mmYY.trim())) {
    return { esValido: false, error: 'Formato inválido (MM/AA)' };
  }

  const [mesStr, anioStr] = mmYY.trim().split('/');
  const mes = parseInt(mesStr, 10);
  const anio = parseInt(anioStr, 10);

  const hoy = new Date();
  const anioActual = hoy.getFullYear() % 100; // Ej: 26 para 2026
  const mesActual = hoy.getMonth() + 1; // 1-12

  if (anio < anioActual || (anio === anioActual && mes < mesActual)) {
    return { esValido: false, error: 'Tarjeta vencida' };
  }
  if (anio > anioActual + 10) {
    return { esValido: false, error: 'Fecha inválida (máximo 10 años en el futuro)' };
  }
  if (anio === anioActual && mes === mesActual) {
    return { esValido: true, advertencia: '⚠️ Vence este mes' };
  }

  return { esValido: true };
};

/**
 * Tarjetas de prueba válidas para entorno de desarrollo (Modo Sandbox)
 */
export const TEST_CARDS = [
  {
    marca: 'Visa',
    numero: '4509 9535 6623 3704',
    vencimiento: '12/28',
    cvv: '123',
    titular: 'LUCAS PERALTA',
  },
  {
    marca: 'Mastercard',
    numero: '5031 7557 3453 0604',
    vencimiento: '10/28',
    cvv: '456',
    titular: 'MARIA SOL',
  },
  {
    marca: 'Amex',
    numero: '3782 822463 10005',
    vencimiento: '11/27',
    cvv: '1234',
    titular: 'SANTIAGO G',
  },
];

/**
 * Formatea número de tarjeta en tiempo real con espacios cada 4 dígitos
 */
export const formatearNumeroTarjeta = (val: string): string => {
  const digits = val.replace(/\D/g, '').slice(0, 19);
  const brand = detectarMarca(digits);

  // Amex: 4-6-5 formato tradicional
  if (brand === 'amex') {
    const p1 = digits.slice(0, 4);
    const p2 = digits.slice(4, 10);
    const p3 = digits.slice(10, 15);
    return [p1, p2, p3].filter(Boolean).join(' ');
  }

  // Visa, Mastercard y estándar: bloques de 4
  const parts: string[] = [];
  for (let i = 0; i < digits.length; i += 4) {
    parts.push(digits.slice(i, i + 4));
  }
  return parts.join(' ');
};

/**
 * Formatea vencimiento en tiempo real (agrega "/" tras 2 dígitos)
 */
export const formatearVencimiento = (val: string): string => {
  const digits = val.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) {
    return digits;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
};

/**
 * Formatea CVV (máx 4 dígitos para Amex, máx 3 para otros)
 */
export const formatearCVV = (val: string, marca: CardBrand = 'desconocida'): string => {
  const maxLen = marca === 'amex' ? 4 : 3;
  return val.replace(/\D/g, '').slice(0, maxLen);
};

/**
 * Formatea DNI (solo dígitos, hasta 8)
 */
export const formatearDNI = (val: string): string => {
  return val.replace(/\D/g, '').slice(0, 8);
};
