import { defineStore } from 'pinia'
import type { DocumentTemplate, TemplateQueryParams, TemplateCategory, GeneratedDocument, DocumentGenerateOptions, TemplateVariable } from '../types/template'

export const useTemplateStore = defineStore('template', {
  state: () => ({
    templates: [] as DocumentTemplate[],
    generatedDocuments: [] as GeneratedDocument[],
    loading: false,
    selectedCategory: 'all',
    searchKeyword: '',
    categories: [
      { label: '全部', value: 'all', icon: 'Grid', description: '所有模板' },
      { label: '通知公告', value: 'notice', icon: 'Megaphone', description: '各类通知和公告模板' },
      { label: '课程安排', value: 'schedule', icon: 'Calendar', description: '课程表、教学计划等' },
      { label: '评语评价', value: 'comment', icon: 'MessageSquare', description: '学生评语、评价模板' },
      { label: '其他', value: 'other', icon: 'FileText', description: '其他类型模板' }
    ] as TemplateCategory[],
    previewContent: '',
    previewVariables: {} as Record<string, string>
  }),

  getters: {
    // 过滤后的模板列表
    filteredTemplates: (state) => {
      let filtered = state.templates
      
      // 按分类过滤
      if (state.selectedCategory !== 'all') {
        filtered = filtered.filter(template => template.category === state.selectedCategory)
      }
      
      // 按关键词搜索
      if (state.searchKeyword.trim()) {
        const keyword = state.searchKeyword.toLowerCase()
        filtered = filtered.filter(template => 
          template.name.toLowerCase().includes(keyword) ||
          template.description.toLowerCase().includes(keyword)
        )
      }
      
      return filtered
    },

    // 系统模板
    systemTemplates: (state) => {
      return state.templates.filter(template => template.isSystem)
    },

    // 用户自定义模板
    userTemplates: (state) => {
      return state.templates.filter(template => !template.isSystem)
    },

    // 按分类分组的模板
    templatesByCategory: (state) => {
      const grouped = new Map<string, DocumentTemplate[]>()
      state.templates.forEach(template => {
        const category = template.category
        if (!grouped.has(category)) {
          grouped.set(category, [])
        }
        grouped.get(category)!.push(template)
      })
      return grouped
    },

    // 模板统计
    templateStats: (state) => {
      const stats = {
        total: state.templates.length,
        system: state.templates.filter(t => t.isSystem).length,
        user: state.templates.filter(t => !t.isSystem).length,
        byCategory: {} as Record<string, number>
      }
      
      state.templates.forEach(template => {
        stats.byCategory[template.category] = (stats.byCategory[template.category] || 0) + 1
      })
      
      return stats
    },

    // 最近生成的文档
    recentDocuments: (state) => {
      return state.generatedDocuments
        .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
        .slice(0, 10)
    },

    // 获取分类信息
    getCategoryInfo: (state) => {
      return (categoryValue: string) => {
        return state.categories.find(cat => cat.value === categoryValue)
      }
    }
  },

  actions: {
    // 加载模板列表
    async loadTemplates(params?: TemplateQueryParams) {
      this.loading = true
      try {
        const result = await window.electronAPI.templates.list(params)
        if (result.success) {
          this.templates = result.data
        }
        return result
      } catch (error) {
        console.error('加载模板失败:', error)
        return { success: false, error }
      } finally {
        this.loading = false
      }
    },

    // 创建模板
    async createTemplate(template: Omit<DocumentTemplate, 'id'>) {
      try {
        const result = await window.electronAPI.templates.create(template)
        if (result.success) {
          await this.loadTemplates()
        }
        return result
      } catch (error) {
        console.error('创建模板失败:', error)
        return { success: false, error }
      }
    },

    // 更新模板
    async updateTemplate(id: number, template: Partial<DocumentTemplate>) {
      try {
        const result = await window.electronAPI.templates.update(id, template)
        if (result.success) {
          await this.loadTemplates()
        }
        return result
      } catch (error) {
        console.error('更新模板失败:', error)
        return { success: false, error }
      }
    },

    // 删除模板
    async deleteTemplate(id: number) {
      try {
        const result = await window.electronAPI.templates.delete(id)
        if (result.success) {
          await this.loadTemplates()
        }
        return result
      } catch (error) {
        console.error('删除模板失败:', error)
        return { success: false, error }
      }
    },

    // 生成文档
    async generateDocument(options: DocumentGenerateOptions) {
      try {
        const result = await window.electronAPI.templates.generate(options)
        if (result.success) {
          await this.loadGeneratedDocuments()
        }
        return result
      } catch (error) {
        console.error('生成文档失败:', error)
        return { success: false, error }
      }
    },

    // 预览模板
    async previewTemplate(templateId: number, variables: Record<string, string>) {
      try {
        const result = await window.electronAPI.templates.preview(templateId, variables)
        if (result.success) {
          this.previewContent = result.data.html
          this.previewVariables = variables
        }
        return result
      } catch (error) {
        console.error('预览模板失败:', error)
        return { success: false, error }
      }
    },

    // 打印文档
    async printDocument(content: string, options?: any) {
      try {
        const result = await window.electronAPI.templates.print(content, options)
        return result
      } catch (error) {
        console.error('打印文档失败:', error)
        return { success: false, error }
      }
    },

    // 导入模板
    async importTemplates(data: any) {
      try {
        const result = await window.electronAPI.templates.import(data)
        if (result.success) {
          await this.loadTemplates()
        }
        return result
      } catch (error) {
        console.error('导入模板失败:', error)
        return { success: false, error }
      }
    },

    // 导出模板
    async exportTemplates(options: any) {
      try {
        const result = await window.electronAPI.templates.export(options)
        return result
      } catch (error) {
        console.error('导出模板失败:', error)
        return { success: false, error }
      }
    },

    // 加载生成的文档
    async loadGeneratedDocuments() {
      try {
        const result = await window.electronAPI.templates.getGeneratedDocs()
        if (result.success) {
          this.generatedDocuments = result.data
        }
        return result
      } catch (error) {
        console.error('加载生成文档失败:', error)
        return { success: false, error }
      }
    },

    // 删除生成的文档
    async deleteGeneratedDocument(id: number) {
      try {
        const result = await window.electronAPI.templates.deleteGeneratedDoc(id)
        if (result.success) {
          await this.loadGeneratedDocuments()
        }
        return result
      } catch (error) {
        console.error('删除生成文档失败:', error)
        return { success: false, error }
      }
    },

    // 设置选中的分类
    setSelectedCategory(category: string) {
      this.selectedCategory = category
    },

    // 设置搜索关键词
    setSearchKeyword(keyword: string) {
      this.searchKeyword = keyword
    },

    // 清空预览
    clearPreview() {
      this.previewContent = ''
      this.previewVariables = {}
    },

    // 解析模板变量
    parseTemplateVariables(content: string): string[] {
      const variableRegex = /\{\{\s*(\w+)\s*\}\}/g
      const variables = new Set<string>()
      let match
      
      while ((match = variableRegex.exec(content)) !== null) {
        variables.add(match[1])
      }
      
      return Array.from(variables)
    },

    // 替换模板变量
    replaceTemplateVariables(content: string, variables: Record<string, string>): string {
      let result = content
      
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g')
        result = result.replace(regex, value || '')
      })
      
      return result
    },

    // 验证模板变量
    validateTemplateVariables(templateId: number, variables: Record<string, string>) {
      const template = this.templates.find(t => t.id === templateId)
      if (!template) return { valid: false, errors: ['模板不存在'] }
      
      const requiredVariables = this.parseTemplateVariables(template.content)
      const errors: string[] = []
      
      requiredVariables.forEach(variable => {
        if (!variables[variable] || variables[variable].trim() === '') {
          errors.push(`缺少必需变量: ${variable}`)
        }
      })
      
      return { valid: errors.length === 0, errors }
    },

    // 获取模板详情
    getTemplateById(id: number) {
      return this.templates.find(template => template.id === id)
    },

    // 复制模板
    async duplicateTemplate(id: number) {
      const template = this.getTemplateById(id)
      if (!template) return { success: false, error: '模板不存在' }
      
      const newTemplate = {
        ...template,
        name: `${template.name} (副本)`,
        isSystem: false
      }
      delete newTemplate.id
      delete newTemplate.createdAt
      delete newTemplate.updatedAt
      
      return await this.createTemplate(newTemplate)
    }
  }
})