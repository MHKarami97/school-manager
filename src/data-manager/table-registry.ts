import { LEVELS } from '@/config/levels.config'
import { clonePlain, dropEmptyObject, getPath, type PlainRecord } from './record-path'

export type FieldType = 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'date' | 'time' | 'ref' | 'list' | 'numlist'
export type GroupId = 'students' | 'attendance' | 'service' | 'finance' | 'planning' | 'events' | 'exams'
export type RelationAction = 'delete' | 'nullify' | 'array-remove'

export interface Option {
  value: string
  label: string
}

export interface FieldDef {
  key: string
  label: string
  type: FieldType
  required?: boolean
  nullable?: boolean
  options?: Option[]
  ref?: string
  readonly?: boolean
  keyPart?: boolean
  inList?: boolean
  help?: string
}

export interface RelationDef {
  child: string
  field: string
  action: RelationAction
}

export interface TableDef {
  name: string
  label: string
  group: GroupId
  keyPath: string
  fields: FieldDef[] | null
  create: () => PlainRecord
  idOf?: (record: PlainRecord) => string
  labelOf: (record: PlainRecord) => string
  relations: RelationDef[]
  normalize?: (record: PlainRecord) => PlainRecord
}

export const GROUP_LABELS: Record<GroupId, string> = {
  students: 'دانش‌آموزان و معلمان',
  attendance: 'حضور و غیاب',
  service: 'سرویس مدارس',
  finance: 'مالی',
  planning: 'برنامه‌ریزی',
  events: 'رویدادها',
  exams: 'آزمون',
}

const GENDER: Option[] = [
  { value: 'male', label: 'پسر / آقا' },
  { value: 'female', label: 'دختر / خانم' },
]

const str = (record: PlainRecord, key: string): string => String(getPath(record, key) ?? '').trim()
const nameOfRecord = (record: PlainRecord): string => str(record, 'name') || str(record, 'title') || str(record, 'label') || str(record, 'id') || '—'

function levelIdForGrade(grade: number): string {
  return LEVELS.find((level) => level.grades.includes(grade))?.id ?? 'elementary'
}

function def(partial: Omit<TableDef, 'keyPath' | 'relations' | 'labelOf' | 'create'> & Partial<Pick<TableDef, 'keyPath' | 'relations' | 'labelOf' | 'create'>>): TableDef {
  return { keyPath: 'id', relations: [], labelOf: nameOfRecord, create: () => ({}), ...partial }
}

const STUDENT_CHILDREN: RelationDef[] = [
  { child: 'attMembers', field: 'studentId', action: 'delete' },
  { child: 'attProfiles', field: 'studentId', action: 'delete' },
  { child: 'attRecords', field: 'studentId', action: 'delete' },
  { child: 'attFollowUps', field: 'studentId', action: 'delete' },
  { child: 'attAudit', field: 'studentId', action: 'delete' },
  { child: 'svcStudents', field: 'studentId', action: 'delete' },
  { child: 'svcAssignments', field: 'studentId', action: 'delete' },
  { child: 'svcPayments', field: 'studentId', action: 'delete' },
  { child: 'enrollments', field: 'studentId', action: 'delete' },
  { child: 'studentGroups', field: 'studentIds', action: 'array-remove' },
]

