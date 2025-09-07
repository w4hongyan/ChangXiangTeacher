export interface Class {
  id?: number
  name: string // 班级名称
  grade: string // 年级
  class_number: string // 班级序号
  homeroom_teacher: string // 班主任
  teacher_phone?: string // 班主任电话
  description?: string // 班级描述
  max_students: number // 最大学生数
  semester: string // 学期
  year: number // 学年
  is_active: boolean // 是否启用
  created_at?: string
  updated_at?: string
}

export interface ClassFormData {
  name: string
  grade: string
  class_number: string
  homeroom_teacher: string
  teacher_phone?: string
  description?: string
  max_students: number
  semester: string
  year: number
}

export interface ClassListItem {
  id: number
  name: string
  grade: string
  class_number: string
  homeroom_teacher: string
  teacher_phone?: string
  student_count?: number
  created_at: string
}