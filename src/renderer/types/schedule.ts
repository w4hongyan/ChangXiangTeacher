export interface Schedule {
  id?: number
  classId: number
  subject: string
  teacher: string
  location: string
  dayOfWeek: number // 1-7 (周一到周日)
  period: number // 节次
  weeks: number[] // 周次数组
  notes?: string
  createdAt?: string
  updatedAt?: string
}

export interface ScheduleQueryParams {
  classId?: number
  week?: number
  dayOfWeek?: number
  subject?: string
  teacher?: string
}

export interface TimePeriod {
  id: number
  name: string
  startTime: string
  endTime: string
}

export interface WeekDay {
  label: string
  value: number
}

export interface ScheduleConflict {
  schedule1: Schedule
  schedule2: Schedule
  conflictType: 'time' | 'teacher' | 'location'
  message: string
}

export interface ScheduleImportData {
  schedules: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>[]
  conflicts?: ScheduleConflict[]
}

export interface ScheduleExportOptions {
  format: 'excel' | 'pdf' | 'csv'
  classId?: number
  week?: number
  includeNotes?: boolean
}