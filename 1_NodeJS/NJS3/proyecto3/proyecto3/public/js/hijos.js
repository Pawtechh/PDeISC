const btnAgregar = document.getElementById('btn-agregar');
const btnContar = document.getElementById('btn-contar');
const padre = document.getElementById('contenedor-padre');
const resultado = document.getElementById('resultado');

// EVENTO PARA AGREGAR: Crea un nuevo "hijo" dinámicamente
btnAgregar.onclick = () => {
    const nuevoHijo = document.createElement('div');
    nuevoHijo.className = 'hijo';
    nuevoHijo.innerText = 'Hijo ' + (padre.childElementCount + 1);
    
    padre.appendChild(nuevoHijo);
    
    resultado.innerText = '¡Hijo añadido!';
    resultado.style.color = '#3498db';
};

// EVENTO DE PULSADO (CONSIGNA PUNTO 3): Cuenta los hijos actuales
btnContar.onclick = () => {
    // Usamos la propiedad childElementCount para obtener el número de etiquetas dentro del padre
    const cantidad = padre.childElementCount;
    
    resultado.innerText = `El contenedor tiene ${cantidad} hijos directos.`;
    resultado.style.color = '#27ae60';
    
    console.log("Análisis de nodos completado. Total:", cantidad);
};