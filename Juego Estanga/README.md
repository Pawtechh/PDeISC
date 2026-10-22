# Estanga Games - Refactor multidispositivo

Este proyecto quedó preparado para que vos puedas correr el arcade tanto en PC como en celular o tablet, sin mandar al usuario a una página aparte. El flujo arranca con una validación de dispositivo, cruza esa elección con la detección real de pantalla/navegador, y recién después lleva al selector de minijuegos.

## Cómo correrlo

```bash
npm start
```

Después abrí `http://localhost:3000`.

## Flujo general

1. Al cargar la web aparece el selector inicial: `Computadora` o `Celular / Tablet`.
2. La app detecta automáticamente `userAgent`, ancho, alto y soporte táctil.
3. Si la detección real da móvil o tablet, se fuerza el modo móvil aunque el usuario haya elegido PC.
4. El usuario pasa al menú de minijuegos.
5. En móvil o tablet solo se habilita `1 JUGADOR`.
6. El botón de 2 jugadores queda deshabilitado con el texto exacto: `en un futuro servidor para el 11/6/26`.
7. Al tocar `SALIR` dentro de un minijuego, se vuelve al selector de modos del juego elegido, manteniendo la configuración de dispositivo ya tomada.

## Bloques principales

### `pages/index.html`

- `screen-device`: pantalla inicial de validación de dispositivo.
- `screen-menu`: selector de minijuegos.
- `screen-mode`: selector de modo por juego.
- `screen-names`: carga de nombres.
- `screen-game`: HUD, canvas, ranking del modo y controles táctiles.
- `touch-controls`: joystick/D-Pad y botón `ACCION` para celular y tablet.

### `scripts/deviceControl.js`

- `detectDevice(nav, win)`: revisa `userAgent`, tamaño de pantalla y soporte táctil para clasificar como `pc`, `mobile` o `tablet`.
- `resolveDeviceConfig(userChoice, detected)`: cruza lo que eligió el usuario con la detección real. Si detecta móvil/tablet, activa experiencia móvil.
- `saveDeviceConfig(config)`: guarda la configuración en `sessionStorage` para sostener el flujo durante la sesión.
- `loadDeviceConfig()`: recupera una configuración guardada si existe.
- `applyDeviceClass(config)`: agrega clases al `body` para que CSS adapte layout y controles.
- `syncViewportSize(win)`: actualiza `--app-vh` para que el alto real del navegador móvil no corte el canvas.

### `scripts/touchInterface.js`

- `emitTouchControl(control)`: emite un evento global `estanga:touch-control`.
- `setTouchControlsVisible(visible)`: muestra u oculta el joystick táctil.
- `bindTouchControls(root)`: conecta `touchstart`, `touchend` y eventos pointer con los botones del DOM.

Este bloque existe para no mezclar la lógica táctil con cada juego. Cada minijuego solo escucha una acción normalizada: `up`, `down`, `left`, `right` o `action`.

### `scripts/main.js`

- `getLeaderboard(key)`: lee un ranking local.
- `saveLeaderboard(key, entries)`: ordena y guarda el top 10.
- `isTopScore(key, score)`: valida si un puntaje entra al top.
- `saveScore(mode, name, score)`: guarda puntaje y refresca rankings.
- `checkAndSaveScore(mode, score, defaultName)`: valida y registra un nuevo high score.
- `updateGlobalLeaderboard()`: arma el top global mezclando todos los modos.
- `updateGameLeaderboard(mode)`: refresca el ranking del modo activo.
- `renderLeaderboard(container, entries)`: dibuja las filas del ranking.
- `getModeTag(mode)`: convierte modo interno en etiqueta corta.
- `showNewHighScoreMessage(score, name)`: muestra aviso visual de nuevo récord.
- `showScreen(id)`: cambia de pantalla sin recargar la página.
- `isMobileDevice()`: informa si la experiencia efectiva es móvil.
- `chooseDevice(choice)`: procesa la elección inicial y aplica la detección cruzada.
- `goMode(game)`: muestra modos disponibles para Snake o Pacman.
- `goNames(mode)`: renderiza inputs de jugadores, restringiendo a 1J en móvil/tablet.
- `capturePlayerNames()`: toma los nombres del formulario.
- `getCurrentLeaderboardMode()`: resuelve la clave del ranking según juego/modo.
- `startGame()`: inicializa el minijuego elegido.
- `exitGame()`: limpia el minijuego y vuelve al selector de modos, sin volver al selector de dispositivo.
- `bindMenuEvents()`: registra eventos de botones y navegación.
- `bindResponsiveDeviceRefresh()`: recalcula dispositivo y viewport ante cambios de tamaño.
- `initApp()`: inicializa la app cuando carga el DOM.
- `updateSprayUI(playerIdx, count)`: actualiza los indicadores visuales de sprays.

### `scripts/snake1jugador.js`

Funciones nuevas o modificadas:

- `applyDirection(nd)`: aplica la dirección del jugador 1 evitando giros inválidos.
- `useSpray()`: dispara spray desde la cabeza de la serpiente.
- `startLoopIfNeeded()`: arranca el loop cuando llega el primer movimiento.
- `keyHandler(e)`: mantiene teclado físico para PC.
- `touchHandler(event)`: suma joystick táctil para móvil/tablet.
- `gameOver(msg)`: ahora también permite reiniciar con dirección táctil.
- `cleanSnake()`: limpia listeners de teclado y touch.

### `scripts/pacman1jugador.js`

Funciones nuevas o modificadas:

- `applyDirection(dir)`: aplica dirección a Pacman y arranca la partida si estaba esperando.
- `useSpray()`: dispara el spray del jugador 1.
- `keyHandler(e)`: conserva flechas y Space en PC.
- `touchHandler(event)`: suma joystick táctil y botón de acción.
- `die()`: permite reiniciar con joystick al terminar la partida.
- `cleanPacman()`: limpia listeners de teclado y touch.

## Decisiones técnicas

### Validación cruzada de dispositivo

No se confía solamente en lo que el usuario elige. Si vos elegís PC pero el navegador informa pantalla chica, táctil o `userAgent` móvil, la app activa el modo móvil. Esto evita que un celular quede con controles de teclado imposibles de usar.

### Joystick táctil

El joystick vive en el DOM para que sea responsivo y fácil de ajustar por CSS. No se dibuja dentro del canvas porque los controles de interfaz tienen que seguir disponibles aunque cambie el tamaño del juego.

### Restricción de 2 jugadores en móvil

En móvil y tablet se fuerza `solo`. El segundo modo se renderiza deshabilitado para que el usuario entienda que esa opción existe, pero todavía no está disponible. El texto promocional queda exactamente como fue pedido.

### Ruteo interno al salir

Antes, salir del juego mandaba al menú inicial. Ahora `exitGame()` ejecuta la limpieza del minijuego y llama a `goMode(STATE.game)`. Así volvés al selector de modo/minijuegos del juego actual sin perder la configuración de dispositivo.

## Estética y responsividad

Se renovó `styles/style.css` con:

- Layout centrado y adaptable.
- Canvas con `width: 100%`, `height: auto` y `max-height` para no cortarse.
- HUD flexible para pantallas chicas.
- Controles táctiles visibles solo en móvil/tablet.
- Uso de `--app-vh` para corregir el alto real en navegadores móviles.
