/**
 * Archivo: calculos.js
 * Propósito: Módulo propio para operaciones matemáticas y conversiones (Punto 1)
 */

export class Calculadora {
  sumar(a, b) {
    this._validarNumeros(a, b);
    return a + b;
  }
  
  restar(a, b) {
    this._validarNumeros(a, b);
    return a - b;
  }
  
  multiplicar(a, b) {
    this._validarNumeros(a, b);
    return a * b;
  }
  
  dividir(a, b) {
    this._validarNumeros(a, b);
    if (b === 0) throw new Error('No se puede dividir por cero');
    return a / b;
  }
  
  _validarNumeros(a, b) {
    if (typeof a !== 'number' || typeof b !== 'number') {
      throw new Error('Ambos argumentos deben ser números');
    }
  }
}

/**
 * Convierte unidades entre diferentes sistemas
 * @param {number} valor - Valor a convertir
 * @param {string} desde - Unidad origen (m, km, kg, lb, ft)
 * @param {string} hasta - Unidad destino
 * @returns {number} - Valor convertido (redondeado a 2 decimales)
 */
export function convertirUnidades(valor, desde, hasta) {
  const conversiones = {
    'm_ft': valor * 3.28084,
    'ft_m': valor / 3.28084,
    'km_mi': valor * 0.621371,
    'mi_km': valor / 0.621371,
    'kg_lb': valor * 2.20462,
    'lb_kg': valor / 2.20462,
    'c_f': (valor * 9/5) + 32,
    'f_c': (valor - 32) * 5/9
  };
  
  const clave = `${desde}_${hasta}`;
  const resultado = conversiones[clave];
  
  if (resultado === undefined) {
    throw new Error(`Conversión no soportada: ${desde} → ${hasta}`);
  }
  
  return Math.round(resultado * 100) / 100;
}