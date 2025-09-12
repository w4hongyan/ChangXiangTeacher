import { defineStore } from 'pinia'
import type { DocumentTemplate, TemplateVariable, TemplateSettings, GenerateDocumentParams } from '../types/templateEnhanced'

export interface TemplateState {
  templates: DocumentTemplate[]
  currentTemplate: DocumentTemplate | null
  generationHistory: any[]
  loading: boolean
  searchKeyword: string
  selectedCategory: string
  selectedTags: string[]
  sortBy: 'created_at' | 'name' | 'download_count' | 'rating'
  sortOrder: 'ASC' | 'DESC'
  viewMode: 'grid' | 'list'
  categories: Array<{
    label: string
    value: string
    icon: string
    description: string
  }>
}

export const useTemplateEnhancedStore = defineStore('templateEnhanced', {
  state: (): TemplateState => ({
    templates: [],
    currentTemplate: null,
    generationHistory: [],
    loading: false,
    searchKeyword: '',
    selectedCategory: 'all',
    selectedTags: [],
    sortBy: 'created_at',
    sortOrder: 'DESC',
    viewMode: 'grid',
    categories: [
      { label: '全部', value: 'all', icon: 'Grid', description: '所有模板' },
      { label: '通知公告', value: 'notice', icon: 'Megaphone', description: '各类通知和公告模板' },
      { label: '成绩单据', value: 'grade', icon: 'Trophy', description: '成绩单、评价表等' },
      { label: '课程安排', value: 'schedule', icon: 'Calendar', description: '课程表、教学计划等' },
      { label: '评语评价', value: 'comment', icon: 'MessageSquare', description: '学生评语、评价模板' },
      { label: '班级管理', value: 'class', icon: 'Users', description: '班级相关文档模板' },
      { label: '家校沟通', value: 'communication', icon: 'Phone', description: '家长会、通知等模板' },
      { label: '其他', value: 'other', icon: 'FileText', description: '其他类型模板' }
    ]
  }),

  getters: {
    // 过滤后的模板列表
    filteredTemplates: (state) => {
      let filtered = [...state.templates]
      
      // 按分类过滤
      if (state.selectedCategory !== 'all') {
        filtered = filtered.filter(template => template.category === state.selectedCategory)
      }
      
      // 按关键词搜索
      if (state.searchKeyword.trim()) {
        const keyword = state.searchKeyword.toLowerCase()
        filtered = filtered.filter(template => 
          template.name.toLowerCase().includes(keyword) ||
          (template.description && template.description.toLowerCase().includes(keyword)) ||
          (template.tags && template.tags.some(tag => tag.toLowerCase().includes(keyword)))
        )
      }
      
      // 按标签过滤
      if (state.selectedTags.length > 0) {
        filtered = filtered.filter(template => 
          template.tags && state.selectedTags.some(tag => template.tags!.includes(tag))
        )
      }
      
      // 排序
      filtered.sort((a, b) => {
        const aValue = a[state.sortBy] || 0
        const bValue = b[state.sortBy] || 0
        
        if (state.sortOrder === 'ASC') {
          return aValue > bValue ? 1 : -1
        } else {
          return aValue < bValue ? 1 : -1
        }
      })
      
      return filtered
    },

    // 系统模板
    systemTemplates: (state) => {
      return state.templates.filter(template => template.is_system)
    },

    // 用户模板
    userTemplates: (state) => {
      return state.templates.filter(template => !template.is_system)
    },

    // 公共模板
    publicTemplates: (state) => {
      return state.templates.filter(template => template.is_public)
    },

    // 所有标签
    allTags: (state) => {
      const tags = new Set<string>()
      state.templates.forEach(template => {
        if (template.tags) {
          template.tags.forEach(tag => tags.add(tag))
        }
      })
      return Array.from(tags).sort()
    },

    // 模板统计
    templateStats: (state) => {
      const stats = {
        total: state.templates.length,
        system: state.templates.filter(t => t.is_system).length,
        user: state.templates.filter(t => !t.is_system).length,
        public: state.templates.filter(t => t.is_public).length,
        byCategory: {} as Record<string, number>
      }
      
      state.templates.forEach(template => {
        stats.byCategory[template.category] = (stats.byCategory[template.category] || 0) + 1
      })
      
      return stats
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
    async loadTemplates(params: any = {}) {
      this.loading = true
      try {
        const queryParams = {
          category: this.selectedCategory !== 'all' ? this.selectedCategory : undefined,
          keyword: this.searchKeyword || undefined,
          tags: this.selectedTags.length > 0 ? this.selectedTags : undefined,
          sort_by: this.sortBy,
          sort_order: this.sortOrder,
          ...params
        }
        
        const result = await window.electronAPI.invoke('template:getTemplatesEnhanced', queryParams)
        
        if (result.success) {
          this.templates = result.data
        } else {
          console.error('加载模板失败:', result.error)
          throw new Error(result.error)
        }
      } catch (error) {
        console.error('加载模板失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 保存模板（创建或更新）
    async saveTemplate(templateData: DocumentTemplate) {
      this.loading = true
      try {
        const result = await window.electronAPI.invoke('template:saveTemplateEnhanced', templateData)
        
        if (result.success) {
          await this.loadTemplates() // 重新加载列表
          return result.data
        } else {
          throw new Error(result.error)
        }
      } catch (error) {
        console.error('保存模板失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 删除模板
    async deleteTemplate(id: number) {
      try {
        const result = await window.electronAPI.invoke('template:deleteTemplate', id)
        
        if (result.success) {
          await this.loadTemplates() // 重新加载列表
        } else {
          throw new Error(result.error)
        }
      } catch (error) {
        console.error('删除模板失败:', error)
        throw error
      }
    },

    // 解析模板变量
    async parseTemplateVariables(content: string): Promise<TemplateVariable[]> {
      try {
        const result = await window.electronAPI.invoke('template:parseVariables', content)
        
        if (result.success) {
          return result.data
        } else {
          throw new Error(result.error)
        }
      } catch (error) {
        console.error('解析模板变量失败:', error)
        return []
      }
    },

    // 生成文档
    async generateDocument(params: GenerateDocumentParams) {
      this.loading = true
      try {
        const result = await window.electronAPI.invoke('template:generateDocumentEnhanced', params)
        
        if (result.success) {
          await this.loadGenerationHistory() // 刷新生成历史
          return result
        } else {
          throw new Error(result.error)
        }
      } catch (error) {
        console.error('生成文档失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 加载生成历史
    async loadGenerationHistory(limit = 20) {
      try {
        const result = await window.electronAPI.invoke('template:getGenerationHistory', limit)
        
        if (result.success) {
          this.generationHistory = result.data
        } else {
          console.error('加载生成历史失败:', result.error)
        }
      } catch (error) {
        console.error('加载生成历史失败:', error)
      }
    },

    // 预览模板
    async previewTemplate(templateId: number, variables: Record<string, any>) {
      try {
        const template = this.templates.find(t => t.id === templateId)
        if (!template) {
          throw new Error('模板不存在')
        }
        
        let content = template.content
        
        // 替换变量
        for (const [key, value] of Object.entries(variables)) {
          const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g')
          content = content.replace(regex, String(value))
        }
        
        return content
      } catch (error) {
        console.error('预览模板失败:', error)
        throw error
      }
    },

    // 复制模板
    async duplicateTemplate(id: number) {
      try {
        const template = this.templates.find(t => t.id === id)
        if (!template) {
          throw new Error('模板不存在')
        }
        
        const duplicatedTemplate: DocumentTemplate = {
          ...template,
          id: undefined,
          name: `${template.name} (副本)`,
          is_system: false,
          is_public: false,
          created_at: undefined,
          updated_at: undefined
        }
        
        return await this.saveTemplate(duplicatedTemplate)
      } catch (error) {
        console.error('复制模板失败:', error)
        throw error
      }
    },

    // 设置搜索关键词
    setSearchKeyword(keyword: string) {
      this.searchKeyword = keyword
    },

    // 设置选中分类
    setSelectedCategory(category: string) {
      this.selectedCategory = category
    },

    // 设置选中标签
    setSelectedTags(tags: string[]) {
      this.selectedTags = tags
    },

    // 设置排序方式
    setSortBy(sortBy: TemplateState['sortBy']) {
      this.sortBy = sortBy
    },

    // 设置排序顺序
    setSortOrder(order: 'ASC' | 'DESC') {
      this.sortOrder = order
    },

    // 设置视图模式
    setViewMode(mode: 'grid' | 'list') {
      this.viewMode = mode
    },

    // 设置当前模板
    setCurrentTemplate(template: DocumentTemplate | null) {
      this.currentTemplate = template
    },

    // 获取模板详情
    getTemplateById(id: number) {
      return this.templates.find(template => template.id === id)
    },

    // 清空搜索和筛选
    clearFilters() {
      this.searchKeyword = ''
      this.selectedCategory = 'all'
      this.selectedTags = []
    }
  }
})