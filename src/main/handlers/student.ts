import { ipcMain, IpcMainInvokeEvent } from 'electron'
import type { DatabaseManager } from '../database'
import type { Student, StudentFormData, StudentQueryParams } from '../../renderer/types/student'

export function setupStudentHandlers(db: DatabaseManager) {
  const handleListStudents = async (_: IpcMainInvokeEvent, params: StudentQueryParams = {}) => {
    try {
      console.log('students:list handler received params:', params); // Log received parameters
      const {
        keyword = '',
        class_id,
        is_active = true,
        page = 1,
        page_size = 20
      } = params

      const offset = (page - 1) * page_size
      let whereClause = 'WHERE s.is_active = ?'
      let paramsArray: any[] = [is_active ? 1 : 0]

      if (keyword) {
        whereClause += ' AND (s.name LIKE ? OR s.student_id LIKE ?)'
        paramsArray.push(`%${keyword}%`, `%${keyword}%`)
      }

      if (class_id) {
        whereClause += ' AND s.class_id = ?'
        paramsArray.push(class_id)
      }

      // 获取总数
      const countQuery = `
        SELECT COUNT(*) as total
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        ${whereClause}
      `
      console.log('Count Query:', countQuery); // Log count query
      console.log('Count Params:', paramsArray); // Log count query parameters
      const countResult = await db.get(countQuery, paramsArray)
      console.log('Count Result:', countResult); // Log count result
      const total = countResult?.total || 0

      // 获取分页数据
      const selectQuery = `
        SELECT
          s.id,
          s.student_id,
          s.name,
          s.gender,
          s.birth_date,
          s.phone,
          s.parent_phone,
          s.email,
          s.address,
          s.is_active,
          s.created_at,
          c.name as class_name
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        ${whereClause}
        ORDER BY s.created_at DESC
        LIMIT ? OFFSET ?
      `
      paramsArray.push(page_size, offset)

      console.log('Select Query:', selectQuery); // Log select query
      console.log('Select Params:', paramsArray); // Log select query parameters
      const items = await db.all(selectQuery, paramsArray)
      console.log('Select Items:', items); // Log selected items

      // 确保返回的是数组，并且处理可能的嵌套数组情况
      let safeItems = [];
      if (Array.isArray(items)) {
        // 如果items本身是数组但第一个元素也是数组，说明可能是嵌套数组
        if (items.length > 0 && Array.isArray(items[0])) {
          safeItems = items[0];
        } else {
          safeItems = items;
        }
      }
      
      return {
        success: true,
        data: {
          items: safeItems,
          total: Number(total) || 0,
          page: Number(page) || 1,
          page_size: Number(page_size) || 20,
          total_pages: Math.ceil((Number(total) || 0) / (Number(page_size) || 20))
        }
      }
    } catch (error) {
      console.error('获取学生列表失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '获取学生列表失败' }
    }
  };
  ipcMain.handle('students:list', handleListStudents);

  const handleGetStudentById = async (_: IpcMainInvokeEvent, id: number) => {
    try {
      const query = `
        SELECT
          s.*,
          c.name as class_name,
          c.grade,
          c.class_number
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        WHERE s.id = ?
      `
      const student = await db.get(query, [id])
      
      if (!student) {
        return { success: false, error: '学生不存在' }
      }

      return { success: true, data: student }
    } catch (error) {
      console.error('获取学生详情失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '获取学生详情失败' }
    }
  };
  ipcMain.handle('students:getById', handleGetStudentById);

  const handleCreateStudent = async (_: IpcMainInvokeEvent, data: StudentFormData) => {
    try {
      // 检查学号是否已存在
      const checkQuery = 'SELECT id FROM students WHERE student_id = ?'
      const existing = await db.get(checkQuery, [data.student_id])
      
      if (existing) {
        return { success: false, error: '学号已存在' }
      }

      const insertQuery = `
        INSERT INTO students (
          student_id, name, gender, birth_date, phone, parent_phone,
          email, address, class_id, height, eyesight, special_needs, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      
      const params = [
        data.student_id,
        data.name,
        data.gender || null,
        data.birth_date || null,
        data.phone || null,
        data.parent_phone || null,
        data.email || null,
        data.address || null,
        data.class_id,
        data.height || 160,
        data.eyesight || null,
        data.special_needs || null,
        data.notes || null
      ]

      const result = await db.run(insertQuery, params)
      const studentId = result.lastID || result.lastInsertRowid

      if (!studentId) {
        throw new Error('无法获取新创建的学生ID')
      }

      // 返回创建的学生
      const newStudent = await db.get('SELECT * FROM students WHERE id = ?', [Number(studentId)])
      
      return { success: true, data: newStudent }
    } catch (error) {
      console.error('创建学生失败:', error)
      
      // 提供更具体的错误信息
      let errorMessage = '创建学生失败'
      if (error instanceof Error) {
        if (error.message.includes('UNIQUE constraint failed')) {
          if (error.message.includes('student_id')) {
            errorMessage = '学号已存在，请使用其他学号'
          } else {
            errorMessage = '数据重复，请检查输入信息'
          }
        } else if (error.message.includes('FOREIGN KEY constraint failed')) {
          errorMessage = '班级不存在，请选择有效的班级'
        } else if (error.message.includes('NOT NULL constraint failed')) {
          const field = error.message.match(/NOT NULL constraint failed: students\.(.+)/)
          if (field) {
            errorMessage = `${field[1]} 不能为空`
          } else {
            errorMessage = '必填字段不能为空'
          }
        } else if (error.message.includes('CHECK constraint failed')) {
          errorMessage = '输入数据不符合要求，请检查格式'
        } else {
          errorMessage = error.message || '创建学生失败'
        }
      }
      
      return { success: false, error: errorMessage }
    }
  };
  ipcMain.handle('students:create', handleCreateStudent);

  const handleUpdateStudent = async (_: IpcMainInvokeEvent, id: number, data: Partial<StudentFormData>) => {
    try {
      // 检查学号是否已存在（排除当前学生）
      if (data.student_id) {
        const checkQuery = 'SELECT id FROM students WHERE student_id = ? AND id != ?'
        const existing = await db.get(checkQuery, [data.student_id, id])
        
        if (existing) {
          return { success: false, error: '学号已存在' }
        }
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

      const query = `UPDATE students SET ${fields.join(', ')} WHERE id = ?`
      values.push(id)

      await db.run(query, values)

      // 返回更新后的学生
      const updatedStudent = await db.get('SELECT * FROM students WHERE id = ?', [id])
      
      return { success: true, data: updatedStudent }
    } catch (error) {
      console.error('更新学生失败:', error)
      
      // 提供更具体的错误信息
      let errorMessage = '更新学生失败'
      if (error instanceof Error) {
        if (error.message.includes('UNIQUE constraint failed')) {
          if (error.message.includes('student_id')) {
            errorMessage = '学号已存在，请使用其他学号'
          } else {
            errorMessage = '数据重复，请检查输入信息'
          }
        } else if (error.message.includes('FOREIGN KEY constraint failed')) {
          errorMessage = '班级不存在，请选择有效的班级'
        } else if (error.message.includes('NOT NULL constraint failed')) {
          const field = error.message.match(/NOT NULL constraint failed: students\.(.+)/)
          if (field) {
            errorMessage = `${field[1]} 不能为空`
          } else {
            errorMessage = '必填字段不能为空'
          }
        } else {
          errorMessage = error.message || '更新学生失败'
        }
      }
      
      return { success: false, error: errorMessage }
    }
  };
  ipcMain.handle('students:update', handleUpdateStudent);

  const handleDeleteStudent = async (_: IpcMainInvokeEvent, id: number) => {
    try {
      const query = 'UPDATE students SET is_active = 0 WHERE id = ?'
      await db.run(query, [id])
      
      return { success: true }
    } catch (error) {
      console.error('删除学生失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '删除学生失败' }
    }
  };
  ipcMain.handle('students:delete', handleDeleteStudent);

  const handleBatchDeleteStudents = async (_: IpcMainInvokeEvent, ids: number[]) => {
    try {
      const placeholders = ids.map(() => '?').join(',')
      const query = `UPDATE students SET is_active = 0 WHERE id IN (${placeholders})`
      
      await db.run(query, ids)
      
      return { success: true, data: { deleted_count: ids.length } }
    } catch (error) {
      console.error('批量删除学生失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '批量删除学生失败' }
    }
  };
  ipcMain.handle('students:batchDelete', handleBatchDeleteStudents);

  const handleGetClassesForStudents = async (_: IpcMainInvokeEvent) => {
    try {
      const query = 'SELECT id, name, grade, class_number FROM classes WHERE is_active = 1 ORDER BY grade, class_number'
      const classes = await db.all(query)
      
      return { success: true, data: classes }
    } catch (error) {
      console.error('获取班级列表失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '获取班级列表失败' }
    }
  };
  ipcMain.handle('students:getClasses', handleGetClassesForStudents);
}
