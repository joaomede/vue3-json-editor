// Contrato em Node: o pacote precisa carregar fora do browser (SSR/Nuxt, test runners em ambiente node)
// e renderizar no servidor sem erro. Referência: 1.2.0 publicada (antes: 1.1.5).
import { test, expect } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { fixedIn } from './helpers.mjs'

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

  // #18 #29: com `vue` em dependencies (1.1.5), um app cujo Vue não satisfaz o range ganha uma
  // segunda cópia do Vue dentro do pacote; o componente roda no "Vue errado": onMounted nunca
  // dispara (editor não aparece, id "jsoneditor-vue-undefined") e expandedOnStart lança
  // "Cannot read properties of null (reading 'expandAll')".
  test('#18 #29 vue é peerDependency (nunca dependency): o pacote usa o Vue do app', () => {
    fixedIn('1.1.6')
    expect(pkg.dependencies?.vue).toBeUndefined()
    expect(pkg.peerDependencies?.vue).toBeTruthy()
  })

  test('#18 #29 o pacote resolve a mesma cópia do Vue que o app', () => {
    const fromPkg = createRequire(require.resolve('vue3-json-editor/package.json')).resolve('vue')
    expect(fromPkg).toBe(require.resolve('vue'))
  })

  // #21: a 1.1.5 embutia o core-js no bundle (com `1..toString`), que o minificador do build do
  // usuário reescrevia como `1.toString` (SyntaxError em produção)
  test('#21 o dist não embute core-js', () => {
    fixedIn('1.1.6')
    for (const f of ['cjs', 'cjs.prod', 'esm', 'esm.prod', 'umd', 'umd.prod']) {
      const code = readFileSync(require.resolve(`vue3-json-editor/dist/vue3-json-editor.${f}.js`), 'utf8')
      expect(code, f).not.toContain('__core-js_shared__')
      expect(code, f).not.toMatch(/\b1\.\.toString\b/)
    }
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

  test('jsdom via CommonJS (como num teste Jest do app): monta e cria o editor sem erros', () => {
    // Só carregar o jsdom leva ~28 s com o repo em /mnt/d (WSL): quase todo o tempo é stat de arquivo
    // no disco do Windows, não o pacote. Limite folgado para não falhar com a bateria em paralelo.
    test.setTimeout(120_000)
    const script = fileURLToPath(new URL('../fixture/jsdom-mount.cjs', import.meta.url))
    let out
    try {
      out = execFileSync(process.execPath, [script], { encoding: 'utf8', stdio: 'pipe', timeout: 100_000 })
    } catch (e) {
      throw new Error(String(e.stdout) + String(e.stderr))
    }
    const r = JSON.parse(out)
    expect(r.errors).toEqual([])
    expect(r.editorRendered).toBe(true)
  })

  test('SSR: renderToString funciona, sem warnings, com o markup esperado', () => {
    // Limitação do próprio Vue em versões antigas (ex.: 3.2.0): no SSR, getCurrentInstance().uid é
    // undefined até num componente vazio, e o id sai "jsoneditor-vue-undefined". Checado no Vue
    // instalado, não por lista de versões, para não esconder bug do pacote.
    const bare = runNode(`
      const { createSSRApp, h, getCurrentInstance, defineComponent } = require('vue')
      const { renderToString } = require('vue/server-renderer')
      const C = defineComponent({ setup () { const i = getCurrentInstance(); return () => h('i', String(i && i.uid)) } })
      renderToString(createSSRApp({ render: () => h(C) })).then(console.log)
    `)
    const vueSsrUid = /<i>\d+<\/i>/.test(bare.out)
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
    const id = vueSsrUid ? '\\d+' : 'undefined'
    expect(html[0]).toMatch(new RegExp(`^<div><div id="jsoneditor-vue-${id}" class="jsoneditor-vue"></div><!----></div>$`))
    expect(html[1]).toContain('<div class="jsoneditor-btns"><button class="json-save-btn" type="button">SAVE</button></div>')
    expect(html[2]).toContain('>保存</button>')
  })
})
