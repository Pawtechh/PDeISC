/**
 * main.js
 * ABM de números (agregar / editar / eliminar), estadísticas en vivo,
 * modo claro/oscuro, guardado en servidor + guardado local (showSaveFilePicker),
 * y botón flotante "volver arriba".
 */

import { esNumeroEntero, aEntero, esUnico } from '/modules/numberUtils.js';

const MIN = 10, MAX = 20;

// Estado
let numeros = [];
let editandoIdx = null;

// Elementos DOM
const $ = (id) => document.getElementById(id);
const html = document.documentElement;

const numeroInput   = $('numeroInput');
const btnAgregar     = $('btnAgregar');
const contadorSpan   = $('contador');
const pf             = $('pf');
const nhint          = $('nhint');
const listaContainer = $('listaContainer');
const previewTxt     = $('previewTxt');
const btnGuardarTodo = $('btnGuardarTodo');
const feedbackDiv    = $('feedback');
const btnTema        = $('btnTema');
const emsg           = $('emsg');
const scard          = $('scard');
const backToTop      = $('backToTop');
const toast          = $('toast');

// ── Feedback / errores / toast ─────────────────────────────────────
function mostrarFeedback(mensaje, esError = false) {
    feedbackDiv.textContent = mensaje;
    feedbackDiv.style.borderLeftColor = esError ? 'var(--acc2)' : 'var(--acc)';
    setTimeout(() => {
        if (feedbackDiv.textContent === mensaje) feedbackDiv.textContent = '';
    }, 4000);
}

function mostrarError(msg) {
    emsg.textContent = msg;
    emsg.classList.add('on');
    numeroInput.classList.remove('err');
    void numeroInput.offsetWidth;
    numeroInput.classList.add('err');
    setTimeout(() => numeroInput.classList.remove('err'), 400);
}
function limpiarError() {
    emsg.classList.remove('on');
}

let tt;
function mostrarToast(m) {
    toast.textContent = m;
    toast.classList.add('on');
    clearTimeout(tt);
    tt = setTimeout(() => toast.classList.remove('on'), 2800);
}

// ── Render ──────────────────────────────────────────────────────────
function renderizarListado() {
    if (numeros.length === 0) {
        listaContainer.innerHTML = '<span class="ehint">Sin números todavía. Agregá al menos 10.</span>';
        return;
    }
    listaContainer.innerHTML = '';
    numeros.forEach((num, idx) => {
        const card = document.createElement('div');
        card.className = 'numero-card';
        card.innerHTML = `
      <span><span class="numero-idx">#${String(idx + 1).padStart(2, '0')}</span><span class="numero-valor">${num}</span></span>
      <div class="card-actions">
        <button class="btn warning" data-editar="${idx}">Editar</button>
        <button class="btn danger" data-eliminar="${idx}">✕</button>
      </div>
    `;
        listaContainer.appendChild(card);
    });
    listaContainer.querySelectorAll('[data-editar]').forEach(btn => {
        btn.addEventListener('click', () => iniciarEdicion(parseInt(btn.dataset.editar, 10)));
    });
    listaContainer.querySelectorAll('[data-eliminar]').forEach(btn => {
        btn.addEventListener('click', () => eliminarNumero(parseInt(btn.dataset.eliminar, 10)));
    });
}

function actualizarEstadoGeneral() {
    const cant = numeros.length;
    contadorSpan.textContent = `${cant} / ${MAX}`;
    pf.style.width = (cant / MAX * 100) + '%';

    if (cant === 0) nhint.textContent = 'Necesitás al menos 10 números para guardar';
    else if (cant < MIN) nhint.textContent = `Faltan ${MIN - cant} número(s) para poder guardar`;
    else nhint.textContent = '✓ Listo para guardar';

    btnAgregar.disabled = cant >= MAX && editandoIdx === null;
    btnGuardarTodo.disabled = cant < MIN || cant > MAX;

    if (cant > 0) {
        scard.style.display = 'block';
        const sum = numeros.reduce((a, b) => a + b, 0);
        $('ssum').textContent = sum;
        $('savg').textContent = (sum / cant).toFixed(2);
        $('smin').textContent = Math.min(...numeros);
        $('smax').textContent = Math.max(...numeros);
    } else {
        scard.style.display = 'none';
    }
}

function actualizarPreview() {
    previewTxt.value = numeros.length ? numeros.join('\n') : '';
}

