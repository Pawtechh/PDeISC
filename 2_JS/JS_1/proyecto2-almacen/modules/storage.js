/**
 * ARCHIVO: storage.js
 * PROPÓSITO: Gestionar almacenamiento en array, sessionStorage y localStorage
 * EXPORTA: funciones para cada método
 */

const STORAGE_KEY = 'productos_almacen';

// Array en memoria
let memoriaArray = [];

export function cargarDesdeArray() {
  return [...memoriaArray];
}

export function guardarEnArray(producto) {
  memoriaArray.push(producto);
  return cargarDesdeArray();
}

export function cargarDesdeSession() {
  const datos = sessionStorage.getItem(STORAGE_KEY);
  return datos ? JSON.parse(datos) : [];
}

export function guardarEnSession(producto) {
  const existentes = cargarDesdeSession();
  const nuevos = [...existentes, producto];
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nuevos));
  return nuevos;
}

export function cargarDesdeLocal() {
  const datos = localStorage.getItem(STORAGE_KEY);
  return datos ? JSON.parse(datos) : [];
}

export function guardarEnLocal(producto) {
  const existentes = cargarDesdeLocal();
  const nuevos = [...existentes, producto];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevos));
  return nuevos;
}

export function limpiarTodos() {
  memoriaArray = [];
  sessionStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_KEY);
}