import { ipcMain, IpcMainInvokeEvent } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import * as XLSX from 'xlsx'
import mammoth from 'mammoth'
import { PDFExtract } from 'pdf.js-extract'

export interface ParsedFile {
  fileName: string
  fileType: string
  content: string
  variables: string[]
  metadata?: any
}

export interface VariableMatch {
  key: string
  name: string
  type: 'text' | 'number' | 'date' | 'select'
  position: number
  context: string
}

// 变量识别模式
const VARIABLE_PATTERNS = [
  // 中文模式
  /(?:姓名|学生姓名|学员姓名)[:：]?\s*([^\s\n，,。.]{1,20})/g,
  /(?:班级|所在班级)[:：]?\s*([^\s\n，,。.]{1,20})/g,
  /(?:学号|学生学号|编号)[:：]?\s*([^\s\n，,。.]{1,20})/g,
  /(?:日期|时间|年月日)[:：]?\s*(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[日]?)/g,
  /(?:成绩|分数|得分)[:：]?\s*(\d+(?:\.\d+)?)/g,
  /(?:科目|学科|课程)[:：]?\s*([^\s\n，,。.]{1,20})/g,
  /(?:教师|老师|任课教师)[:：]?\s*([^\s\n，,。.]{1,20})/g,
  /(?:学期|学年)[:：]?\s*([^\s\n，,。.]{1,20})/g,
  
  // 英文模式
  /(?:name|student\s+name)[:：]?\s*([a-zA-Z\s]{2,30})/gi,
  /(?:class|grade)[:：]?\s*([^\s\n，,。.]{1,20})/gi,
  /(?:id|student\s+id)[:：]?\s*([^\s\n，,。.]{1,20})/gi,
  /(?:date|time)[:：]?\s*(\d{4}[-/]\d{1,2}[-/]\d{1,2})/gi,
  /(?:score|grade|mark)[:：]?\s*(\d+(?:\.\d+)?)/gi,
  
  // 占位符模式
  /\{\{([^}]+)\}\}/g,
  /\[([^\]]+)\]/g,
  /_+([^_\s]+)_+/g,
  /\$\{([^}]+)\}/g
]

// 变量映射表
const VARIABLE_MAPPING = {
  '姓名': 'student.name',
  '学生姓名': 'student.name',
  '学员姓名': 'student.name',
  'name': 'student.name',
  'student name': 'student.name',
  
  '班级': 'class.name',
  '所在班级': 'class.name',
  'class': 'class.name',
  'grade': 'class.name',
  
  '学号': 'student.id',
  '学生学号': 'student.id',
  '编号': 'student.id',
  'id': 'student.id',
  'student id': 'student.id',
  
  '日期': 'current_date',
  '时间': 'current_time',
  '年月日': 'current_date',
  'date': 'current_date',
  'time': 'current_time',
  
  '成绩': 'grade.score',
  '分数': 'grade.score',
  '得分': 'grade.score',
  'score': 'grade.score',
  'mark': 'grade.score',
  
  '科目': 'grade.subject',
  '学科': 'grade.subject',
  '课程': 'grade.subject',
  'subject': 'grade.subject',
  
  '教师': 'teacher.name',
  '老师': 'teacher.name',
  '任课教师': 'teacher.name',
  'teacher': 'teacher.name',
  
  '学期': 'semester',
  '学年': 'academic_year'
}

