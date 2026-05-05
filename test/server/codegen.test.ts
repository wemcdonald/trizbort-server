import { describe, it, expect } from 'vitest'
import { generateInform7 } from '../../server/codegen'

// Raw Trizbort JSON format (as produced by MapJSON.save on the client)
const minimalMap = {
  title: 'Test',
  author: 'Tester',
  elements: [
    {
      _type: 'Room',
      id: 1,
      _name: 'Kitchen',
      _dark: false,
      _description: 'A small kitchen.',
      objects: []
    }
  ],
  startRoom: 1,
  settings: {}
}

describe('generateInform7', () => {
  it('emits room name and description', () => {
    const out = generateInform7(minimalMap)
    expect(out).toContain('Kitchen is a room')
    expect(out).toContain('A small kitchen.')
  })

  it('emits player start room', () => {
    const out = generateInform7(minimalMap)
    expect(out).toContain('The player is in Kitchen')
  })
})
