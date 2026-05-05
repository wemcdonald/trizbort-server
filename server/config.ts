import { readFile } from 'fs/promises'
import { join } from 'path'

export interface GeneratorConfig {
  target: 'inform7'
  output: string
  sentinelBegin: string
  sentinelEnd: string
}

export interface TribortConfig {
  mapSource: string
  generators: GeneratorConfig[]
}

export async function loadConfig(projectDir: string): Promise<TribortConfig> {
  const cfgPath = join(projectDir, 'trizbort.config.json')
  let raw: string
  try {
    raw = await readFile(cfgPath, 'utf8')
  } catch {
    throw new Error(`trizbort.config.json not found at ${cfgPath}`)
  }
  return JSON.parse(raw) as TribortConfig
}