export const TABLES: TableDef[] = [
  def({
    name: 'students',
    label: 'دانش‌آموزان',
    group: 'students',
    labelOf: (r) => `${str(r, 'firstName')} ${str(r, 'lastName')}`.trim() || '—',
    fields: [
      { key: 'firstName', label: 'نام', type: 'text', required: true, inList: true },
      { key: 'lastName', label: 'نام خانوادگی', type: 'text', required: true, inList: true },
      { key: 'grade', label: 'پایه (۱ تا ۱۲)', type: 'number', required: true, inList: true },
      { key: 'gender', label: 'جنسیت', type: 'select', options: GENDER, required: true, inList: true },
      { key: 'gpa', label: 'معدل', type: 'number', nullable: true },
      { key: 'disciplineScore', label: 'امتیاز انضباطی', type: 'number', nullable: true },
      { key: 'isAcademicallyWeak', label: 'ضعیف علمی', type: 'boolean' },
      { key: 'isDisruptive', label: 'بی‌انضباط', type: 'boolean' },
      { key: 'statusTags', label: 'برچسب‌های وضعیت (با ویرگول)', type: 'list' },
      { key: 'currentGroupId', label: 'گروه فعلی', type: 'ref', ref: 'studentGroups', nullable: true },
    ],
    create: () => ({ firstName: '', lastName: '', gender: 'male', grade: 1, levelId: 'elementary', gpa: null, gpaBand: null, disciplineScore: null, isAcademicallyWeak: false, isDisruptive: false, statusTags: [], currentGroupId: null, yearlyRecords: [], createdAt: 0, updatedAt: 0 }),
    normalize: (r) => ({ ...r, levelId: levelIdForGrade(Number(r.grade)) }),
    relations: STUDENT_CHILDREN,
  }),
  def({
    name: 'teachers',
    label: 'معلمان',
    group: 'students',
    fields: [
      { key: 'name', label: 'نام', type: 'text', required: true, inList: true },
      { key: 'gender', label: 'جنسیت', type: 'select', options: GENDER, nullable: true, inList: true },
      { key: 'courseIds', label: 'شناسه‌ی دروس (با ویرگول)', type: 'list' },
      { key: 'maxWeeklyHours', label: 'سقف ساعت هفتگی', type: 'number', nullable: false },
      { key: 'maxDailyHours', label: 'سقف ساعت روزانه', type: 'number', nullable: false },
      { key: 'allowedGrades', label: 'پایه‌های مجاز (با ویرگول)', type: 'numlist' },
    ],
    create: () => ({ name: '', gender: null, courseIds: [], createdAt: 0 }),
    relations: [
      { child: 'attClassrooms', field: 'teacherId', action: 'nullify' },
      { child: 'extraClasses', field: 'teacherId', action: 'nullify' },
    ],
  }),
  def({
    name: 'attClassrooms',
    label: 'کلاس‌های حضور و غیاب',
    group: 'attendance',
    fields: [
      { key: 'name', label: 'نام کلاس', type: 'text', required: true, inList: true },
      { key: 'grade', label: 'پایه', type: 'number', required: true, inList: true },
      { key: 'academicYear', label: 'سال تحصیلی', type: 'text', inList: true },
      { key: 'shift', label: 'شیفت', type: 'text' },
      { key: 'teacherId', label: 'معلم', type: 'ref', ref: 'teachers', nullable: true, inList: true },
    ],
    create: () => ({ name: '', grade: 1, academicYear: '', shift: '', teacherId: null, createdAt: 0, updatedAt: 0 }),
    relations: [
      { child: 'attMembers', field: 'classroomId', action: 'delete' },
      { child: 'attRecords', field: 'classroomId', action: 'delete' },
      { child: 'attFollowUps', field: 'classroomId', action: 'delete' },
      { child: 'attAudit', field: 'classroomId', action: 'delete' },
    ],
  }),
  def({
    name: 'attMembers',
    label: 'اعضای کلاس‌ها',
    group: 'attendance',
    idOf: (r) => `${str(r, 'classroomId')}|${str(r, 'studentId')}`,
    labelOf: (r) => `${str(r, 'classroomId').slice(0, 6)} ← ${str(r, 'studentId').slice(0, 6)}`,
    fields: [
      { key: 'classroomId', label: 'کلاس', type: 'ref', ref: 'attClassrooms', required: true, keyPart: true, inList: true },
      { key: 'studentId', label: 'دانش‌آموز', type: 'ref', ref: 'students', required: true, keyPart: true, inList: true },
    ],
    create: () => ({ classroomId: '', studentId: '', createdAt: 0 }),
  }),
  def({
    name: 'attProfiles',
    label: 'اطلاعات تماس و شناسه‌ی دانش‌آموزان',
    group: 'students',
    keyPath: 'studentId',
    labelOf: (r) => str(r, 'primaryParent.phone') || str(r, 'studentId').slice(0, 8),
    fields: [
      { key: 'studentId', label: 'دانش‌آموز', type: 'ref', ref: 'students', required: true, keyPart: true, inList: true },
      { key: 'primaryParent.phone', label: 'شماره‌ی اصلی والدین', type: 'text', inList: true },
      { key: 'primaryParent.relation', label: 'نسبت', type: 'text', inList: true },
      { key: 'secondaryParent.phone', label: 'شماره‌ی دوم', type: 'text' },
      { key: 'secondaryParent.relation', label: 'نسبت شماره‌ی دوم', type: 'text' },
      { key: 'nfcSerial', label: 'سریال NFC', type: 'text', nullable: false },
      { key: 'guid', label: 'GUID (خودکار)', type: 'text', readonly: true },
    ],
    create: () => ({ studentId: '', guid: crypto.randomUUID(), primaryParent: { phone: '', relation: '' }, createdAt: 0, updatedAt: 0 }),
    normalize: (r) => {
      const next = clonePlain(r)
      dropEmptyObject(next, 'secondaryParent')
      return next
    },
  }),
  def({
    name: 'attRecords',
    label: 'رکوردهای حضور و غیاب',
    group: 'attendance',
    idOf: (r) => `${str(r, 'classroomId')}|${str(r, 'studentId')}|${str(r, 'date')}`,
    labelOf: (r) => `${str(r, 'date')} ${str(r, 'status')}`,
    fields: [
      { key: 'classroomId', label: 'کلاس', type: 'ref', ref: 'attClassrooms', required: true, keyPart: true, inList: true },
      { key: 'studentId', label: 'دانش‌آموز', type: 'ref', ref: 'students', required: true, keyPart: true, inList: true },
      { key: 'date', label: 'تاریخ', type: 'date', required: true, keyPart: true, inList: true },
      { key: 'status', label: 'وضعیت', type: 'select', required: true, inList: true, options: [
        { value: 'present', label: 'حاضر' }, { value: 'absent', label: 'غایب' }, { value: 'late', label: 'تأخیر' }, { value: 'excused', label: 'موجه' },
      ] },
      { key: 'arrivalTime', label: 'ساعت ورود', type: 'time' },
      { key: 'excuseReason', label: 'دلیل موجه', type: 'text' },
      { key: 'exit.time', label: 'ساعت خروج', type: 'time' },
      { key: 'exit.reason', label: 'دلیل خروج', type: 'text' },
      { key: 'exit.receiver', label: 'تحویل‌گیرنده', type: 'text' },
    ],
    create: () => ({ classroomId: '', studentId: '', date: '', status: 'present', arrivalTime: '', excuseReason: '', source: 'manual', exit: null, createdAt: 0, updatedAt: 0 }),
    normalize: (r) => {
      const next = clonePlain(r)
      dropEmptyObject(next, 'exit')
      if (!('exit' in next)) next.exit = null
      return next
    },
  }),
  def({
    name: 'attFollowUps',
    label: 'پیگیری غایبین',
    group: 'attendance',
    idOf: (r) => `${str(r, 'classroomId')}|${str(r, 'studentId')}|${str(r, 'date')}`,
    labelOf: (r) => `${str(r, 'date')} ${str(r, 'status')}`,
    fields: [
      { key: 'classroomId', label: 'کلاس', type: 'ref', ref: 'attClassrooms', required: true, keyPart: true, inList: true },
      { key: 'studentId', label: 'دانش‌آموز', type: 'ref', ref: 'students', required: true, keyPart: true, inList: true },
      { key: 'date', label: 'تاریخ', type: 'date', required: true, keyPart: true, inList: true },
      { key: 'status', label: 'وضعیت', type: 'select', required: true, inList: true, options: [
        { value: 'none', label: 'پیگیری نشده' }, { value: 'called', label: 'تماس گرفته شد' }, { value: 'no-answer', label: 'پاسخ نداد' },
      ] },
      { key: 'note', label: 'یادداشت', type: 'textarea', inList: true },
    ],
    create: () => ({ classroomId: '', studentId: '', date: '', status: 'none', note: '', updatedAt: 0 }),
  }),
  def({
    name: 'svcDrivers',
    label: 'رانندگان سرویس',
    group: 'service',
    labelOf: (r) => str(r, 'fullName') || '—',
    fields: [
      { key: 'fullName', label: 'نام راننده', type: 'text', required: true, inList: true },
      { key: 'gender', label: 'جنسیت', type: 'select', options: GENDER, required: true },
      { key: 'phone', label: 'شماره', type: 'text', inList: true },
      { key: 'vehicleKind', label: 'نوع خودرو', type: 'select', required: true, options: [
        { value: 'sedan', label: 'سواری' }, { value: 'van', label: 'ون' }, { value: 'minibus', label: 'مینی‌بوس' }, { value: 'other', label: 'سایر' },
      ] },
      { key: 'vehicleModel', label: 'مدل', type: 'text', inList: true },
      { key: 'vehicleYear', label: 'سال ساخت', type: 'number', nullable: true },
      { key: 'vehicleColor', label: 'رنگ', type: 'text' },
      { key: 'plate', label: 'پلاک', type: 'text', inList: true },
      { key: 'seatLayout.rows', label: 'چیدمان صندلی (تعداد هر ردیف، مثل 1,3)', type: 'numlist', required: true, help: 'ردیف اول کنار راننده است.' },
      { key: 'coverageRegions', label: 'مناطق تحت پوشش (با ویرگول)', type: 'list' },
      { key: 'note', label: 'توضیحات', type: 'textarea' },
      { key: 'isActive', label: 'فعال', type: 'boolean', inList: true },
    ],
    create: () => ({ fullName: '', gender: 'male', phone: '', vehicleKind: 'sedan', vehicleModel: '', vehicleYear: null, vehicleColor: '', plate: '', seatLayout: { rows: [1, 3] }, coverageRegions: [], baseLocation: null, note: '', isActive: true, createdAt: 0, updatedAt: 0 }),
    relations: [
      { child: 'svcAssignments', field: 'driverId', action: 'delete' },
      { child: 'svcDriverStates', field: 'driverId', action: 'delete' },
    ],
  }),
  def({
    name: 'svcStudents',
    label: 'دانش‌آموزان سرویس (آدرس)',
    group: 'service',
    keyPath: 'studentId',
    labelOf: (r) => str(r, 'address.city') || str(r, 'studentId').slice(0, 8),
    fields: [
      { key: 'studentId', label: 'دانش‌آموز', type: 'ref', ref: 'students', required: true, keyPart: true, inList: true },
      { key: 'isEnrolled', label: 'دارای سرویس', type: 'boolean', inList: true },
      { key: 'address.province', label: 'استان', type: 'text' },
      { key: 'address.city', label: 'شهر', type: 'text', inList: true },
      { key: 'address.region', label: 'منطقه', type: 'text', inList: true },
      { key: 'address.street', label: 'خیابان', type: 'text' },
      { key: 'address.alley', label: 'کوچه', type: 'text' },
      { key: 'address.building', label: 'ساختمان', type: 'text' },
      { key: 'address.plaque', label: 'پلاک', type: 'text' },
      { key: 'address.unit', label: 'واحد', type: 'text' },
      { key: 'address.landmark', label: 'نشانه', type: 'text' },
      { key: 'pickupTime', label: 'ساعت سوار شدن', type: 'time' },
      { key: 'location.lat', label: 'عرض جغرافیایی', type: 'number', nullable: false },
      { key: 'location.lng', label: 'طول جغرافیایی', type: 'number', nullable: false },
      { key: 'receiverName', label: 'تحویل‌گیرنده', type: 'text' },
      { key: 'receiverPhone', label: 'شماره‌ی تحویل‌گیرنده', type: 'text' },
      { key: 'returnAddressNote', label: 'آدرس برگشت', type: 'text' },
      { key: 'note', label: 'یادداشت', type: 'textarea' },
    ],
    create: () => ({ studentId: '', isEnrolled: true, address: { province: '', city: '', region: '', street: '', alley: '', building: '', plaque: '', unit: '', landmark: '' }, location: null, pickupTime: '', returnAddressNote: '', receiverName: '', receiverPhone: '', note: '', createdAt: 0, updatedAt: 0 }),
    normalize: (r) => {
      const next = clonePlain(r)
      const location = getPath(next, 'location') as PlainRecord | null | undefined
      if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') next.location = null
      return next
    },
  }),
  def({
    name: 'svcPlans',
    label: 'طرح‌های سرویس',
    group: 'service',
    labelOf: (r) => `${str(r, 'title')} (${str(r, 'academicYear')})`,
    fields: [
      { key: 'academicYear', label: 'سال تحصیلی', type: 'text', required: true, inList: true },
      { key: 'title', label: 'عنوان', type: 'text', required: true, inList: true },
      { key: 'status', label: 'وضعیت', type: 'select', required: true, inList: true, options: [{ value: 'draft', label: 'پیش‌نویس' }, { value: 'final', label: 'نهایی' }] },
      { key: 'defaultMonthlyFee', label: 'هزینه‌ی ماهانه‌ی پیش‌فرض', type: 'number', required: true, inList: true },
      { key: 'months', label: 'ماه‌ها (با ویرگول، مثل 1405-07)', type: 'list' },
    ],
    create: () => ({ academicYear: '', title: '', status: 'draft', months: [], defaultMonthlyFee: 0, createdAt: 0, updatedAt: 0 }),
    relations: [
      { child: 'svcAssignments', field: 'planId', action: 'delete' },
      { child: 'svcDriverStates', field: 'planId', action: 'delete' },
      { child: 'svcPayments', field: 'planId', action: 'delete' },
    ],
  }),
  def({
    name: 'svcAssignments',
    label: 'تخصیص سرویس',
    group: 'service',
    idOf: (r) => `${str(r, 'planId')}|${str(r, 'studentId')}`,
    labelOf: (r) => `${str(r, 'studentId').slice(0, 6)} ← ${str(r, 'driverId').slice(0, 6)}`,
    fields: [
      { key: 'planId', label: 'طرح', type: 'ref', ref: 'svcPlans', required: true, keyPart: true, inList: true },
      { key: 'studentId', label: 'دانش‌آموز', type: 'ref', ref: 'students', required: true, keyPart: true, inList: true },
      { key: 'driverId', label: 'راننده', type: 'ref', ref: 'svcDrivers', required: true, inList: true },
      { key: 'seatId', label: 'صندلی (مثل 0-0)', type: 'text', nullable: true, inList: true },
      { key: 'status', label: 'وضعیت', type: 'select', required: true, options: [{ value: 'draft', label: 'پیش‌نویس' }, { value: 'confirmed', label: 'تأییدشده' }] },
      { key: 'monthlyFee', label: 'هزینه‌ی ماهانه', type: 'number', required: true, inList: true },
    ],
    create: () => ({ planId: '', studentId: '', driverId: '', seatId: null, status: 'draft', monthlyFee: 0, createdAt: 0, updatedAt: 0 }),
  }),
  def({
    name: 'svcPayments',
    label: 'پرداخت‌های سرویس',
    group: 'service',
    labelOf: (r) => `${str(r, 'month')} — ${str(r, 'amount')}`,
    fields: [
      { key: 'planId', label: 'طرح', type: 'ref', ref: 'svcPlans', required: true, inList: true },
      { key: 'studentId', label: 'دانش‌آموز', type: 'ref', ref: 'students', required: true, inList: true },
      { key: 'month', label: 'ماه (مثل 1405-07)', type: 'text', required: true, inList: true },
      { key: 'amount', label: 'مبلغ', type: 'number', required: true, inList: true },
      { key: 'paidAt', label: 'تاریخ پرداخت', type: 'date', required: true, inList: true },
      { key: 'method', label: 'روش', type: 'select', required: true, options: [
        { value: 'cash', label: 'نقدی' }, { value: 'card', label: 'کارت‌خوان' }, { value: 'transfer', label: 'کارت‌به‌کارت' }, { value: 'other', label: 'سایر' },
      ] },
      { key: 'note', label: 'یادداشت', type: 'text' },
    ],
    create: () => ({ planId: '', studentId: '', month: '', amount: 0, paidAt: '', method: 'cash', note: '', createdAt: 0 }),
  }),
  def({
    name: 'extraClasses',
    label: 'کلاس‌های تقویتی و فوق‌برنامه',
    group: 'events',
    labelOf: (r) => str(r, 'title') || '—',
    fields: [
      { key: 'title', label: 'عنوان', type: 'text', required: true, inList: true },
      { key: 'type', label: 'نوع', type: 'select', required: true, inList: true, options: [{ value: 'reinforcement', label: 'تقویتی' }, { value: 'extracurricular', label: 'فوق‌برنامه' }] },
      { key: 'teacherId', label: 'معلم', type: 'ref', ref: 'teachers', nullable: true, inList: true },
      { key: 'capacity', label: 'ظرفیت', type: 'number', required: true, inList: true },
      { key: 'cost', label: 'هزینه', type: 'number', required: true },
      { key: 'startTime', label: 'ساعت شروع', type: 'time' },
      { key: 'endTime', label: 'ساعت پایان', type: 'time' },
      { key: 'startDate', label: 'تاریخ شروع', type: 'date' },
      { key: 'endDate', label: 'تاریخ پایان', type: 'date' },
      { key: 'dayIndexes', label: 'روزهای هفته (۰=شنبه، با ویرگول)', type: 'numlist' },
      { key: 'allowedGrades', label: 'پایه‌های مجاز (با ویرگول)', type: 'numlist' },
    ],
    create: () => ({ title: '', type: 'reinforcement', relatedCourseId: null, teacherId: null, capacity: 10, dayIndexes: [], startTime: '', endTime: '', startDate: '', endDate: '', allowedGrades: [], cost: 0, createdAt: 0, updatedAt: 0 }),
    relations: [{ child: 'enrollments', field: 'extraClassId', action: 'delete' }],
  }),
  def({
    name: 'enrollments',
    label: 'ثبت‌نام فوق‌برنامه',
    group: 'events',
    labelOf: (r) => `${str(r, 'studentId').slice(0, 6)} ← ${str(r, 'extraClassId').slice(0, 6)}`,
    fields: [
      { key: 'extraClassId', label: 'کلاس', type: 'ref', ref: 'extraClasses', required: true, inList: true },
      { key: 'studentId', label: 'دانش‌آموز', type: 'ref', ref: 'students', required: true, inList: true },
      { key: 'enrollmentDate', label: 'تاریخ ثبت‌نام', type: 'date', inList: true },
      { key: 'status', label: 'وضعیت', type: 'select', required: true, options: [{ value: 'active', label: 'فعال' }, { value: 'cancelled', label: 'لغوشده' }] },
      { key: 'waitlisted', label: 'در صف انتظار', type: 'boolean', inList: true },
    ],
    create: () => ({ extraClassId: '', studentId: '', enrollmentDate: '', status: 'active', waitlisted: false, createdAt: 0, updatedAt: 0 }),
  }),
  def({
    name: 'annualPlans',
    label: 'برنامه‌های مالی سالانه',
    group: 'finance',
    labelOf: (r) => str(r, 'academicYear') || '—',
    fields: [
      { key: 'academicYear', label: 'سال تحصیلی', type: 'text', required: true, inList: true },
      { key: 'totalBudget', label: 'کل بودجه', type: 'number', required: true, inList: true },
      { key: 'status', label: 'وضعیت', type: 'text', required: true, inList: true },
    ],
    create: () => ({ academicYear: '', totalBudget: 0, status: 'active', createdAt: 0, updatedAt: 0 }),
    relations: [
      { child: 'budgetCategories', field: 'planId', action: 'delete' },
      { child: 'transactions', field: 'planId', action: 'delete' },
    ],
  }),
  def({
    name: 'budgetCategories',
    label: 'سرفصل‌های بودجه',
    group: 'finance',
    labelOf: (r) => str(r, 'title') || '—',
    fields: [
      { key: 'planId', label: 'برنامه‌ی مالی', type: 'ref', ref: 'annualPlans', required: true, inList: true },
      { key: 'title', label: 'عنوان', type: 'text', required: true, inList: true },
      { key: 'annualBudget', label: 'بودجه‌ی سالانه', type: 'number', required: true, inList: true },
    ],
    create: () => ({ planId: '', title: '', annualBudget: 0, createdAt: 0, updatedAt: 0 }),
    relations: [{ child: 'transactions', field: 'categoryId', action: 'delete' }],
  }),
  def({
    name: 'transactions',
    label: 'تراکنش‌های مالی',
    group: 'finance',
    labelOf: (r) => `${str(r, 'date')} — ${str(r, 'amount')}`,
    fields: [
      { key: 'planId', label: 'برنامه‌ی مالی', type: 'ref', ref: 'annualPlans', required: true },
      { key: 'categoryId', label: 'سرفصل', type: 'ref', ref: 'budgetCategories', required: true, inList: true },
      { key: 'type', label: 'نوع', type: 'select', required: true, inList: true, options: [{ value: 'expense', label: 'هزینه' }, { value: 'income', label: 'درآمد' }] },
      { key: 'amount', label: 'مبلغ', type: 'number', required: true, inList: true },
      { key: 'date', label: 'تاریخ', type: 'date', required: true, inList: true },
      { key: 'description', label: 'توضیح', type: 'text', inList: true },
    ],
    create: () => ({ planId: '', categoryId: '', type: 'expense', amount: 0, date: '', description: '', attachmentDataUrl: null, createdAt: 0, updatedAt: 0 }),
  }),
]

