// 座位排位管理相关类型定义

export interface Seat {
  id?: number
  class_id: number
  student_id?: number | null
  row: number
  column: number
  seat_type?: 'normal' | 'disabled' | 'teacher' | 'empty'
  created_at?: string
  updated_at?: string
}

export interface SeatLayout {
  rows: number
  columns: number
  seats: SeatPosition[][]
}

export interface SeatPosition {
  row: number
  column: number
  type: 'seat' | 'aisle' | 'podium' | 'empty'
  occupied?: boolean
  student_id?: number | null
  student_name?: string
}

export interface ClassConfig {
  id?: number
  class_id: number
  rows: number
  columns: number
  seat_layout?: SeatLayout
  numbering_mode?: string
  numbering_direction?: string
  point_rules?: any
  created_at?: string
  updated_at?: string
}

export interface SeatingArrangement {
  class_id: number
  class_name: string
  layout: SeatLayout
  students: StudentInSeat[]
  unassigned_students: UnassignedStudent[]
  total_students: number
  assigned_students: number
}

export interface StudentInSeat {
  id: number
  name: string
  student_id?: string
  gender?: string
  row: number
  column: number
  seat_id?: number
}

export interface UnassignedStudent {
  id: number
  name: string
  student_id?: string
  gender?: string
}

export interface SeatLayoutTemplate {
  name: string
  rows: number
  columns: number
  description: string
  layout: SeatPosition[][]
}

export interface SeatingFormData {
  class_id: number
  rows: number
  columns: number
  seat_layout: SeatPosition[][]
  numbering_mode?: string
  numbering_direction?: string
}