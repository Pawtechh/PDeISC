/**
 * ARCHIVO: main.js
 * PROPÓSITO: Inicializar módulos, configurar eventos y botón volver arriba.
 * MÓDULOS: theme, alertas, arraysManager
 */

import { initTheme } from '../modules/theme.js';
import { initAlertContainer, mostrarAlerta } from '../modules/alertas.js';
import { 
    initArrays, 
    popAnimal, resetAnimales, agregarAnimal,
    popCompra, resetCompras, agregarProducto,
    agregarNumero, popNumero, vaciarConWhile, resetNumeros
} from '../modules/arraysManager.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializar contenedor de alertas
    initAlertContainer();
    
    // 2. Inicializar temas
    initTheme();
    
    // 3. Inicializar arrays y vistas
    initArrays();
    
    // 4. Botón volver arriba
    const scrollBtn = document.getElementById('scrollTopBtn');
    if (scrollBtn) {
        window.addEventListener('scroll', () => {
            scrollBtn.style.display = window.scrollY > 300 ? 'flex' : 'none';
        });
        scrollBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    // 5. Eventos de animales
    document.getElementById('popAnimalBtn')?.addEventListener('click', popAnimal);
    document.getElementById('resetAnimalesBtn')?.addEventListener('click', resetAnimales);
    const pushAnimalBtn = document.getElementById('pushAnimalBtn');
    const nuevoAnimalInput = document.getElementById('nuevoAnimal');
    if (pushAnimalBtn && nuevoAnimalInput) {
        pushAnimalBtn.addEventListener('click', () => {
            agregarAnimal(nuevoAnimalInput.value);
            nuevoAnimalInput.value = '';
        });
        nuevoAnimalInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                agregarAnimal(nuevoAnimalInput.value);
                nuevoAnimalInput.value = '';
            }
        });
    }
    
    // 6. Eventos de compras
    document.getElementById('popCompraBtn')?.addEventListener('click', popCompra);
    document.getElementById('resetComprasBtn')?.addEventListener('click', resetCompras);
    const pushProductoBtn = document.getElementById('pushProductoBtn');
    const nuevoProductoInput = document.getElementById('nuevoProducto');
    if (pushProductoBtn && nuevoProductoInput) {
        pushProductoBtn.addEventListener('click', () => {
            agregarProducto(nuevoProductoInput.value);
            nuevoProductoInput.value = '';
        });
        nuevoProductoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                agregarProducto(nuevoProductoInput.value);
                nuevoProductoInput.value = '';
            }
        });
    }
    
    // 7. Eventos de números
    document.getElementById('popNumeroBtn')?.addEventListener('click', popNumero);
    document.getElementById('vaciarWhileBtn')?.addEventListener('click', vaciarConWhile);
    document.getElementById('resetVaciadoBtn')?.addEventListener('click', resetNumeros);
    const pushNumeroBtn = document.getElementById('pushNumeroBtn');
    const nuevoNumeroInput = document.getElementById('nuevoNumeroManual');
    if (pushNumeroBtn && nuevoNumeroInput) {
        pushNumeroBtn.addEventListener('click', () => {
            agregarNumero(nuevoNumeroInput.value);
            nuevoNumeroInput.value = '';
        });
        nuevoNumeroInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                agregarNumero(nuevoNumeroInput.value);
                nuevoNumeroInput.value = '';
            }
        });
    }
});