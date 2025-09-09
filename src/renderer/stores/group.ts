import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Group, GroupFormData, GroupWithMembers } from '../types/group'

export const useGroupStore = defineStore('group', () => {
  const groups = ref<Group[]>([])
  const currentGroup = ref<GroupWithMembers | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 创建小组
  async function createGroup(data: GroupFormData) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.groups.create(data)
      if (result.success) {
        await fetchGroups(data.class_id)
        return { success: true, data: result.data }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建小组失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 获取班级小组列表
  async function fetchGroups(class_id: number) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.groups.list(class_id)
      if (result.success) {
        groups.value = Array.isArray(result.data) ? result.data : []
      } else {
        error.value = result.error
        groups.value = []
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取小组列表失败'
      groups.value = []
    } finally {
      loading.value = false
    }
  }

  // 获取小组详情
  async function fetchGroupById(id: number) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.groups.getById(id)
      if (result.success) {
        currentGroup.value = result.data
      } else {
        error.value = result.error
        currentGroup.value = null
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取小组详情失败'
      currentGroup.value = null
    } finally {
      loading.value = false
    }
  }

  // 更新小组
  async function updateGroup(id: number, data: Partial<GroupFormData>) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.groups.update(id, data)
      if (result.success) {
        // 更新本地数据
        const index = groups.value.findIndex(g => g.id === id)
        if (index !== -1) {
          groups.value[index] = { ...groups.value[index], ...result.data }
        }
        return { success: true, data: result.data }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新小组失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 删除小组
  async function deleteGroup(id: number, class_id: number) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.groups.delete(id)
      if (result.success) {
        await fetchGroups(class_id)
        return { success: true }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除小组失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 添加小组成员
  async function addGroupMember(group_id: number, student_id: number) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.groups.addMember(group_id, student_id)
      if (result.success) {
        // 如果当前查看的是这个小组，刷新小组详情
        if (currentGroup.value && currentGroup.value.id === group_id) {
          await fetchGroupById(group_id)
        }
        return { success: true }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '添加小组成员失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 移除小组成员
  async function removeGroupMember(group_id: number, student_id: number) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.groups.removeMember(group_id, student_id)
      if (result.success) {
        // 如果当前查看的是这个小组，刷新小组详情
        if (currentGroup.value && currentGroup.value.id === group_id) {
          await fetchGroupById(group_id)
        }
        return { success: true }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '移除小组成员失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 获取小组积分记录
  async function fetchGroupPoints(group_id: number) {
    loading.value = true
    error.value = null
    try {
      const result = await window.electronAPI.groups.getPoints(group_id)
      if (result.success) {
        return { success: true, data: result.data }
      } else {
        error.value = result.error
        return { success: false, error: result.error }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取小组积分记录失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 重置状态
  function resetState() {
    groups.value = []
    currentGroup.value = null
    error.value = null
  }

  return {
    groups: computed(() => groups.value),
    currentGroup: computed(() => currentGroup.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    
    createGroup,
    fetchGroups,
    fetchGroupById,
    updateGroup,
    deleteGroup,
    addGroupMember,
    removeGroupMember,
    fetchGroupPoints,
    resetState
  }
})