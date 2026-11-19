# Generador de Contrasenias — Documentacion Oficial y Guia de Defensa

Aplicacion web profesional de **Generador de Contrasenias Seguras** con persistencia en base de datos local en archivo **`.json`** en `localhost`. 
Desarrollada para integrar y demostrar todos los temas vistos en el **Primer Cuatrimestre**:
- **Node.js** y **Express**
- **Arrays y Vectores** (manipulacion, barajado y filtrado)
- **Clases** con encapsulamiento y metodos accesores **`get`** y **`set`**
- **Vector de Clases** (`GestorContrasenas` administrando instancias `RegistroContrasena`)
- **Import / Export** (Modulos ES6 nativos)
- **Fetch y Axios** (comunicacion cliente-servidor diferenciada)
- **Respuestas obligatorias del lado del servidor**
- **Eventos** (DOM en el navegador y `EventEmitter` en Node.js)
- **Modo Claro / Modo Oscuro** persistente en `localStorage`
- **Boton flotante para subir hacia arriba al toque** con scroll suave
- **Disenio 100% responsive y fluido** (horizontal en escritorio sin espacios vacios laterales, vertical en movil)
- **Prohibicion estricta de `alert()` y `confirm()`** (reemplazados por validacion inline en DOM, toasts y modal accesible)

---

## 1. Explicacion Clara de Toda la Aplicacion (Para Defender ante el Profesor)

> *"Profesor, este proyecto es un **Generador y Gestor de Contrasenias** conectado a un servidor backend propio en **Node.js con Express**.*
>
> *Apenas se abre la pagina en `http://localhost:3000`, el navegador no genera una clave al azar por su cuenta: se conecta con el servidor mediante una peticion HTTP con **Axios** (`POST /api/generar`). En el backend, Node.js valida la configuracion con la clase `ConfiguracionGenerador` y genera la clave de forma segura usando el modulo nativo `node:crypto`. Ahi mismo, el servidor calcula de 0 a 100 la fortaleza de la clave (Debil, Media, Fuerte o Muy Fuerte) y devuelve la respuesta en JSON.*
>
> *En la pantalla, el usuario ve el visor de la contrasenia, una barra de fortaleza con su puntaje y puede copiarla o elegir generar 1, 3 o 5 variantes. Si presiona "Usar" en cualquiera de las variantes, esta pasa automaticamente al visor principal de arriba y al formulario de guardado.*
>
> *Al lado derecho, el usuario tiene un formulario para **guardar** la contrasenia asociada a un servicio, un correo opcional (validado si se escribe al menos una letra) y una categoria. Antes de enviar nada, el navegador valida con la clase `RegistroContrasena`: si falta un dato o el correo es invalido, los `setters` lanzan un error que mostramos en una caja dentro del DOM, **sin usar `alert()`**.*
>
> *Para guardar, editar o borrar en el archivo **`database/contrasenas.json`** en `localhost`, el cliente utiliza la **Fetch API** nativa (`GET`, `POST`, `PUT`, `DELETE`). El servidor almacena los registros dentro de un **Vector de Clases** (`GestorContrasenas`) y los persiste en disco. Abajo aparece el historial completo para buscar, filtrar por categoria, ver/ocultar con asteriscos, copiar, editar o eliminar mediante un **modal propio en el DOM** (sin `confirm()`).*
>
> *Por ultimo, la pagina incluye un boton de **Modo Claro / Modo Oscuro** guardado en `localStorage`, un **boton flotante para subir hacia arriba** al hacer scroll, y un disenio 100% responsive: en escritorio ocupa todo el ancho en filas horizontales sin margenes vacios laterales, y en movil pasa a columna vertical."*

