import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Schedule, ScheduleFormData, ClassSchedule, TeacherSchedule } from '../types/schedule'

export const useScheduleStore = defineStore('schedule', () => {
  const schedules = ref<Schedule[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 获取所有课程表
  async function fetchSchedules() {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.schedules.list()
      if (result.success) {
        schedules.value = result.data
      } else {
        error.value = result.error
        schedules.value = []
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取课程表失败'
      schedules.value = []
    } finally {
      loading.value = false
    }
  }

  // 根据班级ID获取课程表
  async function fetchSchedulesByClassId(class_id: number) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.schedules.listByClassId(class_id)
      if (result.success) {
        return { success: true, data: result.data }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取班级课程表失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 根据教师ID获取课程表
  async function fetchSchedulesByTeacherId(teacher_id: number) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.schedules.listByTeacherId(teacher_id)
      if (result.success) {
        return { success: true, data: result.data }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取教师课程表失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 创建课程表
  async function createSchedule(data: ScheduleFormData) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.schedules.create(data)
      if (result.success) {
        await fetchSchedules()
        return { success: true, data: result.data }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建课程表失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 更新课程表
  async function updateSchedule(id: number, data: ScheduleFormData) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.schedules.update(id, data)
      if (result.success) {
        await fetchSchedules()
        return { success: true, data: result.data }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新课程表失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 删除课程表
  async function deleteSchedule(id: number) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.schedules.delete(id)
      if (result.success) {
        await fetchSchedules()
        return { success: true }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除课程表失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 获取班级课表（包含班级信息）
  async function fetchClassSchedules(class_id: number) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.schedules.listClassSchedules(class_id)
      if (result.success) {
        return { success: true, data: result.data }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取班级课表失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 获取教师课表（包含班级信息）
  async function fetchTeacherSchedules(teacher_id: number) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.schedules.listTeacherSchedules(teacher_id)
      if (result.success) {
        return { success: true, data: result.data }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取教师课表失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 重置状态
  function resetState() {
    schedules.value = []
    error.value = null
  }

  return {
    schedules: computed(() => schedules.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    
    fetchSchedules,
    fetchSchedulesByClassId,
    fetchSchedulesByTeacherId,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    fetchClassSchedules,
    fetchTeacherSchedules,
    resetState
  }
})