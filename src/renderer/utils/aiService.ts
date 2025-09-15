// 智谱AI服务配置和接口调用

interface AIConfig {
  apiKey: string
  baseURL: string
  model: string
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface AIResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

interface PPTSlide {
  title: string
  content: string[]
  image?: string
}

class AIService {
  private config: AIConfig

  constructor() {
    this.config = {
      apiKey: '',
      baseURL: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      model: 'glm-4-plus'
    }
    // 初始化时从系统设置加载配置
    this.loadConfigFromSettings()
  }

  // 从系统设置加载配置
  private loadConfigFromSettings() {
    try {
      const saved = localStorage.getItem('ai-settings')
      if (saved) {
        const settings = JSON.parse(saved)
        this.config.apiKey = settings.zhipuApiKey || ''
        this.config.baseURL = settings.baseURL || 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
        this.config.model = settings.model || 'glm-4-plus'
      }
    } catch (error) {
      console.error('加载AI设置失败:', error)
    }
  }

  // 检查配置是否有效
  isConfigured(): boolean {
    this.loadConfigFromSettings() // 重新加载最新配置
    return !!this.config.apiKey.trim()
  }

  // 设置API密钥（保持向后兼容）
  setApiKey(apiKey: string) {
    this.config.apiKey = apiKey
  }

  // 检查配置是否完整
  isConfigured(): boolean {
    return !!this.config.apiKey
  }

  // 调用智谱AI接口（带重试机制）
  async callAI(messages: ChatMessage[], retries: number = 3): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('请先配置AI API密钥')
    }

    let lastError: Error | null = null

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30秒超时

