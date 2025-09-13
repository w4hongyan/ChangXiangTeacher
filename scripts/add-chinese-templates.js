const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

async function addChineseTemplates() {
  try {
    // 使用应用程序实际运行时的数据库路径
    const os = require('os');
    const userDataPath = path.join(os.homedir(), 'AppData', 'Roaming', 'changxiang-teacher');
    const dataDir = path.join(userDataPath, 'data');
    const dbPath = path.join(dataDir, 'database.db');
    console.log('数据库路径:', dbPath);
    
    // 初始化SQL.js
    const SQL = await initSqlJs();
    
    // 读取数据库文件
    const filebuffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(filebuffer);
    
    // 检查表是否存在
    const tables = db.exec('SELECT name FROM sqlite_master WHERE type="table"');
    console.log('数据库中的表:', tables[0] ? tables[0].values.map(row => row[0]) : []);
  
    const tableNames = tables[0] ? tables[0].values.map(row => row[0]) : [];
    
    if (tableNames.includes('document_templates')) {
    
    // 中文公共模板数据
    const templates = [
      {
        name: '学生通知书',
        category: 'student_management',
        description: '学生各类通知书模板，适用于成绩通知、活动通知等',
        content: `<div style="font-family: SimSun; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="text-align: center; margin-bottom: 30px; color: #2c3e50;">{{noticeTitle}}</h2>
          <div style="margin-bottom: 20px; line-height: 1.8;">
            <p><strong>尊敬的{{parentName}}家长：</strong></p>
            <p style="text-indent: 2em;">您好！现将您的孩子{{studentName}}（{{className}}班）的相关情况通知如下：</p>
            <div style="background: #f8f9fa; padding: 15px; margin: 20px 0; border-left: 4px solid #007bff;">
              <p style="margin: 0; text-indent: 2em;">{{noticeContent}}</p>
            </div>
            <p style="text-indent: 2em;">如有疑问，请及时与班主任联系。谢谢您的配合！</p>
          </div>
          <div style="text-align: right; margin-top: 40px;">
            <p>{{schoolName}}</p>
            <p>班主任：{{teacherName}}</p>
            <p>联系电话：{{teacherPhone}}</p>
            <p>{{noticeDate}}</p>
          </div>
        </div>`,
        variables: JSON.stringify({
          noticeTitle: { label: '通知标题', type: 'text', required: true, placeholder: '如：期中考试成绩通知' },
          parentName: { label: '家长姓名', type: 'text', required: true },
          studentName: { label: '学生姓名', type: 'text', required: true },
          className: { label: '班级名称', type: 'text', required: true },
          noticeContent: { label: '通知内容', type: 'textarea', required: true, placeholder: '请详细描述通知的主要内容' },
          schoolName: { label: '学校名称', type: 'text', required: true },
          teacherName: { label: '班主任姓名', type: 'text', required: true },
          teacherPhone: { label: '联系电话', type: 'text', required: true },
          noticeDate: { label: '通知日期', type: 'date', required: true }
        }),
        is_system: 1
      },
      {
        name: '家长会通知',
        category: 'parent_communication',
        description: '家长会召开通知模板，包含时间地点和注意事项',
        content: `<div style="font-family: SimSun; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="text-align: center; margin-bottom: 30px; color: #e74c3c;">家长会通知</h2>
          <div style="margin-bottom: 20px; line-height: 1.8;">
            <p><strong>尊敬的{{className}}班家长：</strong></p>
            <p style="text-indent: 2em;">您好！为了加强家校沟通，共同关注孩子的成长，我校定于<strong>{{meetingDate}}</strong>召开家长会。</p>
            <div style="background: #fff3cd; padding: 15px; margin: 20px 0; border: 1px solid #ffeaa7; border-radius: 5px;">
              <h4 style="color: #856404; margin-top: 0;">会议安排</h4>
              <p><strong>时间：</strong>{{meetingDate}} {{meetingTime}}</p>
              <p><strong>地点：</strong>{{meetingLocation}}</p>
              <p><strong>主题：</strong>{{meetingTopic}}</p>
            </div>
            <p style="text-indent: 2em;">请您务必准时参加，如有特殊情况不能参加，请提前与班主任联系。</p>
          </div>
          <div style="text-align: right; margin-top: 40px;">
            <p>{{schoolName}}</p>
            <p>{{className}}班主任：{{teacherName}}</p>
            <p>{{noticeDate}}</p>
          </div>
        </div>`,
        variables: JSON.stringify({
          className: { label: '班级名称', type: 'text', required: true },
          meetingDate: { label: '会议日期', type: 'date', required: true },
          meetingTime: { label: '会议时间', type: 'time', required: true },
          meetingLocation: { label: '会议地点', type: 'text', required: true },
          meetingTopic: { label: '会议主题', type: 'text', required: true },
          schoolName: { label: '学校名称', type: 'text', required: true },
          teacherName: { label: '班主任姓名', type: 'text', required: true },
          noticeDate: { label: '通知日期', type: 'date', required: true }
        }),
        is_system: 1
      },
      {
        name: '班级通讯录',
        category: 'class_management',
        description: '班级学生和家长联系方式汇总表',
        content: `<div style="font-family: SimSun; padding: 20px;">
          <h2 style="text-align: center; margin-bottom: 30px; color: #2c3e50;">{{className}} 通讯录</h2>
          <div style="margin-bottom: 20px;">
            <p><strong>班主任：</strong>{{teacherName}} &nbsp;&nbsp; <strong>电话：</strong>{{teacherPhone}}</p>
            <p><strong>学期：</strong>{{semester}} &nbsp;&nbsp; <strong>制表日期：</strong>{{createDate}}</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">序号</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">学生姓名</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">学号</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">家长姓名</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">联系电话</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">备注</th>
              </tr>
            </thead>
            <tbody>{{studentList}}</tbody>
          </table>
          <div style="margin-top: 30px; font-size: 12px; color: #666;">
            <p>注：请各位家长核对联系方式，如有变更请及时告知班主任。</p>
          </div>
        </div>`,
        variables: JSON.stringify({
          className: { label: '班级名称', type: 'text', required: true },
          teacherName: { label: '班主任姓名', type: 'text', required: true },
          teacherPhone: { label: '班主任电话', type: 'text', required: true },
          semester: { label: '学期', type: 'text', required: true },
          createDate: { label: '制表日期', type: 'date', required: true },
          studentList: { label: '学生信息列表', type: 'textarea', required: true, placeholder: '请输入学生信息，格式：序号|学生姓名|学号|家长姓名|联系电话|备注，每行一个学生' }
        }),
        is_system: 1
      },
      {
        name: '学生请假条',
        category: 'student_management',
        description: '学生请假申请表模板',
        content: `<div style="font-family: SimSun; padding: 20px; max-width: 500px; margin: 0 auto; border: 2px solid #333;">
          <h2 style="text-align: center; margin-bottom: 30px; color: #2c3e50;">学生请假条</h2>
          <div style="line-height: 2; margin-bottom: 20px;">
            <p><strong>班级：</strong>{{className}} &nbsp;&nbsp;&nbsp;&nbsp; <strong>姓名：</strong>{{studentName}}</p>
            <p><strong>学号：</strong>{{studentId}} &nbsp;&nbsp;&nbsp;&nbsp; <strong>申请日期：</strong>{{applyDate}}</p>
          </div>
          <div style="margin: 20px 0;">
            <p><strong>请假事由：</strong></p>
            <div style="border: 1px solid #ddd; padding: 10px; min-height: 60px; margin-top: 10px;">{{reason}}</div>
          </div>
          <div style="margin: 20px 0;">
            <p><strong>请假时间：</strong>{{startDate}} 至 {{endDate}} （共{{days}}天）</p>
          </div>
          <div style="margin: 20px 0;">
            <p><strong>家长联系电话：</strong>{{parentPhone}}</p>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 40px;">
            <div style="text-align: center;">
              <p>学生签名：</p>
              <p style="margin-top: 20px;">_____________</p>
            </div>
            <div style="text-align: center;">
              <p>家长签名：</p>
              <p style="margin-top: 20px;">_____________</p>
            </div>
            <div style="text-align: center;">
              <p>班主任签名：</p>
              <p style="margin-top: 20px;">_____________</p>
            </div>
          </div>
        </div>`,
        variables: JSON.stringify({
          className: { label: '班级名称', type: 'text', required: true },
          studentName: { label: '学生姓名', type: 'text', required: true },
          studentId: { label: '学号', type: 'text', required: true },
          applyDate: { label: '申请日期', type: 'date', required: true },
          reason: { label: '请假事由', type: 'textarea', required: true },
          startDate: { label: '开始日期', type: 'date', required: true },
          endDate: { label: '结束日期', type: 'date', required: true },
          days: { label: '请假天数', type: 'number', required: true },
          parentPhone: { label: '家长电话', type: 'text', required: true }
        }),
        is_system: 1
      },
      {
        name: '成绩通知单',
        category: 'grade_management',
        description: '学生成绩通知单模板',
        content: `<div style="font-family: SimSun; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="text-align: center; margin-bottom: 30px; color: #2c3e50;">成绩通知单</h2>
          <div style="margin-bottom: 20px;">
            <p><strong>学生姓名：</strong>{{studentName}} &nbsp;&nbsp; <strong>班级：</strong>{{className}}</p>
            <p><strong>学号：</strong>{{studentId}} &nbsp;&nbsp; <strong>考试名称：</strong>{{examName}}</p>
            <p><strong>考试时间：</strong>{{examDate}}</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">科目</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">成绩</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">等级</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">备注</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">语文</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">{{chineseScore}}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">{{chineseGrade}}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">{{chineseNote}}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">数学</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">{{mathScore}}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">{{mathGrade}}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">{{mathNote}}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">英语</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">{{englishScore}}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">{{englishGrade}}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">{{englishNote}}</td>
              </tr>
            </tbody>
          </table>
          <div style="margin: 20px 0;">
            <p><strong>总分：</strong>{{totalScore}} &nbsp;&nbsp; <strong>班级排名：</strong>{{classRank}}</p>
          </div>
          <div style="background: #f8f9fa; padding: 15px; margin: 20px 0; border-left: 4px solid #007bff;">
            <p><strong>老师评语：</strong></p>
            <p style="margin-top: 10px;">{{teacherComment}}</p>
          </div>
          <div style="text-align: right; margin-top: 40px;">
            <p>班主任：{{teacherName}}</p>
            <p>{{noticeDate}}</p>
          </div>
        </div>`,
        variables: JSON.stringify({
          studentName: { label: '学生姓名', type: 'text', required: true },
          className: { label: '班级名称', type: 'text', required: true },
          studentId: { label: '学号', type: 'text', required: true },
          examName: { label: '考试名称', type: 'text', required: true },
          examDate: { label: '考试时间', type: 'date', required: true },
          chineseScore: { label: '语文成绩', type: 'number' },
          chineseGrade: { label: '语文等级', type: 'text' },
          chineseNote: { label: '语文备注', type: 'text' },
          mathScore: { label: '数学成绩', type: 'number' },
          mathGrade: { label: '数学等级', type: 'text' },
          mathNote: { label: '数学备注', type: 'text' },
          englishScore: { label: '英语成绩', type: 'number' },
          englishGrade: { label: '英语等级', type: 'text' },
          englishNote: { label: '英语备注', type: 'text' },
          totalScore: { label: '总分', type: 'number' },
          classRank: { label: '班级排名', type: 'number' },
          teacherComment: { label: '老师评语', type: 'textarea' },
          teacherName: { label: '班主任姓名', type: 'text', required: true },
          noticeDate: { label: '通知日期', type: 'date', required: true }
        }),
        is_system: 1
      }
    ];
    
      // 批量插入模板
      let insertedCount = 0;
      for (const template of templates) {
        try {
          const insertSql = `
            INSERT INTO document_templates (
              name, category, description, content, variables, is_system, is_active, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
          `;
          
          db.run(insertSql, [
            template.name,
            template.category,
            template.description,
            template.content,
            template.variables,
            template.is_system,
            true
          ]);
          
          insertedCount++;
          console.log(`✓ 已添加模板: ${template.name}`);
        } catch (error) {
          console.error(`✗ 添加模板失败 ${template.name}:`, error.message);
        }
      }
      
      // 保存数据库更改
      const data = db.export();
      fs.writeFileSync(dbPath, data);
      
      // 检查最终结果
      const totalCountResult = db.exec('SELECT COUNT(*) as count FROM document_templates WHERE is_system = 1');
      const totalCount = totalCountResult[0] ? totalCountResult[0].values[0][0] : 0;
      
      console.log(`\n🎉 中文公共模板添加完成！`);
      console.log(`本次新增: ${insertedCount} 个模板`);
      console.log(`系统模板总数: ${totalCount} 个`);
      
      db.close();
    
    } else {
      console.log('❌ document_templates 表不存在，请先启动应用程序初始化数据库');
    }
    
  } catch (error) {
    console.error('❌ 操作失败:', error.message);
    process.exit(1);
  }
}

// 执行函数
addChineseTemplates();