### Resumen Flash (Que Responder Rapido por Cada Tema)
* **Node.js + Express:** Es el servidor backend (`server.js`) que entrega el HTML/CSS/JS y procesa las peticiones en `http://localhost:3000`.
* **Respuestas del servidor:** Todas las claves, puntajes de seguridad y guardados se calculan y validan en Node.js, respondiendo siempre `{ exito, mensaje, datos }`.
* **Arrays / Vectores:** Listas de caracteres (`VECTOR_MAYUSCULAS`, etc.), mezcla con algoritmo Fisher-Yates y metodos `.map()`, `.filter()`, `.find()`, `.splice()`.
* **Clases (`get` y `set`):** `ConfiguracionGenerador` y `RegistroContrasena` encapsulan los datos con `_propiedad` y los validan automaticamente dentro de cada `set`.
* **Vector de Clases:** `GestorContrasenas` administra un arreglo donde cada elemento es una instancia real de `RegistroContrasena`, asegurando integridad en altas, bajas, modificaciones y filtros.
* **Import / Export:** Modulos ES6 (`"type": "module"`) para compartir las mismas clases entre Node.js y el navegador sin repetir codigo.
* **Fetch vs Axios:** Axios se uso para generar claves y chequear salud del servidor (serializa JSON y rechaza errores 4xx/5xx solo); Fetch se uso para todo el ABM en `contrasenas.json` (API nativa, parseo manual con `.json()` y control con `respuesta.ok`).
* **Eventos:** En el cliente: `DOMContentLoaded`, `click`, `input`, `change`, `submit`, `scroll`, `keydown`. En el servidor: `EventEmitter` (`contrasena:generada`, `registro:guardado`, etc.).
* **Base `.json` en localhost:** Archivo `database/contrasenas.json` leido y guardado con `node:fs/promises` y cola de escritura para evitar choques.

---

## 2. Explicacion Exhaustiva: ¿Que es Fetch? ¿Que es Axios? y ¿Cuales son sus Diferencias?

En este proyecto se integraron y diferenciaron explicitamente las dos tecnologias de comunicacion HTTP solicitadas en el programa:

### 2.1. ¿Que es Fetch?
* **Definicion:** Es una funcion que viene **incorporada de forma nativa en los navegadores web modernos** (y en versiones recientes de Node.js). No requiere instalar ningun paquete adicional con `npm` ni importar librerias externas.
* **Como funciona:** Trabaja sobre el estandar de **Promesas** de JavaScript. Haces la llamada con `fetch(url, opciones)` y te devuelve un objeto `Response`.
* **Particularidad clave:** Fetch es de "bajo nivel". Requiere dos pasos: primero esperar la respuesta de la red y luego llamar explicitamente a `await respuesta.json()` para extraer los datos. Ademas, **no lanza error si el servidor devuelve un codigo 400 (Bad Request) o 500 (Server Error)**: para Fetch eso sigue siendo una respuesta valida y te obliga a verificar a mano la propiedad `respuesta.ok`.

### 2.2. ¿Que es Axios?
* **Definicion:** Es una **libreria externa especializada en peticiones HTTP** creada por la comunidad de JavaScript. Para utilizarla en el cliente se sirve de forma local desde `node_modules/axios/dist/axios.min.js`.
* **Como funciona:** Tambien trabaja con **Promesas**, pero viene con herramientas automaticas: transforma los objetos JavaScript a JSON sin necesidad de llamar a `JSON.stringify()`, y cuando el servidor responde, ya desempaqueta el JSON automaticamente en la propiedad `respuesta.data`.
* **Particularidad clave:** Si el servidor responde con un estado de error HTTP (por ejemplo `400` o `500`), Axios **rechaza la promesa inmediatamente** y salta de forma automatica al bloque `catch(error)`, lo cual facilita centralizar el manejo de errores en un solo lugar.

---

### 2.3. Tabla Comparativa: Fetch vs Axios

| Caracteristica | Fetch API (Nativo) | Axios (Libreria Externa) |
| :--- | :--- | :--- |
| **Origen** | Nativo de JavaScript / Navegadores. | Libreria externa (`npm install axios`). |
| **Instalacion** | Cero instalacion (viene de fabrica). | Requiere instalar y cargar el script. |
| **Transformacion a JSON** | **Manual:** Requiere hacer `await respuesta.json()`. | **Automatica:** La respuesta ya viene parseada en `respuesta.data`. |
| **Envio de datos (POST/PUT)** | **Manual:** Hay que usar `body: JSON.stringify(datos)` y colocar el encabezado `'Content-Type': 'application/json'`. | **Automatico:** Pasas el objeto directo `axios.post(url, objeto)` y Axios coloca los encabezados y serializa solo. |
| **Manejo de errores HTTP (404, 500)** | **No rechaza la promesa:** Si el servidor tira error 400 o 500, entra por el flujo normal. Hay que chequear `if (!respuesta.ok)`. | **Rechaza la promesa:** Cualquier codigo fuera del rango `2xx` salta directamente al bloque `catch(error)`. |
| **Soporte de Timeout** | Complejo (requiere crear un `AbortController`). | Nativo (se pasa `{ timeout: 5000 }` en la configuracion). |
| **Interceptores** | No tiene de forma nativa. | Permite interceptar solicitudes y respuestas globalmente antes de que se procesen. |

