// scripts/main.js - reduce() con sumas, multiplicaciones y totales
const alertContainer = document.getElementById('alertContainer');

function mostrarAlerta(mensaje, tipo = 'info') {
  const iconos = {
    success: 'bi-check-circle-fill',
    danger: 'bi-exclamation-triangle-fill',
    warning: 'bi-exclamation-circle-fill',
    info: 'bi-info-circle-fill'
  };
  const icono = iconos[tipo] || 'bi-info-circle-fill';
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${tipo} alert-dismissible fade show mb-2`;
  alertDiv.role = 'alert';
  alertDiv.innerHTML = `
    <i class="bi ${icono} me-2"></i> ${mensaje}
    <button type="button" class="btn-close" aria-label="Cerrar"></button>
  `;
  const closeBtn = alertDiv.querySelector('.btn-close');
  closeBtn.addEventListener('click', () => {
    alertDiv.classList.remove('show');
    alertDiv.classList.add('fade');
    setTimeout(() => alertDiv.remove(), 300);
  });
  alertContainer.insertAdjacentElement('beforeend', alertDiv);
  setTimeout(() => {
    if (alertDiv && alertDiv.parentNode) {
      alertDiv.classList.remove('show');
      alertDiv.classList.add('fade');
      setTimeout(() => {
        if (alertDiv && alertDiv.parentNode) alertDiv.remove();
      }, 300);
    }
  }, 5000);
}

// ========== 1. SUMA DE ELEMENTOS ==========
let numerosSuma = [4, 7, 2, 9];

function actualizarSuma() {
  document.getElementById('sumaArrayDisplay').textContent = `[ ${numerosSuma.join(', ')} ]`;
  document.getElementById('sumaCount').textContent = numerosSuma.length;
}

function calcularSuma() {
  if (numerosSuma.length === 0) {
    mostrarAlerta('Array vacío. Agrega números.', 'warning');
    document.getElementById('resultadoSuma').textContent = '0';
    return;
  }
  const total = numerosSuma.reduce((acc, num) => acc + num, 0);
  document.getElementById('resultadoSuma').textContent = total;
  mostrarAlerta(`Suma total: ${total}`, 'success');
}

function agregarSumando() {
  const input = document.getElementById('nuevoSumando');
  const val = input.value.trim();
  if (val === "") { mostrarAlerta("Ingresa un número.", "warning"); return; }
  const num = Number(val);
  if (isNaN(num)) { mostrarAlerta("Número inválido.", "warning"); input.value=""; return; }
  numerosSuma.push(num);
  actualizarSuma();
  mostrarAlerta(`➕ ${num} agregado.`, 'success');
  input.value = "";
}

function vaciarSuma() {
  numerosSuma = [];
  actualizarSuma();
  document.getElementById('resultadoSuma').textContent = '0';
  mostrarAlerta("Array de suma vaciado.", 'info');
}
function resetSuma() {
  numerosSuma = [4, 7, 2, 9];
  actualizarSuma();
  mostrarAlerta("⟳ Array restaurado.", 'info');
}

// ========== 2. MULTIPLICACIÓN DE ENTEROS ==========
let numerosMult = [2, 3, 4, 5];

function actualizarMult() {
  document.getElementById('multArrayDisplay').textContent = `[ ${numerosMult.join(', ')} ]`;
  document.getElementById('multCount').textContent = numerosMult.length;
}

function calcularMultiplicacion() {
  if (numerosMult.length === 0) {
    mostrarAlerta('Array vacío. Agrega números.', 'warning');
    document.getElementById('resultadoMult').textContent = '0';
    return;
  }
  const producto = numerosMult.reduce((acc, num) => acc * num, 1);
  document.getElementById('resultadoMult').textContent = producto;
  mostrarAlerta(`Producto total: ${producto}`, 'success');
}

function agregarMultiplicando() {
  const input = document.getElementById('nuevoMultiplicando');
  const val = input.value.trim();
  if (val === "") { mostrarAlerta("Ingresa un número.", "warning"); return; }
  const num = Number(val);
  if (isNaN(num)) { mostrarAlerta("Número inválido.", "warning"); input.value=""; return; }
  numerosMult.push(num);
  actualizarMult();
  mostrarAlerta(`➕ ${num} agregado.`, 'success');
  input.value = "";
}
function vaciarMult() {
  numerosMult = [];
  actualizarMult();
  document.getElementById('resultadoMult').textContent = '0';
  mostrarAlerta("Array de multiplicación vaciado.", 'info');
}
function resetMult() {
  numerosMult = [2, 3, 4, 5];
  actualizarMult();
  mostrarAlerta("⟳ Array restaurado.", 'info');
}

// ========== 3. TOTAL DE PRECIOS DESDE OBJETOS ==========
let productos = [
  { precio: 100 },
  { precio: 50 },
  { precio: 200 }
];

function actualizarPrecios() {
  const display = document.getElementById('preciosArrayDisplay');
  if (productos.length === 0) display.textContent = '[ ]';
  else {
    const strings = productos.map(p => `{precio:${p.precio}}`);
    display.textContent = `[ ${strings.join(', ')} ]`;
  }
  document.getElementById('preciosCount').textContent = productos.length;
}

function calcularTotal() {
  if (productos.length === 0) {
    mostrarAlerta('Array vacío. Agrega productos.', 'warning');
    document.getElementById('resultadoTotal').textContent = '0.00';
    return;
  }
  const total = productos.reduce((acc, p) => acc + p.precio, 0);
  document.getElementById('resultadoTotal').textContent = total.toFixed(2);
  mostrarAlerta(`Total acumulado: $${total.toFixed(2)}`, 'success');
}

function agregarProducto() {
  const nombreInput = document.getElementById('nombreProducto');
  const precioInput = document.getElementById('precioProducto');
  const nombre = nombreInput.value.trim();
  const precio = parseFloat(precioInput.value.trim());
  if (nombre === "" || isNaN(precio)) {
    mostrarAlerta("Completa nombre y precio válido.", "warning");
    return;
  }
  productos.push({ nombre, precio });
  actualizarPrecios();
  mostrarAlerta(`➕ "${nombre}" - $${precio} agregado.`, 'success');
  nombreInput.value = "";
  precioInput.value = "";
}
function vaciarPrecios() {
  productos = [];
  actualizarPrecios();
  document.getElementById('resultadoTotal').textContent = '0.00';
  mostrarAlerta("Array de productos vaciado.", 'info');
}
function resetPrecios() {
  productos = [
    { precio: 100 },
    { precio: 50 },
    { precio: 200 }
  ];
  actualizarPrecios();
  mostrarAlerta("⟳ Productos restaurados.", 'info');
}

// ========== EVENTOS (variados) ==========
// Suma
document.getElementById('calcularSumaBtn').addEventListener('click', calcularSuma);
document.getElementById('agregarSumandoBtn').addEventListener('click', agregarSumando);
document.getElementById('vaciarSumaBtn').addEventListener('click', vaciarSuma);
document.getElementById('sumaArrayDisplay').addEventListener('dblclick', resetSuma);
document.getElementById('nuevoSumando').addEventListener('keypress', (e) => { if (e.key === 'Enter') agregarSumando(); });

// Multiplicación (doble clic)
const btnMult = document.getElementById('calcularMultBtn');
btnMult.addEventListener('dblclick', calcularMultiplicacion);
document.getElementById('agregarMultBtn').addEventListener('click', agregarMultiplicando);
document.getElementById('vaciarMultBtn').addEventListener('click', vaciarMult);
document.getElementById('multArrayDisplay').addEventListener('dblclick', resetMult);
document.getElementById('nuevoMultiplicando').addEventListener('keypress', (e) => { if (e.key === 'Enter') agregarMultiplicando(); });

// Precios (focusout en inputs + click)
document.getElementById('calcularTotalBtn').addEventListener('click', calcularTotal);
document.getElementById('agregarProductoBtn').addEventListener('click', agregarProducto);
document.getElementById('vaciarPreciosBtn').addEventListener('click', vaciarPrecios);
document.getElementById('preciosArrayDisplay').addEventListener('dblclick', resetPrecios);
const nombreProd = document.getElementById('nombreProducto');
const precioProd = document.getElementById('precioProducto');
nombreProd.addEventListener('keypress', (e) => { if (e.key === 'Enter') agregarProducto(); });
precioProd.addEventListener('keypress', (e) => { if (e.key === 'Enter') agregarProducto(); });
nombreProd.addEventListener('focusout', () => { console.log('focusout en nombre'); });
precioProd.addEventListener('change', () => { mostrarAlerta('Precio actualizado. Usa "Agregar" para añadir.', 'info'); });

// Inicializar
actualizarSuma();
actualizarMult();
actualizarPrecios();