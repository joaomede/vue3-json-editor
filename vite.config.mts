import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

// `npm run dev`   -> demo em demo/, usando o código-fonte de components/
// `npm run build` -> scripts/build.mjs roda 4 passadas desta config:
//     mode development | production   => sem minificar | minificado (*.prod.js)
//     V3JE_FORMATS=modules            => cjs + esm, com `jsoneditor` externo (dependência do pacote)
//     V3JE_FORMATS=umd                => umd autocontido (jsoneditor embutido), para uso via <script>
// Os nomes de arquivo, formatos e o global UMD fazem parte do contrato público do pacote.
const FORMAT_SUFFIX = { cjs: 'cjs', es: 'esm', umd: 'umd' } as const

export default defineConfig(({ command, mode }) => {
  if (command === 'serve') {
    return {
      root: fileURLToPath(new URL('./demo', import.meta.url)),
      plugins: [vue(), vueJsx()]
    }
  }

  const prod = mode === 'production'
  const umd = process.env.V3JE_FORMATS === 'umd'
  return {
    // O CSS (jsoneditor + estilos do componente, com os ícones SVG inline) é importado como
    // string (`?inline`) e injetado pelo próprio componente — ver components/inject-style.ts.
    plugins: [vueJsx()],
    build: {
      outDir: 'dist',
      emptyOutDir: process.env.V3JE_EMPTY_OUT_DIR === 'true',
      // Vue 3 já exige um ambiente ES2015+ (Proxy), então este é o piso real dos usuários.
      target: 'es2015',
      minify: prod,
      sourcemap: false,
      lib: {
        entry: fileURLToPath(new URL('./components/index.ts', import.meta.url)),
        name: 'vue3-json-editor',
        formats: umd ? ['umd'] : ['cjs', 'es'],
        fileName: (format) => `vue3-json-editor.${FORMAT_SUFFIX[format as keyof typeof FORMAT_SUFFIX]}${prod ? '.prod' : ''}.js`
      },
      rollupOptions: {
        external: umd ? ['vue'] : ['vue', 'jsoneditor'],
        output: {
          exports: 'named',
          // a 1.1.5 (Rollup) emitia "use strict" no topo do CJS/UMD; manter a mesma semântica
          strict: true,
          globals: { vue: 'Vue' },
          extend: true,
          // no CJS o import dinâmico do jsoneditor vira `require()`: `import()` dentro de CommonJS
          // falha em runners como o Jest sem --experimental-vm-modules
          dynamicImportInCjs: false
        }
      }
    }
  }
})
