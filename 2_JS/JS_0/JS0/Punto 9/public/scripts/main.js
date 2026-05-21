// scripts/main.js - forEach() con borrado de arrays
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

// ========== 1. SALUDOS con forEach ==========
let nombres = ['Ana', 'Luis', 'Carla', 'Diego'];

function actualizarNombres() {
  document.getElementById('nombresDisplay').textContent = `[ ${nombres.join(', ')} ]`;
  document.getElementById('nombresCount').textContent = nombres.length;
}

function mostrarSaludos() {
  const output = document.getElementById('salidaSaludos');
  if (nombres.length === 0) {
    output.innerHTML = '<i class="bi bi-info-circle"></i> Array vacío. Agrega nombres.';
    mostrarAlerta('No hay nombres para saludar.', 'warning');
    return;
  }
  let html = '<ul class="mb-0">';
  nombres.forEach(nombre => {
    html += `<li>👋 Hola, ${nombre}</li>`;
  });
  html += '</ul>';
  output.innerHTML = html;
  mostrarAlerta(`Se saludó a ${nombres.length} persona(s).`, 'success');
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
  document.getElementById('salidaSaludos').innerHTML = '';
  mostrarAlerta("Array de nombres vaciado.", 'info');
}
function resetNombres() {
  nombres = ['Ana', 'Luis', 'Carla', 'Diego'];
  actualizarNombres();
  mostrarAlerta("⟳ Nombres restaurados.", 'info');
}

// ========== 2. DOBLE DE CADA NÚMERO ==========
let numeros = [3, 7, 10, 2];

function actualizarNumeros() {
  document.getElementById('numerosDisplay').textContent = `[ ${numeros.join(', ')} ]`;
  document.getElementById('numerosCount').textContent = numeros.length;
}

function calcularDobles() {
  const output = document.getElementById('salidaDobles');
  if (numeros.length === 0) {
    output.innerHTML = '<i class="bi bi-info-circle"></i> Array vacío. Agrega números.';
    mostrarAlerta('No hay números para calcular.', 'warning');
    return;
  }
  let html = '<ul class="mb-0">';
  numeros.forEach(num => {
    html += `<li>${num} → doble: ${num * 2}</li>`;
  });
  html += '</ul>';
  output.innerHTML = html;
  mostrarAlerta(`Se calcularon ${numeros.length} dobles.`, 'success');
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
  document.getElementById('salidaDobles').innerHTML = '';
  mostrarAlerta("Array de números vaciado.", 'info');
}
function resetNumeros() {
  numeros = [3, 7, 10, 2];
  actualizarNumeros();
  mostrarAlerta("⟳ Números restaurados.", 'info');
}

// ========== 3. OBJETOS (nombre, edad) con forEach ==========
let personas = [
  { nombre: 'Juan', edad: 25 },
  { nombre: 'María', edad: 30 },
  { nombre: 'Pedro', edad: 22 }
];

function actualizarPersonas() {
  const display = document.getElementById('personasDisplay');
  if (personas.length === 0) display.textContent = '[ ]';
  else {
    const strings = personas.map(p => `{${p.nombre},${p.edad}}`);
    display.textContent = `[ ${strings.join(', ')} ]`;
  }
  document.getElementById('personasCount').textContent = personas.length;
}

function mostrarPersonas() {
  const output = document.getElementById('salidaPersonas');
  if (personas.length === 0) {
    output.innerHTML = '<i class="bi bi-info-circle"></i> Array vacío. Agrega personas.';
    mostrarAlerta('No hay personas para mostrar.', 'warning');
    return;
  }
  let html = '<ul class="mb-0">';
  personas.forEach(p => {
    html += `<li>👤 ${p.nombre} tiene ${p.edad} años</li>`;
  });
  html += '</ul>';
  output.innerHTML = html;
  mostrarAlerta(`Se mostraron ${personas.length} personas.`, 'success');
}

function agregarPersona() {
  const nombreInput = document.getElementById('nuevoNombreObj');
  const edadInput = document.getElementById('nuevaEdadObj');
  const nombre = nombreInput.value.trim();
  const edad = parseInt(edadInput.value.trim());
  if (nombre === "" || isNaN(edad)) {
    mostrarAlerta("Completa nombre y edad válida.", "warning");
    return;
  }
  personas.push({ nombre, edad });
  actualizarPersonas();
  mostrarAlerta(`➕ Persona: ${nombre}, ${edad} años agregada.`, 'success');
  nombreInput.value = "";
  edadInput.value = "";
}

function vaciarPersonas() {
  personas = [];
  actualizarPersonas();
  document.getElementById('salidaPersonas').innerHTML = '';
  mostrarAlerta("Array de personas vaciado.", 'info');
}
function resetPersonas() {
  personas = [
    { nombre: 'Juan', edad: 25 },
    { nombre: 'María', edad: 30 },
    { nombre: 'Pedro', edad: 22 }
  ];
  actualizarPersonas();
  mostrarAlerta("⟳ Personas restauradas.", 'info');
}

// ========== EVENTOS (variados: click, dblclick, submit con keypress) ==========
// Nombres
document.getElementById('saludarBtn').addEventListener('click', mostrarSaludos);
document.getElementById('agregarNombreBtn').addEventListener('click', agregarNombre);
document.getElementById('vaciarNombresBtn').addEventListener('click', vaciarNombres);
document.getElementById('nombresDisplay').addEventListener('dblclick', resetNombres);
document.getElementById('nuevoNombre').addEventListener('keypress', (e) => { if (e.key === 'Enter') agregarNombre(); });

// Números (doble clic en botón)
const btnDoble = document.getElementById('calcularDobleBtn');
btnDoble.addEventListener('dblclick', calcularDobles);
document.getElementById('agregarNumeroBtn').addEventListener('click', agregarNumero);
document.getElementById('vaciarNumerosBtn').addEventListener('click', vaciarNumeros);
document.getElementById('numerosDisplay').addEventListener('dblclick', resetNumeros);
document.getElementById('nuevoNumero').addEventListener('keypress', (e) => { if (e.key === 'Enter') agregarNumero(); });

// Personas (submit con Enter en los inputs)
const inputsPersona = [document.getElementById('nuevoNombreObj'), document.getElementById('nuevaEdadObj')];
inputsPersona.forEach(inp => {
  inp.addEventListener('keypress', (e) => { if (e.key === 'Enter') agregarPersona(); });
});
document.getElementById('mostrarPersonasBtn').addEventListener('click', mostrarPersonas);
document.getElementById('agregarPersonaBtn').addEventListener('click', agregarPersona);
document.getElementById('vaciarPersonasBtn').addEventListener('click', vaciarPersonas);
document.getElementById('personasDisplay').addEventListener('dblclick', resetPersonas);

// Inicializar
actualizarNombres();
actualizarNumeros();
actualizarPersonas();