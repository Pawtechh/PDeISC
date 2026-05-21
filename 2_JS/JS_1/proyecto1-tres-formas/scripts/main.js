/**
 * ARCHIVO: main.js - 3 formas de lectura: .value, FormData, querySelector
 */
import { initTheme } from '/modules/theme.js';

let productos = [];

function validar() {
    let valido = true;
    ['nombre', 'categoria', 'precio', 'stock', 'proveedor', 'fechaIngreso', 'peso'].forEach(id => {
        const input = document.getElementById(id);
        if (!input.value.trim()) { input.classList.add('is-invalid'); valido = false; }
        else input.classList.remove('is-invalid');
    });
    const precio = document.getElementById('precio');
    if (precio.value && parseFloat(precio.value) <= 0) { precio.classList.add('is-invalid'); valido = false; }
    return valido;
}

function mostrarMensaje(msg, tipo = 'success') {
    const div = document.getElementById('resultado');
    div.className = `alert alert-${tipo}`;
    div.innerHTML = `<strong>${tipo === 'success' ? '✓' : '✗'}</strong> ${msg}`;
    setTimeout(() => {
        div.className = 'alert alert-secondary';
        div.innerHTML = '<strong>Resultado:</strong> Presione un botón';
    }, 3000);
}

function escapeHTML(str) { return str?.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m])) || ''; }

function actualizarListado() {
    const contenedor = document.getElementById('listaProductos');
    const contador = document.getElementById('contadorProductos');
    contador.textContent = `(${productos.length})`;
    if (productos.length === 0) { contenedor.innerHTML = '<p class="text-muted">Sin productos</p>'; return; }
    contenedor.innerHTML = productos.map(p => `
        <div class="producto-card">
            <h5>${escapeHTML(p.nombre)}</h5>
            <p>📂 ${p.categoria} | 💲${p.precio} | 📦 ${p.stock}</p>
            <p>🏭 ${escapeHTML(p.proveedor)} | 📅 ${p.fechaIngreso}</p>
            <p>⚖️ ${p.peso}kg | 🏷️ ${p.descuento}%</p>
        </div>
    `).join('');
}

function agregarProducto(p) { productos.push(p); actualizarListado(); mostrarMensaje(`Producto "${p.nombre}" guardado`); }

function leerConValue() {
    if (!validar()) { mostrarMensaje('Complete todos los campos', 'danger'); return; }
    agregarProducto({
        nombre: document.getElementById('nombre').value,
        categoria: document.getElementById('categoria').value,
        precio: parseFloat(document.getElementById('precio').value),
        stock: parseInt(document.getElementById('stock').value),
        proveedor: document.getElementById('proveedor').value,
        fechaIngreso: document.getElementById('fechaIngreso').value,
        peso: parseFloat(document.getElementById('peso').value),
        descuento: parseInt(document.getElementById('descuento').value) || 0
    });
}

function leerConFormData() {
    if (!validar()) { mostrarMensaje('Complete todos los campos', 'danger'); return; }
    const fd = new FormData(document.getElementById('productForm'));
    agregarProducto({
        nombre: fd.get('nombre'), categoria: fd.get('categoria'),
        precio: parseFloat(fd.get('precio')), stock: parseInt(fd.get('stock')),
        proveedor: fd.get('proveedor'), fechaIngreso: fd.get('fechaIngreso'),
        peso: parseFloat(fd.get('peso')), descuento: parseInt(fd.get('descuento')) || 0
    });
}

function leerConQuerySelector() {
    if (!validar()) { mostrarMensaje('Complete todos los campos', 'danger'); return; }
    agregarProducto({
        nombre: document.querySelector('#nombre').value,
        categoria: document.querySelector('#categoria').value,
        precio: parseFloat(document.querySelector('#precio').value),
        stock: parseInt(document.querySelector('#stock').value),
        proveedor: document.querySelector('#proveedor').value,
        fechaIngreso: document.querySelector('#fechaIngreso').value,
        peso: parseFloat(document.querySelector('#peso').value),
        descuento: parseInt(document.querySelector('#descuento').value) || 0
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    document.getElementById('btnValue')?.addEventListener('click', leerConValue);
    document.getElementById('btnFormData')?.addEventListener('click', leerConFormData);
    document.getElementById('btnQuerySelector')?.addEventListener('click', leerConQuerySelector);
    actualizarListado();
});