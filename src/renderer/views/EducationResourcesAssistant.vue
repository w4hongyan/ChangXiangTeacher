<template>
  <Layout>
    <div class="education-resources-assistant">
      <div class="resources-header">
        <div class="header-left">
          <el-button @click="goBack" type="text" size="large">
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
          <h2>📚 教育资源库</h2>
        </div>
        <div class="header-right">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索资源..."
            class="search-input"
            @keyup.enter="searchResources"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button type="primary" @click="showUploadDialog" size="small">
            <el-icon><Plus /></el-icon>
            上传资源
          </el-button>
        </div>
      </div>

      <div class="resources-container">
        <!-- 侧边栏分类 -->
        <div class="resources-sidebar">
          <div class="category-section">
            <h3>资源分类</h3>
            <el-tree
              :data="categoryTree"
              :props="treeProps"
              node-key="id"
              :current-node-key="selectedCategory"
              @node-click="handleCategoryClick"
              class="category-tree"
            >
              <template #default="{ node, data }">
                <span class="category-node">
                  <el-icon><component :is="data.icon" /></el-icon>
                  <span>{{ node.label }}</span>
                  <span class="count">({{ data.count || 0 }})</span>
                </span>
              </template>
            </el-tree>
          </div>
          
          <div class="filter-section">
            <h3>筛选条件</h3>
            
            <div class="filter-item">
              <label>学科</label>
              <el-select v-model="filters.subject" placeholder="全部学科" clearable>
                <el-option label="语文" value="语文"></el-option>
                <el-option label="数学" value="数学"></el-option>
                <el-option label="英语" value="英语"></el-option>
                <el-option label="物理" value="物理"></el-option>
                <el-option label="化学" value="化学"></el-option>
                <el-option label="生物" value="生物"></el-option>
                <el-option label="历史" value="历史"></el-option>
                <el-option label="地理" value="地理"></el-option>
                <el-option label="政治" value="政治"></el-option>
              </el-select>
            </div>
            
            <div class="filter-item">
              <label>年级</label>
              <el-select v-model="filters.grade" placeholder="全部年级" clearable>
                <el-option label="小学" value="小学"></el-option>
                <el-option label="初中" value="初中"></el-option>
                <el-option label="高中" value="高中"></el-option>
              </el-select>
            </div>
            
            <div class="filter-item">
              <label>文件类型</label>
              <el-select v-model="filters.fileType" placeholder="全部类型" clearable>
                <el-option label="PPT课件" value="ppt"></el-option>
                <el-option label="Word文档" value="doc"></el-option>
                <el-option label="PDF文档" value="pdf"></el-option>
                <el-option label="视频" value="video"></el-option>
                <el-option label="音频" value="audio"></el-option>
                <el-option label="图片" value="image"></el-option>
              </el-select>
            </div>
            
            <el-button type="primary" @click="applyFilters" size="small" style="width: 100%; margin-top: 16px;">
              应用筛选
            </el-button>
          </div>
        </div>

        <!-- 主内容区域 -->
        <div class="resources-main">
          <!-- 工具栏 -->
          <div class="resources-toolbar">
            <div class="toolbar-left">
              <el-tabs v-model="activeView" @tab-click="handleViewChange">
                <el-tab-pane label="全部资源" name="all"></el-tab-pane>
                <el-tab-pane label="我的收藏" name="favorites"></el-tab-pane>
                <el-tab-pane label="我的上传" name="uploads"></el-tab-pane>
                <el-tab-pane label="最近使用" name="recent"></el-tab-pane>
              </el-tabs>
            </div>
            
            <div class="toolbar-right">
              <el-radio-group v-model="viewMode" size="small">
                <el-radio-button label="grid">
                  <el-icon><Grid /></el-icon>
                </el-radio-button>
                <el-radio-button label="list">
                  <el-icon><List /></el-icon>
                </el-radio-button>
              </el-radio-group>
              
              <el-select v-model="sortBy" size="small" style="width: 120px; margin-left: 12px;">
                <el-option label="最新" value="newest"></el-option>
                <el-option label="最热" value="popular"></el-option>
                <el-option label="评分" value="rating"></el-option>
                <el-option label="下载量" value="downloads"></el-option>
              </el-select>
            </div>
          </div>

          <!-- 资源列表 -->
          <div class="resources-content" v-loading="isLoading">
            <!-- 网格视图 -->
            <div v-if="viewMode === 'grid'" class="grid-view">
              <div 
                v-for="resource in filteredResources" 
                :key="resource.id" 
                class="resource-card"
                @click="viewResource(resource)"
              >
                <div class="card-cover">
                  <img :src="resource.thumbnail || getDefaultThumbnail(resource.type)" :alt="resource.title" />
                  <div class="card-overlay">
                    <el-button @click.stop="toggleFavorite(resource)" circle size="small">
                      <el-icon><Star :class="{ 'is-favorite': resource.isFavorite }" /></el-icon>
                    </el-button>
                    <el-button @click.stop="downloadResource(resource)" circle size="small">
                      <el-icon><Download /></el-icon>
                    </el-button>
                  </div>
                </div>
                
                <div class="card-content">
                  <h4 class="card-title">{{ resource.title }}</h4>
                  <p class="card-description">{{ resource.description }}</p>
                  
                  <div class="card-meta">
                    <span class="meta-item">
                      <el-icon><User /></el-icon>
                      {{ resource.author }}
                    </span>
                    <span class="meta-item">
                      <el-icon><Calendar /></el-icon>
                      {{ formatDate(resource.uploadTime) }}
                    </span>
                  </div>
                  
                  <div class="card-tags">
                    <el-tag v-for="tag in resource.tags" :key="tag" size="small">{{ tag }}</el-tag>
                  </div>
                  
                  <div class="card-stats">
                    <span class="stat-item">
                      <el-icon><View /></el-icon>
                      {{ resource.views || 0 }}
                    </span>
                    <span class="stat-item">
                      <el-icon><Download /></el-icon>
                      {{ resource.downloads || 0 }}
                    </span>
                    <el-rate v-model="resource.rating" disabled size="small" show-score></el-rate>
                  </div>
                </div>
              </div>
            </div>

            <!-- 列表视图 -->
            <div v-else class="list-view">
              <el-table :data="filteredResources" @row-click="viewResource">
                <el-table-column width="60">
                  <template #default="{ row }">
                    <img :src="row.thumbnail || getDefaultThumbnail(row.type)" class="list-thumbnail" />
                  </template>
                </el-table-column>
                
                <el-table-column prop="title" label="标题" min-width="200">
                  <template #default="{ row }">
                    <div class="title-cell">
                      <span class="title-text">{{ row.title }}</span>
                      <div class="title-tags">
                        <el-tag v-for="tag in row.tags" :key="tag" size="small">{{ tag }}</el-tag>
                      </div>
                    </div>
                  </template>
                </el-table-column>
                
                <el-table-column prop="author" label="作者" width="120"></el-table-column>
                <el-table-column prop="subject" label="学科" width="80"></el-table-column>
                <el-table-column prop="grade" label="年级" width="80"></el-table-column>
                <el-table-column prop="uploadTime" label="上传时间" width="120">
                  <template #default="{ row }">
                    {{ formatDate(row.uploadTime) }}
                  </template>
                </el-table-column>
                
                <el-table-column label="评分" width="120">
                  <template #default="{ row }">
                    <el-rate v-model="row.rating" disabled size="small"></el-rate>
                  </template>
                </el-table-column>
                
                <el-table-column label="操作" width="150">
                  <template #default="{ row }">
                    <el-button @click.stop="toggleFavorite(row)" size="small" text>
                      <el-icon><Star :class="{ 'is-favorite': row.isFavorite }" /></el-icon>
                    </el-button>
                    <el-button @click.stop="downloadResource(row)" size="small" text>
                      <el-icon><Download /></el-icon>
                    </el-button>
                    <el-button @click.stop="shareResource(row)" size="small" text>
                      <el-icon><Share /></el-icon>
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <!-- 空状态 -->
            <div v-if="filteredResources.length === 0 && !isLoading" class="empty-state">
              <el-empty description="暂无资源">
                <el-button type="primary" @click="showUploadDialog">上传第一个资源</el-button>
              </el-empty>
            </div>
          </div>

          <!-- 分页 -->
          <div class="resources-pagination" v-if="filteredResources.length > 0">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[12, 24, 48, 96]"
              :total="totalResources"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 上传资源对话框 -->
    <el-dialog v-model="uploadDialogVisible" title="上传资源" width="600px">
      <el-form :model="uploadForm" label-width="100px">
        <el-form-item label="资源标题">
          <el-input v-model="uploadForm.title" placeholder="请输入资源标题"></el-input>
        </el-form-item>
        
        <el-form-item label="资源描述">
          <el-input v-model="uploadForm.description" type="textarea" :rows="3" placeholder="请描述资源内容"></el-input>
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="学科">
              <el-select v-model="uploadForm.subject" placeholder="请选择学科">
                <el-option label="语文" value="语文"></el-option>
                <el-option label="数学" value="数学"></el-option>
                <el-option label="英语" value="英语"></el-option>
                <el-option label="物理" value="物理"></el-option>
                <el-option label="化学" value="化学"></el-option>
                <el-option label="生物" value="生物"></el-option>
                <el-option label="历史" value="历史"></el-option>
                <el-option label="地理" value="地理"></el-option>
                <el-option label="政治" value="政治"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="年级">
              <el-select v-model="uploadForm.grade" placeholder="请选择年级">
                <el-option label="小学" value="小学"></el-option>
                <el-option label="初中" value="初中"></el-option>
                <el-option label="高中" value="高中"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="标签">
          <el-input v-model="uploadForm.tags" placeholder="请输入标签，用逗号分隔"></el-input>
        </el-form-item>
        
        <el-form-item label="文件上传">
          <el-upload
            class="upload-demo"
            drag
            :auto-upload="false"
            :on-change="handleUploadChange"
            multiple
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持多种格式：PPT、Word、PDF、视频、音频、图片等
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="uploadDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="uploadResource" :loading="isUploading">
            上传
          </el-button>
        </span>
      </template>
    </el-dialog>
  </Layout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  Grid, 
  List, 
  Star, 
  Download, 
  User, 
  Calendar, 
  View, 
  Share,
  UploadFilled,
  Document,
  VideoPlay,
  Picture,
  Headset,
  Files
} from '@element-plus/icons-vue'
import Layout from './Layout.vue'

