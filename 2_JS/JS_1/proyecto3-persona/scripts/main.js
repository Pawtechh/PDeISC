/**
 * ARCHIVO: main.js
 * PROPÓSITO: Lógica principal con validaciones en tiempo real y envío
 * SIN ALERTS - todos los mensajes en DOM
 */

import { initTheme } from '/modules/theme.js';
import {
  cargarPersonas,
  guardarPersona,
  eliminarPersona,
  validarPersona,
  obtenerNombresCompletos
} from '/modules/personasManager.js';

// Mostrar mensaje en el DOM (sin alert)
function mostrarMensaje(texto, tipo = 'success') {
  const mensajeDiv = document.getElementById('mensaje');
  mensajeDiv.className = `alert alert-${tipo}`;
  mensajeDiv.innerHTML = `<strong>${tipo === 'success' ? '✓' : '⚠️'}</strong> ${texto}`;
  setTimeout(() => {
    if (mensajeDiv === document.getElementById('mensaje')) {
      mensajeDiv.className = 'alert alert-info';
      mensajeDiv.innerHTML = 'Complete y guarde una persona';
    }
  }, 5000);
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function (m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

function renderizarListaNombres() {
  const container = document.getElementById('listaNombres');
  const nombres = obtenerNombresCompletos();
  if (nombres.length === 0) {
    container.innerHTML = '<p class="text-muted">No hay personas registradas</p>';
    return;
  }
  container.innerHTML = nombres.map(n => `
    <div class="nombre-item" data-id="${n.id}">
      <span><i class="fas fa-user me-2"></i>${escapeHTML(n.nombreCompleto)}</span>
      <button class="btn btn-sm btn-danger eliminar-btn" data-id="${n.id}">✖</button>
    </div>
  `).join('');
  document.querySelectorAll('.eliminar-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.id);
      eliminarPersona(id);
      actualizarTodo();
      mostrarMensaje('Persona eliminada', 'danger');
    });
  });
}

function renderizarPersonas() {
  const container = document.getElementById('listaPersonas');
  const contador = document.getElementById('contadorPersonas');
  const personas = cargarPersonas();
  contador.textContent = `(${personas.length})`;
  if (personas.length === 0) {
    container.innerHTML = '<p class="text-muted">No hay personas aún</p>';
    return;
  }
  container.innerHTML = personas.map(p => `
    <div class="persona-card">
      <h6>${escapeHTML(p.nombre)} ${escapeHTML(p.apellido)}</h6>
      <p><strong>📄 Doc:</strong> ${escapeHTML(p.documento)}</p>
      <p><strong>🎂 Edad:</strong> ${p.edad} | ${p.fechaNac}</p>
      <p><strong>⚥ ${p.sexo}</strong> | 💍 ${p.estadoCivil}</p>
      <p><strong>🌍 ${escapeHTML(p.nacionalidad)}</strong></p>
      <p><strong>📞 ${escapeHTML(p.telefono)}</strong></p>
      <p><strong>✉️ ${escapeHTML(p.email)}</strong></p>
      <p><strong>👶 Hijos:</strong> ${p.tieneHijos === '1' ? p.cantidadHijos : 0}</p>
      <button class="btn btn-sm btn-outline-danger eliminar-card" data-id="${p.id}">Eliminar</button>
    </div>
  `).join('');
  document.querySelectorAll('.eliminar-card').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      eliminarPersona(id);
      actualizarTodo();
      mostrarMensaje('Persona eliminada', 'danger');
    });
  });
}

function actualizarTodo() {
  renderizarListaNombres();
  renderizarPersonas();
}

function toggleHijos() {
  const tieneHijos = document.getElementById('tieneHijos').value;
  const container = document.getElementById('hijosContainer');
  container.style.display = tieneHijos === '1' ? 'block' : 'none';
}

