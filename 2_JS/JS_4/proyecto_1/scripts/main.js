/**
 * main.js
 * Controla ABM de números, renderizado, modo oscuro, y el botón único que:
 * 1) Guarda en servidor (POST)
 * 2) Pide ubicación al usuario (showSaveFilePicker) y guarda local
 * 3) Muestra el contenido en el textarea de preview
 */

import { esNumeroEntero, aEntero, esUnico } from '/modules/numberUtils.js';

// Estado
let numeros = [];
let editandoId = null;

// Elementos DOM
const numeroInput = document.getElementById('numeroInput');
const btnAgregar = document.getElementById('btnAgregar');
const contadorSpan = document.getElementById('contador');
const listaContainer = document.getElementById('listaContainer');
const previewTxt = document.getElementById('previewTxt');
const btnGuardarTodo = document.getElementById('btnGuardarTodo');
const feedbackDiv = document.getElementById('feedback');
const btnTema = document.getElementById('btnTema');

// Funciones auxiliares
function mostrarFeedback(mensaje, esError = false) {
    feedbackDiv.textContent = mensaje;
    feedbackDiv.style.borderLeftColor = esError ? '#ef4444' : '#10b981';
    setTimeout(() => {
        if (feedbackDiv.textContent === mensaje) feedbackDiv.textContent = '';
    }, 4000);
}

function actualizarContadorYBoton() {
    const cant = numeros.length;
    contadorSpan.textContent = cant;
    // No se deshabilita ningún botón, solo se muestra la cantidad
}

function renderizarListado() {
    if (numeros.length === 0) {
        listaContainer.innerHTML = '<p class="mensaje-vacio">Sin números. Agregue al menos 10.</p>';
        return;
    }
    listaContainer.innerHTML = '';
    numeros.forEach((num, idx) => {
        const card = document.createElement('div');
        card.className = 'numero-card';
        card.innerHTML = `
      <span class="numero-valor">${num}</span>
      <div class="card-actions">
        <button class="btn warning" data-editar="${idx}">Editar</button>
        <button class="btn danger" data-eliminar="${idx}">Eliminar</button>
      </div>
    `;
        listaContainer.appendChild(card);
    });
    document.querySelectorAll('[data-editar]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(btn.dataset.editar, 10);
            iniciarEdicion(idx);
        });
    });
    document.querySelectorAll('[data-eliminar]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(btn.dataset.eliminar, 10);
            eliminarNumero(idx);
        });
    });
}

function agregarNumero() {
    const valor = numeroInput.value.trim();
    if (!esNumeroEntero(valor)) {
        mostrarFeedback('Ingrese un número entero válido.', true);
        return;
    }
    const nuevo = aEntero(valor);
    if (editandoId !== null) {
        const existeOtro = numeros.some((n, i) => n === nuevo && i !== editandoId);
        if (existeOtro) {
            mostrarFeedback('Número duplicado. Use otro.', true);
            return;
        }
        numeros[editandoId] = nuevo;
        editandoId = null;
        btnAgregar.textContent = 'Agregar';
        mostrarFeedback('Número modificado.');
    } else {
        if (numeros.length >= 20) {
            mostrarFeedback('Máximo 20 números. Elimine uno.', true);
            return;
        }
        if (!esUnico(nuevo, numeros)) {
            mostrarFeedback('Número ya existe.', true);
            return;
        }
        numeros.push(nuevo);
        mostrarFeedback(`Agregado ${nuevo}.`);
    }
    numeroInput.value = '';
    numeroInput.focus();
    actualizarContadorYBoton();
    renderizarListado();
    actualizarPreview(); // Actualizar preview cada vez que cambia la lista
}

function eliminarNumero(indice) {
    if (indice < 0 || indice >= numeros.length) return;
    const eliminado = numeros[indice];
    numeros.splice(indice, 1);
    if (editandoId === indice) editandoId = null;
    else if (editandoId !== null && editandoId > indice) editandoId--;
    mostrarFeedback(`Eliminado ${eliminado}.`);
    actualizarContadorYBoton();
    renderizarListado();
    actualizarPreview();
}

