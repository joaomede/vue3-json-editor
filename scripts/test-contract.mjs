// Valida o pacote como um usuário o receberia:
//   1. build (a menos que --no-build)
//   2. `npm pack` (aplica "files" do package.json, igual ao publish)
//   3. instala o .tgz em contract-tests/ e roda a bateria de contrato
//
// Opções:
//   --no-build             usa o dist/ atual
//   --vue=3.2.47,3.5.45    roda a bateria uma vez para cada versão do Vue (matriz)
// Demais argumentos vão para o Playwright (ex.: --project=node, -g "UMD").
// Ao final, a bateria volta para a referência (1.1.5 publicada) se tudo passar.
import { execSync } from 'node:child_process'
import { mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const contract = join(root, 'contract-tests')
const args = process.argv.slice(2)
const noBuild = args.includes('--no-build')
const vueArg = args.find((a) => a.startsWith('--vue='))
const vueVersions = vueArg ? vueArg.slice('--vue='.length).split(',') : [null]
// cada argumento vai entre aspas para o shell não interpretar caracteres como `#` ou `|`
const pwArgs = args.filter((a) => a !== '--no-build' && a !== vueArg).map((a) => JSON.stringify(a)).join(' ')
const run = (cmd, cwd = root) => execSync(cmd, { cwd, stdio: 'inherit' })

if (!noBuild) run('npm run build')

const packDir = mkdtempSync(join(tmpdir(), 'v3je-pack-'))
run(`npm pack --silent --pack-destination "${packDir}"`)
const tgz = join(packDir, readdirSync(packDir).find((f) => f.endsWith('.tgz')))

for (const vue of vueVersions) {
  run(`npm run -s use-pkg -- "${tgz}"${vue ? ` vue@${vue}` : ''}`, contract)
  rmSync(join(contract, 'fixture/.vite'), { recursive: true, force: true }) // força o Vite a re-otimizar
  run(`npx playwright test ${pwArgs}`, contract)
}

run('npm run -s use-pkg -- 1.1.5', contract)
rmSync(join(contract, 'fixture/.vite'), { recursive: true, force: true })
