<template>
  <div class="resource-navigation">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <el-icon class="header-icon"><Compass /></el-icon>
          <div class="header-text">
            <h1>资源导航</h1>
            <p>快速访问教育资源和工具</p>
          </div>
        </div>
        <div class="header-actions">
          <el-button type="primary" @click="showAddDialog = true">
            <el-icon><Plus /></el-icon>
            添加资源
          </el-button>
          <el-button @click="showSettingsDialog = true">
            <el-icon><Setting /></el-icon>
            设置
          </el-button>
        </div>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-section">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索资源..."
        class="search-input"
        clearable
        @input="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-select v-model="selectedCategory" placeholder="选择分类" class="category-select" @change="handleCategoryChange">
        <el-option label="全部" value="" />
        <el-option label="教学工具" value="teaching" />
        <el-option label="课件资源" value="courseware" />
        <el-option label="题库" value="question" />
        <el-option label="视频资源" value="video" />
        <el-option label="文档模板" value="template" />
        <el-option label="其他" value="other" />
      </el-select>
    </div>

    <!-- 快速访问 -->
    <div class="quick-access">
      <h3>快速访问</h3>
      <div class="quick-links">
        <div class="quick-link" v-for="link in quickLinks" :key="link.id" @click="openResource(link)">
          <div class="link-icon">
            <el-icon><component :is="link.icon" /></el-icon>
          </div>
          <div class="link-info">
            <h4>{{ link.name }}</h4>
            <p>{{ link.description }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 资源分类 -->
    <div class="resource-categories">
      <div class="category-section" v-for="category in filteredCategories" :key="category.id">
        <div class="category-header">
          <h3>
            <el-icon><component :is="category.icon" /></el-icon>
            {{ category.name }}
          </h3>
          <span class="resource-count">{{ category.resources.length }} 个资源</span>
        </div>
        <div class="resource-grid">
          <div 
            class="resource-card" 
            v-for="resource in category.resources" 
            :key="resource.id"
            @click="openResource(resource)"
          >
            <div class="card-header">
              <div class="resource-icon">
                <el-icon><component :is="resource.icon" /></el-icon>
              </div>
              <el-dropdown trigger="click" @command="handleResourceAction">
                <el-button text>
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item :command="{action: 'edit', resource}">
                      <el-icon><Edit /></el-icon>
                      编辑
                    </el-dropdown-item>
                    <el-dropdown-item :command="{action: 'favorite', resource}">
                      <el-icon><Star /></el-icon>
                      {{ resource.isFavorite ? '取消收藏' : '收藏' }}
                    </el-dropdown-item>
                    <el-dropdown-item :command="{action: 'delete', resource}" divided>
                      <el-icon><Delete /></el-icon>
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
            <div class="card-content">
              <h4>{{ resource.name }}</h4>
              <p>{{ resource.description }}</p>
              <div class="resource-meta">
                <el-tag size="small" :type="getTagType(resource.category)">{{ getCategoryName(resource.category) }}</el-tag>
                <span class="visit-count">访问 {{ resource.visitCount }} 次</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加资源对话框 -->
    <el-dialog v-model="showAddDialog" title="添加资源" width="500px">
      <el-form :model="resourceForm" :rules="resourceRules" ref="resourceFormRef" label-width="80px">
        <el-form-item label="资源名称" prop="name">
          <el-input v-model="resourceForm.name" placeholder="请输入资源名称" />
        </el-form-item>
        <el-form-item label="资源链接" prop="url">
          <el-input v-model="resourceForm.url" placeholder="请输入资源链接" />
        </el-form-item>
        <el-form-item label="资源描述" prop="description">
          <el-input v-model="resourceForm.description" type="textarea" placeholder="请输入资源描述" />
        </el-form-item>
        <el-form-item label="资源分类" prop="category">
          <el-select v-model="resourceForm.category" placeholder="请选择分类">
            <el-option label="教学工具" value="teaching" />
            <el-option label="课件资源" value="courseware" />
            <el-option label="题库" value="question" />
            <el-option label="视频资源" value="video" />
            <el-option label="文档模板" value="template" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="图标">
          <el-select v-model="resourceForm.icon" placeholder="选择图标">
            <el-option label="链接" value="Link" />
            <el-option label="文档" value="Document" />
            <el-option label="视频" value="VideoPlay" />
            <el-option label="图片" value="Picture" />
            <el-option label="工具" value="Tools" />
            <el-option label="书籍" value="Reading" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddResource">确定</el-button>
      </template>
    </el-dialog>

    <!-- 设置对话框 -->
    <el-dialog v-model="showSettingsDialog" title="资源导航设置" width="600px">
      <el-form :model="settings" label-width="120px">
        <el-form-item label="默认打开方式">
          <el-radio-group v-model="settings.openMode">
            <el-radio label="internal">内置浏览器</el-radio>
            <el-radio label="external">外部浏览器</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="显示访问统计">
          <el-switch v-model="settings.showVisitCount" />
        </el-form-item>
        <el-form-item label="自动更新资源">
          <el-switch v-model="settings.autoUpdate" />
        </el-form-item>
        <el-form-item label="每页显示数量">
          <el-input-number v-model="settings.pageSize" :min="6" :max="24" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSettingsDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveSettings">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Compass, Plus, Setting, Search, MoreFilled, Edit, Star, Delete,
  Link, Document, VideoPlay, Picture, Tools, Reading,
  Monitor, Notebook, QuestionFilled, Film, Files, Grid
} from '@element-plus/icons-vue'

