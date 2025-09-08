import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { 
  Grade, 
  GradeFormData, 
  GradeQueryParams, 
  GradeListItem, 
  GradeStats 
} from '../types/grade'

export const useGradeStore = defineStore('grade', () => {
  // 状态
  const grades = ref<GradeListItem[]>([])
  const gradeStats = ref<GradeStats[]>([])
  const subjects = ref<string[]>([])
  const examTypes = ref<string[]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const hasGrades = computed(() => grades.value.length > 0)

  // 重置错误状态
  const clearError = () => {
    error.value = null
  }

  // 获取成绩列表
  const fetchGrades = async (params?: GradeQueryParams) => {
    loading.value = true
    error.value = null
    
    try {
      const result = await window.electronAPI.grades.list(params)
      
      if (result.success) {
        grades.value = result.data.items || []
        total.value = result.data.total || 0
      } else {
        error.value = result.error || '获取成绩列表失败'
        grades.value = []
        total.value = 0
      }
      
      return result
    } catch (err) {
      console.error('获取成绩列表失败:', err)
      error.value = err instanceof Error ? err.message : '获取成绩列表失败'
      grades.value = []
      total.value = 0
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 获取单个成绩详情
  const getGradeById = async (id: number) => {
    loading.value = true
    error.value = null
    
    try {
      const result = await window.electronAPI.grades.getById(id)
      
      if (!result.success) {
        error.value = result.error || '获取成绩详情失败'
      }
      
      return result
    } catch (err) {
      console.error('getGradeById error:', err)
      error.value = err instanceof Error ? err.message : '获取成绩详情失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 创建成绩
  const createGrade = async (gradeData: GradeFormData) => {
    loading.value = true
    error.value = null
    
    try {
      const result = await window.electronAPI.grades.create(gradeData)
      
      if (!result.success) {
        error.value = result.error || '创建成绩失败'
      }
      
      return result
    } catch (err) {
      console.error('创建成绩失败:', err)
      error.value = err instanceof Error ? err.message : '创建成绩失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 更新成绩
  const updateGrade = async (id: number, gradeData: Partial<GradeFormData>) => {
    loading.value = true
    error.value = null
    
    try {
      const result = await window.electronAPI.grades.update(id, gradeData)
      
      if (!result.success) {
        error.value = result.error || '更新成绩失败'
      }
      
      return result
    } catch (err) {
      console.error('更新成绩失败:', err)
      error.value = err instanceof Error ? err.message : '更新成绩失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 删除成绩
  const deleteGrade = async (id: number) => {
    loading.value = true
    error.value = null
    
    try {
      console.log('deleteGrade id:', id)
      const result = await window.electronAPI.grades.delete(id)
      console.log('deleteGrade result:', result)
      
      if (!result.success) {
        error.value = result.error || '删除成绩失败'
      }
      
      return result
    } catch (err) {
      console.error('deleteGrade error:', err)
      error.value = err instanceof Error ? err.message : '删除成绩失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 批量删除成绩
  const batchDeleteGrades = async (ids: number[]) => {
    loading.value = true
    error.value = null
    
    try {
      console.log('batchDeleteGrades ids:', ids)
      const result = await window.electronAPI.grades.batchDelete(ids)
      console.log('batchDeleteGrades result:', result)
      
      if (!result.success) {
        error.value = result.error || '批量删除成绩失败'
      }
      
      return result
    } catch (err) {
      console.error('batchDeleteGrades error:', err)
      error.value = err instanceof Error ? err.message : '批量删除成绩失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 获取成绩统计
  const fetchGradeStats = async (params?: {
    class_id?: number
    subject?: string
    exam_type?: string
    semester?: string
    year?: number
  }) => {
    loading.value = true
    error.value = null
    
    try {
      console.log('fetchGradeStats params:', params)
      const result = await window.electronAPI.grades.getStats(params)
      console.log('fetchGradeStats result:', result)
      
      if (result.success) {
        gradeStats.value = result.data || []
        console.log('fetchGradeStats success - stats count:', gradeStats.value.length)
      } else {
        error.value = result.error || '获取成绩统计失败'
        gradeStats.value = []
      }
      
      return result
    } catch (err) {
      console.error('fetchGradeStats error:', err)
      error.value = err instanceof Error ? err.message : '获取成绩统计失败'
      gradeStats.value = []
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 获取学科列表
  const fetchSubjects = async () => {
    try {
      console.log('fetchSubjects')
      const result = await window.electronAPI.grades.getSubjects()
      console.log('fetchSubjects result:', result)
      
      if (result.success) {
        subjects.value = result.data || []
        console.log('fetchSubjects success - subjects count:', subjects.value.length)
      } else {
        console.error('fetchSubjects failed:', result.error)
        subjects.value = []
      }
      
      return result
    } catch (err) {
      console.error('fetchSubjects error:', err)
      subjects.value = []
      return { success: false, error: err instanceof Error ? err.message : '获取学科列表失败' }
    }
  }

  // 获取考试类型列表
  const fetchExamTypes = async () => {
    try {
      console.log('fetchExamTypes')
      const result = await window.electronAPI.grades.getExamTypes()
      console.log('fetchExamTypes result:', result)
      
      if (result.success) {
        examTypes.value = result.data || []
        console.log('fetchExamTypes success - examTypes count:', examTypes.value.length)
      } else {
        console.error('fetchExamTypes failed:', result.error)
        examTypes.value = []
      }
      
      return result
    } catch (err) {
      console.error('fetchExamTypes error:', err)
      examTypes.value = []
      return { success: false, error: err instanceof Error ? err.message : '获取考试类型列表失败' }
    }
  }

  // 重置状态
  const resetState = () => {
    grades.value = []
    gradeStats.value = []
    subjects.value = []
    examTypes.value = []
    total.value = 0
    loading.value = false
    error.value = null
  }

  // 导入成绩
  const importGrades = async (gradesData: any[]) => {
    loading.value = true
    error.value = null
    
    try {
      console.log('importGrades data:', gradesData)
      const result = await window.electronAPI.grades.import(gradesData)
      console.log('importGrades result:', result)
      
      if (!result.success) {
        error.value = result.error || '导入成绩失败'
      }
      
      return result
    } catch (err) {
      console.error('importGrades error:', err)
      error.value = err instanceof Error ? err.message : '导入成绩失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 导出成绩
  const exportGrades = async (params?: GradeQueryParams) => {
    loading.value = true
    error.value = null
    
    try {
      console.log('exportGrades params:', params)
      const result = await window.electronAPI.grades.export(params)
      console.log('exportGrades result:', result)
      
      if (!result.success) {
        error.value = result.error || '导出成绩失败'
      }
      
      return result
    } catch (err) {
      console.error('exportGrades error:', err)
      error.value = err instanceof Error ? err.message : '导出成绩失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  return {
    // 状态
    grades,
    gradeStats,
    subjects,
    examTypes,
    total,
    loading,
    error,
    
    // 计算属性
    hasGrades,
    
    // 方法
    clearError,
    fetchGrades,
    getGradeById,
    createGrade,
    updateGrade,
    deleteGrade,
    batchDeleteGrades,
    fetchGradeStats,
    fetchSubjects,
    fetchExamTypes,
    importGrades,
    exportGrades,
    resetState
  }
})