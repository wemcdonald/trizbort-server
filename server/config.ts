import { readFile } from 'fs/promises'
import { join } from 'path'

export interface GeneratorConfig {
  target: 'inform7'
  output: string
  sentinelBegin: string
  sentinelEnd: string
}

export interface MapEntry {
  name: string
  path: string
  primary: boolean
}

export interface TribortConfig {
  maps: MapEntry[]
  generators: GeneratorConfig[]
}

interface RawConfig {
  mapSource?: string
  maps?: Array<{ name: string; path: string; primary?: boolean }>
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
  const parsed = JSON.parse(raw) as RawConfig
  return normalizeConfig(parsed)
}

export function normalizeConfig(raw: RawConfig): TribortConfig {
  let maps: MapEntry[]

  if (raw.maps && raw.maps.length > 0) {
    const seenNames = new Set<string>()
    for (const m of raw.maps) {
      if (!m.name || !m.path) throw new Error('each map entry needs name and path')
      if (seenNames.has(m.name)) throw new Error(`duplicate map name: ${m.name}`)
      seenNames.add(m.name)
    }
    const explicitPrimary = raw.maps.filter(m => m.primary)
    if (explicitPrimary.length > 1) throw new Error('only one map may be primary')
    maps = raw.maps.map((m, i) => ({
      name: m.name,
      path: m.path,
      primary: explicitPrimary.length > 0 ? !!m.primary : i === 0,
    }))
  } else if (raw.mapSource) {
    maps = [{ name: 'default', path: raw.mapSource, primary: true }]
  } else {
    throw new Error('config must define either mapSource or maps')
  }

  return { maps, generators: raw.generators ?? [] }
}

export function findMap(cfg: TribortConfig, name?: string): MapEntry {
  if (!name) {
    const primary = cfg.maps.find(m => m.primary)
    if (!primary) throw new Error('no primary map configured')
    return primary
  }
  const m = cfg.maps.find(m => m.name === name)
  if (!m) throw new Error(`unknown map: ${name}`)
  return m
}
