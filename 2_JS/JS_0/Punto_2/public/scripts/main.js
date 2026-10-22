// scripts/main.js - pop() con alertas cerrables manualmente

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

// ========== 1. ANIMALES ==========
const animalesOriginal = ["Perro", "Gato", "Ratón"];
let animales = [...animalesOriginal];

function actualizarAnimales() {
  const display = document.getElementById('animalesDisplay');
  const count = document.getElementById('animalesCount');
  display.textContent = animales.length === 0 ? '[ ]' : `[ ${animales.join(', ')} ]`;
  count.textContent = animales.length;
}

function popAnimal() {
  if (animales.length === 0) {
    mostrarAlerta("⚠️ No hay más animales para eliminar. El array está vacío.", "warning");
    return;
  }
  const eliminado = animales.pop();
  actualizarAnimales();
  mostrarAlerta(`🐾 Se eliminó el último animal: "${eliminado}" usando pop().`, "success");
}

function agregarAnimal() {
  const input = document.getElementById('nuevoAnimal');
  const valor = input.value.trim();
  if (valor === "") {
    mostrarAlerta("✏️ Escribe el nombre de un animal para agregar.", "warning");
    return;
  }
  animales.push(valor);
  actualizarAnimales();
  mostrarAlerta(`➕ "${valor}" agregado con push(). Ahora hay ${animales.length} elementos.`, "success");
  input.value = "";
}

function resetAnimales() {
  animales = [...animalesOriginal];
  actualizarAnimales();
  mostrarAlerta("🔄 Array de animales restaurado.", "info");
}

// ========== 2. LISTA DE COMPRAS ==========
const comprasOriginal = ["Leche", "Pan", "Huevos"];
let compras = [...comprasOriginal];

function actualizarCompras() {
  const display = document.getElementById('comprasDisplay');
  const count = document.getElementById('comprasCount');
  display.textContent = compras.length === 0 ? '[ ]' : `[ ${compras.join(', ')} ]`;
  count.textContent = compras.length;
}

function popCompra() {
  if (compras.length === 0) {
    mostrarAlerta("🛒 La lista de compras está vacía. No se puede eliminar.", "warning");
    return;
  }
  const eliminado = compras.pop();
  actualizarCompras();
  mostrarAlerta(`🛍️ Producto eliminado: "${eliminado}". Restan ${compras.length}.`, "success");
}

function agregarProducto(valor) {
  if (!valor || valor.trim() === "") {
    mostrarAlerta("📝 Escribe un producto para agregar a la lista.", "warning");
    return;
  }
  compras.push(valor.trim());
  actualizarCompras();
  mostrarAlerta(`➕ "${valor}" añadido con push(). Ahora hay ${compras.length} productos.`, "success");
}

function resetCompras() {
  compras = [...comprasOriginal];
  actualizarCompras();
  mostrarAlerta("🔄 Lista de compras reiniciada.", "info");
}

// ========== 3. NÚMEROS ==========
const numerosOriginal = [10, 20, 30, 40, 50];
let numeros = [...numerosOriginal];

function actualizarNumeros() {
  const display = document.getElementById('vaciadoDisplay');
  const count = document.getElementById('vaciadoCount');
  display.textContent = numeros.length === 0 ? '[ ]' : `[ ${numeros.join(', ')} ]`;
  count.textContent = numeros.length;
}

function agregarNumero() {
  const input = document.getElementById('nuevoNumeroManual');
  if (input.value === "" || isNaN(Number(input.value))) {
    mostrarAlerta("🔢 Ingresa un número válido para agregar.", "warning");
    return;
  }
  numeros.push(Number(input.value));
  actualizarNumeros();
  mostrarAlerta(`➕ Número agregado con push(). Ahora hay ${numeros.length} elementos.`, "success");
  input.value = "";
}

function popNumero() {
  if (numeros.length === 0) {
    mostrarAlerta("⚠️ El array de números está vacío. No se puede eliminar.", "warning");
    return;
  }
  const eliminado = numeros.pop();
  actualizarNumeros();
  mostrarAlerta(`🔽 Se eliminó el número ${eliminado} usando pop(). Restan ${numeros.length}.`, "success");
}

function vaciarConWhile() {
  if (numeros.length === 0) {
    mostrarAlerta("⏳ El array ya está vacío.", "info");
    return;
  }
  const eliminados = [];
  while (numeros.length > 0) {
    eliminados.push(numeros.pop());
  }
  actualizarNumeros();
  mostrarAlerta(`🧹 Bucle while + pop() completado. Eliminados: [${eliminados.join(', ')}].`, "success");
}

function resetNumeros() {
  numeros = [...numerosOriginal];
  actualizarNumeros();
  mostrarAlerta("⟳ Array de números reiniciado.", "info");
}

// ========== EVENTOS ==========
document.getElementById('popAnimalBtn').addEventListener('click', popAnimal);
document.getElementById('pushAnimalBtn').addEventListener('click', agregarAnimal);
document.getElementById('nuevoAnimal').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') agregarAnimal();
});
document.getElementById('resetAnimalesBtn').addEventListener('click', resetAnimales);

document.getElementById('formProducto').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = document.getElementById('nuevoProducto');
  agregarProducto(input.value);
  input.value = "";
});
document.getElementById('popCompraBtn').addEventListener('click', popCompra);
document.getElementById('resetComprasBtn').addEventListener('click', resetCompras);

document.getElementById('pushNumeroBtn').addEventListener('click', agregarNumero);
document.getElementById('popNumeroBtn').addEventListener('click', popNumero);
document.getElementById('vaciarWhileBtn').addEventListener('dblclick', vaciarConWhile);
document.getElementById('vaciarWhileBtn').addEventListener('click', vaciarConWhile);
document.getElementById('resetVaciadoBtn').addEventListener('click', resetNumeros);

// Inicializar vistas
actualizarAnimales();
actualizarCompras();
actualizarNumeros();
