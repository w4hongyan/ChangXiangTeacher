#!/usr/bin/env node

const path = require('path')
const fs = require('fs')
const sqlite3 = require('sqlite3').verbose()

// 将数据库移动到软件目录中，方便移动复制
// 使用项目根目录下的data文件夹存储数据库
const dataDir = path.join(__dirname, '..', 'data')
const dbPath = path.join(dataDir, 'database.db')

// 确保目录存在
const dbDir = path.dirname(dbPath)
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err)
    return
  }
  console.log('开始初始化数据库...')
})

// 创建表的SQL语句
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

  `CREATE TABLE IF NOT EXISTS points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    class_id INTEGER,
    points INTEGER NOT NULL,
    type TEXT NOT NULL,
    reason TEXT NOT NULL,
    given_by INTEGER DEFAULT 1,
    given_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students (id),
    FOREIGN KEY (class_id) REFERENCES classes (id)
  )`,

  `CREATE TABLE IF NOT EXISTS class_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER,
    rows INTEGER DEFAULT 6,
    columns INTEGER DEFAULT 8,
    seat_layout TEXT,
    point_rules TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes (id)
  )`
]

// 执行创建表
db.serialize(() => {
  let completed = 0
  
  createTablesSQL.forEach((sql, index) => {
    db.run(sql, (err) => {
      if (err) {
        console.error(`创建表 ${index + 1} 失败:`, err)
      } else {
        console.log(`表 ${index + 1} 创建成功`)
        completed++
        
        if (completed === createTablesSQL.length) {
          insertSampleData()
        }
      }
    })
  })
})

// 插入示例数据
const insertSampleData = () => {
  const sampleClasses = [
    { name: '七年级1班', grade: '七年级', class_number: '1', homeroom_teacher: '张老师', teacher_phone: '13800138001', semester: '上学期', year: 2024, max_students: 45, description: '这是一个团结向上的优秀班级' },
    { name: '七年级2班', grade: '七年级', class_number: '2', homeroom_teacher: '李老师', teacher_phone: '13800138002', semester: '上学期', year: 2024, max_students: 48, description: '这是一个充满活力的班级' },
    { name: '八年级1班', grade: '八年级', class_number: '1', homeroom_teacher: '王老师', teacher_phone: '13800138003', semester: '下学期', year: 2024, max_students: 46, description: '这是一个学习氛围浓厚的班级' }
  ]

  // 插入示例班级
  let classesInserted = 0
  sampleClasses.forEach((classData) => {
    db.run(
      `INSERT OR IGNORE INTO classes (
        name, grade, class_number, homeroom_teacher, teacher_phone, 
        semester, year, max_students, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        classData.name, classData.grade, classData.class_number,
        classData.homeroom_teacher, classData.teacher_phone,
        classData.semester, classData.year, classData.max_students,
        classData.description
      ],
      (err) => {
        if (err) {
          console.error('插入示例班级失败:', err)
        } else {
          classesInserted++
          if (classesInserted === sampleClasses.length) {
            console.log('示例数据插入完成')
            closeDatabase()
          }
        }
      }
    )
  })
}

const closeDatabase = () => {
  db.close((err) => {
    if (err) {
      console.error('关闭数据库失败:', err)
    } else {
      console.log('数据库初始化完成')
      console.log('数据库文件位置:', dbPath)
    }
  })
}

module.exports = { dbPath }