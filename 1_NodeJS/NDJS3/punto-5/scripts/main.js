/**
 * Archivo: main.js
 * Propósito: Controlador para agregar elementos HTML mediante innerHTML
 * Módulos: themeManager, elementFactory
 */

import { initTheme, toggleTheme } from '../modules/themeManager.js';
import { 
  agregarTarjeta, 
  agregarAlerta, 
  agregarBarraProgreso, 
  agregarLista, 
  agregarBadge, 
  agregarModal,
  limpiarContenedor,
  obtenerLogs,
  vaciarLogs
} from '../modules/elementFactory.js';

let contenedorActual = null;

function mostrarMensaje(mensaje, tipo = 'info') {
  const msgArea = document.getElementById('messageArea');
  if (!msgArea) return;
  let color = '#007bff';
  if (tipo === 'success') color = '#28a745';
  if (tipo === 'error') color = '#dc3545';
  if (tipo === 'warning') color = '#ffc107';
  msgArea.innerHTML = `<span style="color: ${color};">${mensaje}</span>`;
  setTimeout(() => {
    if (msgArea.innerHTML.includes(mensaje)) {
      msgArea.innerHTML = 'Esperando siguiente acción...';
    }
  }, 3000);
}

function actualizarLog() {
  const logContainer = document.getElementById('logContainer');
  if (!logContainer) return;
  
  const logs = obtenerLogs();
  if (logs.length === 0) {
    logContainer.innerHTML = '<div class="log-entry">No hay elementos agregados aún</div>';
    return;
  }
  
  logContainer.innerHTML = logs.map(log => `
    <div class="log-entry">
      <span class="timestamp">[${log.hora}]</span>
      <strong>${log.tipo}</strong><br>
      <span>${log.detalle}</span>
    </div>
  `).join('');
  logContainer.scrollTop = logContainer.scrollHeight;
}

function ejecutarAccion(accion, nombreAccion) {
  if (!contenedorActual) {
    mostrarMensaje('Error: Contenedor no encontrado', 'error');
    return;
  }
  
  const resultado = accion(contenedorActual);
  if (resultado) {
    mostrarMensaje(`✅ ${nombreAccion} agregado correctamente`, 'success');
    actualizarLog();
  } else {
    mostrarMensaje(`❌ Error al agregar ${nombreAccion}`, 'error');
  }
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
  
  // Obtener contenedor
  contenedorActual = document.getElementById('elementosContainer');
  
  // Botones para agregar elementos
  const btnTarjeta = document.getElementById('btnAgregarTarjeta');
  if (btnTarjeta) {
    btnTarjeta.addEventListener('click', () => ejecutarAccion(agregarTarjeta, 'Tarjeta'));
  }
  
  const btnAlerta = document.getElementById('btnAgregarAlerta');
  if (btnAlerta) {
    btnAlerta.addEventListener('click', () => ejecutarAccion(agregarAlerta, 'Alerta'));
  }
  
  const btnProgreso = document.getElementById('btnAgregarProgreso');
  if (btnProgreso) {
    btnProgreso.addEventListener('click', () => ejecutarAccion(agregarBarraProgreso, 'Barra de progreso'));
  }
  
  const btnLista = document.getElementById('btnAgregarLista');
  if (btnLista) {
    btnLista.addEventListener('click', () => ejecutarAccion(agregarLista, 'Lista de elementos'));
  }
  
  const btnBadge = document.getElementById('btnAgregarBadge');
  if (btnBadge) {
    btnBadge.addEventListener('click', () => ejecutarAccion(agregarBadge, 'Badge'));
  }
  
  const btnModal = document.getElementById('btnAgregarModal');
  if (btnModal) {
    btnModal.addEventListener('click', () => ejecutarAccion(agregarModal, 'Modal'));
  }
  
  // Limpiar todo
  const btnLimpiar = document.getElementById('btnLimpiarTodo');
  if (btnLimpiar && contenedorActual) {
    btnLimpiar.addEventListener('click', () => {
      limpiarContenedor(contenedorActual);
      mostrarMensaje('🧹 Contenedor limpiado', 'warning');
      actualizarLog();
    });
  }
  
  // Vaciar log
  const btnVaciarLog = document.getElementById('btnVaciarLog');
  if (btnVaciarLog) {
    btnVaciarLog.addEventListener('click', () => {
      vaciarLogs();
      actualizarLog();
      mostrarMensaje('Registro vaciado', 'info');
    });
  }
  
  actualizarLog();
});