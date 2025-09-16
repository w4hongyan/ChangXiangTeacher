import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
import { join } from 'path'
import { DatabaseManager, getDatabaseManager } from './database'
import { setupStudentHandlers } from './handlers/student'
import { setupGradeHandlers } from './handlers/grades'
import { setupSeatingHandlers } from './handlers/seating'
import { setupGroupHandlers } from './handlers/group'
import { setupPointHandlers } from './handlers/point'
import { setupScheduleHandlers } from './handlers/schedule'
import { setupCalendarHandlers } from './handlers/calendar'
import { setupTemplateHandlers } from './handlers/template'
import { setupEnhancedTemplateHandlers } from './handlers/templateEnhanced'
import { setupGradeHandlers } from './handlers/grades'
import { setupEnhancedGradeHandlers } from './handlers/gradesEnhanced'
import { setupShopHandlers } from './handlers/shop'
import { registerAttendanceHandlers, initAttendanceTables } from './handlers/attendance'
import { registerBackupHandlers, initBackupTables, startAutoBackupScheduler } from './handlers/backup'
import { registerCloudHandlers, initCloudTables, startCloudSyncScheduler } from './handlers/cloud'
import { registerHomeworkHandlers, initHomeworkTables } from './handlers/homework'
import { initAITables, registerAIHandlers } from './handlers/ai'
import { registerResourceHandlers, initResourceTables } from './handlers/resource'

let mainWindow: BrowserWindow
const dbManager = getDatabaseManager()

// IPC handlers for class management
ipcMain.handle('classes:getAll', async () => {
  try {
    const classes = await dbManager.all(`
      SELECT id, name, grade, class_number, homeroom_teacher, teacher_phone, 
             description, max_students, semester, year, is_active, 
             created_at, updated_at 
      FROM classes 
      WHERE is_active = 1 
      ORDER BY grade DESC, class_number ASC
    `)
    return { success: true, data: classes }
  } catch (error) {
    console.error('获取班级列表失败:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('classes:getById', async (_, id: number) => {
  try {
    const classData = await dbManager.get(`
      SELECT * FROM classes WHERE id = ? AND is_active = 1
    `, [id])
    return { success: true, data: classData }
  } catch (error) {
    console.error('获取班级详情失败:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('classes:create', async (_, classData) => {
  try {
    const result = await dbManager.run(`
      INSERT INTO classes (
        name, grade, class_number, homeroom_teacher, teacher_phone,
        description, max_students, semester, year, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      classData.name,
      classData.grade,
      classData.class_number,
      classData.homeroom_teacher,
      classData.teacher_phone || null,
      classData.description || null,
      classData.max_students || 50,
      classData.semester || '上学期',
      classData.year || new Date().getFullYear(),
      true
    ])
    return { success: true, data: { id: result.lastID } }
  } catch (error) {
    console.error('创建班级失败:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('classes:update', async (_, id: number, classData) => {
  try {
    await dbManager.run(`
      UPDATE classes SET 
        name = ?, grade = ?, class_number = ?, homeroom_teacher = ?,
        teacher_phone = ?, description = ?, max_students = ?, 
        semester = ?, year = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      classData.name,
      classData.grade,
      classData.class_number,
      classData.homeroom_teacher,
      classData.teacher_phone || null,
      classData.description || null,
      classData.max_students || 50,
      classData.semester || '上学期',
      classData.year || new Date().getFullYear(),
      id
    ])
    return { success: true }
  } catch (error) {
    console.error('更新班级失败:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('classes:delete', async (_, id: number) => {
  try {
    await dbManager.run(`
      UPDATE classes SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `, [id])
    return { success: true }
  } catch (error) {
    console.error('删除班级失败:', error)
    return { success: false, error: error.message }
  }
})

function createWindow(): void {
  console.log('createWindow function called')
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 600,
    show: true,
    autoHideMenuBar: true,
    titleBarStyle: 'default',
    webSecurity: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
      webSecurity: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    console.log('Window ready to show')
    mainWindow.show()
    mainWindow.focus()
    console.log('Window shown and focused')
  })

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription)
  })

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page loaded successfully')
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 在开发模式下，使用环境变量或默认URL
  if (process.env.NODE_ENV === 'development') {
    const rendererUrl = process.env.ELECTRON_RENDERER_URL || 'http://localhost:8083'
    console.log('Loading renderer URL:', rendererUrl)
    console.log('Window created, attempting to load URL...')
    mainWindow.loadURL(rendererUrl).then(() => {
      console.log('URL loaded successfully')
    }).catch((error) => {
      console.error('Failed to load URL:', error)
    })
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  console.log('App is ready, starting initialization...')
  // 设置应用ID
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.changxiang.teacher')
  }

  // 初始化数据库
  console.log('Initializing database...')
  await dbManager.initialize()
  console.log('Database initialized successfully')

  // 设置学生管理handlers
  setupStudentHandlers(dbManager)
  
  // 设置排位管理handlers
  setupSeatingHandlers(dbManager)
  
  // 设置成绩管理handlers
  setupGradeHandlers(dbManager)
  setupEnhancedGradeHandlers(dbManager)
  
  // 设置积分管理handlers
  setupPointHandlers(dbManager)
  
  // 设置小组管理handlers
  setupGroupHandlers(dbManager)
  
  // 设置课程表管理handlers
  setupScheduleHandlers(dbManager)
  
  // 设置学期日历handlers
  setupCalendarHandlers(dbManager)
  
  // 设置文档模板handlers
  setupTemplateHandlers(dbManager)
  
  // 设置增强版文档模板handlers
  setupEnhancedTemplateHandlers(dbManager)
  
  // 设置积分商城handlers
  setupShopHandlers(dbManager)
  
  // 初始化考勤数据表
  await initAttendanceTables()
  
  // 初始化备份数据表
  await initBackupTables()
  
  // 初始化云存储数据表
  await initCloudTables()
  
  // 初始化作业管理数据表
  await initHomeworkTables(dbManager)
  
  // 初始化AI数据表
  await initAITables()
  
  // 初始化资源导航数据表
  console.log('Initializing resource tables...')
  try {
    // 添加超时机制
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Resource tables initialization timeout')), 10000)
    })
    
    await Promise.race([
      initResourceTables(dbManager.db),
      timeoutPromise
    ])
    console.log('Resource tables initialized successfully')
  } catch (error) {
    console.error('Failed to initialize resource tables:', error)
    console.log('Continuing without resource tables...')
  }

  // 设置考勤管理handlers
  console.log('Registering attendance handlers...')
  registerAttendanceHandlers()
  console.log('Attendance handlers registered')
  
  // 设置作业管理handlers
  registerHomeworkHandlers(dbManager)
  
  // 设置AI智能助手handlers
  registerAIHandlers()

  // 设置资源导航handlers
  console.log('Registering resource handlers...')
  try {
    registerResourceHandlers(dbManager.db)
    console.log('Resource handlers registered successfully')
  } catch (error) {
    console.error('Failed to register resource handlers:', error)
  }
  
  // 设置备份管理handlers
  registerBackupHandlers()
  
  // 设置云存储管理handlers
  registerCloudHandlers()
  
  // 启动自动备份调度器
  startAutoBackupScheduler()
  
  // 启动云同步调度器
  startCloudSyncScheduler()

  // 配置自动更新
  console.log('Configuring auto updater...')
  setupAutoUpdater()
  
  console.log('About to create window...')
  createWindow()
  console.log('Window creation completed')

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// IPC通信
ipcMain.handle('db-query', async (_, sql: string, params?: any[]) => {
  return await dbManager.query(sql, params)
})

