import Handlebars from 'handlebars'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const templateDir = join(__dirname, '../src/codegen/inform7')

const mainTpl = Handlebars.compile(readFileSync(join(templateDir, 'inform7.handlebars'), 'utf8'))
const objTpl = Handlebars.compile(readFileSync(join(templateDir, 'inform7Object.handlebars'), 'utf8'))

Handlebars.registerPartial('inform7Object', objTpl)

Handlebars.registerHelper('validName', (str: string) => str?.replace(/[^a-zA-Z0-9 ]/g, '') ?? '')
Handlebars.registerHelper('capitalize', (str: unknown) => {
  if (!str || typeof str !== 'string' || str.length === 0) return ''
  return str[0].toUpperCase() + str.slice(1)
})

// ConnectorType enum: Default=0, In=1, Out=2, Up=3, Down=4
// Direction enum: N=0, NNE=1, NE=2, ... S=8, ... W=12, ... NW=14, NNW=15
const COMPASS = [
  'north','northnortheast','northeast','eastnortheast','east','eastsoutheast',
  'southeast','southsoutheast','south','southsouthwest','southwest','westsouthwest',
  'west','westnorthwest','northwest','northnorthwest'
]
// ObjectKind enum → I7 kind string (empty = default "thing", no kind declaration needed)
const OBJECT_KIND: Record<number, string> = {
  0: 'man',        // PersonMale
  1: 'woman',      // PersonFemale
  2: 'person',     // PersonNeuter
  3: '',           // ProperNamed — thing
  4: 'person',     // Actor
  5: '',           // Item — thing (default)
  6: 'scenery',    // Scenery
  7: 'supporter',  // Supporter
  8: 'container',  // Container
  9: '',           // SingularNamed
  10: '',          // PluralNamed
}

Handlebars.registerHelper('dirToStr', (dir: number, type: number) => {
  switch (type) {
    case 1: return 'inside'
    case 2: return 'outside'
    case 3: return 'up'
    case 4: return 'down'
  }
  return COMPASS[dir] ?? 'north'
})

interface RawElement {
  _type: string
  id: number
  _name?: string
  _description?: string
  _dark?: boolean
  _dockStart?: number
  _dockEnd?: number
  _startDir?: number
  _endDir?: number
  _startType?: number
  _endType?: number
  _oneWay?: boolean
  _name_conn?: string
  objects?: unknown[]
}

function buildConnections(roomId: number, elements: RawElement[]) {
  const roomMap = new Map(
    elements.filter(e => e._type === 'Room').map(r => [r.id, r])
  )
  return elements
    .filter(e =>
      e._type === 'Connector' &&
      e._dockStart != null && e._dockStart !== 0 &&
      e._dockEnd != null && e._dockEnd !== 0 &&
      (e._dockStart === roomId || e._dockEnd === roomId)
    )
    .map(conn => {
      if (conn._dockStart === roomId) {
        const other = roomMap.get(conn._dockEnd!)
        return {
          startDir: conn._startDir ?? 0,
          startType: conn._startType ?? 0,
          endDir: conn._endDir ?? 8,
          endType: conn._endType ?? 0,
          room: { name: other?._name ?? '?' },
          name: (conn as any)._name ?? ''
        }
      } else {
        const other = roomMap.get(conn._dockStart!)
        return {
          startDir: conn._endDir ?? 8,
          startType: conn._endType ?? 0,
          endDir: conn._startDir ?? 0,
          endType: conn._startType ?? 0,
          room: { name: other?._name ?? '?' },
          name: (conn as any)._name ?? ''
        }
      }
    })
}

export function generateInform7(rawMap: any): string {
  const elements: RawElement[] = rawMap.elements ?? []
  const startRoomId = rawMap.startRoom ?? null

  const rooms = elements
    .filter(e => e._type === 'Room')
    .map(r => ({
      id: r.id,
      name: r._name ?? '',
      description: r._description ?? '',
      dark: r._dark ?? false,
      isStart: r.id === startRoomId,
      objects: (r.objects ?? []).map((o: any) => ({
        name: o._name ?? o.name ?? '',
        kind: OBJECT_KIND[o._kind ?? o.kind] ?? '',
        description: o._description ?? o.description ?? '',
        content: []
      })),
      connections: buildConnections(r.id, elements)
    }))

  Handlebars.registerHelper('isStartRoom', (room: any) => room.isStart === true)

  const full = mainTpl({ map: { title: rawMap.title, author: rawMap.author, rooms } })
  // Strip the title/author declaration line — story.ni already declares it
  return full.replace(/^"[^"]*".*\n/, '').trimStart()
}
