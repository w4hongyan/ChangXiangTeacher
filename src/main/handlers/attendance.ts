import { ipcMain } from 'electron'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import { getDatabase } from '../database'

// 考勤记录接口
interface AttendanceRecord {
  student_id: number
  status: 'present' | 'absent' | 'leave' | 'late'
  notes?: string
}

interface SaveAttendanceParams {
  class_id: number
  date: string
  records: AttendanceRecord[]
}

interface AttendanceHistoryParams {
  class_id?: number
  student_id?: number
  start_date?: string
  end_date?: string
  status?: string
  limit?: number
  offset?: number
}

interface AttendanceStatParams {
  class_id?: number
  student_id?: number
  start_date?: string
  end_date?: string
}

// 初始化考勤相关数据表
export async function initAttendanceTables() {
  const db = getDatabase()
  // 考勤记录表
  const hasAttendanceRecords = await db.tableExists('attendance_records')
  if (!hasAttendanceRecords) {
    await db.createTable('attendance_records', `
      CREATE TABLE attendance_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'leave', 'late')),
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, date)
      )
    `)
  }

  // 考勤统计表（可选，用于缓存统计数据）
  const hasAttendanceStats = await db.tableExists('attendance_stats')
  if (!hasAttendanceStats) {
    await db.createTable('attendance_stats', `
      CREATE TABLE attendance_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        month TEXT NOT NULL, -- 格式: YYYY-MM
        present_count INTEGER DEFAULT 0,
        absent_count INTEGER DEFAULT 0,
        leave_count INTEGER DEFAULT 0,
        late_count INTEGER DEFAULT 0,
        total_days INTEGER DEFAULT 0,
        attendance_rate REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(class_id, student_id, month)
      )
    `)
  }

  // 创建索引
  await db.exec('CREATE INDEX IF NOT EXISTS idx_attendance_records_class_date ON attendance_records(class_id, date)')
  await db.exec('CREATE INDEX IF NOT EXISTS idx_attendance_records_student_date ON attendance_records(student_id, date)')
  await db.exec('CREATE INDEX IF NOT EXISTS idx_attendance_stats_class_month ON attendance_stats(class_id, month)')

  console.log('考勤数据表初始化完成')
}

// 保存考勤记录
async function saveAttendance(params: SaveAttendanceParams) {
  const db = getDatabase()
  try {
    const { class_id, date, records } = params

    // 开始事务
    await db.run('BEGIN TRANSACTION')
    try {
      // 先删除当天该班级的所有考勤记录
      await db.run(
        'DELETE FROM attendance_records WHERE class_id = ? AND date = ?',
        [class_id, date]
      )

      // 插入新的考勤记录
      if (records.length > 0) {
        for (const record of records) {
          await db.run(
            'INSERT INTO attendance_records (class_id, student_id, date, status, notes) VALUES (?, ?, ?, ?, ?)',
            [class_id, record.student_id, date, record.status, record.notes || null]
          )
        }
      }

      // 更新统计数据
      await updateAttendanceStats(class_id, date)
      
      await db.run('COMMIT')
    } catch (error) {
      await db.run('ROLLBACK')
      throw error
    }

    return {
      success: true,
      message: '考勤记录保存成功'
    }
  } catch (error) {
    console.error('保存考勤记录失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '保存考勤记录失败'
    }
  }
}

// 获取考勤历史记录
async function getAttendanceHistory(params: AttendanceHistoryParams) {
  const db = getDatabase()
  try {
    let sql = `
      SELECT 
        ar.id,
        ar.date,
        ar.status,
        ar.notes,
        ar.created_at,
        s.name as student_name,
        s.student_number,
        c.name as class_name,
        c.grade,
        c.class_number
      FROM attendance_records ar
      JOIN students s ON ar.student_id = s.id
      JOIN classes c ON ar.class_id = c.id
    `
    
    const conditions: string[] = []
    const queryParams: any[] = []

    if (params.class_id) {
      conditions.push('ar.class_id = ?')
      queryParams.push(params.class_id)
    }

    if (params.student_id) {
      conditions.push('ar.student_id = ?')
      queryParams.push(params.student_id)
    }

    if (params.start_date) {
      conditions.push('ar.date >= ?')
      queryParams.push(params.start_date)
    }

    if (params.end_date) {
      conditions.push('ar.date <= ?')
      queryParams.push(params.end_date)
    }

    if (params.status) {
      conditions.push('ar.status = ?')
      queryParams.push(params.status)
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ')
    }

    sql += ' ORDER BY ar.date DESC, s.name'

    if (params.limit) {
      sql += ' LIMIT ?'
      queryParams.push(params.limit)
      
      if (params.offset) {
        sql += ' OFFSET ?'
        queryParams.push(params.offset)
      }
    }

    const records = await db.all(sql, queryParams)

    return {
      success: true,
      data: records
    }
  } catch (error) {
    console.error('获取考勤历史记录失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取考勤历史记录失败'
    }
  }
}

