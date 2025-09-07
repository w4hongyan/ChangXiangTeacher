import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { 
  SeatingArrangement, 
  ClassConfig, 
  SeatingFormData,
  SeatPosition 
} from '../types/seating'

export const useSeatingStore = defineStore('seating', () => {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const currentArrangement = ref<SeatingArrangement | null>(null)
  const currentConfig = ref<ClassConfig | null>(null)

  // 获取班级座位配置
  async function getClassConfig(classId: number) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.seating.getClassConfig(classId)
      if (result.success) {
        currentConfig.value = result.data
        return { success: true, data: result.data }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取班级配置失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 保存班级座位配置
  async function saveClassConfig(data: SeatingFormData) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.seating.saveClassConfig(data)
      if (result.success) {
        return { success: true }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '保存配置失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 获取座位安排
  async function getSeatingArrangement(classId: number) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.seating.getArrangement(classId)
      
      if (result.success) {
        currentArrangement.value = result.data
        return { success: true, data: result.data }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取座位安排失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 分配学生到座位
  async function assignStudentToSeat(data: {
    class_id: number
    student_id: number
    row: number
    column: number
  }) {
    error.value = null
    try {
      const result = await window.electronAPI.seating.assignStudent(data)
      
      if (result.success) {
        // 重新获取座位安排
        await getSeatingArrangement(data.class_id)
        return { success: true }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '分配座位失败'
      return { success: false, error: error.value }
    }
  }

  // 移除学生座位
  async function removeStudentFromSeat(data: {
    class_id: number
    row: number
    column: number
  }) {
    error.value = null
    try {
      const result = await window.electronAPI.seating.removeStudent(data)
      if (result.success) {
        // 重新获取座位安排
        await getSeatingArrangement(data.class_id)
        return { success: true }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '移除座位失败'
      return { success: false, error: error.value }
    }
  }

  // 交换学生座位
  async function swapStudents(data: {
    class_id: number
    seat1: { row: number; column: number }
    seat2: { row: number; column: number }
  }) {
    error.value = null
    try {
      const result = await window.electronAPI.seating.swapStudents(data)
      if (result.success) {
        // 重新获取座位安排
        await getSeatingArrangement(data.class_id)
        return { success: true }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '交换座位失败'
      return { success: false, error: error.value }
    }
  }

  // 自动分配座位
  async function autoAssignSeats(classId: number, options?: { 
    numberingMode: string; 
    numberingDirection: string;
    strategy?: string;
  }) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.seating.autoAssign(classId, options)
      if (result.success) {
        // 重新获取座位安排
        await getSeatingArrangement(classId)
        return { success: true, data: result.data }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '自动分配失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 重置状态
  function resetState() {
    currentArrangement.value = null
    currentConfig.value = null
    error.value = null
  }

  // 保存排位安排
  async function saveSeatingArrangement(classId: number) {
    error.value = null
    try {
      const result = await window.electronAPI.seating.saveArrangement(classId)
      if (result.success) {
        return { success: true }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '保存排位安排失败'
      return { success: false, error: error.value }
    }
  }

  return {
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    currentArrangement: computed(() => currentArrangement.value),
    currentConfig: computed(() => currentConfig.value),
    
    getClassConfig,
    saveClassConfig,
    getSeatingArrangement,
    assignStudentToSeat,
    removeStudentFromSeat,
    swapStudents,
    autoAssignSeats,
    resetState,
    saveSeatingArrangement
  }
})