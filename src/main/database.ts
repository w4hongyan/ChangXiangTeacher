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
        row INTEGER NOT NULL,
        column INTEGER NOT NULL,
        seat_type TEXT DEFAULT 'normal',
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

    // 学生小组与成员关系
    this.db.run(`
      CREATE TABLE IF NOT EXISTS groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        class_id INTEGER,
        description TEXT,
        created_by INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (class_id) REFERENCES classes(id)
      )
    `)

    this.db.run(`
      CREATE TABLE IF NOT EXISTS student_groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER,
        student_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES groups(id),
        FOREIGN KEY (student_id) REFERENCES students(id),
        UNIQUE(group_id, student_id)
      )
    `)

    this.db.run(`
      CREATE TABLE IF NOT EXISTS points (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        class_id INTEGER,
        group_id INTEGER,
        points INTEGER NOT NULL,
        type TEXT,
        reason TEXT,
        given_by INTEGER DEFAULT 1,
        given_date DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (class_id) REFERENCES classes(id),
        FOREIGN KEY (group_id) REFERENCES groups(id)
      )
    `)

    // 创建完整的文档模板表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS document_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT,
        content LONGTEXT,
        variables JSON,
        settings JSON,
        preview_image VARCHAR(500),
        tags VARCHAR(500),
        version VARCHAR(20) DEFAULT '1.0.0',
        is_public BOOLEAN DEFAULT FALSE,
        is_system BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        download_count INTEGER DEFAULT 0,
        rating DECIMAL(3,2) DEFAULT 0,
        created_by INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // 创建文档生成记录表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS document_generations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        template_id INTEGER,
        template_name VARCHAR(255),
        output_format VARCHAR(20),
        file_path VARCHAR(500),
        variables JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (template_id) REFERENCES document_templates(id)
      )
    `)

    // 创建成绩报告表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS grade_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title VARCHAR(255) NOT NULL,
        class_id INTEGER,
        subject VARCHAR(100),
        exam_type VARCHAR(50),
        semester VARCHAR(20),
        year INTEGER,
        report_type VARCHAR(50) NOT NULL,
        content LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (class_id) REFERENCES classes(id)
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

    // 创建积分商城相关表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS rewards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        points_required INTEGER NOT NULL,
        stock INTEGER DEFAULT -1,
        image TEXT,
        category TEXT DEFAULT 'physical',
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    this.db.run(`
      CREATE TABLE IF NOT EXISTS reward_exchanges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        reward_id INTEGER NOT NULL,
        quantity INTEGER DEFAULT 1,
        points_cost INTEGER NOT NULL,
        status TEXT DEFAULT 'completed',
        exchange_date DATE,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (reward_id) REFERENCES rewards(id)
      )
    `)

    this.db.run(`
      CREATE TABLE IF NOT EXISTS class_configs (
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
        FOREIGN KEY (class_id) REFERENCES classes(id)
      )
    `)

    this.db.run(`
      CREATE TABLE IF NOT EXISTS shop_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        color TEXT,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    this.db.run(`
      CREATE TABLE IF NOT EXISTS shop_items (
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
      )
    `)

    this.db.run(`
      CREATE TABLE IF NOT EXISTS shop_exchanges (
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
      )
    `)

  }

  async query(sql: string, params: any[] = []): Promise<any> {
    try {
      const stmt = this.db.prepare(sql)
      if (params && params.length) {
        stmt.bind(params)
      }
      const hasRow = stmt.step()
      const result = hasRow ? stmt.getAsObject() : null
      stmt.free()
      // SELECT 不需要保存数据库，但保持行为一致无伤大雅
      // this.saveDatabase()
      return result
    } catch (error) {
      console.error('SQL查询错误:', error)
      console.error('SQL语句:', sql)
      console.error('参数:', params)
      throw error
    }
  }

  async run(sql: string, params: any[] = []): Promise<any> {
    try {
      const stmt = this.db.prepare(sql)
      if (params && params.length) {
        stmt.bind(params)
      }
      const result = stmt.run()
      this.saveDatabase()
      stmt.free()
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
    try {
      const stmt = this.db.prepare(sql)
      if (params && params.length) {
        stmt.bind(params)
      }
      const hasRow = stmt.step()
      const result = hasRow ? stmt.getAsObject() : null
      stmt.free()
      return result
    } catch (error) {
      console.error('SQL获取单行错误:', error)
      console.error('SQL语句:', sql)
      console.error('参数:', params)
      throw error
    }
  }

  async all(sql: string, params: any[] = []): Promise<any[]> {
    try {
      const stmt = this.db.prepare(sql)
      if (params && params.length) {
        stmt.bind(params)
      }
      const results: any[] = []
      while (stmt.step()) {
        results.push(stmt.getAsObject())
      }
      stmt.free()
      return results
    } catch (error) {
      console.error('SQL获取多行错误:', error)
      console.error('SQL语句:', sql)
      console.error('参数:', params)
      throw error
    }
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
