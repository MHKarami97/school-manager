import { DEFAULT_SEAT_LAYOUTS } from '@/config/service.config'
import { JALAALI_MONTH_NAMES } from '@/utils/jalaali'
import { levelIdOfGrade } from '@/utils/attendance-student-import'
import { isSeatInLayout, seatsOf, validateLayout } from '@/utils/service-domain'
import {
  nameKey,
  outcome,
  parseBool,
  parseDateCell,
  parseGender,
  parseGrade,
  parseLocationCell,
  parseNumber,
  parsePhone,
  parseTime,
  studentNaturalKey,
  type ImportContext,
  type ImportOptions,
  type ImportTemplate,
  type RowData,
  type RowOutcome,
} from './import-core'
import type { PlainRecord } from '../record-path'
import { tableDef } from '../table-registry'

const DEFAULT_RELATION = 'سرپرست'

const ADDRESS_COLUMNS: { key: string; title: string; example: string }[] = [
  { key: 'province', title: 'استان', example: 'البرز' },
  { key: 'city', title: 'شهر', example: 'کرج' },
  { key: 'region', title: 'منطقه', example: '5' },
  { key: 'street', title: 'خیابان', example: 'طالقانی' },
  { key: 'alley', title: 'کوچه', example: '12' },
  { key: 'building', title: 'ساختمان', example: 'نگین' },
  { key: 'plaque', title: 'پلاک', example: '4' },
  { key: 'unit', title: 'واحد', example: '3' },
  { key: 'landmark', title: 'نشانه', example: 'نزدیک پارک' },
]

function findStudent(row: RowData, ctx: ImportContext, result: RowOutcome): PlainRecord | null {
  const grade = parseGrade(row.studentGrade ?? row.grade ?? '')
  const first = row.studentFirst ?? row.firstName ?? ''
  const last = row.studentLast ?? row.lastName ?? ''
  if (!first || !last || grade === null) {
    result.errors.push('نام، نام خانوادگی و پایه‌ی دانش‌آموز (۱ تا ۱۲) لازم است.')
    return null
  }
  const student = ctx.students.get(studentNaturalKey(first, last, grade))
  if (!student) result.errors.push(`دانش‌آموزی با نام «${first} ${last}» در پایه‌ی ${grade} پیدا نشد.`)
  return student ?? null
}

