import { ipcMain, IpcMainInvokeEvent } from 'electron'
import type { DatabaseManager } from '../database'
import type { 
  ShopItem, 
  ShopCategory, 
  ShopExchange, 
  ShopItemFormData, 
  ShopCategoryFormData, 
  ShopExchangeFormData,
  ShopQueryParams,
  ExchangeQueryParams,
  ShopStats,
  StudentShopInfo
} from '../../renderer/types/shop'

export function setupShopHandlers(db: DatabaseManager) {
  // 获取商品列表
  const handleListItems = async (_: IpcMainInvokeEvent, params: ShopQueryParams = {}) => {
    try {
      const {
        category,
        is_active,
        search,
        sort_by = 'sort_order',
        sort_order = 'asc',
        page = 1,
        page_size = 20
      } = params

      const offset = (page - 1) * page_size
      let whereClause = 'WHERE 1=1'
      let paramsArray: any[] = []

      if (category) {
        whereClause += ' AND category = ?'
        paramsArray.push(category)
      }

      if (is_active !== undefined) {
        whereClause += ' AND is_active = ?'
        paramsArray.push(is_active)
      }

      if (search) {
        whereClause += ' AND (name LIKE ? OR description LIKE ?)'
        paramsArray.push(`%${search}%`, `%${search}%`)
      }

      // 获取总数
      const countQuery = `SELECT COUNT(*) as total FROM shop_items ${whereClause}`
      const countResult = await db.get(countQuery, paramsArray)
      const total = countResult?.total || 0

      // 获取分页数据
      const selectQuery = `
        SELECT * FROM shop_items 
        ${whereClause}
        ORDER BY ${sort_by} ${sort_order.toUpperCase()}
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
      console.error('获取商品列表失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '获取商品列表失败' }
    }
  }
  ipcMain.handle('shop:listItems', handleListItems)

  // 创建商品
  const handleCreateItem = async (_: IpcMainInvokeEvent, data: ShopItemFormData) => {
    try {
      if (!data.name || !data.category || data.price < 0) {
        return { success: false, error: '商品信息不完整' }
      }

      const insertQuery = `
        INSERT INTO shop_items (
          name, description, price, category, image_url, stock, is_active, sort_order, attributes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      
      const params = [
        data.name,
        data.description || '',
        data.price,
        data.category,
        data.image_url || null,
        data.stock,
        data.is_active,
        data.sort_order,
        JSON.stringify(data.attributes || {})
      ]

      const result = await db.run(insertQuery, params)
      const itemId = result.lastID || result.lastInsertRowid

      if (!itemId) {
        throw new Error('无法获取新创建的商品ID')
      }

      const newItem = await db.get('SELECT * FROM shop_items WHERE id = ?', [Number(itemId)])
      
      return { success: true, data: newItem }
    } catch (error) {
      console.error('创建商品失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '创建商品失败' }
    }
  }
  ipcMain.handle('shop:createItem', handleCreateItem)

  // 更新商品
  const handleUpdateItem = async (_: IpcMainInvokeEvent, id: number, data: Partial<ShopItemFormData>) => {
    try {
      const updateFields = []
      const updateValues = []

      if (data.name !== undefined) {
        updateFields.push('name = ?')
        updateValues.push(data.name)
      }
      if (data.description !== undefined) {
        updateFields.push('description = ?')
        updateValues.push(data.description)
      }
      if (data.price !== undefined) {
        updateFields.push('price = ?')
        updateValues.push(data.price)
      }
      if (data.category !== undefined) {
        updateFields.push('category = ?')
        updateValues.push(data.category)
      }
      if (data.image_url !== undefined) {
        updateFields.push('image_url = ?')
        updateValues.push(data.image_url)
      }
      if (data.stock !== undefined) {
        updateFields.push('stock = ?')
        updateValues.push(data.stock)
      }
      if (data.is_active !== undefined) {
        updateFields.push('is_active = ?')
        updateValues.push(data.is_active)
      }
      if (data.sort_order !== undefined) {
        updateFields.push('sort_order = ?')
        updateValues.push(data.sort_order)
      }
      if (data.attributes !== undefined) {
        updateFields.push('attributes = ?')
        updateValues.push(JSON.stringify(data.attributes))
      }

      if (updateFields.length === 0) {
        return { success: false, error: '没有要更新的字段' }
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP')
      updateValues.push(id)

      const updateQuery = `UPDATE shop_items SET ${updateFields.join(', ')} WHERE id = ?`
      await db.run(updateQuery, updateValues)

      const updatedItem = await db.get('SELECT * FROM shop_items WHERE id = ?', [id])
      
      return { success: true, data: updatedItem }
    } catch (error) {
      console.error('更新商品失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '更新商品失败' }
    }
  }
  ipcMain.handle('shop:updateItem', handleUpdateItem)

  // 删除商品
  const handleDeleteItem = async (_: IpcMainInvokeEvent, id: number) => {
    try {
      // 检查是否有相关的兑换记录
      const exchangeCount = await db.get(
        'SELECT COUNT(*) as count FROM shop_exchanges WHERE item_id = ?',
        [id]
      )
      
      if (exchangeCount && exchangeCount.count > 0) {
        return { success: false, error: '该商品存在兑换记录，无法删除' }
      }

      await db.run('DELETE FROM shop_items WHERE id = ?', [id])
      
      return { success: true }
    } catch (error) {
      console.error('删除商品失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '删除商品失败' }
    }
  }
  ipcMain.handle('shop:deleteItem', handleDeleteItem)

  // 获取分类列表
  const handleListCategories = async () => {
    try {
      const categories = await db.all(
        'SELECT * FROM shop_categories WHERE is_active = 1 ORDER BY sort_order ASC, name ASC'
      )
      
      return { success: true, data: categories }
    } catch (error) {
      console.error('获取分类列表失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '获取分类列表失败' }
    }
  }
  ipcMain.handle('shop:listCategories', handleListCategories)

  // 创建分类
  const handleCreateCategory = async (_: IpcMainInvokeEvent, data: ShopCategoryFormData) => {
    try {
      if (!data.name) {
        return { success: false, error: '分类名称不能为空' }
      }

      const insertQuery = `
        INSERT INTO shop_categories (name, description, icon, color, sort_order, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
      `
      
      const params = [
        data.name,
        data.description || '',
        data.icon || '',
        data.color,
        data.sort_order,
        data.is_active
      ]

      const result = await db.run(insertQuery, params)
      const categoryId = result.lastID || result.lastInsertRowid

      const newCategory = await db.get('SELECT * FROM shop_categories WHERE id = ?', [Number(categoryId)])
      
      return { success: true, data: newCategory }
    } catch (error) {
      console.error('创建分类失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '创建分类失败' }
    }
  }
  ipcMain.handle('shop:createCategory', handleCreateCategory)

  // 兑换商品
  const handleExchangeItem = async (_: IpcMainInvokeEvent, data: ShopExchangeFormData) => {
    try {
      // 检查商品是否存在且可用
      const item = await db.get(
        'SELECT * FROM shop_items WHERE id = ? AND is_active = 1',
        [data.item_id]
      )
      
      if (!item) {
        return { success: false, error: '商品不存在或已下架' }
      }

      // 检查库存
      if (item.stock !== -1 && item.stock < data.quantity) {
        return { success: false, error: '库存不足' }
      }

      // 检查学生积分
      const studentPoints = await db.get(
        'SELECT COALESCE(SUM(points), 0) as total_points FROM points WHERE student_id = ? AND class_id = ?',
        [data.student_id, data.class_id]
      )
      
      const totalCost = item.price * data.quantity
      if (!studentPoints || studentPoints.total_points < totalCost) {
        return { success: false, error: '积分不足' }
      }

      // 创建兑换记录
      const insertQuery = `
        INSERT INTO shop_exchanges (
          student_id, item_id, class_id, quantity, points_cost, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `
      
      const params = [
        data.student_id,
        data.item_id,
        data.class_id,
        data.quantity,
        totalCost,
        'pending',
        data.notes || ''
      ]

      const result = await db.run(insertQuery, params)
      const exchangeId = result.lastID || result.lastInsertRowid

      // 扣除积分
      await db.run(
        'INSERT INTO points (student_id, class_id, points, type, reason, given_date) VALUES (?, ?, ?, ?, ?, ?)',
        [data.student_id, data.class_id, -totalCost, 'penalty', `兑换商品：${item.name}`, new Date().toISOString().split('T')[0]]
      )

      // 更新商品销量和库存
      if (item.stock !== -1) {
        await db.run(
          'UPDATE shop_items SET stock = stock - ?, sold_count = sold_count + ? WHERE id = ?',
          [data.quantity, data.quantity, data.item_id]
        )
      } else {
        await db.run(
          'UPDATE shop_items SET sold_count = sold_count + ? WHERE id = ?',
          [data.quantity, data.item_id]
        )
      }

      const newExchange = await db.get(
        `SELECT e.*, s.name as student_name, i.name as item_name, i.image_url as item_image_url
         FROM shop_exchanges e
         JOIN students s ON e.student_id = s.id
         JOIN shop_items i ON e.item_id = i.id
         WHERE e.id = ?`,
        [Number(exchangeId)]
      )
      
      return { success: true, data: newExchange }
    } catch (error) {
      console.error('兑换商品失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '兑换商品失败' }
    }
  }
  ipcMain.handle('shop:exchangeItem', handleExchangeItem)

  // 获取兑换记录列表
  const handleListExchanges = async (_: IpcMainInvokeEvent, params: ExchangeQueryParams = {}) => {
    try {
      const {
        student_id,
        class_id,
        status,
        start_date,
        end_date,
        page = 1,
        page_size = 20
      } = params

      const offset = (page - 1) * page_size
      let whereClause = 'WHERE 1=1'
      let paramsArray: any[] = []

      if (student_id) {
        whereClause += ' AND e.student_id = ?'
        paramsArray.push(student_id)
      }

      if (class_id) {
        whereClause += ' AND e.class_id = ?'
        paramsArray.push(class_id)
      }

      if (status) {
        whereClause += ' AND e.status = ?'
        paramsArray.push(status)
      }

      if (start_date) {
        whereClause += ' AND DATE(e.created_at) >= ?'
        paramsArray.push(start_date)
      }

      if (end_date) {
        whereClause += ' AND DATE(e.created_at) <= ?'
        paramsArray.push(end_date)
      }

      // 获取总数
      const countQuery = `SELECT COUNT(*) as total FROM shop_exchanges e ${whereClause}`
      const countResult = await db.get(countQuery, paramsArray)
      const total = countResult?.total || 0

      // 获取分页数据
      const selectQuery = `
        SELECT e.*, s.name as student_name, i.name as item_name, i.image_url as item_image_url
        FROM shop_exchanges e
        JOIN students s ON e.student_id = s.id
        JOIN shop_items i ON e.item_id = i.id
        ${whereClause}
        ORDER BY e.created_at DESC
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
      console.error('获取兑换记录失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '获取兑换记录失败' }
    }
  }
  ipcMain.handle('shop:listExchanges', handleListExchanges)

  // 审批兑换
  const handleApproveExchange = async (_: IpcMainInvokeEvent, id: number, approved: boolean, notes?: string) => {
    try {
      const status = approved ? 'approved' : 'rejected'
      const updateQuery = `
        UPDATE shop_exchanges 
        SET status = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP, notes = ?
        WHERE id = ?
      `
      
      await db.run(updateQuery, [status, 1, notes || '', id])
      
      const updatedExchange = await db.get(
        `SELECT e.*, s.name as student_name, i.name as item_name, i.image_url as item_image_url
         FROM shop_exchanges e
         JOIN students s ON e.student_id = s.id
         JOIN shop_items i ON e.item_id = i.id
         WHERE e.id = ?`,
        [id]
      )
      
      return { success: true, data: updatedExchange }
    } catch (error) {
      console.error('审批兑换失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '审批兑换失败' }
    }
  }
  ipcMain.handle('shop:approveExchange', handleApproveExchange)

  // 获取商城统计数据
  const handleGetShopStats = async () => {
    try {
      // 基础统计
      const totalItems = await db.get('SELECT COUNT(*) as count FROM shop_items')
      const activeItems = await db.get('SELECT COUNT(*) as count FROM shop_items WHERE is_active = 1')
      const totalExchanges = await db.get('SELECT COUNT(*) as count FROM shop_exchanges')
      const pendingExchanges = await db.get('SELECT COUNT(*) as count FROM shop_exchanges WHERE status = "pending"')
      const totalPointsSpent = await db.get('SELECT COALESCE(SUM(points_cost), 0) as total FROM shop_exchanges WHERE status != "rejected"')

      // 热门商品
      const popularItems = await db.all(`
        SELECT i.id as item_id, i.name as item_name, COUNT(e.id) as exchange_count
        FROM shop_items i
        LEFT JOIN shop_exchanges e ON i.id = e.item_id AND e.status != 'rejected'
        GROUP BY i.id, i.name
        ORDER BY exchange_count DESC
        LIMIT 10
      `)

      // 分类统计
      const categoryStats = await db.all(`
        SELECT 
          i.category,
          COUNT(DISTINCT i.id) as item_count,
          COUNT(e.id) as exchange_count
        FROM shop_items i
        LEFT JOIN shop_exchanges e ON i.id = e.item_id AND e.status != 'rejected'
        GROUP BY i.category
        ORDER BY exchange_count DESC
      `)

      const stats: ShopStats = {
        total_items: totalItems?.count || 0,
        active_items: activeItems?.count || 0,
        total_exchanges: totalExchanges?.count || 0,
        pending_exchanges: pendingExchanges?.count || 0,
        total_points_spent: totalPointsSpent?.total || 0,
        popular_items: popularItems || [],
        category_stats: categoryStats || []
      }
      
      return { success: true, data: stats }
    } catch (error) {
      console.error('获取商城统计失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '获取商城统计失败' }
    }
  }
  ipcMain.handle('shop:getStats', handleGetShopStats)

  // 获取学生商城信息
  const handleGetStudentShopInfo = async (_: IpcMainInvokeEvent, student_id: number, class_id: number) => {
    try {
      // 获取学生基本信息
      const student = await db.get('SELECT id, name FROM students WHERE id = ?', [student_id])
      if (!student) {
        return { success: false, error: '学生不存在' }
      }

      // 获取积分信息
      const pointsResult = await db.get(
        'SELECT COALESCE(SUM(points), 0) as total_points FROM points WHERE student_id = ? AND class_id = ?',
        [student_id, class_id]
      )

      // 获取兑换统计
      const exchangeStats = await db.get(
        'SELECT COUNT(*) as total_exchanges, COUNT(CASE WHEN status = "pending" THEN 1 END) as pending_exchanges FROM shop_exchanges WHERE student_id = ?',
        [student_id]
      )

      // 获取最近兑换记录
      const recentExchanges = await db.all(
        `SELECT e.*, i.name as item_name, i.image_url as item_image_url
         FROM shop_exchanges e
         JOIN shop_items i ON e.item_id = i.id
         WHERE e.student_id = ?
         ORDER BY e.created_at DESC
         LIMIT 5`,
        [student_id]
      )

      const info: StudentShopInfo = {
        student_id: student.id,
        student_name: student.name,
        total_points: pointsResult?.total_points || 0,
        available_points: pointsResult?.total_points || 0,
        total_exchanges: exchangeStats?.total_exchanges || 0,
        pending_exchanges: exchangeStats?.pending_exchanges || 0,
        recent_exchanges: recentExchanges || []
      }
      
      return { success: true, data: info }
    } catch (error) {
      console.error('获取学生商城信息失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '获取学生商城信息失败' }
    }
  }
  ipcMain.handle('shop:getStudentInfo', handleGetStudentShopInfo)
}