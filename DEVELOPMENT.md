# 开发指南

## 🚀 快速开始

### 环境要求
- Node.js 18.0 或更高版本
- npm 或 yarn 包管理器
- Windows 10/11, macOS 10.15+, 或 Linux Ubuntu 18.04+

### 安装步骤

1. **克隆项目**
   ```bash
   git clone [项目地址]
   cd changxiang-teacher
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **初始化数据库**
   ```bash
   npm run db:init
   ```

4. **启动开发环境**
   ```bash
   npm run dev
   ```

### 开发命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发环境 |
| `npm run build` | 构建生产版本 |
| `npm run dist` | 打包应用 |
| `npm run db:init` | 初始化数据库 |
| `npm run lint` | 代码检查 |
| `npm run format` | 代码格式化 |

## 🏗️ 项目结构

```
changxiang-teacher/
├── src/
│   ├── main/           # Electron主进程
│   │   ├── index.ts    # 主进程入口
│   │   └── database.ts # 数据库管理
│   ├── preload/        # 预加载脚本
│   │   └── index.ts    # 安全API暴露
│   └── renderer/       # 渲染进程（Vue应用）
│       ├── components/ # Vue组件
│       ├── views/      # 页面视图
│       ├── stores/     # Pinia状态管理
│       ├── utils/      # 工具函数
│       ├── assets/     # 静态资源
│       ├── App.vue     # 根组件
│       ├── main.ts     # Vue入口
│       └── router/     # Vue路由
├── scripts/            # 构建和工具脚本
├── database/           # 数据库文件
├── public/             # 公共资源
├── build/              # 构建配置
└── release/            # 发布版本
```

## 🎯 功能模块

### 1. 班级管理
- **路径**: `/classes`
- **功能**: 创建、编辑、删除班级信息
- **组件**: `Classes.vue`, `ClassForm.vue`

### 2. 学生管理
- **路径**: `/students`
- **功能**: 学生信息录入、编辑、批量导入
- **组件**: `Students.vue`, `StudentForm.vue`

### 3. 排位管理
- **路径**: `/seating`
- **功能**: 可视化座位编排、智能推荐
- **组件**: `Seating.vue`, `SeatArrangement.vue`

### 4. 成绩管理
- **路径**: `/grades`
- **功能**: 成绩录入、统计分析、趋势图表
- **组件**: `Grades.vue`, `GradeChart.vue`

### 5. 积分管理
- **路径**: `/points`
- **功能**: 积分规则、积分录入、排行榜
- **组件**: `Points.vue`, `PointRanking.vue`

## 🛠️ 开发规范

### 代码风格
- 使用 TypeScript 进行类型安全开发
- 遵循 ESLint + Prettier 代码规范
- 组件命名使用 PascalCase
- 变量命名使用 camelCase

### 文件命名
- 组件文件: `PascalCase.vue`
- 工具文件: `camelCase.ts`
- 样式文件: `kebab-case.css`

### 数据库规范
- 表名使用复数形式（如: `students`）
- 主键统一使用 `id`
- 外键使用 `table_id` 格式
- 时间戳使用 `created_at`, `updated_at`

## 📊 数据库结构

### 主要表结构

#### classes (班级表)
- `id` - 主键
- `name` - 班级名称
- `grade` - 年级
- `homeroom_teacher` - 班主任
- `max_students` - 最大学生数

#### students (学生表)
- `id` - 主键
- `student_id` - 学号（唯一）
- `name` - 姓名
- `class_id` - 班级ID（外键）
- `height`, `eyesight` - 排位相关信息

#### seats (座位表)
- `id` - 主键
- `class_id` - 班级ID
- `student_id` - 学生ID
- `row`, `column` - 座位位置

#### grades (成绩表)
- `id` - 主键
- `student_id` - 学生ID
- `subject` - 科目
- `score` - 分数
- `exam_type` - 考试类型

#### points (积分表)
- `id` - 主键
- `student_id` - 学生ID
- `points` - 积分值
- `type` - 类型（奖励/惩罚）
- `reason` - 原因

## 🧪 测试

### 单元测试
```bash
npm run test:unit
```

### 端到端测试
```bash
npm run test:e2e
```

## 📦 打包发布

### Windows
```bash
npm run dist:win
```

### macOS
```bash
npm run dist:mac
```

### Linux
```bash
npm run dist:linux
```

## 🔧 调试技巧

### 主进程调试
1. 在 VSCode 中按 F5 启动调试
2. 使用 Chrome DevTools 调试渲染进程
3. 查看控制台输出日志

### 数据库调试
1. 使用 DB Browser for SQLite 查看数据库
2. 数据库文件位置：
   - Windows: `%APPDATA%/changxiang-teacher/database.db`
   - macOS: `~/Library/Application Support/changxiang-teacher/database.db`
   - Linux: `~/.config/changxiang-teacher/database.db`

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📞 技术支持

- **GitHub Issues**: [创建Issue](https://github.com/your-repo/issues)
- **邮件**: support@changxiang-teacher.com
- **文档**: [在线文档](https://docs.changxiang-teacher.com)

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件