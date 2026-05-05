export function spliceGenerated(
  source: string,
  beginMarker: string,
  endMarker: string,
  generated: string
): string {
  const beginComment = `[ === ${beginMarker} — DO NOT EDIT === ]`
  const endComment = `[ === ${endMarker} === ]`
  const beginIdx = source.indexOf(beginComment)
  const endIdx = source.indexOf(endComment)
  if (beginIdx === -1 || endIdx === -1) {
    throw new Error(`sentinel not found in source. Add:\n${beginComment}\n${endComment}`)
  }
  const before = source.slice(0, beginIdx + beginComment.length)
  const after = source.slice(endIdx)
  return `${before}\n${generated}\n${after}`
}
