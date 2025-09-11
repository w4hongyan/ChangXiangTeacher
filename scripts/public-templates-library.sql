-- 公共模板库数据 - 教学工作常用文档模板
-- 基于教师日常工作需求设计的完整模板库

-- 🏫 班级管理类模板
INSERT INTO document_templates (name, category, description, template_content, fields, file_type, is_system, created_at) VALUES

-- 1. 班级课程表
('班级课程表', 'class_management', '班级课程表模板，支持一周五天的课程安排',
'{"type": "html", "content": "<div class=\"schedule-template\"><h2 style=\"text-align: center; margin-bottom: 20px;\">{{className}}课程表</h2><p style=\"text-align: center; margin-bottom: 30px;\">{{semester}} 学年</p><table style=\"width: 100%; border-collapse: collapse; margin: 20px 0;\"><thead><tr style=\"background-color: #f5f5f5;\"><th style=\"border: 1px solid #ddd; padding: 12px; text-align: center;\">时间</th><th style=\"border: 1px solid #ddd; padding: 12px; text-align: center;\">周一</th><th style=\"border: 1px solid #ddd; padding: 12px; text-align: center;\">周二</th><th style=\"border: 1px solid #ddd; padding: 12px; text-align: center;\">周三</th><th style=\"border: 1px solid #ddd; padding: 12px; text-align: center;\">周四</th><th style=\"border: 1px solid #ddd; padding: 12px; text-align: center;\">周五</th></tr></thead><tbody><tr><td style=\"border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;\">第一节<br/>8:00-8:40</td><td style=\"border: 1px solid #ddd; padding: 8px; text-align: center;\">{{monday1}}</td><td style=\"border: 1px solid #ddd; padding: 8px; text-align: center;\">{{tuesday1}}</td><td style=\"border: 1px solid #ddd; padding: 8px; text-align: center;\">{{wednesday1}}</td><td style=\"border: 1px solid #ddd; padding: 8px; text-align: center;\">{{thursday1}}</td><td style=\"border: 1px solid #ddd; padding: 8px; text-align: center;\">{{friday1}}</td></tr></tbody></table></div>"}',
'{"className": {"label": "班级名称", "type": "text", "required": true}, "semester": {"label": "学期", "type": "text", "required": true}, "monday1": {"label": "周一第一节", "type": "text"}, "tuesday1": {"label": "周二第一节", "type": "text"}, "wednesday1": {"label": "周三第一节", "type": "text"}, "thursday1": {"label": "周四第一节", "type": "text"}, "friday1": {"label": "周五第一节", "type": "text"}}',
'pdf,word,html', 1, datetime('now')),

-- 2. 值日表
('班级值日表', 'class_management', '班级值日安排表模板，支持一周值日安排',
'{"type": "html", "content": "<div class=\"duty-template\"><h2 style=\"text-align: center; margin-bottom: 20px;\">{{className}}值日表</h2><p style=\"text-align: center; margin-bottom: 30px;\">{{semester}} 学年</p><table style=\"width: 100%; border-collapse: collapse; margin: 20px 0;\"><thead><tr style=\"background-color: #f5f5f5;\"><th style=\"border: 1px solid #ddd; padding: 12px; text-align: center;\">星期</th><th style=\"border: 1px solid #ddd; padding: 12px; text-align: center;\">值日生</th><th style=\"border: 1px solid #ddd; padding: 12px; text-align: center;\">值日内容</th></tr></thead><tbody><tr><td style=\"border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;\">周一</td><td style=\"border: 1px solid #ddd; padding: 8px; text-align: center;\">{{monday_student}}</td><td style=\"border: 1px solid #ddd; padding: 8px; text-align: center;\">{{monday_duty}}</td></tr></tbody></table></div>"}',
'{"className": {"label": "班级名称", "type": "text", "required": true}, "semester": {"label": "学期", "type": "text", "required": true}, "monday_student": {"label": "周一值日生", "type": "text"}, "monday_duty": {"label": "周一值日内容", "type": "text"}}',
'pdf,word,html', 1, datetime('now'));

-- 📚 教学教研类模板  
INSERT INTO document_templates (name, category, description, template_content, fields, file_type, is_system, created_at) VALUES

-- 3. 备课教案模板
('备课教案模板', 'teaching_research', '标准教案格式模板，包含教学目标、重难点、教学过程等',
'{"type": "html", "content": "<div class=\"lesson-plan-template\"><h2 style=\"text-align: center; margin-bottom: 20px;\">教案</h2><div style=\"margin-bottom: 20px;\"><strong>课程名称：</strong>{{subject}}<br/><strong>授课班级：</strong>{{className}}<br/><strong>授课时间：</strong>{{date}}<br/><strong>授课教师：</strong>{{teacher}}</div><h3>教学目标</h3><p>{{objectives}}</p><h3>教学重点</h3><p>{{keyPoints}}</p><h3>教学难点</h3><p>{{difficulties}}</p><h3>教学过程</h3><p>{{process}}</p><h3>板书设计</h3><p>{{blackboard}}</p><h3>作业布置</h3><p>{{homework}}</p></div>"}',
'{"subject": {"label": "课程名称", "type": "text", "required": true}, "className": {"label": "授课班级", "type": "text", "required": true}, "date": {"label": "授课时间", "type": "date", "required": true}, "teacher": {"label": "授课教师", "type": "text", "required": true}, "objectives": {"label": "教学目标", "type": "textarea"}, "keyPoints": {"label": "教学重点", "type": "textarea"}, "difficulties": {"label": "教学难点", "type": "textarea"}, "process": {"label": "教学过程", "type": "textarea"}, "blackboard": {"label": "板书设计", "type": "textarea"}, "homework": {"label": "作业布置", "type": "textarea"}}',
'pdf,word,html', 1, datetime('now'));

