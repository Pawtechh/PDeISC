import { generarCard, generarAlerta, generarTabla, generarLista, generarProgress } from './plantillas.js';

const escenario = document.getElementById('escenario');
let cardN = 1, alertaN = 1, tablaN = 1, listaN = 1, progN = 1;

const agregar = (html) => {
  const div = document.createElement('div');
  div.className = 'objeto-html';
  div.innerHTML = html;
  escenario.appendChild(div);
};

document.getElementById('btnCard').addEventListener('click',     () => agregar(generarCard(cardN++)));
document.getElementById('btnAlerta').addEventListener('click',   () => agregar(generarAlerta(alertaN++)));
document.getElementById('btnTabla').addEventListener('click',    () => agregar(generarTabla(tablaN++)));
document.getElementById('btnLista').addEventListener('click',    () => agregar(generarLista(listaN++)));
document.getElementById('btnProgress').addEventListener('click', () => agregar(generarProgress(progN++)));
document.getElementById('btnLimpiar').addEventListener('click',  () => { escenario.innerHTML = ''; cardN = alertaN = tablaN = listaN = progN = 1; });