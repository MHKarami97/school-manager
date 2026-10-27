import type { PlainRecord } from './record-path'
import type { RelationDef } from './table-registry'

export interface ChildData {
  keyPath: string
  records: PlainRecord[]
}

export interface CascadePlan {
  deletes: { table: string; key: string }[]
  updates: { table: string; record: PlainRecord }[]
  counts: Record<string, { delete: number; update: number }>
}

function touches(value: unknown, keys: Set<string>): boolean {
  if (Array.isArray(value)) return value.some((item) => keys.has(String(item)))
  return value !== null && value !== undefined && keys.has(String(value))
}

export function planCascade(relations: RelationDef[], keys: Set<string>, children: Record<string, ChildData>): CascadePlan {
  const plan: CascadePlan = { deletes: [], updates: [], counts: {} }
  const deleted = new Set<string>()
  const bump = (table: string, kind: 'delete' | 'update'): void => {
    plan.counts[table] ??= { delete: 0, update: 0 }
    plan.counts[table][kind] += 1
  }
  for (const relation of relations) {
    const data = children[relation.child]
    if (!data) continue
    for (const record of data.records) {
      const key = String(record[data.keyPath])
      const marker = `${relation.child}|${key}`
      if (deleted.has(marker) || !touches(record[relation.field], keys)) continue
      if (relation.action === 'delete') {
        deleted.add(marker)
        plan.deletes.push({ table: relation.child, key })
        bump(relation.child, 'delete')
      } else if (relation.action === 'nullify') {
        plan.updates.push({ table: relation.child, record: { ...record, [relation.field]: null } })
        bump(relation.child, 'update')
      } else {
        const list = (record[relation.field] as unknown[]).filter((item) => !keys.has(String(item)))
        plan.updates.push({ table: relation.child, record: { ...record, [relation.field]: list } })
        bump(relation.child, 'update')
      }
    }
  }
  return plan
}
