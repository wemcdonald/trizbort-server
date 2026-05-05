import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
export async function readMap(projectDir, mapSource) {
    const p = join(projectDir, mapSource);
    return JSON.parse(await readFile(p, 'utf8'));
}
export async function writeMap(projectDir, mapSource, data) {
    const p = join(projectDir, mapSource);
    await writeFile(p, JSON.stringify(data, null, 2), 'utf8');
}
//# sourceMappingURL=mapStore.js.map