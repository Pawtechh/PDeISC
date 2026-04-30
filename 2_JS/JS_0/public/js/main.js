import * as logica from './logica.js';

const punto = parseInt(window.location.pathname.replace('/punto', '')) || 1;
const contenedor = document.getElementById('contenedor-menues');
document.getElementById('titulo-ejercicio').innerText = `Ejercicio ${punto}`;

const textos = {
    1: ["3 Frutas exactas (DB Google).", "Array de 3 amigos.", "Solo números mayores al anterior."],
    2: ["Animales por coma. Pop borra el último.", "Lista de compras. Pop saca el último.", "Vaciado con While y Pop."],
    3: ["3 Colores al inicio.", "Tareas normales y botón de URGENTE.", "Usuarios conectados al principio."],
    5: ["Borrando letras desde pos 1.", "Nombre 4to va a la 2da posición.", "Reemplazo de 2 elementos."],
    6: ["Copia de 3 primeros (de 10).", "Copia de pelis (pos 2 a 4).", "Últimos 3 elementos (de 8)."],
    14: ["Invertir palabra (máx 25).", "Invertir orden de 10 números.", "Invertir palabras de una frase."]
};

for (let i = 1; i <= 3; i++) {
    const div = document.createElement('div');
    div.className = "menu-box";
    const localArray = [];

    div.innerHTML = `
        <h3>Menú N° ${i}</h3>
        <p class="leyenda">⚠️ ${textos[punto] ? textos[punto][i-1] : "Cargando restricciones..."}</p>
        <div class="monitor">[ ]</div>
        <input type="text" id="in-${i}" placeholder="Escribí acá...">
        <button id="btn-${i}">Ejecutar</button>
        ${(punto === 3 && i === 2) ? `<button id="btn-u" style="background:red">URGENTE</button>` : ""}
        <p id="res-${i}" class="status"></p>
    `;
    contenedor.appendChild(div);

    const btn = div.querySelector(`#btn-${i}`);
    const input = div.querySelector(`#in-${i}`);
    const monitor = div.querySelector(`.monitor`);
    const status = div.querySelector(`.status`);

    const f = (extra = null) => {
        const r = logica.ejecutar(punto, i, localArray, input.value, extra);
        if (r.err) { status.innerText = "❌ " + r.err; status.style.color = "red"; }
        else {
            monitor.innerText = JSON.stringify(localArray);
            status.innerText = "✅ " + r.msg; status.style.color = "#00ff41";
            input.value = "";
        }
    };

    btn.onclick = () => f();
    if (div.querySelector('#btn-u')) div.querySelector('#btn-u').onclick = () => f('urgente');
}