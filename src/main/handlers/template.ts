import { ipcMain, IpcMainInvokeEvent, dialog, shell } from 'electron'
import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'
import type { DatabaseManager } from '../database'

export interface DocumentTemplate {
  id?: number
  name: string
  category: string
  description?: string
  content: string // 模板内容
  is_system?: boolean
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface TemplateQueryParams {
  category?: string
  keyword?: string
  is_system?: boolean
  is_active?: boolean
  created_by?: number
}

export interface GenerateDocumentParams {
  template_id: number
  data: any // 填充数据
  output_path?: string
}

export function setupTemplateHandlers(db: DatabaseManager) {
  // 获取文档模板列表
  const handleGetTemplates = async (_: IpcMainInvokeEvent, params: TemplateQueryParams = {}) => {
    try {
      console.log('获取模板列表请求参数:', params)
      const {
        category,
        keyword,
        is_system,
        is_active = true,
        created_by
      } = params

      let whereClause = 'WHERE is_active = ?'
      let paramsArray: any[] = [is_active ? 1 : 0]

      if (category) {
        whereClause += ' AND category = ?'
        paramsArray.push(category)
      }

      if (keyword) {
        whereClause += ' AND (name LIKE ? OR description LIKE ?)'
        paramsArray.push(`%${keyword}%`, `%${keyword}%`)
      }

      if (is_system !== undefined) {
        whereClause += ' AND is_system = ?'
        paramsArray.push(is_system ? 1 : 0)
      }

      if (created_by) {
        whereClause += ' AND created_by = ?'
        paramsArray.push(created_by)
      }

      const query = `
        SELECT * FROM document_templates
        ${whereClause}
        ORDER BY is_system DESC, created_at DESC
      `

      console.log('执行查询:', query, '参数:', paramsArray)
      const templates = await db.all(query, paramsArray)
      console.log('数据库查询结果:', templates.length, '条记录')
      console.log('查询到的模板详情:', templates.map(t => ({ id: t.id, name: t.name, category: t.category, is_active: t.is_active, is_system: t.is_system })))
      
      // 映射字段名称以匹配前端期望
      const mappedTemplates = templates.map(template => {
        let content = ''
        try {
          // 解析JSON格式的template_content
          const templateContent = JSON.parse(template.template_content || '{}')
          content = templateContent.content || ''
        } catch (error) {
          console.error('解析模板内容失败:', error)
          content = template.template_content || ''
        }
        
        let variables = []
        try {
          const templateContent = JSON.parse(template.template_content || '{}')
          variables = templateContent.fields || []
        } catch (error) {
          variables = []
        }
        
        return {
          id: template.id,
          name: template.name,
          description: template.description,
          category: template.category,
          content: content,
          variables: variables,
          isSystem: Boolean(template.is_system),
          createdAt: template.created_at,
          updatedAt: template.updated_at
        }
      })
      
      console.log('映射后的模板数据:', mappedTemplates.length, '条记录')
      console.log('模板详情:', mappedTemplates.map(t => ({ id: t.id, name: t.name, category: t.category })))
      return { success: true, data: mappedTemplates }
    } catch (error) {
      console.error('获取文档模板失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '获取文档模板失败' }
    }
  }

  // 获取单个模板详情
  const handleGetTemplateById = async (_: IpcMainInvokeEvent, id: number) => {
    try {
      const template = await db.get(`
        SELECT * FROM document_templates WHERE id = ? AND is_active = 1
      `, [id])
      
      if (!template) {
        return { success: false, error: '模板不存在' }
      }
      
      // 解析模板内容
      let content = ''
      try {
        const templateContent = JSON.parse(template.template_content || '{}')
        content = templateContent.content || ''
      } catch (error) {
        console.error('解析模板内容失败:', error)
        content = template.template_content || ''
      }
      
      // 映射字段名称以匹配前端期望
      const mappedTemplate = {
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
        content: content,
        isSystem: Boolean(template.is_system),
        createdAt: template.created_at,
        updatedAt: template.updated_at
      }
      
      return { success: true, data: mappedTemplate }
    } catch (error) {
      console.error('获取模板详情失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '获取模板详情失败' }
    }
  }

  // 创建文档模板
  const handleCreateTemplate = async (_: IpcMainInvokeEvent, templateData: DocumentTemplate) => {
    try {
      const result = await db.run(`
        INSERT INTO document_templates (
          name, category, description, template_content, fields, file_type, is_system, is_active, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        templateData.name,
        templateData.category,
        templateData.description || null,
        JSON.stringify({ content: templateData.content }),
        JSON.stringify([]), // 默认空字段配置
        'html', // 默认HTML格式
        false, // 非系统模板
        true, // 激活状态
        null // 创建者ID，暂时为空
      ])
      
      return { success: true, data: { id: result.lastInsertRowid } }
    } catch (error) {
      console.error('创建模板失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '创建模板失败' }
    }
  }

  // 更新文档模板
  const handleUpdateTemplate = async (_: IpcMainInvokeEvent, id: number, templateData: DocumentTemplate) => {
    try {
      await db.run(`
        UPDATE document_templates SET 
          name = ?, category = ?, description = ?, template_content = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND is_system = 0
      `, [
        templateData.name,
        templateData.category,
        templateData.description || null,
        JSON.stringify({ content: templateData.content }),
        id
      ])

      return { success: true }
    } catch (error) {
      console.error('更新模板失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '更新模板失败' }
    }
  }

  // 删除文档模板
  const handleDeleteTemplate = async (_: IpcMainInvokeEvent, id: number) => {
    try {
      // 检查是否为系统模板
      const template = await db.get('SELECT is_system FROM document_templates WHERE id = ?', [id])
      if (template && template.is_system) {
        return { success: false, error: '系统模板不能删除' }
      }

      await db.run(`
        UPDATE document_templates SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `, [id])
      
      return { success: true }
    } catch (error) {
      console.error('删除文档模板失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '删除文档模板失败' }
    }
  }

  // 生成文档
  const handleGenerateDocument = async (_: IpcMainInvokeEvent, params: GenerateDocumentParams) => {
    try {
      const { template_id, data, output_path } = params
      
      // 获取模板
      const templateResult = await handleGetTemplateById(_, template_id)
      if (!templateResult.success) {
        return templateResult
      }
      
      const template = templateResult.data
      
      // 根据模板类型生成文档
      let filePath: string
      
      if (output_path) {
        filePath = output_path
      } else {
        // 选择保存路径
        const saveResult = await dialog.showSaveDialog({
          title: '保存文档',
          defaultPath: `${template.name}_${new Date().toISOString().split('T')[0]}.${template.file_type}`,
          filters: [
            { name: getFileTypeFilter(template.file_type), extensions: [template.file_type] }
          ]
        })

        if (saveResult.canceled || !saveResult.filePath) {
          return { success: false, error: '用户取消保存' }
        }
        
        filePath = saveResult.filePath
      }
      
      // 根据文件类型生成文档
      switch (template.file_type) {
        case 'xlsx':
          await generateExcelDocument(template, data, filePath)
          break
        case 'html':
          await generateHtmlDocument(template, data, filePath)
          break
        case 'pdf':
          // PDF生成需要额外的库支持，这里先生成HTML再转换
          const htmlPath = filePath.replace('.pdf', '.html')
          await generateHtmlDocument(template, data, htmlPath)
          // 这里可以集成PDF转换库
          break
        default:
          return { success: false, error: '不支持的文件类型' }
      }
      
      return { success: true, message: '文档生成成功', filePath }
    } catch (error) {
      console.error('生成文档失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '生成文档失败' }
    }
  }

  // 打开文档
  const handleOpenDocument = async (_: IpcMainInvokeEvent, filePath: string) => {
    try {
      if (!fs.existsSync(filePath)) {
        return { success: false, error: '文件不存在' }
      }
      
      await shell.openPath(filePath)
      return { success: true }
    } catch (error) {
      console.error('打开文档失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '打开文档失败' }
    }
  }

  // 初始化系统模板
  const handleInitSystemTemplates = async (_: IpcMainInvokeEvent) => {
    try {
      const systemTemplates = getSystemTemplates()
      
      for (const template of systemTemplates) {
        // 检查模板是否已存在
        const existing = await db.get(
          'SELECT id FROM document_templates WHERE name = ? AND is_system = 1',
          [template.name]
        )
        
        if (!existing) {
          await db.run(`
            INSERT INTO document_templates (
              name, category, description, template_content, fields,
              file_type, is_system, is_active, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            template.name,
            template.category,
            template.description,
            JSON.stringify(template.template_content),
            JSON.stringify(template.fields),
            template.file_type,
            true,
            true,
            1
          ])
        }
      }
      
      return { success: true, message: '系统模板初始化完成' }
    } catch (error) {
      console.error('初始化系统模板失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '初始化系统模板失败' }
    }
  }

  // 注册IPC处理器
  ipcMain.handle('templates:list', handleGetTemplates)
  ipcMain.handle('templates:getById', handleGetTemplateById)
  ipcMain.handle('templates:create', handleCreateTemplate)
  ipcMain.handle('templates:update', handleUpdateTemplate)
  ipcMain.handle('templates:delete', handleDeleteTemplate)
  ipcMain.handle('templates:generate', handleGenerateDocument)
  ipcMain.handle('templates:open', handleOpenDocument)
  ipcMain.handle('templates:initSystem', handleInitSystemTemplates)
}

// 辅助函数
function getFileTypeFilter(fileType: string): string {
  const filters = {
    pdf: 'PDF文件',
    docx: 'Word文档',
    xlsx: 'Excel文件',
    html: 'HTML文件'
  }
  return filters[fileType as keyof typeof filters] || '文件'
}

// 生成Excel文档
async function generateExcelDocument(template: any, data: any, filePath: string) {
  const wb = XLSX.utils.book_new()
  
  // 根据模板类型生成不同的Excel内容
  switch (template.category) {
    case 'class_list':
      generateClassListExcel(wb, data)
      break
    case 'grade_report':
      generateGradeReportExcel(wb, data)
      break
    case 'attendance':
      generateAttendanceExcel(wb, data)
      break
    default:
      generateGenericExcel(wb, template, data)
  }
  
  XLSX.writeFile(wb, filePath)
}

// 生成HTML文档
async function generateHtmlDocument(template: any, data: any, filePath: string) {
  let htmlContent = template.template_content.html || '<html><body><h1>{{title}}</h1></body></html>'
  
  // 替换模板变量
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`{{${key}}}`, 'g')
    htmlContent = htmlContent.replace(regex, String(value))
  }
  
