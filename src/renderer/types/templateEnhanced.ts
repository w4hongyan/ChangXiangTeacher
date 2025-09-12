// 增强版文档模板类型定义

export interface DocumentTemplate {
  id?: number
  name: string
  category: string
  description?: string
  content: string
  variables?: TemplateVariable[]
  settings?: TemplateSettings
  preview_image?: string
  tags?: string[]
  version?: string
  is_public?: boolean
  is_system?: boolean
  is_active?: boolean
  download_count?: number
  rating?: number
  created_by?: number
  created_at?: string
  updated_at?: string
}

export interface TemplateVariable {
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean' | 'table' | 'textarea'
  required?: boolean
  default_value?: any
  options?: string[] // for select/multiselect
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
  description?: string
  placeholder?: string
  group?: string // 变量分组
}

export interface TemplateSettings {
  output_format: 'html' | 'docx' | 'pdf' | 'xlsx'
  page_size?: 'A4' | 'A3' | 'Letter'
  orientation?: 'portrait' | 'landscape'
  margins?: {
    top: number
    right: number
    bottom: number
    left: number
  }
  font_family?: string
  font_size?: number
  line_height?: number
  auto_save?: boolean
  enable_preview?: boolean
  custom_css?: string
}

export interface GenerateDocumentParams {
  template_id: number
  variables: Record<string, any>
  output_path?: string
  format?: 'html' | 'docx' | 'pdf' | 'xlsx'
}

export interface DocumentGeneration {
  id: number
  template_id: number
  template_name: string
  output_format: string
  file_path: string
  variables: Record<string, any>
  created_at: string
}

export interface TemplateCategory {
  label: string
  value: string
  icon: string
  description: string
  count?: number
}

export interface TemplateQueryParams {
  category?: string
  keyword?: string
  tags?: string[]
  is_system?: boolean
  is_public?: boolean
  is_active?: boolean
  sort_by?: 'created_at' | 'name' | 'download_count' | 'rating'
  sort_order?: 'ASC' | 'DESC'
  limit?: number
  offset?: number
}

export interface TemplateImportOptions {
  file_path: string
  category?: string
  tags?: string[]
  is_public?: boolean
  overwrite_existing?: boolean
}

export interface TemplateExportOptions {
  template_ids: number[]
  output_path: string
  include_settings?: boolean
  include_variables?: boolean
}

export interface TemplateValidationResult {
  valid: boolean
  errors: Array<{
    field: string
    message: string
  }>
  warnings: Array<{
    field: string
    message: string
  }>
}

export interface TemplatePreviewData {
  content: string
  variables: Record<string, any>
  settings: TemplateSettings
}

// 模板编辑器相关类型
export interface EditorState {
  content: string
  variables: TemplateVariable[]
  settings: TemplateSettings
  isDirty: boolean
  lastSaved?: string
}

export interface EditorAction {
  type: 'insert_variable' | 'format_text' | 'insert_table' | 'insert_image'
  payload?: any
}

// 变量组
export interface VariableGroup {
  name: string
  label: string
  description?: string
  variables: TemplateVariable[]
  collapsed?: boolean
}

// 模板统计
export interface TemplateStats {
  total: number
  system: number
  user: number
  public: number
  byCategory: Record<string, number>
  byTag: Record<string, number>
  recentlyUsed: DocumentTemplate[]
  mostPopular: DocumentTemplate[]
}

// 模板搜索结果
export interface TemplateSearchResult {
  templates: DocumentTemplate[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// 模板操作结果
export interface TemplateOperationResult {
  success: boolean
  message?: string
  data?: any
  error?: string
}

// 文档生成选项
export interface DocumentGenerationOptions {
  template_id: number
  variables: Record<string, any>
  output_format: 'html' | 'docx' | 'pdf' | 'xlsx'
  output_path?: string
  open_after_generation?: boolean
  save_to_history?: boolean
}

// 批量操作
export interface BatchOperation {
  type: 'delete' | 'export' | 'duplicate' | 'change_category'
  template_ids: number[]
  options?: any
}

// 模板权限
export interface TemplatePermission {
  can_view: boolean
  can_edit: boolean
  can_delete: boolean
  can_duplicate: boolean
  can_share: boolean
}

// 模板分享
export interface TemplateShare {
  id: number
  template_id: number
  share_code: string
  expires_at?: string
  download_count: number
  created_at: string
}