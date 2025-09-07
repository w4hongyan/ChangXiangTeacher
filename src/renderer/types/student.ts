export interface Student {
  id?: number
  student_id: string // 学号
  name: string // 姓名
  gender?: string // 性别
  birth_date?: string // 出生年月
  phone?: string // 联系电话
  parent_phone?: string // 家长电话
  email?: string // 邮箱
  address?: string // 住址
  photo_path?: string // 照片路径
  notes?: string // 备注
  class_id: number // 班级ID
  height?: number // 身高
  eyesight?: string // 视力
  special_needs?: string // 特殊需求
  is_active?: boolean // 是否启用
  created_at?: string
  updated_at?: string
}

export interface StudentFormData {
  student_id: string
  name: string
  gender?: string
  birth_date?: string
  phone?: string
  parent_phone?: string
  email?: string
  address?: string
  notes?: string
  class_id: number
  height?: number
  eyesight?: string
  special_needs?: string
}

export interface StudentListItem {
  id: number
  student_id: string
  name: string
  gender?: string
  birth_date?: string
  phone?: string
  parent_phone?: string
  email?: string
  address?: string
  class_id?: number // 班级ID
  class_name?: string // 班级名称
  is_active: boolean
  created_at: string
}

export interface StudentQueryParams {
  keyword?: string // 搜索关键词
  class_id?: number // 班级筛选
  is_active?: boolean // 状态筛选
  page?: number // 页码
  page_size?: number // 每页条数
}

export interface StudentImportData {
  student_id: string
  name: string
  gender?: string
  birth_date?: string
  phone?: string
  parent_phone?: string
  email?: string
  address?: string
  class_name: string // 班级名称，用于导入时匹配
  notes?: string
}

export interface ImportResult {
  success: boolean
  message: string
  total: number
  success_count: number
  error_count: number
  errors?: Array<{
    row: number
    message: string
  }>
}
