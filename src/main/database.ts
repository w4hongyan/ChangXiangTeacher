import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import initSqlJs from 'sql.js'

export class DatabaseManager {
  private db: any
  private dbPath: string
  private SQL: any

  constructor() {
    // 使用用户数据目录存储数据库，避免在只读的asar文件中创建文件
    const userDataPath = app.getPath('userData')
    const dataDir = path.join(userDataPath, 'data')
    this.dbPath = path.join(dataDir, 'database.db')
    console.log('应用程序使用的数据库路径:', this.dbPath)
    console.log('userDataPath:', userDataPath)
    console.log('dataDir:', dataDir)
  }

  async initialize(): Promise<void> {
    try {
      // 初始化sql.js
      this.SQL = await initSqlJs()
      
      // 确保数据目录存在
      const dbDir = path.dirname(this.dbPath)
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true })
        console.log('创建数据目录:', dbDir)
      }
      
      // 加载或创建数据库
      let dbData: Uint8Array | undefined
      if (fs.existsSync(this.dbPath)) {
        dbData = fs.readFileSync(this.dbPath)
      }
      
      this.db = new this.SQL.Database(dbData)
      
      console.log('开始创建数据库表...')
      await this.createTables()
      console.log('数据库表创建完成')
      
      // 保存数据库到文件
      this.saveDatabase()
      
      console.log('数据库初始化完成')
    } catch (error) {
      console.error('数据库初始化失败:', error)
      throw error
    }
  }

  private saveDatabase(): void {
    const data = this.db.export()
    fs.writeFileSync(this.dbPath, data)
  }

  private async createTables(): Promise<void> {
    // 班级表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        grade TEXT NOT NULL,
        class_number TEXT NOT NULL,
        homeroom_teacher TEXT,
        teacher_phone TEXT,
        description TEXT,
        max_students INTEGER DEFAULT 50,
        semester TEXT,
        year INTEGER,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // 学生表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT UNIQUE,
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
        FOREIGN KEY (class_id) REFERENCES classes(id)
      )
    `)

    // 座位表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS seats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_id INTEGER NOT NULL,
        student_id INTEGER,
        row_number INTEGER NOT NULL,
        col_number INTEGER NOT NULL,
        is_occupied BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (class_id) REFERENCES classes(id),
        FOREIGN KEY (student_id) REFERENCES students(id)
      )
    `)

    // 其他表...
    this.db.run(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        class_id INTEGER NOT NULL,
        date DATE NOT NULL,
        status TEXT NOT NULL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (class_id) REFERENCES classes(id)
      )
    `)

    this.db.run(`
      CREATE TABLE IF NOT EXISTS grades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        subject TEXT NOT NULL,
        score REAL,
        max_score REAL DEFAULT 100,
        exam_type TEXT,
        exam_date DATE,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id)
      )
    `)

    this.db.run(`
      CREATE TABLE IF NOT EXISTS points (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        points INTEGER NOT NULL,
        reason TEXT,
        type TEXT,
        date DATE DEFAULT CURRENT_DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id)
      )
    `)

    this.db.run(`
      CREATE TABLE IF NOT EXISTS templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        content TEXT NOT NULL,
        description TEXT,
        tags TEXT,
        is_public BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    this.db.run(`
      CREATE TABLE IF NOT EXISTS schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_id INTEGER NOT NULL,
        subject TEXT NOT NULL,
        teacher TEXT,
        day_of_week INTEGER NOT NULL,
        period INTEGER NOT NULL,
        classroom TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (class_id) REFERENCES classes(id)
      )
    `)
  }

  async query(sql: string, params: any[] = []): Promise<any> {
    const stmt = this.db.prepare(sql)
    const result = stmt.getAsObject(params)
    this.saveDatabase()
    return result
  }

  async run(sql: string, params: any[] = []): Promise<any> {
    try {
      const stmt = this.db.prepare(sql)
      const result = stmt.run(params)
      this.saveDatabase()
      return {
        changes: this.db.getRowsModified(),
        lastInsertRowid: result ? result.lastInsertRowid : null
      }
    } catch (error) {
      console.error('SQL执行错误:', error)
      console.error('SQL语句:', sql)
      console.error('参数:', params)
      throw error
    }
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    const stmt = this.db.prepare(sql)
    const result = stmt.getAsObject(params)
    return result
  }

  async all(sql: string, params: any[] = []): Promise<any[]> {
    const stmt = this.db.prepare(sql)
    const results = []
    while (stmt.step()) {
      results.push(stmt.getAsObject())
    }
    stmt.free()
    return results
  }

  async selectFirst(table: string, where: Record<string, any>): Promise<any> {
    const keys = Object.keys(where)
    const whereClause = keys.map(key => `${key} = ?`).join(' AND ')
    const values = keys.map(key => where[key])
    const sql = `SELECT * FROM ${table} WHERE ${whereClause} LIMIT 1`
    return this.get(sql, values)
  }

  async tableExists(tableName: string): Promise<boolean> {
    const sql = `SELECT name FROM sqlite_master WHERE type='table' AND name=?`
    const result = await this.get(sql, [tableName])
    return !!result && !!result.name
  }

  async createTable(tableName: string, createSql: string): Promise<void> {
    await this.run(createSql)
  }

  async exec(sql: string): Promise<void> {
    this.db.exec(sql)
    this.saveDatabase()
  }

  async close(): Promise<void> {
    if (this.db) {
      this.saveDatabase()
      this.db.close()
    }
  }
}

let dbInstance: DatabaseManager | null = null

export const getDatabase = () => {
  if (!dbInstance) {
    dbInstance = new DatabaseManager()
  }
  return dbInstance
}

export const getDatabaseManager = (): DatabaseManager => {
  if (!dbInstance) {
    dbInstance = new DatabaseManager()
  }
  return dbInstance
}
