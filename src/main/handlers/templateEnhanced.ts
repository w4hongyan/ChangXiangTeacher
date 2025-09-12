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
  content: string
  variables?: TemplateVariable[]
  settings?: TemplateSettings
  preview_image?: string
  tags?: string[]
  version?: string
  is_public?: boolean
  is_system?: boolean
  is_active?: boolean
  download_count?: number
  rating?: number
  created_by?: number
  created_at?: string
  updated_at?: string
}

export interface TemplateVariable {
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean' | 'table'
  required?: boolean
  default_value?: any
  options?: string[] // for select/multiselect
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
  description?: string
}

export interface TemplateSettings {
  output_format: 'html' | 'docx' | 'pdf' | 'xlsx'
  page_size?: 'A4' | 'A3' | 'Letter'
  orientation?: 'portrait' | 'landscape'
  margins?: {
    top: number
    right: number
    bottom: number
    left: number
  }
  font_family?: string
  font_size?: number
  auto_save?: boolean
}

export interface GenerateDocumentParams {
  template_id: number
  variables: Record<string, any>
  output_path?: string
  format?: 'html' | 'docx' | 'pdf' | 'xlsx'
}

export function setupEnhancedTemplateHandlers(db: DatabaseManager) {
  
  // 获取模板列表（增强版）
  const handleGetTemplatesEnhanced = async (_: IpcMainInvokeEvent, params: any = {}) => {
    try {
      const {
        category,
        keyword,
        is_system,
        is_active = true,
        tags,
        sort_by = 'created_at',
        sort_order = 'DESC',
        limit = 50,
        offset = 0
      } = params

      let whereClause = 'WHERE is_active = ?'
      let paramsArray: any[] = [is_active ? 1 : 0]

      if (category) {
        whereClause += ' AND category = ?'
        paramsArray.push(category)
      }

      if (keyword) {
        whereClause += ' AND (name LIKE ? OR description LIKE ? OR tags LIKE ?)'
        paramsArray.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
      }

      if (is_system !== undefined) {
        whereClause += ' AND is_system = ?'
        paramsArray.push(is_system ? 1 : 0)
      }

      if (tags && tags.length > 0) {
        const tagConditions = tags.map(() => 'tags LIKE ?').join(' OR ')
        whereClause += ` AND (${tagConditions})`
        tags.forEach((tag: string) => paramsArray.push(`%${tag}%`))
      }

      const query = `
        SELECT * FROM document_templates
        ${whereClause}
        ORDER BY ${sort_by} ${sort_order}
        LIMIT ? OFFSET ?
      `
      paramsArray.push(limit, offset)

      const templates = await db.all(query, paramsArray)
      
      // 解析JSON字段
      const enhancedTemplates = templates.map(template => ({
        ...template,
        variables: template.variables ? JSON.parse(template.variables) : [],
        settings: template.settings ? JSON.parse(template.settings) : {},
        tags: template.tags ? template.tags.split(',').map((tag: string) => tag.trim()) : []
      }))
      
      return { success: true, data: enhancedTemplates }
    } catch (error) {
      console.error('获取模板列表失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '获取模板列表失败' }
    }
  }

  // 创建或更新模板（增强版）
  const handleSaveTemplateEnhanced = async (_: IpcMainInvokeEvent, templateData: DocumentTemplate) => {
    try {
      const {
        id,
        name,
        category,
        description,
        content,
        variables = [],
        settings = {},
        preview_image,
        tags = [],
        version = '1.0.0',
        is_public = false,
        is_system = false
      } = templateData

      const variablesJson = JSON.stringify(variables)
      const settingsJson = JSON.stringify(settings)
      const tagsString = Array.isArray(tags) ? tags.join(', ') : ''

      if (id) {
        // 更新模板
        await db.run(`
          UPDATE document_templates SET 
            name = ?, category = ?, description = ?, content = ?,
            variables = ?, settings = ?, preview_image = ?, tags = ?,
            version = ?, is_public = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND is_system = 0
        `, [
          name, category, description, content,
          variablesJson, settingsJson, preview_image, tagsString,
          version, is_public ? 1 : 0, id
        ])
        
        return { success: true, data: { id } }
      } else {
        // 创建新模板
        const result = await db.run(`
          INSERT INTO document_templates (
            name, category, description, content, variables, settings,
            preview_image, tags, version, is_public, is_system, is_active, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          name, category, description, content, variablesJson, settingsJson,
          preview_image, tagsString, version, is_public ? 1 : 0, is_system ? 1 : 0, 1, 1
        ])
        
        return { success: true, data: { id: result.lastInsertRowid } }
      }
    } catch (error) {
      console.error('保存模板失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '保存模板失败' }
    }
  }

  // 解析模板变量
  const handleParseTemplateVariables = async (_: IpcMainInvokeEvent, content: string) => {
    try {
      const variables: TemplateVariable[] = []
      const variablePattern = /\{\{\s*([^}]+)\s*\}\}/g
      const matches = content.matchAll(variablePattern)
      
      const uniqueVariables = new Set<string>()
      
      for (const match of matches) {
        const variableName = match[1].trim()
        if (!uniqueVariables.has(variableName)) {
          uniqueVariables.add(variableName)
          
          // 智能推断变量类型
          let type: TemplateVariable['type'] = 'text'
          if (variableName.includes('date') || variableName.includes('time')) {
            type = 'date'
          } else if (variableName.includes('count') || variableName.includes('number') || variableName.includes('score')) {
            type = 'number'
          } else if (variableName.includes('list') || variableName.includes('table')) {
            type = 'table'
          }
          
          variables.push({
            name: variableName,
            label: variableName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            type,
            required: true,
            description: `请输入${variableName}`
          })
        }
      }
      
      return { success: true, data: variables }
    } catch (error) {
      console.error('解析模板变量失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '解析模板变量失败' }
    }
  }

  // 生成文档（增强版）
  const handleGenerateDocumentEnhanced = async (_: IpcMainInvokeEvent, params: GenerateDocumentParams) => {
    try {
      const { template_id, variables, output_path, format } = params
      
      // 获取模板
      const template = await db.get('SELECT * FROM document_templates WHERE id = ? AND is_active = 1', [template_id])
      if (!template) {
        return { success: false, error: '模板不存在' }
      }
      
      // 解析模板设置
      const settings = template.settings ? JSON.parse(template.settings) : {}
      const outputFormat = format || settings.output_format || 'html'
      
      // 替换模板变量
      let processedContent = template.content
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g')
        processedContent = processedContent.replace(regex, String(value))
      }
      
      // 确定输出路径
      let filePath: string
      if (output_path) {
        filePath = output_path
      } else {
        const saveResult = await dialog.showSaveDialog({
          title: '保存文档',
          defaultPath: `${template.name}_${new Date().toISOString().split('T')[0]}.${outputFormat}`,
          filters: [
            { name: getFileTypeFilter(outputFormat), extensions: [outputFormat] }
          ]
        })
        
        if (saveResult.canceled || !saveResult.filePath) {
          return { success: false, error: '用户取消保存' }
        }
        
        filePath = saveResult.filePath
      }
      
      // 根据格式生成文档
      switch (outputFormat) {
        case 'html':
          await generateHtmlDocumentEnhanced(template, processedContent, filePath, settings)
          break
        case 'xlsx':
          await generateExcelDocumentEnhanced(template, variables, filePath, settings)
          break
        case 'docx':
          // 需要集成docx库
          return { success: false, error: 'DOCX格式暂未支持' }
        case 'pdf':
          // 需要集成PDF库
          return { success: false, error: 'PDF格式暂未支持' }
        default:
          return { success: false, error: '不支持的文件格式' }
      }
      
      // 记录生成历史
      await db.run(`
        INSERT INTO document_generations (
          template_id, template_name, output_format, file_path, variables
        ) VALUES (?, ?, ?, ?, ?)
      `, [
        template_id,
        template.name,
        outputFormat,
        filePath,
        JSON.stringify(variables)
      ])
      
      return { success: true, message: '文档生成成功', filePath }
    } catch (error) {
      console.error('生成文档失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '生成文档失败' }
    }
  }

  // 获取生成历史
  const handleGetGenerationHistory = async (_: IpcMainInvokeEvent, limit = 20) => {
    try {
      const history = await db.all(`
        SELECT * FROM document_generations 
        ORDER BY created_at DESC 
        LIMIT ?
      `, [limit])
      
      const processedHistory = history.map(item => ({
        ...item,
        variables: item.variables ? JSON.parse(item.variables) : {}
      }))
      
      return { success: true, data: processedHistory }
    } catch (error) {
      console.error('获取生成历史失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '获取生成历史失败' }
    }
  }

  // 注册IPC处理器
  ipcMain.handle('template:getTemplatesEnhanced', handleGetTemplatesEnhanced)
  ipcMain.handle('template:saveTemplateEnhanced', handleSaveTemplateEnhanced)
  ipcMain.handle('template:parseVariables', handleParseTemplateVariables)
  ipcMain.handle('template:generateDocumentEnhanced', handleGenerateDocumentEnhanced)
  ipcMain.handle('template:getGenerationHistory', handleGetGenerationHistory)
}

// 辅助函数
function getFileTypeFilter(fileType: string): string {
  const filters: Record<string, string> = {
    html: 'HTML文件',
    xlsx: 'Excel文件',
    docx: 'Word文档',
    pdf: 'PDF文档'
  }
  return filters[fileType] || '所有文件'
}

// 生成HTML文档（增强版）
async function generateHtmlDocumentEnhanced(
  template: any, 
  content: string, 
  filePath: string, 
  settings: any
) {
  const htmlTemplate = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${template.name}</title>
    <style>
        body {
            font-family: ${settings.font_family || '"Microsoft YaHei", Arial, sans-serif'};
            font-size: ${settings.font_size || 14}px;
            line-height: 1.6;
            margin: ${settings.margins?.top || 20}px ${settings.margins?.right || 20}px ${settings.margins?.bottom || 20}px ${settings.margins?.left || 20}px;
            color: #333;
        }
        .template-header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #007bff;
            padding-bottom: 10px;
        }
        .template-content {
            white-space: pre-wrap;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        .footer {
            margin-top: 50px;
            text-align: right;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="template-header">
        <h1>${template.name}</h1>
    </div>
    <div class="template-content">
        ${content}
    </div>
    <div class="footer">
        生成时间: ${new Date().toLocaleString('zh-CN')}
    </div>
</body>
</html>
  `
  
  await fs.promises.writeFile(filePath, htmlTemplate, 'utf-8')
}

// 生成Excel文档（增强版）
async function generateExcelDocumentEnhanced(
  template: any,
  variables: Record<string, any>,
  filePath: string,
  settings: any
) {
  const wb = XLSX.utils.book_new()
  
  // 创建工作表
  const wsData = [
    [template.name],
    [''],
    ['变量名', '值']
  ]
  
  // 添加变量数据
  for (const [key, value] of Object.entries(variables)) {
    wsData.push([key, String(value)])
  }
  
  const ws = XLSX.utils.aoa_to_sheet(wsData)
  
  // 设置列宽
  ws['!cols'] = [
    { width: 20 },
    { width: 30 }
  ]
  
  XLSX.utils.book_append_sheet(wb, ws, '模板数据')
  XLSX.writeFile(wb, filePath)
}