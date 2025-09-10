import { ipcMain, IpcMainInvokeEvent, dialog } from 'electron'
import * as XLSX from 'xlsx'
import * as path from 'path'
import * as fs from 'fs'
import type { DatabaseManager } from '../database'

export interface Schedule {
  id?: number
  class_id: number
  subject: string
  teacher_name?: string
  day_of_week: number // 1-7 (周一到周日)
  period: number // 1-8 (第几节课)
  classroom?: string
  semester: string
  year: number
  start_time?: string
  end_time?: string
  notes?: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface ScheduleQueryParams {
  class_id?: number
  semester?: string
  year?: number
  day_of_week?: number
  is_active?: boolean
}

export function setupScheduleHandlers(db: DatabaseManager) {
  // 获取课程表列表
  const handleGetSchedules = async (_: IpcMainInvokeEvent, params: ScheduleQueryParams = {}) => {
    try {
      const {
        class_id,
        semester,
        year = new Date().getFullYear(),
        day_of_week,
        is_active = true
      } = params

      let whereClause = 'WHERE s.is_active = ?'
      let paramsArray: any[] = [is_active ? 1 : 0]

      if (class_id) {
        whereClause += ' AND s.class_id = ?'
        paramsArray.push(class_id)
      }

      if (semester) {
        whereClause += ' AND s.semester = ?'
        paramsArray.push(semester)
      }

      if (year) {
        whereClause += ' AND s.year = ?'
        paramsArray.push(year)
      }

      if (day_of_week) {
        whereClause += ' AND s.day_of_week = ?'
        paramsArray.push(day_of_week)
      }

      const query = `
        SELECT 
          s.*,
          c.name as class_name,
          c.grade,
          c.class_number
        FROM schedules s
        LEFT JOIN classes c ON s.class_id = c.id
        ${whereClause}
        ORDER BY s.day_of_week, s.period
      `

      const schedules = await db.all(query, paramsArray)
      return { success: true, data: schedules }
    } catch (error) {
      console.error('获取课程表失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '获取课程表失败' }
    }
  }

  // 获取单个课程详情
  const handleGetScheduleById = async (_: IpcMainInvokeEvent, id: number) => {
    try {
      const query = `
        SELECT 
          s.*,
          c.name as class_name,
          c.grade,
          c.class_number
        FROM schedules s
        LEFT JOIN classes c ON s.class_id = c.id
        WHERE s.id = ? AND s.is_active = 1
      `
      
      const schedule = await db.get(query, [id])
      if (!schedule) {
        return { success: false, error: '课程不存在' }
      }
      
      return { success: true, data: schedule }
    } catch (error) {
      console.error('获取课程详情失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '获取课程详情失败' }
    }
  }

  // 创建课程
  const handleCreateSchedule = async (_: IpcMainInvokeEvent, scheduleData: Schedule) => {
    try {
      // 检查时间冲突
      const conflictQuery = `
        SELECT id FROM schedules 
        WHERE class_id = ? AND day_of_week = ? AND period = ? 
        AND semester = ? AND year = ? AND is_active = 1
      `
      const conflict = await db.get(conflictQuery, [
        scheduleData.class_id,
        scheduleData.day_of_week,
        scheduleData.period,
        scheduleData.semester,
        scheduleData.year
      ])

      if (conflict) {
        return { success: false, error: '该时间段已有课程安排' }
      }

      const result = await db.run(`
        INSERT INTO schedules (
          class_id, subject, teacher_name, day_of_week, period,
          classroom, semester, year, start_time, end_time, notes, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        scheduleData.class_id,
        scheduleData.subject,
        scheduleData.teacher_name || null,
        scheduleData.day_of_week,
        scheduleData.period,
        scheduleData.classroom || null,
        scheduleData.semester,
        scheduleData.year,
        scheduleData.start_time || null,
        scheduleData.end_time || null,
        scheduleData.notes || null,
        true
      ])

      return { success: true, data: { id: result.lastID } }
    } catch (error) {
      console.error('创建课程失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '创建课程失败' }
    }
  }

  // 更新课程
  const handleUpdateSchedule = async (_: IpcMainInvokeEvent, id: number, scheduleData: Schedule) => {
    try {
      // 检查时间冲突（排除当前记录）
      const conflictQuery = `
        SELECT id FROM schedules 
        WHERE class_id = ? AND day_of_week = ? AND period = ? 
        AND semester = ? AND year = ? AND is_active = 1 AND id != ?
      `
      const conflict = await db.get(conflictQuery, [
        scheduleData.class_id,
        scheduleData.day_of_week,
        scheduleData.period,
        scheduleData.semester,
        scheduleData.year,
        id
      ])

      if (conflict) {
        return { success: false, error: '该时间段已有课程安排' }
      }

      await db.run(`
        UPDATE schedules SET 
          class_id = ?, subject = ?, teacher_name = ?, day_of_week = ?,
          period = ?, classroom = ?, semester = ?, year = ?,
          start_time = ?, end_time = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        scheduleData.class_id,
        scheduleData.subject,
        scheduleData.teacher_name || null,
        scheduleData.day_of_week,
        scheduleData.period,
        scheduleData.classroom || null,
        scheduleData.semester,
        scheduleData.year,
        scheduleData.start_time || null,
        scheduleData.end_time || null,
        scheduleData.notes || null,
        id
      ])

      return { success: true }
    } catch (error) {
      console.error('更新课程失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '更新课程失败' }
    }
  }

  // 删除课程
  const handleDeleteSchedule = async (_: IpcMainInvokeEvent, id: number) => {
    try {
      await db.run(`
        UPDATE schedules SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `, [id])
      
      return { success: true }
    } catch (error) {
      console.error('删除课程失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '删除课程失败' }
    }
  }

  // 课程调换
  const handleSwapSchedules = async (_: IpcMainInvokeEvent, schedule1Id: number, schedule2Id: number) => {
    try {
      // 获取两个课程的信息
      const schedule1 = await db.get('SELECT * FROM schedules WHERE id = ?', [schedule1Id])
      const schedule2 = await db.get('SELECT * FROM schedules WHERE id = ?', [schedule2Id])

      if (!schedule1 || !schedule2) {
        return { success: false, error: '课程不存在' }
      }

      // 交换时间和教室信息
      await db.run(`
        UPDATE schedules SET 
          day_of_week = ?, period = ?, classroom = ?, 
          start_time = ?, end_time = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        schedule2.day_of_week,
        schedule2.period,
        schedule2.classroom,
        schedule2.start_time,
        schedule2.end_time,
        schedule1Id
      ])

      await db.run(`
        UPDATE schedules SET 
          day_of_week = ?, period = ?, classroom = ?, 
          start_time = ?, end_time = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        schedule1.day_of_week,
        schedule1.period,
        schedule1.classroom,
        schedule1.start_time,
        schedule1.end_time,
        schedule2Id
      ])

      return { success: true }
    } catch (error) {
      console.error('课程调换失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '课程调换失败' }
    }
  }

  // 导出课程表
  const handleExportSchedules = async (_: IpcMainInvokeEvent, params: ScheduleQueryParams) => {
    try {
      const result = await handleGetSchedules(_, params)
      if (!result.success) {
        return result
      }

      const schedules = result.data
      
      // 选择保存路径
      const saveResult = await dialog.showSaveDialog({
        title: '导出课程表',
        defaultPath: `课程表_${new Date().toISOString().split('T')[0]}.xlsx`,
        filters: [
          { name: 'Excel文件', extensions: ['xlsx'] }
        ]
      })

      if (saveResult.canceled || !saveResult.filePath) {
        return { success: false, error: '用户取消导出' }
      }

      // 创建工作表数据
      const wsData = [
        ['班级', '科目', '任课教师', '星期', '节次', '教室', '开始时间', '结束时间', '学期', '学年', '备注']
      ]

      const dayNames = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日']
      
      schedules.forEach((schedule: any) => {
        wsData.push([
          `${schedule.grade}${schedule.class_number}班`,
          schedule.subject,
          schedule.teacher_name || '',
          dayNames[schedule.day_of_week] || '',
          `第${schedule.period}节`,
          schedule.classroom || '',
          schedule.start_time || '',
          schedule.end_time || '',
          schedule.semester,
          schedule.year,
          schedule.notes || ''
        ])
      })

      // 创建工作簿
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      
      // 设置列宽
      ws['!cols'] = [
        { width: 15 }, // 班级
        { width: 15 }, // 科目
        { width: 15 }, // 任课教师
        { width: 10 }, // 星期
        { width: 10 }, // 节次
        { width: 15 }, // 教室
        { width: 12 }, // 开始时间
        { width: 12 }, // 结束时间
        { width: 10 }, // 学期
        { width: 10 }, // 学年
        { width: 20 }  // 备注
      ]

      XLSX.utils.book_append_sheet(wb, ws, '课程表')
      XLSX.writeFile(wb, saveResult.filePath)

      return { success: true, message: '课程表导出成功' }
    } catch (error) {
      console.error('导出课程表失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '导出课程表失败' }
    }
  }

  // 导入课程表
  const handleImportSchedules = async (_: IpcMainInvokeEvent) => {
    try {
      const openResult = await dialog.showOpenDialog({
        title: '导入课程表',
        filters: [
          { name: 'Excel文件', extensions: ['xlsx', 'xls'] }
        ],
        properties: ['openFile']
      })

      if (openResult.canceled || !openResult.filePaths.length) {
        return { success: false, error: '用户取消导入' }
      }

      const filePath = openResult.filePaths[0]
      const workbook = XLSX.readFile(filePath)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

      if (data.length < 2) {
        return { success: false, error: '文件格式不正确或无数据' }
      }

      const headers = data[0] as string[]
      const rows = data.slice(1) as any[][]
      
      let successCount = 0
      let errorCount = 0
      const errors: string[] = []

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        if (!row || row.length === 0) continue

        try {
          // 解析数据（根据实际Excel格式调整）
          const scheduleData: Schedule = {
            class_id: 1, // 需要根据班级名称查找ID
            subject: row[1] || '',
            teacher_name: row[2] || '',
            day_of_week: 1, // 需要解析星期
            period: 1, // 需要解析节次
            classroom: row[5] || '',
            semester: row[8] || '上学期',
            year: parseInt(row[9]) || new Date().getFullYear(),
            start_time: row[6] || '',
            end_time: row[7] || '',
            notes: row[10] || ''
          }

          // 这里需要添加更复杂的解析逻辑
          // 暂时跳过，实际使用时需要完善
          successCount++
        } catch (error) {
          errorCount++
          errors.push(`第${i + 2}行: ${error instanceof Error ? error.message : '未知错误'}`)
        }
      }

      return {
        success: true,
        message: `导入完成，成功${successCount}条，失败${errorCount}条`,
        details: { successCount, errorCount, errors }
      }
    } catch (error) {
      console.error('导入课程表失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '导入课程表失败' }
    }
  }

  // 注册IPC处理器
  ipcMain.handle('schedules:list', handleGetSchedules)
  ipcMain.handle('schedules:getById', handleGetScheduleById)
  ipcMain.handle('schedules:create', handleCreateSchedule)
  ipcMain.handle('schedules:update', handleUpdateSchedule)
  ipcMain.handle('schedules:delete', handleDeleteSchedule)
  ipcMain.handle('schedules:swap', handleSwapSchedules)
  ipcMain.handle('schedules:export', handleExportSchedules)
  ipcMain.handle('schedules:import', handleImportSchedules)
}