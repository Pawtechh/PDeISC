// scripts/main.js - slice() con alertas cerrables manualmente
const alertContainer = document.getElementById('alertContainer');

// Función corregida: las alertas se pueden cerrar con la 'x'
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

// ========== 1. PRIMEROS 3 ELEMENTOS DE NÚMEROS ==========
const numerosOriginal = [10, 20, 30, 40, 50, 60];
let numeros = [...numerosOriginal]; // copia para posible modificación si se quiere (pero no se modifica)

function actualizarNumeros() {
  const display = document.getElementById('numerosDisplay');
  const count = document.getElementById('numerosCount');
  display.textContent = `[ ${numeros.join(', ')} ]`;
  count.textContent = numeros.length;
}

function copiarPrimerosTres() {
  const primeros = numeros.slice(0, 3);
  document.getElementById('primerosCopia').textContent = `[ ${primeros.join(', ')} ]`;
  mostrarAlerta(`✅ Copiados los primeros 3 elementos: [${primeros.join(', ')}]. El array original sigue siendo: [${numeros.join(', ')}]`, 'success');
}

// ========== 2. COPIA PARCIAL DE PELÍCULAS (slice 2 a 4) ==========
const pelisOriginal = ['Inception', 'Matrix', 'Interestelar', 'Gladiador', 'Titanic'];
let peliculas = [...pelisOriginal];

function actualizarPeliculas() {
  const display = document.getElementById('pelisDisplay');
  const count = document.getElementById('pelisCount');
  display.textContent = `[ ${peliculas.join(', ')} ]`;
  count.textContent = peliculas.length;
}

function copiarPeliculasSlice() {
  const copia = peliculas.slice(2, 4); // posiciones 2 y 3 (índice 2 y 3)
  document.getElementById('pelisCopia').textContent = `[ ${copia.join(', ')} ]`;
  mostrarAlerta(`🎬 Copiadas películas desde índice 2 hasta 3 (slice(2,4)): [${copia.join(', ')}]. Original intacto.`, 'success');
}

// ========== 3. ÚLTIMOS 3 ELEMENTOS (slice(-3)) con opción de agregar frutas ==========
const frutasOriginal = ['Manzana', 'Banana', 'Cereza', 'Durazno', 'Kiwi', 'Mango'];
let frutas = [...frutasOriginal];

function actualizarFrutas() {
  const display = document.getElementById('frutasDisplay');
  const count = document.getElementById('frutasCount');
  display.textContent = `[ ${frutas.join(', ')} ]`;
  count.textContent = frutas.length;
}

function copiarUltimosTres() {
  const ultimos = frutas.slice(-3);
  document.getElementById('ultimosCopia').textContent = `[ ${ultimos.join(', ')} ]`;
  mostrarAlerta(`🍎 Últimos 3 elementos (slice(-3)): [${ultimos.join(', ')}]. El array original sigue con ${frutas.length} frutas.`, 'success');
}

function agregarFruta() {
  const input = document.getElementById('nuevaFruta');
  const nueva = input.value.trim();
  if (nueva === "") {
    mostrarAlerta("Escribe el nombre de una fruta.", "warning");
    return;
  }
  frutas.push(nueva);
  actualizarFrutas();
  mostrarAlerta(`➕ "${nueva}" agregada al final. Total: ${frutas.length} frutas.`, 'success');
  input.value = "";
}

function resetFrutas() {
  frutas = [...frutasOriginal];
  actualizarFrutas();
  document.getElementById('ultimosCopia').textContent = '[ ]';
  mostrarAlerta('⟳ Array de frutas reiniciado.', 'info');
}

// ========== REGISTRO DE EVENTOS (uso variado, no solo click) ==========
// 1. Primeros 3 números: click en botón
document.getElementById('copiarPrimerosBtn').addEventListener('click', copiarPrimerosTres);
// Doble clic en el display restaura los números originales (opcional)
document.getElementById('numerosDisplay').addEventListener('dblclick', () => {
  numeros = [...numerosOriginal];
  actualizarNumeros();
  mostrarAlerta('Array de números restaurado.', 'info');
});

// 2. Películas: evento dblclick en el botón (solicitado como variedad)
const btnPelis = document.getElementById('copiarPelisBtn');
btnPelis.addEventListener('dblclick', copiarPeliculasSlice);
// También se puede resetear con clic normal en el título
document.getElementById('pelisDisplay').addEventListener('click', () => {
  peliculas = [...pelisOriginal];
  actualizarPeliculas();
  document.getElementById('pelisCopia').textContent = '[ ]';
  mostrarAlerta('Películas restauradas.', 'info');
});

// 3. Frutas: usamos focusout en input + botón, y el copiar con click
const inputFruta = document.getElementById('nuevaFruta');
inputFruta.addEventListener('focusout', () => {
  // No agregamos automáticamente con focusout para no ser invasivos; pero usamos evento change como variedad
  console.log('focusout - no acción automática');
});
// Evento change: cuando se sale del input o cambia, damos feedback
inputFruta.addEventListener('change', () => {
  if (inputFruta.value.trim() !== "") {
    mostrarAlerta('Usa el botón "Agregar" o presiona Enter para añadir la fruta.', 'info');
  }
});
// Agregar con Enter (keypress) variedad
inputFruta.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') agregarFruta();
});
document.getElementById('agregarFrutaBtn').addEventListener('click', agregarFruta);
document.getElementById('copiarUltimosBtn').addEventListener('click', copiarUltimosTres);
// Reset de frutas con doble clic en el display
document.getElementById('frutasDisplay').addEventListener('dblclick', resetFrutas);

// Inicializar vistas
actualizarNumeros();
actualizarPeliculas();
actualizarFrutas();