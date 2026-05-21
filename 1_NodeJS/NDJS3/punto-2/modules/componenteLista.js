/**
 * Componente: Lista de Tareas
 * Eventos: agregar tarea, eliminar tarea
 */

let tareas = [];

function renderizarLista(container) {
  if (!container) return;
  const listaHtml = tareas.map((t, i) => `
    <li>
      <span>${escapeHtml(t)}</span>
      <button class="delete-btn" data-index="${i}">Eliminar</button>
    </li>
  `).join('');
  container.innerHTML = listaHtml || '<li style="color: var(--text-secondary);">No hay tareas</li>';
}

function escapeHtml(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

export function renderContador() {
  return `
    <div id="listaComponent">
      <h2 class="component-title">Lista de Tareas</h2>
      <div class="todo-input">
        <input type="text" id="tareaInput" placeholder="Nueva tarea...">
        <button id="agregarTareaBtn" class="nav-btn">Agregar</button>
      </div>
      <ul id="todoList" class="todo-list"></ul>
    </div>
  `;
}

// Exportar con nombre correcto
export const renderLista = renderContador;

export function initListaEvents(mostrarMensaje) {
  const input = document.getElementById('tareaInput');
  const agregarBtn = document.getElementById('agregarTareaBtn');
  const listaContainer = document.getElementById('todoList');
  
  const actualizarLista = () => {
    renderizarLista(listaContainer);
    // Reasignar eventos de eliminar
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(btn.dataset.index);
        if (!isNaN(index)) {
          const eliminada = tareas.splice(index, 1)[0];
          actualizarLista();
          mostrarMensaje(`Eliminada: "${eliminada}"`, 'info');
        }
      });
    });
  };
  
  const agregarTarea = () => {
    const texto = input?.value.trim();
    if (!texto) {
      mostrarMensaje('Escribe una tarea', 'error');
      return;
    }
    tareas.push(texto);
    input.value = '';
    actualizarLista();
    mostrarMensaje(`Agregada: "${texto}"`, 'success');
  };
  
  if (agregarBtn) agregarBtn.addEventListener('click', agregarTarea);
  if (input) input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') agregarTarea();
  });
  
  actualizarLista();
}