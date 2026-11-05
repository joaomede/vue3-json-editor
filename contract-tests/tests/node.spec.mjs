// Contrato em Node: o pacote precisa carregar fora do browser (SSR/Nuxt, test runners em ambiente node)
// e renderizar no servidor sem erro. Referência: 1.1.5 publicada.
import { test, expect } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const pkg = require('vue3-json-editor/package.json')

// Cada verificação roda num processo Node limpo, como um app real carregaria o pacote.
function runNode (code, { esm = false } = {}) {
  const args = esm ? ['--input-type=module', '-e', code] : ['-e', code]
  try {
    return { ok: true, out: execFileSync(process.execPath, args, { encoding: 'utf8', stdio: 'pipe' }).trim() }
  } catch (e) {
    return { ok: false, out: String(e.stderr || e.message) }
  }
}

test.describe(`vue3-json-editor@${pkg.version} em Node`, () => {
  test('package.json: entradas do pacote apontam para os arquivos do contrato', () => {
    expect(pkg.main).toBe('dist/vue3-json-editor.cjs.prod.js')
    expect(pkg.module).toBe('dist/vue3-json-editor.esm.prod.js')
    expect(pkg.unpkg).toBe('dist/vue3-json-editor.umd.prod.js')
    expect(pkg.typings).toBe('dist/index.d.ts')
  })

  test('package.json: não declara "type": "module" com main CJS (quebraria import em Node)', () => {
    const mainIsCjs = !pkg.main.endsWith('.mjs')
    if (mainIsCjs) expect(pkg.type).not.toBe('module')
  })

  test('arquivos do dist citados no contrato existem', () => {
    for (const f of [
      'dist/vue3-json-editor.cjs.js', 'dist/vue3-json-editor.cjs.prod.js',
      'dist/vue3-json-editor.esm.js', 'dist/vue3-json-editor.esm.prod.js',
      'dist/vue3-json-editor.umd.js', 'dist/vue3-json-editor.umd.prod.js',
      'dist/index.d.ts'
    ]) {
      expect(() => require.resolve(`vue3-json-editor/${f}`), f).not.toThrow()
    }
  })

  test('require() carrega e expõe Vue3JsonEditor', () => {
    const r = runNode("const m = require('vue3-json-editor'); console.log(typeof m.Vue3JsonEditor, typeof m.Vue3JsonEditor.setup)")
    expect(r.out).toBe('object function')
    expect(r.ok).toBe(true)
  })

  test('import() carrega e expõe Vue3JsonEditor', () => {
    const r = runNode("const m = await import('vue3-json-editor'); console.log(typeof m.Vue3JsonEditor)", { esm: true })
    expect(r.out).toBe('object')
    expect(r.ok).toBe(true)
  })

  test('SSR: renderToString funciona, sem warnings, com o markup esperado', () => {
    const r = runNode(`
      const { createSSRApp, h } = require('vue')
      const { renderToString } = require('vue/server-renderer')
      const { Vue3JsonEditor } = require('vue3-json-editor')
      const warns = []
      const render = (props) => {
        const app = createSSRApp({ render: () => h(Vue3JsonEditor, { modelValue: { a: 1 }, ...props }) })
        app.config.warnHandler = (m) => warns.push(m)
        return renderToString(app)
      }
      Promise.all([render({}), render({ showBtns: true }), render({ showBtns: true, lang: 'zh' })])
        .then((html) => console.log(JSON.stringify({ html, warns })))
        .catch((e) => { console.error(e); process.exit(1) })
    `)
    expect(r.ok, r.out).toBe(true)
    const { html, warns } = JSON.parse(r.out)
    expect(warns).toEqual([])
    // sem show-btns: botão oculto (contrato real, apesar da README dizer default true)
    expect(html[0]).toMatch(/^<div><div id="jsoneditor-vue-\d+" class="jsoneditor-vue"><\/div><!----><\/div>$/)
    expect(html[1]).toContain('<div class="jsoneditor-btns"><button class="json-save-btn" type="button">SAVE</button></div>')
    expect(html[2]).toContain('>保存</button>')
  })
})