function iniciarEdicion(indice) {
    editandoId = indice;
    numeroInput.value = numeros[indice];
    btnAgregar.textContent = 'Guardar cambio';
    numeroInput.focus();
    mostrarFeedback(`Editando ${numeros[indice]}.`);
}

function actualizarPreview() {
    if (numeros.length === 0) {
        previewTxt.value = '';
        return;
    }
    previewTxt.value = numeros.join('\n');
}

// Guardar en servidor + local con "Guardar como..."
async function guardarServidorYLocal() {
    const cantidad = numeros.length;
    if (cantidad < 10 || cantidad > 20) {
        mostrarFeedback(`Debe tener entre 10 y 20 números (actual: ${cantidad})`, true);
        return;
    }

    const contenido = numeros.join('\n');
    // 1) Guardar preview visual (ya está actualizado)
    // 2) Guardar en servidor
    mostrarFeedback('Guardando en servidor...');
    btnGuardarTodo.disabled = true;
    try {
        const response = await fetch('/guardar-txt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ numeros })
        });
        if (!response.ok) throw new Error('Error en servidor');
        const data = await response.json();
        mostrarFeedback(`Servidor: archivo "${data.nombreArchivo}" guardado.`);
    } catch (err) {
        mostrarFeedback(`Error en servidor: ${err.message}`, true);
        btnGuardarTodo.disabled = false;
        return;
    }

    // 3) Guardar local con elección de ubicación
    const nombreSugerido = `numeros_${Date.now()}.txt`;
    if ('showSaveFilePicker' in window) {
        try {
            const opciones = {
                suggestedName: nombreSugerido,
                types: [{ description: 'Archivo de texto', accept: { 'text/plain': ['.txt'] } }]
            };
            const fileHandle = await window.showSaveFilePicker(opciones);
            const writable = await fileHandle.createWritable();
            await writable.write(contenido);
            await writable.close();
            mostrarFeedback(`Local guardado en: ${fileHandle.name}`);
        } catch (err) {
            if (err.name !== 'AbortError') {
                mostrarFeedback(`Error al guardar local: ${err.message}`, true);
            } else {
                mostrarFeedback('Guardado local cancelado.');
            }
        }
    } else {
        // Fallback: descarga automática
        const blob = new Blob([contenido], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nombreSugerido;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        mostrarFeedback('Local: descarga automática (sin selector de carpeta).');
    }
    btnGuardarTodo.disabled = false;
}

// Tema claro/oscuro
function inicializarTema() {
    const tema = localStorage.getItem('tema');
    if (tema === 'oscuro') {
        document.documentElement.classList.add('tema-oscuro');
        btnTema.textContent = '☀️ Modo claro';
    } else {
        btnTema.textContent = '🌙 Modo oscuro';
    }
}
function toggleTema() {
    if (document.documentElement.classList.contains('tema-oscuro')) {
        document.documentElement.classList.remove('tema-oscuro');
        localStorage.setItem('tema', 'claro');
        btnTema.textContent = '🌙 Modo oscuro';
    } else {
        document.documentElement.classList.add('tema-oscuro');
        localStorage.setItem('tema', 'oscuro');
        btnTema.textContent = '☀️ Modo claro';
    }
}

function setupEventListeners() {
    btnAgregar.addEventListener('click', agregarNumero);
    btnGuardarTodo.addEventListener('click', guardarServidorYLocal);
    btnTema.addEventListener('click', toggleTema);
    numeroInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') agregarNumero(); });
}

function init() {
    setupEventListeners();
    inicializarTema();
    actualizarContadorYBoton();
    renderizarListado();
    actualizarPreview();
    numeroInput.focus();
}

init();