const JSON_ONLY: { name: string; label: string; group: GroupId; relations?: RelationDef[] }[] = [
  { name: 'schedules', label: 'برنامه‌های هفتگی', group: 'planning' },
  { name: 'studentGroups', label: 'گروه‌بندی دانش‌آموزان', group: 'students', relations: [{ child: 'students', field: 'currentGroupId', action: 'nullify' }] },
  { name: 'lessonPlans', label: 'طرح درس', group: 'planning' },
  { name: 'sportFacilities', label: 'فضاهای ورزشی', group: 'planning' },
  { name: 'sportPlans', label: 'برنامه‌های ورزش', group: 'planning' },
  { name: 'teachingPlans', label: 'چارت تدریس', group: 'planning' },
  { name: 'celebrations', label: 'جشن‌ها و مراسم', group: 'events' },
  { name: 'elections', label: 'انتخابات', group: 'events' },
  { name: 'invitations', label: 'دعوت‌نامه‌ها', group: 'events' },
  { name: 'questions', label: 'بانک سوالات', group: 'exams' },
  { name: 'exams', label: 'آزمون‌ها', group: 'exams' },
  { name: 'examTemplates', label: 'قالب‌های آزمون', group: 'exams' },
  { name: 'examVersions', label: 'نسخه‌های آزمون', group: 'exams' },
  { name: 'examRooms', label: 'سالن‌های امتحان', group: 'exams' },
  { name: 'examSessions', label: 'جلسات امتحان', group: 'exams' },
  { name: 'attAudit', label: 'تاریخچه‌ی تغییرات حضور و غیاب', group: 'attendance' },
  { name: 'svcDriverStates', label: 'تأیید رانندگان سرویس', group: 'service' },
]

for (const item of JSON_ONLY) {
  TABLES.push(def({ name: item.name, label: item.label, group: item.group, fields: null, relations: item.relations ?? [] }))
}

const BY_NAME = new Map(TABLES.map((table) => [table.name, table]))

/** جدولی که در رجیستری نیست (مثلاً در نسخه‌های آینده اضافه شده) به‌صورت JSON قابل مدیریت است. */
export function tableDef(name: string): TableDef {
  return BY_NAME.get(name) ?? def({ name, label: name, group: 'planning', fields: null })
}

export function isKnownTable(name: string): boolean {
  return BY_NAME.has(name)
}

export function listFields(table: TableDef): FieldDef[] {
  return (table.fields ?? []).filter((field) => field.inList)
}

export function autoColumns(record: PlainRecord): string[] {
  return Object.keys(record)
    .filter((key) => {
      const value = record[key]
      return value === null || ['string', 'number', 'boolean'].includes(typeof value)
    })
    .filter((key) => !/DataUrl$/i.test(key))
    .slice(0, 5)
}
