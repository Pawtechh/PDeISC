/**
 * ARCHIVO: arraysManager.js
 * PROPÓSITO: Gestionar los arrays de animales, compras y números.
 * MÓDULOS: alertas
 */

import { mostrarAlerta } from './alertas.js';

// ========== ARRAY DE ANIMALES ==========
let animales = ["Perro", "Gato", "Ratón"];

function actualizarAnimales() {
    const display = document.getElementById('animalesDisplay');
    const count = document.getElementById('animalesCount');
    if (!display || !count) return;
    if (animales.length === 0) display.textContent = '[ ]';
    else display.textContent = `[ ${animales.map(a => a).join(', ')} ]`;
    count.textContent = animales.length;
}

export function popAnimal() {
    if (animales.length === 0) {
        mostrarAlerta("⚠️ No hay más animales para eliminar. El array está vacío.", "warning");
        return;
    }
    const eliminado = animales.pop();
    actualizarAnimales();
    mostrarAlerta(`🐾 Se eliminó el último animal: "${eliminado}" usando pop().`, "success");
}

export function resetAnimales() {
    animales = ["Perro", "Gato", "Ratón"];
    actualizarAnimales();
    mostrarAlerta("🔄 Array de animales restaurado a [Perro, Gato, Ratón].", "info");
}

export function agregarAnimal(nuevo) {
    if (!nuevo || nuevo.trim() === "") {
        mostrarAlerta("✏️ Escribe el nombre de un animal para agregar.", "warning");
        return false;
    }
    animales.push(nuevo.trim());
    actualizarAnimales();
    mostrarAlerta(`➕ "${nuevo}" agregado con push(). Ahora el array tiene ${animales.length} elementos.`, "success");
    return true;
}

// ========== LISTA DE COMPRAS ==========
let compras = ["Leche", "Pan", "Huevos"];

function actualizarCompras() {
    const display = document.getElementById('comprasDisplay');
    const count = document.getElementById('comprasCount');
    if (!display || !count) return;
    if (compras.length === 0) display.textContent = '[ ]';
    else display.textContent = `[ ${compras.map(p => p).join(', ')} ]`;
    count.textContent = compras.length;
}

export function popCompra() {
    if (compras.length === 0) {
        mostrarAlerta("🛒 La lista de compras está vacía. No se puede eliminar.", "warning");
        return;
    }
    const eliminado = compras.pop();
    actualizarCompras();
    mostrarAlerta(`🛍️ Producto eliminado de la lista: "${eliminado}". Total restante: ${compras.length}.`, "success");
}

export function resetCompras() {
    compras = ["Leche", "Pan", "Huevos"];
    actualizarCompras();
    mostrarAlerta("🔄 Lista de compras reiniciada a [Leche, Pan, Huevos].", "info");
}

export function agregarProducto(nuevo) {
    if (!nuevo || nuevo.trim() === "") {
        mostrarAlerta("📝 Escribe un producto para agregar a la lista.", "warning");
        return false;
    }
    compras.push(nuevo.trim());
    actualizarCompras();
    mostrarAlerta(`➕ "${nuevo}" añadido con push(). Ahora tienes ${compras.length} productos.`, "success");
    return true;
}

// ========== NÚMEROS ==========
let numeros = [10, 20, 30, 40, 50];

function actualizarNumeros() {
    const display = document.getElementById('vaciadoDisplay');
    const count = document.getElementById('vaciadoCount');
    if (!display || !count) return;
    if (numeros.length === 0) display.textContent = '[ ]';
    else display.textContent = `[ ${numeros.join(', ')} ]`;
    count.textContent = numeros.length;
}

export function agregarNumero(valor) {
    if (valor === "" || isNaN(Number(valor))) {
        mostrarAlerta("🔢 Ingresa un número válido para agregar.", "warning");
        return false;
    }
    const numero = Number(valor);
    numeros.push(numero);
    actualizarNumeros();
    mostrarAlerta(`➕ Número ${numero} agregado con push(). Ahora el array tiene ${numeros.length} elementos.`, "success");
    return true;
}

export function popNumero() {
    if (numeros.length === 0) {
        mostrarAlerta("⚠️ El array de números está vacío. No se puede eliminar.", "warning");
        return;
    }
    const eliminado = numeros.pop();
    actualizarNumeros();
    mostrarAlerta(`🔽 Se eliminó el número ${eliminado} usando pop(). Restan ${numeros.length}.`, "success");
}

export function vaciarConWhile() {
    if (numeros.length === 0) {
        mostrarAlerta("⏳ El array ya está vacío. No hay elementos para eliminar.", "info");
        return;
    }
    const eliminados = [];
    while (numeros.length > 0) {
        eliminados.push(numeros.pop());
    }
    actualizarNumeros();
    mostrarAlerta(`🧹 Bucle while + pop() completado. Elementos eliminados (en orden inverso): [${eliminados.join(', ')}]. Array totalmente vacío.`, "success");
}

export function resetNumeros() {
    numeros = [10, 20, 30, 40, 50];
    actualizarNumeros();
    mostrarAlerta("⟳ Array reiniciado a [10, 20, 30, 40, 50].", "info");
}

// Inicializar vistas al cargar (se llama desde main.js)
export function initArrays() {
    actualizarAnimales();
    actualizarCompras();
    actualizarNumeros();
}