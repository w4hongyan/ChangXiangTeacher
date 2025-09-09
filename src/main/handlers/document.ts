import { ipcMain, IpcMainInvokeEvent } from 'electron'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import type { DatabaseManager } from '../database'
import type { DocumentTemplate, DocumentTemplateFormData } from '../../renderer/types/document'

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

// 获取文档存储目录
const getDocumentDir = () => {
  const appPath = app.getAppPath()
  const documentDir = path.join(path.dirname(appPath), 'documents')
  if (!fs.existsSync(documentDir)) {
    fs.mkdirSync(documentDir, { recursive: true })
  }
  return documentDir
}

export function setupDocumentHandlers(db: DatabaseManager) {
  // 获取所有文档模板
  const handleListDocuments = async (_: IpcMainInvokeEvent) => {
    try {
      const query = 'SELECT * FROM document_templates WHERE is_active = 1 ORDER BY created_at DESC'
      const templates = await db.all(query)
      
      // 确保日期字段是字符串格式
      const formattedTemplates = templates.map(template => ensureStringDates(template));
      
      return { success: true, data: formattedTemplates }
    } catch (error) {
      console.error('获取文档模板列表失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '获取文档模板列表失败' }
    }
  }
  ipcMain.handle('documents:list', handleListDocuments)

  // 根据分类获取文档模板
  const handleListDocumentsByCategory = async (_: IpcMainInvokeEvent, category: string) => {
    try {
      const query = 'SELECT * FROM document_templates WHERE category = ? AND is_active = 1 ORDER BY created_at DESC'
      const templates = await db.all(query, [category])
      
      // 确保日期字段是字符串格式
      const formattedTemplates = templates.map(template => ensureStringDates(template));
      
      return { success: true, data: formattedTemplates }
    } catch (error) {
      console.error('根据分类获取文档模板失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '根据分类获取文档模板失败' }
    }
  }
  ipcMain.handle('documents:listByCategory', handleListDocumentsByCategory)

  // 根据ID获取文档模板
  const handleGetDocumentById = async (_: IpcMainInvokeEvent, id: number) => {
    try {
      const query = 'SELECT * FROM document_templates WHERE id = ? AND is_active = 1'
      const template = await db.get(query, [id])
      
      if (!template) {
        return { success: false, error: '文档模板不存在' }
      }
      
      // 确保日期字段是字符串格式
      const formattedTemplate = ensureStringDates(template);
      
      return { success: true, data: formattedTemplate }
    } catch (error) {
      console.error('获取文档模板失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '获取文档模板失败' }
    }
  }
  ipcMain.handle('documents:getById', handleGetDocumentById)

  // 创建文档模板
  const handleCreateDocument = async (_: IpcMainInvokeEvent, data: DocumentTemplateFormData) => {
    try {
      const insertQuery = `
        INSERT INTO document_templates (
          name, description, category, content, file_path, file_size
        ) VALUES (?, ?, ?, ?, ?, ?)
      `
      
      const params = [
        data.name,
        data.description,
        data.category,
        data.content,
        data.file_path,
        data.file_size
      ]

      const result = await db.run(insertQuery, params)
      const documentId = result.lastID || result.lastInsertRowid

      if (!documentId) {
        throw new Error('无法获取新创建的文档模板ID')
      }

      // 返回创建的文档模板
      const newDocument = await db.get('SELECT * FROM document_templates WHERE id = ?', [Number(documentId)])
      
      // 确保日期字段是字符串格式
      const formattedDocument = ensureStringDates(newDocument);
      
      return { success: true, data: formattedDocument }
    } catch (error) {
      console.error('创建文档模板失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '创建文档模板失败' }
    }
  }
  ipcMain.handle('documents:create', handleCreateDocument)

  // 更新文档模板
  const handleUpdateDocument = async (_: IpcMainInvokeEvent, id: number, data: DocumentTemplateFormData) => {
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

      const query = `UPDATE document_templates SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
      values.push(id)

      await db.run(query, values)

      // 返回更新后的文档模板
      const updatedDocument = await db.get('SELECT * FROM document_templates WHERE id = ?', [id])
      
      // 确保日期字段是字符串格式
      const formattedDocument = ensureStringDates(updatedDocument);
      
      return { success: true, data: formattedDocument }
    } catch (error) {
      console.error('更新文档模板失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '更新文档模板失败' }
    }
  }
  ipcMain.handle('documents:update', handleUpdateDocument)

  // 删除文档模板
  const handleDeleteDocument = async (_: IpcMainInvokeEvent, id: number) => {
    try {
      // 软删除，将is_active设置为0
      await db.run('UPDATE document_templates SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id])
      return { success: true }
    } catch (error) {
      console.error('删除文档模板失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '删除文档模板失败' }
    }
  }
  ipcMain.handle('documents:delete', handleDeleteDocument)

  // 下载文档模板
  const handleDownloadDocument = async (_: IpcMainInvokeEvent, id: number) => {
    try {
      const query = 'SELECT * FROM document_templates WHERE id = ? AND is_active = 1'
      const template = await db.get(query, [id])
      
      if (!template) {
        return { success: false, error: '文档模板不存在' }
      }
      
      // 增加下载次数
      await db.run('UPDATE document_templates SET download_count = download_count + 1 WHERE id = ?', [id])
      
      // 如果有文件路径，返回文件路径
      if (template.file_path) {
        return { success: true, data: { file_path: template.file_path } }
      }
      
      // 如果没有文件路径但有内容，创建临时文件
      if (template.content) {
        const documentDir = getDocumentDir()
        const fileName = `${template.name}_${Date.now()}.txt`
        const filePath = path.join(documentDir, fileName)
        
        // 写入文件
        fs.writeFileSync(filePath, template.content, 'utf8')
        
        // 更新数据库中的文件路径
        await db.run('UPDATE document_templates SET file_path = ? WHERE id = ?', [filePath, id])
        
        return { success: true, data: { file_path: filePath } }
      }
      
      return { success: false, error: '文档模板没有内容或文件' }
    } catch (error) {
      console.error('下载文档模板失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '下载文档模板失败' }
    }
  }
  ipcMain.handle('documents:download', handleDownloadDocument)

  // 搜索文档模板
  const handleSearchDocuments = async (_: IpcMainInvokeEvent, keyword: string) => {
    try {
      const query = `
        SELECT * FROM document_templates 
        WHERE (name LIKE ? OR description LIKE ? OR category LIKE ?) 
        AND is_active = 1 
        ORDER BY created_at DESC
      `
      const searchKeyword = `%${keyword}%`
      const templates = await db.all(query, [searchKeyword, searchKeyword, searchKeyword])
      
      // 确保日期字段是字符串格式
      const formattedTemplates = templates.map(template => ensureStringDates(template));
      
      return { success: true, data: formattedTemplates }
    } catch (error) {
      console.error('搜索文档模板失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '搜索文档模板失败' }
    }
  }
  ipcMain.handle('documents:search', handleSearchDocuments)
}