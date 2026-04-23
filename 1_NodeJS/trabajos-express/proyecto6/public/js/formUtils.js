export function obtenerDatos() {
  const nombre = document.getElementById('fNombre').value.trim();
  const edad   = document.getElementById('fEdad').value;
  const email  = document.getElementById('fEmail').value.trim();
  const genero = document.querySelector('input[name="genero"]:checked')?.value || '';
  const pais   = document.getElementById('fPais').value;
  const intereses = [...document.querySelectorAll('input[type="checkbox"]:checked')]
                      .map(c => c.value).join(', ') || 'Ninguno';

  if (!nombre || !edad || !email || !genero || !pais) {
    mostrarError('Completá todos los campos obligatorios.');
    return null;
  }

  return { Nombre: nombre, Edad: edad, Email: email, Género: genero, País: pais, Intereses: intereses };
}

function mostrarError(msg) {
  let error = document.getElementById('error-msg');

  if (!error) {
    error = document.createElement('div');
    error.id = 'error-msg';
    error.style.color = 'red';
    error.style.marginBottom = '10px';
    document.querySelector('.panel').prepend(error);
  }

  error.textContent = msg;
}

export function mostrarResultado(datos) {
  const contenedor = document.getElementById('campos-resultado');
  const panel      = document.getElementById('resultado-registro');

  contenedor.innerHTML = '';
  panel.classList.remove('d-none');

  Object.entries(datos).forEach(([clave, valor]) => {
    const fila = document.createElement('div');
    fila.className = 'dato-fila';
    fila.innerHTML = `<span class="dato-label">${clave}</span><span class="dato-valor">${valor}</span>`;
    contenedor.appendChild(fila);
  });
}