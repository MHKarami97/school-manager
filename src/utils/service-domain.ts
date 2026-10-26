import type {
  GeoPoint,
  ServiceAddress,
  ServiceAssignment,
  ServiceDriver,
  ServicePayment,
  ServiceStudentProfile,
  SeatLayout,
  VehicleKind,
} from '@/types'
import {
  DEFAULT_SEAT_LAYOUTS,
  MAX_CAPACITY,
  MAX_ROWS,
  MAX_ROW_SEATS,
  YOUNG_MAX_GRADE,
} from '@/config/service.config'
import { normalizeIranMobile, toLatinDigits } from '@/utils/attendance-domain'

export class ServiceDomainError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'ServiceDomainError'
    this.code = code
  }
}

export interface Seat {
  id: string
  row: number
  col: number
  isFront: boolean
}

export function seatIdOf(row: number, col: number): string {
  return `${row}-${col}`
}

export function seatsOf(layout: SeatLayout): Seat[] {
  const seats: Seat[] = []
  layout.rows.forEach((count, row) => {
    for (let col = 0; col < count; col += 1) seats.push({ id: seatIdOf(row, col), row, col, isFront: row === 0 })
  })
  return seats
}

export function capacityOf(layout: SeatLayout): number {
  return layout.rows.reduce((sum, count) => sum + count, 0)
}

export function defaultLayoutFor(kind: VehicleKind): SeatLayout {
  return { rows: [...DEFAULT_SEAT_LAYOUTS[kind].rows] }
}

export function validateLayout(layout: SeatLayout): string | null {
  if (!layout.rows.length || layout.rows.length > MAX_ROWS) return `تعداد ردیف‌ها باید بین ۱ و ${MAX_ROWS} باشد.`
  if (layout.rows.some((count) => !Number.isInteger(count) || count < 1 || count > MAX_ROW_SEATS)) {
    return `تعداد صندلی هر ردیف باید بین ۱ و ${MAX_ROW_SEATS} باشد.`
  }
  if (capacityOf(layout) > MAX_CAPACITY) return `ظرفیت کل از ${MAX_CAPACITY} بیشتر است.`
  return null
}

export function isSeatInLayout(layout: SeatLayout, seatId: string): boolean {
  return seatsOf(layout).some((seat) => seat.id === seatId)
}

export function isFrontSeat(seatId: string | null): boolean {
  return !!seatId && seatId.startsWith('0-')
}

export function isYoungGrade(grade: number): boolean {
  return grade <= YOUNG_MAX_GRADE
}

export function isFrontSeatWarning(seatId: string | null, grade: number): boolean {
  return isFrontSeat(seatId) && isYoungGrade(grade)
}

