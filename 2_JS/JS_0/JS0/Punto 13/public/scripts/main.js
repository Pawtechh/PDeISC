// scripts/main.js - sort() con posibilidad de restaurar original
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

// ========== 1. NÚMEROS ASCENDENTE ==========
let numerosOriginal = [5, 2, 8, 1, 9];
let numeros = [...numerosOriginal];

function actualizarNumeros() {
  document.getElementById('numerosOriginalDisplay').textContent = `[ ${numeros.join(', ')} ]`;
  document.getElementById('numerosCount').textContent = numeros.length;
}

function ordenarNumeros() {
  if (numeros.length === 0) {
    mostrarAlerta('Array vacío. Agrega números.', 'warning');
    return;
  }
  numeros.sort((a, b) => a - b);
  actualizarNumeros();
  mostrarAlerta(`Números ordenados ascendentemente: [${numeros.join(', ')}]`, 'success');
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

function restaurarNumeros() {
  numeros = [...numerosOriginal];
  actualizarNumeros();
  mostrarAlerta("Array restaurado a su estado original.", 'info');
}

function vaciarNumeros() {
  numeros = [];
  actualizarNumeros();
  mostrarAlerta("Array de números vaciado.", 'info');
}

// ========== 2. PALABRAS ALFABÉTICAMENTE ==========
let palabrasOriginal = ['perro', 'gato', 'elefante', 'ballena', 'delfin'];
let palabras = [...palabrasOriginal];

function actualizarPalabras() {
  document.getElementById('palabrasOriginalDisplay').textContent = `[ ${palabras.join(', ')} ]`;
  document.getElementById('palabrasCount').textContent = palabras.length;
}

function ordenarPalabras() {
  if (palabras.length === 0) {
    mostrarAlerta('Array vacío. Agrega palabras.', 'warning');
    return;
  }
  palabras.sort(); // orden alfabético por defecto
  actualizarPalabras();
  mostrarAlerta(`Palabras ordenadas alfabéticamente: [${palabras.join(', ')}]`, 'success');
}

function agregarPalabra() {
  const input = document.getElementById('nuevaPalabra');
  const nueva = input.value.trim().toLowerCase();
  if (nueva === "") { mostrarAlerta("Escribe una palabra.", "warning"); return; }
  palabras.push(nueva);
  actualizarPalabras();
  mostrarAlerta(`➕ "${nueva}" agregada.`, 'success');
  input.value = "";
}

function restaurarPalabras() {
  palabras = [...palabrasOriginal];
  actualizarPalabras();
  mostrarAlerta("Array restaurado a su estado original.", 'info');
}

function vaciarPalabras() {
  palabras = [];
  actualizarPalabras();
  mostrarAlerta("Array de palabras vaciado.", 'info');
}

// ========== 3. OBJETOS ORDENADOS POR EDAD ==========
let personasOriginal = [
  { nombre: 'Ana', edad: 32 },
  { nombre: 'Luis', edad: 25 },
  { nombre: 'Carlos', edad: 40 }
];
let personas = [...personasOriginal];

function actualizarPersonas() {
  const display = document.getElementById('personasOriginalDisplay');
  if (personas.length === 0) display.textContent = '[ ]';
  else {
    const strings = personas.map(p => `{${p.nombre},${p.edad}}`);
    display.textContent = `[ ${strings.join(', ')} ]`;
  }
  document.getElementById('personasCount').textContent = personas.length;
}

function ordenarPorEdad() {
  if (personas.length === 0) {
    mostrarAlerta('Array vacío. Agrega personas.', 'warning');
    return;
  }
  personas.sort((a, b) => a.edad - b.edad);
  actualizarPersonas();
  mostrarAlerta(`Personas ordenadas por edad (menor a mayor): ${personas.map(p => `${p.nombre}(${p.edad})`).join(', ')}`, 'success');
}

function agregarPersona() {
  const nombreInput = document.getElementById('nombrePersona');
  const edadInput = document.getElementById('edadPersona');
  const nombre = nombreInput.value.trim();
  const edad = parseInt(edadInput.value.trim());
  if (nombre === "" || isNaN(edad)) {
    mostrarAlerta("Completa nombre y edad válida.", "warning");
    return;
  }
  personas.push({ nombre, edad });
  actualizarPersonas();
  mostrarAlerta(`➕ ${nombre}, ${edad} años agregado.`, 'success');
  nombreInput.value = "";
  edadInput.value = "";
}

function restaurarPersonas() {
  personas = [...personasOriginal];
  actualizarPersonas();
  mostrarAlerta("Array restaurado a su estado original.", 'info');
}

function vaciarPersonas() {
  personas = [];
  actualizarPersonas();
  mostrarAlerta("Array de personas vaciado.", 'info');
}

// ========== EVENTOS (variados) ==========
// Números
document.getElementById('ordenarNumerosBtn').addEventListener('click', ordenarNumeros);
document.getElementById('agregarNumeroBtn').addEventListener('click', agregarNumero);
document.getElementById('restaurarNumerosBtn').addEventListener('click', restaurarNumeros);
document.getElementById('vaciarNumerosBtn').addEventListener('click', vaciarNumeros);
document.getElementById('numerosOriginalDisplay').addEventListener('dblclick', restaurarNumeros);
document.getElementById('nuevoNumero').addEventListener('keypress', (e) => { if (e.key === 'Enter') agregarNumero(); });

// Palabras (doble clic en botón)
const btnPalabras = document.getElementById('ordenarPalabrasBtn');
btnPalabras.addEventListener('dblclick', ordenarPalabras);
document.getElementById('agregarPalabraBtn').addEventListener('click', agregarPalabra);
document.getElementById('restaurarPalabrasBtn').addEventListener('click', restaurarPalabras);
document.getElementById('vaciarPalabrasBtn').addEventListener('click', vaciarPalabras);
document.getElementById('palabrasOriginalDisplay').addEventListener('dblclick', restaurarPalabras);
document.getElementById('nuevaPalabra').addEventListener('keypress', (e) => { if (e.key === 'Enter') agregarPalabra(); });

// Personas (change en input edad + focusout)
document.getElementById('ordenarPorEdadBtn').addEventListener('click', ordenarPorEdad);
document.getElementById('agregarPersonaBtn').addEventListener('click', agregarPersona);
document.getElementById('restaurarPersonasBtn').addEventListener('click', restaurarPersonas);
document.getElementById('vaciarPersonasBtn').addEventListener('click', vaciarPersonas);
document.getElementById('personasOriginalDisplay').addEventListener('dblclick', restaurarPersonas);
const edadInput = document.getElementById('edadPersona');
edadInput.addEventListener('change', () => { mostrarAlerta('Edad actualizada. Usa "Agregar" para añadir.', 'info'); });
edadInput.addEventListener('focusout', () => { console.log('focusout en edad'); });
document.getElementById('nombrePersona').addEventListener('keypress', (e) => { if (e.key === 'Enter') agregarPersona(); });
edadInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') agregarPersona(); });

// Inicializar
actualizarNumeros();
actualizarPalabras();
actualizarPersonas();