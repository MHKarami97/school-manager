export type PlainRecord = Record<string, unknown>

export function clonePlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function getPath(record: PlainRecord, path: string): unknown {
  let current: unknown = record
  for (const part of path.split('.')) {
    if (current === null || typeof current !== 'object') return undefined
    current = (current as PlainRecord)[part]
  }
  return current
}

export function setPath(record: PlainRecord, path: string, value: unknown): void {
  const parts = path.split('.')
  let current = record
  for (let index = 0; index < parts.length - 1; index += 1) {
    const next = current[parts[index]]
    if (next === null || typeof next !== 'object' || Array.isArray(next)) current[parts[index]] = {}
    current = current[parts[index]] as PlainRecord
  }
  current[parts[parts.length - 1]] = value
}

export function deletePath(record: PlainRecord, path: string): void {
  const parts = path.split('.')
  let current: unknown = record
  for (let index = 0; index < parts.length - 1; index += 1) {
    if (current === null || typeof current !== 'object') return
    current = (current as PlainRecord)[parts[index]]
  }
  if (current !== null && typeof current === 'object') delete (current as PlainRecord)[parts[parts.length - 1]]
}

export function isEmptyValue(value: unknown): boolean {
  return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)
}

/** اگر همه‌ی فیلدهای یک شیء تو در تو خالی باشند، خود شیء حذف می‌شود (مثل آدرس دوم والدین). */
export function dropEmptyObject(record: PlainRecord, path: string): void {
  const value = getPath(record, path)
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return
  if (Object.values(value as PlainRecord).every(isEmptyValue)) deletePath(record, path)
}
