import { ipcMain } from 'electron'
import type { DatabaseManager } from '../database'

// 成绩查询参数接口
interface GradeQueryParams {
  student_id?: number
  class_id?: number
  subject?: string
  exam_type?: string
  semester?: string
  year?: number
  page?: number
  page_size?: number
}

// 成绩创建/更新数据接口
interface GradeFormData {
  student_id: number
  class_id: number
  subject: string
  score: number
  exam_type: string
  exam_date?: string
  semester?: string
  year?: number
  notes?: string
}

// 成绩统计数据接口
interface GradeStats {
  subject: string
  class_id: number
  class_name: string
  average_score: number
  max_score: number
  min_score: number
  student_count: number
  pass_rate: number
  excellent_rate: number
}

export function setupGradeHandlers(dbManager: DatabaseManager) {
  
  // 获取成绩列表
  ipcMain.handle('grades:list', async (_, params: GradeQueryParams = {}) => {
    try {
      let baseQuery = `
        SELECT 
          g.id,
          g.student_id,
          s.name as student_name,
          s.student_id as student_number,
          g.class_id,
          c.name as class_name,
          g.subject,
          g.score,
          g.exam_type,
          g.exam_date,
          g.semester,
          g.year,
          g.notes,
          g.created_at,
          g.updated_at
        FROM grades g
        LEFT JOIN students s ON g.student_id = s.id
        LEFT JOIN classes c ON g.class_id = c.id
        WHERE 1=1
      `
      
      const queryParams: any[] = []
      
      // 添加筛选条件
      if (params.student_id) {
        baseQuery += ' AND g.student_id = ?'
        queryParams.push(params.student_id)
      }
      
      if (params.class_id) {
        baseQuery += ' AND g.class_id = ?'
        queryParams.push(params.class_id)
      }
      
      if (params.subject) {
        baseQuery += ' AND g.subject = ?'
        queryParams.push(params.subject)
      }
      
      if (params.exam_type) {
        baseQuery += ' AND g.exam_type = ?'
        queryParams.push(params.exam_type)
      }
      
      if (params.semester) {
        baseQuery += ' AND g.semester = ?'
        queryParams.push(params.semester)
      }
      
      if (params.year) {
        baseQuery += ' AND g.year = ?'
        queryParams.push(params.year)
      }
      
      // 添加排序
      baseQuery += ' ORDER BY g.exam_date DESC, g.created_at DESC'
      
      // 分页处理
      const page = params.page || 1
      const pageSize = params.page_size || 20
      const offset = (page - 1) * pageSize
      
      // 获取总数
      const countQuery = baseQuery.replace(
        /SELECT[\s\S]*?FROM/i,
        'SELECT COUNT(*) as total FROM'
      )
      const totalResult = await dbManager.get(countQuery, queryParams)
      const total = totalResult.total || 0
      
      // 获取分页数据
      const dataQuery = baseQuery + ' LIMIT ? OFFSET ?'
      const grades = await dbManager.all(dataQuery, [...queryParams, pageSize, offset])
      
      return {
        success: true,
        data: {
          items: grades,
          total,
          page,
          page_size: pageSize,
          total_pages: Math.ceil(total / pageSize)
        }
      }
    } catch (error) {
      console.error('获取成绩列表失败:', error)
      return { success: false, error: error.message }
    }
  })

  // 获取单个成绩
  ipcMain.handle('grades:getById', async (_, id: number) => {
    try {
      const grade = await dbManager.get(`
        SELECT 
          g.*,
          s.name as student_name,
          s.student_id as student_number,
          c.name as class_name
        FROM grades g
        LEFT JOIN students s ON g.student_id = s.id
        LEFT JOIN classes c ON g.class_id = c.id
        WHERE g.id = ?
      `, [id])
      
      if (!grade) {
        return { success: false, error: '成绩记录不存在' }
      }
      
      return { success: true, data: grade }
    } catch (error) {
      console.error('获取成绩详情失败:', error)
      return { success: false, error: error.message }
    }
  })

  // 创建成绩
  ipcMain.handle('grades:create', async (_, gradeData: GradeFormData) => {
    try {
      // 验证学生和班级存在
      const student = await dbManager.get('SELECT id FROM students WHERE id = ?', [gradeData.student_id])
      if (!student) {
        return { success: false, error: '学生不存在' }
      }
      
      const classData = await dbManager.get('SELECT id FROM classes WHERE id = ?', [gradeData.class_id])
      if (!classData) {
        return { success: false, error: '班级不存在' }
      }
      
      // 检查是否已存在相同的成绩记录
      const existingGrade = await dbManager.get(`
        SELECT id FROM grades 
        WHERE student_id = ? AND subject = ? AND exam_type = ? AND exam_date = ?
      `, [gradeData.student_id, gradeData.subject, gradeData.exam_type, gradeData.exam_date])
      
      if (existingGrade) {
        return { success: false, error: '该学生在此次考试中的该科目成绩已存在' }
      }
      
      const result = await dbManager.run(`
        INSERT INTO grades (
          student_id, class_id, subject, score, exam_type, 
          exam_date, semester, year, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        gradeData.student_id,
        gradeData.class_id,
        gradeData.subject,
        gradeData.score,
        gradeData.exam_type,
        gradeData.exam_date || null,
        gradeData.semester || '上学期',
        gradeData.year || new Date().getFullYear(),
        gradeData.notes || null
      ])
      
      return { success: true, data: { id: result.lastInsertRowid } }
    } catch (error) {
      console.error('创建成绩失败:', error)
      return { success: false, error: error.message }
    }
  })

  // 更新成绩
  ipcMain.handle('grades:update', async (_, id: number, gradeData: Partial<GradeFormData>) => {
    try {
      // 检查成绩记录是否存在
      const existingGrade = await dbManager.get('SELECT id FROM grades WHERE id = ?', [id])
      if (!existingGrade) {
        return { success: false, error: '成绩记录不存在' }
      }
      
      // 构建更新语句
      const updateFields = []
      const updateValues = []
      
      if (gradeData.subject !== undefined) {
        updateFields.push('subject = ?')
        updateValues.push(gradeData.subject)
      }
      
      if (gradeData.score !== undefined) {
        updateFields.push('score = ?')
        updateValues.push(gradeData.score)
      }
      
      if (gradeData.exam_type !== undefined) {
        updateFields.push('exam_type = ?')
        updateValues.push(gradeData.exam_type)
      }
      
      if (gradeData.exam_date !== undefined) {
        updateFields.push('exam_date = ?')
        updateValues.push(gradeData.exam_date)
      }
      
      if (gradeData.semester !== undefined) {
        updateFields.push('semester = ?')
        updateValues.push(gradeData.semester)
      }
      
      if (gradeData.year !== undefined) {
        updateFields.push('year = ?')
        updateValues.push(gradeData.year)
      }
      
      if (gradeData.notes !== undefined) {
        updateFields.push('notes = ?')
        updateValues.push(gradeData.notes)
      }
      
      updateFields.push('updated_at = CURRENT_TIMESTAMP')
      updateValues.push(id)
      
      await dbManager.run(`
        UPDATE grades SET ${updateFields.join(', ')} WHERE id = ?
      `, updateValues)
      
      return { success: true }
    } catch (error) {
      console.error('更新成绩失败:', error)
      return { success: false, error: error.message }
    }
  })

  // 删除成绩
  ipcMain.handle('grades:delete', async (_, id: number) => {
    try {
      const result = await dbManager.run('DELETE FROM grades WHERE id = ?', [id])
      
      if (result.changes === 0) {
        return { success: false, error: '成绩记录不存在' }
      }
      
      return { success: true }
    } catch (error) {
      console.error('删除成绩失败:', error)
      return { success: false, error: error.message }
    }
  })

  // 批量删除成绩
  ipcMain.handle('grades:batchDelete', async (_, ids: number[]) => {
    try {
      if (!ids || ids.length === 0) {
        return { success: false, error: '请选择要删除的成绩记录' }
      }
      
      const placeholders = ids.map(() => '?').join(',')
      const result = await dbManager.run(
        `DELETE FROM grades WHERE id IN (${placeholders})`,
        ids
      )
      
      return { 
        success: true, 
        data: { deleted_count: result.changes }
      }
    } catch (error) {
      console.error('批量删除成绩失败:', error)
      return { success: false, error: error.message }
    }
  })

  // 获取成绩统计
  ipcMain.handle('grades:getStats', async (_, params: {
    class_id?: number
    subject?: string
    exam_type?: string
    semester?: string
    year?: number
  } = {}) => {
    try {
      let baseQuery = `
        SELECT 
          g.subject,
          g.class_id,
          c.name as class_name,
          AVG(g.score) as average_score,
          MAX(g.score) as max_score,
          MIN(g.score) as min_score,
          COUNT(g.id) as student_count,
          ROUND(COUNT(CASE WHEN g.score >= 60 THEN 1 END) * 100.0 / COUNT(g.id), 2) as pass_rate,
          ROUND(COUNT(CASE WHEN g.score >= 85 THEN 1 END) * 100.0 / COUNT(g.id), 2) as excellent_rate
        FROM grades g
        LEFT JOIN classes c ON g.class_id = c.id
        WHERE 1=1
      `
      
      const queryParams: any[] = []
      
      if (params.class_id) {
        baseQuery += ' AND g.class_id = ?'
        queryParams.push(params.class_id)
      }
      
      if (params.subject) {
        baseQuery += ' AND g.subject = ?'
        queryParams.push(params.subject)
      }
      
      if (params.exam_type) {
        baseQuery += ' AND g.exam_type = ?'
        queryParams.push(params.exam_type)
      }
      
      if (params.semester) {
        baseQuery += ' AND g.semester = ?'
        queryParams.push(params.semester)
      }
      
      if (params.year) {
        baseQuery += ' AND g.year = ?'
        queryParams.push(params.year)
      }
      
      baseQuery += ' GROUP BY g.subject, g.class_id ORDER BY g.subject, c.name'
      
      const stats = await dbManager.all(baseQuery, queryParams)
      
      return { success: true, data: stats }
    } catch (error) {
      console.error('获取成绩统计失败:', error)
      return { success: false, error: error.message }
    }
  })

  // 获取学科列表
  ipcMain.handle('grades:getSubjects', async () => {
    try {
      const subjects = await dbManager.all(`
        SELECT DISTINCT subject 
        FROM grades 
        WHERE subject IS NOT NULL 
        ORDER BY subject
      `)
      
      return { 
        success: true, 
        data: subjects.map(s => s.subject) 
      }
    } catch (error) {
      console.error('获取学科列表失败:', error)
      return { success: false, error: error.message }
    }
  })

  // 获取考试类型列表
  ipcMain.handle('grades:getExamTypes', async () => {
    try {
      const examTypes = await dbManager.all(`
        SELECT DISTINCT exam_type 
        FROM grades 
        WHERE exam_type IS NOT NULL 
        ORDER BY exam_type
      `)
      
      return { 
        success: true, 
        data: examTypes.map(e => e.exam_type) 
      }
    } catch (error) {
      console.error('获取考试类型列表失败:', error)
      return { success: false, error: error.message }
    }
  })

  // 批量导入成绩
  ipcMain.handle('grades:import', async (_, gradesData: GradeFormData[]) => {
    try {
      if (!Array.isArray(gradesData) || gradesData.length === 0) {
        return { success: false, error: '导入数据为空' }
      }

      let successCount = 0
      let errorCount = 0
      const errors: string[] = []

      for (const gradeData of gradesData) {
        try {
          // 验证必填字段
          if (!gradeData.student_id || !gradeData.class_id || !gradeData.subject || 
              gradeData.score === undefined || !gradeData.exam_type) {
            errors.push(`第${successCount + errorCount + 1}行: 缺少必填字段`)
            errorCount++
            continue
          }

          // 验证学生存在
          const student = await dbManager.get('SELECT id FROM students WHERE id = ?', [gradeData.student_id])
          if (!student) {
            errors.push(`第${successCount + errorCount + 1}行: 学生ID ${gradeData.student_id} 不存在`)
            errorCount++
            continue
          }

          // 验证班级存在
          const classData = await dbManager.get('SELECT id FROM classes WHERE id = ?', [gradeData.class_id])
          if (!classData) {
            errors.push(`第${successCount + errorCount + 1}行: 班级ID ${gradeData.class_id} 不存在`)
            errorCount++
            continue
          }

          // 检查是否已存在相同记录
          const existingGrade = await dbManager.get(`
            SELECT id FROM grades 
            WHERE student_id = ? AND subject = ? AND exam_type = ? AND exam_date = ?
          `, [gradeData.student_id, gradeData.subject, gradeData.exam_type, gradeData.exam_date])

          if (existingGrade) {
            // 更新现有记录
            await dbManager.run(`
              UPDATE grades SET 
                score = ?, semester = ?, year = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `, [
              gradeData.score,
              gradeData.semester || '上学期',
              gradeData.year || new Date().getFullYear(),
              gradeData.notes || null,
              existingGrade.id
            ])
          } else {
            // 创建新记录
            await dbManager.run(`
              INSERT INTO grades (
                student_id, class_id, subject, score, exam_type, 
                exam_date, semester, year, notes
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              gradeData.student_id,
              gradeData.class_id,
              gradeData.subject,
              gradeData.score,
              gradeData.exam_type,
              gradeData.exam_date || null,
              gradeData.semester || '上学期',
              gradeData.year || new Date().getFullYear(),
              gradeData.notes || null
            ])
          }

          successCount++
        } catch (itemError) {
          console.error(`处理第${successCount + errorCount + 1}行数据失败:`, itemError)
          errors.push(`第${successCount + errorCount + 1}行: ${itemError.message}`)
          errorCount++
        }
      }

      return {
        success: true,
        data: {
          success_count: successCount,
          error_count: errorCount,
          errors: errors.slice(0, 10) // 最多返回10个错误信息
        }
      }
    } catch (error) {
      console.error('批量导入成绩失败:', error)
      return { success: false, error: error.message }
    }
  })

  // 导出成绩
  ipcMain.handle('grades:export', async (_, params: GradeQueryParams = {}) => {
    try {
      let baseQuery = `
        SELECT 
          g.id,
          s.name as student_name,
          s.student_id as student_number,
          c.name as class_name,
          g.subject,
          g.score,
          g.exam_type,
          g.exam_date,
          g.semester,
          g.year,
          g.notes
        FROM grades g
        LEFT JOIN students s ON g.student_id = s.id
        LEFT JOIN classes c ON g.class_id = c.id
        WHERE 1=1
      `
      
      const queryParams: any[] = []
      
      // 添加筛选条件
      if (params.student_id) {
        baseQuery += ' AND g.student_id = ?'
        queryParams.push(params.student_id)
      }
      
      if (params.class_id) {
        baseQuery += ' AND g.class_id = ?'
        queryParams.push(params.class_id)
      }
      
      if (params.subject) {
        baseQuery += ' AND g.subject = ?'
        queryParams.push(params.subject)
      }
      
      if (params.exam_type) {
        baseQuery += ' AND g.exam_type = ?'
        queryParams.push(params.exam_type)
      }
      
      if (params.semester) {
        baseQuery += ' AND g.semester = ?'
        queryParams.push(params.semester)
      }
      
      if (params.year) {
        baseQuery += ' AND g.year = ?'
        queryParams.push(params.year)
      }
      
      baseQuery += ' ORDER BY g.exam_date DESC, s.name ASC'
      
      const grades = await dbManager.all(baseQuery, queryParams)
      
      return {
        success: true,
        data: grades
      }
    } catch (error) {
      console.error('导出成绩失败:', error)
      return { success: false, error: error.message }
    }
  })
}