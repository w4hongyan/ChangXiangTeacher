import { ipcMain, dialog } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import * as zlib from 'zlib'
import { promisify } from 'util'
import { getDatabase } from '../database'

const gzip = promisify(zlib.gzip)
const gunzip = promisify(zlib.gunzip)

interface BackupItem {
  id: number
  name: string
  type: 'manual' | 'auto' | 'cloud'
  size: number
  created_at: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  path: string
  description?: string
  compressed?: boolean
  encrypted?: boolean
}

interface BackupSettings {
  autoBackup: boolean
  frequency: string
  backupTime: string
  keepCount: number
  backupPath: string
  compress: boolean
  encrypt: boolean
  encryptPassword: string
}

// 初始化备份相关数据表
export async function initBackupTables() {
  const db = getDatabase()
  
  // 创建备份记录表
  if (!(await db.tableExists('backups'))) {
    await db.createTable('backups', `
      CREATE TABLE backups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'manual',
        size INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT NOT NULL DEFAULT 'pending',
        path TEXT NOT NULL,
        description TEXT,
        compressed INTEGER DEFAULT 0,
        encrypted INTEGER DEFAULT 0
      )
    `)
  }
  
  // 创建备份设置表
  if (!(await db.tableExists('backup_settings'))) {
    await db.createTable('backup_settings', `
      CREATE TABLE backup_settings (
        id INTEGER PRIMARY KEY,
        auto_backup INTEGER DEFAULT 0,
        frequency TEXT DEFAULT 'daily',
        backup_time TEXT DEFAULT '02:00',
        keep_count INTEGER DEFAULT 10,
        backup_path TEXT DEFAULT '',
        compress INTEGER DEFAULT 1,
        encrypt INTEGER DEFAULT 0,
        encrypt_password TEXT DEFAULT ''
      )
    `)
  }
  
  // 插入默认设置
  const settingsExists = await db.get('SELECT COUNT(*) as count FROM backup_settings')
  if (settingsExists.count === 0) {
    await db.run('INSERT INTO backup_settings (id, backup_path) VALUES (?, ?)', [
      1,
      path.join(process.cwd(), 'backups')
    ])
  }
  
  console.log('备份数据表初始化完成')
}

