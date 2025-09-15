import type { PPTTheme } from './pptThemes'

// PPT内容类型定义
export interface PPTSlide {
  id: number
  title: string
  content: string
  type: 'title' | 'content' | 'two-column' | 'chart' | 'image' | 'summary'
  image?: string
  chartData?: any[]
  chartType?: string
  chartTitle?: string
  showLegend?: boolean
  icon?: string
  author?: string
  date?: string
  subtitle?: string
}

// 布局优化器类
export class PPTLayoutOptimizer {
  private theme: PPTTheme
  
  constructor(theme: PPTTheme) {
    this.theme = theme
  }
  
  /**
   * 优化PPT幻灯片布局
   */
  optimizeSlides(slides: PPTSlide[]): PPTSlide[] {
    return slides.map((slide, index) => {
      const optimizedSlide = { ...slide }
      
      // 自动确定最佳布局类型
      optimizedSlide.type = this.determineOptimalLayout(slide)
      
      // 优化内容结构
      optimizedSlide.content = this.optimizeContent(slide.content, slide.type)
      
      // 添加视觉增强元素
      this.addVisualEnhancements(optimizedSlide, index)
      
      return optimizedSlide
    })
  }
  
  /**
   * 确定最佳布局类型
   */
  private determineOptimalLayout(slide: PPTSlide): PPTSlide['type'] {
    const content = slide.content || ''
    const title = slide.title || ''
    
    // 标题页检测
    if (slide.id === 1 || title.includes('标题') || title.includes('封面')) {
      return 'title'
    }
    
    // 总结页检测
    if (title.includes('总结') || title.includes('结论') || title.includes('谢谢')) {
      return 'summary'
    }
    
    // 图表页检测
    if (slide.chartData || title.includes('数据') || title.includes('统计') || 
        content.includes('图表') || content.includes('数据')) {
      return 'chart'
    }
    
    // 图片页检测
    if (slide.image || content.includes('图片') || content.includes('展示')) {
      return 'image'
    }
    
    // 两栏布局检测
    if (this.shouldUseTwoColumn(content)) {
      return 'two-column'
    }
    
    return 'content'
  }
  
  /**
   * 判断是否应该使用两栏布局
   */
  private shouldUseTwoColumn(content: string): boolean {
    // 检测对比性内容
    const comparisonKeywords = ['对比', '比较', '优势', '劣势', '前后', '左右']
    const hasComparison = comparisonKeywords.some(keyword => content.includes(keyword))
    
    // 检测列表内容
    const listPattern = /\d+\.|•|\*|-/g
    const listMatches = content.match(listPattern)
    const hasMultipleLists = listMatches && listMatches.length >= 4
    
    // 内容长度适中
    const contentLength = content.length
    const isModerateLength = contentLength > 100 && contentLength < 500
    
    return hasComparison || (hasMultipleLists && isModerateLength)
  }
  
  /**
   * 优化内容结构
   */
  private optimizeContent(content: string, layoutType: PPTSlide['type']): string {
    if (!content) return content
    
    let optimizedContent = content
    
    // 格式化列表
    optimizedContent = this.formatLists(optimizedContent)
    
    // 添加重点标记
    optimizedContent = this.highlightKeyPoints(optimizedContent)
    
    // 根据布局类型调整内容
    switch (layoutType) {
      case 'two-column':
        optimizedContent = this.formatTwoColumnContent(optimizedContent)
        break
      case 'summary':
        optimizedContent = this.formatSummaryContent(optimizedContent)
        break
      default:
        break
    }
    
    return optimizedContent
  }
  
  /**
   * 格式化列表内容
   */
  private formatLists(content: string): string {
    // 统一列表格式
    return content
      .replace(/\d+\./g, '•') // 数字列表转为项目符号
      .replace(/\*\s/g, '• ') // 星号转为项目符号
      .replace(/-\s/g, '• ') // 短横线转为项目符号
  }
  
  /**
   * 高亮关键点
   */
  private highlightKeyPoints(content: string): string {
    const keywords = ['重要', '关键', '核心', '主要', '重点', '注意']
    let highlighted = content
    
    keywords.forEach(keyword => {
      const regex = new RegExp(`(${keyword}[^。！？]*[。！？])`, 'g')
      highlighted = highlighted.replace(regex, '<strong>$1</strong>')
    })
    
    return highlighted
  }
  
  /**
   * 格式化两栏内容
   */
  private formatTwoColumnContent(content: string): string {
    // 尝试将内容分为两部分
    const sentences = content.split(/[。！？]/).filter(s => s.trim())
    const midPoint = Math.ceil(sentences.length / 2)
    
    const leftColumn = sentences.slice(0, midPoint).join('。') + '。'
    const rightColumn = sentences.slice(midPoint).join('。') + '。'
    
    return `<div class="two-column-content"><div class="left-column">${leftColumn}</div><div class="right-column">${rightColumn}</div></div>`
  }
  
  /**
   * 格式化总结内容
   */
  private formatSummaryContent(content: string): string {
    // 将内容转换为要点列表
    const points = content.split(/[。！？]/).filter(s => s.trim())
    const formattedPoints = points.map(point => `• ${point.trim()}`).join('\n')
    
    return formattedPoints
  }
  
