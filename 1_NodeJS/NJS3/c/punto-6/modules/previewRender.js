/**
 * Archivo: previewRenderer.js
 * Propósito: Renderizar la vista previa de los datos registrados
 * Exporta: renderizarPreview, limpiarPreview
 */

let registroActual = null;

/**
 * Renderiza los datos del formulario en el panel de vista previa
 * @param {object} datos - Datos del formulario
 */
export function renderizarPreview(datos) {
  const container = document.getElementById('previewContainer');
  if (!container) return;
  
  registroActual = datos;
  
  // Formatear intereses
  const interesesHtml = datos.intereses.length > 0
    ? `<div class="intereses-list">
         ${datos.intereses.map(interes => `<span class="interes-badge">${interes}</span>`).join('')}
       </div>`
    : '<span class="value">No seleccionó intereses</span>';
  
  const previewHtml = `
    <div class="preview-card">
      <h3>📋 Información del registro</h3>
      
      <div class="preview-field">
        <div class="label">Nombre completo:</div>
        <div class="value">${escapeHtml(datos.nombre)}</div>
      </div>
      
      <div class="preview-field">
        <div class="label">Correo electrónico:</div>
        <div class="value">${escapeHtml(datos.email)}</div>
      </div>
      
      <div class="preview-field">
        <div class="label">Edad:</div>
        <div class="value">${escapeHtml(datos.edad)} años</div>
      </div>
      
      <div class="preview-field">
        <div class="label">Género:</div>
        <div class="value">${escapeHtml(datos.genero)}</div>
      </div>
      
      <div class="preview-field">
        <div class="label">País:</div>
        <div class="value">${escapeHtml(datos.pais)}</div>
      </div>
      
      <div class="preview-field">
        <div class="label">Intereses:</div>
        <div class="value">${interesesHtml}</div>
      </div>
      
      <div class="preview-field">
        <div class="label">Fecha registro:</div>
        <div class="value">${new Date().toLocaleString()}</div>
      </div>
    </div>
  `;
  
  container.innerHTML = previewHtml;
}

/**
 * Limpia la vista previa
 */
export function limpiarPreview() {
  const container = document.getElementById('previewContainer');
  if (!container) return;
  
  container.innerHTML = `
    <div class="empty-preview">
      Completa el formulario y presiona "Registrar" para ver los datos aquí
    </div>
  `;
  registroActual = null;
}

/**
 * Función auxiliar para escapar HTML y prevenir XSS
 */
function escapeHtml(texto) {
  if (!texto) return '';
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}