const studentsFull: ImportTemplate = {
  id: 'students-full',
  label: 'دانش‌آموزان همراه با تماس، آدرس سرویس و کلاس',
  description: 'هر ردیف یک دانش‌آموز؛ اطلاعات دانش‌آموز، شماره‌ی والدین، آدرس و موقعیت سرویس و عضویت در کلاس با هم در جدول‌های مربوط ثبت می‌شود.',
  tables: ['students', 'attProfiles', 'svcStudents', 'attMembers'],
  usesGender: true,
  columns: [
    { key: 'firstName', title: 'نام', required: true, example: 'علی', help: 'نام دانش‌آموز' },
    { key: 'lastName', title: 'نام خانوادگی', required: true, example: 'رضایی', help: 'نام خانوادگی' },
    { key: 'grade', title: 'پایه', required: true, example: '3', help: 'عدد ۱ تا ۱۲' },
    { key: 'gender', title: 'جنسیت', example: 'پسر', help: 'پسر/دختر؛ خالی = پیش‌فرض انتخاب‌شده' },
    { key: 'gpa', title: 'معدل', example: '18.5', help: 'اختیاری' },
    { key: 'discipline', title: 'امتیاز انضباطی', example: '19', help: 'اختیاری' },
    { key: 'phone1', title: 'شماره‌ی والدین', example: '09123456789', help: 'موبایل ایران' },
    { key: 'phone2', title: 'شماره‌ی دوم والدین', example: '09121112233', help: 'اختیاری' },
    { key: 'relation', title: 'نسبت', example: 'پدر', help: 'نسبت شماره‌ی اول؛ خالی = سرپرست' },
    { key: 'service', title: 'سرویس دارد', example: 'بله', help: 'بله/خیر؛ خالی = اگر آدرس یا موقعیت داده شد، بله' },
    ...ADDRESS_COLUMNS.map((column) => ({ key: column.key, title: column.title, example: column.example, help: 'آدرس سرویس (اختیاری)' })),
    { key: 'pickup', title: 'ساعت سوار شدن', example: '07:15', help: 'HH:MM' },
    { key: 'location', title: 'مختصات یا لینک نقشه', example: '35.8327, 51.0123', help: 'اختیاری' },
    { key: 'className', title: 'کلاس', example: 'سوم الف', help: 'نام کلاس حضور و غیاب که از قبل ساخته شده؛ عضویت ثبت می‌شود' },
  ],
  sample: [['علی', 'رضایی', '3', 'پسر', '18.5', '19', '09123456789', '', 'پدر', 'بله', 'البرز', 'کرج', '5', 'طالقانی', '12', 'نگین', '4', '3', 'نزدیک پارک', '07:15', '', 'سوم الف']],
  parseRow(row, ctx, options) {
    const result = outcome()
    const grade = parseGrade(row.grade)
    if (!row.firstName || !row.lastName || grade === null) {
      result.errors.push('نام، نام خانوادگی و پایه (۱ تا ۱۲) لازم است.')
      return result
    }
    const key = studentNaturalKey(row.firstName, row.lastName, grade)
    let student = ctx.students.get(key)
    const isNew = !student
    if (student && options.onExisting === 'skip') {
      result.warnings.push('دانش‌آموز از قبل وجود دارد؛ رد شد.')
      return result
    }
    const gender = options.sameGenderForAll ? options.defaultGender : parseGender(row.gender, options.defaultGender)
    const gpa = parseNumber(row.gpa)
    const discipline = parseNumber(row.discipline)
    if (Number.isNaN(gpa) || Number.isNaN(discipline)) result.warnings.push('معدل یا امتیاز انضباطی عدد نبود و نادیده گرفته شد.')
    student = { ...(student ?? tableDef('students').create()), firstName: row.firstName.trim(), lastName: row.lastName.trim(), grade, levelId: levelIdOfGrade(grade) ?? 'elementary' }
    if (isNew || row.gender || options.sameGenderForAll) student.gender = gender
    if (gpa !== null && !Number.isNaN(gpa)) student.gpa = gpa
    if (discipline !== null && !Number.isNaN(discipline)) student.disciplineScore = discipline
    if (isNew) student.id = crypto.randomUUID()
    ctx.students.set(key, student)
    ctx.studentsById.set(String(student.id), student)
    const studentId = String(student.id)
    result.ops.push({ table: 'students', record: student, kind: isNew ? 'create' : 'update' })

    const phone1 = parsePhone(row.phone1)
    const phone2 = parsePhone(row.phone2)
    if ((row.phone1 && !phone1) || (row.phone2 && !phone2)) result.warnings.push('شماره‌ی نامعتبر نادیده گرفته شد.')
    if (phone1 || phone2) {
      const existing = ctx.profiles.get(studentId)
      const profile: PlainRecord = existing ? { ...existing } : { ...tableDef('attProfiles').create(), studentId }
      profile.primaryParent = { phone: phone1 ?? phone2 ?? '', relation: row.relation.trim() || DEFAULT_RELATION }
      if (phone1 && phone2) profile.secondaryParent = { phone: phone2, relation: 'سایر' }
      ctx.profiles.set(studentId, profile)
      result.ops.push({ table: 'attProfiles', record: profile, kind: existing ? 'update' : 'create' })
    }

    const wantsService = parseBool(row.service)
    const hasPlace = ADDRESS_COLUMNS.some((column) => row[column.key]) || !!row.pickup || !!row.location
    if (wantsService === true || (wantsService === null && hasPlace) || (wantsService === false && ctx.svcProfiles.has(studentId))) {
      const existing = ctx.svcProfiles.get(studentId)
      const profile: PlainRecord = existing ? { ...existing } : { ...tableDef('svcStudents').create(), studentId }
      profile.isEnrolled = wantsService !== false
      const address = { ...(profile.address as PlainRecord) }
      for (const column of ADDRESS_COLUMNS) if (row[column.key]) address[column.key] = row[column.key].trim()
      profile.address = address
      if (row.pickup) {
        const time = parseTime(row.pickup)
        if (time) profile.pickupTime = time
        else result.warnings.push('ساعت سوار شدن معتبر نبود.')
      }
      if (row.location) {
        const point = parseLocationCell(row.location)
        if (point) profile.location = point
        else result.warnings.push('مختصات/لینک نقشه خوانده نشد.')
      }
      ctx.svcProfiles.set(studentId, profile)
      result.ops.push({ table: 'svcStudents', record: profile, kind: existing ? 'update' : 'create' })
    }

    if (row.className) {
      const classroom = ctx.classrooms.get(nameKey(row.className))
      if (!classroom) result.warnings.push(`کلاس «${row.className}» پیدا نشد؛ عضویت ثبت نشد.`)
      else {
        const memberId = `${classroom.id}|${studentId}`
        if (!ctx.members.has(memberId)) {
          ctx.members.add(memberId)
          result.ops.push({ table: 'attMembers', record: { ...tableDef('attMembers').create(), classroomId: classroom.id, studentId }, kind: 'create' })
        }
      }
    }
    return result
  },
}