// 响应式数据
const searchKeyword = ref('')
const selectedCategory = ref('')
const showAddDialog = ref(false)
const showSettingsDialog = ref(false)
const resourceFormRef = ref()

// 资源表单
const resourceForm = reactive({
  name: '',
  url: '',
  description: '',
  category: '',
  icon: 'Link'
})

// 表单验证规则
const resourceRules = {
  name: [{ required: true, message: '请输入资源名称', trigger: 'blur' }],
  url: [{ required: true, message: '请输入资源链接', trigger: 'blur' }],
  category: [{ required: true, message: '请选择资源分类', trigger: 'change' }]
}

// 设置
const settings = reactive({
  openMode: 'external',
  showVisitCount: true,
  autoUpdate: false,
  pageSize: 12
})

// 快速链接
const quickLinks = ref([
  {
    id: 1,
    name: '国家智慧教育平台',
    description: '官方教育资源平台',
    url: 'https://www.smartedu.cn/',
    icon: 'Monitor',
    category: 'teaching'
  },
  {
    id: 2,
    name: '中小学教材',
    description: '电子教材资源',
    url: 'http://bp.pep.com.cn/',
    icon: 'Reading',
    category: 'courseware'
  },
  {
    id: 3,
    name: '学科网',
    description: '教学资源下载',
    url: 'https://www.zxxk.com/',
    icon: 'Files',
    category: 'courseware'
  },
  {
    id: 4,
    name: '题库网',
    description: '在线题库资源',
    url: 'https://www.tikuwang.com/',
    icon: 'QuestionFilled',
    category: 'question'
  }
])

// 资源分类
const resourceCategories = ref([
  {
    id: 1,
    name: '教学工具',
    icon: 'Tools',
    category: 'teaching',
    resources: [
      {
        id: 101,
        name: 'ClassIn',
        description: '在线教学平台',
        url: 'https://www.eeo.cn/',
        icon: 'Monitor',
        category: 'teaching',
        visitCount: 25,
        isFavorite: false
      },
      {
        id: 102,
        name: '腾讯会议',
        description: '视频会议工具',
        url: 'https://meeting.tencent.com/',
        icon: 'VideoPlay',
        category: 'teaching',
        visitCount: 18,
        isFavorite: true
      }
    ]
  },
  {
    id: 2,
    name: '课件资源',
    icon: 'Files',
    category: 'courseware',
    resources: [
      {
        id: 201,
        name: 'PPT模板',
        description: '精美课件模板',
        url: 'https://www.1ppt.com/',
        icon: 'Document',
        category: 'courseware',
        visitCount: 42,
        isFavorite: false
      },
      {
        id: 202,
        name: '教学素材',
        description: '图片视频素材',
        url: 'https://www.51sucai.com/',
        icon: 'Picture',
        category: 'courseware',
        visitCount: 31,
        isFavorite: true
      }
    ]
  },
  {
    id: 3,
    name: '题库资源',
    icon: 'QuestionFilled',
    category: 'question',
    resources: [
      {
        id: 301,
        name: '组卷网',
        description: '在线组卷平台',
        url: 'https://www.zujuan.com/',
        icon: 'QuestionFilled',
        category: 'question',
        visitCount: 67,
        isFavorite: true
      },
      {
        id: 302,
        name: '试题库',
        description: '海量试题资源',
        url: 'https://www.shitiku.com/',
        icon: 'Notebook',
        category: 'question',
        visitCount: 23,
        isFavorite: false
      }
    ]
  },
  {
    id: 4,
    name: '视频资源',
    icon: 'Film',
    category: 'video',
    resources: [
      {
        id: 401,
        name: '教学视频',
        description: '优质教学视频',
        url: 'https://www.icourse163.org/',
        icon: 'VideoPlay',
        category: 'video',
        visitCount: 89,
        isFavorite: true
      }
    ]
  }
])

// 计算属性
const filteredCategories = computed(() => {
  let categories = resourceCategories.value
  
  // 按分类筛选
  if (selectedCategory.value) {
    categories = categories.filter(cat => cat.category === selectedCategory.value)
  }
  
  // 按关键词搜索
  if (searchKeyword.value) {
    categories = categories.map(cat => ({
      ...cat,
      resources: cat.resources.filter(resource => 
        resource.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchKeyword.value.toLowerCase())
      )
    })).filter(cat => cat.resources.length > 0)
  }
  
  return categories
})

