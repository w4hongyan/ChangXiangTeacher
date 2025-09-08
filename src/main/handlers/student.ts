import { ipcMain, IpcMainInvokeEvent } from 'electron'
import * as XLSX from 'xlsx'
import { dialog } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
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
          s.class_id,
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
      // 只有当学号不为空时才检查学号是否已存在
      if (data.student_id && data.student_id.trim()) {
        const checkQuery = 'SELECT id FROM students WHERE student_id = ?'
        const existing = await db.get(checkQuery, [data.student_id.trim()])
        
        if (existing) {
          return { success: false, error: '学号已存在' }
        }
      }

      const insertQuery = `
        INSERT INTO students (
          student_id, name, gender, birth_date, phone, parent_phone,
          email, address, class_id, height, eyesight, special_needs, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      
      const params = [
        data.student_id && data.student_id.trim() ? data.student_id.trim() : null,
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
      // 只有当学号不为空时才检查学号是否已存在（排除当前学生）
      if (data.student_id && data.student_id.trim()) {
        const checkQuery = 'SELECT id FROM students WHERE student_id = ? AND id != ?'
        const existing = await db.get(checkQuery, [data.student_id.trim(), id])
        
        if (existing) {
          return { success: false, error: '学号已存在' }
        }
      }

      const fields: string[] = []
      const values: any[] = []

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          // 对于学号，如果是空字符串则设为 null
          if (key === 'student_id') {
            fields.push(`${key} = ?`)
            values.push(typeof value === 'string' && value.trim() ? value.trim() : null)
          } else {
            fields.push(`${key} = ?`)
            values.push(value)
          }
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

  // 导出学生数据
  const handleExportStudents = async (_: IpcMainInvokeEvent, params: StudentQueryParams = {}) => {
    try {
      console.log('学生导出请求参数:', params)
      
      const {
        keyword = '',
        class_id,
        is_active = true
      } = params

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

      // 获取所有符合条件的学生数据
      const query = `
        SELECT
          s.student_id as '学号',
          s.name as '姓名',
          s.gender as '性别',
          CONCAT(c.grade, c.class_number, '班') as '班级',
          s.birth_date as '出生日期',
          s.phone as '联系电话',
          s.parent_phone as '家长电话',
          s.email as '电子邮箱',
          s.address as '家庭地址',
          s.height as '身高',
          s.eyesight as '视力',
          s.special_needs as '特殊需求',
          s.notes as '备注',
          CASE WHEN s.is_active = 1 THEN '启用' ELSE '禁用' END as '状态',
          s.created_at as '创建时间'
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        ${whereClause}
        ORDER BY s.created_at DESC
      `

      const students = await db.all(query, paramsArray)
      console.log('查询到的学生数据数量:', students.length)

      if (!students || students.length === 0) {
        return { success: false, error: '没有找到符合条件的学生数据' }
      }

      // 创建 Excel 工作簿
      const workbook = XLSX.utils.book_new()
      
      // 将数据转换为工作表
      const worksheet = XLSX.utils.json_to_sheet(students)
      
      // 设置列宽
      const colWidths = [
        { wch: 12 }, // 学号
        { wch: 10 }, // 姓名
        { wch: 6 },  // 性别
        { wch: 12 }, // 班级
        { wch: 15 }, // 出生日期
        { wch: 15 }, // 联系电话
        { wch: 15 }, // 家长电话
        { wch: 20 }, // 电子邮箱
        { wch: 30 }, // 家庭地址
        { wch: 8 },  // 身高
        { wch: 10 }, // 视力
        { wch: 15 }, // 特殊需求
        { wch: 20 }, // 备注
        { wch: 8 },  // 状态
        { wch: 20 }  // 创建时间
      ]
      worksheet['!cols'] = colWidths
      
      // 添加工作表到工作簿
      XLSX.utils.book_append_sheet(workbook, worksheet, '学生信息')
      
      // 生成文件名
      const now = new Date()
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
      const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
      const filename = `学生信息导出_${dateStr}_${timeStr}.xlsx`
      
      // 显示保存对话框
      const { filePath } = await dialog.showSaveDialog({
        title: '保存学生数据',
        defaultPath: filename,
        filters: [
          { name: 'Excel文件', extensions: ['xlsx'] },
          { name: '所有文件', extensions: ['*'] }
        ]
      })
      
      if (!filePath) {
        return { success: false, error: '用户取消了导出操作' }
      }
      
      // 写入文件
      XLSX.writeFile(workbook, filePath)
      
      return { 
        success: true, 
        data: { 
          filename: path.basename(filePath),
          filepath: filePath,
          count: students.length 
        } 
      }
    } catch (error) {
      console.error('导出学生数据失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '导出学生数据失败' }
    }
  };
  ipcMain.handle('students:export', handleExportStudents);

  // 导入学生数据
  const handleImportStudents = async (_: IpcMainInvokeEvent, fileData: ArrayBuffer | Buffer) => {
    try {
      console.log('开始导入学生数据')
      
      // 将ArrayBuffer转换为Buffer（如果需要）
      let fileBuffer: Buffer
      if (fileData instanceof ArrayBuffer) {
        fileBuffer = Buffer.from(fileData)
      } else {
        fileBuffer = fileData
      }
      
      // 读取 Excel 文件
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
      
      if (!jsonData || jsonData.length < 2) {
        return { success: false, error: '文件为空或格式不正确' }
      }
      
      // 获取标题行和数据行
      const headers = jsonData[0] as string[]
      const rows = jsonData.slice(1) as any[][]
      
      // 映射列索引
      const columnMap: { [key: string]: number } = {}
      headers.forEach((header, index) => {
        const normalizedHeader = header.trim()
        if (normalizedHeader === '学号' || normalizedHeader === 'student_id') {
          columnMap.student_id = index
        } else if (normalizedHeader === '姓名' || normalizedHeader === 'name') {
          columnMap.name = index
        } else if (normalizedHeader === '性别' || normalizedHeader === 'gender') {
          columnMap.gender = index
        } else if (normalizedHeader === '班级' || normalizedHeader === 'class') {
          columnMap.class_name = index
        } else if (normalizedHeader === '出生日期' || normalizedHeader === 'birth_date') {
          columnMap.birth_date = index
        } else if (normalizedHeader === '联系电话' || normalizedHeader === 'phone') {
          columnMap.phone = index
        } else if (normalizedHeader === '家庭地址' || normalizedHeader === 'address') {
          columnMap.address = index
        } else if (normalizedHeader === '备注' || normalizedHeader === 'notes') {
          columnMap.notes = index
        }
      })
      
      if (columnMap.name === undefined) {
        return { success: false, error: '未找到“姓名”列，请检查文件格式' }
      }
      
      // 获取班级映射
      const classMap = new Map<string, number>()
      const classes = await db.all('SELECT id, grade, class_number FROM classes WHERE is_active = 1')
      classes.forEach((cls: any) => {
        const className = `${cls.grade}${cls.class_number}班`
        classMap.set(className, cls.id)
        classMap.set(`${cls.grade}${cls.class_number}`, cls.id) // 也支持不带“班”字的格式
      })
      
      let successCount = 0
      let failureCount = 0
      const errors: string[] = []
      
      // 处理每一行数据
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        try {
          const name = row[columnMap.name]?.toString()?.trim()
          if (!name) {
            errors.push(`第${i + 2}行：姓名不能为空`)
            failureCount++
            continue
          }
          
          // 获取班级ID
          let classId = 1 // 默认班级
          if (columnMap.class_name !== undefined) {
            const className = row[columnMap.class_name]?.toString()?.trim()
            if (className && classMap.has(className)) {
              classId = classMap.get(className)!
            }
          }
          
          const studentData: StudentFormData = {
            student_id: columnMap.student_id !== undefined ? row[columnMap.student_id]?.toString()?.trim() || undefined : undefined,
            name,
            gender: columnMap.gender !== undefined ? row[columnMap.gender]?.toString()?.trim() || undefined : undefined,
            birth_date: columnMap.birth_date !== undefined ? row[columnMap.birth_date]?.toString()?.trim() || undefined : undefined,
            phone: columnMap.phone !== undefined ? row[columnMap.phone]?.toString()?.trim() || undefined : undefined,
            address: columnMap.address !== undefined ? row[columnMap.address]?.toString()?.trim() || undefined : undefined,
            class_id: classId
          }
          
          // 创建学生
          const result = await handleCreateStudent(null as any, studentData)
          if (result.success) {
            successCount++
          } else {
            errors.push(`第${i + 2}行（${name}）：${result.error}`)
            failureCount++
          }
        } catch (error) {
          errors.push(`第${i + 2}行：${error instanceof Error ? error.message : '未知错误'}`)
          failureCount++
        }
      }
      
      return {
        success: true,
        data: {
          success_count: successCount,
          failure_count: failureCount,
          total_count: rows.length,
          errors: errors.slice(0, 10) // 只返回前10个错误
        }
      }
    } catch (error) {
      console.error('导入学生数据失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '导入学生数据失败' }
    }
  };
  ipcMain.handle('students:import', handleImportStudents);
}
