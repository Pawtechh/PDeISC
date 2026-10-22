/**
 * main.js
 * Sube el archivo .txt, muestra resultados (útiles / factoriales),
 * permite descargar el archivo filtrado, maneja tema y botón "volver arriba".
 */

const $ = (id) => document.getElementById(id);
const html = document.documentElement;

const form            = $('uploadForm');
const archivoInput    = $('archivoTxt');
const feedbackDiv     = $('feedback');
const resultadosPanel = $('resultadosPanel');
const totalSpan       = $('total');
const utilesSpan      = $('utiles');
const noUtilesSpan    = $('noUtiles');
const porcentajeSpan  = $('porcentaje');
const listaUtilesDiv  = $('listaUtiles');
const btnDescargar    = $('btnDescargar');
const btnTema         = $('btnTema');
const backToTop       = $('backToTop');
const toast           = $('toast');

let nombreArchivoActual = null;

function mostrarFeedback(mensaje, esError = false) {
    feedbackDiv.textContent = mensaje;
    feedbackDiv.style.borderLeftColor = esError ? 'var(--acc2)' : 'var(--acc)';
    setTimeout(() => {
        if (feedbackDiv.textContent === mensaje) feedbackDiv.textContent = '';
    }, 5000);
}

let tt;
function mostrarToast(m) {
    toast.textContent = m;
    toast.classList.add('on');
    clearTimeout(tt);
    tt = setTimeout(() => toast.classList.remove('on'), 2800);
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!archivoInput.files.length) {
        mostrarFeedback('Seleccioná un archivo .txt', true);
        return;
    }
    const file = archivoInput.files[0];
    if (!file.name.endsWith('.txt')) {
        mostrarFeedback('Solo se permiten archivos .txt', true);
        return;
    }

    const formData = new FormData();
    formData.append('archivoTxt', file);

    mostrarFeedback('Procesando archivo...');
    try {
        const response = await fetch('/procesar', { method: 'POST', body: formData });
        const data = await response.json();
        if (!response.ok || data.success === false) {
            throw new Error(data.error || data.message || 'Error al procesar');
        }

        totalSpan.textContent = data.total;
        utilesSpan.textContent = data.cantidadUtiles;
        noUtilesSpan.textContent = data.cantidadNoUtiles;
        porcentajeSpan.textContent = data.porcentajeUtiles + '%';

        listaUtilesDiv.innerHTML = '';
        if (data.utilesOrdenados.length === 0) {
            listaUtilesDiv.innerHTML = '<span class="ehint">No se encontraron números útiles.</span>';
        } else {
            data.utilesOrdenados.forEach(num => {
                const chip = document.createElement('span');
                const esFact = data.factoriales.includes(num);
                chip.className = 'num-chip' + (esFact ? ' factorial' : '');
                chip.textContent = num;
                listaUtilesDiv.appendChild(chip);
            });
        }

        nombreArchivoActual = data.nombreArchivo;
        resultadosPanel.style.display = 'block';
        mostrarFeedback(`Archivo procesado. Resultado guardado en el servidor como "${nombreArchivoActual}".`);
        mostrarToast('✓ Archivo procesado');
        resultadosPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (err) {
        console.error(err);
        mostrarFeedback(err.message, true);
    }
});

btnDescargar.addEventListener('click', () => {
    if (!nombreArchivoActual) {
        mostrarFeedback('No hay archivo para descargar', true);
        return;
    }
    window.location.href = `/descargar/${encodeURIComponent(nombreArchivoActual)}`;
    mostrarFeedback('Descarga iniciada.');
    mostrarToast('✓ Descarga iniciada');
});

// Tema claro/oscuro
function inicializarTema() {
    const tema = localStorage.getItem('tema');
    html.dataset.theme = (tema === 'claro') ? 'light' : 'dark';
}
function toggleTema() {
    const esOscuro = html.dataset.theme === 'dark';
    html.dataset.theme = esOscuro ? 'light' : 'dark';
    localStorage.setItem('tema', esOscuro ? 'claro' : 'oscuro');
}
btnTema.addEventListener('click', toggleTema);

// Botón volver arriba
window.addEventListener('scroll', () => {
    backToTop.classList.toggle('show', window.scrollY > 300);
});
backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

inicializarTema();
