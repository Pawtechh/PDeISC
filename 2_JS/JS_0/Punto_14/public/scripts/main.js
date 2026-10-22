// scripts/main.js - reverse() con alerta solo en acción explícita de texto
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

// ========== 1. LETRAS ==========
let letrasOriginal = ['A', 'B', 'C', 'D', 'E'];
let letras = [...letrasOriginal];

function actualizarLetras() {
  document.getElementById('letrasDisplay').textContent = `[ ${letras.join(', ')} ]`;
  document.getElementById('letrasCount').textContent = letras.length;
}

function reverseLetras() {
  if (letras.length === 0) {
    mostrarAlerta('Array vacío. Agrega letras.', 'warning');
    return;
  }
  letras.reverse();
  actualizarLetras();
  mostrarAlerta(`Array invertido: [${letras.join(', ')}]`, 'success');
}

function agregarLetra() {
  const input = document.getElementById('nuevaLetra');
  const letra = input.value.trim().toUpperCase();
  if (letra === "" || letra.length > 1) {
    mostrarAlerta("Ingresa una sola letra.", "warning");
    return;
  }
  letras.push(letra);
  actualizarLetras();
  mostrarAlerta(`➕ "${letra}" agregada.`, 'success');
  input.value = "";
}

function restaurarLetras() {
  letras = [...letrasOriginal];
  actualizarLetras();
  mostrarAlerta("Array restaurado a [A, B, C, D, E].", 'info');
}
function vaciarLetras() {
  letras = [];
  actualizarLetras();
  mostrarAlerta("Array de letras vaciado.", 'info');
}

// ========== 2. NÚMEROS ==========
let numerosOriginal = [1, 2, 3, 4, 5];
let numeros = [...numerosOriginal];

function actualizarNumeros() {
  document.getElementById('numerosDisplay').textContent = `[ ${numeros.join(', ')} ]`;
  document.getElementById('numerosCount').textContent = numeros.length;
}

function reverseNumeros() {
  if (numeros.length === 0) {
    mostrarAlerta('Array vacío. Agrega números.', 'warning');
    return;
  }
  numeros.reverse();
  actualizarNumeros();
  mostrarAlerta(`Números invertidos: [${numeros.join(', ')}]`, 'success');
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
  mostrarAlerta("Array restaurado a [1, 2, 3, 4, 5].", 'info');
}
function vaciarNumeros() {
  numeros = [];
  actualizarNumeros();
  mostrarAlerta("Array de números vaciado.", 'info');
}

// ========== 3. TEXTO A ARRAY Y REVERSE (corregido: alerta solo en acción explícita) ==========
let textoOriginal = "JavaScript";
let textoActual = textoOriginal;

function actualizarTexto() {
  document.getElementById('textoOriginal').textContent = textoActual || "(vacío)";
  document.getElementById('textoLength').textContent = textoActual ? textoActual.length : 0;
}

// Invierte y muestra resultado SIN alerta (para escritura en vivo)
function invertirTextoSilencioso() {
  let texto = textoActual || "";
  if (texto === "") {
    document.getElementById('textoInvertido').textContent = "";
    return;
  }
  const invertido = texto.split('').reverse().join('');
  document.getElementById('textoInvertido').textContent = invertido;
}

// Invierte y muestra resultado CON alerta (para eventos explícitos)
function invertirTextoConAlerta() {
  let texto = textoActual || "";
  if (texto === "") {
    mostrarAlerta("No hay texto para invertir.", "warning");
    document.getElementById('textoInvertido').textContent = "";
    return;
  }
  const invertido = texto.split('').reverse().join('');
  document.getElementById('textoInvertido').textContent = invertido;
  mostrarAlerta(`Texto invertido: "${invertido}"`, 'success');
}

function actualizarDesdeInput() {
  const input = document.getElementById('textoUsuario');
  textoActual = input.value;
  actualizarTexto();
  invertirTextoSilencioso(); // sin alerta
}

function invertirDesdeInput() {
  const input = document.getElementById('textoUsuario');
  textoActual = input.value;
  actualizarTexto();
  invertirTextoConAlerta(); // con alerta
}

function restaurarTexto() {
  textoActual = textoOriginal;
  document.getElementById('textoUsuario').value = textoActual;
  actualizarTexto();
  invertirTextoSilencioso();
  mostrarAlerta("Texto restaurado a 'JavaScript'.", 'info');
}

function limpiarTexto() {
  textoActual = "";
  document.getElementById('textoUsuario').value = "";
  actualizarTexto();
  document.getElementById('textoInvertido').textContent = "";
  mostrarAlerta("Texto limpiado.", 'info');
}

// ========== EVENTOS (variados) ==========
// Letras
document.getElementById('reverserLetrasBtn').addEventListener('click', reverseLetras);
document.getElementById('agregarLetraBtn').addEventListener('click', agregarLetra);
document.getElementById('restaurarLetrasBtn').addEventListener('click', restaurarLetras);
document.getElementById('vaciarLetrasBtn').addEventListener('click', vaciarLetras);
document.getElementById('letrasDisplay').addEventListener('dblclick', restaurarLetras);
document.getElementById('nuevaLetra').addEventListener('keypress', (e) => { if (e.key === 'Enter') agregarLetra(); });

// Números (doble clic)
const btnNumeros = document.getElementById('reverserNumerosBtn');
btnNumeros.addEventListener('dblclick', reverseNumeros);
document.getElementById('agregarNumeroBtn').addEventListener('click', agregarNumero);
document.getElementById('restaurarNumerosBtn').addEventListener('click', restaurarNumeros);
document.getElementById('vaciarNumerosBtn').addEventListener('click', vaciarNumeros);
document.getElementById('numerosDisplay').addEventListener('dblclick', restaurarNumeros);
document.getElementById('nuevoNumero').addEventListener('keypress', (e) => { if (e.key === 'Enter') agregarNumero(); });

// Texto (input silencioso, Enter y botón con alerta)
const inputTexto = document.getElementById('textoUsuario');
inputTexto.addEventListener('input', actualizarDesdeInput);
inputTexto.addEventListener('keypress', (e) => { if (e.key === 'Enter') invertirDesdeInput(); });
document.getElementById('invertirTextoBtn').addEventListener('click', invertirDesdeInput);
document.getElementById('restaurarTextoBtn').addEventListener('click', restaurarTexto);
document.getElementById('vaciarTextoBtn').addEventListener('click', limpiarTexto);
inputTexto.addEventListener('focusout', () => { console.log('focusout en texto'); });

// Inicializar
actualizarLetras();
actualizarNumeros();
actualizarTexto();
invertirTextoSilencioso(); // mostrar inversión inicial sin alerta