<template>
  <Layout>
    <div class="templates-enhanced">
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="header-left">
          <h2>文档模板中心</h2>
          <p class="header-desc">智能化文档模板管理，让文档创建更简单高效</p>
        </div>
        <div class="header-actions">
          <el-button-group>
            <el-button @click="showQuickStart = true">
              <el-icon><QuestionFilled /></el-icon>
              快速入门
            </el-button>
            <el-button @click="importTemplate">
              <el-icon><Upload /></el-icon>
              导入文件
            </el-button>
            <el-button type="primary" @click="createTemplate">
              <el-icon><Plus /></el-icon>
              创建模板
            </el-button>
          </el-button-group>
        </div>
      </div>

      <!-- 功能导航 -->
      <div class="feature-nav">
        <el-card>
          <div class="nav-tabs">
            <div 
              v-for="tab in navigationTabs" 
              :key="tab.key"
              class="nav-tab"
              :class="{ active: activeTab === tab.key }"
              @click="activeTab = tab.key"
            >
              <el-icon><component :is="tab.icon" /></el-icon>
              <span>{{ tab.label }}</span>
              <el-badge v-if="tab.count" :value="tab.count" class="tab-badge" />
            </div>
          </div>
        </el-card>
      </div>

      <!-- 搜索和筛选 -->
      <div class="search-filter" v-if="activeTab !== 'create'">
        <el-card>
          <div class="filter-row">
            <div class="search-box">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索模板名称、描述或标签..."
                clearable
                @input="handleSearch"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </div>
            
            <div class="filter-controls">
              <el-select v-model="filterCategory" placeholder="选择分类" clearable>
                <el-option 
                  v-for="category in categories" 
                  :key="category.value"
                  :label="category.label"
                  :value="category.value"
                />
              </el-select>
              
              <el-select v-model="filterType" placeholder="模板类型" clearable>
                <el-option label="全部" value="" />
                <el-option label="系统模板" value="system" />
                <el-option label="我的模板" value="custom" />
                <el-option label="收藏模板" value="favorite" />
              </el-select>
              
              <el-select v-model="sortBy" placeholder="排序方式">
                <el-option label="最近使用" value="recent" />
                <el-option label="创建时间" value="created" />
                <el-option label="使用次数" value="usage" />
                <el-option label="评分" value="rating" />
              </el-select>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 内容区域 -->
      <div class="content-area">
        <!-- 公共模板库 -->
        <div v-if="activeTab === 'public'" class="template-gallery">
          <div class="gallery-header">
            <h3>公共模板库</h3>
            <div class="view-controls">
              <el-radio-group v-model="viewMode" size="small">
                <el-radio-button label="grid">网格</el-radio-button>
                <el-radio-button label="list">列表</el-radio-button>
              </el-radio-group>
            </div>
          </div>
          
          <div class="template-grid" v-if="viewMode === 'grid'">
            <div 
              v-for="template in filteredPublicTemplates" 
              :key="template.id"
              class="template-card"
              @click="showPreviewTemplate(template)"
            >
              <div class="card-preview">
                <img 
                  v-if="template.previewImage" 
                  :src="template.previewImage" 
                  :alt="template.name"
                />
                <div v-else class="preview-placeholder">
                  <el-icon size="48"><Document /></el-icon>
                </div>
              </div>
              
              <div class="card-content">
                <h4 class="template-title">{{ template.name }}</h4>
                <p class="template-desc">{{ template.description }}</p>
                
                <div class="template-meta">
                  <el-tag size="small" type="info">{{ getCategoryLabel(template.category) }}</el-tag>
                  <div class="meta-right">
                    <el-rate 
                      v-model="template.rating" 
                      disabled 
                      size="small" 
                      show-score
                    />
                    <span class="download-count">{{ template.downloadCount }}次使用</span>
                  </div>
                </div>
                
                <div class="card-actions">
                  <el-button size="small" @click.stop="useTemplate(template)">
                    <el-icon><DocumentAdd /></el-icon>
                    使用
                  </el-button>
                  <el-button size="small" @click.stop="showPreviewTemplate(template)">
                    <el-icon><View /></el-icon>
                    预览
                  </el-button>
                  <el-button 
                    size="small" 
                    :type="template.isFavorite ? 'warning' : ''"
                    @click.stop="toggleFavorite(template)"
                  >
                    <el-icon><Star /></el-icon>
                    {{ template.isFavorite ? '已收藏' : '收藏' }}
                  </el-button>
                </div>
              </div>
            </div>
          </div>
          
          <div class="template-list" v-else>
            <el-table :data="filteredPublicTemplates" style="width: 100%">
              <el-table-column prop="name" label="模板名称" width="200" />
              <el-table-column prop="description" label="描述" />
              <el-table-column prop="category" label="分类" width="120">
                <template #default="{ row }">
                  <el-tag size="small">{{ getCategoryLabel(row.category) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="rating" label="评分" width="120">
                <template #default="{ row }">
                  <el-rate v-model="row.rating" disabled size="small" />
                </template>
              </el-table-column>
              <el-table-column prop="downloadCount" label="使用次数" width="100" />
              <el-table-column label="操作" width="200">
                <template #default="{ row }">
                  <el-button size="small" @click="useTemplate(row)">使用</el-button>
                  <el-button size="small" @click="showPreviewTemplate(row)">预览</el-button>
                  <el-button size="small" @click="toggleFavorite(row)">收藏</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <!-- 我的模板 -->
        <div v-else-if="activeTab === 'my'" class="my-templates">
          <div class="templates-section">
            <h3>我的模板</h3>
            <div class="template-grid">
              <div 
                v-for="template in myTemplates" 
                :key="template.id"
                class="template-card my-template-card"
              >
                <div class="card-preview">
                  <img 
                    v-if="template.previewImage" 
                    :src="template.previewImage" 
                    :alt="template.name"
                  />
                  <div v-else class="preview-placeholder">
                    <el-icon size="48"><Document /></el-icon>
                  </div>
                </div>
                
                <div class="card-content">
                  <h4 class="template-title">{{ template.name }}</h4>
                  <p class="template-desc">{{ template.description }}</p>
                  
                  <div class="template-meta">
                    <el-tag size="small" type="success">{{ getCategoryLabel(template.category) }}</el-tag>
                    <span class="created-time">{{ formatDate(template.createdAt) }}</span>
                  </div>
                  
                  <div class="card-actions">
                    <el-button size="small" type="primary" @click="useTemplate(template)">
                      <el-icon><DocumentAdd /></el-icon>
                      使用
                    </el-button>
                    <el-button size="small" @click="editTemplate(template)">
                      <el-icon><Edit /></el-icon>
                      编辑
                    </el-button>
                    <el-dropdown @command="handleTemplateAction">
                      <el-button size="small">
                        <el-icon><More /></el-icon>
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item :command="{ action: 'duplicate', template }">
                            <el-icon><CopyDocument /></el-icon>
                            复制
                          </el-dropdown-item>
                          <el-dropdown-item :command="{ action: 'export', template }">
                            <el-icon><Download /></el-icon>
                            导出
                          </el-dropdown-item>
                          <el-dropdown-item :command="{ action: 'share', template }">
                            <el-icon><Share /></el-icon>
                            分享
                          </el-dropdown-item>
                          <el-dropdown-item divided :command="{ action: 'delete', template }">
                            <el-icon><Delete /></el-icon>
                            删除
                          </el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 创建模板 -->
        <div v-else-if="activeTab === 'create'" class="create-template">
          <div class="create-options">
            <h3>创建新模板</h3>
            <p class="create-desc">选择一种方式开始创建您的文档模板</p>
            
            <div class="option-cards">
              <div class="option-card" @click="createFromScratch">
                <div class="option-icon">
                  <el-icon size="48"><DocumentAdd /></el-icon>
                </div>
                <h4>从零开始</h4>
                <p>使用可视化编辑器创建全新模板</p>
                <div class="option-features">
                  <el-tag size="small">拖拽设计</el-tag>
                  <el-tag size="small">实时预览</el-tag>
                  <el-tag size="small">组件库</el-tag>
                </div>
              </div>
              
              <div class="option-card" @click="importFromFile">
                <div class="option-icon">
                  <el-icon size="48"><Upload /></el-icon>
                </div>
                <h4>导入文件</h4>
                <p>从现有Word、Excel等文件导入</p>
                <div class="option-features">
                  <el-tag size="small">智能解析</el-tag>
                  <el-tag size="small">变量识别</el-tag>
                  <el-tag size="small">格式保持</el-tag>
                </div>
              </div>
              
              <div class="option-card" @click="useExistingTemplate">
                <div class="option-icon">
                  <el-icon size="48"><CopyDocument /></el-icon>
                </div>
                <h4>基于现有模板</h4>
                <p>复制并修改现有模板</p>
                <div class="option-features">
                  <el-tag size="small">快速创建</el-tag>
                  <el-tag size="small">继承样式</el-tag>
                  <el-tag size="small">自定义修改</el-tag>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 生成记录 -->
        <div v-else-if="activeTab === 'history'" class="generation-history">
          <div class="history-header">
            <h3>生成记录</h3>
            <el-button @click="clearHistory">
              <el-icon><Delete /></el-icon>
              清空记录
            </el-button>
          </div>
          
          <el-table :data="generationHistory" style="width: 100%">
            <el-table-column prop="templateName" label="模板名称" />
            <el-table-column prop="outputFormat" label="输出格式" width="100" />
            <el-table-column prop="createdAt" label="生成时间" width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <el-button size="small" @click="openFile(row.filePath)">打开</el-button>
                <el-button size="small" @click="regenerateDocument(row)">重新生成</el-button>
                <el-button size="small" @click="deleteRecord(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- 模板预览对话框 -->
      <el-dialog 
        v-model="showPreviewDialog" 
        title="模板预览" 
        width="80%"
        :close-on-click-modal="false"
      >
        <div class="preview-container">
          <div class="preview-toolbar">
            <div class="toolbar-left">
              <h4>{{ previewTemplate?.name }}</h4>
              <el-tag size="small">{{ getCategoryLabel(previewTemplate?.category) }}</el-tag>
            </div>
            <div class="toolbar-right">
              <el-button @click="editPreviewTemplate">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button type="primary" @click="usePreviewTemplate">
                <el-icon><DocumentAdd /></el-icon>
                使用此模板
              </el-button>
            </div>
          </div>
          
          <div class="preview-content">
            <div class="preview-frame" v-html="previewTemplate?.content"></div>
          </div>
        </div>
      </el-dialog>

      <!-- 快速入门对话框 -->
      <el-dialog 
        v-model="showQuickStart" 
        title="快速入门" 
        width="600px"
      >
        <div class="quick-start-content">
          <el-steps :active="quickStartStep" direction="vertical">
            <el-step title="选择创建方式" description="从零开始、导入文件或基于现有模板" />
            <el-step title="设计模板内容" description="使用可视化编辑器设计模板布局" />
            <el-step title="配置变量" description="添加动态变量，实现数据自动填充" />
            <el-step title="预览和测试" description="预览模板效果，测试变量替换" />
            <el-step title="保存和使用" description="保存模板并生成文档" />
          </el-steps>
          
          <div class="quick-start-actions">
            <el-button @click="showQuickStart = false">跳过</el-button>
            <el-button type="primary" @click="startQuickTour">开始体验</el-button>
          </div>
        </div>
      </el-dialog>

      <!-- 模板编辑器 -->
      <el-drawer 
        v-model="showEditor" 
        title="模板编辑器" 
        size="100%"
        :close-on-click-modal="false"
      >
        <TemplateEditor 
          v-if="showEditor"
          :template="editingTemplate"
          @save="handleTemplateSave"
          @cancel="showEditor = false"
        />
      </el-drawer>

      <!-- 模板使用对话框 -->
      <TemplateUseDialog
        v-model="showUseDialog"
        :template="usingTemplate"
        @document-generated="handleDocumentGenerated"
      />
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Upload, Search, Document, DocumentAdd, View, Edit, Delete, More,
  CopyDocument, Download, Share, Star, QuestionFilled, Files, User, Clock
} from '@element-plus/icons-vue'
import Layout from './Layout.vue'
import TemplateEditor from '../components/TemplateEditor.vue'
import TemplateUseDialog from '../components/TemplateUseDialog.vue'
import { useTemplateStore } from '../stores/template'

// 状态管理
const templateStore = useTemplateStore()

// 响应式数据
const activeTab = ref('public')
const viewMode = ref('grid')
const searchKeyword = ref('')
const filterCategory = ref('')
const filterType = ref('')
const sortBy = ref('recent')
const showPreviewDialog = ref(false)
const showQuickStart = ref(false)
const showEditor = ref(false)
const showUseDialog = ref(false)
const quickStartStep = ref(0)
const previewTemplate = ref(null)
const editingTemplate = ref(null)
const usingTemplate = ref(null)

// 导航标签
const navigationTabs = [
  { key: 'public', label: '公共模板库', icon: Files, count: 0 },
  { key: 'my', label: '我的模板', icon: User, count: 0 },
  { key: 'create', label: '创建模板', icon: Plus, count: null },
  { key: 'history', label: '生成记录', icon: Clock, count: 0 }
]

// 分类选项
const categories = [
  { label: '通知公告', value: 'notice' },
  { label: '课程表', value: 'schedule' },
  { label: '评语模板', value: 'comment' },
  { label: '其他', value: 'other' }
]

// 真实数据
const publicTemplates = ref([])

const myTemplates = ref([])

const generationHistory = ref([
  {
    id: 1,
    templateName: '学生成绩单模板',
    outputFormat: 'PDF',
    filePath: '/path/to/generated/file.pdf',
    createdAt: '2024-01-20T14:30:00Z'
  }
])

// 计算属性
const filteredPublicTemplates = computed(() => {
  let filtered = publicTemplates.value
  
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(template => 
      template.name.toLowerCase().includes(keyword) ||
      template.description.toLowerCase().includes(keyword)
    )
  }
  
  if (filterCategory.value) {
    filtered = filtered.filter(template => template.category === filterCategory.value)
  }
  
  // 排序
  switch (sortBy.value) {
    case 'rating':
      filtered.sort((a, b) => b.rating - a.rating)
      break
    case 'usage':
      filtered.sort((a, b) => b.downloadCount - a.downloadCount)
      break
    default:
      // 保持原有顺序
  }
  
  return filtered
})

