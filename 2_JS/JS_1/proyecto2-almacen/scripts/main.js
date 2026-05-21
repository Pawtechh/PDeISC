/**
 * ARCHIVO: main.js
 * PROPÓSITO: Lógica principal con validaciones, gestión de métodos y ayuda al usuario
 * REQUISITO 9: Sin alert() ni confirm(), todo en DOM
 */

import { initTheme } from '/modules/theme.js';
import {
  cargarDesdeArray,
  guardarEnArray,
  cargarDesdeSession,
  guardarEnSession,
  cargarDesdeLocal,
  guardarEnLocal,
  limpiarTodos
} from '/modules/storage.js';

let metodoActual = 'array';

// ========== VALIDACIONES ==========
function validarFormulario() {
  let errores = [];

  const nombre = document.getElementById('nombre').value.trim();
  const categoria = document.getElementById('categoria').value;
  const precio = parseFloat(document.getElementById('precio').value);
  const stock = parseInt(document.getElementById('stock').value);
  const codigo = document.getElementById('codigo').value.trim();
  const proveedor = document.getElementById('proveedor').value.trim();
  const fecha = document.getElementById('fecha').value;

  if (!nombre) errores.push('Nombre del producto');
  if (!categoria) errores.push('Categoría');
  if (isNaN(precio) || precio <= 0) errores.push('Precio (debe ser > 0)');
  if (isNaN(stock) || stock < 0) errores.push('Stock (debe ser >= 0)');
  if (!codigo) errores.push('Código');
  if (!proveedor) errores.push('Proveedor');
  if (!fecha) errores.push('Fecha de ingreso');
  if (fecha) {
    const fechaObj = new Date(fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (fechaObj > hoy) errores.push('La fecha no puede ser futura');
  }

  if (errores.length > 0) {
    mostrarMensaje(`❌ Complete correctamente: ${errores.join(', ')}`, 'danger');
    return false;
  }
  return true;
}

function obtenerDatosFormulario() {
  return {
    id: Date.now(),
    nombre: document.getElementById('nombre').value.trim(),
    categoria: document.getElementById('categoria').value,
    precio: parseFloat(document.getElementById('precio').value),
    stock: parseInt(document.getElementById('stock').value),
    codigo: document.getElementById('codigo').value.trim(),
    proveedor: document.getElementById('proveedor').value.trim(),
    fecha: document.getElementById('fecha').value,
    peso: parseFloat(document.getElementById('peso').value) || 0,
    descuento: parseInt(document.getElementById('descuento').value) || 0
  };
}

// ========== MENSAJES EN DOM (sin alert) ==========
function mostrarMensaje(texto, tipo = 'success') {
  const mensajeDiv = document.getElementById('mensaje');
  mensajeDiv.className = `alert alert-${tipo}`;
  mensajeDiv.innerHTML = `<strong>${tipo === 'success' ? '✓' : '⚠️'}</strong> ${texto}`;
  setTimeout(() => {
    if (mensajeDiv === document.getElementById('mensaje')) {
      mensajeDiv.className = 'alert alert-info';
      mensajeDiv.innerHTML = '💡 Seleccione un método (Array, Session o Local) para ver los datos. Use el formulario para agregar.';
    }
  }, 5000);
}

// ========== CONFIRMACIÓN EN DOM (sin confirm nativo) ==========
function mostrarConfirmacionLimpiar() {
  // Crear overlay y modal en el DOM
  const modal = document.createElement('div');
  modal.id = 'confirmModal';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.backgroundColor = 'rgba(0,0,0,0.7)';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.zIndex = '2000';

  const modalContent = document.createElement('div');
  modalContent.style.backgroundColor = document.body.classList.contains('dark-mode') ? '#2d3246' : 'white';
  modalContent.style.color = document.body.classList.contains('dark-mode') ? '#f0f3fa' : '#1e2a3a';
  modalContent.style.padding = '2rem';
  modalContent.style.borderRadius = '16px';
  modalContent.style.maxWidth = '400px';
  modalContent.style.textAlign = 'center';
  modalContent.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';

  modalContent.innerHTML = `
    <h4>⚠️ Confirmar limpieza</h4>
    <p>¿Estás seguro de que deseas eliminar <strong>TODOS los productos</strong> de los tres almacenes (Array, SessionStorage y LocalStorage)?</p>
    <p><small>Esta acción no se puede deshacer.</small></p>
    <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 1rem;">
      <button id="confirmYes" class="btn btn-danger">Sí, limpiar todo</button>
      <button id="confirmNo" class="btn btn-secondary">Cancelar</button>
    </div>
  `;

  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  // Eventos
  document.getElementById('confirmYes').addEventListener('click', () => {
    limpiarTodos();
    renderizarListado([]);
    mostrarMensaje('🗑️ Todos los almacenamientos fueron limpiados', 'danger');
    document.body.removeChild(modal);
  });
  document.getElementById('confirmNo').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  // Cerrar al hacer clic fuera (opcional)
  modal.addEventListener('click', (e) => {
    if (e.target === modal) document.body.removeChild(modal);
  });
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
}

function renderizarListado(productos) {
  const contenedor = document.getElementById('listaProductos');
  const contador = document.getElementById('contador');
  contador.textContent = `(${productos.length})`;
  if (productos.length === 0) {
    contenedor.innerHTML = '<p class="text-muted">📭 No hay productos. Complete el formulario y guarde.</p>';
    return;
  }
  contenedor.innerHTML = productos.map(prod => `
    <div class="producto-card">
      <h6>${escapeHTML(prod.nombre)}</h6>
      <p><strong>Código:</strong> ${escapeHTML(prod.codigo)}</p>
      <p><strong>📂 ${escapeHTML(prod.categoria)}</strong> | 💲${prod.precio}</p>
      <p><strong>📦 Stock:</strong> ${prod.stock} | 🏭 ${escapeHTML(prod.proveedor)}</p>
      <p><small>📅 ${prod.fecha} | ⚖️ ${prod.peso}kg | 🏷️ ${prod.descuento}% off</small></p>
    </div>
  `).join('');
}

function guardarProducto(producto) {
  let nuevos = [];
  switch (metodoActual) {
    case 'array':
      nuevos = guardarEnArray(producto);
      mostrarMensaje(`✅ Guardado en ARRAY (memoria) - Total: ${nuevos.length}`, 'success');
      break;
    case 'session':
      nuevos = guardarEnSession(producto);
      mostrarMensaje(`✅ Guardado en SESSIONSTORAGE - Total: ${nuevos.length}`, 'success');
      break;
    case 'local':
      nuevos = guardarEnLocal(producto);
      mostrarMensaje(`✅ Guardado en LOCALSTORAGE (persistente) - Total: ${nuevos.length}`, 'success');
      break;
  }
  return nuevos;
}

function cargarYMostrar(metodo) {
  let productos = [];
  switch (metodo) {
    case 'array': productos = cargarDesdeArray(); break;
    case 'session': productos = cargarDesdeSession(); break;
    case 'local': productos = cargarDesdeLocal(); break;
  }
  renderizarListado(productos);
  return productos;
}

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', () => {
  initTheme();

  document.getElementById('btnArray').addEventListener('click', () => {
    metodoActual = 'array';
    cargarYMostrar('array');
    mostrarMensaje('📋 Mostrando datos desde ARRAY (memoria volátil, se pierde al recargar)', 'info');
  });
  document.getElementById('btnSession').addEventListener('click', () => {
    metodoActual = 'session';
    cargarYMostrar('session');
    mostrarMensaje('💾 Mostrando datos desde SESSIONSTORAGE (se borra al cerrar la pestaña)', 'info');
  });
  document.getElementById('btnLocal').addEventListener('click', () => {
    metodoActual = 'local';
    cargarYMostrar('local');
    mostrarMensaje('🏪 Mostrando datos desde LOCALSTORAGE (persiste al recargar el navegador)', 'info');
  });
  document.getElementById('btnCargarTodo').addEventListener('click', () => {
    const array = cargarDesdeArray();
    const session = cargarDesdeSession();
    const local = cargarDesdeLocal();
    mostrarMensaje(`📊 Array: ${array.length} | Session: ${session.length} | Local: ${local.length}`, 'info');
  });
  document.getElementById('btnLimpiarTodo').addEventListener('click', () => {
    mostrarConfirmacionLimpiar();  // Reemplaza al confirm()
  });

  document.getElementById('productForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;
    const producto = obtenerDatosFormulario();
    const nuevos = guardarProducto(producto);
    renderizarListado(nuevos);
    document.getElementById('productForm').reset();
    document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
  });

  // Leyenda de ayuda
  const leyendaHTML = `
    <div class="help-legend mt-2">
      <i class="fas fa-info-circle"></i> <strong>¿Cómo funciona?</strong><br>
      • Complete el formulario y presione <strong>Guardar</strong>.<br>
      • Seleccione <strong>Array, SessionStorage o LocalStorage</strong> para ver los datos guardados en cada lugar.<br>
      • Los datos en <strong>Array</strong> se pierden al recargar la página.<br>
      • <strong>SessionStorage</strong> se borra al cerrar la pestaña.<br>
      • <strong>LocalStorage</strong> permanece hasta que limpie manualmente.<br>
      • Use <strong>Limpiar todo</strong> con precaución (aparecerá una confirmación en pantalla).
    </div>
  `;
  const contenedorAyuda = document.querySelector('.card-body .d-flex');
  if (contenedorAyuda && !document.querySelector('.help-legend')) {
    contenedorAyuda.insertAdjacentHTML('afterend', leyendaHTML);
  }

  renderizarListado([]);
});