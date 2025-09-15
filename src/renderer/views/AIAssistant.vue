<template>
  <Layout>
    <div class="ai-assistant-directory">
      <div class="ai-header">
        <h2>🤖 AI智能助手</h2>
        <p class="subtitle">选择您需要的AI功能模块</p>
      </div>

      <div class="ai-modules">
        <el-row :gutter="24">
          <el-col :span="8" v-for="module in aiModules" :key="module.name">
            <el-card 
              class="module-card" 
              :class="{ 'featured': module.featured }"
              @click="navigateToModule(module.route)"
              shadow="hover"
            >
              <div class="module-content">
                <div class="module-icon">
                  <el-icon :size="48" :color="module.color">
                    <component :is="module.icon" />
                  </el-icon>
                </div>
                <h3 class="module-title">{{ module.title }}</h3>
                <p class="module-description">{{ module.description }}</p>
                <div class="module-features">
                  <el-tag 
                    v-for="feature in module.features" 
                    :key="feature" 
                    size="small" 
                    type="info"
                  >
                    {{ feature }}
                  </el-tag>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <div class="quick-stats">
        <el-row :gutter="16">
          <el-col :span="6">
            <div class="stat-item">
              <el-icon size="24" color="#409EFF"><ChatDotRound /></el-icon>
              <div class="stat-content">
                <div class="stat-number">{{ stats.totalChats }}</div>
                <div class="stat-label">总对话数</div>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <el-icon size="24" color="#67C23A"><DocumentChecked /></el-icon>
              <div class="stat-content">
                <div class="stat-number">{{ stats.lessonsCreated }}</div>
                <div class="stat-label">备课数量</div>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <el-icon size="24" color="#E6A23C"><Edit /></el-icon>
              <div class="stat-content">
                <div class="stat-number">{{ stats.essaysGraded }}</div>
                <div class="stat-label">批改作文</div>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <el-icon size="24" color="#F56C6C"><Tools /></el-icon>
              <div class="stat-content">
                <div class="stat-number">{{ stats.toolsUsed }}</div>
                <div class="stat-label">工具使用</div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  ChatDotRound, 
  Notebook, 
  Edit, 
  FolderOpened, 
  Tools, 
  Calendar, 
  Setting,
  DocumentChecked
} from '@element-plus/icons-vue'
import Layout from './Layout.vue'

const router = useRouter()

// AI模块配置
const aiModules = ref([
  {
    name: 'qa',
    title: '💬 教学问答',
    description: '智能问答助手，解答教学疑问，提供专业建议',
    icon: ChatDotRound,
    color: '#409EFF',
    route: '/ai/qa',
    featured: true,
    features: ['智能问答', '教学建议', '知识解答']
  },
  {
    name: 'lesson_prep',
    title: '📚 备课助手',
    description: '智能备课工具，生成教案、课件和教学资源',
    icon: Notebook,
    color: '#67C23A',
    route: '/ai/lesson-prep',
    featured: true,
    features: ['教案生成', '课件制作', '资源推荐']
  },
  {
    name: 'essay_grading',
    title: '✍️ 作文批改',
    description: 'AI作文批改，提供详细评语和改进建议',
    icon: Edit,
    color: '#E6A23C',
    route: '/ai/essay-grading',
    featured: true,
    features: ['智能批改', '评语生成', '写作建议']
  },
  {
    name: 'resources',
    title: '🌐 教育资源',
    description: '海量教育资源库，快速查找教学材料',
    icon: FolderOpened,
    color: '#909399',
    route: '/ai/resources',
    featured: false,
    features: ['资源搜索', '素材下载', '分类管理']
  },
  {
    name: 'multimedia',
    title: '🎬 多媒体工具',
    description: '多媒体制作工具，创建生动的教学内容',
    icon: Tools,
    color: '#F56C6C',
    route: '/ai/multimedia',
    featured: false,
    features: ['视频制作', '图片处理', 'PPT生成']
  },
  {
    name: 'schedule',
    title: '📅 日程提醒',
    description: '智能日程管理，合理安排教学时间',
    icon: Calendar,
    color: '#606266',
    route: '/ai/schedule',
    featured: false,
    features: ['日程规划', '提醒通知', '时间管理']
  }
])

// 统计数据
const stats = reactive({
  totalChats: 0,
  lessonsCreated: 0,
  essaysGraded: 0,
  toolsUsed: 0
})

// 导航到模块
const navigateToModule = (route: string) => {
  router.push(route)
}

// 加载统计数据
const loadStats = async () => {
  try {
    // 这里可以调用API获取真实统计数据
    stats.totalChats = 156
    stats.lessonsCreated = 43
    stats.essaysGraded = 89
    stats.toolsUsed = 234
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.ai-assistant-directory {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.ai-header {
  text-align: center;
  margin-bottom: 40px;
}

.ai-header h2 {
  font-size: 32px;
  color: #303133;
  margin-bottom: 8px;
  font-weight: 600;
}

.subtitle {
  font-size: 16px;
  color: #909399;
  margin: 0;
}

.ai-modules {
  margin-bottom: 40px;
}

.module-card {
  cursor: pointer;
  transition: all 0.3s ease;
  height: 280px;
  margin-bottom: 24px;
}

.module-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.module-card.featured {
  border: 2px solid #409EFF;
}

.module-content {
  text-align: center;
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.module-icon {
  margin-bottom: 16px;
}

.module-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px 0;
}

.module-description {
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
  margin: 0 0 16px 0;
  flex: 1;
}

.module-features {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
}

.quick-stats {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 24px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

@media (max-width: 768px) {
  .ai-modules .el-col {
    margin-bottom: 16px;
  }
  
  .module-card {
    height: auto;
  }
  
  .quick-stats .el-col {
    margin-bottom: 12px;
  }
}
</style>