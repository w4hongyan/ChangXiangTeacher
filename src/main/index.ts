import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { DatabaseManager } from './database'
import { setupStudentHandlers } from './handlers/student'
import { setupSeatingHandlers } from './handlers/seating'
import { setupGradeHandlers } from './handlers/grades'
import { setupPointHandlers } from './handlers/point'
import { setupGroupHandlers } from './handlers/group'

let mainWindow: BrowserWindow
const dbManager = new DatabaseManager()

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
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 在开发模式下，使用环境变量或默认URL
  if (process.env.NODE_ENV === 'development') {
    const rendererUrl = process.env.ELECTRON_RENDERER_URL || 'http://localhost:5175'
    mainWindow.loadURL(rendererUrl)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  // 设置应用ID
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.changxiang.teacher')
  }

  // 初始化数据库
  dbManager.initialize()

  // 设置学生管理handlers
  setupStudentHandlers(dbManager)
  
  // 设置排位管理handlers
  setupSeatingHandlers(dbManager)
  
  // 设置成绩管理handlers
  setupGradeHandlers(dbManager)
  
  // 设置积分管理handlers
  setupPointHandlers(dbManager)
  
  // 设置小组管理handlers
  setupGroupHandlers(dbManager)

  createWindow()

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