  /**
   * 添加视觉增强元素
   */
  private addVisualEnhancements(slide: PPTSlide, index: number): void {
    // 为不同类型的幻灯片添加合适的图标
    if (!slide.icon) {
      slide.icon = this.selectAppropriateIcon(slide)
    }
    
    // 为图表页面生成示例数据（如果没有数据）
    if (slide.type === 'chart' && !slide.chartData) {
      slide.chartData = this.generateSampleChartData(slide.title)
      slide.chartType = this.selectChartType(slide.title, slide.content)
    }
    
    // 添加渐变背景配置
    if (this.theme.name === 'tech' || this.theme.name === 'creative') {
      slide.backgroundGradient = this.generateBackgroundGradient(index)
    }
  }
  
  /**
   * 选择合适的图标
   */
  private selectAppropriateIcon(slide: PPTSlide): string {
    const title = slide.title.toLowerCase()
    const content = slide.content.toLowerCase()
    
    // 根据关键词选择图标
    if (title.includes('目标') || content.includes('目标')) return 'target'
    if (title.includes('团队') || content.includes('团队')) return 'team'
    if (title.includes('增长') || content.includes('增长')) return 'growth'
    if (title.includes('创新') || content.includes('创新')) return 'innovation'
    if (title.includes('技术') || content.includes('技术')) return 'technology'
    if (title.includes('教育') || content.includes('教育')) return 'education'
    if (title.includes('研究') || content.includes('研究')) return 'research'
    if (title.includes('数据') || content.includes('数据')) return 'database'
    
    // 根据幻灯片类型选择默认图标
    switch (slide.type) {
      case 'title': return 'lightbulb'
      case 'chart': return 'chart-bar'
      case 'summary': return 'check'
      case 'image': return 'star'
      default: return 'arrow-right'
    }
  }
  
  /**
   * 选择图表类型
   */
  private selectChartType(title: string, content: string): string {
    const text = (title + ' ' + content).toLowerCase()
    
    if (text.includes('比例') || text.includes('占比') || text.includes('份额')) return 'pie'
    if (text.includes('趋势') || text.includes('变化') || text.includes('时间')) return 'line'
    if (text.includes('对比') || text.includes('比较')) return 'bar'
    if (text.includes('分布') || text.includes('区域')) return 'area'
    
    return 'bar' // 默认柱状图
  }
  
  /**
   * 生成示例图表数据
   */
  private generateSampleChartData(title: string): any[] {
    const categories = ['类别A', '类别B', '类别C', '类别D', '类别E']
    return categories.map(category => ({
      name: category,
      value: Math.floor(Math.random() * 100) + 20
    }))
  }
  
  /**
   * 生成背景渐变
   */
  private generateBackgroundGradient(index: number): string {
    const gradients = [
      'linear-gradient(135deg, rgba(74, 144, 226, 0.1) 0%, rgba(80, 200, 120, 0.1) 100%)',
      'linear-gradient(135deg, rgba(155, 81, 224, 0.1) 0%, rgba(255, 110, 199, 0.1) 100%)',
      'linear-gradient(135deg, rgba(255, 154, 0, 0.1) 0%, rgba(255, 206, 84, 0.1) 100%)',
      'linear-gradient(135deg, rgba(46, 204, 113, 0.1) 0%, rgba(26, 188, 156, 0.1) 100%)',
      'linear-gradient(135deg, rgba(52, 152, 219, 0.1) 0%, rgba(155, 89, 182, 0.1) 100%)'
    ]
    
    return gradients[index % gradients.length]
  }
  
  /**
   * 计算最佳字体大小
   */
  calculateOptimalFontSize(content: string, containerWidth: number, containerHeight: number): number {
    const baseSize = 16
    const contentLength = content.length
    
    // 根据内容长度调整字体大小
    if (contentLength < 50) return baseSize + 4
    if (contentLength < 100) return baseSize + 2
    if (contentLength < 200) return baseSize
    if (contentLength < 400) return baseSize - 2
    
    return baseSize - 4
  }
  
  /**
   * 生成响应式样式
   */
  generateResponsiveStyles(slide: PPTSlide): Record<string, any> {
    const styles: Record<string, any> = {}
    
    // 根据内容长度调整间距
    const contentLength = slide.content.length
    if (contentLength > 300) {
      styles.padding = '20px'
      styles.lineHeight = '1.4'
    } else {
      styles.padding = '40px'
      styles.lineHeight = '1.6'
    }
    
    // 根据主题调整样式
    if (this.theme.name === 'business') {
      styles.fontWeight = '500'
    } else if (this.theme.name === 'creative') {
      styles.borderRadius = '12px'
      styles.boxShadow = '0 4px 20px rgba(0,0,0,0.1)'
    }
    
    return styles
  }
}

// 导出工具函数
export function optimizePPTSlides(slides: PPTSlide[], theme: PPTTheme): PPTSlide[] {
  const optimizer = new PPTLayoutOptimizer(theme)
  return optimizer.optimizeSlides(slides)
}

export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200 // 中文阅读速度
  const wordCount = content.length
  return Math.ceil(wordCount / wordsPerMinute)
}

export function generateSlideTransitions(slideCount: number): string[] {
  const transitions = ['fade', 'slide', 'zoom', 'flip']
  return Array.from({ length: slideCount }, (_, i) => 
    transitions[i % transitions.length]
  )
}