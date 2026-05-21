/**
 * Archivo: hijoCounter.js
 * Propósito: Funciones para contar y manipular hijos de un elemento DOM
 * Exporta: contarHijos, mostrarResultado, agregarHijo, eliminarUltimoHijo
 */

/**
 * Cuenta los hijos directos de un elemento (excluyendo text nodes vacíos)
 * @param {HTMLElement} elemento - Elemento padre
 * @returns {number} - Cantidad de hijos elemento
 */
export function contarHijos(elemento) {
  if (!elemento) return 0;
  // children cuenta solo elementos HTML, no nodos de texto
  return elemento.children.length;
}

/**
 * Muestra el resultado del conteo en el área designada
 * @param {object} info - Objeto con totalHijos y desglose por tipo
 * @param {HTMLElement} container - Contenedor donde mostrar
 */
export function mostrarResultado(info, container) {
  if (!container) return;
  
  container.innerHTML = `
    <div class="count-big">${info.totalHijos} hijos</div>
    <div style="margin-top: 1rem; text-align: left;">
      <strong>Desglose:</strong><br>
      📦 Divs: ${info.tipos.divs}<br>
      📝 Párrafos: ${info.tipos.ps}<br>
      🔤 Spans: ${info.tipos.spans}<br>
      🔘 Botones: ${info.tipos.buttons}
    </div>
    <div style="margin-top: 1rem; font-size: 0.85rem; color: var(--text-secondary);">
      ℹ️ Haz click en el recuadro gris o en el botón para volver a contar
    </div>
  `;
}

/**
 * Agrega un nuevo hijo al elemento padre
 * @param {HTMLElement} padre - Elemento padre
 * @param {string} tipo - Tipo de elemento ('div', 'p', 'span', 'button')
 * @param {string} texto - Texto contenido
 * @returns {HTMLElement} - El nuevo elemento creado
 */
export function agregarHijo(padre, tipo, texto) {
  if (!padre) return null;
  
  const nuevoElemento = document.createElement(tipo);
  nuevoElemento.textContent = texto;
  
  // Aplicar estilos consistentes
  if (tipo === 'div') {
    nuevoElemento.className = 'card';
  }
  nuevoElemento.style.margin = '0.5rem 0';
  nuevoElemento.style.padding = '0.5rem';
  nuevoElemento.style.backgroundColor = 'var(--card-bg)';
  nuevoElemento.style.borderRadius = '6px';
  
  padre.appendChild(nuevoElemento);
  return nuevoElemento;
}

/**
 * Elimina el último hijo del elemento padre
 * @param {HTMLElement} padre - Elemento padre
 * @returns {boolean} - True si se eliminó algo, false si no había hijos
 */
export function eliminarUltimoHijo(padre) {
  if (!padre) return false;
  const hijos = padre.children;
  if (hijos.length === 0) return false;
  padre.removeChild(hijos[hijos.length - 1]);
  return true;
}