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
      const pointId = result.lastID || result.lastInsertRowid

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

  // 积分商城相关处理器
  
  // 获取奖励列表
  const handleGetRewards = async (_: IpcMainInvokeEvent) => {
    try {
      const query = `
        SELECT * FROM rewards
        WHERE is_active = 1
        ORDER BY created_at DESC
      `
      
      const rewards = await db.all(query)
      
      return { success: true, data: rewards }
    } catch (error) {
      console.error('获取奖励列表失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '获取奖励列表失败' }
    }
  }
  ipcMain.handle('points:getRewards', handleGetRewards)

  // 创建奖励
  const handleCreateReward = async (_: IpcMainInvokeEvent, data: any) => {
    try {
      const insertQuery = `
        INSERT INTO rewards (
          name, description, points_required, stock, image, category, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, 1)
      `
      
      const params = [
        data.name,
        data.description,
        data.points_required,
        data.stock,
        data.image || '',
        data.category
      ]

      const result = await db.run(insertQuery, params)
      const rewardId = result.lastID || result.lastInsertRowid

      if (!rewardId) {
        throw new Error('无法获取新创建的奖励ID')
      }

      // 返回创建的奖励
      const newReward = await db.get('SELECT * FROM rewards WHERE id = ?', [Number(rewardId)])
      
      return { success: true, data: newReward }
    } catch (error) {
      console.error('创建奖励失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '创建奖励失败' }
    }
  }
  ipcMain.handle('points:createReward', handleCreateReward)

  // 更新奖励
  const handleUpdateReward = async (_: IpcMainInvokeEvent, data: any) => {
    try {
      const updateQuery = `
        UPDATE rewards
        SET name = ?, description = ?, points_required = ?, stock = ?, image = ?, category = ?
        WHERE id = ?
      `
      
      const params = [
        data.name,
        data.description,
        data.points_required,
        data.stock,
        data.image || '',
        data.category,
        data.id
      ]

      await db.run(updateQuery, params)
      
      // 返回更新后的奖励
      const updatedReward = await db.get('SELECT * FROM rewards WHERE id = ?', [data.id])
      
      return { success: true, data: updatedReward }
    } catch (error) {
      console.error('更新奖励失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '更新奖励失败' }
    }
  }
  ipcMain.handle('points:updateReward', handleUpdateReward)

  // 删除奖励
  const handleDeleteReward = async (_: IpcMainInvokeEvent, id: number) => {
    try {
      const query = 'UPDATE rewards SET is_active = 0 WHERE id = ?'
      await db.run(query, [id])
      
      return { success: true }
    } catch (error) {
      console.error('删除奖励失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '删除奖励失败' }
    }
  }
  ipcMain.handle('points:deleteReward', handleDeleteReward)

  // 兑换奖励
  const handleExchangeReward = async (_: IpcMainInvokeEvent, data: any) => {
    try {
      // 检查奖励是否存在且可用
      const reward = await db.get(
        'SELECT * FROM rewards WHERE id = ? AND is_active = 1',
        [data.reward_id]
      )
      
      if (!reward) {
        return { success: false, error: '奖励不存在或已下架' }
      }

      // 检查库存
      if (reward.stock !== -1 && reward.stock < data.quantity) {
        return { success: false, error: '库存不足' }
      }

      // 检查学生积分
      const studentPoints = await db.get(
        'SELECT COALESCE(SUM(points), 0) as total_points FROM points WHERE student_id = ?',
        [data.student_id]
      )
      
      const totalCost = reward.points_required * data.quantity
      if (!studentPoints || studentPoints.total_points < totalCost) {
        return { success: false, error: '积分不足' }
      }

      // 创建兑换记录
      const insertQuery = `
        INSERT INTO reward_exchanges (
          student_id, reward_id, quantity, points_cost, status, exchange_date
        ) VALUES (?, ?, ?, ?, 'completed', ?)
      `
      
      const params = [
        data.student_id,
        data.reward_id,
        data.quantity,
        totalCost,
        new Date().toISOString().split('T')[0]
      ]

      const result = await db.run(insertQuery, params)
      const exchangeId = result.lastID || result.lastInsertRowid

      if (!exchangeId) {
        throw new Error('无法获取新创建的兑换记录ID')
      }

      // 扣除积分
      const pointInsertQuery = `
        INSERT INTO points (
          student_id, points, type, reason, given_by, given_date
        ) VALUES (?, ?, 'penalty', ?, 1, ?)
      `
      
      await db.run(pointInsertQuery, [
        data.student_id,
        -totalCost,
        `兑换奖励：${reward.name} x${data.quantity}`,
        new Date().toISOString().split('T')[0]
      ])

      // 更新库存
      if (reward.stock !== -1) {
        await db.run(
          'UPDATE rewards SET stock = stock - ? WHERE id = ?',
          [data.quantity, data.reward_id]
        )
      }
      
      return { success: true, data: { id: exchangeId } }
    } catch (error) {
      console.error('兑换奖励失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '兑换奖励失败' }
    }
  }
  ipcMain.handle('points:exchangeReward', handleExchangeReward)

  // 获取兑换记录
  const handleGetExchanges = async (_: IpcMainInvokeEvent, params: any = {}) => {
    try {
      const { page = 1, page_size = 20 } = params
      const offset = (page - 1) * page_size

      // 获取总数
      const countQuery = `
        SELECT COUNT(*) as total
        FROM reward_exchanges re
        JOIN rewards r ON re.reward_id = r.id
        JOIN students s ON re.student_id = s.id
      `
      const countResult = await db.get(countQuery)
      const total = countResult?.total || 0

      // 获取分页数据
      const selectQuery = `
        SELECT
          re.*,
          r.name as reward_name,
          r.image as reward_image,
          s.name as student_name
        FROM reward_exchanges re
        JOIN rewards r ON re.reward_id = r.id
        JOIN students s ON re.student_id = s.id
        ORDER BY re.created_at DESC
        LIMIT ? OFFSET ?
      `

      const exchanges = await db.all(selectQuery, [page_size, offset])

      return {
        success: true,
        data: {
          exchanges,
          total: Number(total) || 0,
          page: Number(page) || 1,
          page_size: Number(page_size) || 20,
          total_pages: Math.ceil((Number(total) || 0) / (Number(page_size) || 20))
        }
      }
    } catch (error) {
      console.error('获取兑换记录失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '获取兑换记录失败' }
    }
  }
  ipcMain.handle('points:getExchanges', handleGetExchanges)
}