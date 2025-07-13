/**
 * Preloads a background image for smoother transitions
 * @param {string} src - The image source URL
 */
export function preloadBackgroundImage(src) {
  const img = new Image();
  img.src = src;
}