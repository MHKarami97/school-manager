export interface GridItem {
  key: string
  classId: string
  title: string
  subtitle: string
  color: string
  locked: boolean
  severity: 'error' | 'warning' | null
  noTeacher: boolean
}

export interface GridPeriod {
  index: number
  start: string
  end: string
}

export interface DragPayload {
  classId: string
  dayIndex: number
  periodIndex: number
}
