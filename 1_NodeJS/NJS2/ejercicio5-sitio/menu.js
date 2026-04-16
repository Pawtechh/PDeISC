export function generarMenu(paginaActual) {
  const links = [
    { ruta: "/",          texto: "Inicio"    },
    { ruta: "/nosotros",  texto: "Nosotros"  },
    { ruta: "/servicios", texto: "Servicios" },
    { ruta: "/galeria",   texto: "Galería"   },
    { ruta: "/contacto",  texto: "Contacto"  },
  ];

  const items = links.map(l => {
    const activo = l.ruta === paginaActual
      ? ' style="font-weight:bold;color:#1a56db;"'
      : '';
    return `<a href="${l.ruta}"${activo}>${l.texto}</a>`;
  }).join(" | ");

  return `
  <nav style="background:#f0f4f8;padding:12px 24px;font-family:sans-serif;font-size:15px;">
    ${items}
  </nav>`;
}