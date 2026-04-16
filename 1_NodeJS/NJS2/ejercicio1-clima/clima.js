export function obtenerClima(ciudad) {
  const ciudades = {
    "mar del plata": { temp: 18, condicion: "Parcialmente nublado", humedad: "72%" },
    "buenos aires":  { temp: 22, condicion: "Soleado",             humedad: "60%" },
    "cordoba":       { temp: 25, condicion: "Despejado",           humedad: "55%" },
  };
  const datos = ciudades[ciudad.toLowerCase()];
  if (!datos) return `No hay datos para "${ciudad}"`;
  return `Ciudad: ${ciudad} | Temp: ${datos.temp}°C | ${datos.condicion} | Humedad: ${datos.humedad}`;
}