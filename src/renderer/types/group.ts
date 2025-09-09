export interface Group {
  id: number
  name: string
  class_id: number
  description?: string
  created_by: number
  created_at: string
  updated_at: string
}

export interface StudentGroup {
  id: number
  group_id: number
  student_id: number
  created_at: string
  updated_at: string
}

export interface GroupFormData {
  name: string
  class_id: number
  description?: string
}

export interface GroupMember {
  id: number
  group_id: number
  student_id: number
  student_name: string
  created_at: string
}

export interface GroupWithMembers extends Group {
  members: GroupMember[]
}

export interface GroupPointRecord {
  id: number
  group_id: number
  group_name: string
  class_id: number
  points: number
  type: 'reward' | 'penalty'
  reason: string
  given_by: number
  given_date: string
  created_at: string
  updated_at: string
  member_count: number
}