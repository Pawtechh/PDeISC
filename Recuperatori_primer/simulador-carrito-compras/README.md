# Simulador de Carrito de Compras - 1er Cuatrimestre

Proyecto Web desarrollado cumpliendo estrictamente con la estructura obligatoria y los 16 requisitos academicos establecidos.

---

## Estructura del Proyecto

```
/simulador-carrito-compras
  server.js                 # Servidor Express, APIs REST, EventEmitter y despacho estatico
  package.json              # Configuracion ESM (type: module) con 4 espacios de indentacion
  /pages
    index.html              # Pagina principal semantica con script anti-flash en <head>
  /styles
    estilos.css             # CSS moderno, variables nativas, tema claro/oscuro, 100% horizontal desktop
  /scripts
    principal.js            # Punto de entrada del cliente y orquestacion de eventos
  /modules
    moduloClases.js         # Clases POO (Producto, ElementoCarrito, CarritoCompras, OrdenCompra)
    moduloPeticiones.js     # Clientes HTTP (Axios para catalogo/ABM y Fetch para carrito/checkout)
    moduloInterfaz.js       # Renderizado de catalogo, carrito, ticket y avisos DOM sin alert()
    moduloGestionABM.js     # Formulario de Alta, Baja y Modificacion de articulos
```

---

## Cumplimiento de los 16 Requisitos Obligatorios

1. **Documentacion muy detallada**: Cada funcion, clase y bloque de decision cuenta con comentarios explicativos del que y por que.
2. **Funcionalidad sin errores**: Probado y validado en servidor Node.js y navegador web.
3. **Prolijidad y legibilidad**: Codigo ordenado y estandarizado.
4. **Indentacion**: 4 espacios rigurosos en todos los archivos del proyecto.
5. **Buen uso del lenguaje**: HTML5 semantico, CSS3 con custom properties y flexbox/grid, y JavaScript moderno ES6+.
6. **Atomizacion**: Funciones reducidas de responsabilidad unica.
7. **Modularidad**: Arquitectura basada en modulos nativos ES6 (`import` / `export`).
8. **Usabilidad**: Interfaz intuitiva, respuesta inmediata y retroalimentacion grafica al usuario.
9. **Validacion sin alert()**: Mensajes visuales integrados en el DOM.
10. **Responsive estricto**:
    - En escritorio (>=1024px): los contenedores principales se disponen horizontalmente en fila (`flex-direction: row`), ocupando el 100% del ancho sin margenes laterales blancos.
    - En movil (<=768px): la disposicion conmuta a columna vertical (`flex-direction: column`).
11. **Documentacion por archivo**: Bloque de cabecera en cada archivo con proposito, modulos usados y funciones principales.
12. **Modo claro/oscuro**:
    - Modo claro por defecto.
    - Boton visible en el encabezado.
    - Variables CSS (`:root` y `[data-tema="oscuro"]`).
    - Persistencia en `localStorage`.
    - Script inline anti-flash en `<head>`.
13. **Prohibido alert() y confirm()**: Notificaciones temporales y modales personalizados en el DOM.
14. **Estetica profesional y minimalista**: Cero emojis, paleta de colores sobria y disenio realista.
15. **ABM (Alta, Baja, Modificacion) + Listado**: Modulo completo para gestionar articulos del inventario (crear, modificar precio/existencias, dar de baja y listar).
16. **Todo en espaniol**: Nombres de variables, funciones, clases, identificadores del DOM, comentarios y respuestas del servidor en espaniol.

---

## Ejecucion Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor
npm start
```

Servidor disponible en: `http://localhost:3000`