  fs.writeFileSync(filePath, htmlContent, 'utf8')
}

// 生成班级名单Excel
function generateClassListExcel(wb: any, data: any) {
  const wsData = [
    ['序号', '姓名', '学号', '性别', '联系电话', '家长电话', '备注']
  ]
  
  data.students?.forEach((student: any, index: number) => {
    wsData.push([
      index + 1,
      student.name,
      student.student_id || '',
      student.gender || '',
      student.phone || '',
      student.parent_phone || '',
      student.notes || ''
    ])
  })
  
  const ws = XLSX.utils.aoa_to_sheet(wsData)
  ws['!cols'] = [
    { width: 8 },  // 序号
    { width: 15 }, // 姓名
    { width: 15 }, // 学号
    { width: 8 },  // 性别
    { width: 15 }, // 联系电话
    { width: 15 }, // 家长电话
    { width: 20 }  // 备注
  ]
  
  XLSX.utils.book_append_sheet(wb, ws, '班级名单')
}

// 生成成绩报告Excel
function generateGradeReportExcel(wb: any, data: any) {
  const wsData = [
    ['姓名', '学号', '科目', '成绩', '考试类型', '考试日期', '排名']
  ]
  
  data.grades?.forEach((grade: any) => {
    wsData.push([
      grade.student_name,
      grade.student_id || '',
      grade.subject,
      grade.score,
      grade.exam_type,
      grade.exam_date || '',
      grade.rank || ''
    ])
  })
  
  const ws = XLSX.utils.aoa_to_sheet(wsData)
  XLSX.utils.book_append_sheet(wb, ws, '成绩报告')
}

// 生成考勤表Excel
function generateAttendanceExcel(wb: any, data: any) {
  const wsData = [
    ['日期', '姓名', '学号', '出勤状态', '备注']
  ]
  
  data.attendance?.forEach((record: any) => {
    wsData.push([
      record.date,
      record.student_name,
      record.student_id || '',
      record.status,
      record.notes || ''
    ])
  })
  
  const ws = XLSX.utils.aoa_to_sheet(wsData)
  XLSX.utils.book_append_sheet(wb, ws, '考勤记录')
}

// 生成通用Excel
function generateGenericExcel(wb: any, template: any, data: any) {
  const wsData = []
  
  // 根据模板字段配置生成表头
  const headers = template.fields?.map((field: any) => field.label) || ['数据']
  wsData.push(headers)
  
  // 添加数据行
  if (Array.isArray(data.items)) {
    data.items.forEach((item: any) => {
      const row = template.fields?.map((field: any) => item[field.key] || '') || [JSON.stringify(item)]
      wsData.push(row)
    })
  }
  
  const ws = XLSX.utils.aoa_to_sheet(wsData)
  XLSX.utils.book_append_sheet(wb, ws, template.name)
}

// 系统模板已通过数据库初始化脚本插入，不再需要硬编码