---

### 2.4. ¿Donde y por que se uso cada una en este proyecto?

Para que ambas tecnologias queden claramente separadas y justificadas tecnicamente en [`modules/moduloPeticiones.js`](modules/moduloPeticiones.js):

#### A. Usamos **Axios** (`servicioAxios`) para el Generador y Estado del Servidor
* **`axios.get('/api/salud')`**: Consulta si Node.js esta activo y obtiene el vector de categorias del sistema.
* **`axios.post('/api/generar', configuracion)`**: Envia la longitud y tipos de caracteres al backend.
* **Justificacion:** Como la generacion de contrasenias se dispara de forma muy frecuente y reactiva (cada vez que movemos el slider o cambiamos un checkbox), aprovechamos la comodidad de Axios para enviar y recibir datos en un solo paso, dejando que su captura automatica de errores atrape cualquier parametro invalido.

#### B. Usamos **Fetch** (`servicioFetch`) para el ABM en `database/contrasenas.json`
* **`fetch('/api/contrasenas', { method: 'GET' })`**: Lista las contrasenias guardadas en el archivo JSON.
* **`fetch('/api/contrasenas', { method: 'POST', body: ... })`**: Da de alta un nuevo registro en el archivo JSON.
* **`fetch('/api/contrasenas/:id', { method: 'PUT', body: ... })`**: Modifica un registro existente en el archivo JSON.
* **`fetch('/api/contrasenas/:id', { method: 'DELETE' })`**: Elimina una credencial puntual del archivo JSON.
* **`fetch('/api/contrasenas', { method: 'DELETE' })`**: Vacia todo el historial del archivo JSON.
* **Justificacion:** Demuestra el dominio de la API nativa de JavaScript sin dependencias externas, implementando una funcion auxiliar (`procesarRespuestaFetch`) que verifica `respuesta.ok` y procesa manualmente el cuerpo JSON.

---

## 3. Guia Detallada de Tecnologias Vistas en el Cuatrimestre

### 3.1. Node.js y Express (Servidor y Respuestas del Servidor)
* **Archivo:** [`server.js`](server.js)
* **Explicacion:** Levantamos un servidor web en el puerto `3000` con Express. Todas las rutas de API devuelven respuestas con formato estandarizado:
  ```json
  {
      "exito": true,
      "mensaje": "Mensaje informativo para la interfaz",
      "datos": { ... }
  }
  ```
  Esto garantiza que el cliente siempre reciba una respuesta predecible, con los codigos HTTP adecuados (`200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`, `500 Server Error`).

### 3.2. Base de Datos en Archivo `.json` en `localhost`
* **Archivos:** [`database/contrasenas.json`](database/contrasenas.json) y [`modules/moduloPersistencia.js`](modules/moduloPersistencia.js)
* **Explicacion:** En lugar de instalar bases de datos pesadas (como MySQL o MongoDB), la persistencia se resuelve mediante un archivo JSON local gestionado por el modulo nativo `node:fs/promises`.
* **Seguridad de concurrencia:** El modulo implementa una cola de promesas (`colaEscritura`) para que si llegan dos solicitudes casi al mismo tiempo, se guarden de forma secuencial evitando que se sobreescriba o corrompa el archivo.

### 3.3. Arrays / Vectores
* **Archivos:** [`modules/moduloGeneradorServidor.js`](modules/moduloGeneradorServidor.js) y [`modules/moduloClases.js`](modules/moduloClases.js)
* **Explicacion:** Se aplican tecnicas de vectores en todo el proyecto:
  * Vectores de caracteres: `'ABC...'.split('')` genera arreglos iterables.
  * Barajado Fisher-Yates: Algoritmo para mezclar las posiciones de un vector sin patrones repetitivos.
  * Metodos funcionales modernos: `.map()` para transformar datos, `.filter()` para busquedas y categorias, `.find()` para localizar por ID, `.findIndex()` y `.splice()` para eliminar elementos de un array.