        const response = await fetch(this.config.baseURL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`
          },
          body: JSON.stringify({
            model: this.config.model,
            messages,
            temperature: 0.7,
            max_tokens: 2000,
            stream: false
          }),
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          const errorMessage = errorData.error?.message || response.statusText
          
          // 根据错误类型决定是否重试
          if (response.status === 401 || response.status === 403) {
            throw new Error(`API密钥无效或权限不足: ${errorMessage}`)
          } else if (response.status === 429) {
            // 速率限制，等待后重试
            if (attempt < retries) {
              await this.delay(Math.pow(2, attempt) * 1000) // 指数退避
              continue
            }
            throw new Error(`请求过于频繁，请稍后重试: ${errorMessage}`)
          } else if (response.status >= 500) {
            // 服务器错误，可以重试
            if (attempt < retries) {
              await this.delay(1000 * attempt)
              continue
            }
            throw new Error(`服务器错误: ${errorMessage}`)
          } else {
            throw new Error(`AI接口调用失败: ${response.status} ${errorMessage}`)
          }
        }

        const data: AIResponse = await response.json()
        const content = data.choices[0]?.message?.content
        
        if (!content) {
          throw new Error('AI返回内容为空')
        }
        
        return content
      } catch (error) {
        lastError = error as Error
        
        // 如果是网络错误或超时，可以重试
        if (error instanceof Error && 
            (error.name === 'AbortError' || error.message.includes('fetch'))) {
          if (attempt < retries) {
            await this.delay(1000 * attempt)
            continue
          }
        }
        
        // 其他错误直接抛出
        if (attempt === retries) {
          throw lastError
        }
      }
    }

    throw lastError || new Error('未知错误')
  }

  // 延迟函数
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // 生成PPT大纲
  async generatePPTOutline(theme: string, pages: number): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: '你是一个专业的PPT制作助手。请根据用户提供的主题，生成结构清晰、逻辑合理的PPT大纲。'
      },
      {
        role: 'user',
        content: `请为主题"${theme}"生成一个包含${pages}页的PPT大纲。要求：
1. 包含封面页和结束页
2. 内容页要有清晰的标题和要点
3. 逻辑结构合理，层次分明
4. 每页标题简洁明了

请按以下格式输出：
1. 封面：[标题]
2. 第一部分：[标题]
3. 第二部分：[标题]
...
${pages}. 结束页：谢谢观看`
      }
    ]

    return await this.callAI(messages)
  }

  // 生成PPT内容
  async generatePPTContent(outline: string, style: string): Promise<PPTSlide[]> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `你是一个专业的PPT内容生成助手。请根据提供的大纲生成详细的PPT内容。风格要求：${style === 'business' ? '商务专业' : style === 'academic' ? '学术严谨' : style === 'creative' ? '创意活泼' : '简约清新'}。`
      },
      {
        role: 'user',
        content: `请根据以下大纲生成PPT内容：
${outline}

要求：
1. 为每页生成标题和3-5个要点
2. 内容要具体、实用
3. 语言简洁明了
4. 符合${style}风格

请按以下JSON格式输出：
[
  {
    "title": "页面标题",
    "content": ["要点1", "要点2", "要点3"]
  }
]`
      }
    ]

    const response = await this.callAI(messages)
    
    try {
      // 尝试解析JSON响应
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      
      // 如果不是JSON格式，尝试解析文本格式
      return this.parseTextToPPTSlides(response)
    } catch (error) {
      console.error('解析AI响应失败:', error)
      return this.parseTextToPPTSlides(response)
    }
  }

  // 解析文本格式的响应为PPT幻灯片
  private parseTextToPPTSlides(text: string): PPTSlide[] {
    const slides: PPTSlide[] = []
    const lines = text.split('\n').filter(line => line.trim())
    
    let currentSlide: PPTSlide | null = null
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      
      // 检测标题行（多种格式）
      if (this.isTitle(trimmedLine)) {
        if (currentSlide && currentSlide.content.length > 0) {
          slides.push(currentSlide)
        }
        currentSlide = {
          title: this.cleanTitle(trimmedLine),
          content: []
        }
      } else if (currentSlide && trimmedLine && this.isContentPoint(trimmedLine)) {
        // 添加内容要点
        const cleanContent = this.cleanContentPoint(trimmedLine)
        if (cleanContent && !currentSlide.content.includes(cleanContent)) {
          currentSlide.content.push(cleanContent)
        }
      }
    }
    
    if (currentSlide && currentSlide.content.length > 0) {
      slides.push(currentSlide)
    }
    
    // 如果没有解析到内容，尝试按段落分割
    if (slides.length === 0) {
      return this.parseByParagraphs(text)
    }
    
    return slides.length > 0 ? slides : [{
      title: '生成失败',
      content: ['请检查网络连接或重试']
    }]
  }

  // 判断是否为标题行
  private isTitle(line: string): boolean {
    return /^\d+[.、]/.test(line) || 
           /^[#*-]\s+/.test(line) || 
           line.includes('：') || 
           line.includes(':') ||
           /^第[一二三四五六七八九十\d]+[章节部分页]/.test(line) ||
           /^[A-Z][a-z]*:/.test(line)
  }

  // 清理标题文本
  private cleanTitle(title: string): string {
    return title
      .replace(/^\d+[.、]\s*/, '')
      .replace(/^[#*-]\s*/, '')
      .replace(/[：:]/g, '')
      .replace(/^第[一二三四五六七八九十\d]+[章节部分页]\s*/, '')
      .trim()
  }

  // 判断是否为内容要点
  private isContentPoint(line: string): boolean {
    return line.length > 0 && 
           !this.isTitle(line) && 
           line.length < 200 // 避免过长的文本
  }

  // 清理内容要点
  private cleanContentPoint(content: string): string {
    return content
      .replace(/^[•·▪▫-]\s*/, '')
      .replace(/^\d+[.、)]\s*/, '')
      .trim()
  }

  // 按段落解析（备用方案）
  private parseByParagraphs(text: string): PPTSlide[] {
    const paragraphs = text.split('\n\n').filter(p => p.trim())
    const slides: PPTSlide[] = []
    
    paragraphs.forEach((paragraph, index) => {
      const lines = paragraph.split('\n').filter(l => l.trim())
      if (lines.length > 0) {
        const title = lines[0].trim()
        const content = lines.slice(1).map(l => l.trim()).filter(l => l)
        
        slides.push({
          title: this.cleanTitle(title) || `幻灯片 ${index + 1}`,
          content: content.length > 0 ? content : ['内容生成中...']
        })
      }
    })
    
    return slides
  }

  // 生成图片描述（用于后续图片生成）
  async generateImagePrompt(slideTitle: string, slideContent: string[]): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: '你是一个专业的图片描述生成助手。请根据PPT页面内容生成适合的图片描述。'
      },
      {
        role: 'user',
        content: `请为以下PPT页面生成一个简洁的图片描述：
标题：${slideTitle}
内容：${slideContent.join(', ')}

要求：
1. 描述要简洁明了
2. 适合作为配图
3. 避免文字内容
4. 突出主题概念`
      }
    ]

    return await this.callAI(messages)
  }
}

// 导出单例实例
export const aiService = new AIService()
export type { PPTSlide }