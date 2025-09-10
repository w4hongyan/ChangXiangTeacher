import { defineStore } from 'pinia'
import type { Schedule, ScheduleQueryParams, TimePeriod, WeekDay } from '../types/schedule'

export const useScheduleStore = defineStore('schedule', {
  state: () => ({
    schedules: [] as Schedule[],
    loading: false,
    currentWeek: 1,
    selectedClassId: 1,
    viewMode: 'week' as 'week' | 'day',
    timePeriods: [
      { id: 1, name: '第1节', startTime: '08:00', endTime: '08:45' },
      { id: 2, name: '第2节', startTime: '08:55', endTime: '09:40' },
      { id: 3, name: '第3节', startTime: '10:00', endTime: '10:45' },
      { id: 4, name: '第4节', startTime: '10:55', endTime: '11:40' },
      { id: 5, name: '第5节', startTime: '14:00', endTime: '14:45' },
      { id: 6, name: '第6节', startTime: '14:55', endTime: '15:40' },
      { id: 7, name: '第7节', startTime: '16:00', endTime: '16:45' },
      { id: 8, name: '第8节', startTime: '16:55', endTime: '17:40' }
    ] as TimePeriod[],
    weekDays: [
      { label: '周一', value: 1 },
      { label: '周二', value: 2 },
      { label: '周三', value: 3 },
      { label: '周四', value: 4 },
      { label: '周五', value: 5 }
    ] as WeekDay[]
  }),

  getters: {
    // 获取当前周的课程表
    currentWeekSchedules: (state) => {
      return state.schedules.filter(schedule => 
        schedule.classId === state.selectedClassId &&
        schedule.weeks?.includes(state.currentWeek)
      )
    },

    // 获取指定时间的课程
    getCourseByTime: (state) => {
      return (dayOfWeek: number, period: number) => {
        return state.schedules.find(schedule => 
          schedule.classId === state.selectedClassId &&
          schedule.dayOfWeek === dayOfWeek &&
          schedule.period === period &&
          schedule.weeks?.includes(state.currentWeek)
        )
      }
    },

    // 检查时间冲突
    hasTimeConflict: (state) => {
      return (dayOfWeek: number, period: number, excludeId?: number) => {
        return state.schedules.some(schedule => 
          schedule.id !== excludeId &&
          schedule.classId === state.selectedClassId &&
          schedule.dayOfWeek === dayOfWeek &&
          schedule.period === period &&
          schedule.weeks?.some(week => state.currentWeek === week)
        )
      }
    },

    // 获取教师课程统计
    teacherScheduleStats: (state) => {
      const stats = new Map<string, number>()
      state.schedules.forEach(schedule => {
        if (schedule.classId === state.selectedClassId) {
          const count = stats.get(schedule.teacher) || 0
          stats.set(schedule.teacher, count + schedule.weeks?.length || 0)
        }
      })
      return Array.from(stats.entries()).map(([teacher, count]) => ({ teacher, count }))
    }
  },

  actions: {
    // 加载课程表
    async loadSchedules(params?: ScheduleQueryParams) {
      this.loading = true
      try {
        const result = await window.electron.ipcRenderer.invoke('schedules:getAll', params)
        if (result.success) {
          this.schedules = result.data
        }
        return result
      } catch (error) {
        console.error('加载课程表失败:', error)
        return { success: false, error }
      } finally {
        this.loading = false
      }
    },

    // 创建课程
    async createSchedule(schedule: Omit<Schedule, 'id'>) {
      try {
        const result = await window.electron.ipcRenderer.invoke('schedules:create', schedule)
        if (result.success) {
          await this.loadSchedules({ classId: this.selectedClassId })
        }
        return result
      } catch (error) {
        console.error('创建课程失败:', error)
        return { success: false, error }
      }
    },

    // 更新课程
    async updateSchedule(id: number, schedule: Partial<Schedule>) {
      try {
        const result = await window.electron.ipcRenderer.invoke('schedules:update', id, schedule)
        if (result.success) {
          await this.loadSchedules({ classId: this.selectedClassId })
        }
        return result
      } catch (error) {
        console.error('更新课程失败:', error)
        return { success: false, error }
      }
    },

    // 删除课程
    async deleteSchedule(id: number) {
      try {
        const result = await window.electron.ipcRenderer.invoke('schedules:delete', id)
        if (result.success) {
          await this.loadSchedules({ classId: this.selectedClassId })
        }
        return result
      } catch (error) {
        console.error('删除课程失败:', error)
        return { success: false, error }
      }
    },

    // 交换课程
    async swapSchedules(schedule1Id: number, schedule2Id: number) {
      try {
        const result = await window.electron.ipcRenderer.invoke('schedules:swap', schedule1Id, schedule2Id)
        if (result.success) {
          await this.loadSchedules({ classId: this.selectedClassId })
        }
        return result
      } catch (error) {
        console.error('交换课程失败:', error)
        return { success: false, error }
      }
    },

    // 导入课程表
    async importSchedules(data: any) {
      try {
        const result = await window.electron.ipcRenderer.invoke('schedules:import', data)
        if (result.success) {
          await this.loadSchedules({ classId: this.selectedClassId })
        }
        return result
      } catch (error) {
        console.error('导入课程表失败:', error)
        return { success: false, error }
      }
    },

    // 导出课程表
    async exportSchedules(options: any) {
      try {
        const result = await window.electron.ipcRenderer.invoke('schedules:export', options)
        return result
      } catch (error) {
        console.error('导出课程表失败:', error)
        return { success: false, error }
      }
    },

    // 设置当前周次
    setCurrentWeek(week: number) {
      this.currentWeek = week
    },

    // 设置选中的班级
    setSelectedClass(classId: number) {
      this.selectedClassId = classId
      this.loadSchedules({ classId })
    },

    // 设置视图模式
    setViewMode(mode: 'week' | 'day') {
      this.viewMode = mode
    },

    // 获取下一个空闲时间段
    getNextAvailableSlot(dayOfWeek: number) {
      for (const period of this.timePeriods) {
        if (!this.getCourseByTime(dayOfWeek, period.id)) {
          return { dayOfWeek, period: period.id }
        }
      }
      return null
    },

    // 检查课程冲突
    checkScheduleConflicts(schedule: Omit<Schedule, 'id'>) {
      const conflicts = []
      
      // 检查时间冲突
      const timeConflict = this.schedules.find(s => 
        s.classId === schedule.classId &&
        s.dayOfWeek === schedule.dayOfWeek &&
        s.period === schedule.period &&
        s.weeks?.some(week => schedule.weeks?.includes(week))
      )
      
      if (timeConflict) {
        conflicts.push({
          type: 'time',
          message: `时间冲突：${timeConflict.subject}`,
          conflictSchedule: timeConflict
        })
      }
      
      return conflicts
    }
  }
})