const router = useRouter()

// 响应式数据
const searchKeyword = ref('')
const selectedCategory = ref('all')
const activeView = ref('all')
const viewMode = ref('grid')
const sortBy = ref('newest')
const currentPage = ref(1)
const pageSize = ref(24)
const isLoading = ref(false)
const uploadDialogVisible = ref(false)
const isUploading = ref(false)

// 筛选条件
const filters = reactive({
  subject: '',
  grade: '',
  fileType: ''
})

// 上传表单
const uploadForm = reactive({
  title: '',
  description: '',
  subject: '',
  grade: '',
  tags: '',
  files: []
})

// 分类树配置
const treeProps = {
  children: 'children',
  label: 'label'
}

// 分类树数据
const categoryTree = ref([
  {
    id: 'all',
    label: '全部资源',
    icon: 'Files',
    count: 1250
  },
  {
    id: 'courseware',
    label: '课件资源',
    icon: 'Document',
    count: 450,
    children: [
      { id: 'ppt', label: 'PPT课件', count: 280 },
      { id: 'interactive', label: '互动课件', count: 170 }
    ]
  },
  {
    id: 'video',
    label: '视频资源',
    icon: 'VideoPlay',
    count: 320,
    children: [
      { id: 'lecture', label: '教学视频', count: 200 },
      { id: 'experiment', label: '实验视频', count: 120 }
    ]
  },
  {
    id: 'audio',
    label: '音频资源',
    icon: 'Headset',
    count: 180
  },
  {
    id: 'document',
    label: '文档资源',
    icon: 'Document',
    count: 300,
    children: [
      { id: 'lesson_plan', label: '教案', count: 150 },
      { id: 'worksheet', label: '练习题', count: 150 }
    ]
  }
])

