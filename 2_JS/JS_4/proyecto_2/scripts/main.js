/**
 * main.js
 * Controla la subida del archivo, muestra resultados y permite descargar el archivo procesado.
 */

const form = document.getElementById('uploadForm');
const archivoInput = document.getElementById('archivoTxt');
const feedbackDiv = document.getElementById('feedback');
const resultadosPanel = document.getElementById('resultadosPanel');
const totalSpan = document.getElementById('total');
const utilesSpan = document.getElementById('utiles');
const noUtilesSpan = document.getElementById('noUtiles');
const porcentajeSpan = document.getElementById('porcentaje');
const listaUtilesDiv = document.getElementById('listaUtiles');
const btnDescargar = document.getElementById('btnDescargar');
const btnTema = document.getElementById('btnTema');

let nombreArchivoActual = null;

function mostrarFeedback(mensaje, esError = false) {
    feedbackDiv.textContent = mensaje;
    feedbackDiv.style.borderLeftColor = esError ? '#ef4444' : '#10b981';
    setTimeout(() => {
        if (feedbackDiv.textContent === mensaje) feedbackDiv.textContent = '';
    }, 5000);
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!archivoInput.files.length) {
        mostrarFeedback('Seleccione un archivo .txt', true);
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
        const response = await fetch('/procesar', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Error al procesar');
        }

        // Actualizar vista
        totalSpan.textContent = data.total;
        utilesSpan.textContent = data.cantidadUtiles;
        noUtilesSpan.textContent = data.cantidadNoUtiles;
        porcentajeSpan.textContent = data.porcentajeUtiles;

        // Mostrar lista ordenada
        listaUtilesDiv.innerHTML = '';
        if (data.utilesOrdenados.length === 0) {
            listaUtilesDiv.innerHTML = '<p>No se encontraron números útiles.</p>';
        } else {
            data.utilesOrdenados.forEach(num => {
                const span = document.createElement('span');
                span.textContent = num;
                listaUtilesDiv.appendChild(span);
            });
        }

        nombreArchivoActual = data.nombreArchivo;
        resultadosPanel.style.display = 'block';
        mostrarFeedback(`Archivo procesado. El servidor sobrescribió "${nombreArchivoActual}" con el resultado filtrado.`);
    } catch (err) {
        console.error(err);
        mostrarFeedback(err.message, true);
    }
});

btnDescargar.addEventListener('click', async () => {
    if (!nombreArchivoActual) {
        mostrarFeedback('No hay archivo para descargar', true);
        return;
    }
    try {
        // Descargar el archivo procesado desde el servidor
        window.location.href = `/descargar/${encodeURIComponent(nombreArchivoActual)}`;
        mostrarFeedback('Descarga iniciada. El archivo contiene los números útiles ordenados.');
    } catch (err) {
        mostrarFeedback('Error al descargar', true);
    }
});

// Tema claro/oscuro
function inicializarTema() {
    const tema = localStorage.getItem('tema');
    if (tema === 'oscuro') {
        document.documentElement.classList.add('tema-oscuro');
        btnTema.textContent = '☀️ Modo claro';
    } else {
        btnTema.textContent = '🌙 Modo oscuro';
    }
}
function toggleTema() {
    if (document.documentElement.classList.contains('tema-oscuro')) {
        document.documentElement.classList.remove('tema-oscuro');
        localStorage.setItem('tema', 'claro');
        btnTema.textContent = '🌙 Modo oscuro';
    } else {
        document.documentElement.classList.add('tema-oscuro');
        localStorage.setItem('tema', 'oscuro');
        btnTema.textContent = '☀️ Modo claro';
    }
}
btnTema.addEventListener('click', toggleTema);
inicializarTema();