-- 👩‍🎓 学生成长类模板
INSERT INTO document_templates (name, category, description, template_content, fields, file_type, is_system, created_at) VALUES

-- 4. 学生请假条
('学生请假条', 'student_growth', '学生请假条模板，包含请假事由、时间等信息',
'{"type": "html", "content": "<div class=\"leave-request-template\"><h2 style=\"text-align: center; margin-bottom: 30px;\">请假条</h2><div style=\"line-height: 2; margin: 20px 0;\"><p>尊敬的{{teacher}}老师：</p><p style=\"text-indent: 2em;\">我是{{className}}班学生{{studentName}}，因{{reason}}，需要请假{{days}}天，请假时间为{{startDate}}至{{endDate}}。</p><p style=\"text-indent: 2em;\">请假期间我会认真完成作业，不会影响学习进度。请老师批准。</p><div style=\"text-align: right; margin-top: 40px;\"><p>此致</p><p>敬礼！</p><p>学生：{{studentName}}</p><p>家长签字：___________</p><p>日期：{{applyDate}}</p></div></div></div>"}',
'{"teacher": {"label": "任课教师", "type": "text", "required": true}, "className": {"label": "班级名称", "type": "text", "required": true}, "studentName": {"label": "学生姓名", "type": "text", "required": true}, "reason": {"label": "请假事由", "type": "text", "required": true}, "days": {"label": "请假天数", "type": "number", "required": true}, "startDate": {"label": "开始日期", "type": "date", "required": true}, "endDate": {"label": "结束日期", "type": "date", "required": true}, "applyDate": {"label": "申请日期", "type": "date", "required": true}}',
'pdf,word,html', 1, datetime('now'));

-- 🗂️ 行政事务类模板
INSERT INTO document_templates (name, category, description, template_content, fields, file_type, is_system, created_at) VALUES

-- 5. 会议签到表
('会议签到表', 'administrative', '会议签到表模板，支持参会人员签到记录',
'{"type": "html", "content": "<div class=\"meeting-signin-template\"><h2 style=\"text-align: center; margin-bottom: 20px;\">{{meetingTitle}}</h2><p style=\"text-align: center; margin-bottom: 30px;\">签到表</p><div style=\"margin-bottom: 20px;\"><strong>会议时间：</strong>{{meetingDate}} {{meetingTime}}<br/><strong>会议地点：</strong>{{location}}<br/><strong>主持人：</strong>{{host}}</div><table style=\"width: 100%; border-collapse: collapse; margin: 20px 0;\"><thead><tr style=\"background-color: #f5f5f5;\"><th style=\"border: 1px solid #ddd; padding: 12px; text-align: center;\">序号</th><th style=\"border: 1px solid #ddd; padding: 12px; text-align: center;\">姓名</th><th style=\"border: 1px solid #ddd; padding: 12px; text-align: center;\">职务</th><th style=\"border: 1px solid #ddd; padding: 12px; text-align: center;\">签名</th><th style=\"border: 1px solid #ddd; padding: 12px; text-align: center;\">备注</th></tr></thead><tbody><tr><td style=\"border: 1px solid #ddd; padding: 8px; text-align: center;\">1</td><td style=\"border: 1px solid #ddd; padding: 8px; text-align: center;\"></td><td style=\"border: 1px solid #ddd; padding: 8px; text-align: center;\"></td><td style=\"border: 1px solid #ddd; padding: 8px; text-align: center;\"></td><td style=\"border: 1px solid #ddd; padding: 8px; text-align: center;\"></td></tr></tbody></table></div>"}',
'{"meetingTitle": {"label": "会议标题", "type": "text", "required": true}, "meetingDate": {"label": "会议日期", "type": "date", "required": true}, "meetingTime": {"label": "会议时间", "type": "time", "required": true}, "location": {"label": "会议地点", "type": "text", "required": true}, "host": {"label": "主持人", "type": "text", "required": true}}',
'pdf,word,html', 1, datetime('now'));

-- 模板库说明注释
-- 模板库包含四大类别：
-- 1. 班级管理类 (class_management): 课程表、值日表、班委分工表、座位表等
-- 2. 教学教研类 (teaching_research): 教案模板、听课记录表等  
-- 3. 学生成长类 (student_growth): 请假条、成绩单、奖状等
-- 4. 行政事务类 (administrative): 会议签到表、活动报名表等