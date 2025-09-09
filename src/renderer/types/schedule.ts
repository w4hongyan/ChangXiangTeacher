export interface Schedule {
  id: number
  class_id: number | null
  teacher_id: number | null
  teacher_name: string | null
  subject: string
  day_of_week: number // 1-7, 周一到周日
  start_time: string // HH:mm格式
  end_time: string // HH:mm格式
  classroom: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ScheduleFormData {
  id?: number
  class_id: number | null
  teacher_id: number | null
  teacher_name: string | null
  subject: string
  day_of_week: number
  start_time: string
  end_time: string
  classroom: string | null
  notes: string | null
}

export interface ClassSchedule extends Schedule {
  class_name: string | null
  grade: string | null
}

export interface TeacherSchedule extends Schedule {
  class_name: string | null
  grade: string | null
}