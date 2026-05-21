// scripts/main.js - filter() con arrays originales y filtrados
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

// ========== 1. NÚMEROS MAYORES A 10 ==========
let numeros = [5, 12, 8, 15, 3, 20];

function actualizarNumeros() {
  document.getElementById('numerosOriginalDisplay').textContent = `[ ${numeros.join(', ')} ]`;
  document.getElementById('numerosCount').textContent = numeros.length;
}

function filtrarMayores() {
  if (numeros.length === 0) {
    mostrarAlerta('Array vacío. Agrega números.', 'warning');
    document.getElementById('salidaMayores').textContent = '[ ]';
    return;
  }
  const mayores = numeros.filter(n => n > 10);
  document.getElementById('salidaMayores').textContent = `[ ${mayores.join(', ')} ]`;
  mostrarAlerta(`Filtrados ${mayores.length} números >10: [${mayores.join(', ')}]`, 'success');
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
  document.getElementById('salidaMayores').textContent = '[ ]';
  mostrarAlerta("Array de números vaciado.", 'info');
}
function resetNumeros() {
  numeros = [5, 12, 8, 15, 3, 20];
  actualizarNumeros();
  mostrarAlerta("⟳ Números restaurados.", 'info');
}

// ========== 2. PALABRAS CON MÁS DE 5 LETRAS ==========
let palabras = ['casa', 'elefante', 'sol', 'computadora', 'mar'];

function actualizarPalabras() {
  document.getElementById('palabrasOriginalDisplay').textContent = `[ ${palabras.join(', ')} ]`;
  document.getElementById('palabrasCount').textContent = palabras.length;
}

function filtrarLargas() {
  if (palabras.length === 0) {
    mostrarAlerta('Array vacío. Agrega palabras.', 'warning');
    document.getElementById('salidaLargas').textContent = '[ ]';
    return;
  }
  const largas = palabras.filter(p => p.length > 5);
  document.getElementById('salidaLargas').textContent = `[ ${largas.join(', ')} ]`;
  mostrarAlerta(`Filtradas ${largas.length} palabras con >5 letras: [${largas.join(', ')}]`, 'success');
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
function vaciarPalabras() {
  palabras = [];
  actualizarPalabras();
  document.getElementById('salidaLargas').textContent = '[ ]';
  mostrarAlerta("Array de palabras vaciado.", 'info');
}
function resetPalabras() {
  palabras = ['casa', 'elefante', 'sol', 'computadora', 'mar'];
  actualizarPalabras();
  mostrarAlerta("⟳ Palabras restauradas.", 'info');
}

// ========== 3. USUARIOS ACTIVOS (objetos) ==========
let usuarios = [
  { nombre: 'Juan', activo: true },
  { nombre: 'Ana', activo: false },
  { nombre: 'Luis', activo: true }
];

function actualizarUsuarios() {
  const display = document.getElementById('usuariosOriginalDisplay');
  if (usuarios.length === 0) display.textContent = '[ ]';
  else {
    const strings = usuarios.map(u => `{${u.nombre},${u.activo ? '✓' : '✗'}}`);
    display.textContent = `[ ${strings.join(', ')} ]`;
  }
  document.getElementById('usuariosCount').textContent = usuarios.length;
}

function filtrarActivos() {
  if (usuarios.length === 0) {
    mostrarAlerta('Array vacío. Agrega usuarios.', 'warning');
    document.getElementById('salidaActivos').textContent = '[ ]';
    return;
  }
  const activos = usuarios.filter(u => u.activo === true);
  const texto = activos.map(u => u.nombre).join(', ');
  document.getElementById('salidaActivos').textContent = activos.length ? `[ ${texto} ]` : '[ ]';
  mostrarAlerta(`Usuarios activos (${activos.length}): ${texto || 'ninguno'}`, 'success');
}

function agregarUsuario() {
  const nombreInput = document.getElementById('nuevoNombre');
  const estadoSelect = document.getElementById('nuevoEstado');
  const nombre = nombreInput.value.trim();
  if (nombre === "") { mostrarAlerta("Escribe un nombre.", "warning"); return; }
  const activo = estadoSelect.value === 'true';
  usuarios.push({ nombre, activo });
  actualizarUsuarios();
  mostrarAlerta(`➕ Usuario: ${nombre} (${activo ? 'activo' : 'inactivo'}) agregado.`, 'success');
  nombreInput.value = "";
  estadoSelect.value = 'true';
}
function vaciarUsuarios() {
  usuarios = [];
  actualizarUsuarios();
  document.getElementById('salidaActivos').textContent = '[ ]';
  mostrarAlerta("Array de usuarios vaciado.", 'info');
}
function resetUsuarios() {
  usuarios = [
    { nombre: 'Juan', activo: true },
    { nombre: 'Ana', activo: false },
    { nombre: 'Luis', activo: true }
  ];
  actualizarUsuarios();
  mostrarAlerta("⟳ Usuarios restaurados.", 'info');
}

// ========== EVENTOS (variados) ==========
// Números
document.getElementById('filtrarMayoresBtn').addEventListener('click', filtrarMayores);
document.getElementById('agregarNumeroBtn').addEventListener('click', agregarNumero);
document.getElementById('vaciarNumerosBtn').addEventListener('click', vaciarNumeros);
document.getElementById('numerosOriginalDisplay').addEventListener('dblclick', resetNumeros);
document.getElementById('nuevoNumero').addEventListener('keypress', (e) => { if (e.key === 'Enter') agregarNumero(); });

// Palabras (doble clic en botón)
const btnLargas = document.getElementById('filtrarLargasBtn');
btnLargas.addEventListener('dblclick', filtrarLargas);
document.getElementById('agregarPalabraBtn').addEventListener('click', agregarPalabra);
document.getElementById('vaciarPalabrasBtn').addEventListener('click', vaciarPalabras);
document.getElementById('palabrasOriginalDisplay').addEventListener('dblclick', resetPalabras);
document.getElementById('nuevaPalabra').addEventListener('keypress', (e) => { if (e.key === 'Enter') agregarPalabra(); });

// Usuarios (keypress en inputs + focusout)
document.getElementById('filtrarActivosBtn').addEventListener('click', filtrarActivos);
document.getElementById('agregarUsuarioBtn').addEventListener('click', agregarUsuario);
document.getElementById('vaciarUsuariosBtn').addEventListener('click', vaciarUsuarios);
document.getElementById('usuariosOriginalDisplay').addEventListener('dblclick', resetUsuarios);
const nombreInput = document.getElementById('nuevoNombre');
nombreInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') agregarUsuario(); });
const estadoSelect = document.getElementById('nuevoEstado');
estadoSelect.addEventListener('change', () => { mostrarAlerta('Estado cambiado. Usa "Agregar" para añadir.', 'info'); });
nombreInput.addEventListener('focusout', () => { console.log('Focusout en nombre'); });

// Inicializar
actualizarNumeros();
actualizarPalabras();
actualizarUsuarios();