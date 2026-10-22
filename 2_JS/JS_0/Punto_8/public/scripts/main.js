// scripts/main.js - includes() con botones para vaciar arrays
const alertContainer = document.getElementById('alertContainer');

// Función de alerta cerrable manualmente
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

// ========== 1. COMPROBAR SI CONTIENE "admin" ==========
let roles = ['user', 'editor', 'admin', 'guest'];

function actualizarRoles() {
  document.getElementById('rolesDisplay').textContent = `[ ${roles.join(', ')} ]`;
  document.getElementById('rolesCount').textContent = roles.length;
}

function buscarAdmin() {
  const existe = roles.includes('admin');
  if (existe) {
    mostrarAlerta('✅ El array SÍ contiene la palabra "admin".', 'success');
  } else {
    mostrarAlerta('❌ El array NO contiene "admin". Puedes agregarlo.', 'warning');
  }
}

function agregarRol() {
  const input = document.getElementById('nuevoRol');
  const nuevo = input.value.trim().toLowerCase();
  if (nuevo === "") {
    mostrarAlerta("Escribe un rol.", "warning");
    return;
  }
  roles.push(nuevo);
  actualizarRoles();
  mostrarAlerta(`➕ "${nuevo}" agregado.`, 'success');
  input.value = "";
}

function vaciarRoles() {
  roles = [];
  actualizarRoles();
  mostrarAlerta("🧹 Array de roles vaciado.", 'info');
}

function resetRoles() {
  roles = ['user', 'editor', 'admin', 'guest'];
  actualizarRoles();
  mostrarAlerta("⟳ Roles restaurados.", 'info');
}

// ========== 2. INDICAR SI EXISTE "verde" ==========
let colores = ['rojo', 'azul', 'amarillo', 'violeta'];

function actualizarColores() {
  document.getElementById('coloresDisplay').textContent = `[ ${colores.join(', ')} ]`;
  document.getElementById('coloresCount').textContent = colores.length;
}

function buscarVerde() {
  const existe = colores.includes('verde');
  if (existe) {
    mostrarAlerta('✅ El color "verde" SÍ está presente en el array.', 'success');
  } else {
    mostrarAlerta('❌ El color "verde" NO está presente. Puedes agregarlo.', 'warning');
  }
}

function agregarColor() {
  const input = document.getElementById('nuevoColor');
  const nuevo = input.value.trim().toLowerCase();
  if (nuevo === "") {
    mostrarAlerta("Escribe un color.", "warning");
    return;
  }
  colores.push(nuevo);
  actualizarColores();
  mostrarAlerta(`➕ "${nuevo}" agregado.`, 'success');
  input.value = "";
}

function vaciarColores() {
  colores = [];
  actualizarColores();
  mostrarAlerta("🧹 Array de colores vaciado.", 'info');
}

function resetColores() {
  colores = ['rojo', 'azul', 'amarillo', 'violeta'];
  actualizarColores();
  mostrarAlerta("⟳ Colores restaurados.", 'info');
}

// ========== 3. AGREGAR NÚMERO SOLO SI NO EXISTE (includes) ==========
let numeros = [5, 12, 8, 3];

function actualizarNumeros() {
  document.getElementById('numerosDisplay').textContent = `[ ${numeros.join(', ')} ]`;
  document.getElementById('numerosCount').textContent = numeros.length;
}

function agregarSiNoExiste() {
  const input = document.getElementById('numeroNuevo');
  const valor = input.value.trim();
  if (valor === "") {
    mostrarAlerta("Ingresa un número.", "warning");
    return;
  }
  const num = Number(valor);
  if (isNaN(num)) {
    mostrarAlerta("Eso no es un número válido.", "warning");
    input.value = "";
    return;
  }
  if (numeros.includes(num)) {
    mostrarAlerta(`⚠️ El número ${num} ya existe en el array. No se agregó.`, 'warning');
  } else {
    numeros.push(num);
    actualizarNumeros();
    mostrarAlerta(`➕ ${num} agregado (no existía antes).`, 'success');
  }
  input.value = "";
}

function vaciarNumeros() {
  numeros = [];
  actualizarNumeros();
  mostrarAlerta("🧹 Array de números vaciado.", 'info');
}

function resetNumeros() {
  numeros = [5, 12, 8, 3];
  actualizarNumeros();
  mostrarAlerta("⟳ Números restaurados.", 'info');
}

// ========== REGISTRO DE EVENTOS (variados) ==========
// 1. Roles
document.getElementById('buscarAdminBtn').addEventListener('click', buscarAdmin);
document.getElementById('agregarRolBtn').addEventListener('click', agregarRol);
document.getElementById('vaciarRolesBtn').addEventListener('click', vaciarRoles);
document.getElementById('rolesDisplay').addEventListener('dblclick', resetRoles);
document.getElementById('nuevoRol').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') agregarRol();
});

// 2. Colores (evento dblclick en botón de búsqueda)
const btnVerde = document.getElementById('buscarVerdeBtn');
btnVerde.addEventListener('dblclick', buscarVerde);
document.getElementById('agregarColorBtn').addEventListener('click', agregarColor);
document.getElementById('vaciarColoresBtn').addEventListener('click', vaciarColores);
document.getElementById('coloresDisplay').addEventListener('dblclick', resetColores);
document.getElementById('nuevoColor').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') agregarColor();
});
// Evento focusout para mostrar ayuda (variedad)
document.getElementById('nuevoColor').addEventListener('focusout', () => {
  console.log('Input de colores perdió foco');
  // solo para demostrar evento, sin acción molesta
});

// 3. Números (sin evento click en el botón principal? usamos click normal,
// pero incluimos submit del formulario no existente, usamos keypress en input)
document.getElementById('agregarSiNoExisteBtn').addEventListener('click', agregarSiNoExiste);
document.getElementById('vaciarNumerosBtn').addEventListener('click', vaciarNumeros);
document.getElementById('numerosDisplay').addEventListener('dblclick', resetNumeros);
document.getElementById('numeroNuevo').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') agregarSiNoExiste();
});
// Evento change en el input (variedad)
document.getElementById('numeroNuevo').addEventListener('change', () => {
  mostrarAlerta('Puedes presionar Enter o el botón para agregar si no existe.', 'info');
});

// Inicializar vistas
actualizarRoles();
actualizarColores();
actualizarNumeros();