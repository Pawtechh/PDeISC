// script.js - eventos: click, submit, focusout, dblclick
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
  
  // Crear elemento div de alerta
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${tipo} alert-dismissible fade show mb-2`;
  alertDiv.role = 'alert';
  alertDiv.innerHTML = `
    <i class="bi ${icono} me-2"></i> ${mensaje}
    <button type="button" class="btn-close" aria-label="Cerrar"></button>
  `;
  
  // Agregar evento manual al botón de cerrar
  const closeBtn = alertDiv.querySelector('.btn-close');
  closeBtn.addEventListener('click', () => {
    alertDiv.classList.remove('show');
    alertDiv.classList.add('fade');
    setTimeout(() => alertDiv.remove(), 300);
  });
  
  // Insertar en el contenedor
  alertContainer.insertAdjacentElement('beforeend', alertDiv);
  
  // Auto-cierre después de 5 segundos
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

// ========== 1. NÚMEROS ENTEROS (shift primero) ==========
let enteros = [10, 20, 30, 40];

function actualizarEnteros() {
  const display = document.getElementById('enterosDisplay');
  const count = document.getElementById('enterosCount');
  if (enteros.length === 0) display.textContent = '[ ]';
  else display.textContent = `[ ${enteros.join(', ')} ]`;
  count.textContent = enteros.length;
}

function shiftEntero() {
  if (enteros.length === 0) {
    mostrarAlerta("⚠️ No hay números para eliminar. Agrega alguno primero.", "warning");
    return;
  }
  const eliminado = enteros.shift();
  actualizarEnteros();
  mostrarAlerta(`🔢 Se eliminó el primer número: ${eliminado}. Array actual: [${enteros.join(', ')}]`, "success");
}

function agregarEntero() {
  const input = document.getElementById('nuevoEntero');
  const valor = input.value.trim();
  if (valor === "") {
    mostrarAlerta("Ingresa un número válido.", "warning");
    return;
  }
  const num = Number(valor);
  if (isNaN(num)) {
    mostrarAlerta("Eso no es un número.", "warning");
    input.value = "";
    return;
  }
  enteros.push(num);
  actualizarEnteros();
  mostrarAlerta(`➕ Número ${num} agregado al final. Array: [${enteros.join(', ')}]`, "success");
  input.value = "";
}

function resetEnteros() {
  enteros = [10, 20, 30, 40];
  actualizarEnteros();
  mostrarAlerta("⟳ Array de enteros reiniciado a [10, 20, 30, 40].", "info");
}

// Evento adicional: doble clic en el display del array reinicia (variedad)
document.getElementById('enterosDisplay').addEventListener('dblclick', resetEnteros);

// ========== 2. MENSAJES DE CHAT (shift primer mensaje) ==========
let mensajes = ["Hola", "¿cómo estás?", "Nos vemos"];

function actualizarMensajes() {
  const display = document.getElementById('mensajesDisplay');
  const count = document.getElementById('mensajesCount');
  if (mensajes.length === 0) display.textContent = '[ ]';
  else display.textContent = `[ ${mensajes.join(', ')} ]`;
  count.textContent = mensajes.length;
}

function shiftMensaje() {
  if (mensajes.length === 0) {
    mostrarAlerta("💬 No hay mensajes para eliminar.", "warning");
    return;
  }
  const eliminado = mensajes.shift();
  actualizarMensajes();
  mostrarAlerta(`🗑️ Mensaje eliminado del inicio: "${eliminado}". Quedan ${mensajes.length} mensajes.`, "success");
}

function agregarMensaje(e) {
  e.preventDefault();
  const input = document.getElementById('nuevoMensaje');
  const nuevo = input.value.trim();
  if (nuevo === "") {
    mostrarAlerta("Escribe un mensaje antes de enviar.", "warning");
    return;
  }
  mensajes.push(nuevo);
  actualizarMensajes();
  mostrarAlerta(`💬 Nuevo mensaje agregado al final: "${nuevo}".`, "success");
  input.value = "";
}

function resetMensajes() {
  mensajes = ["Hola", "¿cómo estás?", "Nos vemos"];
  actualizarMensajes();
  mostrarAlerta("⟳ Chat restaurado a mensajes iniciales.", "info");
}

// ========== 3. COLA ATENCIÓN CLIENTE (shift simular atención) ==========
let cola = ["Cliente A", "Cliente B", "Cliente C"];

function actualizarCola() {
  const display = document.getElementById('colaDisplay');
  const count = document.getElementById('colaCount');
  if (cola.length === 0) display.textContent = '[ ]';
  else display.textContent = `[ ${cola.join(', ')} ]`;
  count.textContent = cola.length;
}

function atenderCliente() {
  if (cola.length === 0) {
    mostrarAlerta("🎫 No hay clientes en espera. La cola está vacía.", "warning");
    return;
  }
  const atendido = cola.shift();
  actualizarCola();
  mostrarAlerta(`✅ Atendido: ${atendido}. Quedan ${cola.length} cliente(s) en cola.`, "success");
}

function agregarCliente() {
  const input = document.getElementById('nuevoCliente');
  const nombre = input.value.trim();
  if (nombre === "") {
    mostrarAlerta("Escribe el nombre del cliente.", "warning");
    return;
  }
  cola.push(nombre);
  actualizarCola();
  mostrarAlerta(`➕ Cliente "${nombre}" agregado al final de la cola. Total en espera: ${cola.length}.`, "success");
  input.value = "";
}

function resetCola() {
  cola = ["Cliente A", "Cliente B", "Cliente C"];
  actualizarCola();
  mostrarAlerta("⟳ Cola reiniciada a [Cliente A, Cliente B, Cliente C].", "info");
}

// ========== REGISTRO DE EVENTOS (variedad: click, submit, focusout, dblclick) ==========
// Enteros: click en botón shift, doble clic en display ya asignado, reset con click
document.getElementById('shiftEnteroBtn').addEventListener('click', shiftEntero);
document.getElementById('pushEnteroBtn').addEventListener('click', agregarEntero);
document.getElementById('resetEnterosBtn').addEventListener('click', resetEnteros);
document.getElementById('nuevoEntero').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') agregarEntero();
});

// Mensajes: submit del formulario, click en shift, reset
const formMensaje = document.getElementById('formMensaje');
formMensaje.addEventListener('submit', agregarMensaje);
document.getElementById('shiftMensajeBtn').addEventListener('click', shiftMensaje);
document.getElementById('resetMensajesBtn').addEventListener('click', resetMensajes);

// Cola: focusout en input (agrega automáticamente), click en atender y reset
const inputCliente = document.getElementById('nuevoCliente');
inputCliente.addEventListener('focusout', agregarCliente);  // se agrega al perder foco
document.getElementById('atenderClienteBtn').addEventListener('click', atenderCliente);
document.getElementById('agregarClienteBtn').addEventListener('click', agregarCliente); // redundante pero útil, además hay focusout
document.getElementById('resetColaBtn').addEventListener('click', resetCola);
// También permitir Enter en input de cliente (opcional)
inputCliente.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    agregarCliente();
    inputCliente.blur(); // fuerza focusout también
  }
});

// Inicializar vistas
actualizarEnteros();
actualizarMensajes();
actualizarCola();