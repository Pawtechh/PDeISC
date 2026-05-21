/**
 * Componente: Texto Dinámico
 * Eventos: cambiar texto, cambiar tamaño, cambiar estilo
 */

export function renderTexto() {
  return `
    <div id="textoComponent">
      <h2 class="component-title">Texto Dinámico</h2>
      <div id="textoDinamico" class="texto-dinamico">Texto de ejemplo</div>
      <input type="text" id="textoInput" placeholder="Escribe nuevo texto..." style="width: 100%; padding: 0.5rem; margin-bottom: 1rem;">
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <button id="cambiarTextoBtn" class="nav-btn">Cambiar Texto</button>
        <button id="aumentarTamañoBtn" class="nav-btn">Aumentar Tamaño</button>
        <button id="disminuirTamañoBtn" class="nav-btn">Disminuir Tamaño</button>
        <button id="alternarNegritaBtn" class="nav-btn">Negrita</button>
      </div>
    </div>
  `;
}

export function initTextoEvents(mostrarMensaje) {
  const textoElement = document.getElementById('textoDinamico');
  const input = document.getElementById('textoInput');
  let fontSize = 1.2;
  
  const actualizarFontSize = () => {
    if (textoElement) textoElement.style.fontSize = `${fontSize}rem`;
  };
  
  const cambiarTexto = () => {
    if (input && textoElement) {
      const nuevoTexto = input.value.trim();
      if (nuevoTexto) {
        textoElement.textContent = nuevoTexto;
        mostrarMensaje(`Texto cambiado a: "${nuevoTexto}"`, 'success');
        input.value = '';
      } else {
        mostrarMensaje('Escribe algo primero', 'error');
      }
    }
  };
  
  const aumentar = () => {
    fontSize = Math.min(fontSize + 0.2, 3);
    actualizarFontSize();
    mostrarMensaje(`Tamaño: ${fontSize}rem`, 'success');
  };
  
  const disminuir = () => {
    fontSize = Math.max(fontSize - 0.2, 0.8);
    actualizarFontSize();
    mostrarMensaje(`Tamaño: ${fontSize}rem`, 'success');
  };
  
  let negritaActiva = false;
  const alternarNegrita = () => {
    negritaActiva = !negritaActiva;
    if (textoElement) {
      textoElement.style.fontWeight = negritaActiva ? 'bold' : 'normal';
    }
    mostrarMensaje(negritaActiva ? 'Negrita activada' : 'Negrita desactivada', 'success');
  };
  
  const cambiarBtn = document.getElementById('cambiarTextoBtn');
  const aumentarBtn = document.getElementById('aumentarTamañoBtn');
  const disminuirBtn = document.getElementById('disminuirTamañoBtn');
  const negritaBtn = document.getElementById('alternarNegritaBtn');
  
  if (cambiarBtn) cambiarBtn.addEventListener('click', cambiarTexto);
  if (aumentarBtn) aumentarBtn.addEventListener('click', aumentar);
  if (disminuirBtn) disminuirBtn.addEventListener('click', disminuir);
  if (negritaBtn) negritaBtn.addEventListener('click', alternarNegrita);
  if (input) input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') cambiarTexto();
  });
}