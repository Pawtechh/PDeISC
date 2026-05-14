import { toggleTheme } from './themes.js';

const form = document.getElementById('uploadForm');
const themeButton = document.getElementById('themeButton');

const usefulList = document.getElementById('usefulList');
const factorialList = document.getElementById('factorialList');

const usefulCount = document.getElementById('usefulCount');
const uselessCount = document.getElementById('uselessCount');
const percentage = document.getElementById('percentage');

const message = document.getElementById('message');

themeButton.addEventListener('click', toggleTheme);

form.addEventListener('submit', async (e) => {

    e.preventDefault();

    const fileInput = document.getElementById('txtFile');

    const formData = new FormData();

    formData.append('txtFile', fileInput.files[0]);

    const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
    });

    const data = await response.json();

    usefulList.innerHTML = '';
    factorialList.innerHTML = '';

    if (!data.success) {

        message.innerHTML = data.message;
        return;
    }

    message.innerHTML = 'Archivo procesado correctamente';

    data.usefulNumbers.forEach(number => {

        const li = document.createElement('li');
        li.textContent = number;
        usefulList.appendChild(li);
    });

    data.factorialNumbers.forEach(number => {

        const li = document.createElement('li');
        li.textContent = number;
        factorialList.appendChild(li);
    });

    usefulCount.innerHTML = `Cantidad útiles: ${data.usefulCount}`;
    uselessCount.innerHTML = `Cantidad no útiles: ${data.uselessCount}`;
    percentage.innerHTML = `Porcentaje útiles: ${data.percentage}%`;

});