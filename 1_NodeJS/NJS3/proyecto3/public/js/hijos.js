import { crearNavItem } from './navItem.js';

const area = document.getElementById('area-nav');
const resultado = document.getElementById('resultado');

const componentes = [
  { id: 'btnReloj',    label: '🕐 Reloj',    url: 'http://localhost:3002/comp/reloj' },
  { id: 'btnContador', label: '🔢 Contador', url: 'http://localhost:3002/comp/contador' },
  { id: 'btnMouse',    label: '🖱️ Mouse',    url: 'http://localhost:3002/comp/mouse' },
  { id: 'btnTeclado',  label: '⌨️ Teclado',  url: 'http://localhost:3002/comp/teclado' },
  { id: 'btnAcordeon', label: '📂 Acordeón', url: 'http://localhost:3002/comp/acordeon' },
];

componentes.forEach(({ id, label, url }) => {
  document.getElementById(id).addEventListener('click', () => {
    const item = crearNavItem(label, url);
    area.appendChild(item);
  });
});

document.getElementById('btnContarHijos').addEventListener('click', () => {
  const total = area.children.length;
  resultado.textContent = `El área tiene ${total} hijo(s) directo(s).`;
});