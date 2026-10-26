import type { ServiceAssignment, ServiceDriver } from '@/types'
import { VEHICLE_KIND_LABELS } from '@/config/service.config'
import { capacityOf } from '@/utils/service-domain'

export type SheetMode = 'roster' | 'absentees'

export interface SheetRow {
  seat: string
  name: string
  grade: string
  phones: string
  address: string
  pickup: string
}

export interface SheetSection {
  title: string
  subtitle: string
  rows: SheetRow[]
}

export interface SheetPayload {
  mode: SheetMode
  title: string
  subtitle: string
  sections: SheetSection[]
}

export function seatLabelOf(seatId: string | null): string {
  if (!seatId) return 'بدون صندلی'
  const [row, col] = seatId.split('-').map(Number)
  if (Number.isNaN(row) || Number.isNaN(col)) return seatId
  return row === 0 ? `جلو ${col + 1}` : `ردیف ${row + 1}، صندلی ${col + 1}`
}

function seatOrder(seatId: string | null): number {
  if (!seatId) return Number.MAX_SAFE_INTEGER
  const [row, col] = seatId.split('-').map(Number)
  return row * 100 + col
}

export function vehicleText(driver: ServiceDriver): string {
  return [VEHICLE_KIND_LABELS[driver.vehicleKind], driver.vehicleModel, driver.vehicleColor].filter(Boolean).join(' ')
}

export interface SheetSources {
  nameOf: (studentId: string) => string
  gradeOf: (studentId: string) => string
  phonesOf: (studentId: string) => string
  addressOf: (studentId: string) => string
  pickupOf: (studentId: string) => string
}

export function buildSheetPayload(
  mode: SheetMode,
  title: string,
  subtitle: string,
  drivers: ServiceDriver[],
  assignments: ServiceAssignment[],
  sources: SheetSources,
  onlyStudentIds?: Set<string>,
): SheetPayload {
  const sections: SheetSection[] = []
  for (const driver of drivers) {
    const riders = assignments
      .filter((item) => item.driverId === driver.id)
      .filter((item) => (onlyStudentIds ? onlyStudentIds.has(item.studentId) : true))
      .sort((a, b) => seatOrder(a.seatId) - seatOrder(b.seatId) || sources.nameOf(a.studentId).localeCompare(sources.nameOf(b.studentId), 'fa'))
    if (!riders.length) continue
    const total = assignments.filter((item) => item.driverId === driver.id).length
    sections.push({
      title: `${driver.fullName}${driver.plate ? ` - پلاک ${driver.plate}` : ''}`,
      subtitle: `${vehicleText(driver)}${driver.phone ? ` - ${driver.phone}` : ''} - ${riders.length}${mode === 'absentees' ? ` غایب از ${total}` : ''} نفر (ظرفیت ${capacityOf(driver.seatLayout)})`,
      rows: riders.map((item) => ({
        seat: seatLabelOf(item.seatId),
        name: sources.nameOf(item.studentId),
        grade: sources.gradeOf(item.studentId),
        phones: sources.phonesOf(item.studentId),
        address: sources.addressOf(item.studentId),
        pickup: sources.pickupOf(item.studentId),
      })),
    })
  }
  return { mode, title, subtitle, sections }
}

export function absenteeMessage(driver: ServiceDriver, names: string[], dateLabel: string): string {
  const lines = names.map((name, index) => `${index + 1}. ${name}`)
  return [`غایبین ${dateLabel} - ${driver.fullName}`, ...lines].join('\n')
}
