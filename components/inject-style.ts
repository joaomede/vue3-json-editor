// Injeta CSS no <head> quando o módulo é avaliado, como a 1.1.5 fazia (styleInject do build antigo).
// Seguro em SSR: sem `document`, não faz nada.
export function injectStyle (css: string): void {
  if (!css || typeof document === 'undefined') return
  const style = document.createElement('style')
  style.setAttribute('type', 'text/css')
  style.appendChild(document.createTextNode(css))
  ;(document.head || document.getElementsByTagName('head')[0]).appendChild(style)
}
