import { Router } from 'express'
import { readMap, writeMap } from './mapStore.js'
import { TribortConfig, findMap } from './config.js'
import { generateInform7 } from './codegen.js'
import { spliceGenerated } from './sentinelWriter.js'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'

export function createRouter(projectDir: string, cfg: TribortConfig, serverWrites: Set<string>) {
  const router = Router()

  router.get('/config', (_req, res) => res.json(cfg))

  router.get('/maps', (_req, res) => {
    res.json(cfg.maps.map(m => ({ name: m.name, primary: m.primary })))
  })

  router.get('/map', async (req, res) => {
    try {
      const name = typeof req.query.name === 'string' ? req.query.name : undefined
      const entry = findMap(cfg, name)
      res.json(await readMap(projectDir, entry.path))
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      res.status(404).json({ error: msg })
    }
  })

  router.put('/map', async (req, res) => {
    try {
      const name = typeof req.query.name === 'string' ? req.query.name : undefined
      const entry = findMap(cfg, name)
      const mapData = req.body
      serverWrites.add(entry.path)
      await writeMap(projectDir, entry.path, mapData)

      if (entry.primary) {
        for (const gen of cfg.generators) {
          if (gen.target === 'inform7') {
            const generated = generateInform7(mapData)
            const outputPath = join(projectDir, gen.output)
            const existing = await readFile(outputPath, 'utf8')
            const updated = spliceGenerated(existing, gen.sentinelBegin, gen.sentinelEnd, generated)
            await writeFile(outputPath, updated, 'utf8')
          }
        }
      }

      res.json({ ok: true })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      res.status(500).json({ error: msg })
    }
  })

  return router
}
