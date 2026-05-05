import { describe, it, expect } from 'vitest'
import { readMap, writeMap } from '../../server/mapStore'
import { join } from 'path'
import { readFile } from 'fs/promises'

const fixture = join(__dirname, 'fixtures/valid-project')

describe('mapStore', () => {
  it('reads map JSON', async () => {
    const map = await readMap(fixture, 'design/map.json')
    expect(map).toHaveProperty('title')
  })

  it('writes map JSON pretty-printed', async () => {
    const map = { title: 'test', author: '', elements: [], startRoom: null, settings: {} }
    await writeMap(fixture, 'design/map.json', map)
    const raw = await readFile(join(fixture, 'design/map.json'), 'utf8')
    expect(raw).toContain('\n')
    expect(JSON.parse(raw).title).toBe('test')
  })
})
