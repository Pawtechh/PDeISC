// script.js - splice() con alertas cerrables manualmente
const alertContainer = document.getElementById('alertContainer');

// Función corregida: las alertas se pueden cerrar con la 'x'
function mostrarAlerta(mensaje, tipo = 'info') {
  const iconos = {
    success: 'bi-check-circle-fill',
    danger: 'bi-exclamation-triangle-fill',
    warning: 'bi-exclamation-circle-fill',
    info: 'bi-info-circle-fill'
  };
  const icono = iconos[tipo] || 'bi-info-circle-fill';
  
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${tipo} alert-dismissible fade show mb-2`;
  alertDiv.role = 'alert';
  alertDiv.innerHTML = `
    <i class="bi ${icono} me-2"></i> ${mensaje}
    <button type="button" class="btn-close" aria-label="Cerrar"></button>
  `;
  
  const closeBtn = alertDiv.querySelector('.btn-close');
  closeBtn.addEventListener('click', () => {
    alertDiv.classList.remove('show');
    alertDiv.classList.add('fade');
    setTimeout(() => alertDiv.remove(), 300);
  });
  
  alertContainer.insertAdjacentElement('beforeend', alertDiv);
  
  setTimeout(() => {
    if (alertDiv && alertDiv.parentNode) {
      alertDiv.classList.remove('show');
      alertDiv.classList.add('fade');
      setTimeout(() => {
        if (alertDiv && alertDiv.parentNode) alertDiv.remove();
      }, 300);
    }
  }, 5000);
}

// ========== 1. ELIMINAR DOS ELEMENTOS DESDE POSICIÓN 1 ==========
let letras = ['A', 'B', 'C', 'D', 'E'];

function actualizarLetras() {
  const display = document.getElementById('letrasDisplay');
  const count = document.getElementById('letrasCount');
  display.textContent = letras.length === 0 ? '[ ]' : `[ ${letras.join(', ')} ]`;
  count.textContent = letras.length;
}

function eliminarElementos() {
  if (letras.length < 3) {
    mostrarAlerta('No hay suficientes elementos para eliminar desde posición 1 (necesitas al menos 3).', 'warning');
    return;
  }
  const eliminados = letras.splice(1, 2);
  actualizarLetras();
  mostrarAlerta(`✂️ Se eliminaron los elementos: [${eliminados.join(', ')}] usando splice(1,2). Nuevo array: [${letras.join(', ')}]`, 'success');
}

function resetLetras() {
  letras = ['A', 'B', 'C', 'D', 'E'];
  actualizarLetras();
  mostrarAlerta('⟳ Array de letras reiniciado.', 'info');
}

// ========== 2. INSERTAR NOMBRE EN SEGUNDA POSICIÓN (SIN ELIMINAR) ==========
let nombres = ['Ana', 'Luis', 'Marta'];

function actualizarNombres() {
  const display = document.getElementById('nombresDisplay');
  const count = document.getElementById('nombresCount');
  display.textContent = nombres.length === 0 ? '[ ]' : `[ ${nombres.join(', ')} ]`;
  count.textContent = nombres.length;
}

function insertarNombre() {
  const input = document.getElementById('nuevoNombre');
  const nuevo = input.value.trim();
  if (nuevo === "") {
    mostrarAlerta('Escribe un nombre para insertar.', 'warning');
    return;
  }
  nombres.splice(1, 0, nuevo);
  actualizarNombres();
  mostrarAlerta(`📌 Se insertó "${nuevo}" en la posición 1 (segundo lugar) con splice(1,0,"${nuevo}"). Array: [${nombres.join(', ')}]`, 'success');
  input.value = '';
}

function resetNombres() {
  nombres = ['Ana', 'Luis', 'Marta'];
  actualizarNombres();
  mostrarAlerta('⟳ Lista de nombres reiniciada.', 'info');
}

// ========== 3. REEMPLAZAR DOS ELEMENTOS DESDE POSICIÓN DETERMINADA ==========
let colores = ['Rojo', 'Verde', 'Azul', 'Amarillo', 'Morado'];

function actualizarColores() {
  const display = document.getElementById('coloresDisplay');
  const count = document.getElementById('coloresCount');
  display.textContent = colores.length === 0 ? '[ ]' : `[ ${colores.join(', ')} ]`;
  count.textContent = colores.length;
}

function reemplazarElementos() {
  const pos = parseInt(document.getElementById('posReemplazo').value);
  const nuevo1 = document.getElementById('nuevoColor1').value.trim();
  const nuevo2 = document.getElementById('nuevoColor2').value.trim();
  
  if (nuevo1 === "" || nuevo2 === "") {
    mostrarAlerta('Completa ambos valores para reemplazar.', 'warning');
    return;
  }
  if (pos + 2 > colores.length) {
    mostrarAlerta(`No se pueden reemplazar 2 elementos desde la posición ${pos} porque el array solo tiene ${colores.length} elementos.`, 'danger');
    return;
  }
  const reemplazados = colores.splice(pos, 2, nuevo1, nuevo2);
  actualizarColores();
  mostrarAlerta(`🔄 Reemplazados [${reemplazados.join(', ')}] por ["${nuevo1}", "${nuevo2}"] desde posición ${pos}. Nuevo array: [${colores.join(', ')}]`, 'success');
}

function resetColores() {
  colores = ['Rojo', 'Verde', 'Azul', 'Amarillo', 'Morado'];
  actualizarColores();
  mostrarAlerta('⟳ Colores reiniciados.', 'info');
}

// ========== EVENTOS (variados: click, dblclick, change) ==========
// 1. Letras
document.getElementById('eliminarBtn').addEventListener('click', eliminarElementos);
document.getElementById('resetLetrasBtn').addEventListener('click', resetLetras);
document.getElementById('letrasDisplay').addEventListener('dblclick', resetLetras); // doble clic reinicia

// 2. Nombres
document.getElementById('insertarBtn').addEventListener('click', insertarNombre);
document.getElementById('resetNombresBtn').addEventListener('click', resetNombres);
document.getElementById('nuevoNombre').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') insertarNombre();
});

// 3. Colores
document.getElementById('reemplazarBtn').addEventListener('click', reemplazarElementos);
document.getElementById('resetColoresBtn').addEventListener('click', resetColores);
// Evento change del select: opcional (solo muestra feedback sin acción destructiva)
document.getElementById('posReemplazo').addEventListener('change', () => {
  mostrarAlerta(`Posición de reemplazo cambiada a ${document.getElementById('posReemplazo').value}. Usa el botón para aplicar splice.`, 'info');
});

// Inicializar vistas
actualizarLetras();
actualizarNombres();
actualizarColores();