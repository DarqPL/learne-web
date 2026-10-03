function pad(value: number): string {
  return String(value).padStart(2, '0')
}

export function toDatetimeLocalValue(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function fromDatetimeLocalValue(local: string): string {
  return new Date(local).toISOString()
}

export function parseIdList(text: string): number[] {
  const seen = new Set<number>()
  const ids: number[] = []
  for (const token of text.split(/[\s,]+/)) {
    if (!token) continue
    const value = Number(token)
    if (!Number.isInteger(value) || value <= 0 || seen.has(value)) continue
    seen.add(value)
    ids.push(value)
  }
  return ids
}

export function formatIdList(ids: number[]): string {
  return ids.join(', ')
}