// 模拟资源数据
const mockResources = ref([
  {
    id: 1,
    title: '高中数学函数专题课件',
    description: '详细讲解函数的概念、性质和应用，包含丰富的例题和练习',
    author: '张老师',
    subject: '数学',
    grade: '高中',
    type: 'ppt',
    tags: ['函数', '高考', '专题复习'],
    uploadTime: '2024-01-15',
    views: 1250,
    downloads: 380,
    rating: 4.8,
    isFavorite: false,
    thumbnail: ''
  },
  {
    id: 2,
    title: '初中英语语法精讲视频',
    description: '系统讲解初中英语语法要点，适合基础巩固和提高',
    author: '李老师',
    subject: '英语',
    grade: '初中',
    type: 'video',
    tags: ['语法', '基础', '视频教学'],
    uploadTime: '2024-01-12',
    views: 890,
    downloads: 220,
    rating: 4.6,
    isFavorite: true,
    thumbnail: ''
  },
  {
    id: 3,
    title: '小学语文古诗词朗读音频',
    description: '标准普通话朗读，帮助学生掌握古诗词的韵律和情感',
    author: '王老师',
    subject: '语文',
    grade: '小学',
    type: 'audio',
    tags: ['古诗词', '朗读', '语文'],
    uploadTime: '2024-01-10',
    views: 650,
    downloads: 180,
    rating: 4.7,
    isFavorite: false,
    thumbnail: ''
  }
])

