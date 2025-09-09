import { ipcMain, IpcMainInvokeEvent } from 'electron'
import type { DatabaseManager } from '../database'
import type { Group, GroupFormData, StudentGroup } from '../../renderer/types/group'

export function setupGroupHandlers(db: DatabaseManager) {
  // 创建小组
  const handleCreateGroup = async (_: IpcMainInvokeEvent, data: GroupFormData) => {
    try {
      const insertQuery = `
        INSERT INTO groups (name, class_id, description, created_by)
        VALUES (?, ?, ?, ?)
      `
      
      const params = [
        data.name,
        data.class_id,
        data.description || null,
        1 // 默认创建者ID
      ]

      const result = await db.run(insertQuery, params)
      const groupId = result.lastID || result.lastInsertRowid

      if (!groupId) {
        throw new Error('无法获取新创建的小组ID')
      }

      // 返回创建的小组
      const newGroup = await db.get('SELECT * FROM groups WHERE id = ?', [Number(groupId)])
      
      return { success: true, data: newGroup }
    } catch (error) {
      console.error('创建小组失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '创建小组失败' }
    }
  }
  ipcMain.handle('groups:create', handleCreateGroup)

  // 获取班级的小组列表
  const handleListGroups = async (_: IpcMainInvokeEvent, class_id: number) => {
    try {
      const query = `
        SELECT g.*, COUNT(sg.id) as member_count
        FROM groups g
        LEFT JOIN student_groups sg ON g.id = sg.group_id
        WHERE g.class_id = ?
        GROUP BY g.id
        ORDER BY g.created_at DESC
      `
      
      const groups = await db.all(query, [class_id])
      
      return { success: true, data: groups }
    } catch (error) {
      console.error('获取小组列表失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '获取小组列表失败' }
    }
  }
  ipcMain.handle('groups:list', handleListGroups)

  // 获取小组详情（包括成员）
  const handleGetGroupById = async (_: IpcMainInvokeEvent, id: number) => {
    try {
      // 获取小组信息
      const groupQuery = 'SELECT * FROM groups WHERE id = ?'
      const group = await db.get(groupQuery, [id])
      
      if (!group) {
        return { success: false, error: '小组不存在' }
      }
      
      // 获取小组成员
      const membersQuery = `
        SELECT sg.*, s.name as student_name
        FROM student_groups sg
        JOIN students s ON sg.student_id = s.id
        WHERE sg.group_id = ?
        ORDER BY s.name
      `
      const members = await db.all(membersQuery, [id])
      
      return { success: true, data: { ...group, members } }
    } catch (error) {
      console.error('获取小组详情失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '获取小组详情失败' }
    }
  }
  ipcMain.handle('groups:getById', handleGetGroupById)

  // 更新小组
  const handleUpdateGroup = async (_: IpcMainInvokeEvent, id: number, data: Partial<GroupFormData>) => {
    try {
      const fields: string[] = []
      const values: any[] = []

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          fields.push(`${key} = ?`)
          values.push(value)
        }
      })

      if (fields.length === 0) {
        return { success: false, error: '没有要更新的数据' }
      }

      const query = `UPDATE groups SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
      values.push(id)

      await db.run(query, values)

      // 返回更新后的小组
      const updatedGroup = await db.get('SELECT * FROM groups WHERE id = ?', [id])
      
      return { success: true, data: updatedGroup }
    } catch (error) {
      console.error('更新小组失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '更新小组失败' }
    }
  }
  ipcMain.handle('groups:update', handleUpdateGroup)

  // 删除小组
  const handleDeleteGroup = async (_: IpcMainInvokeEvent, id: number) => {
    try {
      // 先删除小组成员关联
      await db.run('DELETE FROM student_groups WHERE group_id = ?', [id])
      
      // 再删除小组
      await db.run('DELETE FROM groups WHERE id = ?', [id])
      
      return { success: true }
    } catch (error) {
      console.error('删除小组失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '删除小组失败' }
    }
  }
  ipcMain.handle('groups:delete', handleDeleteGroup)

  // 为小组添加成员
  const handleAddGroupMember = async (_: IpcMainInvokeEvent, group_id: number, student_id: number) => {
    try {
      // 检查是否已存在
      const checkQuery = 'SELECT id FROM student_groups WHERE group_id = ? AND student_id = ?'
      const existing = await db.get(checkQuery, [group_id, student_id])
      
      if (existing) {
        return { success: false, error: '该学生已在小组中' }
      }

      const insertQuery = `
        INSERT INTO student_groups (group_id, student_id)
        VALUES (?, ?)
      `
      
      await db.run(insertQuery, [group_id, student_id])
      
      return { success: true }
    } catch (error) {
      console.error('添加小组成员失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '添加小组成员失败' }
    }
  }
  ipcMain.handle('groups:addMember', handleAddGroupMember)

  // 从小组移除成员
  const handleRemoveGroupMember = async (_: IpcMainInvokeEvent, group_id: number, student_id: number) => {
    try {
      const deleteQuery = 'DELETE FROM student_groups WHERE group_id = ? AND student_id = ?'
      await db.run(deleteQuery, [group_id, student_id])
      
      return { success: true }
    } catch (error) {
      console.error('移除小组成员失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '移除小组成员失败' }
    }
  }
  ipcMain.handle('groups:removeMember', handleRemoveGroupMember)

  // 获取小组积分记录
  const handleListGroupPoints = async (_: IpcMainInvokeEvent, group_id: number) => {
    try {
      const query = `
        SELECT p.*, g.name as group_name
        FROM points p
        JOIN groups g ON p.group_id = g.id
        WHERE p.group_id = ?
        ORDER BY p.created_at DESC
      `
      
      const points = await db.all(query, [group_id])
      
      return { success: true, data: points }
    } catch (error) {
      console.error('获取小组积分记录失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '获取小组积分记录失败' }
    }
  }
  ipcMain.handle('groups:getPoints', handleListGroupPoints)
}