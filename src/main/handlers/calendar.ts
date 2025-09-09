import { ipcMain, IpcMainInvokeEvent } from 'electron'
import type { DatabaseManager } from '../database'
import type { Semester, CalendarEvent, SemesterFormData, CalendarEventFormData } from '../../renderer/types/calendar'

// 确保日期字段是字符串格式的辅助函数
function ensureStringDates(obj: any): any {
  if (!obj) return obj;
  
  const result = { ...obj };
  for (const key in result) {
    if (result[key] instanceof Date) {
      result[key] = result[key].toISOString();
    }
  }
  return result;
}

export function setupCalendarHandlers(db: DatabaseManager) {
  // 获取所有学期
  const handleListSemesters = async (_: IpcMainInvokeEvent) => {
    try {
      const query = 'SELECT * FROM semesters ORDER BY start_date DESC'
      const semesters = await db.all(query)
      
      // 确保日期字段是字符串格式
      const formattedSemesters = semesters.map(semester => ensureStringDates(semester));
      
      return { success: true, data: formattedSemesters }
    } catch (error) {
      console.error('获取学期列表失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '获取学期列表失败' }
    }
  }
  ipcMain.handle('calendar:listSemesters', handleListSemesters)

  // 获取当前学期
  const handleGetCurrentSemester = async (_: IpcMainInvokeEvent) => {
    try {
      const query = 'SELECT * FROM semesters WHERE is_current = 1'
      const semester = await db.get(query)
      
      // 确保日期字段是字符串格式
      const formattedSemester = ensureStringDates(semester);
      
      return { success: true, data: formattedSemester }
    } catch (error) {
      console.error('获取当前学期失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '获取当前学期失败' }
    }
  }
  ipcMain.handle('calendar:getCurrentSemester', handleGetCurrentSemester)

  // 创建学期
  const handleCreateSemester = async (_: IpcMainInvokeEvent, data: SemesterFormData) => {
    try {
      // 如果设置为当前学期，需要先将其他学期设置为非当前学期
      if (data.is_current) {
        await db.run('UPDATE semesters SET is_current = 0')
      }
      
      const insertQuery = `
        INSERT INTO semesters (name, start_date, end_date, year, is_current)
        VALUES (?, ?, ?, ?, ?)
      `
      
      const params = [
        data.name,
        data.start_date,
        data.end_date,
        data.year,
        data.is_current ? 1 : 0
      ]

      const result = await db.run(insertQuery, params)
      const semesterId = result.lastID || result.lastInsertRowid

      if (!semesterId) {
        throw new Error('无法获取新创建的学期ID')
      }

      // 返回创建的学期
      const newSemester = await db.get('SELECT * FROM semesters WHERE id = ?', [Number(semesterId)])
      
      // 确保日期字段是字符串格式
      const formattedSemester = ensureStringDates(newSemester);
      
      return { success: true, data: formattedSemester }
    } catch (error) {
      console.error('创建学期失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '创建学期失败' }
    }
  }
  ipcMain.handle('calendar:createSemester', handleCreateSemester)

  // 更新学期
  const handleUpdateSemester = async (_: IpcMainInvokeEvent, id: number, data: SemesterFormData) => {
    try {
      // 如果设置为当前学期，需要先将其他学期设置为非当前学期
      if (data.is_current) {
        await db.run('UPDATE semesters SET is_current = 0')
      }
      
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

      const query = `UPDATE semesters SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
      values.push(id)

      await db.run(query, values)

      // 返回更新后的学期
      const updatedSemester = await db.get('SELECT * FROM semesters WHERE id = ?', [id])
      
      // 确保日期字段是字符串格式
      const formattedSemester = ensureStringDates(updatedSemester);
      
      return { success: true, data: formattedSemester }
    } catch (error) {
      console.error('更新学期失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '更新学期失败' }
    }
  }
  ipcMain.handle('calendar:updateSemester', handleUpdateSemester)

  // 删除学期
  const handleDeleteSemester = async (_: IpcMainInvokeEvent, id: number) => {
    try {
      // 检查是否有关联的事件
      const eventCount = await db.get('SELECT COUNT(*) as count FROM calendar_events WHERE semester_id = ?', [id])
      if (eventCount && eventCount.count > 0) {
        return { success: false, error: '该学期有关联的事件，无法删除' }
      }
      
      await db.run('DELETE FROM semesters WHERE id = ?', [id])
      return { success: true }
    } catch (error) {
      console.error('删除学期失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '删除学期失败' }
    }
  }
  ipcMain.handle('calendar:deleteSemester', handleDeleteSemester)

  // 设置当前学期
  const handleSetCurrentSemester = async (_: IpcMainInvokeEvent, id: number) => {
    try {
      // 先将所有学期设置为非当前学期
      await db.run('UPDATE semesters SET is_current = 0')
      
      // 设置指定学期为当前学期
      await db.run('UPDATE semesters SET is_current = 1 WHERE id = ?', [id])
      
      return { success: true }
    } catch (error) {
      console.error('设置当前学期失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '设置当前学期失败' }
    }
  }
  ipcMain.handle('calendar:setCurrentSemester', handleSetCurrentSemester)

  // 获取指定日期范围的事件
  const handleListEventsByDateRange = async (_: IpcMainInvokeEvent, startDate: string, endDate: string) => {
    try {
      const query = `
        SELECT * FROM calendar_events 
        WHERE event_date BETWEEN ? AND ?
        ORDER BY event_date
      `
      
      const events = await db.all(query, [startDate, endDate])
      
      // 确保日期字段是字符串格式
      const formattedEvents = events.map(event => ensureStringDates(event));
      
      return { success: true, data: formattedEvents }
    } catch (error) {
      console.error('获取日历事件失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '获取日历事件失败' }
    }
  }
  ipcMain.handle('calendar:listEventsByDateRange', handleListEventsByDateRange)

  // 获取指定日期的事件
  const handleListEventsByDate = async (_: IpcMainInvokeEvent, date: string) => {
    try {
      const query = 'SELECT * FROM calendar_events WHERE event_date = ? ORDER BY event_date'
      const events = await db.all(query, [date])
      
      // 确保日期字段是字符串格式
      const formattedEvents = events.map(event => ensureStringDates(event));
      
      return { success: true, data: formattedEvents }
    } catch (error) {
      console.error('获取日历事件失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '获取日历事件失败' }
    }
  }
  ipcMain.handle('calendar:listEventsByDate', handleListEventsByDate)

  // 创建事件
  const handleCreateEvent = async (_: IpcMainInvokeEvent, data: CalendarEventFormData) => {
    try {
      const insertQuery = `
        INSERT INTO calendar_events (
          title, description, event_date, event_type, color, is_holiday, semester_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `
      
      const params = [
        data.title,
        data.description,
        data.event_date,
        data.event_type,
        data.color,
        data.is_holiday ? 1 : 0,
        data.semester_id
      ]

      const result = await db.run(insertQuery, params)
      const eventId = result.lastID || result.lastInsertRowid

      if (!eventId) {
        throw new Error('无法获取新创建的事件ID')
      }

      // 返回创建的事件
      const newEvent = await db.get('SELECT * FROM calendar_events WHERE id = ?', [Number(eventId)])
      
      // 确保日期字段是字符串格式
      const formattedEvent = ensureStringDates(newEvent);
      
      return { success: true, data: formattedEvent }
    } catch (error) {
      console.error('创建事件失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '创建事件失败' }
    }
  }
  ipcMain.handle('calendar:createEvent', handleCreateEvent)

  // 更新事件
  const handleUpdateEvent = async (_: IpcMainInvokeEvent, id: number, data: CalendarEventFormData) => {
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

      const query = `UPDATE calendar_events SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
      values.push(id)

      await db.run(query, values)

      // 返回更新后的事件
      const updatedEvent = await db.get('SELECT * FROM calendar_events WHERE id = ?', [id])
      
      // 确保日期字段是字符串格式
      const formattedEvent = ensureStringDates(updatedEvent);
      
      return { success: true, data: formattedEvent }
    } catch (error) {
      console.error('更新事件失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '更新事件失败' }
    }
  }
  ipcMain.handle('calendar:updateEvent', handleUpdateEvent)

  // 删除事件
  const handleDeleteEvent = async (_: IpcMainInvokeEvent, id: number) => {
    try {
      await db.run('DELETE FROM calendar_events WHERE id = ?', [id])
      return { success: true }
    } catch (error) {
      console.error('删除事件失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '删除事件失败' }
    }
  }
  ipcMain.handle('calendar:deleteEvent', handleDeleteEvent)
}