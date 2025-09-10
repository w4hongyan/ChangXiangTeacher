import { ipcMain, IpcMainInvokeEvent, dialog } from 'electron'
import * as XLSX from 'xlsx'
import type { DatabaseManager } from '../database'

export interface CalendarEvent {
  id?: number
  title: string
  description?: string
  event_date: string
  start_time?: string
  end_time?: string
  event_type: 'exam' | 'holiday' | 'activity' | 'meeting' | 'deadline' | 'other'
  color?: string
  class_id?: number
  is_reminder?: boolean
  reminder_minutes?: number
  semester: string
  year: number
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface CalendarQueryParams {
  start_date?: string
  end_date?: string
  event_type?: string
  class_id?: number
  semester?: string
  year?: number
  is_active?: boolean
}

export function setupCalendarHandlers(db: DatabaseManager) {
  // 获取日历事件列表
  const handleGetCalendarEvents = async (_: IpcMainInvokeEvent, params: CalendarQueryParams = {}) => {
    try {
      const {
        start_date,
        end_date,
        event_type,
        class_id,
        semester,
        year = new Date().getFullYear(),
        is_active = true
      } = params

      let whereClause = 'WHERE ce.is_active = ?'
      let paramsArray: any[] = [is_active ? 1 : 0]

      if (start_date) {
        whereClause += ' AND ce.event_date >= ?'
        paramsArray.push(start_date)
      }

      if (end_date) {
        whereClause += ' AND ce.event_date <= ?'
        paramsArray.push(end_date)
      }

      if (event_type) {
        whereClause += ' AND ce.event_type = ?'
        paramsArray.push(event_type)
      }

      if (class_id) {
        whereClause += ' AND ce.class_id = ?'
        paramsArray.push(class_id)
      }

      if (semester) {
        whereClause += ' AND ce.semester = ?'
        paramsArray.push(semester)
      }

      if (year) {
        whereClause += ' AND ce.year = ?'
        paramsArray.push(year)
      }

      const query = `
        SELECT 
          ce.*,
          c.name as class_name,
          c.grade,
          c.class_number
        FROM calendar_events ce
        LEFT JOIN classes c ON ce.class_id = c.id
        ${whereClause}
        ORDER BY ce.event_date, ce.start_time
      `

      const events = await db.all(query, paramsArray)
      return { success: true, data: events }
    } catch (error) {
      console.error('获取日历事件失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '获取日历事件失败' }
    }
  }

  // 获取单个事件详情
  const handleGetCalendarEventById = async (_: IpcMainInvokeEvent, id: number) => {
    try {
      const query = `
        SELECT 
          ce.*,
          c.name as class_name,
          c.grade,
          c.class_number
        FROM calendar_events ce
        LEFT JOIN classes c ON ce.class_id = c.id
        WHERE ce.id = ? AND ce.is_active = 1
      `
      
      const event = await db.get(query, [id])
      if (!event) {
        return { success: false, error: '事件不存在' }
      }
      
      return { success: true, data: event }
    } catch (error) {
      console.error('获取事件详情失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '获取事件详情失败' }
    }
  }

  // 创建日历事件
  const handleCreateCalendarEvent = async (_: IpcMainInvokeEvent, eventData: CalendarEvent) => {
    try {
      const result = await db.run(`
        INSERT INTO calendar_events (
          title, description, event_date, start_time, end_time,
          event_type, color, class_id, is_reminder, reminder_minutes,
          semester, year, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        eventData.title,
        eventData.description || null,
        eventData.event_date,
        eventData.start_time || null,
        eventData.end_time || null,
        eventData.event_type,
        eventData.color || '#409EFF',
        eventData.class_id || null,
        eventData.is_reminder || false,
        eventData.reminder_minutes || 30,
        eventData.semester,
        eventData.year,
        true
      ])

      return { success: true, data: { id: result.lastID } }
    } catch (error) {
      console.error('创建日历事件失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '创建日历事件失败' }
    }
  }

  // 更新日历事件
  const handleUpdateCalendarEvent = async (_: IpcMainInvokeEvent, id: number, eventData: CalendarEvent) => {
    try {
      await db.run(`
        UPDATE calendar_events SET 
          title = ?, description = ?, event_date = ?, start_time = ?,
          end_time = ?, event_type = ?, color = ?, class_id = ?,
          is_reminder = ?, reminder_minutes = ?, semester = ?, year = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        eventData.title,
        eventData.description || null,
        eventData.event_date,
        eventData.start_time || null,
        eventData.end_time || null,
        eventData.event_type,
        eventData.color || '#409EFF',
        eventData.class_id || null,
        eventData.is_reminder || false,
        eventData.reminder_minutes || 30,
        eventData.semester,
        eventData.year,
        id
      ])

      return { success: true }
    } catch (error) {
      console.error('更新日历事件失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '更新日历事件失败' }
    }
  }

  // 删除日历事件
  const handleDeleteCalendarEvent = async (_: IpcMainInvokeEvent, id: number) => {
    try {
      await db.run(`
        UPDATE calendar_events SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `, [id])
      
      return { success: true }
    } catch (error) {
      console.error('删除日历事件失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '删除日历事件失败' }
    }
  }

  // 获取学期倒计时信息
  const handleGetSemesterCountdown = async (_: IpcMainInvokeEvent, semester: string, year: number) => {
    try {
      // 获取学期重要事件
      const query = `
        SELECT * FROM calendar_events 
        WHERE semester = ? AND year = ? AND is_active = 1
        AND event_type IN ('exam', 'deadline')
        AND event_date >= date('now')
        ORDER BY event_date ASC
        LIMIT 5
      `
      
      const upcomingEvents = await db.all(query, [semester, year])
      
      // 计算倒计时
      const countdowns = upcomingEvents.map((event: any) => {
        const eventDate = new Date(event.event_date)
        const now = new Date()
        const diffTime = eventDate.getTime() - now.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        return {
          ...event,
          days_remaining: diffDays
        }
      })
      
      return { success: true, data: countdowns }
    } catch (error) {
      console.error('获取学期倒计时失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '获取学期倒计时失败' }
    }
  }

  // 获取今日事件
  const handleGetTodayEvents = async (_: IpcMainInvokeEvent) => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const query = `
        SELECT 
          ce.*,
          c.name as class_name,
          c.grade,
          c.class_number
        FROM calendar_events ce
        LEFT JOIN classes c ON ce.class_id = c.id
        WHERE ce.event_date = ? AND ce.is_active = 1
        ORDER BY ce.start_time
      `
      
      const events = await db.all(query, [today])
      return { success: true, data: events }
    } catch (error) {
      console.error('获取今日事件失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '获取今日事件失败' }
    }
  }

  // 获取需要提醒的事件
  const handleGetReminderEvents = async (_: IpcMainInvokeEvent) => {
    try {
      const now = new Date()
      const query = `
        SELECT 
          ce.*,
          c.name as class_name,
          c.grade,
          c.class_number
        FROM calendar_events ce
        LEFT JOIN classes c ON ce.class_id = c.id
        WHERE ce.is_reminder = 1 AND ce.is_active = 1
        AND datetime(ce.event_date || ' ' || COALESCE(ce.start_time, '00:00:00')) 
        BETWEEN datetime('now') AND datetime('now', '+' || ce.reminder_minutes || ' minutes')
      `
      
      const events = await db.all(query)
      return { success: true, data: events }
    } catch (error) {
      console.error('获取提醒事件失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '获取提醒事件失败' }
    }
  }

  // 批量创建事件（用于导入）
  const handleBatchCreateEvents = async (_: IpcMainInvokeEvent, events: CalendarEvent[]) => {
    try {
      let successCount = 0
      let errorCount = 0
      const errors: string[] = []

      for (const eventData of events) {
        try {
          await db.run(`
            INSERT INTO calendar_events (
              title, description, event_date, start_time, end_time,
              event_type, color, class_id, is_reminder, reminder_minutes,
              semester, year, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            eventData.title,
            eventData.description || null,
            eventData.event_date,
            eventData.start_time || null,
            eventData.end_time || null,
            eventData.event_type,
            eventData.color || '#409EFF',
            eventData.class_id || null,
            eventData.is_reminder || false,
            eventData.reminder_minutes || 30,
            eventData.semester,
            eventData.year,
            true
          ])
          successCount++
        } catch (error) {
          errorCount++
          errors.push(`事件"${eventData.title}": ${error instanceof Error ? error.message : '未知错误'}`)
        }
      }

      return {
        success: true,
        message: `批量创建完成，成功${successCount}条，失败${errorCount}条`,
        details: { successCount, errorCount, errors }
      }
    } catch (error) {
      console.error('批量创建事件失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '批量创建事件失败' }
    }
  }

  // 导出日历事件
  const handleExportCalendarEvents = async (_: IpcMainInvokeEvent, params: CalendarQueryParams) => {
    try {
      const result = await handleGetCalendarEvents(_, params)
      if (!result.success) {
        return result
      }

      const events = result.data
      
      // 选择保存路径
      const saveResult = await dialog.showSaveDialog({
        title: '导出日历事件',
        defaultPath: `日历事件_${new Date().toISOString().split('T')[0]}.xlsx`,
        filters: [
          { name: 'Excel文件', extensions: ['xlsx'] }
        ]
      })

      if (saveResult.canceled || !saveResult.filePath) {
        return { success: false, error: '用户取消导出' }
      }

      // 创建工作表数据
      const wsData = [
        ['标题', '描述', '日期', '开始时间', '结束时间', '事件类型', '颜色', '关联班级', '是否提醒', '提醒时间(分钟)', '学期', '学年']
      ]

      const eventTypeNames = {
        exam: '考试',
        holiday: '假期',
        activity: '活动',
        meeting: '会议',
        deadline: '截止日期',
        other: '其他'
      }
      
      events.forEach((event: any) => {
        wsData.push([
          event.title,
          event.description || '',
          event.event_date,
          event.start_time || '',
          event.end_time || '',
          eventTypeNames[event.event_type as keyof typeof eventTypeNames] || event.event_type,
          event.color,
          event.class_name ? `${event.grade}${event.class_number}班` : '',
          event.is_reminder ? '是' : '否',
          event.reminder_minutes,
          event.semester,
          event.year
        ])
      })

      // 创建工作簿
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      
      // 设置列宽
      ws['!cols'] = [
        { width: 20 }, // 标题
        { width: 30 }, // 描述
        { width: 12 }, // 日期
        { width: 10 }, // 开始时间
        { width: 10 }, // 结束时间
        { width: 12 }, // 事件类型
        { width: 10 }, // 颜色
        { width: 15 }, // 关联班级
        { width: 10 }, // 是否提醒
        { width: 12 }, // 提醒时间
        { width: 10 }, // 学期
        { width: 10 }  // 学年
      ]

      XLSX.utils.book_append_sheet(wb, ws, '日历事件')
      XLSX.writeFile(wb, saveResult.filePath)

      return { success: true, message: '日历事件导出成功' }
    } catch (error) {
      console.error('导出日历事件失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '导出日历事件失败' }
    }
  }

  // 注册IPC处理器
  ipcMain.handle('calendar:list', handleGetCalendarEvents)
  ipcMain.handle('calendar:getById', handleGetCalendarEventById)
  ipcMain.handle('calendar:create', handleCreateCalendarEvent)
  ipcMain.handle('calendar:update', handleUpdateCalendarEvent)
  ipcMain.handle('calendar:delete', handleDeleteCalendarEvent)
  ipcMain.handle('calendar:countdown', handleGetSemesterCountdown)
  ipcMain.handle('calendar:today', handleGetTodayEvents)
  ipcMain.handle('calendar:reminders', handleGetReminderEvents)
  ipcMain.handle('calendar:batchCreate', handleBatchCreateEvents)
  ipcMain.handle('calendar:export', handleExportCalendarEvents)
}