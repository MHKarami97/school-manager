import type { AttendanceSource, MarkResult, StudentIdentifier } from '@/types'

export interface AttendanceSink {
  markPresent(identifier: StudentIdentifier): Promise<MarkResult>
}

export interface AttendanceInputStrategy {
  readonly source: AttendanceSource
  isSupported(): boolean
  start(sink: AttendanceSink): Promise<void>
  stop(): void
}

export class ManualInputStrategy implements AttendanceInputStrategy {
  readonly source: AttendanceSource = 'manual'
  private sink: AttendanceSink | null = null

  isSupported(): boolean {
    return true
  }

  async start(sink: AttendanceSink): Promise<void> {
    this.sink = sink
  }

  stop(): void {
    this.sink = null
  }

  async select(studentId: string): Promise<MarkResult> {
    if (!this.sink) return { ok: false, reason: 'no-sheet' }
    return this.sink.markPresent({ kind: 'student-id', value: studentId })
  }
}

export function createInputStrategy(source: AttendanceSource): AttendanceInputStrategy {
  if (source === 'manual') return new ManualInputStrategy()
  throw new Error(`روش ورودی «${source}» در فاز ۱ پیاده‌سازی نشده است.`)
}
