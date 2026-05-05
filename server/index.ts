import express from 'express'
import { join, resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { readFile } from 'fs/promises'
import { loadConfig } from './config.js'
import { createRouter } from './routes.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function main() {
  const projectDir = resolve(process.argv[2] ?? '.')
  const cfg = await loadConfig(projectDir)

  const app = express()
  app.use(express.json({ limit: '10mb' }))
  app.use('/api', createRouter(projectDir, cfg))

  const distDir = join(__dirname, '../dist')

  // Serve index.html with injected server config
  app.get('/', async (_req, res) => {
    try {
      let html = await readFile(join(distDir, 'index.html'), 'utf8')
      html = html.replace(
        '<head>',
        `<head><script>window.__TRIZBORT_SERVER__ = { apiBase: '/api' }</script>`
      )
      res.send(html)
    } catch {
      res.status(500).send('Client not built — run: npm run build')
    }
  })

  app.use('/', express.static(distDir))

  app.get('*', (_req, res) => res.sendFile(join(distDir, 'index.html')))

  const port = process.env.PORT ?? 3333
  app.listen(port, () => console.log(`trizbort-server running at http://localhost:${port}`))
}

main().catch(console.error)
