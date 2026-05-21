/**
 * Componente: Contador
 * Evento: click en botones incrementar/decrementar/reset
 */

export function renderContador() {
  return `
    <div id="contadorComponent">
      <h2 class="component-title">Contador</h2>
      <div class="counter-display" id="counterValue">0</div>
      <div class="counter-buttons">
        <button id="decrementBtn" class="nav-btn" style="background-color: var(--btn-danger);">-1</button>
        <button id="resetBtn" class="nav-btn">Reset</button>
        <button id="incrementBtn" class="nav-btn" style="background-color: var(--btn-success);">+1</button>
      </div>
    </div>
  `;
}

export function initContadorEvents(mostrarMensaje) {
  let valor = 0;
  const display = document.getElementById('counterValue');
  if (!display) return;
  
  const actualizarDisplay = () => {
    display.textContent = valor;
  };
  
  const incrementar = () => {
    valor++;
    actualizarDisplay();
    mostrarMensaje(`Contador: ${valor}`, 'success');
  };
  
  const decrementar = () => {
    valor--;
    actualizarDisplay();
    mostrarMensaje(`Contador: ${valor}`, 'info');
  };
  
  const resetear = () => {
    valor = 0;
    actualizarDisplay();
    mostrarMensaje('Contador reiniciado', 'info');
  };
  
  const incBtn = document.getElementById('incrementBtn');
  const decBtn = document.getElementById('decrementBtn');
  const resetBtn = document.getElementById('resetBtn');
  
  if (incBtn) incBtn.addEventListener('click', incrementar);
  if (decBtn) decBtn.addEventListener('click', decrementar);
  if (resetBtn) resetBtn.addEventListener('click', resetear);
}