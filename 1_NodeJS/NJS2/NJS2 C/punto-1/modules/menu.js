/**
 * Archivo: menu.js
 * Propósito: Menú modular reutilizable con links a 5 páginas diferentes (Punto 5)
 */

export function generarMenuHTML(paginaActiva = 'inicio') {
  const menuItems = [
    { id: 'inicio', nombre: '🏠 Inicio', url: '/' },
    { id: 'clima', nombre: '🌤️ Clima', url: '/clima' },
    { id: 'calculos', nombre: '🧮 Cálculos', url: '/calculos' },
    { id: 'archivo-html', nombre: '📁 FS + HTTP', url: '/archivo-html' },
    { id: 'info-url', nombre: '🔗 Info URL', url: '/info-url' }
  ];
  
  const itemsHTML = menuItems.map(item => `
    <a href="${item.url}" class="menu-item ${paginaActiva === item.id ? 'active' : ''}">
      ${item.nombre}
    </a>
  `).join('');
  
  return `
    <header class="header">
      <h1>Node.js - Módulos</h1>
      <nav class="menu-nav">
        ${itemsHTML}
      </nav>
      <button id="themeToggle" class="theme-btn">🌙 Modo Oscuro</button>
    </header>
  `;
}