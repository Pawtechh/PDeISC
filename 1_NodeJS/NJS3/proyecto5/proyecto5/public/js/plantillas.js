export const generarCard = (n) => `
  <div class="card bg-dark text-light border-secondary">
    <div class="card-body">
      <h5 class="card-title">📦 Card #${n}</h5>
      <p class="card-text">Contenido generado con <code>innerHTML</code> – Card número ${n}.</p>
      <span class="badge bg-primary">innerHTML</span>
    </div>
  </div>`;

export const generarAlerta = (n) => `
  <div>
    Mensaje dinámico #${n} generado con innerHTML.
  </div>`;

export const generarTabla = (n) => `
  <h6>Tabla #${n}</h6>
  <table class="table table-dark table-bordered table-sm mb-0">
    <thead><tr><th>Col A</th><th>Col B</th><th>Col C</th></tr></thead>
    <tbody>
      ${Array.from({length:3},(_,i)=>`<tr><td>A${i+1}</td><td>B${i+1}</td><td>C${i+1}</td></tr>`).join('')}
    </tbody>
  </table>`;

export const generarLista = (n) => `
  <h6>Lista #${n}</h6>
  <ul class="list-group list-group-flush">
    ${Array.from({length:4},(_,i)=>`<li class="list-group-item bg-dark text-light border-secondary">Ítem ${i+1} de la lista #${n}</li>`).join('')}
  </ul>`;

export const generarProgress = (n) => {
  const val = (n * 17) % 100 || 10;
  return `
  <h6>Progreso #${n}</h6>
  <div class="progress" style="height:22px">
    <div class="progress-bar bg-success" style="width:${val}%">${val}%</div>
  </div>`;
};