const teachers: ImportTemplate = {
  id: 'teachers',
  label: 'معلمان',
  description: 'هر ردیف یک معلم. معلمی که نامش از قبل هست به‌روزرسانی یا رد می‌شود.',
  tables: ['teachers'],
  usesGender: true,
  columns: [
    { key: 'name', title: 'نام و نام خانوادگی', required: true, example: 'مریم احمدی', help: 'نام کامل معلم' },
    { key: 'gender', title: 'جنسیت', example: 'خانم', help: 'آقا/خانم؛ خالی = ثبت‌نشده' },
    { key: 'maxWeekly', title: 'سقف ساعت هفتگی', example: '24', help: 'اختیاری' },
    { key: 'maxDaily', title: 'سقف ساعت روزانه', example: '6', help: 'اختیاری' },
  ],
  sample: [['مریم احمدی', 'خانم', '24', '6']],
  parseRow(row, ctx, options) {
    const result = outcome()
    if (!row.name) {
      result.errors.push('نام معلم لازم است.')
      return result
    }
    const key = nameKey(row.name)
    const existing = ctx.teachers.get(key)
    if (existing && options.onExisting === 'skip') {
      result.warnings.push('معلم از قبل وجود دارد؛ رد شد.')
      return result
    }
    const teacher: PlainRecord = { ...(existing ?? tableDef('teachers').create()), name: row.name.trim() }
    if (row.gender) teacher.gender = parseGender(row.gender, 'male')
    const weekly = parseNumber(row.maxWeekly)
    const daily = parseNumber(row.maxDaily)
    if (weekly !== null && !Number.isNaN(weekly)) teacher.maxWeeklyHours = weekly
    if (daily !== null && !Number.isNaN(daily)) teacher.maxDailyHours = daily
    if (!existing) teacher.id = crypto.randomUUID()
    ctx.teachers.set(key, teacher)
    result.ops.push({ table: 'teachers', record: teacher, kind: existing ? 'update' : 'create' })
    return result
  },
}

const KIND_BY_TEXT: Record<string, string> = { سواری: 'sedan', ون: 'van', مینی‌بوس: 'minibus', 'مینی بوس': 'minibus', سایر: 'other' }

