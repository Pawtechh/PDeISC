/**
 * Archivo: domHelpers.js
 * Propósito: Funciones reutilizables para manipulación del DOM
 * Exporta: mostrarMensaje, crearImagen, cambiarTamanoImagen, cambiarTextoH1, cambiarColorH1
 */

/**
 * Muestra un mensaje en el area designada sin usar alert()
 * @param {string} mensaje - Texto a mostrar
 * @param {string} tipo - 'success', 'error', 'info'
 */
export function mostrarMensaje(mensaje, tipo = 'info') {
  const messageArea = document.getElementById('messageArea');
  if (!messageArea) return;
  
  // Determinar color segun tipo
  let color = '#007bff';
  if (tipo === 'success') color = '#28a745';
  if (tipo === 'error') color = '#dc3545';
  if (tipo === 'info') color = '#17a2b8';
  
  messageArea.style.borderLeftColor = color;
  messageArea.innerHTML = `<span style="color: ${color};">${mensaje}</span>`;
  
  // Auto limpiar despues de 3 segundos (opcional)
  setTimeout(() => {
    if (messageArea.innerHTML === `<span style="color: ${color};">${mensaje}</span>`) {
      messageArea.innerHTML = 'Listo para la siguiente acción';
      messageArea.style.borderLeftColor = 'var(--btn-bg)';
    }
  }, 3000);
}

/**
 * Crea un elemento img con atributos basicos
 * @param {string} src - URL de la imagen
 * @param {string} alt - Texto alternativo
 * @returns {HTMLImageElement}
 */
export function crearImagen(src, alt = 'imagen') {
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  img.style.width = '300px';
  img.style.height = 'auto';
  img.style.borderRadius = '8px';
  return img;
}

/**
 * Cambia el tamaño de una imagen alternando entre 150, 300 y 500px
 * @param {HTMLImageElement} img - Elemento imagen
 * @returns {number} - Nuevo ancho aplicado
 */
export function cambiarTamanoImagen(img) {
  const anchos = [150, 300, 500];
  const anchoActual = parseInt(img.style.width) || 300;
  let indice = anchos.indexOf(anchoActual);
  if (indice === -1) indice = 1;
  const nuevoAncho = anchos[(indice + 1) % anchos.length];
  img.style.width = `${nuevoAncho}px`;
  return nuevoAncho;
}

/**
 * Cambia el texto de un elemento H1
 * @param {HTMLElement} h1Element - Elemento h1
 * @param {string} nuevoTexto - Texto a establecer
 */
export function cambiarTextoH1(h1Element, nuevoTexto) {
  if (h1Element) {
    h1Element.textContent = nuevoTexto;
  }
}

/**
 * Cambia el color de un elemento H1 a un color aleatorio
 * @param {HTMLElement} h1Element - Elemento h1
 * @returns {string} - Color asignado en formato hex
 */
export function cambiarColorH1(h1Element) {
  const colores = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#e84393'];
  const colorAleatorio = colores[Math.floor(Math.random() * colores.length)];
  h1Element.style.color = colorAleatorio;
  return colorAleatorio;
}