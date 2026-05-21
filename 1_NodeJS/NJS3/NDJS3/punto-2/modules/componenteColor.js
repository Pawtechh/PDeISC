/**
 * Componente: Selector de Color
 * Evento: click en cada color, cambia fondo del preview
 */

const colores = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9', '#d63031', '#6c5ce7'];

export function renderColor() {
  const opcionesHtml = colores.map(color => `
    <div class="color-option" style="background-color: ${color};" data-color="${color}"></div>
  `).join('');
  
  return `
    <div id="colorComponent">
      <h2 class="component-title">Selector de Color</h2>
      <div id="colorPreview" class="color-preview" style="background-color: ${colores[0]};"></div>
      <div class="color-selector">
        ${opcionesHtml}
      </div>
      <p id="colorText" style="margin-top: 1rem;">Color seleccionado: ${colores[0]}</p>
    </div>
  `;
}

export function initColorEvents(mostrarMensaje) {
  const preview = document.getElementById('colorPreview');
  const colorText = document.getElementById('colorText');
  
  document.querySelectorAll('.color-option').forEach(option => {
    option.addEventListener('click', () => {
      const color = option.dataset.color;
      if (preview) preview.style.backgroundColor = color;
      if (colorText) colorText.textContent = `Color seleccionado: ${color}`;
      mostrarMensaje(`Color cambiado a ${color}`, 'success');
      
      // Marcar como seleccionado visualmente
      document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
      option.classList.add('selected');
    });
  });
  
  // Marcar el primero como seleccionado
  const firstOption = document.querySelector('.color-option');
  if (firstOption) firstOption.classList.add('selected');
}