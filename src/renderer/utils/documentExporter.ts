import { ElMessage } from 'element-plus'

// 文档导出格式类型
export type ExportFormat = 'pdf' | 'word' | 'excel' | 'html' | 'txt'

// 导出选项接口
export interface ExportOptions {
  format: ExportFormat
  filename?: string
  title?: string
  content: string
  metadata?: {
    author?: string
    subject?: string
    keywords?: string[]
    creator?: string
  }
  pageSettings?: {
    size?: 'A4' | 'A3' | 'Letter'
    orientation?: 'portrait' | 'landscape'
    margins?: {
      top: number
      right: number
      bottom: number
      left: number
    }
  }
}

// 文档导出结果
export interface ExportResult {
  success: boolean
  message: string
  filePath?: string
  error?: string
}

/**
 * 文档导出器类
 * 支持多种格式的文档导出功能
 */
export class DocumentExporter {
  /**
   * 导出文档
   * @param options 导出选项
   * @returns 导出结果
   */
  static async exportDocument(options: ExportOptions): Promise<ExportResult> {
    try {
      const { format, filename, content } = options
      
      // 生成默认文件名
      const defaultFilename = filename || `document_${Date.now()}`
      
      switch (format) {
        case 'pdf':
          return await this.exportToPDF(options, defaultFilename)
        case 'word':
          return await this.exportToWord(options, defaultFilename)
        case 'excel':
          return await this.exportToExcel(options, defaultFilename)
        case 'html':
          return await this.exportToHTML(options, defaultFilename)
        case 'txt':
          return await this.exportToText(options, defaultFilename)
        default:
          throw new Error(`不支持的导出格式: ${format}`)
      }
    } catch (error) {
      console.error('文档导出失败:', error)
      return {
        success: false,
        message: '导出失败',
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  /**
   * 导出为PDF格式
   */
  private static async exportToPDF(options: ExportOptions, filename: string): Promise<ExportResult> {
    try {
      // 使用浏览器的打印功能生成PDF
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        throw new Error('无法打开打印窗口')
      }

      const { content, title, pageSettings } = options
      const margins = pageSettings?.margins || { top: 20, right: 20, bottom: 20, left: 20 }
      
      // 构建HTML内容
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${title || filename}</title>
          <style>
            @page {
              size: ${pageSettings?.size || 'A4'} ${pageSettings?.orientation || 'portrait'};
              margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;
            }
            body {
              font-family: 'Microsoft YaHei', Arial, sans-serif;
              font-size: 14px;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
            }
            h1, h2, h3, h4, h5, h6 {
              color: #2c3e50;
              margin-top: 1.5em;
              margin-bottom: 0.5em;
            }
            h1 { font-size: 24px; }
            h2 { font-size: 20px; }
            h3 { font-size: 16px; }
            p { margin: 0.5em 0; }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 1em 0;
            }
            table, th, td {
              border: 1px solid #ddd;
            }
            th, td {
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            ul, ol {
              margin: 0.5em 0;
              padding-left: 2em;
            }
            .header {
              text-align: center;
              margin-bottom: 2em;
              border-bottom: 2px solid #3498db;
              padding-bottom: 1em;
            }
            .footer {
              margin-top: 2em;
              padding-top: 1em;
              border-top: 1px solid #ddd;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${title || '文档'}</h1>
            <p>生成时间: ${new Date().toLocaleString()}</p>
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            <p>由长湘教师助手生成 - ${new Date().toLocaleDateString()}</p>
          </div>
        </body>
        </html>
      `

      printWindow.document.write(htmlContent)
      printWindow.document.close()
      
      // 等待内容加载完成后打印
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 500)
      }

      return {
        success: true,
        message: 'PDF导出成功，请在打印对话框中选择"另存为PDF"'
      }
    } catch (error) {
      throw new Error(`PDF导出失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 导出为Word格式
   */
  private static async exportToWord(options: ExportOptions, filename: string): Promise<ExportResult> {
    try {
      const { content, title, metadata } = options
      
      // 创建Word文档的HTML格式
      const wordContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office"
              xmlns:w="urn:schemas-microsoft-com:office:word"
              xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <title>${title || filename}</title>
          <!--[if gte mso 9]>
          <xml>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>90</w:Zoom>
              <w:DoNotPromptForConvert/>
              <w:DoNotShowInsertionsAndDeletions/>
            </w:WordDocument>
          </xml>
          <![endif]-->
          <style>
            @page {
              size: A4;
              margin: 2cm;
            }
            body {
              font-family: 'Microsoft YaHei', '宋体', Arial;
              font-size: 12pt;
              line-height: 1.5;
              color: #000;
            }
            h1 { font-size: 18pt; font-weight: bold; }
            h2 { font-size: 16pt; font-weight: bold; }
            h3 { font-size: 14pt; font-weight: bold; }
            p { margin: 6pt 0; }
            table {
              border-collapse: collapse;
              width: 100%;
            }
            table, th, td {
              border: 1pt solid black;
            }
            th, td {
              padding: 4pt;
            }
          </style>
        </head>
        <body>
          <div style="text-align: center; margin-bottom: 20pt;">
            <h1>${title || '文档'}</h1>
            <p>生成时间: ${new Date().toLocaleString()}</p>
          </div>
          ${content}
          <div style="margin-top: 20pt; text-align: center; font-size: 10pt; color: #666;">
            <p>由长湘教师助手生成</p>
          </div>
        </body>
        </html>
      `

      // 创建Blob并下载
      const blob = new Blob([wordContent], {
        type: 'application/msword;charset=utf-8'
      })
      
      this.downloadFile(blob, `${filename}.doc`)

      return {
        success: true,
        message: 'Word文档导出成功'
      }
    } catch (error) {
      throw new Error(`Word导出失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 导出为Excel格式
   */
  private static async exportToExcel(options: ExportOptions, filename: string): Promise<ExportResult> {
    try {
      const { content, title } = options
      
      // 将HTML内容转换为Excel格式
      // 这里使用简单的HTML表格格式，Excel可以识别
      const excelContent = `
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            table { border-collapse: collapse; }
            th, td { border: 1px solid #000; padding: 5px; }
            th { background-color: #f0f0f0; font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>${title || '数据导出'}</h2>
          <p>导出时间: ${new Date().toLocaleString()}</p>
          ${content}
        </body>
        </html>
      `

      const blob = new Blob([excelContent], {
        type: 'application/vnd.ms-excel;charset=utf-8'
      })
      
      this.downloadFile(blob, `${filename}.xls`)

      return {
        success: true,
        message: 'Excel文档导出成功'
      }
    } catch (error) {
      throw new Error(`Excel导出失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 导出为HTML格式
   */
  private static async exportToHTML(options: ExportOptions, filename: string): Promise<ExportResult> {
    try {
      const { content, title, metadata } = options
      
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title || filename}</title>
          ${metadata?.author ? `<meta name="author" content="${metadata.author}">` : ''}
          ${metadata?.subject ? `<meta name="description" content="${metadata.subject}">` : ''}
          ${metadata?.keywords ? `<meta name="keywords" content="${metadata.keywords.join(', ')}">` : ''}
          <style>
            body {
              font-family: 'Microsoft YaHei', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .container {
              background: white;
              padding: 30px;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1, h2, h3, h4, h5, h6 {
              color: #2c3e50;
              margin-top: 1.5em;
              margin-bottom: 0.5em;
            }
            h1 { font-size: 28px; text-align: center; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
            h2 { font-size: 24px; }
            h3 { font-size: 20px; }
            p { margin: 1em 0; }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 1em 0;
            }
            table, th, td {
              border: 1px solid #ddd;
            }
            th, td {
              padding: 12px;
              text-align: left;
            }
            th {
              background-color: #f8f9fa;
              font-weight: bold;
            }
            ul, ol {
              margin: 1em 0;
              padding-left: 2em;
            }
            .header-info {
              text-align: center;
              color: #666;
              margin-bottom: 2em;
              padding-bottom: 1em;
              border-bottom: 1px solid #eee;
            }
            .footer {
              margin-top: 3em;
              padding-top: 1em;
              border-top: 1px solid #eee;
              text-align: center;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${title || '文档'}</h1>
            <div class="header-info">
              <p>生成时间: ${new Date().toLocaleString()}</p>
              ${metadata?.author ? `<p>作者: ${metadata.author}</p>` : ''}
            </div>
            <div class="content">
              ${content}
            </div>
            <div class="footer">
              <p>由长湘教师助手生成 - <a href="#" style="color: #3498db;">长湘教师助手</a></p>
            </div>
          </div>
        </body>
        </html>
      `

      const blob = new Blob([htmlContent], {
        type: 'text/html;charset=utf-8'
      })
      
      this.downloadFile(blob, `${filename}.html`)

      return {
        success: true,
        message: 'HTML文档导出成功'
      }
    } catch (error) {
      throw new Error(`HTML导出失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 导出为纯文本格式
   */
  private static async exportToText(options: ExportOptions, filename: string): Promise<ExportResult> {
    try {
      const { content, title } = options
      
      // 移除HTML标签，保留纯文本
      const textContent = this.stripHtmlTags(content)
      
      const fullContent = `
${title || '文档'}
${'='.repeat((title || '文档').length * 2)}

生成时间: ${new Date().toLocaleString()}

${textContent}

---
由长湘教师助手生成
      `.trim()

      const blob = new Blob([fullContent], {
        type: 'text/plain;charset=utf-8'
      })
      
      this.downloadFile(blob, `${filename}.txt`)

      return {
        success: true,
        message: '文本文档导出成功'
      }
    } catch (error) {
      throw new Error(`文本导出失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 下载文件
   */
  private static downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // 清理URL对象
    setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 100)
  }

  /**
   * 移除HTML标签
   */
  private static stripHtmlTags(html: string): string {
    // 创建临时DOM元素来解析HTML
    const temp = document.createElement('div')
    temp.innerHTML = html
    
    // 处理特殊元素
    const tables = temp.querySelectorAll('table')
    tables.forEach(table => {
      const rows = table.querySelectorAll('tr')
      let tableText = '\n'
      rows.forEach(row => {
        const cells = row.querySelectorAll('th, td')
        const rowText = Array.from(cells).map(cell => cell.textContent?.trim() || '').join('\t')
        tableText += rowText + '\n'
      })
      table.replaceWith(document.createTextNode(tableText))
    })
    
    // 处理换行
    const brs = temp.querySelectorAll('br')
    brs.forEach(br => br.replaceWith(document.createTextNode('\n')))
    
    const ps = temp.querySelectorAll('p')
    ps.forEach(p => {
      const text = p.textContent || ''
      p.replaceWith(document.createTextNode(text + '\n\n'))
    })
    
    const headings = temp.querySelectorAll('h1, h2, h3, h4, h5, h6')
    headings.forEach(h => {
      const text = h.textContent || ''
      h.replaceWith(document.createTextNode('\n' + text + '\n' + '-'.repeat(text.length) + '\n'))
    })
    
    return temp.textContent || ''
  }

  /**
   * 获取支持的导出格式
   */
  static getSupportedFormats(): { value: ExportFormat; label: string; icon: string }[] {
    return [
      { value: 'pdf', label: 'PDF文档', icon: 'Document' },
      { value: 'word', label: 'Word文档', icon: 'Document' },
      { value: 'excel', label: 'Excel表格', icon: 'Grid' },
      { value: 'html', label: 'HTML网页', icon: 'Link' },
      { value: 'txt', label: '纯文本', icon: 'Document' }
    ]
  }

  /**
   * 批量导出文档
   */
  static async batchExport(
    documents: Array<{ content: string; title: string; filename?: string }>,
    format: ExportFormat,
    options?: Partial<ExportOptions>
  ): Promise<ExportResult[]> {
    const results: ExportResult[] = []
    
    for (const doc of documents) {
      const exportOptions: ExportOptions = {
        format,
        content: doc.content,
        title: doc.title,
        filename: doc.filename || doc.title,
        ...options
      }
      
      const result = await this.exportDocument(exportOptions)
      results.push(result)
      
      // 添加延迟避免浏览器阻止多个下载
      if (result.success) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    return results
  }
}

// 导出便捷函数
export const exportToPDF = (content: string, title?: string, filename?: string) => {
  return DocumentExporter.exportDocument({
    format: 'pdf',
    content,
    title,
    filename
  })
}

export const exportToWord = (content: string, title?: string, filename?: string) => {
  return DocumentExporter.exportDocument({
    format: 'word',
    content,
    title,
    filename
  })
}

export const exportToExcel = (content: string, title?: string, filename?: string) => {
  return DocumentExporter.exportDocument({
    format: 'excel',
    content,
    title,
    filename
  })
}

export const exportToHTML = (content: string, title?: string, filename?: string) => {
  return DocumentExporter.exportDocument({
    format: 'html',
    content,
    title,
    filename
  })
}

export const exportToText = (content: string, title?: string, filename?: string) => {
  return DocumentExporter.exportDocument({
    format: 'text',
    content,
    title,
    filename
  })
}