const drivers: ImportTemplate = {
  id: 'drivers',
  label: 'رانندگان سرویس',
  description: 'هر ردیف یک راننده با خودرو. راننده‌ای که پلاک (یا در نبود پلاک، نام) او از قبل هست به‌روزرسانی یا رد می‌شود.',
  tables: ['svcDrivers'],
  columns: [
    { key: 'fullName', title: 'نام راننده', required: true, example: 'رضا کریمی', help: 'نام کامل' },
    { key: 'gender', title: 'جنسیت', example: 'آقا', help: 'آقا/خانم؛ خالی = آقا' },
    { key: 'phone', title: 'شماره', example: '09120000000', help: 'اختیاری' },
    { key: 'kind', title: 'نوع خودرو', example: 'سواری', help: 'سواری/ون/مینی‌بوس/سایر؛ خالی = سواری' },
    { key: 'model', title: 'مدل', example: 'پژو ۴۰۵', help: 'اختیاری' },
    { key: 'year', title: 'سال ساخت', example: '1398', help: 'شمسی، اختیاری' },
    { key: 'color', title: 'رنگ', example: 'سفید', help: 'اختیاری' },
    { key: 'plate', title: 'پلاک', example: '12 ب 345 - 67', help: 'اختیاری' },
    { key: 'layout', title: 'چیدمان صندلی', example: '1,3', help: 'تعداد صندلی دانش‌آموزی هر ردیف از جلو؛ خالی = پیش‌فرض نوع خودرو' },
    { key: 'regions', title: 'مناطق تحت پوشش', example: '5, 7', help: 'با ویرگول، اختیاری' },
    { key: 'active', title: 'فعال', example: 'بله', help: 'بله/خیر؛ خالی = بله' },
  ],
  sample: [['رضا کریمی', 'آقا', '09120000000', 'سواری', 'پژو ۴۰۵', '1398', 'سفید', '12 ب 345 - 67', '1,3', '5, 7', 'بله']],
  parseRow(row, ctx, options) {
    const result = outcome()
    if (!row.fullName) {
      result.errors.push('نام راننده لازم است.')
      return result
    }
    const plateKey = nameKey(row.plate)
    const existing = (plateKey ? ctx.driversByPlate.get(plateKey) : undefined) ?? ctx.drivers.get(nameKey(row.fullName))
    if (existing && options.onExisting === 'skip') {
      result.warnings.push('راننده از قبل وجود دارد؛ رد شد.')
      return result
    }
    const kind = row.kind ? KIND_BY_TEXT[nameKey(row.kind)] : 'sedan'
    if (!kind) {
      result.errors.push(`نوع خودرو «${row.kind}» شناخته نشد.`)
      return result
    }
    const base = existing ?? tableDef('svcDrivers').create()
    const driver: PlainRecord = { ...base, fullName: row.fullName.trim(), vehicleKind: kind }
    if (row.gender || !existing) driver.gender = parseGender(row.gender, 'male')
    const phone = parsePhone(row.phone)
    if (row.phone && !phone) result.warnings.push('شماره‌ی راننده نامعتبر بود و نادیده گرفته شد.')
    else if (phone) driver.phone = phone
    if (row.model) driver.vehicleModel = row.model.trim()
    if (row.color) driver.vehicleColor = row.color.trim()
    if (row.plate) driver.plate = row.plate.trim()
    const year = parseNumber(row.year)
    if (year !== null && !Number.isNaN(year)) driver.vehicleYear = year
    if (row.layout) {
      const rows = row.layout.split(/[,،]/).map((part) => Number(part.trim())).filter((value) => Number.isFinite(value))
      const problem = validateLayout({ rows })
      if (problem) {
        result.errors.push(problem)
        return result
      }
      driver.seatLayout = { rows }
    } else if (!existing || row.kind) {
      driver.seatLayout = { rows: [...DEFAULT_SEAT_LAYOUTS[kind as keyof typeof DEFAULT_SEAT_LAYOUTS].rows] }
    }
    if (row.regions) driver.coverageRegions = row.regions.split(/[,،]/).map((part) => part.trim()).filter(Boolean)
    const active = parseBool(row.active)
    if (active !== null) driver.isActive = active
    if (!existing) driver.id = crypto.randomUUID()
    ctx.drivers.set(nameKey(row.fullName), driver)
    if (plateKey) ctx.driversByPlate.set(plateKey, driver)
    result.ops.push({ table: 'svcDrivers', record: driver, kind: existing ? 'update' : 'create' })
    return result
  },
}