export function normalizeRegion(text: string): string {
  return toLatinDigits(text)
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/\u200c/g, ' ')
    .replace(/منطقه|ناحیه|محله/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

export function emptyAddress(): ServiceAddress {
  return { province: '', city: '', region: '', street: '', alley: '', building: '', plaque: '', unit: '', landmark: '' }
}

export function createEmptyServiceProfile(studentId: string): ServiceStudentProfile {
  const now = Date.now()
  return {
    studentId,
    isEnrolled: true,
    address: emptyAddress(),
    location: null,
    pickupTime: '',
    returnAddressNote: '',
    receiverName: '',
    receiverPhone: '',
    note: '',
    createdAt: now,
    updatedAt: now,
  }
}

export function formatAddress(address: ServiceAddress): string {
  const parts = [
    address.province,
    address.city,
    address.region ? `منطقه ${address.region}` : '',
    address.street,
    address.alley ? `کوچه ${address.alley}` : '',
    address.building ? `ساختمان ${address.building}` : '',
    address.plaque ? `پلاک ${address.plaque}` : '',
    address.unit ? `واحد ${address.unit}` : '',
    address.landmark,
  ]
  return parts.map((part) => part.trim()).filter(Boolean).join('، ')
}

export function sanitizeServiceProfile(profile: ServiceStudentProfile): ServiceStudentProfile {
  const address = { ...profile.address }
  for (const key of Object.keys(address) as (keyof ServiceAddress)[]) address[key] = address[key].trim()
  const receiverPhone = profile.receiverPhone.trim()
  if (receiverPhone && !normalizeIranMobile(receiverPhone)) {
    throw new ServiceDomainError('BAD_RECEIVER_PHONE', 'شماره‌ی تحویل‌گیرنده معتبر نیست.')
  }
  if (profile.pickupTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(profile.pickupTime)) {
    throw new ServiceDomainError('BAD_PICKUP_TIME', 'ساعت سوار شدن معتبر نیست.')
  }
  return {
    ...profile,
    address,
    receiverName: profile.receiverName.trim(),
    receiverPhone: receiverPhone ? (normalizeIranMobile(receiverPhone) ?? '') : '',
    returnAddressNote: profile.returnAddressNote.trim(),
    note: profile.note.trim(),
    updatedAt: Date.now(),
  }
}

export function isValidPoint(point: GeoPoint | null | undefined): point is GeoPoint {
  return !!point && Number.isFinite(point.lat) && Number.isFinite(point.lng) && Math.abs(point.lat) <= 90 && Math.abs(point.lng) <= 180
}

export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const toRad = (value: number): number => (value * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function centroidOf(points: GeoPoint[]): GeoPoint | null {
  if (!points.length) return null
  const lat = points.reduce((sum, point) => sum + point.lat, 0) / points.length
  const lng = points.reduce((sum, point) => sum + point.lng, 0) / points.length
  return { lat, lng }
}

export function parseLocationInput(input: string): GeoPoint | null {
  const text = toLatinDigits(input).replace(/٫/g, '.').replace(/،/g, ',')
  const patterns = [
    /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /[?&](?:q|ll|query|center)=(-?\d+(?:\.\d+)?)(?:,|%2C)\s*(-?\d+(?:\.\d+)?)/i,
    /[?&]lat=(-?\d+(?:\.\d+)?).*?[?&](?:lng|lon)=(-?\d+(?:\.\d+)?)/i,
    /(-?\d{1,2}\.\d+)\s*[,\s]\s*(-?\d{1,3}\.\d+)/,
  ]
  for (const pattern of patterns) {
    const match = pattern.exec(text)
    if (!match) continue
    const point = { lat: Number(match[1]), lng: Number(match[2]) }
    if (isValidPoint(point)) return point
  }
  return null
}

export function validateDriver(driver: ServiceDriver): string | null {
  if (!driver.fullName.trim()) return 'نام راننده را وارد کنید.'
  if (driver.phone.trim() && !normalizeIranMobile(driver.phone)) return 'شماره‌ی راننده معتبر نیست.'
  if (driver.vehicleYear !== null && (driver.vehicleYear < 1300 || driver.vehicleYear > 1500)) return 'سال ساخت خودرو معتبر نیست.'
  return validateLayout(driver.seatLayout)
}

export interface SeatOccupant {
  studentId: string
  seatId: string | null
}

export function occupiedSeatIds(occupants: SeatOccupant[], exceptStudentId?: string): Set<string> {
  const ids = new Set<string>()
  for (const item of occupants) {
    if (item.seatId && item.studentId !== exceptStudentId) ids.add(item.seatId)
  }
  return ids
}

export interface SeatCandidate {
  studentId: string
  grade: number
}

export function suggestSeats(layout: SeatLayout, occupied: Set<string>, candidates: SeatCandidate[]): Map<string, string> {
  const free = seatsOf(layout).filter((seat) => !occupied.has(seat.id))
  const front = free.filter((seat) => seat.isFront)
  const rear = free.filter((seat) => !seat.isFront)
  const old = candidates.filter((item) => !isYoungGrade(item.grade)).sort((a, b) => b.grade - a.grade)
  const young = candidates.filter((item) => isYoungGrade(item.grade)).sort((a, b) => b.grade - a.grade)
  const result = new Map<string, string>()
  const takenSeats = new Set<string>()
  const take = (candidate: SeatCandidate, order: Seat[]): void => {
    const seat = order.find((item) => !takenSeats.has(item.id))
    if (!seat) return
    takenSeats.add(seat.id)
    result.set(candidate.studentId, seat.id)
  }
  for (const candidate of old) take(candidate, [...front, ...rear])
  for (const candidate of young) take(candidate, [...rear, ...front])
  return result
}

export function academicYearLabel(startJy: number): string {
  return `${startJy}-${startJy + 1}`
}

export function defaultPlanMonths(startJy: number): string[] {
  const months: string[] = []
  for (let month = 7; month <= 12; month += 1) months.push(`${startJy}-${String(month).padStart(2, '0')}`)
  for (let month = 1; month <= 3; month += 1) months.push(`${startJy + 1}-${String(month).padStart(2, '0')}`)
  return months
}

export type MonthPayState = 'paid' | 'partial' | 'unpaid'

export interface MonthFee {
  month: string
  due: number
  paid: number
  state: MonthPayState
}

export interface FeeSummary {
  months: MonthFee[]
  totalDue: number
  totalPaid: number
  balance: number
}

export function feeSummary(monthlyFee: number, months: string[], payments: ServicePayment[]): FeeSummary {
  const paidByMonth = new Map<string, number>()
  for (const payment of payments) paidByMonth.set(payment.month, (paidByMonth.get(payment.month) ?? 0) + payment.amount)
  const rows = months.map((month): MonthFee => {
    const paid = paidByMonth.get(month) ?? 0
    const state: MonthPayState = paid <= 0 ? 'unpaid' : paid >= monthlyFee ? 'paid' : 'partial'
    return { month, due: monthlyFee, paid, state }
  })
  const totalDue = monthlyFee * months.length
  const totalPaid = Array.from(paidByMonth.values()).reduce((sum, value) => sum + value, 0)
  return { months: rows, totalDue, totalPaid, balance: totalDue - totalPaid }
}

export interface DriverLoad {
  driverId: string
  used: number
  capacity: number
  free: number
}

export function driverLoads(drivers: ServiceDriver[], assignments: ServiceAssignment[]): Map<string, DriverLoad> {
  const counts = new Map<string, number>()
  for (const item of assignments) counts.set(item.driverId, (counts.get(item.driverId) ?? 0) + 1)
  return new Map(
    drivers.map((driver) => {
      const used = counts.get(driver.id) ?? 0
      const capacity = capacityOf(driver.seatLayout)
      return [driver.id, { driverId: driver.id, used, capacity, free: capacity - used }]
    }),
  )
}

export function groupByDriver(assignments: ServiceAssignment[]): Map<string, ServiceAssignment[]> {
  const groups = new Map<string, ServiceAssignment[]>()
  for (const item of assignments) {
    const list = groups.get(item.driverId)
    if (list) list.push(item)
    else groups.set(item.driverId, [item])
  }
  return groups
}

export function absentRidersByDriver(
  assignments: ServiceAssignment[],
  absentStudentIds: Set<string>,
): Map<string, ServiceAssignment[]> {
  const result = new Map<string, ServiceAssignment[]>()
  for (const [driverId, list] of groupByDriver(assignments)) {
    const absent = list.filter((item) => absentStudentIds.has(item.studentId))
    if (absent.length) result.set(driverId, absent)
  }
  return result
}

export function assignmentKey(planId: string, studentId: string): string {
  return `${planId}|${studentId}`
}

export function driverStateKey(planId: string, driverId: string): string {
  return `${planId}|${driverId}`
}
