/**
 * Casa Luanda — Detecção Robusta de Capacidades do Dispositivo
 * Identifica dispositivos móveis/touch sem depender exclusivamente de User-Agent.
 */
function isMobileDevice() {
  const hasTouch =
    ('maxTouchPoints' in navigator && navigator.maxTouchPoints > 0) ||
    ('msMaxTouchPoints' in navigator && navigator.msMaxTouchPoints > 0);

  const pointerCoarse = window.matchMedia('(pointer: coarse)').matches;
  const hoverNone = window.matchMedia('(hover: none)').matches;
  const bp = (window.APP_CONFIG && window.APP_CONFIG.mobileNavigation && typeof window.APP_CONFIG.mobileNavigation.breakpointWidth === 'number')
    ? window.APP_CONFIG.mobileNavigation.breakpointWidth
    : 1024;
  const mobileWidth = window.innerWidth <= bp;

  return hasTouch && (pointerCoarse || hoverNone) && mobileWidth;
}

if (typeof window !== 'undefined') {
  window.isMobileDevice = isMobileDevice;
}