const classMembers: ImportTemplate = {
  id: 'class-members',
  label: 'کلاس‌ها و عضویت دانش‌آموزان',
  description: 'هر ردیف عضویت یک دانش‌آموزِ موجود در یک کلاس است. کلاسی که وجود نداشته باشد خودکار ساخته می‌شود.',
  tables: ['attClassrooms', 'attMembers'],
  columns: [
    { key: 'className', title: 'نام کلاس', required: true, example: 'سوم الف', help: 'نام کلاس' },
    { key: 'classGrade', title: 'پایه‌ی کلاس', example: '3', help: 'برای کلاس جدید؛ خالی = پایه‌ی دانش‌آموز' },
    { key: 'academicYear', title: 'سال تحصیلی', example: '1405-1406', help: 'برای کلاس جدید، اختیاری' },
    { key: 'shift', title: 'شیفت', example: 'صبح', help: 'اختیاری' },
    { key: 'teacher', title: 'معلم', example: 'مریم احمدی', help: 'نام معلمِ موجود؛ پیدا نشود هشدار می‌دهد' },
    { key: 'studentFirst', title: 'نام دانش‌آموز', required: true, example: 'علی', help: 'دانش‌آموز باید از قبل ثبت شده باشد' },
    { key: 'studentLast', title: 'نام خانوادگی دانش‌آموز', required: true, example: 'رضایی', help: '' },
    { key: 'studentGrade', title: 'پایه‌ی دانش‌آموز', required: true, example: '3', help: 'برای تشخیص دانش‌آموزان همنام' },
  ],
  sample: [['سوم الف', '3', '1405-1406', 'صبح', 'مریم احمدی', 'علی', 'رضایی', '3']],
  parseRow(row, ctx) {
    const result = outcome()
    if (!row.className) {
      result.errors.push('نام کلاس لازم است.')
      return result
    }
    const student = findStudent(row, ctx, result)
    if (!student) return result
    const classKey = nameKey(row.className)
    let classroom = ctx.classrooms.get(classKey)
    if (!classroom) {
      const grade = parseGrade(row.classGrade) ?? Number(student.grade)
      classroom = { ...tableDef('attClassrooms').create(), id: crypto.randomUUID(), name: row.className.trim(), grade, academicYear: row.academicYear.trim(), shift: row.shift.trim() }
      const teacher = row.teacher ? ctx.teachers.get(nameKey(row.teacher)) : undefined
      if (row.teacher && !teacher) result.warnings.push(`معلم «${row.teacher}» پیدا نشد؛ کلاس بدون معلم ساخته شد.`)
      if (teacher) classroom.teacherId = teacher.id
      ctx.classrooms.set(classKey, classroom)
    }
    if (Number(classroom.createdAt) === 0) result.ops.push({ table: 'attClassrooms', record: classroom, kind: 'create' })
    const memberId = `${classroom.id}|${student.id}`
    if (ctx.members.has(memberId)) result.warnings.push('این دانش‌آموز از قبل عضو کلاس است.')
    else {
      ctx.members.add(memberId)
      result.ops.push({ table: 'attMembers', record: { ...tableDef('attMembers').create(), classroomId: classroom.id, studentId: student.id }, kind: 'create' })
    }
    return result
  },
}

const SEAT_WORDS: Record<string, string> = { جلو: '0-0' }

function parseSeat(text: string): string | null {
  const value = nameKey(text)
  if (SEAT_WORDS[value]) return SEAT_WORDS[value]
  return /^\d+-\d+$/.test(value) ? value : null
}

