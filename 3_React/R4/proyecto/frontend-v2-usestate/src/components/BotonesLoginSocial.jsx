// components/BotonesLoginSocial.jsx
// Un botón por proveedor. Al hacer click, redirige el navegador completo
// (no fetch/axios) a la ruta OAuth del backend, que a su vez redirige al proveedor.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const PROVEEDORES = [
  { id: 'google', etiqueta: 'Continuar con Google' },
  { id: 'facebook', etiqueta: 'Continuar con Facebook / Meta' },
  { id: 'github', etiqueta: 'Continuar con GitHub' },
  { id: 'twitter', etiqueta: 'Continuar con X' },
  { id: 'discord', etiqueta: 'Continuar con Discord' },
  { id: 'twitch', etiqueta: 'Continuar con Twitch' },
];

export default function BotonesLoginSocial() {
  const irAProveedor = (id) => {
    window.location.href = `${API_BASE_URL}/auth/${id}`;
  };

  return (
    <div className="botones-social">
      {PROVEEDORES.map((p) => (
        <button
          key={p.id}
          type="button"
          className={`boton-social boton-social--${p.id}`}
          onClick={() => irAProveedor(p.id)}
        >
          {p.etiqueta}
        </button>
      ))}
    </div>
  );
}
