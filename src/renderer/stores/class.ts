import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Class, ClassFormData } from '../types/class'

export const useClassStore = defineStore('class', () => {
  const classes = ref<Class[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 获取所有班级
  async function fetchClasses() {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.classes.getAll()
      if (result.success) {
        classes.value = result.data
      } else {
        error.value = result.error
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取班级列表失败'
    } finally {
      loading.value = false
    }
  }

  // 创建班级
  async function createClass(classData: ClassFormData) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.classes.create(classData)
      if (result.success) {
        await fetchClasses() // 重新获取列表
        return { success: true }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建班级失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 更新班级
  async function updateClass(id: number, classData: ClassFormData) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.classes.update(id, classData)
      if (result.success) {
        await fetchClasses() // 重新获取列表
        return { success: true }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新班级失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 删除班级（软删除）
  async function deleteClass(id: number) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.classes.delete(id)
      if (result.success) {
        await fetchClasses() // 重新获取列表
        return { success: true }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除班级失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 根据ID获取班级
  async function getClassById(id: number) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.classes.getById(id)
      if (result.success) {
        return { success: true, data: result.data }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取班级详情失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  return {
    classes,
    loading,
    error,
    fetchClasses,
    createClass,
    updateClass,
    deleteClass,
    getClassById
  }
})