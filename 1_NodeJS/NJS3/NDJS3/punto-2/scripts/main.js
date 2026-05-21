/**
 * Archivo: main.js
 * Propósito: Controlador de navegación entre componentes
 * Módulos: componentes/*, themeManager
 */

import { initTheme, toggleTheme } from '../modules/themeManager.js';
import { renderContador, initContadorEvents } from '../modules/componenteContador.js';
import { renderLista, initListaEvents } from '../modules/componenteLista.js';
import { renderColor, initColorEvents } from '../modules/componenteColor.js';
import { renderTexto, initTextoEvents } from '../modules/componenteTexto.js';
import { renderCalculadora, initCalculadoraEvents } from '../modules/componenteCalculadora.js';

// Mapa de componentes
const componentes = {
  contador: { render: renderContador, initEvents: initContadorEvents, nombre: 'Contador' },
  lista: { render: renderLista, initEvents: initListaEvents, nombre: 'Lista de Tareas' },
  color: { render: renderColor, initEvents: initColorEvents, nombre: 'Selector de Color' },
  texto: { render: renderTexto, initEvents: initTextoEvents, nombre: 'Texto Dinámico' },
  calculadora: { render: renderCalculadora, initEvents: initCalculadoraEvents, nombre: 'Calculadora' }
};

let componenteActual = 'contador';

function mostrarMensaje(mensaje, tipo = 'info') {
  const msgArea = document.getElementById('messageArea');
  if (!msgArea) return;
  let color = '#007bff';
  if (tipo === 'success') color = '#28a745';
  if (tipo === 'error') color = '#dc3545';
  msgArea.innerHTML = `<span style="color: ${color};">${mensaje}</span>`;
  setTimeout(() => {
    if (msgArea.innerHTML.includes(mensaje)) {
      msgArea.innerHTML = 'Selecciona un componente para comenzar';
    }
  }, 3000);
}

function cargarComponente(nombre) {
  const componente = componentes[nombre];
  if (!componente) return;
  
  componenteActual = nombre;
  const container = document.getElementById('componentContainer');
  if (!container) return;
  
  // Renderizar el componente
  container.innerHTML = componente.render();
  
  // Inicializar sus eventos
  componente.initEvents(mostrarMensaje);
  
  // Actualizar clase activa en navegación
  document.querySelectorAll('.nav-btn').forEach(btn => {
    if (btn.dataset.component === nombre) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  mostrarMensaje(`Componente "${componente.nombre}" cargado`, 'success');
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  
  // Configurar botón de tema
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
  
  // Configurar navegación
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const componentName = btn.dataset.component;
      if (componentName) cargarComponente(componentName);
    });
  });
  
  // Cargar componente por defecto
  cargarComponente('contador');
});