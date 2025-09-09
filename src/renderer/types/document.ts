export interface DocumentTemplate {
  id: number
  name: string
  description: string | null
  category: string
  content: string | null
  file_path: string | null
  file_size: number | null
  download_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DocumentTemplateFormData {
  id?: number
  name: string
  description: string | null
  category: string
  content: string | null
  file_path: string | null
  file_size: number | null
}

export interface DocumentCategory {
  id: number
  name: string
  description: string | null
}