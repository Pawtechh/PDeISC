/**
 * Archivo: clima.js
 * Propósito: Módulo propio para simular datos climáticos (Punto 1)
 */

// Datos simulados
const ciudades = {
  'Buenos Aires': { tempBase: 22, humedadBase: 65, condicion: 'Parcialmente nublado' },
  'Madrid': { tempBase: 18, humedadBase: 55, condicion: 'Soleado' },
  'Ciudad de México': { tempBase: 20, humedadBase: 60, condicion: 'Lluvia ligera' },
  'Nueva York': { tempBase: 15, humedadBase: 70, condicion: 'Nublado' }
};

/**
 * Obtiene clima actual de una ciudad (simulado)
 * @param {string} ciudad - Nombre de la ciudad
 * @returns {object} - Datos del clima
 */
export function obtenerClimaActual(ciudad) {
  const datos = ciudades[ciudad] || ciudades['Buenos Aires'];
  // Variación aleatoria de temperatura +/- 3 grados
  const variacion = Math.floor(Math.random() * 7) - 3;
  const temperatura = datos.tempBase + variacion;
  const humedadVariacion = Math.floor(Math.random() * 11) - 5;
  const humedad = Math.min(100, Math.max(0, datos.humedadBase + humedadVariacion));
  
  return {
    ciudad: ciudad,
    temperatura: temperatura,
    humedad: humedad,
    condicion: datos.condicion,
    actualizado: new Date().toLocaleTimeString()
  };
}

/**
 * Obtiene pronóstico para 3 días
 * @returns {array} - Lista de pronósticos diarios
 */
export function obtenerPronostico() {
  const condiciones = ['Soleado', 'Parcialmente nublado', 'Nublado', 'Lluvia ligera', 'Tormenta', 'Ventoso'];
  const pronostico = [];
  const hoy = new Date();
  
  for (let i = 1; i <= 3; i++) {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() + i);
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    pronostico.push({
      dia: `${diasSemana[fecha.getDay()]} ${fecha.getDate()}/${fecha.getMonth() + 1}`,
      tempMin: Math.floor(Math.random() * 15) + 5,
      tempMax: Math.floor(Math.random() * 15) + 20,
      condicion: condiciones[Math.floor(Math.random() * condiciones.length)]
    });
  }
  return pronostico;
}