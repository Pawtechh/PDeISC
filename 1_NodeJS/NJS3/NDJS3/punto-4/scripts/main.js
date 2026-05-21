/**
 * Archivo: main.js
 * Propósito: Controlador para crear y modificar nodos <a>
 * Módulos: themeManager, nodoManager
 */

import { initTheme, toggleTheme } from '../modules/themeManager.js';
import { 
  crearNodosPredeterminados, 
  modificarNodoPorIndice, 
  modificarTodosAleatorio,
  resetearNodos,
  agregarLog,
  obtenerNodos
} from '../modules/nodoManager.js';

let nodosActuales = [];

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
      msgArea.innerHTML = 'Selecciona una acción para continuar';
    }
  }, 4000);
}

function renderizarNodos() {
  const container = document.getElementById('nodosContainer');
  if (!container) return;
  
  const nodos = obtenerNodos();
  if (nodos.length === 0) {
    container.innerHTML = '<div class="empty-message">No hay nodos. Presiona "Crear 5 nodos"</div>';
    return;
  }
  
  container.innerHTML = nodos.map((nodo, index) => `
    <div class="nodo-item" data-index="${index}">
      <div>
        <a href="${nodo.href}" target="_blank">${nodo.texto}</a>
      </div>
      <div class="nodo-info">
        🔗 href: ${nodo.href} | 📝 texto: ${nodo.texto}
      </div>
    </div>
  `).join('');
}

function actualizarLog() {
  const logContainer = document.getElementById('logContainer');
  if (!logContainer) return;
  
  // Obtener logs del manager (implementado en nodoManager)
  import('../modules/nodoManager.js').then(module => {
    const logs = module.obtenerLogs();
    if (logs.length === 0) {
      logContainer.innerHTML = '<div class="log-entry">No hay cambios registrados aún</div>';
      return;
    }
    logContainer.innerHTML = logs.map(log => `
      <div class="log-entry">
        <span class="timestamp">[${log.hora}]</span>
        <strong>${log.accion}</strong><br>
        <span class="modified">${log.detalle}</span>
      </div>
    `).join('');
    logContainer.scrollTop = logContainer.scrollHeight;
  });
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
  
  // Crear 5 nodos
  const btnCrear = document.getElementById('btnCrear5Nodos');
  if (btnCrear) {
    btnCrear.addEventListener('click', () => {
      crearNodosPredeterminados();
      renderizarNodos();
      actualizarLog();
      mostrarMensaje('✅ 5 nodos &lt;a&gt; creados correctamente', 'success');
    });
  }
  
  // Modificadores individuales (índices 0 a 4)
  const modificadores = [
    { btn: 'btnModificarGoogle', indice: 0, nuevoHref: 'https://www.bing.com', nuevoTexto: 'Bing', desc: 'Google → Bing' },
    { btn: 'btnModificarYoutube', indice: 1, nuevoHref: 'https://vimeo.com', nuevoTexto: 'Vimeo', desc: 'YouTube → Vimeo' },
    { btn: 'btnModificarGitHub', indice: 2, nuevoHref: 'https://gitlab.com', nuevoTexto: 'GitLab', desc: 'GitHub → GitLab' },
    { btn: 'btnModificarTwitter', indice: 3, nuevoHref: 'https://mastodon.social', nuevoTexto: 'Mastodon', desc: 'Twitter → Mastodon' },
    { btn: 'btnModificarWikipedia', indice: 4, nuevoHref: 'https://es.wikibooks.org', nuevoTexto: 'Wikilibros', desc: 'Wikipedia → Wikilibros' }
  ];
  
  modificadores.forEach(mod => {
    const btn = document.getElementById(mod.btn);
    if (btn) {
      btn.addEventListener('click', () => {
        const resultado = modificarNodoPorIndice(mod.indice, mod.nuevoHref, mod.nuevoTexto);
        if (resultado) {
          renderizarNodos();
          actualizarLog();
          mostrarMensaje(`✏️ Modificado: ${mod.desc}`, 'success');
        } else {
          mostrarMensaje(`❌ No se pudo modificar. Crea los 5 nodos primero`, 'error');
        }
      });
    }
  });
  
  // Modificar todos aleatorio
  const btnModificarTodos = document.getElementById('btnModificarTodos');
  if (btnModificarTodos) {
    btnModificarTodos.addEventListener('click', () => {
      const modificados = modificarTodosAleatorio();
      if (modificados > 0) {
        renderizarNodos();
        actualizarLog();
        mostrarMensaje(`🎲 Se modificaron ${modificados} nodos aleatoriamente`, 'success');
      } else {
        mostrarMensaje(`❌ No hay nodos para modificar. Crea los 5 nodos primero`, 'error');
      }
    });
  }
  
  // Resetear nodos
  const btnResetear = document.getElementById('btnResetearNodos');
  if (btnResetear) {
    btnResetear.addEventListener('click', () => {
      resetearNodos();
      renderizarNodos();
      actualizarLog();
      mostrarMensaje(`🔄 Nodos restaurados a sus valores originales`, 'success');
    });
  }
  
  // Renderizado inicial vacío
  renderizarNodos();
  actualizarLog();
});