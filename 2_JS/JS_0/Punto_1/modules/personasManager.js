/**
 * ARCHIVO: personasManager.js
 * PROPÓSITO: Almacenar, agregar, eliminar y renderizar personas.
 * MÓDULOS: validaciones.js
 */

import { mostrarMensaje, validarEmail, validarTelefono, validarDocumento, calcularEdad, validarFechaNacimiento } from './validaciones.js';

// Array principal de personas (cada persona es un objeto)
let personas = [];

// Referencias al DOM
let listaNombresDiv;
let listaPersonasDiv;
let contadorSpan;

// Inicializar referencias (se llama desde main.js)
export function initPersonasManager() {
    listaNombresDiv = document.getElementById('listaNombres');
    listaPersonasDiv = document.getElementById('listaPersonas');
    contadorSpan = document.getElementById('contadorPersonas');
    renderizarTodo();
}

// Obtener todas las personas (para exportar)
export function obtenerPersonas() {
    return [...personas];
}

// Agregar nueva persona (validando)
export function agregarPersona(datos) {
    // Validaciones
    if (!datos.nombre || !datos.apellido || !datos.fechaNac || !datos.sexo || !datos.documento || !datos.estadoCivil || !datos.nacionalidad || !datos.telefono || !datos.email) {
        mostrarMensaje('formMessages', 'Todos los campos marcados con * son obligatorios.', 'danger');
        return false;
    }
    
    if (!validarEmail(datos.email)) {
        mostrarMensaje('formMessages', 'El email no es válido.', 'danger');
        return false;
    }
    
    if (!validarTelefono(datos.telefono)) {
        mostrarMensaje('formMessages', 'El teléfono debe tener al menos 7 dígitos.', 'danger');
        return false;
    }
    
    if (!validarDocumento(datos.documento)) {
        mostrarMensaje('formMessages', 'El documento debe tener entre 7 y 10 dígitos numéricos.', 'danger');
        return false;
    }
    
    if (!validarFechaNacimiento(datos.fechaNac)) {
        mostrarMensaje('formMessages', 'La fecha de nacimiento no puede ser futura.', 'danger');
        return false;
    }
    
    // Calcular edad automáticamente
    const edad = calcularEdad(datos.fechaNac);
    if (edad < 0 || edad > 120) {
        mostrarMensaje('formMessages', 'Edad no válida (debe ser entre 0 y 120 años).', 'danger');
        return false;
    }
    
    // Verificar que el documento no esté duplicado
    const existe = personas.some(p => p.documento === datos.documento);
    if (existe) {
        mostrarMensaje('formMessages', 'Ya existe una persona con ese documento.', 'danger');
        return false;
    }
    
    // Crear objeto persona
    const nuevaPersona = {
        id: Date.now(),
        nombre: datos.nombre.trim(),
        apellido: datos.apellido.trim(),
        edad: edad,
        fechaNac: datos.fechaNac,
        sexo: datos.sexo,
        documento: datos.documento.trim(),
        estadoCivil: datos.estadoCivil,
        nacionalidad: datos.nacionalidad.trim(),
        telefono: datos.telefono.trim(),
        email: datos.email.trim(),
        tieneHijos: datos.tieneHijos === '1',
        cantidadHijos: datos.tieneHijos === '1' ? parseInt(datos.cantidadHijos) || 0 : 0
    };
    
    personas.push(nuevaPersona);
    renderizarTodo();
    mostrarMensaje('formMessages', `✅ ${nuevaPersona.nombre} ${nuevaPersona.apellido} registrado correctamente.`, 'success');
    return true;
}

// Eliminar persona por ID
export function eliminarPersona(id) {
    const index = personas.findIndex(p => p.id === id);
    if (index !== -1) {
        const eliminada = personas[index];
        personas.splice(index, 1);
        renderizarTodo();
        mostrarMensaje('formMessages', `🗑️ Se eliminó a ${eliminada.nombre} ${eliminada.apellido}.`, 'info');
    }
}

