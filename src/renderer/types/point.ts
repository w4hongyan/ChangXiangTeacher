export interface PointRecord {
  id: number
  student_id: number
  group_id?: number
  class_id: number
  points: number
  type: 'reward' | 'penalty'
  reason: string
  given_by: number
  given_date: string
  created_at: string
  updated_at: string
}

export interface PointRule {
  id: number
  name: string
  points: number
  type: 'reward' | 'penalty'
  enabled: boolean
}

export interface PointQueryParams {
  student_id?: number
  group_id?: number
  class_id?: number
  type?: 'reward' | 'penalty'
  start_date?: string
  end_date?: string
  page?: number
  page_size?: number
}

export interface PointFormData {
  student_id?: number
  group_id?: number
  class_id: number
  points: number
  type: 'reward' | 'penalty'
  reason: string
  given_by?: number
  given_date?: string
}

export interface StudentPointSummary {
  student_id: number
  student_name: string
  total_points: number
  reward_count: number
  penalty_count: number
}

export interface GroupPointRecord {
  group_name: string
  total_points: number
  members: StudentPointSummary[]
}