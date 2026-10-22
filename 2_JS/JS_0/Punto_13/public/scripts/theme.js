/**
 * ARCHIVO: theme.js
 * PROPOSITO: Modo claro/oscuro (persistente) + boton volver arriba.
 * No depende de modulos, se puede cargar con <script> normal.
 */
(function () {
  function aplicarTema() {
    var guardado = localStorage.getItem('theme');
    var prefiereOscuro = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var oscuro = guardado === 'dark' || (!guardado && prefiereOscuro);
    document.body.classList.toggle('dark-mode', oscuro);
    document.body.classList.toggle('light-mode', !oscuro);
    return oscuro;
  }

  function actualizarBoton(btn, oscuro) {
    if (!btn) return;
    btn.innerHTML = oscuro
      ? '<i class="bi bi-sun-fill"></i> Modo Claro'
      : '<i class="bi bi-moon-fill"></i> Modo Oscuro';
  }

  document.addEventListener('DOMContentLoaded', function () {
    var oscuro = aplicarTema();
    var themeBtn = document.getElementById('themeToggle');
    actualizarBoton(themeBtn, oscuro);
    if (themeBtn) {
      themeBtn.addEventListener('click', function () {
        var ahoraOscuro = !document.body.classList.contains('dark-mode');
        document.body.classList.toggle('dark-mode', ahoraOscuro);
        document.body.classList.toggle('light-mode', !ahoraOscuro);
        localStorage.setItem('theme', ahoraOscuro ? 'dark' : 'light');
        actualizarBoton(themeBtn, ahoraOscuro);
      });
    }

    var scrollBtn = document.getElementById('scrollTopBtn');
    if (scrollBtn) {
      window.addEventListener('scroll', function () {
        scrollBtn.style.display = window.scrollY > 300 ? 'flex' : 'none';
      });
      scrollBtn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  });
})();
