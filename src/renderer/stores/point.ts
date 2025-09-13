import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { PointRecord, PointFormData, PointQueryParams, StudentPointSummary, PointRule } from '../types/point'

export const usePointStore = defineStore('point', () => {
  const points = ref<PointRecord[]>([])
  const studentPoints = ref<StudentPointSummary[]>([])
  const groupPoints = ref<any[]>([])
  const pointRules = ref<PointRule[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(20)

  // 获取积分记录列表
  async function fetchPoints(params?: PointQueryParams) {
    loading.value = true
    error.value = null
    try {
      const query = {
        ...params,
        page: params?.page ?? currentPage.value,
        page_size: params?.page_size ?? pageSize.value
      }
      
      const result = await window.electronAPI.points.list(query)
      if (result.success) {
        const data = result.data || {}
        points.value = Array.isArray(data.items) ? data.items : []
        total.value = Number(data.total) || 0
      } else {
        error.value = result.error
        points.value = []
        total.value = 0
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取积分记录列表失败'
      points.value = []
      total.value = 0
    } finally {
      loading.value = false
    }
  }

  // 兼容别名：getPoints -> fetchPoints
  async function getPoints(params?: PointQueryParams) {
    return fetchPoints(params)
  }

  // 创建积分记录
  async function createPoint(data: PointFormData) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.points.create(data)
      if (result.success) {
        await fetchPoints()
        return { success: true, data: result.data }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建积分记录失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 兼容别名：addPoint -> createPoint
  async function addPoint(data: PointFormData) {
    return createPoint(data)
  }

  // 删除积分记录
  async function deletePoint(id: number) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.points.delete(id)
      if (result.success) {
        await fetchPoints()
        return { success: true }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除积分记录失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 获取学生积分汇总
  async function fetchStudentPointsSummary(class_id: number) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.points.getStudentSummary(class_id)
      if (result.success) {
        studentPoints.value = Array.isArray(result.data) ? result.data : []
      } else {
        error.value = result.error
        studentPoints.value = []
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取学生积分汇总失败'
      studentPoints.value = []
    } finally {
      loading.value = false
    }
  }

  // 获取小组积分汇总
  async function fetchGroupPointsSummary(class_id: number) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.points.getGroupSummary(class_id)
      if (result.success) {
        groupPoints.value = Array.isArray(result.data) ? result.data : []
      } else {
        error.value = result.error
        groupPoints.value = []
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取小组积分汇总失败'
      groupPoints.value = []
    } finally {
      loading.value = false
    }
  }

  // 获取积分规则
  async function fetchPointRules(class_id: number) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.points.getRules(class_id)
      if (result.success) {
        pointRules.value = Array.isArray(result.data) ? result.data : []
      } else {
        error.value = result.error
        pointRules.value = []
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取积分规则失败'
      pointRules.value = []
    } finally {
      loading.value = false
    }
  }

  // 更新积分规则
  async function updatePointRules(class_id: number, rules: PointRule[]) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.points.updateRules(class_id, rules)
      if (result.success) {
        pointRules.value = rules
        return { success: true }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新积分规则失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 重置状态
  function resetState() {
    points.value = []
    studentPoints.value = []
    groupPoints.value = []
    pointRules.value = []
    error.value = null
    total.value = 0
    currentPage.value = 1
  }



  return {
    points: computed(() => points.value),
    studentPoints: computed(() => studentPoints.value),
    groupPoints: computed(() => groupPoints.value),
    pointRules: computed(() => pointRules.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    total: computed(() => total.value),
    currentPage: computed(() => currentPage.value),
    pageSize: computed(() => pageSize.value),
    
    fetchPoints,
    // 兼容导出
    getPoints,
    createPoint,
    addPoint,
    deletePoint,
    fetchStudentPointsSummary,
    fetchGroupPointsSummary,
    fetchPointRules,
    updatePointRules,
    resetState
  }
})