export function setupFileParserHandlers() {
  // 解析文件
  ipcMain.handle('file:parse', async (event: IpcMainInvokeEvent, filePath: string) => {
    try {
      const result = await parseFile(filePath)
      return { success: true, data: result }
    } catch (error) {
      console.error('文件解析失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '文件解析失败' }
    }
  })
  
  // 提取变量
  ipcMain.handle('file:extractVariables', async (event: IpcMainInvokeEvent, content: string) => {
    try {
      const variables = extractVariables(content)
      return { success: true, data: variables }
    } catch (error) {
      console.error('变量提取失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '变量提取失败' }
    }
  })
  
  // 转换为模板
  ipcMain.handle('file:convertToTemplate', async (event: IpcMainInvokeEvent, parsedFile: ParsedFile) => {
    try {
      const template = convertToTemplate(parsedFile)
      return { success: true, data: template }
    } catch (error) {
      console.error('模板转换失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '模板转换失败' }
    }
  })
}

// 解析文件主函数
export async function parseFile(filePath: string): Promise<ParsedFile> {
  const fileName = path.basename(filePath)
  const fileExt = path.extname(filePath).toLowerCase()
  
  let content = ''
  let metadata = {}
  
  switch (fileExt) {
    case '.docx':
    case '.doc':
      const wordResult = await parseWordFile(filePath)
      content = wordResult.content
      metadata = wordResult.metadata
      break
      
    case '.xlsx':
    case '.xls':
      const excelResult = await parseExcelFile(filePath)
      content = excelResult.content
      metadata = excelResult.metadata
      break
      
    case '.pdf':
      content = await parsePdfFile(filePath)
      break
      
    case '.txt':
    case '.md':
      content = await parseTextFile(filePath)
      break
      
    default:
      throw new Error(`不支持的文件格式: ${fileExt}`)
  }
  
  // 提取变量
  const variables = extractVariables(content)
  
  return {
    fileName,
    fileType: fileExt.substring(1),
    content,
    variables,
    metadata
  }
}

// 解析Word文档
async function parseWordFile(filePath: string): Promise<{ content: string; metadata: any }> {
  try {
    const buffer = fs.readFileSync(filePath)
    const result = await mammoth.convertToHtml({ buffer })
    
    // 提取元数据
    const metadata = {
      messages: result.messages,
      styles: result.value.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || []
    }
    
    return {
      content: result.value,
      metadata
    }
  } catch (error) {
    throw new Error(`Word文档解析失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

// 解析Excel文件
async function parseExcelFile(filePath: string): Promise<{ content: string; metadata: any }> {
  try {
    const workbook = XLSX.readFile(filePath)
    const sheetNames = workbook.SheetNames
    let htmlContent = ''
    
    const metadata = {
      sheetNames,
      sheetCount: sheetNames.length
    }
    
    // 转换每个工作表
    sheetNames.forEach((sheetName, index) => {
      const worksheet = workbook.Sheets[sheetName]
      const htmlTable = XLSX.utils.sheet_to_html(worksheet)
      
      htmlContent += `<h3>工作表: ${sheetName}</h3>`
      htmlContent += htmlTable
      
      if (index < sheetNames.length - 1) {
        htmlContent += '<hr>'
      }
    })
    
    return {
      content: htmlContent,
      metadata
    }
  } catch (error) {
    throw new Error(`Excel文件解析失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

// 解析PDF文件
async function parsePdfFile(filePath: string): Promise<string> {
  try {
    const pdfExtract = new PDFExtract()
    const buffer = fs.readFileSync(filePath)
    
    return new Promise((resolve, reject) => {
      pdfExtract.extractBuffer(buffer, {}, (err, data) => {
        if (err) {
          reject(new Error(`PDF解析失败: ${err.message}`))
          return
        }
        
        let content = ''
        data?.pages.forEach((page, pageIndex) => {
          content += `<h3>第 ${pageIndex + 1} 页</h3>`
          page.content.forEach(item => {
            if (item.str.trim()) {
              content += `<p>${item.str}</p>`
            }
          })
        })
        
        resolve(content)
      })
    })
  } catch (error) {
    throw new Error(`PDF文件解析失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

// 解析文本文件
async function parseTextFile(filePath: string): Promise<string> {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    
    // 将纯文本转换为HTML格式
    const htmlContent = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => `<p>${line}</p>`)
      .join('')
    
    return htmlContent
  } catch (error) {
    throw new Error(`文本文件解析失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

// 提取变量
export function extractVariables(content: string): string[] {
  const variables = new Set<string>()
  const plainText = content.replace(/<[^>]*>/g, ' ') // 移除HTML标签
  
  // 使用所有模式匹配变量
  VARIABLE_PATTERNS.forEach(pattern => {
    let match
    const regex = new RegExp(pattern.source, pattern.flags)
    
    while ((match = regex.exec(plainText)) !== null) {
      const matchedText = match[1] || match[0]
      const cleanText = matchedText.trim()
      
      if (cleanText && cleanText.length > 0) {
        // 尝试映射到标准变量名
        const mappedVariable = mapToStandardVariable(cleanText)
        if (mappedVariable) {
          variables.add(`{{${mappedVariable}}}`)
        } else {
          // 如果没有映射，使用原始文本创建变量
          const variableName = cleanText.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')
          variables.add(`{{${variableName}}}`)
        }
      }
    }
  })
  
  return Array.from(variables)
}

// 映射到标准变量名
function mapToStandardVariable(text: string): string | null {
  const lowerText = text.toLowerCase().trim()
  
  // 直接匹配
  if (VARIABLE_MAPPING[lowerText]) {
    return VARIABLE_MAPPING[lowerText]
  }
  
  // 模糊匹配
  for (const [key, value] of Object.entries(VARIABLE_MAPPING)) {
    if (lowerText.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerText)) {
      return value
    }
  }
  
  return null
}

// 转换为模板
export function convertToTemplate(parsedFile: ParsedFile): any {
  let templateContent = parsedFile.content
  
  // 替换识别的变量为模板变量
  parsedFile.variables.forEach(variable => {
    const variableName = variable.replace(/[{}]/g, '')
    const patterns = generateVariablePatterns(variableName)
    
    patterns.forEach(pattern => {
      templateContent = templateContent.replace(pattern, variable)
    })
  })
  
  return {
    name: `导入模板_${parsedFile.fileName}`,
    category: 'imported',
    description: `从 ${parsedFile.fileName} 导入的模板`,
    content: templateContent,
    variables: parsedFile.variables,
    fileType: parsedFile.fileType,
    metadata: parsedFile.metadata
  }
}

// 生成变量匹配模式
function generateVariablePatterns(variableName: string): RegExp[] {
  const patterns: RegExp[] = []
  
  // 根据变量名生成可能的匹配模式
  const parts = variableName.split('.')
  const lastPart = parts[parts.length - 1]
  
  // 查找反向映射
  const reverseMapping: { [key: string]: string[] } = {}
  Object.entries(VARIABLE_MAPPING).forEach(([key, value]) => {
    if (!reverseMapping[value]) {
      reverseMapping[value] = []
    }
    reverseMapping[value].push(key)
  })
  
  if (reverseMapping[variableName]) {
    reverseMapping[variableName].forEach(keyword => {
      patterns.push(new RegExp(`${keyword}[:：]?\\s*([^\\s\\n，,。.]{1,20})`, 'gi'))
    })
  }
  
  return patterns
}

// 智能变量建议
export function suggestVariables(content: string): VariableMatch[] {
  const suggestions: VariableMatch[] = []
  const plainText = content.replace(/<[^>]*>/g, ' ')
  
  VARIABLE_PATTERNS.forEach((pattern, patternIndex) => {
    let match
    const regex = new RegExp(pattern.source, pattern.flags)
    
    while ((match = regex.exec(plainText)) !== null) {
      const matchedText = match[1] || match[0]
      const cleanText = matchedText.trim()
      
      if (cleanText && cleanText.length > 0) {
        const mappedVariable = mapToStandardVariable(cleanText)
        const context = plainText.substring(
          Math.max(0, match.index - 20),
          Math.min(plainText.length, match.index + match[0].length + 20)
        )
        
        suggestions.push({
          key: mappedVariable || cleanText,
          name: cleanText,
          type: inferVariableType(cleanText),
          position: match.index,
          context: context.trim()
        })
      }
    }
  })
  
  // 去重并排序
  const uniqueSuggestions = suggestions.filter((suggestion, index, self) => 
    index === self.findIndex(s => s.key === suggestion.key)
  )
  
  return uniqueSuggestions.sort((a, b) => a.position - b.position)
}

// 推断变量类型
function inferVariableType(text: string): 'text' | 'number' | 'date' | 'select' {
  // 数字类型
  if (/^\d+(\.\d+)?$/.test(text)) {
    return 'number'
  }
  
  // 日期类型
  if (/\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[日]?/.test(text)) {
    return 'date'
  }
  
  // 选择类型（常见的固定值）
  const selectOptions = ['男', '女', '是', '否', '优秀', '良好', '及格', '不及格']
  if (selectOptions.includes(text)) {
    return 'select'
  }
  
  // 默认文本类型
  return 'text'
}

// 验证模板语法
export function validateTemplate(content: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // 检查变量语法
  const variableRegex = /\{\{([^}]+)\}\}/g
  let match
  
  while ((match = variableRegex.exec(content)) !== null) {
    const variableName = match[1].trim()
    
    // 检查变量名是否有效
    if (!variableName) {
      errors.push(`空变量名: ${match[0]}`)
    } else if (!/^[a-zA-Z][a-zA-Z0-9_.]*$/.test(variableName)) {
      errors.push(`无效变量名: ${variableName}`)
    }
  }
  
  // 检查HTML语法（基础检查）
  const openTags = content.match(/<[^/][^>]*>/g) || []
  const closeTags = content.match(/<\/[^>]*>/g) || []
  
  if (openTags.length !== closeTags.length) {
    errors.push('HTML标签不匹配')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}