import { ipcMain, IpcMainInvokeEvent } from 'electron'
import type { DatabaseManager } from '../database'
import type { PointRecord, PointFormData, PointQueryParams } from '../../renderer/types/point'

export function setupPointHandlers(db: DatabaseManager) {
  // 获取积分记录列表
  const handleListPoints = async (_: IpcMainInvokeEvent, params: PointQueryParams = {}) => {
    try {
      const {
        student_id,
        group_id,
        class_id,
        type,
        start_date,
        end_date,
        page = 1,
        page_size = 20
      } = params

      const offset = (page - 1) * page_size
      let whereClause = 'WHERE 1=1'
      let paramsArray: any[] = []

      if (student_id) {
        whereClause += ' AND p.student_id = ?'
        paramsArray.push(student_id)
      }

      if (group_id) {
        whereClause += ' AND p.group_id = ?'
        paramsArray.push(group_id)
      }

      if (class_id) {
        whereClause += ' AND p.class_id = ?'
        paramsArray.push(class_id)
      }

      if (type) {
        whereClause += ' AND p.type = ?'
        paramsArray.push(type)
      }

      if (start_date) {
        whereClause += ' AND p.given_date >= ?'
        paramsArray.push(start_date)
      }

      if (end_date) {
        whereClause += ' AND p.given_date <= ?'
        paramsArray.push(end_date)
      }

      // 获取总数
      const countQuery = `
        SELECT COUNT(*) as total
        FROM points p
        ${whereClause}
      `
      const countResult = await db.get(countQuery, paramsArray)
      const total = countResult?.total || 0

      // 获取分页数据
      const selectQuery = `
        SELECT
          p.*,
          s.name as student_name,
          c.name as class_name,
          g.name as group_name
        FROM points p
        LEFT JOIN students s ON p.student_id = s.id
        LEFT JOIN classes c ON p.class_id = c.id
        LEFT JOIN groups g ON p.group_id = g.id
        ${whereClause}
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `
      paramsArray.push(page_size, offset)

      const items = await db.all(selectQuery, paramsArray)

      return {
        success: true,
        data: {
          items,
          total: Number(total) || 0,
          page: Number(page) || 1,
          page_size: Number(page_size) || 20,
          total_pages: Math.ceil((Number(total) || 0) / (Number(page_size) || 20))
        }
      }
    } catch (error) {
      console.error('获取积分记录列表失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '获取积分记录列表失败' }
    }
  }
  ipcMain.handle('points:list', handleListPoints)

  // 添加积分记录
  const handleCreatePoint = async (_: IpcMainInvokeEvent, data: PointFormData) => {
    try {
      // 验证数据
      if (!data.class_id) {
        return { success: false, error: '班级ID不能为空' }
      }
      
      if (!data.reason) {
        return { success: false, error: '积分原因不能为空' }
      }
      
      if (!data.student_id && !data.group_id) {
        return { success: false, error: '必须指定学生或小组' }
      }

      const insertQuery = `
        INSERT INTO points (
          student_id, group_id, class_id, points, type, reason, given_by, given_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
      
      const params = [
        data.student_id || null,
        data.group_id || null,
        data.class_id,
        data.points,
        data.type,
        data.reason,
        data.given_by || 1,
        data.given_date || new Date().toISOString().split('T')[0]
      ]

      const result = await db.run(insertQuery, params)
      console.log('积分创建结果:', result) // 调试日志
      
      let pointId = result.lastInsertRowid
      // 如果lastInsertRowid为null或undefined，尝试其他方式获取ID
      if (!pointId) {
        console.warn('无法直接获取lastInsertRowid，尝试通过查询获取最新记录ID')
        const lastPoint = await db.get(
          'SELECT id FROM points WHERE student_id = ? AND class_id = ? ORDER BY created_at DESC LIMIT 1',
          [data.student_id, data.class_id]
        )
        if (lastPoint && lastPoint.id) {
          pointId = lastPoint.id
        }
      }

      if (!pointId) {
        throw new Error('无法获取新创建的积分记录ID')
      }

      // 返回创建的积分记录
      const newPoint = await db.get('SELECT * FROM points WHERE id = ?', [Number(pointId)])
      
      return { success: true, data: newPoint }
    } catch (error) {
      console.error('创建积分记录失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '创建积分记录失败' }
    }
  }
  ipcMain.handle('points:create', handleCreatePoint)

  // 获取学生积分汇总
  const handleGetStudentPointsSummary = async (_: IpcMainInvokeEvent, class_id: number) => {
    try {
      const query = `
        SELECT 
          s.id as student_id,
          s.name as student_name,
          COALESCE(SUM(CASE WHEN p.points > 0 THEN p.points ELSE 0 END), 0) as total_reward_points,
          COALESCE(SUM(CASE WHEN p.points < 0 THEN ABS(p.points) ELSE 0 END), 0) as total_penalty_points,
          COALESCE(SUM(p.points), 0) as total_points,
          COUNT(CASE WHEN p.type = 'reward' THEN 1 END) as reward_count,
          COUNT(CASE WHEN p.type = 'penalty' THEN 1 END) as penalty_count
        FROM students s
        LEFT JOIN points p ON s.id = p.student_id AND p.class_id = ? AND p.group_id IS NULL
        WHERE s.class_id = ? AND s.is_active = 1
        GROUP BY s.id, s.name
        ORDER BY total_points DESC, s.name ASC
      `
      
      const items = await db.all(query, [class_id, class_id])
      
      return { success: true, data: items }
    } catch (error) {
      console.error('获取学生积分汇总失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '获取学生积分汇总失败' }
    }
  }
  ipcMain.handle('points:getStudentSummary', handleGetStudentPointsSummary)

  // 获取小组积分汇总
  const handleGetGroupPointsSummary = async (_: IpcMainInvokeEvent, class_id: number) => {
    try {
      const query = `
        SELECT 
          g.id as group_id,
          g.name as group_name,
          COALESCE(SUM(CASE WHEN p.points > 0 THEN p.points ELSE 0 END), 0) as total_reward_points,
          COALESCE(SUM(CASE WHEN p.points < 0 THEN ABS(p.points) ELSE 0 END), 0) as total_penalty_points,
          COALESCE(SUM(p.points), 0) as total_points,
          COUNT(CASE WHEN p.type = 'reward' THEN 1 END) as reward_count,
          COUNT(CASE WHEN p.type = 'penalty' THEN 1 END) as penalty_count,
          COUNT(DISTINCT sg.student_id) as member_count
        FROM groups g
        LEFT JOIN student_groups sg ON g.id = sg.group_id
        LEFT JOIN points p ON g.id = p.group_id AND p.class_id = ?
        WHERE g.class_id = ?
        GROUP BY g.id, g.name
        ORDER BY total_points DESC, g.name ASC
      `
      
      const items = await db.all(query, [class_id, class_id])
      
      return { success: true, data: items }
    } catch (error) {
      console.error('获取小组积分汇总失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '获取小组积分汇总失败' }
    }
  }
  ipcMain.handle('points:getGroupSummary', handleGetGroupPointsSummary)

  // 获取积分规则
  const handleGetPointRules = async (_: IpcMainInvokeEvent, class_id: number) => {
    try {
      const query = `
        SELECT point_rules
        FROM class_configs
        WHERE class_id = ?
      `
      
      const result = await db.get(query, [class_id])
      
      if (!result) {
        return { success: true, data: [] }
      }
      
      let rules = []
      try {
        rules = JSON.parse(result.point_rules || '[]')
      } catch (e) {
        rules = []
      }
      
      return { success: true, data: rules }
    } catch (error) {
      console.error('获取积分规则失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '获取积分规则失败' }
    }
  }
  ipcMain.handle('points:getRules', handleGetPointRules)

  // 更新积分规则
  const handleUpdatePointRules = async (_: IpcMainInvokeEvent, class_id: number, rules: any[]) => {
    try {
      // 检查是否存在班级配置
      const checkQuery = 'SELECT id FROM class_configs WHERE class_id = ?'
      const existing = await db.get(checkQuery, [class_id])
      
      if (!existing) {
        // 创建班级配置记录
        const insertQuery = `
          INSERT INTO class_configs (class_id, point_rules)
          VALUES (?, ?)
        `
        await db.run(insertQuery, [class_id, JSON.stringify(rules)])
      } else {
        // 更新积分规则
        const updateQuery = `
          UPDATE class_configs
          SET point_rules = ?
          WHERE class_id = ?
        `
        await db.run(updateQuery, [JSON.stringify(rules), class_id])
      }
      
      return { success: true }
    } catch (error) {
      console.error('更新积分规则失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '更新积分规则失败' }
    }
  }
  ipcMain.handle('points:updateRules', handleUpdatePointRules)

  // 删除积分记录
  const handleDeletePoint = async (_: IpcMainInvokeEvent, id: number) => {
    try {
      const query = 'DELETE FROM points WHERE id = ?'
      await db.run(query, [id])
      
      return { success: true }
    } catch (error) {
      console.error('删除积分记录失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '删除积分记录失败' }
    }
  }
  ipcMain.handle('points:delete', handleDeletePoint)


}