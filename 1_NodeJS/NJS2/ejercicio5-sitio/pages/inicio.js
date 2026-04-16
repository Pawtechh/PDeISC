import { layout } from "../menu.js";

export function renderInicio() {
  return layout("Inicio", `
    <div class="text-center py-5">
      <h1 class="display-4 fw-bold text-primary">¡Bienvenidos a MiSitio!</h1>
      <p class="lead text-muted">Un sitio hecho con Node.js puro y Bootstrap 5</p>
      <a href="/servicios" class="btn btn-primary btn-lg me-2">Ver servicios</a>
      <a href="/contacto" class="btn btn-outline-primary btn-lg">Contactanos</a>
    </div>

    <div class="row mt-5 g-4">
      <div class="col-md-4">
        <div class="card h-100 shadow-sm">
          <div class="card-body text-center">
            <div class="fs-1 mb-3">🚀</div>
            <h5 class="card-title">Rápido</h5>
            <p class="card-text text-muted">Servidor liviano con Node.js sin frameworks.</p>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card h-100 shadow-sm">
          <div class="card-body text-center">
            <div class="fs-1 mb-3">🎨</div>
            <h5 class="card-title">Moderno</h5>
            <p class="card-text text-muted">Diseño responsivo con Bootstrap 5.</p>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card h-100 shadow-sm">
          <div class="card-body text-center">
            <div class="fs-1 mb-3">📦</div>
            <h5 class="card-title">Modular</h5>
            <p class="card-text text-muted">Código organizado con ES Modules.</p>
          </div>
        </div>
      </div>
    </div>
  `);
}