// Contrato de tipos: um projeto TypeScript estrito consegue usar o pacote, com a versão do Vue
// instalada na bateria (rode a matriz com `npm run use-pkg -- <pkg> vue@3.2.47`).
import { test, expect } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cmp } from './helpers.mjs'

const require = createRequire(import.meta.url)
const pkg = require('vue3-json-editor/package.json')
const tsc = require.resolve('typescript/bin/tsc')
const root = fileURLToPath(new URL('..', import.meta.url))

// O projeto "do usuário" fica num diretório temporário fora do repositório, com o node_modules da
// bateria ligado por symlink (preserveSymlinks). Assim o TypeScript não enxerga o node_modules da
// raiz do repo — que tem outra versão do Vue — e a resolução é a de um app real.
function typecheck (compilerOptions) {
  const dir = mkdtempSync(join(tmpdir(), 'v3je-types-'))
  symlinkSync(join(root, 'node_modules'), join(dir, 'node_modules'), 'dir')
  copyFileSync(join(root, 'fixture/types/consumer.ts'), join(dir, 'consumer.ts'))
  writeFileSync(join(dir, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      target: 'ES2020',
      module: 'ESNext',
      moduleResolution: 'Bundler',
      strict: true,
      noEmit: true,
      preserveSymlinks: true,
      types: [],
      ...compilerOptions
    },
    files: ['consumer.ts']
  }))
  try {
    execFileSync(process.execPath, [tsc, '-p', join(dir, 'tsconfig.json')], { cwd: dir, encoding: 'utf8', stdio: 'pipe' })
    return { ok: true, out: '' }
  } catch (e) {
    return { ok: false, out: String(e.stdout || '') + String(e.stderr || '') }
  }
}

const vueVersion = require('vue/package.json').version

test.describe(`vue3-json-editor@${pkg.version} tipos (vue ${vueVersion})`, () => {
  test('compila num projeto TS estrito (skipLibCheck: true, padrão dos templates Vite)', () => {
    const r = typecheck({ skipLibCheck: true })
    expect(r.out).toBe('')
    expect(r.ok).toBe(true)
  })

  test('compila num projeto TS estrito (skipLibCheck: false)', () => {
    const r = typecheck({ skipLibCheck: false })
    expect(r.out).toBe('')
    expect(r.ok).toBe(true)
  })

  test('o .d.ts declara exatamente as props que o componente tem em runtime', () => {
    // a 1.1.5 tinha .d.ts gerado pelo build antigo (outro formato); vale a partir do .d.ts manual
    test.skip(cmp(pkg.version, '1.1.6') < 0, '.d.ts gerado pelo build antigo')
    const { Vue3JsonEditor } = require('vue3-json-editor')
    const runtimeProps = Object.keys(Vue3JsonEditor.props).sort()
    const dts = readFileSync(require.resolve('vue3-json-editor/dist/vue3-json-editor.d.ts'), 'utf8')
    // props declaradas = chaves no primeiro nível do objeto dentro de DefineComponent<{ ... }>
    const body = dts.slice(dts.indexOf('DefineComponent<'))
    const declared = []
    let depth = 0
    for (const line of body.split('\n')) {
      const m = depth === 1 && line.match(/^\s*([A-Za-z_$][\w$]*)\s*:/)
      if (m) declared.push(m[1])
      depth += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length
    }
    expect(declared.sort()).toEqual(runtimeProps)
  })
})
