import { readFile } from 'fs/promises';
import { join } from 'path';
export async function loadConfig(projectDir) {
    const cfgPath = join(projectDir, 'trizbort.config.json');
    let raw;
    try {
        raw = await readFile(cfgPath, 'utf8');
    }
    catch {
        throw new Error(`trizbort.config.json not found at ${cfgPath}`);
    }
    return JSON.parse(raw);
}
//# sourceMappingURL=config.js.map