import { defineStore } from 'pinia'
import type { CalendarEvent, CalendarQueryParams, CalendarDay, CalendarMonth, CountdownEvent, CalendarSettings } from '../types/calendar'

export const useCalendarStore = defineStore('calendar', {
  state: () => ({
    events: [] as CalendarEvent[],
    loading: false,
    currentDate: new Date(),
    selectedDate: new Date(),
    viewMode: 'month' as 'month' | 'week' | 'day',
    settings: {
      defaultReminderMinutes: 15,
      weekStartsOn: 1,
      showWeekNumbers: false,
      eventColors: {
        exam: '#f56565',
        homework: '#ed8936',
        activity: '#38b2ac',
        meeting: '#805ad5',
        holiday: '#48bb78',
        other: '#718096'
      }
    } as CalendarSettings,
    countdownEvents: [] as CountdownEvent[]
  }),

  getters: {
    // 获取当前月份的日历数据
    currentMonth: (state): CalendarMonth => {
      const year = state.currentDate.getFullYear()
      const month = state.currentDate.getMonth()
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      const startDate = new Date(firstDay)
      const endDate = new Date(lastDay)
      
      // 调整到周的开始和结束
      const startWeekDay = state.settings.weekStartsOn
      const firstDayWeek = firstDay.getDay()
      const daysToSubtract = (firstDayWeek - startWeekDay + 7) % 7
      startDate.setDate(startDate.getDate() - daysToSubtract)
      
      const lastDayWeek = lastDay.getDay()
      const daysToAdd = (6 - lastDayWeek + startWeekDay) % 7
      endDate.setDate(endDate.getDate() + daysToAdd)
      
      const days: CalendarDay[] = []
      const current = new Date(startDate)
      const today = new Date()
      
      while (current <= endDate) {
        const dateStr = current.toISOString().split('T')[0]
        const dayEvents = state.events.filter(event => event.date === dateStr)
        
        days.push({
          date: dateStr,
          day: current.getDate(),
          isCurrentMonth: current.getMonth() === month,
          isToday: current.toDateString() === today.toDateString(),
          events: dayEvents
        })
        
        current.setDate(current.getDate() + 1)
      }
      
      return { year, month, days }
    },

    // 获取今日事件
    todayEvents: (state) => {
      const today = new Date().toISOString().split('T')[0]
      return state.events.filter(event => event.date === today)
    },

    // 获取即将到来的事件
    upcomingEvents: (state) => {
      const today = new Date()
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
      const todayStr = today.toISOString().split('T')[0]
      const nextWeekStr = nextWeek.toISOString().split('T')[0]
      
      return state.events
        .filter(event => event.date >= todayStr && event.date <= nextWeekStr)
        .sort((a, b) => a.date.localeCompare(b.date))
    },

    // 获取需要提醒的事件
    reminderEvents: (state) => {
      const now = new Date()
      return state.events.filter(event => {
        if (!event.reminder || !event.reminderMinutes) return false
        
        const eventDateTime = new Date(`${event.date}T${event.time || '00:00'}`)
        const reminderTime = new Date(eventDateTime.getTime() - event.reminderMinutes * 60 * 1000)
        
        return now >= reminderTime && now <= eventDateTime
      })
    },

    // 获取倒计时事件
    activeCountdowns: (state) => {
      const today = new Date().toISOString().split('T')[0]
      return state.events
        .filter(event => event.isCountdown && event.date >= today)
        .map(event => {
          const eventDate = new Date(event.date)
          const todayDate = new Date(today)
          const daysRemaining = Math.ceil((eventDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24))
          
          return {
            id: event.id!,
            title: event.title,
            date: event.date,
            type: event.type,
            daysRemaining
          } as CountdownEvent
        })
        .sort((a, b) => a.daysRemaining - b.daysRemaining)
    },

    // 按类型分组的事件
    eventsByType: (state) => {
      const grouped = new Map<string, CalendarEvent[]>()
      state.events.forEach(event => {
        const type = event.type
        if (!grouped.has(type)) {
          grouped.set(type, [])
        }
        grouped.get(type)!.push(event)
      })
      return grouped
    },

    // 获取事件统计
    eventStats: (state) => {
      const stats = {
        total: state.events.length,
        byType: {} as Record<string, number>,
        withReminder: state.events.filter(e => e.reminder).length,
        countdown: state.events.filter(e => e.isCountdown).length
      }
      
      state.events.forEach(event => {
        stats.byType[event.type] = (stats.byType[event.type] || 0) + 1
      })
      
      return stats
    }
  },

  actions: {
    // 加载事件
    async loadEvents(params?: CalendarQueryParams) {
      this.loading = true
      try {
        const result = await window.electron.ipcRenderer.invoke('calendar:getEvents', params)
        if (result.success) {
          this.events = result.data
        }
        return result
      } catch (error) {
        console.error('加载日历事件失败:', error)
        return { success: false, error }
      } finally {
        this.loading = false
      }
    },

    // 创建事件
    async createEvent(event: Omit<CalendarEvent, 'id'>) {
      try {
        const result = await window.electron.ipcRenderer.invoke('calendar:createEvent', event)
        if (result.success) {
          await this.loadEvents()
        }
        return result
      } catch (error) {
        console.error('创建事件失败:', error)
        return { success: false, error }
      }
    },

    // 更新事件
    async updateEvent(id: number, event: Partial<CalendarEvent>) {
      try {
        const result = await window.electron.ipcRenderer.invoke('calendar:updateEvent', id, event)
        if (result.success) {
          await this.loadEvents()
        }
        return result
      } catch (error) {
        console.error('更新事件失败:', error)
        return { success: false, error }
      }
    },

    // 删除事件
    async deleteEvent(id: number) {
      try {
        const result = await window.electron.ipcRenderer.invoke('calendar:deleteEvent', id)
        if (result.success) {
          await this.loadEvents()
        }
        return result
      } catch (error) {
        console.error('删除事件失败:', error)
        return { success: false, error }
      }
    },

    // 批量创建事件
    async batchCreateEvents(events: Omit<CalendarEvent, 'id'>[]) {
      try {
        const result = await window.electron.ipcRenderer.invoke('calendar:batchCreate', events)
        if (result.success) {
          await this.loadEvents()
        }
        return result
      } catch (error) {
        console.error('批量创建事件失败:', error)
        return { success: false, error }
      }
    },

    // 导出日历
    async exportCalendar(options: any) {
      try {
        const result = await window.electron.ipcRenderer.invoke('calendar:export', options)
        return result
      } catch (error) {
        console.error('导出日历失败:', error)
        return { success: false, error }
      }
    },

    // 设置当前日期
    setCurrentDate(date: Date) {
      this.currentDate = new Date(date)
    },

    // 设置选中日期
    setSelectedDate(date: Date) {
      this.selectedDate = new Date(date)
    },

    // 设置视图模式
    setViewMode(mode: 'month' | 'week' | 'day') {
      this.viewMode = mode
    },

    // 导航到上一个月
    previousMonth() {
      const newDate = new Date(this.currentDate)
      newDate.setMonth(newDate.getMonth() - 1)
      this.setCurrentDate(newDate)
    },

    // 导航到下一个月
    nextMonth() {
      const newDate = new Date(this.currentDate)
      newDate.setMonth(newDate.getMonth() + 1)
      this.setCurrentDate(newDate)
    },

    // 导航到今天
    goToToday() {
      this.setCurrentDate(new Date())
      this.setSelectedDate(new Date())
    },

    // 更新设置
    updateSettings(settings: Partial<CalendarSettings>) {
      this.settings = { ...this.settings, ...settings }
    },

    // 获取指定日期的事件
    getEventsByDate(date: string) {
      return this.events.filter(event => event.date === date)
    },

    // 检查日期是否有事件
    hasEventsOnDate(date: string) {
      return this.events.some(event => event.date === date)
    },

    // 获取事件颜色
    getEventColor(type: string) {
      return this.settings.eventColors[type] || this.settings.eventColors.other
    },

    // 触发事件提醒
    async triggerReminders() {
      const reminders = this.reminderEvents
      if (reminders.length > 0) {
        try {
          await window.electron.ipcRenderer.invoke('calendar:triggerReminders', reminders)
        } catch (error) {
          console.error('触发提醒失败:', error)
        }
      }
    }
  }
})