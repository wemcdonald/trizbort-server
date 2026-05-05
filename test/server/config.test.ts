import { describe, it, expect } from 'vitest'
import { loadConfig } from '../../server/config'
import { join } from 'path'

describe('loadConfig', () => {
  it('loads valid config', async () => {
    const cfg = await loadConfig(join(__dirname, 'fixtures/valid-project'))
    expect(cfg.mapSource).toBe('design/map.json')
    expect(cfg.generators[0].target).toBe('inform7')
    expect(cfg.generators[0].output).toBe('src/egreth.inform/Source/story.ni')
    expect(cfg.generators[0].sentinelBegin).toBe('BEGIN GENERATED MAP')
    expect(cfg.generators[0].sentinelEnd).toBe('END GENERATED MAP')
  })

  it('throws if config file missing', async () => {
    await expect(loadConfig('/nonexistent')).rejects.toThrow('trizbort.config.json not found')
  })
})
