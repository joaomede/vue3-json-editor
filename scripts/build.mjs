// Build da biblioteca: typecheck + 4 passadas do vite.config.mts + tipos públicos.
//   development/production × modules (cjs+esm, jsoneditor externo) / umd (autocontido)
import { execSync } from 'node:child_process'
import { copyFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'

const root = fileURLToPath(new URL('..', import.meta.url))

// verifica os tipos do código-fonte (não emite nada)
execSync('npx tsc -p tsconfig.json --noEmit', { cwd: root, stdio: 'inherit' })

const passes = [
  { mode: 'development', formats: 'modules' },
  { mode: 'development', formats: 'umd' },
  { mode: 'production', formats: 'modules' },
  { mode: 'production', formats: 'umd' }
]

for (const [i, { mode, formats }] of passes.entries()) {
  process.env.V3JE_FORMATS = formats
  process.env.V3JE_EMPTY_OUT_DIR = String(i === 0)
  await build({ root, mode, logLevel: 'warn' })
}

// tipos públicos escritos à mão (ver types/vue3-json-editor.d.ts)
for (const f of ['index.d.ts', 'vue3-json-editor.d.ts']) {
  copyFileSync(join(root, 'types', f), join(root, 'dist', f))
}
console.log('build ok')
