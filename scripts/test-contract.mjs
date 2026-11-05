// Valida o pacote como um usuário o receberia:
//   1. build (a menos que --no-build)
//   2. `npm pack` (aplica "files" do package.json, igual ao publish)
//   3. instala o .tgz em contract-tests/ e roda a bateria de contrato
// Argumentos extras são repassados ao Playwright (ex.: --project=node, -g "UMD").
// Ao final, contract-tests/ continua com o build local instalado; para voltar à referência:
//   cd contract-tests && npm run use-pkg -- 1.1.5
import { execSync } from 'node:child_process'
import { mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const contract = join(root, 'contract-tests')
const args = process.argv.slice(2)
const noBuild = args.includes('--no-build')
const pwArgs = args.filter((a) => a !== '--no-build').join(' ')
const run = (cmd, cwd = root) => execSync(cmd, { cwd, stdio: 'inherit' })

if (!noBuild) run('npm run build')

const packDir = mkdtempSync(join(tmpdir(), 'v3je-pack-'))
run(`npm pack --silent --pack-destination "${packDir}"`)
const tgz = join(packDir, readdirSync(packDir).find((f) => f.endsWith('.tgz')))

run(`npm run -s use-pkg -- "${tgz}"`, contract)
rmSync(join(contract, 'fixture/.vite'), { recursive: true, force: true }) // força o Vite a re-otimizar o pacote novo
run(`npx playwright test ${pwArgs}`, contract)
