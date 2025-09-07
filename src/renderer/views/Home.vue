<template>
  <Layout>
    <div class="dashboard">
      <div class="stats-grid">
        <el-card class="stat-card" v-for="stat in stats" :key="stat.title">
          <div class="stat-content">
            <el-icon class="stat-icon" :style="{ color: stat.color }">
              <component :is="stat.icon" />
            </el-icon>
            <div class="stat-info">
              <div class="stat-number">{{ stat.number }}</div>
              <div class="stat-title">{{ stat.title }}</div>
            </div>
          </div>
        </el-card>
      </div>

      <div class="recent-activities">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最近活动</span>
              <el-button type="primary" text>查看全部</el-button>
            </div>
          </template>
          
          <div class="activities-list">
            <div 
              v-for="activity in recentActivities" 
              :key="activity.id"
              class="activity-item"
            >
              <el-avatar :size="40" :src="activity.avatar" />
              <div class="activity-content">
                <div class="activity-title">{{ activity.title }}</div>
                <div class="activity-time">{{ activity.time }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <div class="quick-actions">
        <el-card>
          <template #header>
            <span>快捷操作</span>
          </template>
          
          <div class="actions-grid">
            <el-button 
              v-for="action in quickActions" 
              :key="action.name"
              type="primary" 
              plain
              size="large"
              @click="$router.push(action.path)"
            >
              <el-icon>
                <component :is="action.icon" />
              </el-icon>
              {{ action.name }}
            </el-button>
          </div>
        </el-card>
      </div>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { 
  User, 
  School, 
  TrendCharts, 
  Trophy,
  Plus,
  Edit,
  Search,
  Setting
} from '@element-plus/icons-vue'
import Layout from './Layout.vue'

const stats = ref([
  {
    title: '班级数量',
    number: 9,
    icon: 'School',
    color: '#667eea'
  },
  {
    title: '学生总数',
    number: 320,
    icon: 'User',
    color: '#764ba2'
  },
  {
    title: '本月考试',
    number: 12,
    icon: 'TrendCharts',
    color: '#f093fb'
  },
  {
    title: '积分排名',
    number: 5,
    icon: 'Trophy',
    color: '#4facfe'
  }
])

const recentActivities = ref([
  {
    id: 1,
    title: '张三同学在数学月考中获得95分',
    time: '2小时前',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
  },
  {
    id: 2,
    title: '为七年级1班调整了座位安排',
    time: '5小时前',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
  },
  {
    id: 3,
    title: '李同学因帮助同学获得5积分奖励',
    time: '1天前',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
  }
])

const quickActions = ref([
  { name: '添加学生', icon: 'Plus', path: '/students/add' },
  { name: '录入成绩', icon: 'Edit', path: '/grades/add' },
  { name: '查询学生', icon: 'Search', path: '/students' },
  { name: '系统设置', icon: 'Setting', path: '/settings' }
])

onMounted(() => {
  // 这里可以加载实时数据
})
</script>

<style scoped>
.dashboard {
  padding: 20px;
  background: #f5f7fa;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  font-size: 48px;
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
}

.stat-title {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.recent-activities,
.quick-actions {
  margin-bottom: 30px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.activities-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px;
  border-radius: 8px;
  transition: background-color 0.3s ease;
}

.activity-item:hover {
  background-color: #f5f7fa;
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-size: 14px;
  color: #303133;
  margin-bottom: 5px;
}

.activity-time {
  font-size: 12px;
  color: #909399;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
}

.actions-grid .el-button {
  height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.dark-theme .dashboard {
  background: #141414;
}

.dark-theme .stat-number {
  color: #e6e6e6;
}

.dark-theme .activity-item:hover {
  background-color: #1f1f1f;
}
</style>