// 获取考勤统计
async function getAttendanceStats(params: AttendanceStatParams) {
  const db = getDatabase()
  try {
    let query = db
      .select(
        'ar.status',
        db.raw('COUNT(*) as count'),
        's.name as student_name',
        's.student_number'
      )
      .from('attendance_records as ar')
      .join('students as s', 'ar.student_id', 's.id')

    if (params.class_id) {
      query = query.where('ar.class_id', params.class_id)
    }

    if (params.student_id) {
      query = query.where('ar.student_id', params.student_id)
    }

    if (params.start_date) {
      query = query.where('ar.date', '>=', params.start_date)
    }

    if (params.end_date) {
      query = query.where('ar.date', '<=', params.end_date)
    }

    if (params.student_id) {
      query = query.groupBy('ar.status')
    } else {
      query = query.groupBy('ar.student_id', 'ar.status', 's.name', 's.student_number')
    }

    query = query.orderBy('s.name').orderBy('ar.status')

    const stats = await query

    // 如果是单个学生的统计，转换为更友好的格式
    if (params.student_id) {
      const result = {
        present: 0,
        absent: 0,
        leave: 0,
        late: 0
      }

      stats.forEach((stat: any) => {
        result[stat.status as keyof typeof result] = stat.count
      })

      const total = result.present + result.absent + result.leave + result.late
      const attendanceRate = total > 0 ? (result.present / total) * 100 : 0

      return {
        success: true,
        data: {
          ...result,
          total,
          attendance_rate: Math.round(attendanceRate * 100) / 100
        }
      }
    }

    return {
      success: true,
      data: stats
    }
  } catch (error) {
    console.error('获取考勤统计失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取考勤统计失败'
    }
  }
}

// 获取今日考勤情况
async function getTodayAttendance(classId: number) {
  const db = getDatabase()
  try {
    const today = new Date().toISOString().split('T')[0]
    
    const records = await db
      .select(
        's.id',
        's.name',
        's.student_number',
        'ar.status',
        'ar.notes'
      )
      .from('students as s')
      .leftJoin('attendance_records as ar', function() {
        this.on('s.id', '=', 'ar.student_id')
            .andOn('ar.date', '=', db.raw('?', [today]))
      })
      .where('s.class_id', classId)
      .orderBy('s.name')

    return {
      success: true,
      data: records
    }
  } catch (error) {
    console.error('获取今日考勤情况失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取今日考勤情况失败'
    }
  }
}

// 更新考勤统计数据
async function updateAttendanceStats(classId: number, date: string) {
  const db = getDatabase()
  try {
    const month = date.substring(0, 7) // YYYY-MM
    
    // 获取该班级该月的所有学生
    const students = await db
      .select('s.id', 's.name')
      .from('students as s')
      .where('s.class_id', classId)
      .distinct()

    // 为每个学生更新统计数据
    for (const student of students) {
      const stats = await db
        .select(
          db.raw('COALESCE(SUM(CASE WHEN status = \'present\' THEN 1 ELSE 0 END), 0) as present_count'),
          db.raw('COALESCE(SUM(CASE WHEN status = \'absent\' THEN 1 ELSE 0 END), 0) as absent_count'),
          db.raw('COALESCE(SUM(CASE WHEN status = \'leave\' THEN 1 ELSE 0 END), 0) as leave_count'),
          db.raw('COALESCE(SUM(CASE WHEN status = \'late\' THEN 1 ELSE 0 END), 0) as late_count'),
          db.raw('COUNT(*) as total_days')
        )
        .from('attendance_records')
        .where('class_id', classId)
        .andWhere('student_id', student.id)
        .andWhere('date', 'like', `${month}%`)
        .first()

      if (stats) {
        const attendanceRate = stats.total_days > 0 
          ? Math.round((stats.present_count * 100.0) / stats.total_days * 100) / 100
          : 0

        await db('attendance_stats')
          .insert({
            class_id: classId,
            student_id: student.id,
            month,
            present_count: stats.present_count,
            absent_count: stats.absent_count,
            leave_count: stats.leave_count,
            late_count: stats.late_count,
            total_days: stats.total_days,
            attendance_rate: attendanceRate,
            updated_at: db.fn.now()
          })
          .onConflict(['class_id', 'student_id', 'month'])
          .merge()
      }
    }

    console.log(`更新了班级 ${classId} 在 ${month} 的考勤统计`)
  } catch (error) {
    console.error('更新考勤统计失败:', error)
  }
}

// 导出考勤数据
async function exportAttendance(params: AttendanceHistoryParams) {
  try {
    const records = await getAttendanceHistory(params)
    if (!records.success) {
      return records
    }

    // 这里可以添加导出到Excel或CSV的逻辑
    // 目前返回数据供前端处理
    return {
      success: true,
      data: records.data,
      message: '数据获取成功，请在前端处理导出'
    }
  } catch (error) {
    console.error('导出考勤数据失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '导出考勤数据失败'
    }
  }
}

// 注册IPC处理器
export function registerAttendanceHandlers() {
  // 保存考勤记录
  ipcMain.handle('attendance:save', async (event, params: SaveAttendanceParams) => {
    return saveAttendance(params)
  })

  // 获取考勤历史记录
  ipcMain.handle('attendance:history', async (event, params: AttendanceHistoryParams) => {
    return getAttendanceHistory(params)
  })

  // 获取考勤统计
  ipcMain.handle('attendance:stats', async (event, params: AttendanceStatParams) => {
    return getAttendanceStats(params)
  })

  // 获取今日考勤
  ipcMain.handle('attendance:today', async (event, classId: number) => {
    return getTodayAttendance(classId)
  })

  // 导出考勤数据
  ipcMain.handle('attendance:export', async (event, params: AttendanceHistoryParams) => {
    return exportAttendance(params)
  })

  console.log('考勤管理IPC处理器注册完成')
}