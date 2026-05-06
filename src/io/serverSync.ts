export interface MapInfo {
  name: string
  primary: boolean
}

export function isServerMode(): boolean {
  return typeof (window as any).__TRIZBORT_SERVER__ !== 'undefined'
}

function apiBase(): string {
  return (window as any).__TRIZBORT_SERVER__.apiBase
}

export async function listMaps(): Promise<MapInfo[]> {
  const resp = await fetch(`${apiBase()}/maps`)
  if (!resp.ok) throw new Error('Failed to list maps')
  return resp.json()
}

export async function loadMapFromServer(name?: string): Promise<string> {
  const url = name ? `${apiBase()}/map?name=${encodeURIComponent(name)}` : `${apiBase()}/map`
  const resp = await fetch(url)
  if (!resp.ok) throw new Error('Failed to load map from server')
  return resp.text()
}

export async function saveMapToServer(json: string, name?: string): Promise<void> {
  const url = name ? `${apiBase()}/map?name=${encodeURIComponent(name)}` : `${apiBase()}/map`
  const resp = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: json
  })
  if (!resp.ok) throw new Error('Failed to save map to server')
}

export function watchServerMap(onReload: (name: string) => void): void {
  if (!isServerMode()) return
  const es = new EventSource('/api/events')
  es.onmessage = (e) => {
    const data: string = e.data
    if (data.startsWith('reload:')) onReload(data.slice('reload:'.length))
    else if (data === 'reload') onReload('')  // legacy
  }
}

export function getActiveMapName(): string | null {
  const m = window.location.hash.match(/[#&]map=([^&]+)/)
  return m ? decodeURIComponent(m[1]) : null
}

export function setActiveMapName(name: string): void {
  window.location.hash = `map=${encodeURIComponent(name)}`
}
