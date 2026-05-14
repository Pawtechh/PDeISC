import { toggleTheme } from './themes.js';

const form = document.getElementById('uploadForm');
const themeButton = document.getElementById('themeButton');

const usefulList = document.getElementById('usefulList');
const factorialList = document.getElementById('factorialList');

const usefulCount = document.getElementById('usefulCount');
const uselessCount = document.getElementById('uselessCount');
const percentage = document.getElementById('percentage');
const progressBar = document.getElementById('progressBar');
const badgeUseful = document.getElementById('badgeUseful');
const badgeFactorial = document.getElementById('badgeFactorial');
const resultsSection = document.getElementById('resultsSection');

const message = document.getElementById('message');

themeButton.addEventListener('click', () => {
    toggleTheme();
    const isDark = document.body.classList.contains('dark');
    themeButton.innerHTML = isDark
        ? '<i class="bi bi-sun-fill me-1"></i>Modo Claro'
        : '<i class="bi bi-moon-fill me-1"></i>Modo Oscuro';
});

form.addEventListener('submit', async (e) => {

    e.preventDefault();

    const fileInput = document.getElementById('txtFile');
    const formData = new FormData();
    formData.append('txtFile', fileInput.files[0]);

    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Procesando...';

    message.className = 'mt-3 fw-semibold text-center';
    message.classList.remove('d-none');

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        usefulList.innerHTML = '';
        factorialList.innerHTML = '';

        if (!data.success) {
            message.innerHTML = `<i class="bi bi-exclamation-triangle me-2"></i>${data.message}`;
            message.className = 'mt-3 fw-semibold text-center text-danger';
            resultsSection.style.display = 'none';
            return;
        }

        message.innerHTML = `<i class="bi bi-check-circle me-2"></i>Archivo procesado correctamente`;
        message.className = 'mt-3 fw-semibold text-center text-success';

        // Show results section
        resultsSection.style.removeProperty('display');

        data.usefulNumbers.forEach(number => {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.textContent = number;
            usefulList.appendChild(li);
        });

        data.factorialNumbers.forEach(number => {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.textContent = number;
            factorialList.appendChild(li);
        });

        badgeUseful.textContent = data.usefulCount;
        badgeFactorial.textContent = data.factorialNumbers.length;

        usefulCount.textContent = data.usefulCount;
        uselessCount.textContent = data.uselessCount;
        percentage.textContent = `${data.percentage}%`;
        progressBar.style.width = `${data.percentage}%`;
        progressBar.setAttribute('aria-valuenow', data.percentage);

    } catch (err) {
        message.innerHTML = `<i class="bi bi-exclamation-triangle me-2"></i>Error al conectar con el servidor`;
        message.className = 'mt-3 fw-semibold text-center text-danger';
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-cpu me-2"></i>Procesar Archivo';
    }
});
