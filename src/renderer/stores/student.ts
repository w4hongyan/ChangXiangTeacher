import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Student, StudentListItem, StudentQueryParams, StudentFormData } from '../types/student'

export const useStudentStore = defineStore('student', () => {
  const students = ref<StudentListItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(20)

  // 获取学生列表
  async function fetchStudents(params?: StudentQueryParams) {
    loading.value = true
    error.value = null
    try {
      const query = {
        ...params,
        page: params?.page ?? currentPage.value,
        page_size: params?.page_size ?? pageSize.value
      }
      
      const result = await window.electronAPI.students.list(query)
      console.log('IPC result from main process:', result); // Log IPC result
      if (result.success) {
          const data = result.data || {}
          students.value = Array.isArray(data.items) ? data.items : []
          total.value = Number(data.total) || 0
          console.log('Student store updated - students.value:', students.value.length, 'items, total:', total.value); // Log store update
        } else {
          error.value = result.error
          students.value = []
          total.value = 0
          console.error('Student store update failed:', result.error); // Log store update failure
        }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取学生列表失败'
      console.error('Error fetching students in store:', error.value); // Log error in store
    } finally {
      loading.value = false
      console.log('Student store loading state set to false.'); // Log loading state
    }
  }

  // 创建学生
  async function createStudent(data: StudentFormData) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.students.create(data)
      if (result.success) {
        await fetchStudents()
        return { success: true, data: result.data }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建学生失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 更新学生
  async function updateStudent(id: number, data: Partial<StudentFormData>) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.students.update(id, data)
      if (result.success) {
        await fetchStudents()
        return { success: true, data: result.data }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新学生失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 删除学生
  async function deleteStudent(id: number) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.students.delete(id)
      if (result.success) {
        await fetchStudents()
        return { success: true }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除学生失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 批量删除学生
  async function batchDeleteStudents(ids: number[]) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.students.batchDelete(ids)
      if (result.success) {
        await fetchStudents()
        return { success: true, data: result.data }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '批量删除学生失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 获取学生详情
  async function getStudentById(id: number) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.students.getById(id)
      if (result.success) {
        return { success: true, data: result.data }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取学生详情失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 导入学生
  async function importStudents(buffer: ArrayBuffer) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.students.import(buffer)
      if (result.success) {
        await fetchStudents()
        return { success: true, data: result.data }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '导入学生失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 导出学生
  async function exportStudents(params?: StudentQueryParams) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.students.export(params)
      if (result.success) {
        return { success: true, data: result.data }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '导出学生失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 重置状态
  function resetState() {
    students.value = []
    error.value = null
    total.value = 0
    currentPage.value = 1
  }

  return {
    students: computed(() => students.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    total: computed(() => total.value),
    currentPage: computed(() => currentPage.value),
    pageSize: computed(() => pageSize.value),
    
    fetchStudents,
    createStudent,
    updateStudent,
    deleteStudent,
    batchDeleteStudents,
    getStudentById,
    importStudents,
    exportStudents,
    resetState
  }
})
