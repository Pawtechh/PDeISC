// Punto de entrada de la aplicación.
// Propósito: montar el componente <App /> dentro de <BrowserRouter>, que
// habilita el enrutamiento (navegación por URL) en toda la app.
// Dependencias: react-dom/client, react-router-dom, App, index.css.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* BrowserRouter envuelve la app y sincroniza la UI con la URL. */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

