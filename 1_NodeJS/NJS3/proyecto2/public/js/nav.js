const contenedor = document.getElementById('contenedor');

// 1. 🕐 RELOJ
document.getElementById('btn1').onclick = () => {
  contenedor.innerHTML = `
    <h3>| Reloj</h3>
    <p id="reloj"></p>
  `;
  const reloj = document.getElementById('reloj');
  setInterval(() => {
    const ahora = new Date();
    reloj.textContent = ahora.toLocaleTimeString();
  }, 1000);
};

// 2. 🔢 CONTADOR
document.getElementById('btn2').onclick = () => {
  contenedor.innerHTML = `
    <h3>| Contador</h3>
    <button id="sumar">+1</button>
    <p id="valor">0</p>
  `;
  let valor = 0;
  document.getElementById('sumar').onclick = () => {
    valor++;
    document.getElementById('valor').textContent = valor;
  };
};

// 3. 🖱️ MOUSE
document.getElementById('btn3').onclick = () => {
  contenedor.innerHTML = `
    <h3>| Mouse</h3>
    <p id="coords">Mové el mouse aquí adentro...</p>
  `;
  contenedor.onmousemove = (e) => {
    document.getElementById('coords').textContent = `X: ${e.offsetX} | Y: ${e.offsetY}`;
  };
};

// 4. ⌨️ TECLADO
document.getElementById('btn4').onclick = () => {
  contenedor.innerHTML = `
    <h3>| Teclado</h3>
    <input type="text" id="inputTeclado" placeholder="Escribí algo..."/>
    <p id="texto"></p>
  `;
  document.getElementById('inputTeclado').oninput = (e) => {
    document.getElementById('texto').textContent = e.target.value;
  };
};

// 5. 📂 ACORDEÓN
document.getElementById('btn5').onclick = () => {
  contenedor.innerHTML = `
    <h3>| Acordeón</h3>
    <button id="toggle">Mostrar / Ocultar</button>
    <p id="contenidoAcordeon" style="display:none; margin-top:10px; background:#f9f9f9; padding:10px;">
      Este es el contenido que estaba oculto.
    </p>
  `;
  const contenidoAcordeon = document.getElementById('contenidoAcordeon');
  document.getElementById('toggle').onclick = () => {
    contenidoAcordeon.style.display = contenidoAcordeon.style.display === 'none' ? 'block' : 'none';
  };
};

// 6. 🔍 PUNTO 3: CONTAR HIJOS
document.getElementById('btn-punto3').onclick = () => {
  // Inyectamos contenido con varios elementos para poder contarlos
  contenedor.innerHTML = `
    <h3>🔍 Punto 3: Estructura de Hijos</h3>
    <p>Al pulsar el botón de abajo, contaremos cuántas etiquetas hay dentro de este recuadro gris.</p>
    <ul>
      <li>Hijo 1 (Lista)</li>
      <li>Hijo 2 (Lista)</li>
    </ul>
    <button id="ejecutar-conteo">PULSAR PARA VER TOTAL DE HIJOS</button>
    <p id="resultado-conteo" style="font-weight:bold; color: green; margin-top:15px;"></p>
  `;

  // Evento de pulsado solicitado en la consigna
  document.getElementById('ejecutar-conteo').onclick = () => {
    // .childElementCount cuenta los elementos HTML directos (h3, p, ul, button, p)
    const totalHijos = contenedor.childElementCount;
    document.getElementById('resultado-conteo').textContent = `El contenedor tiene actualmente ${totalHijos} hijos directos.`;
  };
};