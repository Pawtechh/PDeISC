import { obtenerDatos, mostrarResultado } from './formUtils.js';

const form = document.getElementById('formRegistro');

form.addEventListener('submit', (e) => {
  e.preventDefault(); // evita recarga

  if (!form.checkValidity()) {
    form.reportValidity(); // muestra errores HTML
    return;
  }

  const datos = obtenerDatos();
  if (!datos) return;

  mostrarResultado(datos);
});