const assignments: ImportTemplate = {
  id: 'service-assignments',
  label: 'تخصیص دانش‌آموزان به راننده (طرح فعال)',
  description: 'هر ردیف یک دانش‌آموزِ موجود را در طرح انتخابی به یک راننده می‌سپارد؛ ظرفیت و صندلی بررسی می‌شود و در صورت نبود، دانش‌آموز وارد سرویس می‌شود.',
  tables: ['svcAssignments', 'svcStudents'],
  needsPlan: true,
  columns: [
    { key: 'firstName', title: 'نام', required: true, example: 'علی', help: 'دانش‌آموز باید از قبل ثبت شده باشد' },
    { key: 'lastName', title: 'نام خانوادگی', required: true, example: 'رضایی', help: '' },
    { key: 'grade', title: 'پایه', required: true, example: '3', help: '' },
    { key: 'driver', title: 'راننده', required: true, example: 'رضا کریمی', help: 'نام یا پلاک راننده‌ی ثبت‌شده' },
    { key: 'seat', title: 'صندلی', example: '1-0', help: 'اختیاری: «جلو» یا ردیف-ستون (۰-۰ جلو، ۱-۰ اولین صندلی ردیف دوم)' },
    { key: 'fee', title: 'هزینه‌ی ماهانه', example: '1500000', help: 'اختیاری؛ خالی = پیش‌فرض طرح' },
  ],
  sample: [['علی', 'رضایی', '3', 'رضا کریمی', '1-0', '1500000']],
  parseRow(row, ctx) {
    const result = outcome()
    const plan = ctx.plan
    if (!plan) {
      result.errors.push('طرح سرویس انتخاب نشده است.')
      return result
    }
    const student = findStudent(row, ctx, result)
    if (!student) return result
    const driver = ctx.drivers.get(nameKey(row.driver)) ?? ctx.driversByPlate.get(nameKey(row.driver))
    if (!driver) {
      result.errors.push(`راننده‌ی «${row.driver}» پیدا نشد.`)
      return result
    }
    const driverId = String(driver.id)
    const studentId = String(student.id)
    const previous = ctx.assignments.get(studentId)
    const load = (ctx.driverLoad.get(driverId) ?? 0) - (previous && previous.driverId === driverId ? 1 : 0)
    const layout = driver.seatLayout as { rows: number[] }
    const capacity = seatsOf(layout).length
    if (load >= capacity) {
      result.errors.push(`ظرفیت راننده‌ی «${driver.fullName}» تکمیل است.`)
      return result
    }
    let seatId: string | null = null
    if (row.seat) {
      seatId = parseSeat(row.seat)
      if (!seatId || !isSeatInLayout(layout, seatId)) {
        result.errors.push(`صندلی «${row.seat}» در خودروی این راننده وجود ندارد.`)
        return result
      }
      const taken = ctx.seatsTaken.get(driverId) ?? new Set<string>()
      const own = previous && previous.driverId === driverId ? previous.seatId : null
      if (taken.has(seatId) && seatId !== own) {
        result.errors.push(`صندلی ${seatId} قبلاً پر شده است.`)
        return result
      }
    }
    const fee = parseNumber(row.fee)
    if (fee !== null && Number.isNaN(fee)) result.warnings.push('هزینه عدد نبود و نادیده گرفته شد.')
    const record: PlainRecord = {
      ...(previous ?? tableDef('svcAssignments').create()),
      planId: plan.id,
      studentId,
      driverId,
      seatId,
      monthlyFee: fee !== null && !Number.isNaN(fee) ? fee : Number(previous?.monthlyFee ?? plan.defaultMonthlyFee ?? 0),
      status: 'draft',
    }
    if (previous) {
      const oldDriver = String(previous.driverId)
      ctx.driverLoad.set(oldDriver, Math.max(0, (ctx.driverLoad.get(oldDriver) ?? 1) - 1))
      if (typeof previous.seatId === 'string') ctx.seatsTaken.get(oldDriver)?.delete(previous.seatId)
    }
    ctx.driverLoad.set(driverId, (ctx.driverLoad.get(driverId) ?? 0) + 1)
    if (seatId) ctx.seatsTaken.set(driverId, new Set([...(ctx.seatsTaken.get(driverId) ?? []), seatId]))
    ctx.assignments.set(studentId, record)
    result.ops.push({ table: 'svcAssignments', record, kind: previous ? 'update' : 'create' })
    const svc = ctx.svcProfiles.get(studentId)
    if (!svc || svc.isEnrolled !== true) {
      const profile: PlainRecord = svc ? { ...svc, isEnrolled: true } : { ...tableDef('svcStudents').create(), studentId }
      ctx.svcProfiles.set(studentId, profile)
      result.ops.push({ table: 'svcStudents', record: profile, kind: svc ? 'update' : 'create' })
      result.warnings.push('دانش‌آموز وارد سرویس شد (آدرس ندارد).')
    }
    return result
  },
}

const METHOD_BY_TEXT: Record<string, string> = { نقدی: 'cash', نقد: 'cash', کارت: 'card', کارتخوان: 'card', 'کارت‌خوان': 'card', واریز: 'transfer', 'کارت‌به‌کارت': 'transfer', 'کارت به کارت': 'transfer', سایر: 'other' }

