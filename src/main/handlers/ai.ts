import { ipcMain } from 'electron'
import { getDatabase } from '../database'
import * as https from 'https'
import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'

// AI服务配置接口
interface AIConfig {
  openai_api_key?: string
  openai_base_url?: string
  qwen_api_key?: string
  qwen_base_url?: string
  default_model?: string
  max_tokens?: number
  temperature?: number
}

// AI对话记录接口
interface ChatMessage {
  id?: number
  session_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  model?: string
  tokens_used?: number
}

// AI会话接口
interface ChatSession {
  id?: number
  title: string
  type: 'qa' | 'lesson_prep' | 'essay_grading' | 'general'
  created_at: string
  updated_at: string
  message_count: number
}

// 初始化AI相关数据表
export async function initAITables() {
  const db = getDatabase()
  
  try {
    // AI配置表
    await db.run(`
      CREATE TABLE IF NOT EXISTS ai_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // AI会话表
    await db.run(`
      CREATE TABLE IF NOT EXISTS ai_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'general',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        message_count INTEGER DEFAULT 0
      )
    `)
    
    // AI消息表
    await db.run(`
      CREATE TABLE IF NOT EXISTS ai_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        model TEXT,
        tokens_used INTEGER,
        FOREIGN KEY (session_id) REFERENCES ai_sessions (id) ON DELETE CASCADE
      )
    `)
    
    // 插入默认配置
    const defaultConfigs = [
      { key: 'openai_base_url', value: 'https://api.openai.com/v1', description: 'OpenAI API基础URL' },
      { key: 'qwen_base_url', value: 'https://dashscope.aliyuncs.com/api/v1', description: '通义千问API基础URL' },
      { key: 'default_model', value: 'gpt-3.5-turbo', description: '默认AI模型' },
      { key: 'max_tokens', value: '2000', description: '最大token数' },
      { key: 'temperature', value: '0.7', description: '创造性参数' }
    ]
    
    for (const config of defaultConfigs) {
      await db.run(
        'INSERT OR IGNORE INTO ai_config (key, value, description) VALUES (?, ?, ?)',
        [config.key, config.value, config.description]
      )
    }
    
    console.log('AI数据表初始化完成')
  } catch (error) {
    console.error('AI数据表初始化失败:', error)
    throw error
  }
}

// 获取AI配置
async function getAIConfig(): Promise<AIConfig> {
  const db = getDatabase()
  const configs = await db.all('SELECT key, value FROM ai_config')
  
  const config: AIConfig = {}
  configs.forEach(item => {
    const key = item.key as keyof AIConfig
    if (key === 'max_tokens' || key === 'temperature') {
      config[key] = parseFloat(item.value)
    } else {
      config[key] = item.value
    }
  })
  
  return config
}

// HTTP请求工具函数
function makeHttpRequest(url: string, options: any, data?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    }

    const req = https.request(requestOptions, (res) => {
      let responseData = ''
      res.on('data', (chunk) => {
        responseData += chunk
      })
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData)
          resolve(parsedData)
        } catch (error) {
          reject(new Error('Invalid JSON response'))
        }
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    if (data) {
      req.write(JSON.stringify(data))
    }
    req.end()
  })
}

// OpenAI API调用
async function callOpenAI(messages: any[], config: AIConfig) {
  if (!config.openai_api_key) {
    throw new Error('OpenAI API密钥未配置')
  }
  
  const url = `${config.openai_base_url || 'https://api.openai.com/v1'}/chat/completions`
  const requestData = {
    model: config.default_model || 'gpt-3.5-turbo',
    messages,
    max_tokens: config.max_tokens || 2000,
    temperature: config.temperature || 0.7
  }
  
  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.openai_api_key}`,
      'Content-Type': 'application/json'
    }
  }
  
  return await makeHttpRequest(url, options, requestData)
}

