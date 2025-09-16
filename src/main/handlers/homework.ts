import { ipcMain } from 'electron'
import type { DatabaseManager } from '../database'

// 作业接口定义
export interface Homework {
  id?: number
  title: string
  description?: string
  subject: string
  class_id: number
  teacher_id?: number
  teacher_name?: string
  assign_date: string
  due_date: string
  status: 'draft' | 'published' | 'closed'
  priority: 'low' | 'medium' | 'high'
  attachments?: string // JSON格式存储附件信息
  instructions?: string
  max_score?: number
  created_at?: string
  updated_at?: string
}

// 作业提交接口
export interface HomeworkSubmission {
  id?: number
  homework_id: number
  student_id: number
  content?: string
  attachments?: string // JSON格式存储附件信息
  submit_date?: string
  score?: number
  feedback?: string
  status: 'not_submitted' | 'submitted' | 'graded' | 'late'
  graded_by?: number
  graded_at?: string
  created_at?: string
  updated_at?: string
}

// 查询参数接口
export interface HomeworkQueryParams {
  class_id?: number
  subject?: string
  status?: string
  teacher_id?: number
  page?: number
  page_size?: number
  search?: string
}

export interface SubmissionQueryParams {
  homework_id?: number
  student_id?: number
  status?: string
  page?: number
  page_size?: number
}

// 初始化作业相关表
export async function initHomeworkTables(dbManager: DatabaseManager) {
  try {
    // 创建作业表
    await dbManager.run(`
      CREATE TABLE IF NOT EXISTS homework (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        subject TEXT NOT NULL,
        class_id INTEGER NOT NULL,
        teacher_id INTEGER,
        teacher_name TEXT,
        assign_date DATE NOT NULL,
        due_date DATE NOT NULL,
        status TEXT DEFAULT 'draft',
        priority TEXT DEFAULT 'medium',
        attachments TEXT,
        instructions TEXT,
        max_score INTEGER DEFAULT 100,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (class_id) REFERENCES classes(id)
      )
    `)

    // 创建作业提交表
    await dbManager.run(`
      CREATE TABLE IF NOT EXISTS homework_submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        homework_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        content TEXT,
        attachments TEXT,
        submit_date DATETIME,
        score INTEGER,
        feedback TEXT,
        status TEXT DEFAULT 'not_submitted',
        graded_by INTEGER,
        graded_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (homework_id) REFERENCES homework(id),
        FOREIGN KEY (student_id) REFERENCES students(id),
        UNIQUE(homework_id, student_id)
      )
    `)

    console.log('作业管理表初始化完成')
  } catch (error) {
    console.error('作业管理表初始化失败:', error)
    throw error
  }
}

