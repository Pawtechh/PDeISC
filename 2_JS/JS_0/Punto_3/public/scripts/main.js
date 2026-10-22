// scripts/main.js - unshift() con alertas cerrables manualmente

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

// ========== 1. COLORES (unshift múltiple) ==========
let colores = [];

function actualizarColores() {
  const display = document.getElementById('coloresDisplay');
  const count = document.getElementById('coloresCount');
  display.textContent = colores.length === 0 ? '[ ]' : `[ ${colores.join(', ')} ]`;
  count.textContent = colores.length;
}

function unshiftColores() {
  colores.unshift("rojo", "verde", "azul");
  actualizarColores();
  mostrarAlerta(`🎨 Se agregaron "rojo", "verde", "azul" al inicio con unshift(). El orden se mantiene tal cual se pasó.`, "success");
}

function resetColores() {
  colores = [];
  actualizarColores();
  mostrarAlerta("🔄 Array de colores vaciado.", "info");
}

// ========== 2. TAREAS (unshift urgente) ==========
const tareasOriginal = ["Estudiar", "Comprar pan"];
let tareas = [...tareasOriginal];

function actualizarTareas() {
  const display = document.getElementById('tareasDisplay');
  const count = document.getElementById('tareasCount');
  display.textContent = tareas.length === 0 ? '[ ]' : `[ ${tareas.join(', ')} ]`;
  count.textContent = tareas.length;
}

function agregarTareaUrgente(valor) {
  if (!valor || valor.trim() === "") {
    mostrarAlerta("✏️ Escribe una tarea urgente para agregar.", "warning");
    return;
  }
  tareas.unshift(valor.trim());
  actualizarTareas();
  mostrarAlerta(`🚨 "${valor}" agregada al inicio con unshift(). Ahora es la primera tarea.`, "success");
}

function resetTareas() {
  tareas = [...tareasOriginal];
  actualizarTareas();
  mostrarAlerta("🔄 Lista de tareas restaurada.", "info");
}

// ========== 3. USUARIOS (unshift conexión) ==========
const usuariosOriginal = ["Ana", "Luis"];
let usuarios = [...usuariosOriginal];

function actualizarUsuarios() {
  const display = document.getElementById('usuariosDisplay');
  const count = document.getElementById('usuariosCount');
  display.textContent = usuarios.length === 0 ? '[ ]' : `[ ${usuarios.join(', ')} ]`;
  count.textContent = usuarios.length;
}

function conectarUsuario(nombre) {
  const valor = (nombre && nombre.trim() !== "") ? nombre.trim() : "Invitado";
  usuarios.unshift(valor);
  actualizarUsuarios();
  mostrarAlerta(`👤 "${valor}" se conectó y se agregó al inicio de la lista con unshift().`, "success");
}

function resetUsuarios() {
  usuarios = [...usuariosOriginal];
  actualizarUsuarios();
  mostrarAlerta("🔄 Lista de usuarios restaurada.", "info");
}

// ========== EVENTOS ==========
document.getElementById('unshiftColoresBtn').addEventListener('click', unshiftColores);
document.getElementById('resetColoresBtn').addEventListener('click', resetColores);

document.getElementById('formTarea').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = document.getElementById('nuevaTareaUrgente');
  agregarTareaUrgente(input.value);
  input.value = "";
});
document.getElementById('resetTareasBtn').addEventListener('click', resetTareas);

document.getElementById('conectarUsuarioBtn').addEventListener('click', () => {
  const input = document.getElementById('nuevoUsuario');
  conectarUsuario(input.value);
  input.value = "";
});
document.getElementById('usuariosDisplay').addEventListener('dblclick', () => conectarUsuario(""));
document.getElementById('resetUsuariosBtn').addEventListener('click', resetUsuarios);

// Inicializar vistas
actualizarColores();
actualizarTareas();
actualizarUsuarios();
