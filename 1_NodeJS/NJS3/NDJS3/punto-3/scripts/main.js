/**
 * Archivo: main.js
 * Propósito: Controlador para contar hijos mediante eventos click
 * Módulos: themeManager, hijoCounter
 */

import { initTheme, toggleTheme } from '../modules/themeManager.js';
import { contarHijos, mostrarResultado, agregarHijo, eliminarUltimoHijo } from '../modules/hijoCounter.js';

let elementoActual = null;

function mostrarMensaje(mensaje, tipo = 'info') {
  const msgArea = document.getElementById('messageArea');
  if (!msgArea) return;
  let color = '#007bff';
  if (tipo === 'success') color = '#28a745';
  if (tipo === 'error') color = '#dc3545';
  msgArea.innerHTML = `<span style="color: ${color};">${mensaje}</span>`;
  setTimeout(() => {
    if (msgArea.innerHTML.includes(mensaje)) {
      msgArea.innerHTML = 'Listo. Haz click en el recuadro gris o en el botón';
    }
  }, 3000);
}

function actualizarConteo() {
  if (!elementoActual) return;
  const total = contarHijos(elementoActual);
  const info = {
    totalHijos: total,
    tipos: {
      divs: elementoActual.querySelectorAll(':scope > div').length,
      spans: elementoActual.querySelectorAll(':scope > span').length,
      ps: elementoActual.querySelectorAll(':scope > p').length,
      buttons: elementoActual.querySelectorAll(':scope > button').length
    }
  };
  mostrarResultado(info, document.getElementById('resultadoArea'));
  mostrarMensaje(`El elemento tiene ${total} hijo(s)`, 'success');
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  
  // Configurar tema
  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      toggleTheme();
      const isDark = document.body.classList.contains('dark');
      themeBtn.textContent = isDark ? '☀️ Modo Claro' : '🌙 Modo Oscuro';
    });
    const isDark = document.body.classList.contains('dark');
    themeBtn.textContent = isDark ? '☀️ Modo Claro' : '🌙 Modo Oscuro';
  }
  
  // Elemento a analizar
  elementoActual = document.getElementById('elementoParaAnalizar');
  
  // Evento: click en el elemento (pulsado)
  if (elementoActual) {
    elementoActual.addEventListener('click', (e) => {
      e.stopPropagation();
      actualizarConteo();
    });
  }
  
  // Evento: botón contar hijos
  const btnContar = document.getElementById('btnContarHijos');
  if (btnContar) {
    btnContar.addEventListener('click', actualizarConteo);
  }
  
  // Agregar hijo
  const btnAgregar = document.getElementById('btnAgregarHijo');
  const inputTexto = document.getElementById('hijoTexto');
  const selectTipo = document.getElementById('tipoHijo');
  
  if (btnAgregar && elementoActual) {
    btnAgregar.addEventListener('click', () => {
      const texto = inputTexto?.value.trim() || 'Nuevo elemento';
      const tipo = selectTipo?.value || 'div';
      agregarHijo(elementoActual, tipo, texto);
      if (inputTexto) inputTexto.value = '';
      actualizarConteo();
      mostrarMensaje(`Agregado: ${tipo} con texto "${texto}"`, 'success');
    });
  }
  
  // Eliminar último hijo
  const btnEliminar = document.getElementById('btnEliminarUltimo');
  if (btnEliminar && elementoActual) {
    btnEliminar.addEventListener('click', () => {
      const eliminado = eliminarUltimoHijo(elementoActual);
      if (eliminado) {
        actualizarConteo();
        mostrarMensaje(`Eliminado el último hijo`, 'info');
      } else {
        mostrarMensaje(`No hay hijos para eliminar`, 'error');
      }
    });
  }
  
  // Conteo inicial
  actualizarConteo();
});