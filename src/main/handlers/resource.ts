import { ipcMain, shell } from 'electron'
import { Database } from 'sqlite3'
import path from 'path'
import fs from 'fs'

// 资源项接口
export interface ResourceItem {
  id?: number
  title: string
  description: string
  url: string
  category: string
  tags: string[]
  isLocal: boolean
  filePath?: string
  createdAt?: string
  updatedAt?: string
}

// 资源分类接口
export interface ResourceCategory {
  id?: number
  name: string
  description: string
  icon: string
  color: string
  createdAt?: string
}

// 资源设置接口
export interface ResourceSettings {
  id?: number
  autoOpenExternal: boolean
  defaultCategory: string
  showPreview: boolean
  sortBy: 'title' | 'category' | 'createdAt'
  sortOrder: 'asc' | 'desc'
}

// 初始化资源数据表
export function initResourceTables(db: any): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      console.log('Creating resources table...')
      // 创建资源表
      db.run(`
        CREATE TABLE IF NOT EXISTS resources (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          url TEXT NOT NULL,
          category TEXT NOT NULL,
          tags TEXT, -- JSON字符串存储标签数组
          isLocal INTEGER DEFAULT 0,
          filePath TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `)
      console.log('Resources table created successfully')

      console.log('Creating resource_categories table...')
      // 创建资源分类表
      db.run(`
        CREATE TABLE IF NOT EXISTS resource_categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          icon TEXT,
          color TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `)
      console.log('Resource categories table created successfully')

      console.log('Creating resource_settings table...')
      // 创建资源设置表
      db.run(`
        CREATE TABLE IF NOT EXISTS resource_settings (
          id INTEGER PRIMARY KEY,
          autoOpenExternal INTEGER DEFAULT 1,
          defaultCategory TEXT DEFAULT '学习资源',
          showPreview INTEGER DEFAULT 1,
          sortBy TEXT DEFAULT 'createdAt',
          sortOrder TEXT DEFAULT 'desc'
        )
      `)
      console.log('Resource settings table created successfully')

      // 插入默认分类
      console.log('Inserting default categories...')
      const defaultCategories = [
        { name: '学习资源', description: '教学相关的学习资源', icon: 'book', color: '#3498db' },
        { name: '教学工具', description: '辅助教学的工具软件', icon: 'tool', color: '#e74c3c' },
        { name: '课件模板', description: '课件制作模板', icon: 'presentation', color: '#f39c12' },
        { name: '素材库', description: '图片、音频、视频素材', icon: 'image', color: '#27ae60' },
        { name: '参考文档', description: '教学参考文档', icon: 'file-text', color: '#9b59b6' },
        { name: '在线平台', description: '在线教学平台', icon: 'globe', color: '#1abc9c' }
      ]

      // 插入分类数据
      for (const category of defaultCategories) {
        try {
          db.run(
            'INSERT OR IGNORE INTO resource_categories (name, description, icon, color) VALUES (?, ?, ?, ?)',
            [category.name, category.description, category.icon, category.color]
          )
          console.log(`分类 ${category.name} 插入成功`)
        } catch (err) {
          console.warn(`插入分类 ${category.name} 失败:`, err)
          // 继续处理其他分类，不中断整个流程
        }
      }

      console.log('All categories processed, inserting default settings...')
      // 插入默认设置
      try {
        db.run(
          'INSERT OR IGNORE INTO resource_settings (id, autoOpenExternal, defaultCategory, showPreview, sortBy, sortOrder) VALUES (1, 1, "学习资源", 1, "createdAt", "desc")'
        )
        console.log('Default settings inserted successfully')
      } catch (err) {
        console.warn('插入默认设置失败:', err)
      }
      
      console.log('Resource tables initialization completed')
      resolve()
    } catch (error) {
      console.error('Resource tables initialization failed:', error)
      reject(error)
    }
  })
}