// 计算属性
const filteredResources = computed(() => {
  let resources = mockResources.value
  
  // 根据视图筛选
  if (activeView.value === 'favorites') {
    resources = resources.filter(r => r.isFavorite)
  }
  
  // 根据搜索关键词筛选
  if (searchKeyword.value) {
    resources = resources.filter(r => 
      r.title.includes(searchKeyword.value) || 
      r.description.includes(searchKeyword.value) ||
      r.tags.some(tag => tag.includes(searchKeyword.value))
    )
  }
  
  // 根据筛选条件筛选
  if (filters.subject) {
    resources = resources.filter(r => r.subject === filters.subject)
  }
  if (filters.grade) {
    resources = resources.filter(r => r.grade === filters.grade)
  }
  if (filters.fileType) {
    resources = resources.filter(r => r.type === filters.fileType)
  }
  
  return resources
})

const totalResources = computed(() => filteredResources.value.length)

// 方法
const goBack = () => {
  router.push('/ai-assistant')
}

const searchResources = () => {
  // 搜索逻辑已在计算属性中实现
  ElMessage.success(`搜索到 ${filteredResources.value.length} 个资源`)
}

const handleCategoryClick = (data: any) => {
  selectedCategory.value = data.id
  // 根据分类筛选资源
}

const handleViewChange = () => {
  // 视图切换逻辑已在计算属性中实现
}

const applyFilters = () => {
  ElMessage.success('筛选条件已应用')
}

const viewResource = (resource: any) => {
  ElMessage.info(`查看资源：${resource.title}`)
  // 这里可以打开资源详情页面或预览
}

const toggleFavorite = (resource: any) => {
  resource.isFavorite = !resource.isFavorite
  ElMessage.success(resource.isFavorite ? '已添加到收藏' : '已取消收藏')
}

const downloadResource = (resource: any) => {
  ElMessage.success(`开始下载：${resource.title}`)
  resource.downloads = (resource.downloads || 0) + 1
}

const shareResource = (resource: any) => {
  ElMessage.info('分享功能开发中...')
}

const showUploadDialog = () => {
  uploadDialogVisible.value = true
}

const handleUploadChange = (file: any, fileList: any[]) => {
  uploadForm.files = fileList
}

