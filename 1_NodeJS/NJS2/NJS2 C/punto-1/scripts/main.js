/**
 * Archivo: main.js
 * Propósito: JavaScript del cliente para modo oscuro
 */

const THEME_KEY = 'node-project-theme';

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'dark') {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
}

function toggleTheme() {
  const isDark = document.body.classList.contains('dark');
  if (isDark) {
    document.body.classList.remove('dark');
    localStorage.setItem(THEME_KEY, 'light');
  } else {
    document.body.classList.add('dark');
    localStorage.setItem(THEME_KEY, 'dark');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  
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
});