export interface CalendarEvent {
  id?: number
  title: string
  type: 'exam' | 'homework' | 'activity' | 'meeting' | 'holiday' | 'other'
  date: string
  time?: string
  description?: string
  reminder: boolean
  reminderMinutes?: number
  isCountdown?: boolean
  color?: string
  createdAt?: string
  updatedAt?: string
}

export interface CalendarQueryParams {
  startDate?: string
  endDate?: string
  type?: string
  isCountdown?: boolean
  hasReminder?: boolean
}

export interface CalendarDay {
  date: string
  day: number
  isCurrentMonth: boolean
  isToday: boolean
  events?: CalendarEvent[]
}

export interface CalendarMonth {
  year: number
  month: number
  days: CalendarDay[]
}

export interface EventReminder {
  id?: number
  eventId: number
  reminderTime: string
  isTriggered: boolean
  createdAt?: string
}

export interface CountdownEvent {
  id: number
  title: string
  date: string
  type: string
  daysRemaining: number
}

export interface CalendarSettings {
  defaultReminderMinutes: number
  weekStartsOn: 0 | 1 // 0: 周日, 1: 周一
  showWeekNumbers: boolean
  eventColors: Record<string, string>
}

export interface CalendarExportOptions {
  format: 'ics' | 'pdf' | 'excel'
  startDate: string
  endDate: string
  includeReminders?: boolean
  eventTypes?: string[]
}

export interface SemesterInfo {
  id?: number
  name: string
  startDate: string
  endDate: string
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}