/**
 * Archivo: main.js
 * Propósito: Controlador del formulario de registro
 * Módulos: themeManager, formValidator, previewRenderer
 */

import { initTheme, toggleTheme } from '../modules/themeManager.js';
import { validarFormulario, limpiarErrores } from '../modules/formValidator.js';
import { renderizarPreview, limpiarPreview } from '../modules/previewRenderer.js';

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
      msgArea.innerHTML = 'Esperando acción...';
    }
  }, 4000);
}

function obtenerDatosFormulario() {
  // Texto, email, number
  const nombre = document.getElementById('nombre')?.value.trim() || '';
  const email = document.getElementById('email')?.value.trim() || '';
  const edad = document.getElementById('edad')?.value || '';
  
  // Radio (género)
  let genero = '';
  const radios = document.querySelectorAll('input[name="genero"]');
  radios.forEach(radio => {
    if (radio.checked) genero = radio.value;
  });
  
  // Select (país)
  const pais = document.getElementById('pais')?.value || '';
  
  // Checkboxes (intereses)
  const intereses = [];
  const checkboxes = document.querySelectorAll('input[name="intereses"]:checked');
  checkboxes.forEach(cb => intereses.push(cb.value));
  
  return { nombre, email, edad, genero, pais, intereses };
}

function manejarSubmit(event) {
  event.preventDefault();
  
  // Limpiar errores anteriores
  limpiarErrores();
  
  // Obtener datos
  const datos = obtenerDatosFormulario();
  
  // Validar
  const errores = validarFormulario(datos);
  
  if (Object.keys(errores).length > 0) {
    // Mostrar errores en el DOM
    for (const [campo, mensaje] of Object.entries(errores)) {
      const errorElement = document.getElementById(`error-${campo}`);
      if (errorElement) {
        errorElement.textContent = mensaje;
      }
    }
    mostrarMensaje('❌ Hay errores en el formulario. Corrígelos para continuar.', 'error');
    return;
  }
  
  // Si todo está bien, mostrar en preview
  renderizarPreview(datos);
  mostrarMensaje('✅ Registro exitoso! Los datos se muestran a la derecha.', 'success');
}

function manejarReset() {
  // Limpiar formulario
  const form = document.getElementById('registroForm');
  if (form) form.reset();
  
  // Limpiar errores
  limpiarErrores();
  
  mostrarMensaje('🧹 Formulario limpiado', 'info');
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
  
  // Submit del formulario
  const form = document.getElementById('registroForm');
  if (form) {
    form.addEventListener('submit', manejarSubmit);
  }
  
  // Botón reset
  const resetBtn = document.getElementById('btnReset');
  if (resetBtn) {
    resetBtn.addEventListener('click', manejarReset);
  }
  
  // Botón limpiar preview
  const limpiarPreviewBtn = document.getElementById('btnLimpiarPreview');
  if (limpiarPreviewBtn) {
    limpiarPreviewBtn.addEventListener('click', () => {
      limpiarPreview();
      mostrarMensaje('Vista previa limpiada', 'info');
    });
  }
});