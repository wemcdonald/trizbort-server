import express from 'express';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';
import { watch } from 'chokidar';
import { loadConfig } from './config.js';
import { createRouter } from './routes.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
async function main() {
    const projectDir = resolve(process.argv[2] ?? '.');
    const cfg = await loadConfig(projectDir);
    const app = express();
    app.use(express.json({ limit: '10mb' }));
    // SSE: registered before the API router so Express matches it first
    const sseClients = new Set();
    app.get('/api/events', (req, res) => {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();
        sseClients.add(res);
        req.on('close', () => sseClients.delete(res));
    });
    // Tracks writes made by this server so the watcher doesn't echo them back
    const serverWrites = new Set();
    app.use('/api', createRouter(projectDir, cfg, serverWrites));
    // Watch map.json for external changes, notify all SSE clients
    const mapPath = join(projectDir, cfg.mapSource);
    watch(mapPath, { ignoreInitial: true }).on('change', () => {
        if (serverWrites.delete(cfg.mapSource))
            return; // our own write — skip
        for (const client of sseClients) {
            client.write('data: reload\n\n');
        }
    });
    const distDir = join(__dirname, '../dist');
    // Serve index.html with injected server config
    app.get('/', async (_req, res) => {
        try {
            let html = await readFile(join(distDir, 'index.html'), 'utf8');
            html = html.replace('<head>', `<head><script>window.__TRIZBORT_SERVER__ = { apiBase: '/api' }</script>`);
            res.send(html);
        }
        catch {
            res.status(500).send('Client not built — run: npm run build');
        }
    });
    app.use('/app', express.static(distDir)); // Vite base: '/app/' — assets request /app/...
    app.use('/', express.static(distDir));
    app.get('/*path', (_req, res) => res.sendFile(join(distDir, 'index.html')));
    const port = Number(process.env.PORT ?? 3333);
    app.listen(port, '0.0.0.0', () => console.log(`trizbort-server running at http://0.0.0.0:${port}`));
}
main().catch(console.error);
//# sourceMappingURL=index.js.map