const uploadResource = async () => {
  if (!uploadForm.title || !uploadForm.subject || uploadForm.files.length === 0) {
    ElMessage.warning('请填写必要信息并选择文件')
    return
  }

  isUploading.value = true
  
  try {
    // 模拟上传过程
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 添加到资源列表
    const newResource = {
      id: Date.now(),
      title: uploadForm.title,
      description: uploadForm.description,
      author: '当前用户',
      subject: uploadForm.subject,
      grade: uploadForm.grade,
      type: getFileType(uploadForm.files[0].name),
      tags: uploadForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      uploadTime: new Date().toISOString().split('T')[0],
      views: 0,
      downloads: 0,
      rating: 0,
      isFavorite: false,
      thumbnail: ''
    }
    
    mockResources.value.unshift(newResource)
    
    ElMessage.success('资源上传成功')
    uploadDialogVisible.value = false
    
    // 重置表单
    Object.assign(uploadForm, {
      title: '',
      description: '',
      subject: '',
      grade: '',
      tags: '',
      files: []
    })
  } catch (error) {
    ElMessage.error('上传失败，请重试')
  } finally {
    isUploading.value = false
  }
}

const getFileType = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (['ppt', 'pptx'].includes(ext || '')) return 'ppt'
  if (['doc', 'docx'].includes(ext || '')) return 'doc'
  if (['pdf'].includes(ext || '')) return 'pdf'
  if (['mp4', 'avi', 'mov'].includes(ext || '')) return 'video'
  if (['mp3', 'wav'].includes(ext || '')) return 'audio'
  if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) return 'image'
  return 'other'
}

const getDefaultThumbnail = (type: string) => {
  const thumbnails = {
    ppt: '/images/ppt-icon.png',
    doc: '/images/doc-icon.png',
    pdf: '/images/pdf-icon.png',
    video: '/images/video-icon.png',
    audio: '/images/audio-icon.png',
    image: '/images/image-icon.png'
  }
  return thumbnails[type] || '/images/file-icon.png'
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
}

// 生命周期
onMounted(() => {
  // 初始化数据
})
</script>

<style scoped>
.education-resources-assistant {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.resources-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e9ecef;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h2 {
  margin: 0;
  color: #303133;
  font-size: 20px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-input {
  width: 300px;
}

.resources-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.resources-sidebar {
  width: 280px;
  background: white;
  border-right: 1px solid #e9ecef;
  padding: 20px;
  overflow-y: auto;
}

.category-section {
  margin-bottom: 32px;
}

.category-section h3 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 16px;
}

.category-tree {
  border: none;
}

.category-node {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.count {
  margin-left: auto;
  color: #909399;
  font-size: 12px;
}

.filter-section h3 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 16px;
}

.filter-item {
  margin-bottom: 16px;
}

.filter-item label {
  display: block;
  margin-bottom: 8px;
  color: #606266;
  font-size: 14px;
}

.resources-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.resources-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e9ecef;
}

.toolbar-right {
  display: flex;
  align-items: center;
}

.resources-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.grid-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.resource-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  cursor: pointer;
}

.resource-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.card-cover {
  position: relative;
  height: 180px;
  overflow: hidden;
}

.card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-overlay {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s;
}

.resource-card:hover .card-overlay {
  opacity: 1;
}

.card-content {
  padding: 16px;
}

.card-title {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-description {
  margin: 0 0 12px 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
  height: 42px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #909399;
  font-size: 12px;
}

.card-tags {
  margin-bottom: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.card-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #909399;
  font-size: 12px;
}

.list-view .list-thumbnail {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
}

.title-cell {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.title-text {
  font-weight: 500;
  color: #303133;
}

.title-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
}

.resources-pagination {
  padding: 20px;
  text-align: center;
  background: white;
  border-top: 1px solid #e9ecef;
}

.is-favorite {
  color: #f56c6c;
}

@media (max-width: 768px) {
  .resources-container {
    flex-direction: column;
  }
  
  .resources-sidebar {
    width: 100%;
    height: auto;
  }
  
  .grid-view {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 16px;
  }
  
  .search-input {
    width: 200px;
  }
}
</style>