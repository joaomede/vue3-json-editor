import { createReadStream, existsSync, statSync } from 'node:fs'
import { join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const nodeModules = fileURLToPath(new URL('../node_modules', import.meta.url))

// Serve arquivos crus de node_modules em /__nm/* — simula o uso via CDN (unpkg) sem bundler.
function serveNodeModules () {
  return {
    name: 'serve-node-modules',
    configureServer (server) {
      server.middlewares.use('/__nm', (req, res, next) => {
        const file = normalize(join(nodeModules, decodeURIComponent(req.url.split('?')[0])))
        if (!file.startsWith(nodeModules) || !existsSync(file) || !statSync(file).isFile()) return next()
        res.setHeader('Content-Type', 'application/javascript')
        createReadStream(file).pipe(res)
      })
    }
  }
}

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  cacheDir: fileURLToPath(new URL('./.vite', import.meta.url)),
  logLevel: 'warn',
  plugins: [serveNodeModules()],
  // flags que um app Vue bem configurado define; sem elas o Vue emite um warning que não é do pacote
  define: {
    __VUE_OPTIONS_API__: 'true',
    __VUE_PROD_DEVTOOLS__: 'false',
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false'
  },
  server: { port: 5199, strictPort: true },
  preview: { port: 5199, strictPort: true }
})
