/**
 * ARCHIVO: main.js
 * PROPÓSITO: Inicializar módulos y eventos del formulario.
 * MÓDULOS: theme, personasManager, validaciones
 */

import { initTheme } from '../modules/theme.js';
import { initPersonasManager, agregarPersona, exportarDatos } from '../modules/personasManager.js';
import { mostrarMensaje, calcularEdad } from '../modules/validaciones.js';

// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializar tema (modo claro/oscuro)
    initTheme();
    
    // 2. Inicializar gestor de personas (referencias internas)
    initPersonasManager();
    
    // 3. Configurar el botón volver arriba
    const scrollBtn = document.getElementById('scrollTopBtn');
    if (scrollBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                scrollBtn.style.display = 'flex';
            } else {
                scrollBtn.style.display = 'none';
            }
        });
        scrollBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    // 4. Configurar el campo fecha de nacimiento: calcular edad automáticamente y actualizar campo readonly
    const fechaNacInput = document.getElementById('fechaNac');
    const edadInput = document.getElementById('edad');
    if (fechaNacInput && edadInput) {
        fechaNacInput.addEventListener('change', () => {
            if (fechaNacInput.value) {
                const edad = calcularEdad(fechaNacInput.value);
                if (!isNaN(edad) && edad >= 0 && edad <= 120) {
                    edadInput.value = edad;
                } else {
                    edadInput.value = '';
                }
            } else {
                edadInput.value = '';
            }
        });
    }
    
    // 5. Mostrar/ocultar campo cantidad de hijos según selección
    const tieneHijosSelect = document.getElementById('tieneHijos');
    const hijosContainer = document.getElementById('hijosContainer');
    if (tieneHijosSelect && hijosContainer) {
        tieneHijosSelect.addEventListener('change', () => {
            if (tieneHijosSelect.value === '1') {
                hijosContainer.style.display = 'block';
            } else {
                hijosContainer.style.display = 'none';
                document.getElementById('cantidadHijos').value = '0';
            }
        });
        // Estado inicial
        if (tieneHijosSelect.value === '1') hijosContainer.style.display = 'block';
        else hijosContainer.style.display = 'none';
    }
    
    // 6. Envío del formulario
    const form = document.getElementById('personaForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Recoger datos del formulario
            const datos = {
                nombre: document.getElementById('nombre').value,
                apellido: document.getElementById('apellido').value,
                fechaNac: document.getElementById('fechaNac').value,
                sexo: document.getElementById('sexo').value,
                documento: document.getElementById('documento').value,
                estadoCivil: document.getElementById('estadoCivil').value,
                nacionalidad: document.getElementById('nacionalidad').value,
                telefono: document.getElementById('telefono').value,
                email: document.getElementById('email').value,
                tieneHijos: document.getElementById('tieneHijos').value,
                cantidadHijos: document.getElementById('cantidadHijos').value
            };
            
            // Validar que sexo no esté vacío
            if (!datos.sexo) {
                mostrarMensaje('formMessages', 'Debe seleccionar un sexo.', 'danger');
                return;
            }
            
            // Intentar agregar persona
            const exito = agregarPersona(datos);
            if (exito) {
                form.reset();
                // Restablecer campos secundarios
                document.getElementById('hijosContainer').style.display = 'none';
                document.getElementById('tieneHijos').value = '0';
                document.getElementById('edad').value = '';
                // Forzar recalcular edad si se vuelve a llenar fecha
            }
        });
    }
    
    // 7. Botón exportar
    const btnExportar = document.getElementById('btnExportar');
    if (btnExportar) {
        btnExportar.addEventListener('click', exportarDatos);
    }
});