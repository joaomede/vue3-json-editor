// Troca o pacote sob teste sem alterar o package.json.
//   npm run use-pkg -- 1.1.5                 -> versão publicada no npm
//   npm run use-pkg -- ../vue3-json-editor-1.2.0.tgz  -> build local empacotado com `npm pack`
//   npm run use-pkg -- vue@3.2.47           -> troca a versão do Vue (matriz)
import { execSync } from 'node:child_process'
import { resolve } from 'node:path'

const spec = process.argv[2]
if (!spec) {
  console.error('uso: npm run use-pkg -- <versão | caminho.tgz | pacote@versão>')
  process.exit(1)
}

let target
if (spec.endsWith('.tgz')) target = `vue3-json-editor@file:${resolve(spec)}`
else if (/^\d/.test(spec)) target = `vue3-json-editor@${spec}`
else target = spec

execSync(`npm install --no-save --no-audit --no-fund ${target}`, { stdio: 'inherit' })
execSync('node -p "\'vue3-json-editor \' + require(\'vue3-json-editor/package.json\').version + \' | vue \' + require(\'vue/package.json\').version"', { stdio: 'inherit' })