### 3.4. Clases con Encapsulamiento, GET y SET
* **Archivo:** [`modules/moduloClases.js`](modules/moduloClases.js)
* **Explicacion:**
  * **`ConfiguracionGenerador`**: Sus setters validan que la longitud este entre 6 y 32 caracteres y que la cantidad de claves este entre 1 y 5. Su getter calculado `tiposActivos` inspecciona que casillas estan marcadas.
  * **`RegistroContrasena`**: Modela una credencial en el sistema. Los setters impiden servicios con nombres vacios y comprueban que la categoria exista en `CATEGORIAS_VALIDAS`. Su getter `contrasenaEnmascarada` devuelve una mascara de asteriscos para no revelar la clave en pantalla salvo que el usuario lo solicite.

### 3.5. Vector de Clases (`GestorContrasenas`)
* **Archivo:** [`modules/moduloClases.js`](modules/moduloClases.js)
* **Explicacion:** Es una clase disenada especificamente para administrar un vector interno (`_vectorRegistros`).
  * En su setter `set registros(nuevoVector)`, convierte automaticamente cada objeto plano recibido en una instancia real `new RegistroContrasena(item)`.
  * Provee metodos como `agregar()`, `buscarPorId()`, `actualizar()`, `eliminar()`, `vaciar()` y `filtrar()`, garantizando que en todo momento se trabaje con objetos fuertemente tipados y validados.

### 3.6. Import / Export (Modulos ES6)
* **Configuracion:** `"type": "module"` en `package.json` y `<script type="module">` en HTML.
* **Explicacion:** Permite compartir exactamente los mismos archivos de logica (`moduloClases.js`) tanto en el servidor Node.js como en el navegador web, logrando una arquitectura limpia, atomizada y libre de codigo duplicado.

### 3.7. Eventos (DOM y Servidor)
* **En el navegador:** Escuchamos eventos de interfaz como `DOMContentLoaded`, `click`, `input`, `change`, `submit`, `scroll` y `keydown`.
* **En el servidor (`EventEmitter`):** La clase `EmisorEventosServidor` emite eventos internos como `'contrasena:generada'`, `'registro:guardado'`, `'registro:actualizado'`, `'registro:eliminado'` e `'historial:vaciado'`, demostrando programacion orientada a eventos en Node.js.

### 3.8. Modo Claro / Modo Oscuro
* **Archivos:** [`styles/temas.css`](styles/temas.css) y [`modules/moduloInterfaz.js`](modules/moduloInterfaz.js)
* **Explicacion:** Utiliza variables nativas de CSS (`:root` para el modo claro y `[data-tema="oscuro"]` para el modo oscuro). La preferencia del usuario se almacena en `localStorage` (`generador_claves_tema`) y un pequeno script en el `<head>` del HTML aplica el atributo inmediatamente para evitar cualquier parpadeo al recargar la pagina.

### 3.9. Boton para Subir Arriba al Toque
* **Archivos:** [`modules/moduloInterfaz.js`](modules/moduloInterfaz.js) y [`styles/estilos.css`](styles/estilos.css)
* **Explicacion:** Un boton flotante fijo (`#btnSubirArriba`) que permanece oculto al inicio. Al hacer scroll hacia abajo mas de 110px, se le agrega la clase `.visible`. Al hacer click en el, ejecuta `window.scrollTo({ top: 0, behavior: 'smooth' })`, llevando al usuario al inicio de la pagina de forma instantanea y fluida.

### 3.10. Disenio Responsive 100% Fluido (Sin Espacios en Blanco Laterales)
* **Archivo:** [`styles/estilos.css`](styles/estilos.css)
* **Explicacion:**
  * En computadoras y pantallas mayores a 768px: Los contenedores principales usan `width: 100%` con margenes laterales nulos. Los paneles del Generador y de Guardado se ubican lado a lado en una fila horizontal (`display: flex; flex-direction: row`), aprovechando todo el ancho del monitor sin dejar franjas vacias a los costados.
  * En dispositivos moviles (pantallas de 768px o menores): Mediante Media Queries (`@media (max-width: 768px)`), la disposicion horizontal cambia a vertical (`flex-direction: column`), permitiendo una navegacion comoda y adaptada al celular.

### 3.11. Sin uso de `alert()` ni `confirm()`
* Las alertas invasivas estan estrictamente prohibidas en el proyecto:
  1. Los errores de validacion se insertan dentro del DOM en el contenedor `#mensajeValidacionForm`.
  2. Los avisos de exito o informacion se muestran como notificaciones Toast animadas en `#contenedorToasts`.
  3. Las confirmaciones para borrar o vaciar registros se abren a traves de un modal HTML propio (`#modalConfirmacion`) que devuelve una Promesa asincrona.

