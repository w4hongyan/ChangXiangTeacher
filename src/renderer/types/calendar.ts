export interface Semester {
  id: number
  name: string
  start_date: string
  end_date: string
  year: number
  is_current: boolean
  created_at: string
  updated_at: string
}

export interface CalendarEvent {
  id: number
  title: string
  description: string | null
  event_date: string
  event_type: string
  color: string
  is_holiday: boolean
  semester_id: number | null
  created_at: string
  updated_at: string
}

export interface SemesterFormData {
  id?: number
  name: string
  start_date: string
  end_date: string
  year: number
  is_current: boolean
}

export interface CalendarEventFormData {
  id?: number
  title: string
  description: string | null
  event_date: string
  event_type: string
  color: string
  is_holiday: boolean
  semester_id: number | null
}