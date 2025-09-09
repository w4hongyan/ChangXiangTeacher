import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Semester, CalendarEvent, SemesterFormData, CalendarEventFormData } from '../types/calendar'

export const useCalendarStore = defineStore('calendar', () => {
  const semesters = ref<Semester[]>([])
  const events = ref<CalendarEvent[]>([])
  const currentSemester = ref<Semester | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 获取所有学期
  async function fetchSemesters() {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.calendar.listSemesters()
      if (result.success) {
        semesters.value = result.data || []
        // 设置当前学期
        currentSemester.value = semesters.value.find(s => s.is_current) || null
      } else {
        error.value = result.error
        semesters.value = []
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取学期列表失败'
      semesters.value = []
    } finally {
      loading.value = false
    }
  }

  // 获取当前学期
  async function fetchCurrentSemester() {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.calendar.getCurrentSemester()
      if (result.success) {
        currentSemester.value = result.data || null
      } else {
        error.value = result.error
        currentSemester.value = null
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取当前学期失败'
      currentSemester.value = null
    } finally {
      loading.value = false
    }
  }

  // 创建学期
  async function createSemester(data: SemesterFormData) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.calendar.createSemester(data)
      if (result.success) {
        await fetchSemesters()
        return { success: true, data: result.data }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建学期失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 更新学期
  async function updateSemester(id: number, data: SemesterFormData) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.calendar.updateSemester(id, data)
      if (result.success) {
        await fetchSemesters()
        return { success: true, data: result.data }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新学期失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 删除学期
  async function deleteSemester(id: number) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.calendar.deleteSemester(id)
      if (result.success) {
        await fetchSemesters()
        return { success: true }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除学期失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 设置当前学期
  async function setCurrentSemester(id: number) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.calendar.setCurrentSemester(id)
      if (result.success) {
        await fetchSemesters()
        return { success: true }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '设置当前学期失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 获取指定日期范围的事件
  async function fetchEventsByDateRange(startDate: string, endDate: string) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.calendar.listEventsByDateRange(startDate, endDate)
      if (result.success) {
        events.value = result.data || []
      } else {
        error.value = result.error
        events.value = []
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取日历事件失败'
      events.value = []
    } finally {
      loading.value = false
    }
  }

  // 获取指定日期的事件
  async function fetchEventsByDate(date: string) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.calendar.listEventsByDate(date)
      if (result.success) {
        return { success: true, data: result.data }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取日历事件失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 创建事件
  async function createEvent(data: CalendarEventFormData) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.calendar.createEvent(data)
      if (result.success) {
        // 重新获取当前月的事件
        const today = new Date()
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        await fetchEventsByDateRange(
          startOfMonth.toISOString().split('T')[0],
          endOfMonth.toISOString().split('T')[0]
        )
        return { success: true, data: result.data }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建事件失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 更新事件
  async function updateEvent(id: number, data: CalendarEventFormData) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.calendar.updateEvent(id, data)
      if (result.success) {
        // 重新获取当前月的事件
        const today = new Date()
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        await fetchEventsByDateRange(
          startOfMonth.toISOString().split('T')[0],
          endOfMonth.toISOString().split('T')[0]
        )
        return { success: true, data: result.data }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新事件失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 删除事件
  async function deleteEvent(id: number) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.calendar.deleteEvent(id)
      if (result.success) {
        // 重新获取当前月的事件
        const today = new Date()
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        await fetchEventsByDateRange(
          startOfMonth.toISOString().split('T')[0],
          endOfMonth.toISOString().split('T')[0]
        )
        return { success: true }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除事件失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 重置状态
  function resetState() {
    semesters.value = []
    events.value = []
    currentSemester.value = null
    error.value = null
  }

  return {
    semesters: computed(() => semesters.value),
    events: computed(() => events.value),
    currentSemester: computed(() => currentSemester.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    
    fetchSemesters,
    fetchCurrentSemester,
    createSemester,
    updateSemester,
    deleteSemester,
    setCurrentSemester,
    fetchEventsByDateRange,
    fetchEventsByDate,
    createEvent,
    updateEvent,
    deleteEvent,
    resetState
  }
})