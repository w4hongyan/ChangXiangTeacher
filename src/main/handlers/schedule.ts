import { ipcMain, IpcMainInvokeEvent } from 'electron'
import type { DatabaseManager } from '../database'
import type { Schedule, ScheduleFormData } from '../../renderer/types/schedule'

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

export function setupScheduleHandlers(db: DatabaseManager) {
  // 获取所有课程表
  const handleListSchedules = async (_: IpcMainInvokeEvent) => {
    try {
      const query = `
        SELECT s.*, c.name as class_name, c.grade
        FROM schedules s
        LEFT JOIN classes c ON s.class_id = c.id
        ORDER BY s.day_of_week, s.start_time
      `
      
      const schedules = await db.all(query)
      
      // 确保日期字段是字符串格式
      const formattedSchedules = schedules.map(schedule => ensureStringDates(schedule));
      
      return { success: true, data: formattedSchedules }
    } catch (error) {
      console.error('获取课程表失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '获取课程表失败' }
    }
  }
  ipcMain.handle('schedules:list', handleListSchedules)

  // 根据班级ID获取课程表
  const handleListSchedulesByClassId = async (_: IpcMainInvokeEvent, class_id: number) => {
    try {
      const query = `
        SELECT s.*, c.name as class_name, c.grade
        FROM schedules s
        LEFT JOIN classes c ON s.class_id = c.id
        WHERE s.class_id = ?
        ORDER BY s.day_of_week, s.start_time
      `
      
      const schedules = await db.all(query, [class_id])
      
      // 确保日期字段是字符串格式
      const formattedSchedules = schedules.map(schedule => ensureStringDates(schedule));
      
      return { success: true, data: formattedSchedules }
    } catch (error) {
      console.error('获取班级课程表失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '获取班级课程表失败' }
    }
  }
  ipcMain.handle('schedules:listByClassId', handleListSchedulesByClassId)

  // 根据教师ID获取课程表
  const handleListSchedulesByTeacherId = async (_: IpcMainInvokeEvent, teacher_id: number) => {
    try {
      const query = `
        SELECT s.*, c.name as class_name, c.grade
        FROM schedules s
        LEFT JOIN classes c ON s.class_id = c.id
        WHERE s.teacher_id = ?
        ORDER BY s.day_of_week, s.start_time
      `
      
      const schedules = await db.all(query, [teacher_id])
      
      // 确保日期字段是字符串格式
      const formattedSchedules = schedules.map(schedule => ensureStringDates(schedule));
      
      return { success: true, data: formattedSchedules }
    } catch (error) {
      console.error('获取教师课程表失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '获取教师课程表失败' }
    }
  }
  ipcMain.handle('schedules:listByTeacherId', handleListSchedulesByTeacherId)

  // 创建课程表
  const handleCreateSchedule = async (_: IpcMainInvokeEvent, data: ScheduleFormData) => {
    try {
      const insertQuery = `
        INSERT INTO schedules (
          class_id, teacher_id, teacher_name, subject, day_of_week, 
          start_time, end_time, classroom, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      
      const params = [
        data.class_id,
        data.teacher_id,
        data.teacher_name,
        data.subject,
        data.day_of_week,
        data.start_time,
        data.end_time,
        data.classroom,
        data.notes
      ]

      const result = await db.run(insertQuery, params)
      const scheduleId = result.lastID || result.lastInsertRowid

      if (!scheduleId) {
        throw new Error('无法获取新创建的课程表ID')
      }

      // 返回创建的课程表
      const newSchedule = await db.get('SELECT * FROM schedules WHERE id = ?', [Number(scheduleId)])
      
      // 确保日期字段是字符串格式
      const formattedSchedule = ensureStringDates(newSchedule);
      
      return { success: true, data: formattedSchedule }
    } catch (error) {
      console.error('创建课程表失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '创建课程表失败' }
    }
  }
  ipcMain.handle('schedules:create', handleCreateSchedule)

  // 更新课程表
  const handleUpdateSchedule = async (_: IpcMainInvokeEvent, id: number, data: ScheduleFormData) => {
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

      const query = `UPDATE schedules SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
      values.push(id)

      await db.run(query, values)

      // 返回更新后的课程表
      const updatedSchedule = await db.get('SELECT * FROM schedules WHERE id = ?', [id])
      
      // 确保日期字段是字符串格式
      const formattedSchedule = ensureStringDates(updatedSchedule);
      
      return { success: true, data: formattedSchedule }
    } catch (error) {
      console.error('更新课程表失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '更新课程表失败' }
    }
  }
  ipcMain.handle('schedules:update', handleUpdateSchedule)

  // 删除课程表
  const handleDeleteSchedule = async (_: IpcMainInvokeEvent, id: number) => {
    try {
      await db.run('DELETE FROM schedules WHERE id = ?', [id])
      return { success: true }
    } catch (error) {
      console.error('删除课程表失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '删除课程表失败' }
    }
  }
  ipcMain.handle('schedules:delete', handleDeleteSchedule)

  // 获取班级课表（包含班级信息）
  const handleListClassSchedules = async (_: IpcMainInvokeEvent, class_id: number) => {
    try {
      const query = `
        SELECT s.*, c.name as class_name, c.grade
        FROM schedules s
        LEFT JOIN classes c ON s.class_id = c.id
        WHERE s.class_id = ?
        ORDER BY s.day_of_week, s.start_time
      `
      
      const schedules = await db.all(query, [class_id])
      
      // 确保日期字段是字符串格式
      const formattedSchedules = schedules.map(schedule => ensureStringDates(schedule));
      
      return { success: true, data: formattedSchedules }
    } catch (error) {
      console.error('获取班级课表失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '获取班级课表失败' }
    }
  }
  ipcMain.handle('schedules:listClassSchedules', handleListClassSchedules)

  // 获取教师课表（包含班级信息）
  const handleListTeacherSchedules = async (_: IpcMainInvokeEvent, teacher_id: number) => {
    try {
      const query = `
        SELECT s.*, c.name as class_name, c.grade
        FROM schedules s
        LEFT JOIN classes c ON s.class_id = c.id
        WHERE s.teacher_id = ? OR s.teacher_name IS NOT NULL
        ORDER BY s.day_of_week, s.start_time
      `
      
      const schedules = await db.all(query, [teacher_id])
      
      // 确保日期字段是字符串格式
      const formattedSchedules = schedules.map(schedule => ensureStringDates(schedule));
      
      return { success: true, data: formattedSchedules }
    } catch (error) {
      console.error('获取教师课表失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '获取教师课表失败' }
    }
  }
  ipcMain.handle('schedules:listTeacherSchedules', handleListTeacherSchedules)
}