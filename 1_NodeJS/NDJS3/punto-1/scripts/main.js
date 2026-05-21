/**
 * Archivo: main.js
 * Propósito: Controlador principal de eventos DOM para proyecto 1
 * Módulos utilizados: domHelpers.js, themeManager.js
 */

import { mostrarMensaje, crearImagen, cambiarTamanoImagen, cambiarTextoH1, cambiarColorH1 } from '../modules/domHelpers.js';
import { initTheme, toggleTheme } from '../modules/themeManager.js';

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar tema guardado en localStorage
  initTheme();
  
  // Referencias a elementos del DOM
  const dynamicH1 = document.getElementById('dynamicH1');
  const imageContainer = document.getElementById('imageContainer');
  
  // Estado interno para saber si existe imagen y su referencia
  let currentImage = null;
  
  // Funcion auxiliar para actualizar referencia de imagen
  const actualizarReferenciaImagen = () => {
    currentImage = imageContainer.querySelector('img');
  };
  
  // --- BOTON 1: Agregar H1 (si no existe, lo crea; si existe, muestra mensaje) ---
  const btnAgregarH1 = document.getElementById('btnAgregarH1');
  if (btnAgregarH1) {
    btnAgregarH1.addEventListener('click', () => {
      if (!dynamicH1) {
        // No deberia ocurrir porque el H1 existe en HTML, pero por seguridad
        const nuevoH1 = document.createElement('h1');
        nuevoH1.id = 'dynamicH1';
        nuevoH1.className = 'dynamic-title';
        nuevoH1.textContent = 'Hola DOM';
        const mainContent = document.querySelector('.main-content');
        mainContent.insertBefore(nuevoH1, mainContent.firstChild);
        mostrarMensaje('✅ Se ha agregado el H1 correctamente', 'success');
      } else {
        mostrarMensaje('⚠️ El elemento H1 ya existe en la página', 'info');
      }
    });
  }
  
  // --- BOTON 2: Cambiar texto del H1 (Chau DOM) ---
  const btnCambiarTexto = document.getElementById('btnCambiarTexto');
  if (btnCambiarTexto) {
    btnCambiarTexto.addEventListener('click', () => {
      if (dynamicH1) {
        cambiarTextoH1(dynamicH1, 'Chau DOM');
        mostrarMensaje('✏️ Texto cambiado a: "Chau DOM"', 'success');
      } else {
        mostrarMensaje('❌ No existe el H1. Primero agrégalo', 'error');
      }
    });
  }
  
  // --- BOTON 3: Cambiar color del H1 (color aleatorio) ---
  const btnCambiarColor = document.getElementById('btnCambiarColor');
  if (btnCambiarColor) {
    btnCambiarColor.addEventListener('click', () => {
      if (dynamicH1) {
        const nuevoColor = cambiarColorH1(dynamicH1);
        mostrarMensaje(`🎨 Color cambiado a: ${nuevoColor}`, 'success');
      } else {
        mostrarMensaje('❌ No existe el H1. Primero agrégalo', 'error');
      }
    });
  }
  
  // --- BOTON 4: Agregar imagen (si no hay, crea una por defecto) ---
  const btnAgregarImg = document.getElementById('btnAgregarImg');
  if (btnAgregarImg) {
    btnAgregarImg.addEventListener('click', () => {
      if (!imageContainer.querySelector('img')) {
        const img = crearImagen('https://picsum.photos/id/1/300/200', 'Imagen de ejemplo');
        imageContainer.appendChild(img);
        actualizarReferenciaImagen();
        mostrarMensaje('🖼️ Imagen agregada correctamente', 'success');
      } else {
        mostrarMensaje('⚠️ Ya existe una imagen. Usa "Cambiar imagen" para reemplazarla', 'info');
      }
    });
  }
  
  // --- BOTON 5: Cambiar imagen (cambia src por otra aleatoria) ---
  const btnCambiarImg = document.getElementById('btnCambiarImg');
  if (btnCambiarImg) {
    btnCambiarImg.addEventListener('click', () => {
      const img = imageContainer.querySelector('img');
      if (img) {
        const randomId = Math.floor(Math.random() * 100) + 1;
        const nuevaUrl = `https://picsum.photos/id/${randomId}/300/200`;
        img.src = nuevaUrl;
        img.alt = `Imagen aleatoria ${randomId}`;
        currentImage = img;
        mostrarMensaje(`🔄 Imagen cambiada a ID: ${randomId}`, 'success');
      } else {
        mostrarMensaje('❌ No hay imagen. Primero agrega una', 'error');
      }
    });
  }
  
  // --- BOTON 6: Cambiar tamaño de la imagen (alterna entre 150px, 300px, 500px de ancho) ---
  const btnCambiarTamImg = document.getElementById('btnCambiarTamImg');
  if (btnCambiarTamImg) {
    btnCambiarTamImg.addEventListener('click', () => {
      const img = imageContainer.querySelector('img');
      if (img) {
        const nuevoTamano = cambiarTamanoImagen(img);
        mostrarMensaje(`📐 Tamaño cambiado a: ${nuevoTamano}px de ancho`, 'success');
      } else {
        mostrarMensaje('❌ No hay imagen. Primero agrega una', 'error');
      }
    });
  }
  
  // Inicializar verificacion por si hay imagen cargada desde HTML (opcional)
  actualizarReferenciaImagen();
  
  // --- Evento para boton de tema oscuro/claro ---
  const themeToggleBtn = document.getElementById('themeToggle');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      toggleTheme();
      // Actualizar texto del boton segun el modo actual
      const isDark = document.body.classList.contains('dark');
      themeToggleBtn.textContent = isDark ? '☀️ Modo Claro' : '🌙 Modo Oscuro';
    });
    // Sincronizar texto del boton al inicio
    const isDark = document.body.classList.contains('dark');
    themeToggleBtn.textContent = isDark ? '☀️ Modo Claro' : '🌙 Modo Oscuro';
  }
});