// ── ABM ─────────────────────────────────────────────────────────────
function agregarNumero() {
    const valor = numeroInput.value.trim();
    if (!esNumeroEntero(valor)) {
        mostrarError('Ingresá un número entero válido (ej: 42, -7).');
        return;
    }
    const nuevo = aEntero(valor);

    if (editandoIdx !== null) {
        const existeOtro = numeros.some((n, i) => n === nuevo && i !== editandoIdx);
        if (existeOtro) { mostrarError('Ese número ya existe en la lista.'); return; }
        numeros[editandoIdx] = nuevo;
        editandoIdx = null;
        btnAgregar.textContent = '+ Agregar';
        mostrarFeedback('Número modificado correctamente.');
    } else {
        if (numeros.length >= MAX) { mostrarError(`Máximo ${MAX} números permitidos.`); return; }
        if (!esUnico(nuevo, numeros)) { mostrarError('Ese número ya existe en la lista.'); return; }
        numeros.push(nuevo);
        mostrarFeedback(`Agregado: ${nuevo}`);
    }

    numeroInput.value = '';
    limpiarError();
    numeroInput.focus();
    actualizarEstadoGeneral();
    renderizarListado();
    actualizarPreview();
}

function eliminarNumero(indice) {
    if (indice < 0 || indice >= numeros.length) return;
    const eliminado = numeros[indice];
    numeros.splice(indice, 1);
    if (editandoIdx === indice) { editandoIdx = null; btnAgregar.textContent = '+ Agregar'; numeroInput.value = ''; }
    else if (editandoIdx !== null && editandoIdx > indice) editandoIdx--;
    mostrarFeedback(`Eliminado: ${eliminado}`);
    actualizarEstadoGeneral();
    renderizarListado();
    actualizarPreview();
}

function iniciarEdicion(indice) {
    editandoIdx = indice;
    numeroInput.value = numeros[indice];
    btnAgregar.textContent = 'Guardar cambio';
    numeroInput.focus();
    mostrarFeedback(`Editando número: ${numeros[indice]}`);
}

// ── Guardar en servidor + local ────────────────────────────────────
async function guardarServidorYLocal() {
    const cantidad = numeros.length;
    if (cantidad < MIN || cantidad > MAX) {
        mostrarFeedback(`Debe tener entre ${MIN} y ${MAX} números (actual: ${cantidad})`, true);
        return;
    }

    const contenido = numeros.join('\n');
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
        mostrarToast('✓ Guardado en el servidor');
    } catch (err) {
        mostrarFeedback(`Error en servidor: ${err.message}`, true);
        btnGuardarTodo.disabled = false;
        return;
    }

    const nombreSugerido = `numeros_${Date.now()}.txt`;
    if ('showSaveFilePicker' in window) {
        try {
            const fileHandle = await window.showSaveFilePicker({
                suggestedName: nombreSugerido,
                types: [{ description: 'Archivo de texto', accept: { 'text/plain': ['.txt'] } }]
            });
            const writable = await fileHandle.createWritable();
            await writable.write(contenido);
            await writable.close();
            mostrarFeedback(`Guardado local en: ${fileHandle.name}`);
            mostrarToast('✓ Archivo guardado localmente');
        } catch (err) {
            if (err.name !== 'AbortError') {
                mostrarFeedback(`Error al guardar local: ${err.message}`, true);
            } else {
                mostrarFeedback('Guardado local cancelado.');
            }
        }
    } else {
        const blob = new Blob([contenido], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nombreSugerido;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        mostrarFeedback('Descarga local iniciada.');
        mostrarToast('✓ Descarga iniciada');
    }
    btnGuardarTodo.disabled = false;
}

// ── Tema claro/oscuro ───────────────────────────────────────────────
function inicializarTema() {
    const tema = localStorage.getItem('tema');
    html.dataset.theme = (tema === 'claro') ? 'light' : 'dark';
}
function toggleTema() {
    const esOscuro = html.dataset.theme === 'dark';
    html.dataset.theme = esOscuro ? 'light' : 'dark';
    localStorage.setItem('tema', esOscuro ? 'claro' : 'oscuro');
}

// ── Botón volver arriba ─────────────────────────────────────────────
function inicializarBackToTop() {
    window.addEventListener('scroll', () => {
        backToTop.classList.toggle('show', window.scrollY > 300);
    });
    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ── Listeners e init ─────────────────────────────────────────────────
function setupEventListeners() {
    btnAgregar.addEventListener('click', agregarNumero);
    btnGuardarTodo.addEventListener('click', guardarServidorYLocal);
    btnTema.addEventListener('click', toggleTema);
    numeroInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') agregarNumero(); });
    numeroInput.addEventListener('input', limpiarError);
}

function init() {
    inicializarTema();
    setupEventListeners();
    inicializarBackToTop();
    actualizarEstadoGeneral();
    renderizarListado();
    actualizarPreview();
    numeroInput.focus();
}

init();