// 注册备份相关的IPC处理器
export function registerBackupHandlers() {
  const db = getDatabase()
  
  // 获取备份列表
  ipcMain.handle('backup:list', async (event, options = {}) => {
    try {
      const { page = 1, pageSize = 20, search = '', type = '' } = options
      const offset = (page - 1) * pageSize
      
      let whereClause = ''
      let params: any[] = []
      
      if (search && type) {
        whereClause = 'WHERE name LIKE ? AND type = ?'
        params = [`%${search}%`, type]
      } else if (search) {
        whereClause = 'WHERE name LIKE ?'
        params = [`%${search}%`]
      } else if (type) {
        whereClause = 'WHERE type = ?'
        params = [type]
      }
      
      const totalResult = await db.get(`SELECT COUNT(*) as total FROM backups ${whereClause}`, params)
      
      const backups = await db.all(
        `SELECT * FROM backups ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [...params, pageSize, offset]
      )
      
      return {
        data: backups,
        total: totalResult.total,
        page,
        pageSize
      }
    } catch (error) {
      console.error('获取备份列表失败:', error)
      throw error
    }
  })
  
  // 获取备份统计
  ipcMain.handle('backup:stats', async () => {
    try {
      const stats = await db.get(`
        SELECT 
          COUNT(*) as total,
          SUM(size) as totalSize,
          SUM(CASE WHEN type = 'cloud' THEN 1 ELSE 0 END) as cloudBackups,
          SUM(CASE WHEN type = 'auto' THEN 1 ELSE 0 END) as autoBackups
        FROM backups
      `)
      
      return stats
    } catch (error) {
      console.error('获取备份统计失败:', error)
      throw error
    }
  })
  
  // 创建备份
  ipcMain.handle('backup:create', async (event, options = {}) => {
    try {
      const { name, description, compress = true, encrypt = false, password = '' } = options
      const settings = await getBackupSettings()
      
      // 生成备份文件名
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupName = name || `backup_${timestamp}`
      const fileName = `${backupName}.db${compress ? '.gz' : ''}${encrypt ? '.enc' : ''}`
      const backupPath = path.join(settings.backup_path, fileName)
      
      // 确保备份目录存在
      if (!fs.existsSync(settings.backup_path)) {
        fs.mkdirSync(settings.backup_path, { recursive: true })
      }
      
      // 插入备份记录
      const result = await db.run(
        'INSERT INTO backups (name, type, path, description, compressed, encrypted, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [backupName, 'manual', backupPath, description || '', compress ? 1 : 0, encrypt ? 1 : 0, 'pending']
      )
      
      const backupId = result.lastInsertRowid as number
      
      try {
        // 读取数据库文件
        const dbPath = path.join(process.cwd(), 'data.db')
        let data = fs.readFileSync(dbPath)
        
        // 压缩
        if (compress) {
          data = await gzip(data)
        }
        
        // 加密
        if (encrypt && password) {
          const cipher = crypto.createCipher('aes-256-cbc', password)
          data = Buffer.concat([cipher.update(data), cipher.final()])
        }
        
        // 写入备份文件
        fs.writeFileSync(backupPath, data)
        const fileStats = fs.statSync(backupPath)
        
        // 更新备份记录
        await db.run(
          'UPDATE backups SET size = ?, status = ? WHERE id = ?',
          [fileStats.size, 'completed', backupId]
        )
        
        // 清理旧备份
        await cleanupOldBackups(settings.keep_count)
        
        return { id: backupId, path: backupPath, size: fileStats.size }
      } catch (error) {
        // 更新状态为失败
        await db.run(
          'UPDATE backups SET status = ? WHERE id = ?',
          ['failed', backupId]
        )
        throw error
      }
    } catch (error) {
      console.error('创建备份失败:', error)
      throw error
    }
  })
  
  // 恢复备份
  ipcMain.handle('backup:restore', async (event, options) => {
    try {
      const { backupId, filePath, password = '' } = options
      let targetPath: string
      let compressed = false
      let encrypted = false
      
      if (backupId) {
        // 从备份记录恢复
        const backup = await db.get('SELECT * FROM backups WHERE id = ?', [backupId]) as BackupItem
        if (!backup) {
          throw new Error('备份记录不存在')
        }
        targetPath = backup.path
        compressed = backup.compressed || false
        encrypted = backup.encrypted || false
      } else if (filePath) {
        // 从文件恢复
        targetPath = filePath
        compressed = filePath.endsWith('.gz')
        encrypted = filePath.endsWith('.enc')
      } else {
        throw new Error('必须指定备份ID或文件路径')
      }
      
      if (!fs.existsSync(targetPath)) {
        throw new Error('备份文件不存在')
      }
      
      // 读取备份文件
      let data = fs.readFileSync(targetPath)
      
      // 解密
      if (encrypted && password) {
        const decipher = crypto.createDecipher('aes-256-cbc', password)
        data = Buffer.concat([decipher.update(data), decipher.final()])
      }
      
      // 解压缩
      if (compressed) {
        data = await gunzip(data)
      }
      
      // 备份当前数据库
      const currentDbPath = path.join(process.cwd(), 'data.db')
      const backupCurrentPath = path.join(process.cwd(), `data_backup_${Date.now()}.db`)
      if (fs.existsSync(currentDbPath)) {
        fs.copyFileSync(currentDbPath, backupCurrentPath)
      }
      
      try {
        // 恢复数据库
        fs.writeFileSync(currentDbPath, data)
        
        // 删除临时备份
        if (fs.existsSync(backupCurrentPath)) {
          fs.unlinkSync(backupCurrentPath)
        }
        
        return { success: true }
      } catch (error) {
        // 恢复失败，还原原数据库
        if (fs.existsSync(backupCurrentPath)) {
          fs.copyFileSync(backupCurrentPath, currentDbPath)
          fs.unlinkSync(backupCurrentPath)
        }
        throw error
      }
    } catch (error) {
      console.error('恢复备份失败:', error)
      throw error
    }
  })
  
  // 下载备份
  ipcMain.handle('backup:download', async (event, backupId) => {
    try {
      const backup = await db.get('SELECT * FROM backups WHERE id = ?', [backupId]) as BackupItem
      if (!backup) {
        throw new Error('备份记录不存在')
      }
      
      if (!fs.existsSync(backup.path)) {
        throw new Error('备份文件不存在')
      }
      
      const result = await dialog.showSaveDialog({
        title: '保存备份文件',
        defaultPath: backup.name + path.extname(backup.path),
        filters: [
          { name: '数据库文件', extensions: ['db', 'sql'] },
          { name: '所有文件', extensions: ['*'] }
        ]
      })
      
      if (!result.canceled && result.filePath) {
        fs.copyFileSync(backup.path, result.filePath)
        return { success: true, path: result.filePath }
      }
      
      return { success: false }
    } catch (error) {
      console.error('下载备份失败:', error)
      throw error
    }
  })
  
  // 删除备份
  ipcMain.handle('backup:delete', async (event, backupId) => {
    try {
      const backup = await db.get('SELECT * FROM backups WHERE id = ?', [backupId]) as BackupItem
      if (!backup) {
        throw new Error('备份记录不存在')
      }
      
      // 删除文件
      if (fs.existsSync(backup.path)) {
        fs.unlinkSync(backup.path)
      }
      
      // 删除记录
      await db.run('DELETE FROM backups WHERE id = ?', [backupId])
      
      return { success: true }
    } catch (error) {
      console.error('删除备份失败:', error)
      throw error
    }
  })
  
  // 获取备份设置
  ipcMain.handle('backup:getSettings', async () => {
    try {
      return await getBackupSettings()
    } catch (error) {
      console.error('获取备份设置失败:', error)
      throw error
    }
  })
  
  // 保存备份设置
  ipcMain.handle('backup:saveSettings', async (event, settings) => {
    try {
      await db.run(`
        UPDATE backup_settings SET
          auto_backup = ?,
          frequency = ?,
          backup_time = ?,
          keep_count = ?,
          backup_path = ?,
          compress = ?,
          encrypt = ?,
          encrypt_password = ?
        WHERE id = 1
      `, [
        settings.autoBackup ? 1 : 0,
        settings.frequency,
        settings.backupTime,
        settings.keepCount,
        settings.backupPath,
        settings.compress ? 1 : 0,
        settings.encrypt ? 1 : 0,
        settings.encryptPassword
      ])
      
      return { success: true }
    } catch (error) {
      console.error('保存备份设置失败:', error)
      throw error
    }
  })
  
  // 选择备份路径
  ipcMain.handle('backup:selectPath', async () => {
    try {
      const result = await dialog.showOpenDialog({
        title: '选择备份目录',
        properties: ['openDirectory', 'createDirectory']
      })
      
      if (!result.canceled && result.filePaths.length > 0) {
        return { success: true, path: result.filePaths[0] }
      }
      
      return { success: false }
    } catch (error) {
      console.error('选择备份路径失败:', error)
      throw error
    }
  })
  
  console.log('备份处理器注册完成')
}

// 获取备份设置
async function getBackupSettings(): Promise<BackupSettings> {
  const db = getDatabase()
  const settings = await db.get('SELECT * FROM backup_settings WHERE id = ?', [1]) as any
  
  if (!settings) {
    throw new Error('备份设置不存在')
  }
  
  return {
    autoBackup: Boolean(settings.auto_backup),
    frequency: settings.frequency,
    backupTime: settings.backup_time,
    keepCount: settings.keep_count,
    backupPath: settings.backup_path,
    compress: Boolean(settings.compress),
    encrypt: Boolean(settings.encrypt),
    encryptPassword: settings.encrypt_password
  }
}

// 清理旧备份
async function cleanupOldBackups(keepCount: number) {
  const db = getDatabase()
  
  try {
    // 获取超出保留数量的备份
    const oldBackups = await db.all(
      'SELECT * FROM backups WHERE type = ? ORDER BY created_at DESC LIMIT -1 OFFSET ?',
      ['auto', keepCount]
    ) as BackupItem[]
    
    for (const backup of oldBackups) {
      // 删除文件
      if (fs.existsSync(backup.path)) {
        fs.unlinkSync(backup.path)
      }
      
      // 删除记录
      await db.run('DELETE FROM backups WHERE id = ?', [backup.id])
    }
    
    console.log(`清理了 ${oldBackups.length} 个旧备份`)
  } catch (error) {
    console.error('清理旧备份失败:', error)
  }
}

// 自动备份调度器
export function startAutoBackupScheduler() {
  // 每小时检查一次是否需要自动备份
  setInterval(async () => {
    try {
      const settings = await getBackupSettings()
      if (!settings.autoBackup) {
        return
      }
      
      const now = new Date()
      const [hour, minute] = settings.backupTime.split(':').map(Number)
      
      // 检查是否到了备份时间
      if (now.getHours() === hour && now.getMinutes() === minute) {
        const db = getDatabase()
        
        // 检查今天是否已经备份过
        const today = now.toISOString().split('T')[0]
        const existingBackup = await db('backups')
          .where('type', 'auto')
          .whereRaw('DATE(created_at) = ?', [today])
          .count('* as count')
          .first() as { count: number }
        
        if (existingBackup.count === 0) {
          // 创建自动备份
          const timestamp = now.toISOString().replace(/[:.]/g, '-')
          const backupName = `auto_backup_${timestamp}`
          
          // 这里应该调用创建备份的逻辑，但需要适配自动备份
          console.log('执行自动备份:', backupName)
        }
      }
    } catch (error) {
      console.error('自动备份调度器错误:', error)
    }
  }, 60000) // 每分钟检查一次
}