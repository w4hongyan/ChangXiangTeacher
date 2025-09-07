import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  const isDarkMode = ref(false)
  const themeColor = ref('#667eea')
  const sidebarCollapsed = ref(false)

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
  }

  return {
    isDarkMode,
    themeColor,
    sidebarCollapsed,
    toggleDarkMode,
    setThemeColor,
    toggleSidebar,
    loadSettings
  }
})