import { TABLES } from './table-registry'

/** جدول‌هایی که (مستقیم یا غیرمستقیم) به رکوردهای این جدول ارجاع دارند. */
export function dependentTables(name: string): string[] {
  const result = new Set<string>()
  const queue = [name]
  while (queue.length) {
    const current = queue.pop() as string
    const table = TABLES.find((item) => item.name === current)
    for (const relation of table?.relations ?? []) {
      if (relation.child === name || result.has(relation.child)) continue
      result.add(relation.child)
      queue.push(relation.child)
    }
  }
  return Array.from(result)
}

export function withDependents(names: string[]): string[] {
  const all = new Set(names)
  for (const name of names) for (const child of dependentTables(name)) all.add(child)
  return Array.from(all)
}