function resolveMonth(text: string, plan: PlainRecord): string | null {
  const months = (plan.months as string[]) ?? []
  const direct = /^(\d{4})-(\d{1,2})$/.exec(text.replace('/', '-').trim())
  if (direct) {
    const key = `${direct[1]}-${direct[2].padStart(2, '0')}`
    return months.includes(key) ? key : null
  }
  const name = nameKey(text.replace(/\d+/g, ''))
  const index = JALAALI_MONTH_NAMES.findIndex((month) => nameKey(month) === name)
  if (index < 0) return null
  const suffix = `-${String(index + 1).padStart(2, '0')}`
  const hits = months.filter((month) => month.endsWith(suffix))
  return hits.length === 1 ? hits[0] : null
}

const payments: ImportTemplate = {
  id: 'service-payments',
  label: 'پرداخت‌های سرویس (طرح فعال)',
  description: 'هر ردیف یک پرداخت برای یک دانش‌آموزِ موجود در یک ماه از طرح انتخابی.',
  tables: ['svcPayments'],
  needsPlan: true,
  columns: [
    { key: 'firstName', title: 'نام', required: true, example: 'علی', help: '' },
    { key: 'lastName', title: 'نام خانوادگی', required: true, example: 'رضایی', help: '' },
    { key: 'grade', title: 'پایه', required: true, example: '3', help: '' },
    { key: 'month', title: 'ماه', required: true, example: 'مهر', help: 'نام ماه (مهر) یا 1405-07؛ باید جزو ماه‌های طرح باشد' },
    { key: 'amount', title: 'مبلغ', required: true, example: '1500000', help: 'تومان' },
    { key: 'paidAt', title: 'تاریخ پرداخت', example: '1405/07/20', help: 'شمسی یا میلادی؛ خالی = امروز' },
    { key: 'method', title: 'روش', example: 'نقدی', help: 'نقدی/کارت/واریز/سایر؛ خالی = نقدی' },
    { key: 'note', title: 'یادداشت', example: '', help: 'اختیاری' },
  ],
  sample: [['علی', 'رضایی', '3', 'مهر', '1500000', '1405/07/20', 'نقدی', '']],
  parseRow(row, ctx) {
    const result = outcome()
    const plan = ctx.plan
    if (!plan) {
      result.errors.push('طرح سرویس انتخاب نشده است.')
      return result
    }
    const student = findStudent(row, ctx, result)
    if (!student) return result
    const month = resolveMonth(row.month, plan)
    if (!month) {
      result.errors.push(`ماه «${row.month}» جزو ماه‌های طرح نیست.`)
      return result
    }
    const amount = parseNumber(row.amount)
    if (amount === null || Number.isNaN(amount) || amount <= 0) {
      result.errors.push('مبلغ باید عددی بزرگ‌تر از صفر باشد.')
      return result
    }
    let paidAt = new Date().toISOString().slice(0, 10)
    if (row.paidAt) {
      const parsed = parseDateCell(row.paidAt)
      if (!parsed) {
        result.errors.push(`تاریخ «${row.paidAt}» معتبر نیست.`)
        return result
      }
      paidAt = parsed
    }
    const method = row.method ? METHOD_BY_TEXT[nameKey(row.method)] : 'cash'
    if (!method) {
      result.errors.push(`روش «${row.method}» شناخته نشد.`)
      return result
    }
    if (!ctx.assignments.has(String(student.id))) result.warnings.push('این دانش‌آموز در طرح به راننده‌ای تخصیص داده نشده است.')
    result.ops.push({
      table: 'svcPayments',
      record: { ...tableDef('svcPayments').create(), id: crypto.randomUUID(), planId: plan.id, studentId: student.id, month, amount, paidAt, method, note: row.note.trim() },
      kind: 'create',
    })
    return result
  },
}

export const IMPORT_TEMPLATES: ImportTemplate[] = [studentsFull, teachers, drivers, classMembers, assignments, payments]

export function importTemplate(id: string): ImportTemplate | undefined {
  return IMPORT_TEMPLATES.find((template) => template.id === id)
}

export type { ImportOptions }
