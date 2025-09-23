#!/usr/bin/env node
'use strict'

const path = require('path')
const fs = require('fs')
const initSqlJs = require('sql.js')
const os = require('os')
const homedir = os.homedir()

// 使用应用程序实际使用的数据库路径
let appDataPath
if (process.platform === 'win32') {
  appDataPath = process.env.APPDATA || path.join(homedir, 'AppData', 'Roaming')
} else if (process.platform === 'darwin') {
  appDataPath = path.join(homedir, 'Library', 'Application Support')
} else {
  appDataPath = process.env.XDG_CONFIG_HOME || path.join(homedir, '.config')
}

const dataDir = path.join(appDataPath, 'changxiang-teacher', 'data')
const dbPath = path.join(dataDir, 'database.db')

console.log('使用的数据库路径:', dbPath)

;(async () => {
  try {
    console.log('开始插入测试商品数据...')

    const SQL = await initSqlJs({
      locateFile: (file) => require.resolve('sql.js/dist/' + file)
    })

    // 加载现有数据库
    if (!fs.existsSync(dbPath)) {
      console.error('数据库文件不存在，请先运行 npm run db:init')
      process.exit(1)
    }

    const fileBuffer = fs.readFileSync(dbPath)
    const db = new SQL.Database(new Uint8Array(fileBuffer))

    // 测试商品数据
    const testItems = [
      {
        name: '铅笔',
        description: '优质HB铅笔，书写流畅',
        price: 10,
        category: '学习用品',
        image_url: '',
        stock: 100,
        is_active: 1,
        sort_order: 1,
        sold_count: 5,
        attributes: '{}'
      },
      {
        name: '橡皮',
        description: '白色橡皮擦，清洁效果好',
        price: 5,
        category: '学习用品',
        image_url: '',
        stock: 50,
        is_active: 1,
        sort_order: 2,
        sold_count: 3,
        attributes: '{}'
      },
      {
        name: '笔记本',
        description: 'A5大小笔记本，80页',
        price: 20,
        category: '学习用品',
        image_url: '',
        stock: 30,
        is_active: 1,
        sort_order: 3,
        sold_count: 8,
        attributes: '{}'
      },
      {
        name: '水彩笔',
        description: '12色水彩笔套装',
        price: 50,
        category: '学习用品',
        image_url: '',
        stock: 15,
        is_active: 1,
        sort_order: 4,
        sold_count: 2,
        attributes: '{}'
      },
      {
        name: '书包',
        description: '双肩书包，容量大',
        price: 200,
        category: '生活用品',
        image_url: '',
        stock: 5,
        is_active: 1,
        sort_order: 5,
        sold_count: 1,
        attributes: '{}'
      }
    ]

    // 准备插入语句
    const insertStmt = db.prepare(`
      INSERT INTO shop_items (
        name, description, price, category, image_url, 
        stock, is_active, sort_order, sold_count, attributes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    // 执行插入
    db.exec('BEGIN')
    try {
      for (const item of testItems) {
        insertStmt.run([
          item.name,
          item.description,
          item.price,
          item.category,
          item.image_url,
          item.stock,
          item.is_active,
          item.sort_order,
          item.sold_count,
          item.attributes
        ])
      }
      insertStmt.free()
      db.exec('COMMIT')
      console.log('测试商品数据插入完成！')

      // 查询并显示插入的数据
      const result = db.exec('SELECT id, name, price, stock, sort_order, sold_count FROM shop_items ORDER BY sort_order')
      if (result.length > 0) {
        console.log('\n当前商品数据:')
        const items = result[0].values.map(row => ({
          id: row[0],
          name: row[1],
          price: row[2],
          stock: row[3],
          sort_order: row[4],
          sold_count: row[5]
        }))
        
        console.table(items)
      }

    } catch (e) {
      insertStmt.free()
      db.exec('ROLLBACK')
      console.error('插入商品数据失败:', e.message || e)
    }

    // 保存数据库
    const data = db.export()
    fs.writeFileSync(dbPath, Buffer.from(data))
    console.log('\n数据库已保存')

    db.close()

  } catch (err) {
    console.error('操作失败:', err)
    process.exit(1)
  }
})()