import { describe, it, expect } from 'vitest'
import { spliceGenerated } from '../../server/sentinelWriter'

const STORY = `"Egreth" by "Will McDonald".

The player is in Antechamber.

[ === BEGIN GENERATED MAP — DO NOT EDIT === ]
The Antechamber is a room.
[ === END GENERATED MAP === ]

[ rules and actions below ]
Listing exits is an action out of world.
`

describe('spliceGenerated', () => {
  it('replaces content between sentinels', () => {
    const result = spliceGenerated(STORY, 'BEGIN GENERATED MAP', 'END GENERATED MAP', 'The Kitchen is a room.')
    expect(result).toContain('The Kitchen is a room.')
    expect(result).not.toContain('The Antechamber is a room.')
    expect(result).toContain('Listing exits is an action')
  })

  it('throws if sentinels missing', () => {
    expect(() => spliceGenerated('no sentinels here', 'BEGIN', 'END', 'x')).toThrow('sentinel')
  })
})
