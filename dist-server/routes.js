import { Router } from 'express';
import { readMap, writeMap } from './mapStore.js';
import { generateInform7 } from './codegen.js';
import { spliceGenerated } from './sentinelWriter.js';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
export function createRouter(projectDir, cfg, serverWrites) {
    const router = Router();
    router.get('/config', (_req, res) => res.json(cfg));
    router.get('/map', async (_req, res) => {
        try {
            res.json(await readMap(projectDir, cfg.mapSource));
        }
        catch {
            res.status(404).json({ error: 'map not found' });
        }
    });
    router.put('/map', async (req, res) => {
        try {
            const mapData = req.body;
            serverWrites.add(cfg.mapSource);
            await writeMap(projectDir, cfg.mapSource, mapData);
            for (const gen of cfg.generators) {
                if (gen.target === 'inform7') {
                    const generated = generateInform7(mapData);
                    const outputPath = join(projectDir, gen.output);
                    const existing = await readFile(outputPath, 'utf8');
                    const updated = spliceGenerated(existing, gen.sentinelBegin, gen.sentinelEnd, generated);
                    await writeFile(outputPath, updated, 'utf8');
                }
            }
            res.json({ ok: true });
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            res.status(500).json({ error: msg });
        }
    });
    return router;
}
//# sourceMappingURL=routes.js.map