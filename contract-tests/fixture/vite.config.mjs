import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  cacheDir: fileURLToPath(new URL('./.vite', import.meta.url)),
  logLevel: 'warn',
  // flags que um app Vue bem configurado define; sem elas o Vue emite um warning que não é do pacote
  define: {
    __VUE_OPTIONS_API__: 'true',
    __VUE_PROD_DEVTOOLS__: 'false',
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false'
  },
  server: { port: 5199, strictPort: true },
  preview: { port: 5199, strictPort: true }
})
