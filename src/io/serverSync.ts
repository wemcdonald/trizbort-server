export function isServerMode(): boolean {
  return typeof (window as any).__TRIZBORT_SERVER__ !== 'undefined'
}

export async function loadMapFromServer(): Promise<string> {
  const { apiBase } = (window as any).__TRIZBORT_SERVER__
  const resp = await fetch(`${apiBase}/map`)
  if (!resp.ok) throw new Error('Failed to load map from server')
  return resp.text()
}

export async function saveMapToServer(json: string): Promise<void> {
  const { apiBase } = (window as any).__TRIZBORT_SERVER__
  const resp = await fetch(`${apiBase}/map`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: json
  })
  if (!resp.ok) throw new Error('Failed to save map to server')
}

export function watchServerMap(onReload: () => void): void {
  if (!isServerMode()) return
  const es = new EventSource('/api/events')
  es.onmessage = (e) => { if (e.data === 'reload') onReload() }
}
