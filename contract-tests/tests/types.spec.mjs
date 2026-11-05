// Contrato de tipos: um projeto TypeScript estrito consegue usar o pacote.
import { test, expect } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const pkg = require('vue3-json-editor/package.json')
const tsc = require.resolve('typescript/bin/tsc')
const consumer = fileURLToPath(new URL('../fixture/types/consumer.ts', import.meta.url))
const root = fileURLToPath(new URL('..', import.meta.url))

function typecheck (compilerOptions) {
  const dir = mkdtempSync(join(tmpdir(), 'v3je-types-'))
  const tsconfig = join(dir, 'tsconfig.json')
  writeFileSync(tsconfig, JSON.stringify({
    compilerOptions: {
      target: 'ES2020',
      module: 'ESNext',
      moduleResolution: 'Bundler',
      strict: true,
      noEmit: true,
      typeRoots: [join(root, 'node_modules/@types')],
      ...compilerOptions
    },
    files: [consumer]
  }))
  try {
    execFileSync(process.execPath, [tsc, '-p', tsconfig], { cwd: root, encoding: 'utf8', stdio: 'pipe' })
    return { ok: true, out: '' }
  } catch (e) {
    return { ok: false, out: String(e.stdout || '') + String(e.stderr || '') }
  }
}

test.describe(`vue3-json-editor@${pkg.version} tipos`, () => {
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
})
