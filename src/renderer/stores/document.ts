import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { DocumentTemplate, DocumentTemplateFormData } from '../types/document'

export const useDocumentStore = defineStore('document', () => {
  const templates = ref<DocumentTemplate[]>([])
  const categories = ref<string[]>([
    '教案模板',
    '课程计划',
    '家长会通知',
    '成绩单',
    '学生花名册',
    '座位表',
    '字帖模板',
    '练习题模板',
    '考试卷模板',
    '作业模板',
    '评语模板',
    '其他模板'
  ])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 获取所有文档模板
  async function fetchTemplates() {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.documents.list()
      if (result.success) {
        templates.value = result.data || []
      } else {
        error.value = result.error
        templates.value = []
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取文档模板失败'
      templates.value = []
    } finally {
      loading.value = false
    }
  }

  // 根据分类获取文档模板
  async function fetchTemplatesByCategory(category: string) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.documents.listByCategory(category)
      if (result.success) {
        return { success: true, data: result.data }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取文档模板失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 根据ID获取文档模板
  async function fetchTemplateById(id: number) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.documents.getById(id)
      if (result.success) {
        return { success: true, data: result.data }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取文档模板失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 创建文档模板
  async function createTemplate(data: DocumentTemplateFormData) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.documents.create(data)
      if (result.success) {
        await fetchTemplates()
        return { success: true, data: result.data }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建文档模板失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 更新文档模板
  async function updateTemplate(id: number, data: DocumentTemplateFormData) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.documents.update(id, data)
      if (result.success) {
        await fetchTemplates()
        return { success: true, data: result.data }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新文档模板失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 删除文档模板
  async function deleteTemplate(id: number) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.documents.delete(id)
      if (result.success) {
        await fetchTemplates()
        return { success: true }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除文档模板失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 下载文档模板
  async function downloadTemplate(id: number) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.documents.download(id)
      if (result.success) {
        // 更新下载次数
        const template = templates.value.find(t => t.id === id)
        if (template) {
          template.download_count += 1
        }
        return { success: true, data: result.data }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '下载文档模板失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 搜索文档模板
  async function searchTemplates(keyword: string) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.documents.search(keyword)
      if (result.success) {
        return { success: true, data: result.data }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '搜索文档模板失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 重置状态
  function resetState() {
    templates.value = []
    error.value = null
  }

  return {
    templates: computed(() => templates.value),
    categories: computed(() => categories.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    
    fetchTemplates,
    fetchTemplatesByCategory,
    fetchTemplateById,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    downloadTemplate,
    searchTemplates,
    resetState
  }
})