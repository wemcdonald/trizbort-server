import { describe, it, expect } from 'vitest'
import { loadConfig, normalizeConfig, findMap } from '../../server/config'
import { join } from 'path'

describe('loadConfig', () => {
  it('loads valid (legacy single-map) config', async () => {
    const cfg = await loadConfig(join(__dirname, 'fixtures/valid-project'))
    expect(cfg.maps).toHaveLength(1)
    expect(cfg.maps[0]).toEqual({ name: 'default', path: 'design/map.json', primary: true })
    expect(cfg.generators[0].target).toBe('inform7')
  })

  it('throws if config file missing', async () => {
    await expect(loadConfig('/nonexistent')).rejects.toThrow('trizbort.config.json not found')
  })
})

describe('normalizeConfig', () => {
  it('legacy mapSource becomes single primary map named "default"', () => {
    const cfg = normalizeConfig({ mapSource: 'design/map.json', generators: [] })
    expect(cfg.maps).toEqual([{ name: 'default', path: 'design/map.json', primary: true }])
  })

  it('explicit maps array with no primary marks first as primary', () => {
    const cfg = normalizeConfig({
      maps: [
        { name: 'a', path: 'a.json' },
        { name: 'b', path: 'b.json' },
      ],
      generators: [],
    })
    expect(cfg.maps[0].primary).toBe(true)
    expect(cfg.maps[1].primary).toBe(false)
  })

  it('respects explicit primary flag', () => {
    const cfg = normalizeConfig({
      maps: [
        { name: 'a', path: 'a.json' },
        { name: 'b', path: 'b.json', primary: true },
      ],
      generators: [],
    })
    expect(cfg.maps[0].primary).toBe(false)
    expect(cfg.maps[1].primary).toBe(true)
  })

  it('rejects two primary maps', () => {
    expect(() => normalizeConfig({
      maps: [
        { name: 'a', path: 'a.json', primary: true },
        { name: 'b', path: 'b.json', primary: true },
      ],
      generators: [],
    })).toThrow('only one map may be primary')
  })

  it('rejects duplicate map names', () => {
    expect(() => normalizeConfig({
      maps: [
        { name: 'a', path: 'a.json' },
        { name: 'a', path: 'b.json' },
      ],
      generators: [],
    })).toThrow('duplicate map name')
  })

  it('rejects empty config', () => {
    expect(() => normalizeConfig({ generators: [] })).toThrow('mapSource or maps')
  })
})

describe('findMap', () => {
  const cfg = normalizeConfig({
    maps: [
      { name: 'design', path: 'design/map.json', primary: true },
      { name: 'sorcerer', path: 'lore/sorcerer.json' },
    ],
    generators: [],
  })

  it('returns primary when name omitted', () => {
    expect(findMap(cfg).name).toBe('design')
  })

  it('returns named map', () => {
    expect(findMap(cfg, 'sorcerer').path).toBe('lore/sorcerer.json')
  })

  it('throws on unknown name', () => {
    expect(() => findMap(cfg, 'nope')).toThrow('unknown map')
  })
})
