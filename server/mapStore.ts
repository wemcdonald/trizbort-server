import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'

export async function readMap(projectDir: string, mapSource: string): Promise<unknown> {
  const p = join(projectDir, mapSource)
  return JSON.parse(await readFile(p, 'utf8'))
}

export async function writeMap(projectDir: string, mapSource: string, data: unknown): Promise<void> {
  const p = join(projectDir, mapSource)
  await writeFile(p, JSON.stringify(data, null, 2), 'utf8')
}
