/**
 * Archivo: elementFactory.js
 * Propósito: Fábrica de elementos HTML agregados mediante innerHTML
 * Exporta funciones para crear diferentes componentes
 */

let logs = [];
let contadorElementos = 0;

function obtenerTimestamp() {
  const now = new Date();
  return `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`;
}

function agregarLog(tipo, detalle) {
  logs.unshift({
    hora: obtenerTimestamp(),
    tipo: tipo,
    detalle: detalle
  });
  if (logs.length > 50) logs.pop();
}

export function obtenerLogs() {
  return logs;
}

export function vaciarLogs() {
  logs = [];
  contadorElementos = 0;
}

export function limpiarContenedor(container) {
  if (!container) return false;
  container.innerHTML = '<div class="empty-message">Contenedor vacío. Agrega elementos con los botones</div>';
  agregarLog('LIMPIAR', 'Se limpió todo el contenedor');
  return true;
}

export function agregarTarjeta(container) {
  if (!container) return false;
  contadorElementos++;
  const tarjetaHtml = `
    <div class="tarjeta">
      <h4>📇 Tarjeta #${contadorElementos}</h4>
      <p>Esta es una tarjeta agregada mediante <strong>innerHTML</strong>. Puede contener cualquier contenido HTML.</p>
      <small>Agregada: ${new Date().toLocaleTimeString()}</small>
    </div>
  `;
  
  if (container.innerHTML.includes('empty-message')) {
    container.innerHTML = tarjetaHtml;
  } else {
    container.innerHTML += tarjetaHtml;
  }
  
  agregarLog('TARJETA', `Tarjeta #${contadorElementos} agregada al contenedor`);
  return true;
}

export function agregarAlerta(container) {
  if (!container) return false;
  const alertaHtml = `
    <div class="alerta">
      ⚠️ <strong>Alerta!</strong> Este es un mensaje de alerta creado dinámicamente con innerHTML.
      <button onclick="this.parentElement.remove()" style="float:right; background:none; border:none; cursor:pointer;">✖️</button>
    </div>
  `;
  
  if (container.innerHTML.includes('empty-message')) {
    container.innerHTML = alertaHtml;
  } else {
    container.innerHTML += alertaHtml;
  }
  
  agregarLog('ALERTA', 'Alerta agregada (puede cerrarse con ✖️)');
  return true;
}

export function agregarBarraProgreso(container) {
  if (!container) return false;
  const porcentaje = Math.floor(Math.random() * 100) + 1;
  const progresoHtml = `
    <div class="progreso-container">
      <div class="progreso-bar">
        <div class="progreso-fill" style="width: ${porcentaje}%;"></div>
      </div>
      <span style="font-size:0.8rem;">Progreso: ${porcentaje}%</span>
    </div>
  `;
  
  if (container.innerHTML.includes('empty-message')) {
    container.innerHTML = progresoHtml;
  } else {
    container.innerHTML += progresoHtml;
  }
  
  agregarLog('PROGRESO', `Barra de progreso con ${porcentaje}% agregada`);
  return true;
}

export function agregarLista(container) {
  if (!container) return false;
  const items = ['Manzana', 'Banana', 'Cereza', 'Dátil', 'Fresa'];
  const listaHtml = `
    <div class="lista-item">
      <strong>📋 Lista de frutas</strong>
      <ul style="margin-top:0.5rem; margin-left:1.5rem;">
        ${items.map(item => `<li>${item}</li>`).join('')}
      </ul>
    </div>
  `;
  
  if (container.innerHTML.includes('empty-message')) {
    container.innerHTML = listaHtml;
  } else {
    container.innerHTML += listaHtml;
  }
  
  agregarLog('LISTA', 'Lista de 5 elementos agregada');
  return true;
}

export function agregarBadge(container) {
  if (!container) return false;
  const colores = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8'];
  const colorRandom = colores[Math.floor(Math.random() * colores.length)];
  const badgeHtml = `
    <div class="badge" style="background-color: ${colorRandom};">
      🏷️ Badge #${contadorElementos + 1} - Elemento dinámico
    </div>
  `;
  
  if (container.innerHTML.includes('empty-message')) {
    container.innerHTML = badgeHtml;
  } else {
    container.innerHTML += badgeHtml;
  }
  contadorElementos++;
  agregarLog('BADGE', `Badge con color ${colorRandom} agregado`);
  return true;
}

export function agregarModal(container) {
  if (!container) return false;
  
  // Crear modal (no usa innerHTML directamente para el modal porque es overlay)
  const modalId = `modal_${Date.now()}`;
  const modalHtml = `
    <div id="${modalId}" class="modal-overlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background-color:rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center; z-index:1000;">
      <div class="modal-content">
        <h3>🪟 Modal dinámico</h3>
        <p>Este modal fue creado mediante innerHTML. Puedes cerrarlo haciendo click en el botón.</p>
        <button onclick="document.getElementById('${modalId}').remove()" class="action-btn primary">Cerrar</button>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  agregarLog('MODAL', 'Modal emergente agregado al body');
  return true;
}