// Renderizar listado de nombres (columna derecha) y tarjetas horizontales
function renderizarTodo() {
    // Actualizar contador
    if (contadorSpan) contadorSpan.textContent = `(${personas.length})`;
    
    // Renderizar lista de nombres (con click para mostrar detalles)
    if (listaNombresDiv) {
        if (personas.length === 0) {
            listaNombresDiv.innerHTML = '<p class="text-muted">No hay personas registradas</p>';
        } else {
            let html = '';
            personas.forEach(p => {
                html += `
                    <div class="nombre-item" data-id="${p.id}">
                        <span><strong>${p.apellido}, ${p.nombre}</strong> (${p.edad} años)</span>
                        <i class="fas fa-trash-alt text-danger eliminar-icono" data-id="${p.id}" style="cursor:pointer;"></i>
                    </div>
                `;
            });
            listaNombresDiv.innerHTML = html;
            
            // Eventos para eliminar (delegación)
            listaNombresDiv.querySelectorAll('.eliminar-icono').forEach(icon => {
                icon.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = parseInt(icon.getAttribute('data-id'));
                    eliminarPersona(id);
                });
            });
            // Evento para mostrar alerta con detalles al hacer clic en el nombre
            listaNombresDiv.querySelectorAll('.nombre-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    if (e.target.classList.contains('eliminar-icono')) return;
                    const id = parseInt(item.getAttribute('data-id'));
                    const persona = personas.find(p => p.id === id);
                    if (persona) {
                        const detalle = `📌 ${persona.nombre} ${persona.apellido}\n📄 Documento: ${persona.documento}\n📞 Teléfono: ${persona.telefono}\n📧 Email: ${persona.email}\n👶 Hijos: ${persona.cantidadHijos}`;
                        mostrarMensaje('formMessages', detalle.replace(/\n/g, '<br>'), 'info');
                    }
                });
            });
        }
    }
    
    // Renderizar tarjetas horizontales (todos los datos)
    if (listaPersonasDiv) {
        if (personas.length === 0) {
            listaPersonasDiv.innerHTML = '<p class="text-muted">No hay personas aún</p>';
        } else {
            let html = '';
            personas.forEach(p => {
                html += `
                    <div class="persona-card">
                        <h6><i class="fas fa-user"></i> ${p.nombre} ${p.apellido}</h6>
                        <p><i class="fas fa-calendar-alt"></i> Edad: ${p.edad} años</p>
                        <p><i class="fas fa-venus-mars"></i> Sexo: ${p.sexo}</p>
                        <p><i class="fas fa-id-card"></i> Doc: ${p.documento}</p>
                        <p><i class="fas fa-heart"></i> Estado: ${p.estadoCivil}</p>
                        <p><i class="fas fa-globe"></i> Nacionalidad: ${p.nacionalidad}</p>
                        <p><i class="fas fa-phone"></i> ${p.telefono}</p>
                        <p><i class="fas fa-envelope"></i> ${p.email}</p>
                        <p><i class="fas fa-child"></i> Hijos: ${p.cantidadHijos}</p>
                        <button class="btn btn-sm btn-danger mt-2 eliminar-tarjeta" data-id="${p.id}">Eliminar</button>
                    </div>
                `;
            });
            listaPersonasDiv.innerHTML = html;
            // Eventos para eliminar desde tarjetas
            document.querySelectorAll('.eliminar-tarjeta').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = parseInt(btn.getAttribute('data-id'));
                    eliminarPersona(id);
                });
            });
        }
    }
}

// Exportar a consola
export function exportarDatos() {
    console.log('=== DATOS DE PERSONAS ===');
    console.log(JSON.parse(JSON.stringify(personas)));
    mostrarMensaje('formMessages', `📁 Se exportaron ${personas.length} registros a la consola.`, 'success');
}