ipcMain.handle('db-run', async (_, sql: string, params?: any[]) => {
  return await dbManager.run(sql, params)
})

ipcMain.handle('db-get', async (_, sql: string, params?: any[]) => {
  return await dbManager.get(sql, params)
})

ipcMain.handle('db-all', async (_, sql: string, params?: any[]) => {
  return await dbManager.all(sql, params)
})

// 自动更新功能
function setupAutoUpdater() {
  // 配置更新服务器
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'changxiang',
    repo: 'teacher-tool'
  })

  // 自动下载更新
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  // 检查更新事件
  autoUpdater.on('checking-for-update', () => {
    console.log('正在检查更新...')
    mainWindow?.webContents.send('update-checking')
  })

  autoUpdater.on('update-available', (info) => {
    console.log('发现新版本:', info.version)
    mainWindow?.webContents.send('update-available', info)
  })

  autoUpdater.on('update-not-available', (info) => {
    console.log('当前已是最新版本:', info.version)
    mainWindow?.webContents.send('update-not-available', info)
  })

  autoUpdater.on('error', (err) => {
    console.error('更新检查失败:', err)
    mainWindow?.webContents.send('update-error', err.message)
  })

  autoUpdater.on('download-progress', (progressObj) => {
    console.log(`下载进度: ${progressObj.percent}%`)
    mainWindow?.webContents.send('update-download-progress', progressObj)
  })

  autoUpdater.on('update-downloaded', (info) => {
    console.log('更新下载完成:', info.version)
    mainWindow?.webContents.send('update-downloaded', info)
  })

  // 启动时检查更新（延迟5秒）
  setTimeout(() => {
    if (!app.isPackaged) {
      console.log('开发环境，跳过更新检查')
      return
    }
    autoUpdater.checkForUpdatesAndNotify()
  }, 5000)
}

// IPC处理器：手动检查更新
ipcMain.handle('check-for-updates', async () => {
  try {
    if (!app.isPackaged) {
      return { success: false, message: '开发环境不支持更新检查' }
    }
    const result = await autoUpdater.checkForUpdatesAndNotify()
    return { success: true, data: result }
  } catch (error) {
    console.error('检查更新失败:', error)
    return { success: false, message: error.message }
  }
})

// IPC处理器：下载更新
ipcMain.handle('download-update', async () => {
  try {
    await autoUpdater.downloadUpdate()
    return { success: true }
  } catch (error) {
    console.error('下载更新失败:', error)
    return { success: false, message: error.message }
  }
})

// IPC处理器：安装更新并重启
ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall()
})

// IPC处理器：获取当前版本
ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})