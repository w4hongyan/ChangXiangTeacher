// 成绩相关类型定义

export interface Grade {
  id: number
  student_id: number
  student_name?: string
  student_number?: string
  class_id: number
  class_name?: string
  subject: string
  score: number
  exam_type: string
  exam_date?: string
  semester?: string
  year?: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface GradeFormData {
  student_id: number
  class_id: number
  subject: string
  score: number
  exam_type: string
  exam_date?: string
  semester?: string
  year?: number
  notes?: string
}

export interface GradeQueryParams {
  student_id?: number
  class_id?: number
  subject?: string
  exam_type?: string
  semester?: string
  year?: number
  page?: number
  page_size?: number
}

export interface GradeListItem extends Grade {
  // 继承自Grade，包含所有字段
}

export interface GradeStats {
  subject: string
  class_id: number
  class_name: string
  average_score: number
  max_score: number
  min_score: number
  student_count: number
  pass_rate: number
  excellent_rate: number
}

// 学科列表
export const SUBJECTS = [
  '语文',
  '数学',
  '英语',
  '物理',
  '化学',
  '生物',
  '政治',
  '历史',
  '地理',
  '体育',
  '音乐',
  '美术',
  '信息技术'
] as const

export type Subject = typeof SUBJECTS[number]

// 考试类型
export const EXAM_TYPES = [
  '期中考试',
  '期末考试',
  '月考',
  '周考',
  '单元测试',
  '随堂测验',
  '模拟考试',
  '中考',
  '高考'
] as const

export type ExamType = typeof EXAM_TYPES[number]

// 学期类型
export const SEMESTERS = ['上学期', '下学期'] as const
export type Semester = typeof SEMESTERS[number]