import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface TimePeriod {
  startTime: string
  endTime: string
}

export interface ScheduleSettings {
  weekDays: number
  periodsPerDay: number
  timePeriods: TimePeriod[]
}

export const useSettingsStore = defineStore('settings', () => {
  const isDarkMode = ref(false)
  const themeColor = ref('#667eea')
  const sidebarCollapsed = ref(false)
  
  // 课程表设置
  const scheduleSettings = ref<ScheduleSettings>({
    weekDays: 5,
    periodsPerDay: 8,
    timePeriods: [
      { startTime: '08:00', endTime: '08:45' },
      { startTime: '08:55', endTime: '09:40' },
      { startTime: '10:00', endTime: '10:45' },
      { startTime: '10:55', endTime: '11:40' },
      { startTime: '14:00', endTime: '14:45' },
      { startTime: '14:55', endTime: '15:40' },
      { startTime: '16:00', endTime: '16:45' },
      { startTime: '16:55', endTime: '17:40' }
    ]
  })

  const toggleDarkMode = () => {
    isDarkMode.value = !isDarkMode.value
    localStorage.setItem('darkMode', isDarkMode.value.toString())
  }

  const setThemeColor = (color: string) => {
    themeColor.value = color
    localStorage.setItem('themeColor', color)
  }

  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed.value.toString())
  }

  // 课程表设置相关方法
  const saveScheduleSettings = (settings: ScheduleSettings) => {
    scheduleSettings.value = { ...settings }
    localStorage.setItem('scheduleSettings', JSON.stringify(settings))
  }

  const loadScheduleSettings = () => {
    try {
      const saved = localStorage.getItem('scheduleSettings')
      if (saved) {
        const settings = JSON.parse(saved)
        scheduleSettings.value = { ...scheduleSettings.value, ...settings }
      }
    } catch (error) {
      console.error('加载课程表设置失败:', error)
    }
  }

  const resetScheduleSettings = () => {
    scheduleSettings.value = {
      weekDays: 5,
      periodsPerDay: 8,
      timePeriods: [
        { startTime: '08:00', endTime: '08:45' },
        { startTime: '08:55', endTime: '09:40' },
        { startTime: '10:00', endTime: '10:45' },
        { startTime: '10:55', endTime: '11:40' },
        { startTime: '14:00', endTime: '14:45' },
        { startTime: '14:55', endTime: '15:40' },
        { startTime: '16:00', endTime: '16:45' },
        { startTime: '16:55', endTime: '17:40' }
      ]
    }
    localStorage.removeItem('scheduleSettings')
  }

  const loadSettings = () => {
    const savedDarkMode = localStorage.getItem('darkMode')
    const savedThemeColor = localStorage.getItem('themeColor')
    const savedSidebarCollapsed = localStorage.getItem('sidebarCollapsed')

    if (savedDarkMode) {
      isDarkMode.value = savedDarkMode === 'true'
    }

    if (savedThemeColor) {
      themeColor.value = savedThemeColor
    }

    if (savedSidebarCollapsed) {
      sidebarCollapsed.value = savedSidebarCollapsed === 'true'
    }
    
    // 加载课程表设置
    loadScheduleSettings()
  }

  return {
    isDarkMode,
    themeColor,
    sidebarCollapsed,
    scheduleSettings,
    toggleDarkMode,
    setThemeColor,
    toggleSidebar,
    loadSettings,
    saveScheduleSettings,
    loadScheduleSettings,
    resetScheduleSettings
  }
})