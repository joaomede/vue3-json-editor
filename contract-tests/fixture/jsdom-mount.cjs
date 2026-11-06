// Simula um teste Jest (ambiente jsdom, CommonJS): monta o componente e espera o editor.
const { JSDOM } = require('jsdom')
const dom = new JSDOM('<!doctype html><div id="app"></div>', { pretendToBeVisual: true, url: 'http://localhost/' })
for (const k of Object.getOwnPropertyNames(dom.window)) {
  if (k in globalThis) continue
  try { Object.defineProperty(globalThis, k, { value: dom.window[k], configurable: true, writable: true }) } catch {}
}
globalThis.window = dom.window; globalThis.self = dom.window; globalThis.document = dom.window.document
const errors = []
process.on('unhandledRejection', (e) => errors.push('unhandledRejection: ' + (e && e.message)))
const origErr = console.error; console.error = (...a) => errors.push('console.error: ' + a.map(String).join(' ').slice(0, 200))
const origWarn = console.warn; console.warn = (...a) => errors.push('console.warn: ' + a.map(String).join(' ').slice(0, 200))
let events = []
try {
  const { createApp, h } = require('vue')
  const { Vue3JsonEditor } = require('vue3-json-editor')
  const app = createApp({ render: () => h(Vue3JsonEditor, { modelValue: { a: 1 }, onProvideEditor: () => events.push('provide-editor') }) })
  app.config.warnHandler = (m) => errors.push('vue warn: ' + m)
  app.mount('#app')
} catch (e) { errors.push('throw: ' + e.message) }
setTimeout(() => {
  console.error = origErr; console.warn = origWarn
  console.log(JSON.stringify({ editorRendered: !!document.querySelector('.jsoneditor-vue .jsoneditor'), events, errors }, null, 1))
  process.exit(0)
}, 1500)
