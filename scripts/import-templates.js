const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

try {
  // 使用与应用程序相同的数据库路径逻辑
  const appPath = path.join(__dirname, '..');
  const dataDir = path.join(appPath, 'data');
  const dbPath = path.join(dataDir, 'database.db');
  console.log('数据库路径:', dbPath);
  
  const db = new Database(dbPath);
  
  // 检查表是否存在
  const tables = db.prepare('SELECT name FROM sqlite_master WHERE type=?').all('table');
  console.log('数据库中的表:', tables.map(t => t.name));
  
  if (tables.some(t => t.name === 'document_templates')) {
    // 读取并执行SQL脚本
    const sql = fs.readFileSync('./scripts/public-templates-library.sql', 'utf8');
    db.exec(sql);
    
    // 检查导入结果
    const count = db.prepare('SELECT COUNT(*) as count FROM document_templates').get();
    console.log(`公共模板库导入成功！共导入 ${count.count} 个模板`);
  } else {
    console.log('document_templates 表不存在，请先启动应用初始化数据库');
  }
  
  db.close();
} catch (error) {
  console.error('导入失败:', error.message);
  process.exit(1);
}