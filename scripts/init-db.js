#!/usr/bin/env node
'use strict'

const path = require('path')
const fs = require('fs')
const initSqlJs = require('sql.js')
const os = require('os')
const homedir = os.homedir()

// 解析命令行参数
const args = process.argv.slice(2)
let dbPath = null

// 查找是否有 --db-path 参数
const dbPathIndex = args.findIndex(arg => arg.startsWith('--db-path='))
if (dbPathIndex !== -1) {
  // 有指定数据库路径参数
  dbPath = args[dbPathIndex].split('=')[1]
} else {
  // 默认使用应用程序实际使用的数据库路径
  // Windows: C:\Users\用户名\AppData\Roaming\changxiang-teacher\data\database.db
  // macOS: /Users/用户名/Library/Application Support/changxiang-teacher/data/database.db
  // Linux: /home/用户名/.config/changxiang-teacher/data/database.db
  let appDataPath
  if (process.platform === 'win32') {
    appDataPath = process.env.APPDATA || path.join(homedir, 'AppData', 'Roaming')
  } else if (process.platform === 'darwin') {
    appDataPath = path.join(homedir, 'Library', 'Application Support')
  } else {
    appDataPath = process.env.XDG_CONFIG_HOME || path.join(homedir, '.config')
  }
  
  const dataDir = path.join(appDataPath, 'changxiang-teacher', 'data')
  dbPath = path.join(dataDir, 'database.db')
  
  // 确保数据目录存在
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

console.log('使用的数据库路径:', dbPath)

;(async () => {
  try {
    console.log('开始初始化数据库...')

    const SQL = await initSqlJs({
      locateFile: (file) => require.resolve('sql.js/dist/' + file)
    })

    // 如果已存在数据库文件，则在其基础上迁移；否则创建新库
    let db
    if (fs.existsSync(dbPath)) {
      const fileBuffer = fs.readFileSync(dbPath)
      db = new SQL.Database(new Uint8Array(fileBuffer))
      console.log('已加载现有数据库，将进行结构更新...')
    } else {
      db = new SQL.Database()
      console.log('创建新数据库...')
    }

    // 建表语句（与主进程 database.ts 对齐的核心表 + 商城相关表）
    const createTablesSQL = [
      `CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        grade TEXT NOT NULL,
        class_number TEXT NOT NULL,
        homeroom_teacher TEXT,
        teacher_phone TEXT,
        description TEXT,
        max_students INTEGER DEFAULT 50,
        semester TEXT DEFAULT '上学期',
        year INTEGER DEFAULT 2024,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        gender TEXT,
        birth_date DATE,
        phone TEXT,
        parent_phone TEXT,
        email TEXT,
        address TEXT,
        photo_path TEXT,
        notes TEXT,
        class_id INTEGER,
        height INTEGER DEFAULT 160,
        eyesight TEXT,
        special_needs TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (class_id) REFERENCES classes (id)
      )`,

      `CREATE TABLE IF NOT EXISTS seats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_id INTEGER,
        student_id INTEGER,
        row INTEGER NOT NULL,
        column INTEGER NOT NULL,
        seat_type TEXT DEFAULT 'normal',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (class_id) REFERENCES classes (id),
        FOREIGN KEY (student_id) REFERENCES students (id)
      )`,

      `CREATE TABLE IF NOT EXISTS grades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        class_id INTEGER,
        subject TEXT NOT NULL,
        score DECIMAL(5,2) NOT NULL,
        exam_type TEXT NOT NULL,
        exam_date DATE,
        semester TEXT,
        year INTEGER,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students (id),
        FOREIGN KEY (class_id) REFERENCES classes (id)
      )`,

      // 先建 groups 与 student_groups，供 points 外键引用
      `CREATE TABLE IF NOT EXISTS groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        class_id INTEGER,
        description TEXT,
        created_by INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (class_id) REFERENCES classes (id)
      )`,

      `CREATE TABLE IF NOT EXISTS student_groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER,
        student_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES groups (id),
        FOREIGN KEY (student_id) REFERENCES students (id),
        UNIQUE(group_id, student_id)
      )`,

      `CREATE TABLE IF NOT EXISTS points (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        class_id INTEGER,
        group_id INTEGER,
        points INTEGER NOT NULL,
        type TEXT NOT NULL,
        reason TEXT NOT NULL,
        given_by INTEGER DEFAULT 1,
        given_date DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students (id),
        FOREIGN KEY (class_id) REFERENCES classes (id),
        FOREIGN KEY (group_id) REFERENCES groups (id)
      )`,

      // 班级配置表
      `CREATE TABLE IF NOT EXISTS class_configs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_id INTEGER,
        rows INTEGER DEFAULT 6,
        columns INTEGER DEFAULT 8,
        seat_layout TEXT,
        numbering_mode TEXT DEFAULT 'row-column',
        numbering_direction TEXT DEFAULT 'top',
        point_rules TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (class_id) REFERENCES classes (id)
      )`,

      // 新版积分商城相关表（与 shop.ts 处理逻辑一致）
      `CREATE TABLE IF NOT EXISTS shop_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        color TEXT,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS shop_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price INTEGER NOT NULL,
        category TEXT NOT NULL,
        image_url TEXT,
        stock INTEGER DEFAULT -1,
        is_active BOOLEAN DEFAULT 1,
        sort_order INTEGER DEFAULT 0,
        sold_count INTEGER DEFAULT 0,
        attributes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS shop_exchanges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        item_id INTEGER NOT NULL,
        class_id INTEGER,
        quantity INTEGER DEFAULT 1,
        points_cost INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        notes TEXT,
        approved_by INTEGER,
        approved_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (item_id) REFERENCES shop_items(id),
        FOREIGN KEY (class_id) REFERENCES classes(id)
      )`
    ]

    // 执行建表（使用事务）
    db.exec('BEGIN')
    try {
      for (const sql of createTablesSQL) {
        db.exec(sql)
      }
      db.exec('COMMIT')
      console.log('表结构创建/更新完成')
    } catch (e) {
      db.exec('ROLLBACK')
      throw e
    }

    // 插入示例数据（仅示例班级）
    const sampleClasses = [
      { name: '七年级1班', grade: '七年级', class_number: '1', homeroom_teacher: '张老师', teacher_phone: '13800138001', semester: '上学期', year: 2024, max_students: 45, description: '这是一个团结向上的优秀班级' },
      { name: '七年级2班', grade: '七年级', class_number: '2', homeroom_teacher: '李老师', teacher_phone: '13800138002', semester: '上学期', year: 2024, max_students: 48, description: '这是一个充满活力的班级' },
      { name: '八年级1班', grade: '八年级', class_number: '1', homeroom_teacher: '王老师', teacher_phone: '13800138003', semester: '下学期', year: 2024, max_students: 46, description: '这是一个学习氛围浓厚的班级' }
    ]

    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO classes (
        name, grade, class_number, homeroom_teacher, teacher_phone,
        semester, year, max_students, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    db.exec('BEGIN')
    try {
      for (const c of sampleClasses) {
        insertStmt.run([
          c.name,
          c.grade,
          c.class_number,
          c.homeroom_teacher,
          c.teacher_phone,
          c.semester,
          c.year,
          c.max_students,
          c.description
        ])
      }
      insertStmt.free()
      db.exec('COMMIT')
      console.log('示例数据插入完成')
    } catch (e) {
      insertStmt.free()
      db.exec('ROLLBACK')
      console.warn('插入示例数据失败或已存在，已跳过。原因：', e.message || e)
    }

    // 插入示例商品分类数据
    const sampleCategories = [
      { name: '学习用品', description: '各类学习相关物品', icon: '📚', color: '#409EFF', sort_order: 1, is_active: 1 },
      { name: '生活用品', description: '各类生活相关物品', icon: '🧴', color: '#67C23A', sort_order: 2, is_active: 1 },
      { name: '娱乐用品', description: '各类娱乐相关物品', icon: '🎮', color: '#E6A23C', sort_order: 3, is_active: 1 },
      { name: '奖励物品', description: '各类奖励相关物品', icon: '🏆', color: '#F56C6C', sort_order: 4, is_active: 1 },
      { name: '特色商品', description: '特色定制商品', icon: '⭐', color: '#909399', sort_order: 5, is_active: 1 }
    ]

    const insertCategoryStmt = db.prepare(`
      INSERT OR IGNORE INTO shop_categories (
        name, description, icon, color, sort_order, is_active
      ) VALUES (?, ?, ?, ?, ?, ?)
    `)

    db.exec('BEGIN')
    try {
      for (const category of sampleCategories) {
        insertCategoryStmt.run([
          category.name,
          category.description,
          category.icon,
          category.color,
          category.sort_order,
          category.is_active
        ])
      }
      insertCategoryStmt.free()
      db.exec('COMMIT')
      console.log('示例商品分类数据插入完成')
    } catch (e) {
      insertCategoryStmt.free()
      db.exec('ROLLBACK')
      console.warn('插入示例商品分类数据失败或已存在，已跳过。原因：', e.message || e)
    }

    // 保存数据库文件
    const data = db.export()
    fs.writeFileSync(dbPath, Buffer.from(data))
    console.log('数据库初始化完成')
    console.log('数据库文件位置:', dbPath)

    db.close()
  } catch (err) {
    console.error('数据库初始化失败:', err)
    process.exit(1)
  }
})()

module.exports = { dbPath }