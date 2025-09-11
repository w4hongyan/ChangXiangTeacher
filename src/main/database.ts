import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import knex from 'knex'
import sqlite3 from 'sqlite3'

export class DatabaseManager {
  private db: knex.Knex
  private dbPath: string

  constructor() {
    // 将数据库移动到软件目录中，方便移动复制
    // 使用应用程序安装目录下的data文件夹存储数据库
    const appPath = app.getAppPath()
    const dataDir = path.join(appPath, 'data')
    this.dbPath = path.join(dataDir, 'database.db')
    console.log('应用程序使用的数据库路径:', this.dbPath)
    console.log('appPath:', appPath)
    console.log('dataDir:', dataDir)
    
    this.db = knex({
      client: 'sqlite3',
      connection: {
        filename: this.dbPath
      },
      useNullAsDefault: true,
      pool: {
        min: 1,
        max: 1,
        afterCreate: (conn: any, done: any) => {
          // 设置SQLite使用UTF-8编码
          conn.run('PRAGMA encoding = "UTF-8"', (err: any) => {
            if (err) {
              console.error('设置编码失败:', err)
            } else {
              console.log('SQLite编码设置为UTF-8')
            }
            done(err)
          })
        }
      }
    })
  }

  async initialize(): Promise<void> {
    try {
      // 确保数据目录存在
      const dbDir = path.dirname(this.dbPath)
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true })
        console.log('创建数据目录:', dbDir)
      }
      
      console.log('开始创建数据库表...')
      await this.createTables()
      console.log('数据库表创建完成')
      
      // 验证表是否创建成功
      const tables = await this.db.raw("SELECT name FROM sqlite_master WHERE type='table'")
      console.log('已创建的表:', tables.map((t: any) => t.name))
      
      console.log('数据库初始化完成')
    } catch (error) {
      console.error('数据库初始化失败:', error)
      throw error
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

    // 课程表
    await this.db.schema.hasTable('schedules').then((exists) => {
      if (!exists) {
        return this.db.schema.createTable('schedules', (table) => {
          table.increments('id').primary()
          table.integer('class_id').unsigned().references('id').inTable('classes')
          table.string('subject').notNullable() // 科目名称
          table.string('teacher_name') // 任课教师
          table.integer('day_of_week').notNullable() // 星期几 (1-7)
          table.integer('period').notNullable() // 第几节课 (1-8)
          table.string('classroom') // 教室
          table.string('semester').notNullable() // 学期
          table.integer('year').notNullable() // 学年
          table.time('start_time') // 开始时间
          table.time('end_time') // 结束时间
          table.text('notes') // 备注
          table.boolean('is_active').defaultTo(true)
          table.timestamps(true, true)
          
          // 确保同一班级、同一时间段只能有一门活跃课程
          table.unique(['class_id', 'day_of_week', 'period', 'semester', 'year', 'is_active'])
        })
      }
    })

    // 学期日历事件表
    await this.db.schema.hasTable('calendar_events').then((exists) => {
      if (!exists) {
        return this.db.schema.createTable('calendar_events', (table) => {
          table.increments('id').primary()
          table.string('title').notNullable() // 事件标题
          table.text('description') // 事件描述
          table.date('event_date').notNullable() // 事件日期
          table.time('start_time') // 开始时间
          table.time('end_time') // 结束时间
          table.string('event_type').notNullable() // 事件类型：exam, holiday, activity, meeting, deadline
          table.string('color').defaultTo('#409EFF') // 事件颜色
          table.integer('class_id').unsigned().references('id').inTable('classes').nullable() // 关联班级（可选）
          table.boolean('is_reminder').defaultTo(false) // 是否提醒
          table.integer('reminder_minutes').defaultTo(30) // 提前提醒分钟数
          table.string('semester').notNullable() // 学期
          table.integer('year').notNullable() // 学年
          table.boolean('is_active').defaultTo(true)
          table.timestamps(true, true)
        })
      }
    })

    // 积分商城商品表
    await this.db.schema.hasTable('shop_items').then((exists) => {
      if (!exists) {
        return this.db.schema.createTable('shop_items', (table) => {
          table.increments('id').primary()
          table.string('name').notNullable() // 商品名称
          table.text('description') // 商品描述
          table.integer('price').notNullable() // 积分价格
          table.string('category').notNullable() // 商品分类
          table.string('image_url') // 商品图片
          table.integer('stock').defaultTo(-1) // 库存数量，-1表示无限
          table.integer('sold_count').defaultTo(0) // 已售数量
          table.boolean('is_active').defaultTo(true) // 是否上架
          table.integer('sort_order').defaultTo(0) // 排序
          table.json('attributes') // 商品属性（JSON格式）
          table.timestamps(true, true)
        })
      }
    })

    // 积分商城兑换记录表
    await this.db.schema.hasTable('shop_exchanges').then((exists) => {
      if (!exists) {
        return this.db.schema.createTable('shop_exchanges', (table) => {
          table.increments('id').primary()
          table.integer('student_id').unsigned().references('id').inTable('students')
          table.integer('item_id').unsigned().references('id').inTable('shop_items')
          table.integer('class_id').unsigned().references('id').inTable('classes')
          table.integer('quantity').defaultTo(1) // 兑换数量
          table.integer('points_cost').notNullable() // 消耗积分
          table.string('status').defaultTo('pending') // 状态：pending, approved, rejected, completed
          table.text('notes') // 备注
          table.integer('approved_by').nullable() // 审批人ID
          table.timestamp('approved_at').nullable() // 审批时间
          table.timestamp('completed_at').nullable() // 完成时间
          table.timestamps(true, true)
        })
      }
    })

    // 积分商城分类表
    await this.db.schema.hasTable('shop_categories').then((exists) => {
      if (!exists) {
        return this.db.schema.createTable('shop_categories', (table) => {
          table.increments('id').primary()
          table.string('name').notNullable() // 分类名称
          table.text('description') // 分类描述
          table.string('icon') // 分类图标
          table.string('color').defaultTo('#409EFF') // 分类颜色
          table.integer('sort_order').defaultTo(0) // 排序
          table.boolean('is_active').defaultTo(true) // 是否启用
          table.timestamps(true, true)
        })
      }
    })

    // 文档模板表
    await this.db.schema.hasTable('document_templates').then((exists) => {
      if (!exists) {
        return this.db.schema.createTable('document_templates', (table) => {
          table.increments('id').primary()
          table.string('name').notNullable() // 模板名称
          table.string('category').notNullable() // 模板分类：class_list, grade_report, attendance, notice, certificate
          table.text('description') // 模板描述
          table.json('template_content') // 模板内容（JSON格式）
          table.json('fields') // 可填充字段配置
          table.string('file_type').defaultTo('pdf') // 输出文件类型：pdf, docx, xlsx
          table.boolean('is_system').defaultTo(false) // 是否系统内置模板
          table.boolean('is_active').defaultTo(true)
          table.integer('created_by').defaultTo(1) // 创建者ID
          table.timestamps(true, true)
        })
      }
    })
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

  async selectFirst(table: string, where: Record<string, any>): Promise<any> {
    const result = await this.db(table).where(where).first()
    return result || null
  }

  async close(): Promise<void> {
    await this.db.destroy()
  }
}

// 导出数据库实例
let dbInstance: DatabaseManager | null = null

export const getDatabase = () => {
  if (!dbInstance) {
    dbInstance = new DatabaseManager()
  }
  return dbInstance.db
}

export const getDatabaseManager = (): DatabaseManager => {
  if (!dbInstance) {
    dbInstance = new DatabaseManager()
  }
  return dbInstance
}