// 方法
const handleSearch = () => {
  // 搜索逻辑已在计算属性中处理
}

const getCategoryLabel = (category: string) => {
  const found = categories.find(c => c.value === category)
  return found ? found.label : category
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const showPreviewTemplate = (template: any) => {
  previewTemplate.value = template
  showPreviewDialog.value = true
}

const useTemplate = (template: any) => {
  usingTemplate.value = template
  showUseDialog.value = true
}

const toggleFavorite = (template: any) => {
  template.isFavorite = !template.isFavorite
  ElMessage.success(template.isFavorite ? '已添加到收藏' : '已取消收藏')
}

const createTemplate = () => {
  activeTab.value = 'create'
}

const importTemplate = () => {
  // 导入模板逻辑
  ElMessage.info('导入功能开发中...')
}

const createFromScratch = () => {
  editingTemplate.value = null
  showEditor.value = true
}

const importFromFile = () => {
  // 文件导入逻辑
  ElMessage.info('文件导入功能开发中...')
}

const useExistingTemplate = () => {
  // 基于现有模板创建
  ElMessage.info('基于现有模板功能开发中...')
}

const editTemplate = (template: any) => {
  editingTemplate.value = template
  showEditor.value = true
}

const handleTemplateAction = ({ action, template }: { action: string; template: any }) => {
  switch (action) {
    case 'duplicate':
      ElMessage.success(`复制模板：${template.name}`)
      break
    case 'export':
      ElMessage.success(`导出模板：${template.name}`)
      break
    case 'share':
      ElMessage.success(`分享模板：${template.name}`)
      break
    case 'delete':
      ElMessageBox.confirm(`确定要删除模板"${template.name}"吗？`, '确认删除', {
        type: 'warning'
      }).then(() => {
        ElMessage.success('模板删除成功')
      })
      break
  }
}

const clearHistory = () => {
  ElMessageBox.confirm('确定要清空所有生成记录吗？', '确认清空', {
    type: 'warning'
  }).then(() => {
    generationHistory.value = []
    ElMessage.success('记录清空成功')
  })
}

const openFile = (filePath: string) => {
  // 打开文件
  ElMessage.success(`打开文件：${filePath}`)
}

const regenerateDocument = (record: any) => {
  // 重新生成文档
  ElMessage.success(`重新生成：${record.templateName}`)
}

const deleteRecord = (id: number) => {
  const index = generationHistory.value.findIndex(r => r.id === id)
  if (index > -1) {
    generationHistory.value.splice(index, 1)
    ElMessage.success('记录删除成功')
  }
}

const editPreviewTemplate = () => {
  editingTemplate.value = previewTemplate.value
  showPreviewDialog.value = false
  showEditor.value = true
}

const usePreviewTemplate = () => {
  useTemplate(previewTemplate.value)
  showPreviewDialog.value = false
}

const startQuickTour = () => {
  showQuickStart.value = false
  // 开始引导流程
  ElMessage.success('开始快速体验')
}

const handleTemplateSave = (template: any) => {
  // 保存模板
  ElMessage.success('模板保存成功')
  showEditor.value = false
}

// 处理文档生成
const handleDocumentGenerated = (documentData: any) => {
  // 添加到生成记录
  generationHistory.value.unshift({
    id: Date.now(),
    ...documentData,
    status: 'completed'
  })
  
  // 更新导航标签计数
  navigationTabs[3].count = generationHistory.value.length
  
  ElMessage.success('文档已生成并保存到生成记录中')
}

// 数据加载函数
const loadTemplates = async () => {
  try {
    const result = await window.electronAPI.templates.list()
    console.log('TemplatesEnhanced - 模板数据:', result)
    if (result.success) {
      // 分离系统模板和用户模板
      const allTemplates = result.data
      publicTemplates.value = allTemplates.filter(t => t.isSystem === true)
      myTemplates.value = allTemplates.filter(t => t.isSystem === false)
      
      // 更新导航标签计数
      navigationTabs[0].count = publicTemplates.value.length
      navigationTabs[1].count = myTemplates.value.length
      navigationTabs[3].count = generationHistory.value.length
      
      console.log('公共模板数量:', publicTemplates.value.length)
      console.log('我的模板数量:', myTemplates.value.length)
    } else {
      console.error('获取模板失败:', result.error)
      ElMessage.error('获取模板失败: ' + result.error)
    }
  } catch (error) {
    console.error('加载模板失败:', error)
    ElMessage.error('加载模板失败')
  }
}

// 生命周期
onMounted(() => {
  loadTemplates()
})
</script>

<style scoped>
.templates-enhanced {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.header-left h2 {
  margin: 0 0 5px 0;
  color: #303133;
}

.header-desc {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.feature-nav {
  margin-bottom: 20px;
}

.nav-tabs {
  display: flex;
  gap: 0;
}

.nav-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.3s;
  position: relative;
}

.nav-tab:hover {
  background: #f0f2f5;
}

.nav-tab.active {
  color: #409eff;
  border-bottom-color: #409eff;
  background: #ecf5ff;
}

.tab-badge {
  position: absolute;
  top: 5px;
  right: 5px;
}

.search-filter {
  margin-bottom: 20px;
}

.filter-row {
  display: flex;
  gap: 15px;
  align-items: center;
}

.search-box {
  flex: 1;
  max-width: 400px;
}

.filter-controls {
  display: flex;
  gap: 10px;
}

.content-area {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.template-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
  cursor: pointer;
}

.template-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.card-preview {
  height: 160px;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.card-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-placeholder {
  color: #c0c4cc;
}

.card-content {
  padding: 15px;
}

.template-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.template-desc {
  margin: 0 0 12px 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.template-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.meta-right {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: #909399;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.my-template-card {
  border-color: #67c23a;
}

.created-time {
  font-size: 12px;
  color: #909399;
}

.create-options {
  text-align: center;
  padding: 40px 20px;
}

.create-desc {
  color: #606266;
  margin-bottom: 40px;
}

.option-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 30px;
  max-width: 900px;
  margin: 0 auto;
}

.option-card {
  padding: 30px 20px;
  border: 2px solid #e4e7ed;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
}

.option-card:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
  transform: translateY(-4px);
}

.option-icon {
  color: #409eff;
  margin-bottom: 15px;
}

.option-card h4 {
  margin: 0 0 10px 0;
  color: #303133;
}

.option-card p {
  margin: 0 0 15px 0;
  color: #606266;
  line-height: 1.5;
}

.option-features {
  display: flex;
  gap: 5px;
  justify-content: center;
  flex-wrap: wrap;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.preview-container {
  height: 70vh;
  display: flex;
  flex-direction: column;
}

.preview-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #e4e7ed;
  margin-bottom: 20px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toolbar-left h4 {
  margin: 0;
}

.toolbar-right {
  display: flex;
  gap: 10px;
}

.preview-content {
  flex: 1;
  overflow: auto;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

.preview-frame {
  padding: 20px;
  background: white;
  min-height: 100%;
}

.quick-start-content {
  padding: 20px 0;
}

.quick-start-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 30px;
}
</style>