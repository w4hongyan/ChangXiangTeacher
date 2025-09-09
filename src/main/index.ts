import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { DatabaseManager } from './database'
import { setupStudentHandlers } from './handlers/student'
import { setupGradeHandlers } from './handlers/grades'
import { setupSeatingHandlers } from './handlers/seating'
import { setupPointHandlers } from './handlers/point'
import { setupGroupHandlers } from './handlers/group'
import { setupScheduleHandlers } from './handlers/schedule'
import { setupCalendarHandlers } from './handlers/calendar'
import { setupDocumentHandlers } from './handlers/document'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

let mainWindow: BrowserWindow
let dbManager: DatabaseManager

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

// 添加批量升级班级的处理程序
ipcMain.handle('classes:batchUpgrade', async (_, options) => {
  try {
    const { targetYear } = options || {};
    const currentYear = targetYear || new Date().getFullYear();
    
    // 定义年级升级映射关系
    const gradeUpgradeMap = {
      '一年级': '二年级',
      '二年级': '三年级',
      '三年级': '四年级',
      '四年级': '五年级',
      '五年级': '六年级',
      '六年级': '七年级',
      '七年级': '八年级',
      '八年级': '九年级',
      '九年级': '十年级',
      '十年级': '十一年级',
      '十一年级': '十二年级',
      '十二年级': '毕业班'
    };
    
    // 获取所有活跃班级
    const classes = await dbManager.all(`
      SELECT id, grade, year FROM classes WHERE is_active = 1
    `);
    
    // 批量更新班级年级和学年
    let updatedCount = 0;
    for (const classData of classes) {
      const newGrade = gradeUpgradeMap[classData.grade] || classData.grade;
      const newYear = classData.year ? classData.year + 1 : currentYear;
      
      await dbManager.run(`
        UPDATE classes 
        SET grade = ?, year = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [newGrade, newYear, classData.id]);
      
      updatedCount++;
    }
    
    return { success: true, updatedCount };
  } catch (error) {
    console.error('批量升级班级失败:', error);
    return { success: false, error: error.message };
  }
})

// 添加获取首页统计数据的处理程序
ipcMain.handle('dashboard:getStats', async () => {
  try {
    // 获取班级数量
    const classCountResult = await dbManager.get(`
      SELECT COUNT(*) as count FROM classes WHERE is_active = 1
    `);
    const classCount = classCountResult?.count || 0;

    // 获取学生总数
    const studentCountResult = await dbManager.get(`
      SELECT COUNT(*) as count FROM students WHERE is_active = 1
    `);
    const studentCount = studentCountResult?.count || 0;

    // 获取本月考试次数
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    const examCountResult = await dbManager.get(`
      SELECT COUNT(*) as count FROM grades 
      WHERE exam_date >= ? AND exam_date <= ?
    `, [
      firstDayOfMonth.toISOString().split('T')[0],
      lastDayOfMonth.toISOString().split('T')[0]
    ]);
    const examCount = examCountResult?.count || 0;

    // 获取积分排名前10的学生
    const topStudents = await dbManager.all(`
      SELECT 
        s.name as student_name,
        SUM(p.points) as total_points
      FROM students s
      LEFT JOIN points p ON s.id = p.student_id
      WHERE s.is_active = 1
      GROUP BY s.id, s.name
      ORDER BY total_points DESC
      LIMIT 10
    `);

    // 模拟最近活动数据
    const recentActivities = [
      { title: '新增班级', time: new Date().toISOString() },
      { title: '学生成绩录入', time: new Date(Date.now() - 86400000).toISOString() }, // 1天前
      { title: '座位调整完成', time: new Date(Date.now() - 172800000).toISOString() }, // 2天前
      { title: '积分规则更新', time: new Date(Date.now() - 259200000).toISOString() }, // 3天前
      { title: '学生信息导入', time: new Date(Date.now() - 345600000).toISOString() } // 4天前
    ];

    return {
      success: true,
      data: {
        classCount,
        studentCount,
        examCount,
        topStudents,
        recentActivities
      }
    };
  } catch (error) {
    console.error('获取首页统计数据失败:', error);
    return { success: false, error: error.message };
  }
});

app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  if (process.platform === 'win32') {
    app.setAppUserModelId('com.changxiang.teacher')
  }

  // 初始化数据库
  dbManager = new DatabaseManager()
  dbManager.initialize()

  // 设置IPC处理程序
  setupStudentHandlers(dbManager)
  setupGradeHandlers(dbManager)
  setupSeatingHandlers(dbManager)
  setupPointHandlers(dbManager)
  setupGroupHandlers(dbManager)
  setupScheduleHandlers(dbManager)
  setupCalendarHandlers(dbManager)
  setupDocumentHandlers(dbManager)

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
