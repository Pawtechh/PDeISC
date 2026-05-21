// scripts/main.js - indexOf() mejorado: encuentra todas las posiciones
const alertContainer = document.getElementById('alertContainer');

// Función de alerta cerrable (sin cambios)
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

// Función auxiliar para encontrar todos los índices de un elemento en un array
function encontrarIndices(array, valor) {
  const indices = [];
  for (let i = 0; i < array.length; i++) {
    if (array[i] === valor) {
      indices.push(i);
    }
  }
  return indices;
}

// ========== 1. BUSCAR "PERRO" (múltiples) ==========
let animales = ['gato', 'perro', 'conejo', 'perro', 'loro'];

function actualizarAnimales() {
  document.getElementById('animalesDisplay').textContent = `[ ${animales.join(', ')} ]`;
  document.getElementById('animalesCount').textContent = animales.length;
}

function buscarPerro() {
  const indices = encontrarIndices(animales, 'perro');
  if (indices.length === 0) {
    mostrarAlerta('❌ "perro" no está en el array actual.', 'warning');
  } else if (indices.length === 1) {
    mostrarAlerta(`🐕 Se encontró 1 "perro" en la posición ${indices[0]}.`, 'success');
  } else {
    mostrarAlerta(`🐕🐕 Se encontraron ${indices.length} elementos "perro" en las posiciones: ${indices.join(', ')}.`, 'success');
  }
}

function agregarAnimal() {
  const input = document.getElementById('nuevoAnimal');
  const nuevo = input.value.trim().toLowerCase();
  if (nuevo === "") { mostrarAlerta("Escribe un animal.", "warning"); return; }
  animales.push(nuevo);
  actualizarAnimales();
  mostrarAlerta(`➕ "${nuevo}" agregado.`, 'success');
  input.value = "";
}

function vaciarAnimales() { animales = []; actualizarAnimales(); mostrarAlerta("🧹 Array vaciado.", 'info'); }
function resetAnimales() { animales = ['gato', 'perro', 'conejo', 'perro', 'loro']; actualizarAnimales(); mostrarAlerta("⟳ Restaurado.", 'info'); }

// ========== 2. BUSCAR NÚMERO 50 (múltiples) ==========
let numeros = [10, 50, 23, 50, 75];

function actualizarNumeros() {
  document.getElementById('numerosDisplay').textContent = `[ ${numeros.join(', ')} ]`;
  document.getElementById('numerosCount').textContent = numeros.length;
}

function buscar50() {
  const indices = encontrarIndices(numeros, 50);
  if (indices.length === 0) {
    mostrarAlerta('❌ El número 50 no se encuentra en el array.', 'warning');
  } else if (indices.length === 1) {
    mostrarAlerta(`🔢 Se encontró 1 número 50 en la posición ${indices[0]}.`, 'success');
  } else {
    mostrarAlerta(`🔢🔢 Se encontraron ${indices.length} números 50 en las posiciones: ${indices.join(', ')}.`, 'success');
  }
}

function agregarNumero() {
  const input = document.getElementById('nuevoNumero');
  const val = input.value.trim();
  if (val === "") { mostrarAlerta("Ingresa un número.", "warning"); return; }
  const num = Number(val);
  if (isNaN(num)) { mostrarAlerta("Número inválido.", "warning"); input.value = ""; return; }
  numeros.push(num);
  actualizarNumeros();
  mostrarAlerta(`➕ ${num} agregado.`, 'success');
  input.value = "";
}

function vaciarNumeros() { numeros = []; actualizarNumeros(); mostrarAlerta("🧹 Array vaciado.", 'info'); }
function resetNumeros() { numeros = [10, 50, 23, 50, 75]; actualizarNumeros(); mostrarAlerta("⟳ Restaurado.", 'info'); }

// ========== 3. BUSCAR "MADRID" (múltiples) ==========
let ciudades = ['Barcelona', 'Madrid', 'París', 'Madrid', 'Roma'];

function actualizarCiudades() {
  document.getElementById('ciudadesDisplay').textContent = `[ ${ciudades.join(', ')} ]`;
  document.getElementById('ciudadesCount').textContent = ciudades.length;
}

function buscarMadrid() {
  const indices = encontrarIndices(ciudades, 'Madrid');
  if (indices.length === 0) {
    mostrarAlerta('❌ "Madrid" no está en el array de ciudades.', 'warning');
  } else if (indices.length === 1) {
    mostrarAlerta(`📍 Se encontró 1 "Madrid" en la posición ${indices[0]}.`, 'success');
  } else {
    mostrarAlerta(`📍📍 Se encontraron ${indices.length} ciudades "Madrid" en las posiciones: ${indices.join(', ')}.`, 'success');
  }
}

function agregarCiudad() {
  const input = document.getElementById('nuevaCiudad');
  const nueva = input.value.trim();
  if (nueva === "") { mostrarAlerta("Escribe una ciudad.", "warning"); return; }
  ciudades.push(nueva);
  actualizarCiudades();
  mostrarAlerta(`➕ "${nueva}" agregada.`, 'success');
  input.value = "";
}

function vaciarCiudades() { ciudades = []; actualizarCiudades(); mostrarAlerta("🧹 Array vaciado.", 'info'); }
function resetCiudades() { ciudades = ['Barcelona', 'Madrid', 'París', 'Madrid', 'Roma']; actualizarCiudades(); mostrarAlerta("⟳ Restaurado.", 'info'); }

// ========== EVENTOS (variados) ==========
// Animales
document.getElementById('buscarPerroBtn').addEventListener('click', buscarPerro);
document.getElementById('agregarAnimalBtn').addEventListener('click', agregarAnimal);
document.getElementById('vaciarAnimalesBtn').addEventListener('click', vaciarAnimales);
document.getElementById('animalesDisplay').addEventListener('dblclick', resetAnimales);
document.getElementById('nuevoAnimal').addEventListener('keypress', (e) => { if (e.key === 'Enter') agregarAnimal(); });

// Números
document.getElementById('buscar50Btn').addEventListener('dblclick', buscar50);  // doble clic
document.getElementById('agregarNumeroBtn').addEventListener('click', agregarNumero);
document.getElementById('vaciarNumerosBtn').addEventListener('click', vaciarNumeros);
document.getElementById('numerosDisplay').addEventListener('dblclick', resetNumeros);
document.getElementById('nuevoNumero').addEventListener('keypress', (e) => { if (e.key === 'Enter') agregarNumero(); });

// Ciudades
document.getElementById('buscarMadridBtn').addEventListener('click', buscarMadrid);
document.getElementById('agregarCiudadBtn').addEventListener('click', agregarCiudad);
document.getElementById('vaciarCiudadesBtn').addEventListener('click', vaciarCiudades);
document.getElementById('ciudadesDisplay').addEventListener('dblclick', resetCiudades);
document.getElementById('nuevaCiudad').addEventListener('keypress', (e) => { if (e.key === 'Enter') agregarCiudad(); });

// Inicializar
actualizarAnimales();
actualizarNumeros();
actualizarCiudades();