import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

// `npm run dev`   -> demo em demo/, usando o código-fonte de components/
// `npm run build` -> biblioteca em dist/, em duas passadas:
//                    --mode development  => *.cjs.js / *.esm.js / *.umd.js (sem minificar)
//                    --mode production   => *.cjs.prod.js / *.esm.prod.js / *.umd.prod.js (minificados)
// Os nomes de arquivo, formatos e o global UMD fazem parte do contrato público do pacote.
const FORMAT_SUFFIX = { cjs: 'cjs', es: 'esm', umd: 'umd' } as const

// TEMPORÁRIO (some quando o jsoneditor vier do npm): no dev server o Vite serve o
// components/assets/jsoneditor.js (UMD) como ESM cru; isto o embrulha como CommonJS.
function vendoredUmdAsEsm () {
  return {
    name: 'vendored-umd-as-esm',
    apply: 'serve' as const,
    transform (code: string, id: string) {
      if (!id.includes('/components/assets/jsoneditor.js')) return
      return `const module = { exports: {} }; const exports = module.exports;\n${code}\nexport default module.exports;`
    }
  }
}

export default defineConfig(({ command, mode }) => {
  if (command === 'serve') {
    return {
      root: fileURLToPath(new URL('./demo', import.meta.url)),
      plugins: [vue(), vueJsx(), vendoredUmdAsEsm()]
    }
  }

  const prod = mode === 'production'
  return {
    // O CSS (jsoneditor + estilos do componente, com os ícones SVG inline) é importado como
    // string (`?inline`) e injetado pelo próprio componente — ver components/inject-style.ts.
    plugins: [vueJsx()],
    build: {
      outDir: 'dist',
      emptyOutDir: !prod, // a passada de produção roda depois e não apaga a de desenvolvimento
      // Vue 3 já exige um ambiente ES2015+ (Proxy), então este é o piso real dos usuários.
      target: 'es2015',
      minify: prod,
      sourcemap: false,
      lib: {
        entry: fileURLToPath(new URL('./components/index.ts', import.meta.url)),
        name: 'vue3-json-editor',
        formats: ['cjs', 'es', 'umd'],
        fileName: (format) => `vue3-json-editor.${FORMAT_SUFFIX[format as keyof typeof FORMAT_SUFFIX]}${prod ? '.prod' : ''}.js`
      },
      rollupOptions: {
        external: ['vue'],
        output: {
          exports: 'named',
          // a 1.1.5 (Rollup) emitia "use strict" no topo do CJS/UMD; manter a mesma semântica
          strict: true,
          globals: { vue: 'Vue' },
          extend: true
        }
      }
    }
  }
})
