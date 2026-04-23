const contenido = document.getElementById('contenido');

let h1 = null;
let img = null;

// Agregar H1
document.getElementById('btnAgregarH1').addEventListener('click', () => {
  if (!h1) {
    h1 = document.createElement('h1');
    h1.textContent = 'Hola DOM';
    contenido.appendChild(h1);
  }
});

// Cambiar texto (ahora alterna)
document.getElementById('btnCambiarTexto').addEventListener('click', () => {
  if (h1) {
    h1.textContent = h1.textContent === 'Hola DOM' ? 'Chau DOM' : 'Hola DOM';
  }
});

// Cambiar color (alterna)
document.getElementById('btnColor').addEventListener('click', () => {
  if (h1) {
    h1.style.color = h1.style.color === 'red' ? 'blue' : 'red';
  }
});

// Agregar imagen (UNA sola vez, sin duplicado)
document.getElementById('btnAgregarImg').addEventListener('click', () => {
  if (!img) {
    img = document.createElement('img');
    img.src = 'https://picsum.photos/200';
    img.style.width = '200px';
    contenido.appendChild(img);
  }
});

// Cambiar imagen (sin cache)
document.getElementById('btnCambiarImg').addEventListener('click', () => {
  if (img) {
    img.src = 'https://picsum.photos/300?' + new Date().getTime();
  }
});

// Cambiar tamaño (alterna)
document.getElementById('btnTamano').addEventListener('click', () => {
  if (img) {
    img.style.width = img.style.width === '300px' ? '150px' : '300px';
  }
});