function calcularEdadDesdeFecha(fechaNac) {
  if (!fechaNac) return null;
  const hoy = new Date();
  const nac = new Date(fechaNac);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const mes = hoy.getMonth() - nac.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

// Validación en tiempo real (filtros)
function setupRealTimeValidation() {
  const telefonoInput = document.getElementById('telefono');
  telefonoInput.addEventListener('input', function(e) {
    this.value = this.value.replace(/[^0-9+]/g, '');
    if (this.value.indexOf('+') > 0) this.value = this.value.replace(/\+/g, '');
    if (this.value.split('+').length > 2) this.value = this.value.slice(0, this.value.lastIndexOf('+'));
  });

  const nombreInput = document.getElementById('nombre');
  nombreInput.addEventListener('input', function(e) {
    this.value = this.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, '');
  });

  const apellidoInput = document.getElementById('apellido');
  apellidoInput.addEventListener('input', function(e) {
    this.value = this.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, '');
  });

  const documentoInput = document.getElementById('documento');
  documentoInput.addEventListener('input', function(e) {
    this.value = this.value.replace(/[^A-Za-z0-9]/g, '');
  });

  const nacionalidadInput = document.getElementById('nacionalidad');
  nacionalidadInput.addEventListener('input', function(e) {
    this.value = this.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, '');
  });
}

// Agregar leyenda de ayuda (sin alert)
function agregarLeyendaAyuda() {
  const ayudaHTML = `
    <div class="help-legend mt-3">
      <i class="fas fa-info-circle"></i> <strong>Ayuda rápida:</strong><br>
      • Complete todos los campos marcados con *.<br>
      • Teléfono: solo números (opcional + al inicio).<br>
      • Email: debe ser válido (ej: nombre@dominio.com).<br>
      • Documento: entre 5 y 15 caracteres alfanuméricos.<br>
      • Fecha de nacimiento no puede ser futura.<br>
      • Los mensajes de error/success aparecen aquí abajo.
    </div>
  `;
  const mensajeDiv = document.getElementById('mensaje');
  if (mensajeDiv && !document.querySelector('.help-legend')) {
    mensajeDiv.insertAdjacentHTML('afterend', ayudaHTML);
  }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupRealTimeValidation();
  agregarLeyendaAyuda();

  document.getElementById('tieneHijos').addEventListener('change', toggleHijos);
  document.getElementById('fechaNac').addEventListener('change', (e) => {
    const edad = calcularEdadDesdeFecha(e.target.value);
    if (edad !== null && !isNaN(edad)) document.getElementById('edad').value = edad;
  });

  document.getElementById('personaForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const tieneHijos = document.getElementById('tieneHijos').value;
    const cantidadHijos = tieneHijos === '1' ? parseInt(document.getElementById('cantidadHijos').value) || 0 : 0;

    const personaData = {
      nombre: document.getElementById('nombre').value.trim(),
      apellido: document.getElementById('apellido').value.trim(),
      edad: parseInt(document.getElementById('edad').value),
      fechaNac: document.getElementById('fechaNac').value,
      sexo: document.getElementById('sexo').value,
      documento: document.getElementById('documento').value.trim(),
      estadoCivil: document.getElementById('estadoCivil').value,
      nacionalidad: document.getElementById('nacionalidad').value.trim(),
      telefono: document.getElementById('telefono').value.trim(),
      email: document.getElementById('email').value.trim(),
      tieneHijos: tieneHijos,
      cantidadHijos: cantidadHijos
    };

    const { valido, errores } = validarPersona(personaData);
    if (!valido) {
      mostrarMensaje(`❌ ${errores.join(' • ')}`, 'danger');
      return;
    }

    guardarPersona(personaData);
    actualizarTodo();
    mostrarMensaje(`✅ Persona ${personaData.nombre} ${personaData.apellido} guardada correctamente`, 'success');
    document.getElementById('personaForm').reset();
    document.getElementById('hijosContainer').style.display = 'none';
  });

  document.getElementById('btnExportar').addEventListener('click', () => {
    const personas = cargarPersonas();
    console.table(personas);
    mostrarMensaje(`📋 Exportadas ${personas.length} personas a la consola (F12)`, 'info');
  });

  actualizarTodo();
});