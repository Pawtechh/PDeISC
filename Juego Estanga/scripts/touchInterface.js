export const TOUCH_EVENT = 'estanga:touch-control';

/**
 * Emite un evento global para que cualquier minijuego consuma controles táctiles.
 * @param {'up'|'down'|'left'|'right'|'action'} control Control solicitado.
 * @returns {void}
 */
export function emitTouchControl(control) {
  document.dispatchEvent(new CustomEvent(TOUCH_EVENT, { detail: { control } }));
}

/**
 * Activa o desactiva la visibilidad del joystick táctil.
 * @param {boolean} visible Indica si los controles deben mostrarse.
 * @returns {void}
 */
export function setTouchControlsVisible(visible) {
  const controls = document.getElementById('touch-controls');
  if (controls) controls.classList.toggle('is-visible', visible);
}

/**
 * Vincula botones táctiles del DOM con eventos de juego normalizados.
 * @param {HTMLElement} root Nodo raíz que contiene botones con data-touch-control.
 * @returns {void}
 */
export function bindTouchControls(root = document) {
  root.querySelectorAll('[data-touch-control]').forEach((button) => {
    const control = button.dataset.touchControl;
    let lastTouchAt = 0;
    const handler = (event) => {
      if (event.type === 'pointerdown' && Date.now() - lastTouchAt < 450) return;
      event.preventDefault();
      emitTouchControl(control);
      button.classList.add('is-pressed');
    };
    const touchHandler = (event) => {
      lastTouchAt = Date.now();
      handler(event);
    };
    const release = (event) => {
      event.preventDefault();
      button.classList.remove('is-pressed');
    };

    button.addEventListener('touchstart', touchHandler, { passive: false });
    button.addEventListener('touchend', release, { passive: false });
    button.addEventListener('touchcancel', release, { passive: false });
    button.addEventListener('pointerdown', handler);
    button.addEventListener('pointerup', release);
    button.addEventListener('pointerleave', release);
  });
}
