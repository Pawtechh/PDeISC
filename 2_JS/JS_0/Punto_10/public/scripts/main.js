// scripts/main.js - map() con arrays originales y nuevos
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

// ========== 1. NÚMEROS ×3 ==========
let numeros = [2, 5, 7, 10];

function actualizarNumeros() {
  document.getElementById('numerosOriginalDisplay').textContent = `[ ${numeros.join(', ')} ]`;
  document.getElementById('numerosCount').textContent = numeros.length;
}

function multiplicarPorTres() {
  if (numeros.length === 0) {
    mostrarAlerta('Array vacío. Agrega números primero.', 'warning');
    document.getElementById('salidaMultiplicados').textContent = '[ ]';
    return;
  }
  const multiplicados = numeros.map(n => n * 3);
  document.getElementById('salidaMultiplicados').textContent = `[ ${multiplicados.join(', ')} ]`;
  mostrarAlerta(`Nuevo array creado con map(): [${multiplicados.join(', ')}]`, 'success');
}

function agregarNumero() {
  const input = document.getElementById('nuevoNumero');
  const val = input.value.trim();
  if (val === "") { mostrarAlerta("Ingresa un número.", "warning"); return; }
  const num = Number(val);
  if (isNaN(num)) { mostrarAlerta("Número inválido.", "warning"); input.value=""; return; }
  numeros.push(num);
  actualizarNumeros();
  mostrarAlerta(`➕ ${num} agregado.`, 'success');
  input.value = "";
}

function vaciarNumeros() {
  numeros = [];
  actualizarNumeros();
  document.getElementById('salidaMultiplicados').textContent = '[ ]';
  mostrarAlerta("Array de números vaciado.", 'info');
}
function resetNumeros() {
  numeros = [2, 5, 7, 10];
  actualizarNumeros();
  mostrarAlerta("⟳ Números restaurados.", 'info');
}

// ========== 2. NOMBRES A MAYÚSCULAS ==========
let nombres = ['ana', 'luis', 'carla', 'diego'];

function actualizarNombres() {
  document.getElementById('nombresOriginalDisplay').textContent = `[ ${nombres.join(', ')} ]`;
  document.getElementById('nombresCount').textContent = nombres.length;
}

function convertirMayusculas() {
  if (nombres.length === 0) {
    mostrarAlerta('Array vacío. Agrega nombres.', 'warning');
    document.getElementById('salidaMayusculas').textContent = '[ ]';
    return;
  }
  const mayus = nombres.map(n => n.toUpperCase());
  document.getElementById('salidaMayusculas').textContent = `[ ${mayus.join(', ')} ]`;
  mostrarAlerta(`Nuevo array con mayúsculas: [${mayus.join(', ')}]`, 'success');
}

function agregarNombre() {
  const input = document.getElementById('nuevoNombre');
  const nuevo = input.value.trim();
  if (nuevo === "") { mostrarAlerta("Escribe un nombre.", "warning"); return; }
  nombres.push(nuevo);
  actualizarNombres();
  mostrarAlerta(`➕ "${nuevo}" agregado.`, 'success');
  input.value = "";
}
function vaciarNombres() {
  nombres = [];
  actualizarNombres();
  document.getElementById('salidaMayusculas').textContent = '[ ]';
  mostrarAlerta("Array de nombres vaciado.", 'info');
}
function resetNombres() {
  nombres = ['ana', 'luis', 'carla', 'diego'];
  actualizarNombres();
  mostrarAlerta("⟳ Nombres restaurados.", 'info');
}

// ========== 3. PRECIOS + IVA 21% ==========
let precios = [100, 50, 200, 75];

function actualizarPrecios() {
  document.getElementById('preciosOriginalDisplay').textContent = `[ ${precios.join(', ')} ]`;
  document.getElementById('preciosCount').textContent = precios.length;
}

function aplicarIva() {
  if (precios.length === 0) {
    mostrarAlerta('Array vacío. Agrega precios.', 'warning');
    document.getElementById('salidaConIva').textContent = '[ ]';
    return;
  }
  const conIva = precios.map(p => +(p * 1.21).toFixed(2)); // redondeo a 2 decimales
  document.getElementById('salidaConIva').textContent = `[ ${conIva.join(', ')} ]`;
  mostrarAlerta(`Precios con IVA 21%: [${conIva.join(', ')}]`, 'success');
}

function agregarPrecio() {
  const input = document.getElementById('nuevoPrecio');
  const val = input.value.trim();
  if (val === "") { mostrarAlerta("Ingresa un precio.", "warning"); return; }
  const precio = parseFloat(val);
  if (isNaN(precio)) { mostrarAlerta("Precio inválido.", "warning"); input.value=""; return; }
  precios.push(precio);
  actualizarPrecios();
  mostrarAlerta(`➕ $${precio} agregado.`, 'success');
  input.value = "";
}
function vaciarPrecios() {
  precios = [];
  actualizarPrecios();
  document.getElementById('salidaConIva').textContent = '[ ]';
  mostrarAlerta("Array de precios vaciado.", 'info');
}
function resetPrecios() {
  precios = [100, 50, 200, 75];
  actualizarPrecios();
  mostrarAlerta("⟳ Precios restaurados.", 'info');
}

// ========== EVENTOS (variados) ==========
// Números
document.getElementById('multiplicarBtn').addEventListener('click', multiplicarPorTres);
document.getElementById('agregarNumeroBtn').addEventListener('click', agregarNumero);
document.getElementById('vaciarNumerosBtn').addEventListener('click', vaciarNumeros);
document.getElementById('numerosOriginalDisplay').addEventListener('dblclick', resetNumeros);
document.getElementById('nuevoNumero').addEventListener('keypress', (e) => { if (e.key === 'Enter') agregarNumero(); });

// Nombres (doble clic en botón)
const btnMayus = document.getElementById('mayusculasBtn');
btnMayus.addEventListener('dblclick', convertirMayusculas);
document.getElementById('agregarNombreBtn').addEventListener('click', agregarNombre);
document.getElementById('vaciarNombresBtn').addEventListener('click', vaciarNombres);
document.getElementById('nombresOriginalDisplay').addEventListener('dblclick', resetNombres);
document.getElementById('nuevoNombre').addEventListener('keypress', (e) => { if (e.key === 'Enter') agregarNombre(); });

// Precios (evento keypress en input + click)
document.getElementById('aplicarIvaBtn').addEventListener('click', aplicarIva);
document.getElementById('agregarPrecioBtn').addEventListener('click', agregarPrecio);
document.getElementById('vaciarPreciosBtn').addEventListener('click', vaciarPrecios);
document.getElementById('preciosOriginalDisplay').addEventListener('dblclick', resetPrecios);
document.getElementById('nuevoPrecio').addEventListener('keypress', (e) => { if (e.key === 'Enter') agregarPrecio(); });
// evento focusout adicional para variedad
document.getElementById('nuevoPrecio').addEventListener('focusout', () => {
  console.log('Input de precios perdió foco');
});

// Inicializar
actualizarNumeros();
actualizarNombres();
actualizarPrecios();