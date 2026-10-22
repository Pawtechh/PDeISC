const DEVICE_STORAGE_KEY = 'estanga_device_config';

/**
 * Detecta si el navegador parece móvil, tablet o PC usando user agent y pantalla.
 * @param {Navigator} nav Objeto navigator del navegador.
 * @param {Window} win Objeto window usado para medir resolución real.
 * @returns {{type:string,isTouch:boolean,width:number,height:number,reason:string}} Resultado normalizado.
 */
export function detectDevice(nav = navigator, win = window) {
  const userAgent = nav.userAgent || '';
  const width = win.innerWidth || 0;
  const height = win.innerHeight || 0;
  const minSide = Math.min(width, height);
  const maxSide = Math.max(width, height);
  const isTouch = 'ontouchstart' in win || nav.maxTouchPoints > 0;
  const mobileUA = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const tabletUA = /iPad|Tablet|PlayBook|Silk/i.test(userAgent) || (isTouch && /Macintosh/i.test(userAgent));

  if (mobileUA || minSide <= 540) {
    return { type: 'mobile', isTouch, width, height, reason: 'user-agent móvil o pantalla angosta' };
  }

  if (tabletUA || (minSide <= 900 && maxSide <= 1366)) {
    return { type: 'tablet', isTouch, width, height, reason: 'tablet táctil o pantalla intermedia' };
  }

  return { type: 'pc', isTouch, width, height, reason: 'pantalla amplia con perfil de escritorio' };
}

/**
 * Cruza la preferencia del usuario con la detección automática del dispositivo.
 * @param {'pc'|'mobile'} userChoice Preferencia elegida en el menú inicial.
 * @param {{type:string,isTouch:boolean,width:number,height:number,reason:string}} detected Datos reales detectados.
 * @returns {{choice:string,detected:string,effective:string,isMobileLike:boolean,summary:string}} Configuración efectiva.
 */
export function resolveDeviceConfig(userChoice, detected) {
  const detectedType = detected.type;
  const isMobileLike = detectedType === 'mobile' || detectedType === 'tablet';
  const effective = isMobileLike ? 'mobile' : 'pc';
  const summary = `Preferencia: ${userChoice.toUpperCase()} | Detectado: ${detectedType.toUpperCase()} (${detected.width}x${detected.height})`;

  return {
    choice: userChoice,
    detected: detectedType,
    effective,
    isMobileLike,
    summary
  };
}

/**
 * Guarda la configuración de dispositivo para mantenerla durante la sesión.
 * @param {{choice:string,detected:string,effective:string,isMobileLike:boolean,summary:string}} config Configuración resuelta.
 * @returns {void}
 */
export function saveDeviceConfig(config) {
  sessionStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(config));
}

/**
 * Recupera la configuración guardada si existe y está bien formada.
 * @returns {{choice:string,detected:string,effective:string,isMobileLike:boolean,summary:string}|null} Configuración o null.
 */
export function loadDeviceConfig() {
  try {
    const raw = sessionStorage.getItem(DEVICE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Aplica clases globales al body para que CSS adapte layout y controles.
 * @param {{effective:string,isMobileLike:boolean}} config Configuración efectiva de dispositivo.
 * @returns {void}
 */
export function applyDeviceClass(config) {
  document.body.classList.toggle('device-mobile', config.effective === 'mobile');
  document.body.classList.toggle('device-pc', config.effective === 'pc');
}

/**
 * Recalcula variables CSS de viewport para evitar cortes en navegadores móviles.
 * @param {Window} win Objeto window usado para medir altura visible.
 * @returns {void}
 */
export function syncViewportSize(win = window) {
  document.documentElement.style.setProperty('--app-vh', `${win.innerHeight * 0.01}px`);
}
