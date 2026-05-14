const form = document.getElementById("uploadForm");
const fileInput = document.getElementById("txtfile");
const message = document.getElementById("message");
const usefulList = document.getElementById("usefulList");
const factorialList = document.getElementById("factorialList");
const stats = document.getElementById("stats");
const downloadLink = document.getElementById("downloadLink");
const themeToggle = document.getElementById("themeToggle");
const html = document.documentElement;

const savedTheme = localStorage.getItem("theme") || "light";
html.dataset.theme = savedTheme;
themeToggle.textContent = savedTheme === "dark" ? "Modo claro" : "Modo oscuro";

themeToggle.addEventListener("click", () => {
  const newTheme = html.dataset.theme === "dark" ? "light" : "dark";
  html.dataset.theme = newTheme;
  localStorage.setItem("theme", newTheme);
  themeToggle.textContent = newTheme === "dark" ? "Modo claro" : "Modo oscuro";
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  message.textContent = "";
  usefulList.innerHTML = "";
  factorialList.innerHTML = "";
  stats.textContent = "";
  downloadLink.style.display = "none";

  if (!fileInput.files.length) {
    message.textContent = "Selecciona un archivo TXT.";
    return;
  }

  const formData = new FormData();
  formData.append("txtfile", fileInput.files[0]);

  const response = await fetch("/upload", {
    method: "POST",
    body: formData
  });

  const data = await response.json();

  if (!response.ok) {
    message.textContent = data.message || "Ocurrió un error.";
    return;
  }

  message.textContent = data.message;

  usefulList.innerHTML = data.useful.length
    ? data.useful.map(n => `<div>${n}</div>`).join("")
    : "<div>No hay números útiles.</div>";

  factorialList.innerHTML = data.factorials.length
    ? data.factorials.map(n => `<div>${n}</div>`).join("")
    : "<div>No se encontraron factoriales.</div>";

  stats.innerHTML = `
    <strong>Total:</strong> ${data.total}<br>
    <strong>Útiles:</strong> ${data.utiles}<br>
    <strong>No útiles:</strong> ${data.noUtiles}<br>
    <strong>Porcentaje útiles:</strong> ${data.porcentajeUtiles}%
  `;

  const blob = new Blob([data.resultText], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  downloadLink.href = url;
  downloadLink.download = data.outputFile;
  downloadLink.style.display = "inline-block";
  downloadLink.textContent = "Descargar TXT filtrado";
});