// 方法
const handleSearch = () => {
  // 搜索逻辑已在计算属性中处理
}

const handleCategoryChange = () => {
  // 分类筛选逻辑已在计算属性中处理
}

const openResource = (resource: any) => {
  // 增加访问次数
  resource.visitCount = (resource.visitCount || 0) + 1
  
  // 根据设置打开资源
  if (settings.openMode === 'external') {
    window.open(resource.url, '_blank')
  } else {
    // 内置浏览器打开（需要实现）
    ElMessage.info('内置浏览器功能开发中')
  }
}

const handleResourceAction = (command: any) => {
  const { action, resource } = command
  
  switch (action) {
    case 'edit':
      // 编辑资源
      Object.assign(resourceForm, resource)
      showAddDialog.value = true
      break
    case 'favorite':
      // 收藏/取消收藏
      resource.isFavorite = !resource.isFavorite
      ElMessage.success(resource.isFavorite ? '已收藏' : '已取消收藏')
      break
    case 'delete':
      // 删除资源
      ElMessageBox.confirm('确定要删除这个资源吗？', '确认删除', {
        type: 'warning'
      }).then(() => {
        // 从分类中删除资源
        resourceCategories.value.forEach(cat => {
          const index = cat.resources.findIndex(r => r.id === resource.id)
          if (index > -1) {
            cat.resources.splice(index, 1)
          }
        })
        ElMessage.success('删除成功')
      }).catch(() => {})
      break
  }
}

const handleAddResource = () => {
  resourceFormRef.value?.validate((valid: boolean) => {
    if (valid) {
      // 添加新资源
      const newResource = {
        id: Date.now(),
        ...resourceForm,
        visitCount: 0,
        isFavorite: false
      }
      
      // 找到对应分类并添加资源
      const category = resourceCategories.value.find(cat => cat.category === resourceForm.category)
      if (category) {
        category.resources.push(newResource)
      } else {
        // 创建新分类
        resourceCategories.value.push({
          id: Date.now(),
          name: getCategoryName(resourceForm.category),
          icon: 'Grid',
          category: resourceForm.category,
          resources: [newResource]
        })
      }
      
      // 重置表单
      Object.assign(resourceForm, {
        name: '',
        url: '',
        description: '',
        category: '',
        icon: 'Link'
      })
      
      showAddDialog.value = false
      ElMessage.success('添加成功')
    }
  })
}

const handleSaveSettings = () => {
  // 保存设置到本地存储
  localStorage.setItem('resourceNavigationSettings', JSON.stringify(settings))
  showSettingsDialog.value = false
  ElMessage.success('设置保存成功')
}

const getCategoryName = (category: string) => {
  const categoryMap: Record<string, string> = {
    teaching: '教学工具',
    courseware: '课件资源',
    question: '题库',
    video: '视频资源',
    template: '文档模板',
    other: '其他'
  }
  return categoryMap[category] || '其他'
}

const getTagType = (category: string) => {
  const typeMap: Record<string, string> = {
    teaching: 'primary',
    courseware: 'success',
    question: 'warning',
    video: 'danger',
    template: 'info',
    other: ''
  }
  return typeMap[category] || ''
}

// 生命周期
onMounted(() => {
  // 加载设置
  const savedSettings = localStorage.getItem('resourceNavigationSettings')
  if (savedSettings) {
    Object.assign(settings, JSON.parse(savedSettings))
  }
})
</script>

<style scoped>
.resource-navigation {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  font-size: 32px;
  color: #409eff;
}

.header-text h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.header-text p {
  margin: 4px 0 0 0;
  color: #909399;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.search-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 16px;
  align-items: center;
}

.search-input {
  flex: 1;
  max-width: 400px;
}

.category-select {
  width: 150px;
}

.quick-access {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.quick-access h3 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 18px;
}

.quick-links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.quick-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.quick-link:hover {
  border-color: #409eff;
  background: #f0f9ff;
}

.link-icon {
  font-size: 24px;
  color: #409eff;
}

.link-info h4 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.link-info p {
  margin: 4px 0 0 0;
  font-size: 12px;
  color: #909399;
}

.resource-categories {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.category-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.category-header h3 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #303133;
  font-size: 18px;
}

.resource-count {
  color: #909399;
  font-size: 14px;
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.resource-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.resource-card:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.resource-icon {
  font-size: 20px;
  color: #409eff;
}

.card-content h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #303133;
}

.card-content p {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.4;
}

.resource-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.visit-count {
  font-size: 12px;
  color: #909399;
}

@media (max-width: 768px) {
  .resource-navigation {
    padding: 12px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .search-section {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input {
    max-width: none;
  }
  
  .quick-links {
    grid-template-columns: 1fr;
  }
  
  .resource-grid {
    grid-template-columns: 1fr;
  }
}
</style>