// 注册资源相关的IPC处理器
export function registerResourceHandlers(db: Database) {
  // 获取资源列表
  ipcMain.handle('resource:list', async (event, options: {
    category?: string
    search?: string
    tags?: string[]
    sortBy?: string
    sortOrder?: string
  } = {}) => {
    return new Promise<ResourceItem[]>((resolve, reject) => {
      let query = 'SELECT * FROM resources WHERE 1=1'
      const params: any[] = []

      if (options.category) {
        query += ' AND category = ?'
        params.push(options.category)
      }

      if (options.search) {
        query += ' AND (title LIKE ? OR description LIKE ?)'
        params.push(`%${options.search}%`, `%${options.search}%`)
      }

      if (options.tags && options.tags.length > 0) {
        const tagConditions = options.tags.map(() => 'tags LIKE ?').join(' OR ')
        query += ` AND (${tagConditions})`
        options.tags.forEach(tag => {
          params.push(`%"${tag}"%`)
        })
      }

      const sortBy = options.sortBy || 'createdAt'
      const sortOrder = options.sortOrder || 'desc'
      query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`

      db.all(query, params, (err, rows: any[]) => {
        if (err) {
          reject(err)
        } else {
          const resources = rows.map(row => ({
            ...row,
            tags: row.tags ? JSON.parse(row.tags) : [],
            isLocal: Boolean(row.isLocal)
          }))
          resolve(resources)
        }
      })
    })
  })

  // 获取资源分类列表
  ipcMain.handle('resource:categories', async () => {
    return new Promise<ResourceCategory[]>((resolve, reject) => {
      db.all('SELECT * FROM resource_categories ORDER BY name', (err, rows: any[]) => {
        if (err) {
          reject(err)
        } else {
          resolve(rows)
        }
      })
    })
  })

  // 添加资源
  ipcMain.handle('resource:add', async (event, resource: Omit<ResourceItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    return new Promise<number>((resolve, reject) => {
      const tagsJson = JSON.stringify(resource.tags || [])
      db.run(
        `INSERT INTO resources (title, description, url, category, tags, isLocal, filePath) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [resource.title, resource.description, resource.url, resource.category, tagsJson, resource.isLocal ? 1 : 0, resource.filePath],
        function(err) {
          if (err) {
            reject(err)
          } else {
            resolve(this.lastID)
          }
        }
      )
    })
  })

  // 更新资源
  ipcMain.handle('resource:update', async (event, id: number, resource: Partial<ResourceItem>) => {
    return new Promise<boolean>((resolve, reject) => {
      const fields: string[] = []
      const params: any[] = []

      if (resource.title !== undefined) {
        fields.push('title = ?')
        params.push(resource.title)
      }
      if (resource.description !== undefined) {
        fields.push('description = ?')
        params.push(resource.description)
      }
      if (resource.url !== undefined) {
        fields.push('url = ?')
        params.push(resource.url)
      }
      if (resource.category !== undefined) {
        fields.push('category = ?')
        params.push(resource.category)
      }
      if (resource.tags !== undefined) {
        fields.push('tags = ?')
        params.push(JSON.stringify(resource.tags))
      }
      if (resource.isLocal !== undefined) {
        fields.push('isLocal = ?')
        params.push(resource.isLocal ? 1 : 0)
      }
      if (resource.filePath !== undefined) {
        fields.push('filePath = ?')
        params.push(resource.filePath)
      }

      fields.push('updatedAt = CURRENT_TIMESTAMP')
      params.push(id)

      const query = `UPDATE resources SET ${fields.join(', ')} WHERE id = ?`
      db.run(query, params, function(err) {
        if (err) {
          reject(err)
        } else {
          resolve(this.changes > 0)
        }
      })
    })
  })

  // 删除资源
  ipcMain.handle('resource:delete', async (event, id: number) => {
    return new Promise<boolean>((resolve, reject) => {
      db.run('DELETE FROM resources WHERE id = ?', [id], function(err) {
        if (err) {
          reject(err)
        } else {
          resolve(this.changes > 0)
        }
      })
    })
  })

  // 打开资源
  ipcMain.handle('resource:open', async (event, resource: ResourceItem) => {
    try {
      if (resource.isLocal && resource.filePath) {
        // 本地文件
        if (fs.existsSync(resource.filePath)) {
          await shell.openPath(resource.filePath)
          return { success: true }
        } else {
          return { success: false, error: '文件不存在' }
        }
      } else {
        // 网络链接
        await shell.openExternal(resource.url)
        return { success: true }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // 添加资源分类
  ipcMain.handle('resource:category:add', async (event, category: Omit<ResourceCategory, 'id' | 'createdAt'>) => {
    return new Promise<number>((resolve, reject) => {
      db.run(
        'INSERT INTO resource_categories (name, description, icon, color) VALUES (?, ?, ?, ?)',
        [category.name, category.description, category.icon, category.color],
        function(err) {
          if (err) {
            reject(err)
          } else {
            resolve(this.lastID)
          }
        }
      )
    })
  })

  // 更新资源分类
  ipcMain.handle('resource:category:update', async (event, id: number, category: Partial<ResourceCategory>) => {
    return new Promise<boolean>((resolve, reject) => {
      const fields: string[] = []
      const params: any[] = []

      if (category.name !== undefined) {
        fields.push('name = ?')
        params.push(category.name)
      }
      if (category.description !== undefined) {
        fields.push('description = ?')
        params.push(category.description)
      }
      if (category.icon !== undefined) {
        fields.push('icon = ?')
        params.push(category.icon)
      }
      if (category.color !== undefined) {
        fields.push('color = ?')
        params.push(category.color)
      }

      params.push(id)
      const query = `UPDATE resource_categories SET ${fields.join(', ')} WHERE id = ?`
      
      db.run(query, params, function(err) {
        if (err) {
          reject(err)
        } else {
          resolve(this.changes > 0)
        }
      })
    })
  })

  // 删除资源分类
  ipcMain.handle('resource:category:delete', async (event, id: number) => {
    return new Promise<boolean>((resolve, reject) => {
      // 先检查是否有资源使用该分类
      db.get('SELECT COUNT(*) as count FROM resources WHERE category = (SELECT name FROM resource_categories WHERE id = ?)', [id], (err, row: any) => {
        if (err) {
          reject(err)
          return
        }
        
        if (row.count > 0) {
          reject(new Error('该分类下还有资源，无法删除'))
          return
        }

        // 删除分类
        db.run('DELETE FROM resource_categories WHERE id = ?', [id], function(err) {
          if (err) {
            reject(err)
          } else {
            resolve(this.changes > 0)
          }
        })
      })
    })
  })

  // 获取资源设置
  ipcMain.handle('resource:settings:get', async () => {
    return new Promise<ResourceSettings>((resolve, reject) => {
      db.get('SELECT * FROM resource_settings WHERE id = 1', (err, row: any) => {
        if (err) {
          reject(err)
        } else {
          resolve({
            ...row,
            autoOpenExternal: Boolean(row?.autoOpenExternal),
            showPreview: Boolean(row?.showPreview)
          })
        }
      })
    })
  })

  // 更新资源设置
  ipcMain.handle('resource:settings:update', async (event, settings: Partial<ResourceSettings>) => {
    return new Promise<boolean>((resolve, reject) => {
      const fields: string[] = []
      const params: any[] = []

      if (settings.autoOpenExternal !== undefined) {
        fields.push('autoOpenExternal = ?')
        params.push(settings.autoOpenExternal ? 1 : 0)
      }
      if (settings.defaultCategory !== undefined) {
        fields.push('defaultCategory = ?')
        params.push(settings.defaultCategory)
      }
      if (settings.showPreview !== undefined) {
        fields.push('showPreview = ?')
        params.push(settings.showPreview ? 1 : 0)
      }
      if (settings.sortBy !== undefined) {
        fields.push('sortBy = ?')
        params.push(settings.sortBy)
      }
      if (settings.sortOrder !== undefined) {
        fields.push('sortOrder = ?')
        params.push(settings.sortOrder)
      }

      if (fields.length === 0) {
        resolve(true)
        return
      }

      const query = `UPDATE resource_settings SET ${fields.join(', ')} WHERE id = 1`
      db.run(query, params, function(err) {
        if (err) {
          reject(err)
        } else {
          resolve(true)
        }
      })
    })
  })

  // 获取资源统计信息
  ipcMain.handle('resource:stats', async () => {
    return new Promise<{
      totalResources: number
      categoryCounts: { category: string; count: number }[]
      recentResources: ResourceItem[]
    }>((resolve, reject) => {
      // 获取总资源数
      db.get('SELECT COUNT(*) as total FROM resources', (err, totalRow: any) => {
        if (err) {
          reject(err)
          return
        }

        // 获取各分类资源数
        db.all('SELECT category, COUNT(*) as count FROM resources GROUP BY category', (err, categoryRows: any[]) => {
          if (err) {
            reject(err)
            return
          }

          // 获取最近添加的资源
          db.all('SELECT * FROM resources ORDER BY createdAt DESC LIMIT 5', (err, recentRows: any[]) => {
            if (err) {
              reject(err)
            } else {
              const recentResources = recentRows.map(row => ({
                ...row,
                tags: row.tags ? JSON.parse(row.tags) : [],
                isLocal: Boolean(row.isLocal)
              }))

              resolve({
                totalResources: totalRow.total,
                categoryCounts: categoryRows,
                recentResources
              })
            }
          })
        })
      })
    })
  })
}