// 注册作业管理相关的IPC处理器
export function registerHomeworkHandlers(dbManager: DatabaseManager) {
  // 获取作业列表
  ipcMain.handle('homework:list', async (_, params: HomeworkQueryParams = {}) => {
    try {
      const {
        class_id,
        subject,
        status,
        teacher_id,
        page = 1,
        page_size = 20,
        search
      } = params

      const offset = (page - 1) * page_size
      let whereClause = 'WHERE 1=1'
      let queryParams: any[] = []

      if (class_id) {
        whereClause += ' AND h.class_id = ?'
        queryParams.push(class_id)
      }

      if (subject) {
        whereClause += ' AND h.subject = ?'
        queryParams.push(subject)
      }

      if (status) {
        whereClause += ' AND h.status = ?'
        queryParams.push(status)
      }

      if (teacher_id) {
        whereClause += ' AND h.teacher_id = ?'
        queryParams.push(teacher_id)
      }

      if (search) {
        whereClause += ' AND (h.title LIKE ? OR h.description LIKE ?)'
        queryParams.push(`%${search}%`, `%${search}%`)
      }

      // 获取总数
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM homework h 
        LEFT JOIN classes c ON h.class_id = c.id 
        ${whereClause}
      `
      const countResult = await dbManager.get(countQuery, queryParams)
      const total = countResult?.total || 0

      // 获取分页数据
      const selectQuery = `
        SELECT 
          h.*,
          c.name as class_name,
          (
            SELECT COUNT(*) 
            FROM homework_submissions hs 
            WHERE hs.homework_id = h.id AND hs.status != 'not_submitted'
          ) as submitted_count,
          (
            SELECT COUNT(*) 
            FROM students s 
            WHERE s.class_id = h.class_id AND s.is_active = 1
          ) as total_students
        FROM homework h
        LEFT JOIN classes c ON h.class_id = c.id
        ${whereClause}
        ORDER BY h.created_at DESC
        LIMIT ? OFFSET ?
      `
      queryParams.push(page_size, offset)

      const homework = await dbManager.all(selectQuery, queryParams)

      return {
        success: true,
        data: {
          homework,
          total,
          page,
          page_size
        }
      }
    } catch (error) {
      console.error('获取作业列表失败:', error)
      return {
        success: false,
        message: '获取作业列表失败',
        error: error.message
      }
    }
  })

  // 创建作业
  ipcMain.handle('homework:create', async (_, homework: Homework) => {
    try {
      const result = await dbManager.run(`
        INSERT INTO homework (
          title, description, subject, class_id, teacher_id, teacher_name,
          assign_date, due_date, status, priority, attachments, instructions, max_score
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        homework.title,
        homework.description,
        homework.subject,
        homework.class_id,
        homework.teacher_id,
        homework.teacher_name,
        homework.assign_date,
        homework.due_date,
        homework.status,
        homework.priority,
        homework.attachments,
        homework.instructions,
        homework.max_score
      ])

      // 如果作业发布，为班级所有学生创建提交记录
      if (homework.status === 'published') {
        const students = await dbManager.all(
          'SELECT id FROM students WHERE class_id = ? AND is_active = 1',
          [homework.class_id]
        )

        for (const student of students) {
          await dbManager.run(`
            INSERT INTO homework_submissions (homework_id, student_id, status)
            VALUES (?, ?, 'not_submitted')
          `, [result.lastInsertRowid, student.id])
        }
      }

      return {
        success: true,
        data: { id: result.lastInsertRowid },
        message: '作业创建成功'
      }
    } catch (error) {
      console.error('创建作业失败:', error)
      return {
        success: false,
        message: '创建作业失败',
        error: error.message
      }
    }
  })

  // 更新作业
  ipcMain.handle('homework:update', async (_, id: number, homework: Partial<Homework>) => {
    try {
      const fields = []
      const values = []

      Object.entries(homework).forEach(([key, value]) => {
        if (key !== 'id' && value !== undefined) {
          fields.push(`${key} = ?`)
          values.push(value)
        }
      })

      if (fields.length === 0) {
        return { success: false, message: '没有要更新的字段' }
      }

      fields.push('updated_at = CURRENT_TIMESTAMP')
      values.push(id)

      await dbManager.run(`
        UPDATE homework 
        SET ${fields.join(', ')}
        WHERE id = ?
      `, values)

      return {
        success: true,
        message: '作业更新成功'
      }
    } catch (error) {
      console.error('更新作业失败:', error)
      return {
        success: false,
        message: '更新作业失败',
        error: error.message
      }
    }
  })

  // 删除作业
  ipcMain.handle('homework:delete', async (_, id: number) => {
    try {
      // 先删除相关的提交记录
      await dbManager.run('DELETE FROM homework_submissions WHERE homework_id = ?', [id])
      
      // 删除作业
      await dbManager.run('DELETE FROM homework WHERE id = ?', [id])

      return {
        success: true,
        message: '作业删除成功'
      }
    } catch (error) {
      console.error('删除作业失败:', error)
      return {
        success: false,
        message: '删除作业失败',
        error: error.message
      }
    }
  })

  // 获取作业详情
  ipcMain.handle('homework:detail', async (_, id: number) => {
    try {
      const homework = await dbManager.get(`
        SELECT 
          h.*,
          c.name as class_name
        FROM homework h
        LEFT JOIN classes c ON h.class_id = c.id
        WHERE h.id = ?
      `, [id])

      if (!homework) {
        return {
          success: false,
          message: '作业不存在'
        }
      }

      return {
        success: true,
        data: homework
      }
    } catch (error) {
      console.error('获取作业详情失败:', error)
      return {
        success: false,
        message: '获取作业详情失败',
        error: error.message
      }
    }
  })

  // 获取作业提交列表
  ipcMain.handle('homework:submissions', async (_, params: SubmissionQueryParams = {}) => {
    try {
      const {
        homework_id,
        student_id,
        status,
        page = 1,
        page_size = 20
      } = params

      const offset = (page - 1) * page_size
      let whereClause = 'WHERE 1=1'
      let queryParams: any[] = []

      if (homework_id) {
        whereClause += ' AND hs.homework_id = ?'
        queryParams.push(homework_id)
      }

      if (student_id) {
        whereClause += ' AND hs.student_id = ?'
        queryParams.push(student_id)
      }

      if (status) {
        whereClause += ' AND hs.status = ?'
        queryParams.push(status)
      }

      // 获取总数
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM homework_submissions hs 
        ${whereClause}
      `
      const countResult = await dbManager.get(countQuery, queryParams)
      const total = countResult?.total || 0

      // 获取分页数据
      const selectQuery = `
        SELECT 
          hs.*,
          s.name as student_name,
          s.student_id as student_number,
          h.title as homework_title,
          h.due_date,
          h.max_score
        FROM homework_submissions hs
        LEFT JOIN students s ON hs.student_id = s.id
        LEFT JOIN homework h ON hs.homework_id = h.id
        ${whereClause}
        ORDER BY hs.submit_date DESC, s.name ASC
        LIMIT ? OFFSET ?
      `
      queryParams.push(page_size, offset)

      const submissions = await dbManager.all(selectQuery, queryParams)

      return {
        success: true,
        data: {
          submissions,
          total,
          page,
          page_size
        }
      }
    } catch (error) {
      console.error('获取作业提交列表失败:', error)
      return {
        success: false,
        message: '获取作业提交列表失败',
        error: error.message
      }
    }
  })

  // 提交作业
  ipcMain.handle('homework:submit', async (_, submission: Partial<HomeworkSubmission>) => {
    try {
      const existingSubmission = await dbManager.get(
        'SELECT id FROM homework_submissions WHERE homework_id = ? AND student_id = ?',
        [submission.homework_id, submission.student_id]
      )

      if (existingSubmission) {
        // 更新现有提交
        await dbManager.run(`
          UPDATE homework_submissions 
          SET content = ?, attachments = ?, submit_date = CURRENT_TIMESTAMP, 
              status = 'submitted', updated_at = CURRENT_TIMESTAMP
          WHERE homework_id = ? AND student_id = ?
        `, [
          submission.content,
          submission.attachments,
          submission.homework_id,
          submission.student_id
        ])
      } else {
        // 创建新提交
        await dbManager.run(`
          INSERT INTO homework_submissions (
            homework_id, student_id, content, attachments, submit_date, status
          ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, 'submitted')
        `, [
          submission.homework_id,
          submission.student_id,
          submission.content,
          submission.attachments
        ])
      }

      return {
        success: true,
        message: '作业提交成功'
      }
    } catch (error) {
      console.error('提交作业失败:', error)
      return {
        success: false,
        message: '提交作业失败',
        error: error.message
      }
    }
  })

  // 批改作业
  ipcMain.handle('homework:grade', async (_, gradeData: { homework_id: number, student_id: number, score: number, feedback?: string, graded_by?: number }) => {
    try {
      await dbManager.run(`
        UPDATE homework_submissions 
        SET score = ?, feedback = ?, status = 'graded', 
            graded_by = ?, graded_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE homework_id = ? AND student_id = ?
      `, [
        gradeData.score,
        gradeData.feedback,
        gradeData.graded_by,
        gradeData.homework_id,
        gradeData.student_id
      ])

      return {
        success: true,
        message: '作业批改成功'
      }
    } catch (error) {
      console.error('批改作业失败:', error)
      return {
        success: false,
        message: '批改作业失败',
        error: error.message
      }
    }
  })

  // 批量批改作业
  ipcMain.handle('homework:batchGrade', async (_, batchData: { homework_id: number, scope: string, score: number, feedback?: string, graded_by?: number }) => {
    try {
      let whereClause = 'WHERE homework_id = ?'
      let queryParams = [batchData.homework_id]

      if (batchData.scope === 'ungraded') {
        whereClause += ' AND (status = "submitted" OR status = "not_submitted")'
      } else if (batchData.scope === 'selected') {
        // TODO: 处理选中项批改
        whereClause += ' AND status = "submitted"'
      }

      const result = await dbManager.run(`
        UPDATE homework_submissions 
        SET score = ?, feedback = ?, status = 'graded', 
            graded_by = ?, graded_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        ${whereClause}
      `, [
        batchData.score,
        batchData.feedback,
        batchData.graded_by,
        ...queryParams
      ])

      return {
        success: true,
        data: { count: result.changes },
        message: `批量批改成功，共批改 ${result.changes} 份作业`
      }
    } catch (error) {
      console.error('批量批改失败:', error)
      return {
        success: false,
        message: '批量批改失败',
        error: error.message
      }
    }
  })

  // 导出作业成绩
  ipcMain.handle('homework:export', async (_, homeworkId: number) => {
    try {
      const homework = await dbManager.get(
        'SELECT title, subject, class_id FROM homework WHERE id = ?',
        [homeworkId]
      )

      if (!homework) {
        return {
          success: false,
          message: '作业不存在'
        }
      }

      const submissions = await dbManager.all(`
        SELECT 
          s.name as student_name,
          s.student_id as student_number,
          hs.score,
          hs.feedback,
          hs.submit_date,
          hs.status
        FROM homework_submissions hs
        LEFT JOIN students s ON hs.student_id = s.id
        WHERE hs.homework_id = ?
        ORDER BY s.name ASC
      `, [homeworkId])

      // TODO: 实际的Excel导出功能
      console.log('导出数据:', { homework, submissions })

      return {
        success: true,
        message: '导出成功'
      }
    } catch (error) {
      console.error('导出失败:', error)
      return {
        success: false,
        message: '导出失败',
        error: error.message
      }
    }
  })

  // 获取作业统计
  ipcMain.handle('homework:statistics', async (_, homeworkId: number) => {
    try {
      const stats = await dbManager.get(`
        SELECT 
          COUNT(*) as total_students,
          SUM(CASE WHEN status = 'submitted' OR status = 'graded' THEN 1 ELSE 0 END) as submitted_count,
          SUM(CASE WHEN status = 'graded' THEN 1 ELSE 0 END) as graded_count,
          SUM(CASE WHEN status = 'not_submitted' THEN 1 ELSE 0 END) as not_submitted_count,
          AVG(CASE WHEN score IS NOT NULL THEN score ELSE NULL END) as average_score
        FROM homework_submissions 
        WHERE homework_id = ?
      `, [homeworkId])

      return {
        success: true,
        data: stats
      }
    } catch (error) {
      console.error('获取作业统计失败:', error)
      return {
        success: false,
        message: '获取作业统计失败',
        error: error.message
      }
    }
  })

  console.log('作业管理IPC处理器注册完成')
}