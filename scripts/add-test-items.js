const knex = require('knex')
const path = require('path')

// 使用项目根目录下的data文件夹存储数据库
const dbPath = path.join(__dirname, '..', 'data', 'database.db')

// 创建数据库连接
const db = knex({
  client: 'sqlite3',
  connection: {
    filename: dbPath
  },
  useNullAsDefault: true
})

async function addTestItems() {
  try {
    console.log('开始插入测试商品数据...')

    // 插入测试商品
    await db('shop_items').insert([
      {
        name: '铅笔',
        description: '优质HB铅笔',
        price: 10,
        category: '',
        image_url: '',
        stock: 100,
        is_active: 1,
        sort_order: 1,
        sold_count: 5,
        attributes: '{}'
      },
      {
        name: '橡皮',
        description: '白色橡皮擦',
        price: 5,
        category: '',
        image_url: '',
        stock: 50,
        is_active: 1,
        sort_order: 2,
        sold_count: 3,
        attributes: '{}'
      },
      {
        name: '笔记本',
        description: 'A5大小笔记本',
        price: 20,
        category: '',
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
        category: '',
        image_url: '',
        stock: 15,
        is_active: 1,
        sort_order: 4,
        sold_count: 2,
        attributes: '{}'
      },
      {
        name: '书包',
        description: '双肩书包',
        price: 200,
        category: '',
        image_url: '',
        stock: 5,
        is_active: 1,
        sort_order: 5,
        sold_count: 1,
        attributes: '{}'
      }
    ])

    console.log('测试商品数据插入完成！')
    console.log('商品数据:')
    
    // 查询并显示插入的商品数据
    const items = await db('shop_items').select('id', 'name', 'price', 'stock', 'sort_order', 'sold_count')
    console.table(items)
    
  } catch (error) {
    console.error('插入测试商品数据失败:', error)
  } finally {
    await db.destroy()
  }
}

addTestItems()