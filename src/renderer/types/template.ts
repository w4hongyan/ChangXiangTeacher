export interface DocumentTemplate {
  id?: number
  name: string
  description: string
  category: 'notice' | 'schedule' | 'comment' | 'other'
  content: string
  variables?: string[]
  isSystem?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface TemplateQueryParams {
  category?: string
  keyword?: string
  isSystem?: boolean
}

export interface TemplateCategory {
  label: string
  value: string
  icon: string
  description?: string
}

export interface TemplateVariable {
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'select'
  required: boolean
  defaultValue?: string
  options?: string[] // for select type
  description?: string
}

export interface GeneratedDocument {
  id?: number
  templateId: number
  title: string
  content: string
  variables: Record<string, string>
  filePath?: string
  createdAt?: string
}

export interface DocumentGenerateOptions {
  templateId: number
  variables: Record<string, string>
  outputFormat: 'html' | 'pdf' | 'docx'
  fileName?: string
}

export interface TemplateImportData {
  templates: Omit<DocumentTemplate, 'id' | 'createdAt' | 'updatedAt'>[]
  conflicts?: string[]
}

export interface TemplateExportOptions {
  templateIds: number[]
  format: 'json' | 'zip'
  includeGeneratedDocs?: boolean
}

export interface PrintOptions {
  content: string
  title?: string
  orientation: 'portrait' | 'landscape'
  paperSize: 'A4' | 'A3' | 'Letter'
  margins?: {
    top: number
    right: number
    bottom: number
    left: number
  }
}

export interface TemplatePreview {
  html: string
  variables: Record<string, string>
  missingVariables: string[]
}