/**
 * Componente: Calculadora Simple
 * Eventos: clicks en botones numéricos y operadores
 */

export function renderCalculadora() {
  return `
    <div id="calculadoraComponent">
      <h2 class="component-title">Calculadora Simple</h2>
      <div id="calcDisplay" class="calc-display">0</div>
      <div class="calc-buttons">
        <button class="calc-btn" data-val="7">7</button>
        <button class="calc-btn" data-val="8">8</button>
        <button class="calc-btn" data-val="9">9</button>
        <button class="calc-btn" data-op="/">÷</button>
        <button class="calc-btn" data-val="4">4</button>
        <button class="calc-btn" data-val="5">5</button>
        <button class="calc-btn" data-val="6">6</button>
        <button class="calc-btn" data-op="*">×</button>
        <button class="calc-btn" data-val="1">1</button>
        <button class="calc-btn" data-val="2">2</button>
        <button class="calc-btn" data-val="3">3</button>
        <button class="calc-btn" data-op="-">-</button>
        <button class="calc-btn" data-val="0">0</button>
        <button class="calc-btn" data-val=".">.</button>
        <button class="calc-btn" data-action="=">=</button>
        <button class="calc-btn" data-op="+">+</button>
        <button class="calc-btn" data-action="C" style="grid-column: span 2;">C</button>
      </div>
    </div>
  `;
}

export function initCalculadoraEvents(mostrarMensaje) {
  const display = document.getElementById('calcDisplay');
  let currentInput = '0';
  let previousInput = '';
  let operation = null;
  
  const actualizarDisplay = () => {
    if (display) display.textContent = currentInput;
  };
  
  const calcular = () => {
    if (!operation || previousInput === '') return;
    const prev = parseFloat(previousInput);
    const curr = parseFloat(currentInput);
    if (isNaN(prev) || isNaN(curr)) return;
    
    let resultado;
    switch (operation) {
      case '+': resultado = prev + curr; break;
      case '-': resultado = prev - curr; break;
      case '*': resultado = prev * curr; break;
      case '/': resultado = curr !== 0 ? prev / curr : 'Error'; break;
      default: return;
    }
    
    if (resultado === 'Error') {
      currentInput = 'Error';
      mostrarMensaje('No se puede dividir por cero', 'error');
    } else {
      currentInput = resultado.toString();
      mostrarMensaje(`Resultado: ${currentInput}`, 'success');
    }
    operation = null;
    previousInput = '';
    actualizarDisplay();
  };
  
  const manejarNumero = (valor) => {
    if (currentInput === '0' || currentInput === 'Error') {
      currentInput = valor;
    } else {
      currentInput += valor;
    }
    actualizarDisplay();
  };
  
  const manejarOperador = (op) => {
    if (currentInput === 'Error') {
      currentInput = '0';
    }
    if (previousInput !== '' && operation) {
      calcular();
      previousInput = currentInput;
      currentInput = '0';
    } else {
      previousInput = currentInput;
      currentInput = '0';
    }
    operation = op;
    mostrarMensaje(`Operador: ${op}`, 'info');
  };
  
  const limpiar = () => {
    currentInput = '0';
    previousInput = '';
    operation = null;
    actualizarDisplay();
    mostrarMensaje('Calculadora reiniciada', 'info');
  };
  
  document.querySelectorAll('.calc-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.dataset.val;
      const op = btn.dataset.op;
      const action = btn.dataset.action;
      
      if (val !== undefined) {
        if (val === '.' && currentInput.includes('.')) return;
        manejarNumero(val);
      } else if (op !== undefined) {
        manejarOperador(op);
      } else if (action === '=') {
        calcular();
      } else if (action === 'C') {
        limpiar();
      }
    });
  });
}