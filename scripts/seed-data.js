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

async function seedData() {
  try {
    console.log('开始插入示例数据...')

    // 插入示例班级
    await db('classes').insert([
      { name: '一班', grade: '一年级', class_number: '1', description: '这是一个优秀的班级', max_students: 45, homeroom_teacher: '张老师', teacher_phone: '13800138001', semester: '上学期', year: 2024 },
      { name: '二班', grade: '一年级', class_number: '2', description: '这是一个活泼的班级', max_students: 42, homeroom_teacher: '李老师', teacher_phone: '13800138002', semester: '上学期', year: 2024 },
      { name: '一班', grade: '二年级', class_number: '1', description: '这是一个团结的班级', max_students: 48, homeroom_teacher: '王老师', teacher_phone: '13800138003', semester: '下学期', year: 2024 },
      { name: '三班', grade: '三年级', class_number: '3', description: '这是一个创新的班级', max_students: 44, homeroom_teacher: '刘老师', teacher_phone: '13800138004', semester: '上学期', year: 2024 }
    ])

    // 插入示例学生
    await db('students').insert([
      { student_id: '2024001', name: '小明', gender: '男', birth_date: '2015-01-15', phone: '13800138001', parent_phone: '13900139001', email: 'xiaoming@example.com', address: '北京市海淀区', class_id: 1, height: 140, eyesight: '1.0', is_active: 1 },
      { student_id: '2024002', name: '小红', gender: '女', birth_date: '2015-03-20', phone: '13800138002', parent_phone: '13900139002', email: 'xiaohong@example.com', address: '北京市海淀区', class_id: 1, height: 135, eyesight: '1.2', is_active: 1 },
      { student_id: '2024003', name: '小刚', gender: '男', birth_date: '2015-02-10', phone: '13800138003', parent_phone: '13900139003', email: 'xiaogang@example.com', address: '北京市朝阳区', class_id: 2, height: 138, eyesight: '0.8', is_active: 1 }
    ])

    console.log('示例数据插入完成！')
  } catch (error) {
    console.error('插入示例数据失败:', error)
  } finally {
    await db.destroy()
  }
}

seedData()