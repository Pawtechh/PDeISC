export function crearNavItem(label, url) {
  const span = document.createElement('span');
  span.className = 'nav-item-generado';
  span.textContent = label;

  // evento para eliminar al hacer click
  span.addEventListener('click', () => {
    span.remove();
  });

  return span;
}