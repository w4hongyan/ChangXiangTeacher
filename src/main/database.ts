import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import knex from 'knex'

export class DatabaseManager {
  private db: knex.Knex
  private dbPath: string

  constructor() {
    // 将数据库移动到软件目录中，方便移动复制
    // 使用应用程序安装目录下的data文件夹存储数据库
    const appPath = app.getAppPath()
    const dataDir = path.join(path.dirname(appPath), 'data')
    this.dbPath = path.join(dataDir, 'database.db')
    
    this.db = knex({
      client: 'sqlite3',
      connection: {
        filename: this.dbPath
      },
      useNullAsDefault: true,
      pool: {
        min: 1,
        max: 1
      }
    })
  }

  async initialize(): Promise<void> {
    try {
      // 确保数据库目录存在
      const dbDir = path.dirname(this.dbPath)
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true })
      }

      // 创建所有必要的表
      await this.createTables()
      console.log('数据库初始化完成')
    } catch (error) {
      console.error('数据库初始化失败:', error)
    }
  }

  private async createTables(): Promise<void> {
    // 班级表
    await this.db.schema.hasTable('classes').then((exists) => {
      if (!exists) {
        return this.db.schema.createTable('classes', (table) => {
          table.increments('id').primary()
          table.string('name').notNullable() // 班级名称
          table.string('grade').notNullable() // 年级
          table.string('class_number').notNullable() // 班级序号
          table.string('homeroom_teacher') // 班主任
          table.string('teacher_phone') // 班主任电话
          table.string('description')
          table.integer('max_students').defaultTo(50)
          table.string('semester')
          table.integer('year')
          table.boolean('is_active').defaultTo(true)
          table.timestamps(true, true)
        })
      }
    })

    // 学生表
    await this.db.schema.hasTable('students').then((exists) => {
      if (!exists) {
        return this.db.schema.createTable('students', (table) => {
          table.increments('id').primary()
          table.string('student_id').unique() // 学号可选，但如果提供则必须唯一
          table.string('name').notNullable()
          table.string('gender')
          table.date('birth_date')
          table.string('phone')
          table.string('parent_phone')
          table.string('email')
          table.string('address')
          table.string('photo_path')
          table.text('notes')
          table.integer('class_id').unsigned().references('id').inTable('classes')
          table.integer('height').defaultTo(160)
          table.string('eyesight')
          table.string('special_needs')
          table.boolean('is_active').defaultTo(true)
          table.timestamps(true, true)
        })
      }
    })

    // 座位表
    await this.db.schema.hasTable('seats').then((exists) => {
      if (!exists) {
        return this.db.schema.createTable('seats', (table) => {
          table.increments('id').primary()
          table.integer('class_id').unsigned().references('id').inTable('classes')
          table.integer('student_id').unsigned().references('id').inTable('students')
          table.integer('row').notNullable()
          table.integer('column').notNullable()
          table.string('seat_type').defaultTo('normal')
          table.timestamps(true, true)
          
          // 添加组合索引，确保一个学生在同一个班级中只能有一个座位
          table.unique(['class_id', 'student_id'])
          // 确保同一个班级中的同一个座位只能被一个学生占用
          table.unique(['class_id', 'row', 'column'])
        })
      }
    })

    // 成绩表
    await this.db.schema.hasTable('grades').then((exists) => {
      if (!exists) {
        return this.db.schema.createTable('grades', (table) => {
          table.increments('id').primary()
          table.integer('student_id').unsigned().references('id').inTable('students')
          table.integer('class_id').unsigned().references('id').inTable('classes')
          table.string('subject').notNullable()
          table.decimal('score', 5, 2).notNullable()
          table.string('exam_type').notNullable() // 期中、期末、平时、月考等
          table.date('exam_date')
          table.string('semester')
          table.integer('year')
          table.text('notes')
          table.timestamps(true, true)
        })
      }
    })

    // 积分表
    await this.db.schema.hasTable('points').then((exists) => {
      if (!exists) {
        return this.db.schema.createTable('points', (table) => {
          table.increments('id').primary()
          table.integer('student_id').unsigned().references('id').inTable('students')
          table.integer('class_id').unsigned().references('id').inTable('classes')
          table.integer('points').notNullable()
          table.string('type').notNullable() // 奖励、惩罚
          table.string('reason').notNullable()
          table.integer('given_by').defaultTo(1) // 记录给分的老师ID
          table.date('given_date')
          table.timestamps(true, true)
        })
      }
    })

    // 班级配置表
    await this.db.schema.hasTable('class_configs').then((exists) => {
      if (!exists) {
        return this.db.schema.createTable('class_configs', (table) => {
          table.increments('id').primary()
          table.integer('class_id').unsigned().references('id').inTable('classes')
          table.integer('rows').defaultTo(6)
          table.integer('columns').defaultTo(8)
          table.json('seat_layout') // 自定义座位布局
          table.string('numbering_mode').defaultTo('row-column') // 编号模式
          table.string('numbering_direction').defaultTo('top') // 编号方向
          table.json('point_rules') // 积分规则配置
          table.timestamps(true, true)
        })
      }
    })

    // 检查是否需要添加新字段（用于现有数据库的迁移）
    const hasNumberingMode = await this.db.schema.hasColumn('class_configs', 'numbering_mode')
    if (!hasNumberingMode) {
      await this.db.schema.alterTable('class_configs', (table) => {
        table.string('numbering_mode').defaultTo('row-column')
        table.string('numbering_direction').defaultTo('top')
      })
    }
    
    // 创建小组表
    await this.db.schema.hasTable('groups').then((exists) => {
      if (!exists) {
        return this.db.schema.createTable('groups', (table) => {
          table.increments('id').primary()
          table.string('name').notNullable() // 小组名称
          table.integer('class_id').unsigned().references('id').inTable('classes')
          table.text('description') // 小组描述
          table.integer('created_by').defaultTo(1) // 创建者ID
          table.timestamps(true, true)
        })
      }
    })
    
    // 创建学生小组关联表
    await this.db.schema.hasTable('student_groups').then((exists) => {
      if (!exists) {
        return this.db.schema.createTable('student_groups', (table) => {
          table.increments('id').primary()
          table.integer('group_id').unsigned().references('id').inTable('groups')
          table.integer('student_id').unsigned().references('id').inTable('students')
          table.timestamps(true, true)
          
          // 确保一个学生在一个小组中只能出现一次
          table.unique(['group_id', 'student_id'])
        })
      }
    })
    
    // 检查积分表是否支持小组积分
    const hasGroupId = await this.db.schema.hasColumn('points', 'group_id')
    if (!hasGroupId) {
      await this.db.schema.alterTable('points', (table) => {
        table.integer('group_id').unsigned().references('id').inTable('groups').nullable()
      })
    }
    
    // 检查并处理座位表的数据一致性（移除重复的学生座位记录）
    try {
      // 清除重复的学生座位记录（保留最新的记录）
      await this.db.raw(`
        DELETE FROM seats 
        WHERE id NOT IN (
          SELECT MIN(id) 
          FROM seats 
          WHERE student_id IS NOT NULL 
          GROUP BY class_id, student_id
        ) AND student_id IS NOT NULL
      `)
    } catch (error) {
      console.log('清理重复座位记录时出错（正常）:', error)
    }
  }

  async query(sql: string, params: any[] = []): Promise<any> {
    return this.db.raw(sql, params)
  }

  async run(sql: string, params: any[] = []): Promise<any> {
    const result = await this.db.raw(sql, params)
    
    // 对于 INSERT 操作，需要返回包含 lastID 的对象
    if (sql.trim().toUpperCase().startsWith('INSERT')) {
      // 获取最后插入的ID
      const lastIDResult = await this.db.raw('SELECT last_insert_rowid() as lastID')
      const lastID = Array.isArray(lastIDResult) && lastIDResult.length > 0 
        ? lastIDResult[0].lastID 
        : null
      
      return { lastID, lastInsertRowid: lastID }
    }
    
    // 对于其他操作（UPDATE, DELETE），返回受影响的行数
    if (sql.trim().toUpperCase().startsWith('UPDATE') || sql.trim().toUpperCase().startsWith('DELETE')) {
      const changesResult = await this.db.raw('SELECT changes() as changes')
      const changes = Array.isArray(changesResult) && changesResult.length > 0 
        ? changesResult[0].changes 
        : 0
      
      return { changes }
    }
    
    return result
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    const result = await this.db.raw(sql, params)
    // Knex raw 返回 [{...}] 格式，需要取第一个元素
    return Array.isArray(result) && result.length > 0 ? result[0] : null
  }

  async all(sql: string, params: any[] = []): Promise<any[]> {
    const result = await this.db.raw(sql, params)
    // Knex raw 直接返回结果数组
    return Array.isArray(result) ? result : []
  }

  async close(): Promise<void> {
    await this.db.destroy()
  }
}