---

## 4. Estructura de Archivos del Proyecto

```text
generador-contrasenas/
├── server.js                         # Servidor Node.js + Express, rutas API y EventEmitter
├── package.json                      # Configuracion ESM ("type": "module"), express y axios
├── README.md                         # Guia completa de conceptos, diferencias y ejecucion
├── database/
│   └── contrasenas.json              # Base de datos persistente en formato JSON en localhost
├── pages/
│   └── index.html                    # Estructura semantica HTML5 accesible
├── styles/
│   ├── temas.css                     # Paletas de color para modo claro y modo oscuro
│   └── estilos.css                   # Layout 100% fluido horizontal (>768px) / vertical (<=768px)
├── scripts/
│   └── principal.js                  # Arranque del cliente, eventos del generador y Axios
├── modules/
│   ├── moduloClases.js               # Clases con GET/SET y Vector de Clases GestorContrasenas
│   ├── moduloGeneradorServidor.js    # Generacion criptografica y evaluador de seguridad
│   ├── moduloPersistencia.js         # Lectura y guardado concurrente en database/contrasenas.json
│   ├── moduloPeticiones.js           # Servicios HTTP atomizados con Axios y con Fetch API
│   ├── moduloInterfaz.js             # Manipulacion segura del DOM, tema, scroll-top, toasts y modal
│   └── moduloHistorial.js            # Administracion del historial JSON en el navegador con Fetch
└── tests/
    └── verificacion.test.js          # Pruebas automatizadas de punta a punta con node:test
```

---

## 5. Preguntas Clave del Profesor y Respuestas Rapidas

* **¿Por que usaste `crypto.randomInt` en lugar de `Math.random()`?**  
  Porque `Math.random()` genera numeros pseudoaleatorios mediante formulas matematicas predecibles, siendo vulnerable para contrasenias. En cambio, `crypto.randomInt` es nativo de Node.js y se conecta directamente con la entropia criptografica del sistema operativo, garantizando una aleatoriedad real y segura.

* **¿Que ventaja tiene usar un Vector de Clases en lugar de un array comun?**  
  El Vector de Clases (`GestorContrasenas`) asegura que ningun dato corrupto ingrese a la coleccion, ya que su setter convierte automaticamente los elementos a instancias de `RegistroContrasena`, aprovechando todos sus metodos de busqueda, actualizacion y filtrado en un solo lugar.

* **¿Cual es la diferencia en codigo entre hacer un POST con Axios y con Fetch?**  
  En Axios simplemente haces:
  ```javascript
  const res = await axios.post('/api/generar', datos);
  const resultado = res.data;
  ```
  En Fetch tenes que convertir a texto y configurar los encabezados manualmente:
  ```javascript
  const res = await fetch('/api/contrasenas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
  });
  if (!res.ok) throw new Error('Fallo en la peticion');
  const resultado = await res.json();
  ```

---

## 6. Para Que Sirve Cada Comando y Como Ejecutar el Proyecto

* **`cd <ruta>`**: Cambia la ubicacion actual de la terminal para situarse adentro de la carpeta del proyecto.
* **`npm install`**: Lee el archivo `package.json` e instala las dependencias necesarias (`express`, `axios`, `cors`, `morgan`) en la carpeta `node_modules/`.
* **`npm test`**: Ejecuta la suite de pruebas automatizadas con el ejecutor nativo `node --test tests/verificacion.test.js`, validando clases, generador, persistencia en JSON y rutas HTTP.
* **`npm start`**: Enciende el servidor Node.js en produccion escuchando en `http://localhost:3000`.
* **`npm run dev`**: Enciende el servidor en modo desarrollo con observador automatico (`node --watch server.js`), reiniciando el servidor cada vez que modificas un archivo.

---

### Comandos Exactos para Ejecutarlo en Windows

Abre una consola (PowerShell o CMD) y escribe en orden:

```bash
cd "C:\Users\G15\Documents\GitHub\PDeISC\PrimerCuatrimestreRecuperatorio2doIntento\generador-contrasenas"
npm install
npm test
npm start
```

*(O si lo ejecutas desde Descargas: `cd C:\Users\G15\Downloads\generador-contrasenas`)*

Una vez que la consola muestre el mensaje de confirmacion, abre tu navegador web preferido e ingresa a:

```text
http://localhost:3000
```
