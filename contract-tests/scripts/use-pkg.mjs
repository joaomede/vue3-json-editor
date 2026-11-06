// Troca o pacote sob teste (e/ou a versão do Vue) sem alterar o package.json.
//   npm run use-pkg -- 1.1.5                          -> versão publicada no npm
//   npm run use-pkg -- ../vue3-json-editor-1.2.0.tgz  -> build local empacotado com `npm pack`
//   npm run use-pkg -- <tgz ou versão> vue@3.2.47     -> combina com outra versão do Vue (matriz)
// Passe tudo numa chamada só: cada `npm install --no-save` desfaz o --no-save anterior.
import { execSync } from 'node:child_process'
import { resolve } from 'node:path'

const specs = process.argv.slice(2)
if (!specs.length) {
  console.error('uso: npm run use-pkg -- <versão | caminho.tgz> [pacote@versão ...]')
  process.exit(1)
}

const targets = specs.flatMap((spec) => {
  if (spec.endsWith('.tgz')) return [`"vue3-json-editor@file:${resolve(spec)}"`]
  if (/^\d/.test(spec)) return [`vue3-json-editor@${spec}`]
  // o Vue anterior ao 3.2.13 não traz o @vue/server-renderer: sem fixar a mesma versão, sobraria
  // o da instalação anterior (outra versão) e o teste de SSR misturaria dois Vues
  const vue = spec.match(/^vue@(.+)$/)
  if (vue) return [spec, `@vue/server-renderer@${vue[1]}`]
  return [spec]
})

execSync(`npm install --no-save --no-audit --no-fund ${targets.join(' ')}`, { stdio: 'inherit' })
execSync('node -p "\'vue3-json-editor \' + require(\'vue3-json-editor/package.json\').version + \' | vue \' + require(\'vue/package.json\').version"', { stdio: 'inherit' })