// 通义千问API调用
async function callQwen(messages: any[], config: AIConfig) {
  if (!config.qwen_api_key) {
    throw new Error('通义千问API密钥未配置')
  }
  
  const url = `${config.qwen_base_url || 'https://dashscope.aliyuncs.com/api/v1'}/services/aigc/text-generation/generation`
  const requestData = {
    model: 'qwen-turbo',
    input: {
      messages
    },
    parameters: {
      max_tokens: config.max_tokens || 2000,
      temperature: config.temperature || 0.7
    }
  }
  
  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.qwen_api_key}`,
      'Content-Type': 'application/json'
    }
  }
  
  return await makeHttpRequest(url, options, requestData)
}

// 处理AI聊天请求
async function handleAIChat(event: any, sessionId: string, message: string, type: string = 'general') {
  const db = getDatabase()
  const config = await getAIConfig()
  
  try {
    // 获取会话历史
    const messages = await db.all(
      'SELECT role, content FROM ai_messages WHERE session_id = ? ORDER BY timestamp ASC LIMIT 10',
      [sessionId]
    )
    
    // 添加系统提示词
    const systemPrompts = {
      qa: '你是一位经验丰富的教师助手，专门回答教学相关问题。请提供专业、实用的建议。',
      lesson_prep: '你是一位备课助手，帮助教师制定教学计划、设计课程内容和教学活动。',
      essay_grading: '你是一位作文批改助手，帮助评价学生作文并提供改进建议。',
      general: '你是一位智能教学助手，帮助教师解决各种教学和管理问题。'
    }
    
    const conversationMessages = [
      { role: 'system', content: systemPrompts[type as keyof typeof systemPrompts] || systemPrompts.general },
      ...messages,
      { role: 'user', content: message }
    ]
    
    // 调用AI API（优先使用OpenAI，如果没有配置则使用通义千问）
    let response
    let model = 'unknown'
    let tokensUsed = 0
    
    if (config.openai_api_key) {
      const result = await callOpenAI(conversationMessages, config)
      response = result.choices[0].message.content
      model = result.model
      tokensUsed = result.usage?.total_tokens || 0
    } else if (config.qwen_api_key) {
      const result = await callQwen(conversationMessages, config)
      response = result.output?.text || result.output?.choices?.[0]?.message?.content
      model = 'qwen-turbo'
      tokensUsed = result.usage?.total_tokens || 0
    } else {
      throw new Error('未配置任何AI服务')
    }
    
    // 保存用户消息
    await db.run(
      'INSERT INTO ai_messages (session_id, role, content, model, tokens_used) VALUES (?, ?, ?, ?, ?)',
      [sessionId, 'user', message, model, 0]
    )
    
    // 保存AI回复
    await db.run(
      'INSERT INTO ai_messages (session_id, role, content, model, tokens_used) VALUES (?, ?, ?, ?, ?)',
      [sessionId, 'assistant', response, model, tokensUsed]
    )
    
    // 更新会话信息
    await db.run(
      'UPDATE ai_sessions SET updated_at = CURRENT_TIMESTAMP, message_count = message_count + 2 WHERE id = ?',
      [sessionId]
    )
    
    return {
      success: true,
      response,
      model,
      tokensUsed
    }
  } catch (error) {
    console.error('AI聊天处理失败:', error)
    throw error
  }
}

// 处理获取AI配置
async function handleGetAIConfig() {
  try {
    const config = await getAIConfig()
    // 不返回敏感信息
    return {
      ...config,
      openai_api_key: config.openai_api_key ? '已配置' : '未配置',
      qwen_api_key: config.qwen_api_key ? '已配置' : '未配置'
    }
  } catch (error) {
    console.error('获取AI配置失败:', error)
    throw error
  }
}

// 处理更新AI配置
async function handleUpdateAIConfig(event: any, configData: Partial<AIConfig>) {
  const db = getDatabase()
  
  try {
    for (const [key, value] of Object.entries(configData)) {
      await db.run(
        'INSERT OR REPLACE INTO ai_config (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
        [key, String(value)]
      )
    }
    
    return { success: true }
  } catch (error) {
    console.error('更新AI配置失败:', error)
    throw error
  }
}

// 处理获取会话列表
async function handleGetSessions(event: any, type?: string) {
  const db = getDatabase()
  
  try {
    let sql = 'SELECT * FROM ai_sessions'
    const params: any[] = []
    
    if (type) {
      sql += ' WHERE type = ?'
      params.push(type)
    }
    
    sql += ' ORDER BY updated_at DESC'
    
    const sessions = await db.all(sql, params)
    return sessions
  } catch (error) {
    console.error('获取会话列表失败:', error)
    throw error
  }
}

// 处理创建新会话
async function handleCreateSession(event: any, title: string, type: string = 'general') {
  const db = getDatabase()
  
  try {
    const result = await db.run(
      'INSERT INTO ai_sessions (title, type) VALUES (?, ?)',
      [title, type]
    )
    
    return {
      success: true,
      sessionId: result.lastID
    }
  } catch (error) {
    console.error('创建会话失败:', error)
    throw error
  }
}

// 处理获取会话消息
async function handleGetSessionMessages(event: any, sessionId: string) {
  const db = getDatabase()
  
  try {
    const messages = await db.all(
      'SELECT * FROM ai_messages WHERE session_id = ? ORDER BY timestamp ASC',
      [sessionId]
    )
    
    return messages
  } catch (error) {
    console.error('获取会话消息失败:', error)
    throw error
  }
}

// 处理删除会话
async function handleDeleteSession(event: any, sessionId: string) {
  const db = getDatabase()
  
  try {
    await db.run('DELETE FROM ai_sessions WHERE id = ?', [sessionId])
    return { success: true }
  } catch (error) {
    console.error('删除会话失败:', error)
    throw error
  }
}

// 注册AI相关的IPC处理器
export function registerAIHandlers() {
  // AI配置相关
  ipcMain.handle('ai:getConfig', handleGetAIConfig)
  ipcMain.handle('ai:updateConfig', handleUpdateAIConfig)
  
  // 会话管理
  ipcMain.handle('ai:getSessions', handleGetSessions)
  ipcMain.handle('ai:createSession', handleCreateSession)
  ipcMain.handle('ai:getSessionMessages', handleGetSessionMessages)
  ipcMain.handle('ai:deleteSession', handleDeleteSession)
  
  // AI聊天
  ipcMain.handle('ai:chat', handleAIChat)
  
  console.log('AI处理器注册完成')
}