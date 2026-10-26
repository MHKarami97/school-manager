import type { AssignMode, DriverGender, Gender, GeoPoint } from '@/types'
import { centroidOf, haversineKm, isValidPoint } from '@/utils/service-domain'

export interface AssignStudent {
  id: string
  grade: number
  gender: Gender
  region: string
  location: GeoPoint | null
}

export interface ExistingRider {
  region: string
  location: GeoPoint | null
}

export interface AssignDriver {
  id: string
  gender: DriverGender
  freeSeats: number
  coverageRegions: string[]
  baseLocation: GeoPoint | null
  existing: ExistingRider[]
}

export interface AutoAssignOptions {
  mode: AssignMode
  preferSameGender: boolean
}

export interface Placement {
  studentId: string
  driverId: string
}

export interface AutoAssignResult {
  placements: Placement[]
  unassigned: string[]
  notes: string[]
}

interface Group {
  key: string
  students: AssignStudent[]
}

const SAME_REGION_BONUS = 60
const COVERAGE_BONUS = 100
const FITS_WHOLE_GROUP_BONUS = 30
const MAX_DISTANCE_BONUS_KM = 50
const GENDER_MISMATCH_PENALTY = 200

export function orderByProximity(students: AssignStudent[]): AssignStudent[] {
  const located = students.filter((student) => isValidPoint(student.location))
  const rest = students.filter((student) => !isValidPoint(student.location)).sort((a, b) => a.id.localeCompare(b.id))
  if (located.length < 2) return [...located, ...rest]
  const pool = [...located].sort((a, b) => (a.location as GeoPoint).lng - (b.location as GeoPoint).lng || a.id.localeCompare(b.id))
  const chain: AssignStudent[] = [pool.shift() as AssignStudent]
  while (pool.length) {
    const last = chain[chain.length - 1].location as GeoPoint
    let bestIndex = 0
    let bestDistance = Infinity
    pool.forEach((candidate, index) => {
      const distance = haversineKm(last, candidate.location as GeoPoint)
      if (distance < bestDistance) {
        bestDistance = distance
        bestIndex = index
      }
    })
    chain.push(pool.splice(bestIndex, 1)[0])
  }
  return [...chain, ...rest]
}

function buildGroups(students: AssignStudent[], mode: AssignMode): Group[] {
  if (mode === 'location') return [{ key: '', students: orderByProximity(students) }]
  const byRegion = new Map<string, AssignStudent[]>()
  for (const student of students) {
    const list = byRegion.get(student.region)
    if (list) list.push(student)
    else byRegion.set(student.region, [student])
  }
  const groups: Group[] = Array.from(byRegion, ([key, list]) => ({
    key,
    students: mode === 'smart' ? orderByProximity(list) : [...list].sort((a, b) => a.id.localeCompare(b.id)),
  }))
  return groups.sort((a, b) => {
    if (a.key === '' && b.key !== '') return 1
    if (b.key === '' && a.key !== '') return -1
    return b.students.length - a.students.length || a.key.localeCompare(b.key)
  })
}

function majorityGender(students: AssignStudent[]): Gender {
  const female = students.filter((student) => student.gender === 'female').length
  return female * 2 > students.length ? 'female' : 'male'
}

function genderOf(driverGender: DriverGender): Gender {
  return driverGender
}

export function autoAssign(students: AssignStudent[], drivers: AssignDriver[], options: AutoAssignOptions): AutoAssignResult {
  const remaining = new Map(drivers.map((driver) => [driver.id, Math.max(0, driver.freeSeats)]))
  const riders = new Map<string, ExistingRider[]>(drivers.map((driver) => [driver.id, [...driver.existing]]))
  const placements: Placement[] = []
  const unassigned: string[] = []
  const notes: string[] = []

  const pickDriver = (group: Group, queue: AssignStudent[]): AssignDriver | null => {
    const groupLocations = queue.map((student) => student.location).filter(isValidPoint)
    const groupCentroid = centroidOf(groupLocations)
    const groupGender = majorityGender(queue)
    let best: AssignDriver | null = null
    let bestScore = -Infinity
    for (const driver of drivers) {
      const free = remaining.get(driver.id) ?? 0
      if (free <= 0) continue
      const current = riders.get(driver.id) ?? []
      let score = Math.min(free, 10)
      if (options.mode !== 'location' && group.key) {
        if (driver.coverageRegions.includes(group.key)) score += COVERAGE_BONUS
        if (current.some((rider) => rider.region === group.key)) score += SAME_REGION_BONUS
      }
      if (options.mode !== 'region' && groupCentroid) {
        const driverPoints = current.map((rider) => rider.location).filter(isValidPoint)
        const driverCentroid = centroidOf(driverPoints) ?? (isValidPoint(driver.baseLocation) ? driver.baseLocation : null)
        if (driverCentroid) score += Math.max(0, MAX_DISTANCE_BONUS_KM - haversineKm(groupCentroid, driverCentroid))
      }
      if (free >= queue.length) score += FITS_WHOLE_GROUP_BONUS
      if (options.preferSameGender && genderOf(driver.gender) !== groupGender) score -= GENDER_MISMATCH_PENALTY
      if (score > bestScore || (score === bestScore && best && driver.id < best.id)) {
        best = driver
        bestScore = score
      }
    }
    return best
  }

  for (const group of buildGroups(students, options.mode)) {
    const queue = [...group.students]
    while (queue.length) {
      const driver = pickDriver(group, queue)
      if (!driver) {
        unassigned.push(...queue.map((student) => student.id))
        break
      }
      const take = Math.min(remaining.get(driver.id) ?? 0, queue.length)
      const chunk = queue.splice(0, take)
      for (const student of chunk) {
        placements.push({ studentId: student.id, driverId: driver.id })
        riders.get(driver.id)?.push({ region: student.region, location: student.location })
      }
      remaining.set(driver.id, (remaining.get(driver.id) ?? 0) - take)
    }
  }

  if (unassigned.length) notes.push(`${unassigned.length} دانش‌آموز به‌دلیل کمبود ظرفیت راننده‌ها بدون تخصیص ماندند.`)
  if (options.preferSameGender) {
    const byId = new Map(students.map((student) => [student.id, student]))
    const driverById = new Map(drivers.map((driver) => [driver.id, driver]))
    const mismatches = placements.filter((placement) => {
      const student = byId.get(placement.studentId)
      const driver = driverById.get(placement.driverId)
      return !!student && !!driver && genderOf(driver.gender) !== student.gender
    }).length
    if (mismatches) notes.push(`${mismatches} دانش‌آموز با راننده‌ای با جنسیت متفاوت قرار گرفتند؛ پیش از تأیید بررسی کنید.`)
  }
  return { placements, unassigned, notes }
}
