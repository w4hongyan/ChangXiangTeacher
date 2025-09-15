<template>
  <Layout>
    <div class="ai-ppt-assistant">
    <div class="header">
      <h2>AI PPT 助手</h2>
      <p class="subtitle">根据主题或大纲智能生成PPT，自动配图让演示更精彩</p>
    </div>

    <div class="content-wrapper">
      <!-- 左侧输入区域 -->
      <div class="input-section">
        <el-card class="input-card">
          <template #header>
            <div class="card-header">
              <el-icon><Document /></el-icon>
              <span>PPT 内容设置</span>
            </div>
          </template>

          <!-- 主题输入 -->
          <div class="form-group">
            <label>PPT 主题</label>
            <el-input
              v-model="pptTheme"
              placeholder="请输入PPT主题，如：人工智能在教育中的应用"
              size="large"
              clearable
            />
          </div>

          <!-- 生成方式选择 -->
          <div class="form-group">
            <label>生成方式</label>
            <el-radio-group v-model="generateMode" size="large">
              <el-radio-button label="theme">基于主题生成</el-radio-button>
              <el-radio-button label="outline">基于大纲生成</el-radio-button>
            </el-radio-group>
          </div>

          <!-- 大纲输入 -->
          <div class="form-group" v-if="generateMode === 'outline'">
            <label>PPT 大纲</label>
            <el-input
              v-model="pptOutline"
              type="textarea"
              :rows="8"
              placeholder="请输入PPT大纲，每行一个要点：&#10;1. 人工智能概述&#10;2. AI在教育领域的应用&#10;3. 具体案例分析&#10;4. 未来发展趋势&#10;5. 总结与展望"
            />
          </div>

          <!-- 页数设置 -->
          <div class="form-group">
            <label>预期页数</label>
            <el-slider
              v-model="expectedPages"
              :min="5"
              :max="30"
              :step="1"
              show-stops
              show-input
            />
          </div>

          <!-- 主题设置 -->
          <div class="form-group">
            <label>PPT 主题</label>
            <el-select v-model="selectedThemeId" placeholder="选择PPT主题" size="large">
              <el-option 
                v-for="theme in availableThemes" 
                :key="theme.id" 
                :label="theme.name" 
                :value="theme.id" 
              />
            </el-select>
          </div>

          <!-- 配图选项 -->
          <div class="form-group">
            <label>自动配图</label>
            <el-switch
              v-model="autoImage"
              active-text="开启"
              inactive-text="关闭"
            />
          </div>

          <!-- 生成按钮 -->
          <div class="action-buttons">
            <el-button
              type="primary"
              size="large"
              @click="generatePPT"
              :loading="isGenerating"
              :disabled="!canGenerate"
            >
              <el-icon><MagicStick /></el-icon>
              {{ isGenerating ? '生成中...' : '生成 PPT' }}
            </el-button>
            <el-button size="large" @click="resetForm">重置</el-button>
          </div>
        </el-card>
      </div>

      <!-- 右侧预览区域 -->
      <div class="preview-section">
        <el-card class="preview-card">
          <template #header>
            <div class="card-header">
              <el-icon><Monitor /></el-icon>
              <span>PPT 预览</span>
              <div class="header-actions" v-if="generatedPPT.length > 0">
                <el-button size="small" @click="exportPPT">
                  <el-icon><Download /></el-icon>
                  导出PPT
                </el-button>
              </div>
            </div>
          </template>

          <!-- 空状态 -->
          <div v-if="generatedPPT.length === 0" class="empty-state">
            <el-icon class="empty-icon"><Document /></el-icon>
            <p>请输入主题或大纲，点击生成PPT</p>
          </div>

          <!-- PPT预览 -->
          <div v-else class="ppt-preview">
            <div class="slide-navigation">
              <el-button-group>
                <el-button
                  size="small"
                  @click="prevSlide"
                  :disabled="currentSlide === 0"
                >
                  <el-icon><ArrowLeft /></el-icon>
                </el-button>
                <span class="slide-counter">{{ currentSlide + 1 }} / {{ generatedPPT.length }}</span>
                <el-button
                  size="small"
                  @click="nextSlide"
                  :disabled="currentSlide === generatedPPT.length - 1"
                >
                  <el-icon><ArrowRight /></el-icon>
                </el-button>
              </el-button-group>
            </div>

            <div class="slide-container">
              <PPTLayouts 
                v-if="generatedPPT[currentSlide]"
                :slide="generatedPPT[currentSlide]"
                :theme="currentTheme"
                :layout="getSlideLayout(generatedPPT[currentSlide], currentSlide)"
              />
            </div>

            <!-- 主题选择器 -->
            <div class="theme-selector">
              <h3>选择PPT主题</h3>
              <div class="theme-options">
                <div 
                  v-for="theme in availableThemes" 
                  :key="theme.id"
                  class="theme-option"
                  :class="{ active: selectedThemeId === theme.id }"
                  @click="selectedThemeId = theme.id"
                  :style="{
                    '--theme-primary': theme.colors.primary,
                    '--theme-secondary': theme.colors.secondary,
                    '--theme-accent': theme.colors.accent,
                    '--theme-background': theme.colors.background
                  }"
                >
                  <div class="theme-preview">
                    <div class="theme-header" :style="{ background: theme.colors.primary }"></div>
                    <div class="theme-content" :style="{ background: theme.colors.background }">
                      <div class="theme-text-line" :style="{ background: theme.colors.secondary }"></div>
                      <div class="theme-text-line" :style="{ background: theme.colors.text.light }"></div>
                      <div class="theme-accent-dot" :style="{ background: theme.colors.accent }"></div>
                    </div>
                  </div>
                  <div class="theme-info">
                    <h4>{{ theme.name }}</h4>
                    <p>{{ theme.description }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 幻灯片缩略图 -->
            <div class="slide-thumbnails">
              <div
                v-for="(slide, index) in generatedPPT"
                :key="index"
                class="thumbnail"
                :class="{ active: index === currentSlide }"
                @click="currentSlide = index"
              >
                <div class="thumbnail-preview">
                  <PPTLayouts 
                    :slide="slide"
                    :theme="currentTheme"
                    :layout="getSlideLayout(slide, index)"
                  />
                </div>
                <div class="thumbnail-info">
                  <span class="thumbnail-number">{{ index + 1 }}</span>
                  <span class="thumbnail-title">{{ slide.title }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>
    </div>


  </Layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Document,
  Monitor,
  MagicStick,
  Download,
  ArrowLeft,
  ArrowRight
} from '@element-plus/icons-vue'
import Layout from './Layout.vue'
import { aiService, type PPTSlide } from '../utils/aiService'
import { useRouter } from 'vue-router'
import PPTLayouts from '../components/ppt/PPTLayouts.vue'
import { getAllThemes, getTheme, type PPTTheme } from '../utils/pptThemes'
import { optimizePPTSlides, calculateReadingTime } from '../utils/pptLayoutOptimizer'

// 路由
const router = useRouter()

// 响应式数据
const pptTheme = ref('')
const generateMode = ref('theme')
const pptOutline = ref('')
const expectedPages = ref(10)
const selectedThemeId = ref('business')
const autoImage = ref(true)
const isGenerating = ref(false)
const generatedPPT = ref([])
const currentSlide = ref(0)
const availableThemes = ref<PPTTheme[]>(getAllThemes())
const currentTheme = computed(() => getTheme(selectedThemeId.value))

// 计算属性
const canGenerate = computed(() => {
  if (generateMode.value === 'theme') {
    return pptTheme.value.trim().length > 0
  } else {
    return pptOutline.value.trim().length > 0
  }
})

// 方法
const checkApiKey = () => {
  if (!aiService.isConfigured()) {
    ElMessage.warning('请先在系统设置中配置AI服务')
    router.push('/settings')
    return false
  }
  return true
}

const generatePPT = async () => {
  if (!canGenerate.value) {
    ElMessage.warning('请输入PPT主题或大纲')
    return
  }

  if (!checkApiKey()) {
    return
  }

  isGenerating.value = true
  
  try {
    let slides: PPTSlide[] = []
    
    if (generateMode.value === 'theme') {
      // 基于主题生成
      ElMessage.info('正在生成PPT大纲...')
      const outline = await aiService.generatePPTOutline(pptTheme.value, expectedPages.value)
      
      ElMessage.info('正在生成PPT内容...')
      slides = await aiService.generatePPTContent(outline, selectedThemeId.value)
    } else {
      // 基于用户提供的大纲生成
      ElMessage.info('正在生成PPT内容...')
      slides = await aiService.generatePPTContent(pptOutline.value, selectedThemeId.value)
    }
    
    // 为每个幻灯片添加图片和增强内容（如果启用自动配图）
    if (autoImage.value) {
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i]
        try {
          const imagePrompt = await aiService.generateImagePrompt(slide.title, slide.content)
          // 使用占位图片，实际项目中可以集成图片生成API
          slide.image = generatePlaceholderImage(imagePrompt.substring(0, 20))
        } catch (error) {
          console.warn('图片描述生成失败:', error)
          slide.image = generatePlaceholderImage(`slide-${i}`)
        }
        
        // 添加图表数据支持
        if (slide.chartData && Array.isArray(slide.chartData)) {
          slide.chartType = slide.chartType || 'bar'
          slide.chartTitle = slide.chartTitle || slide.title
          slide.showLegend = slide.showLegend !== false
        }
        
        // 添加图标支持
        if (!slide.icon) {
          // 根据内容类型自动选择图标
          if (slide.type === 'title') slide.icon = 'lightbulb'
          else if (slide.type === 'chart') slide.icon = 'chart-bar'
          else if (slide.type === 'summary') slide.icon = 'check'
          else slide.icon = 'arrow-right'
        }
        
        // 添加作者和日期信息（仅标题页）
        if (slide.type === 'title') {
          slide.author = slide.author || '智能助教系统'
          slide.date = slide.date || new Date().toLocaleDateString('zh-CN')
        }
      }
    }
    
    // 使用布局优化器优化幻灯片
    const optimizedSlides = optimizePPTSlides(slides, currentTheme.value)
    
    generatedPPT.value = optimizedSlides.slice(0, expectedPages.value)
    currentSlide.value = 0
    
    ElMessage.success(`PPT生成成功！共生成${generatedPPT.value.length}页`)
  } catch (error) {
    console.error('PPT生成失败:', error)
    const errorMessage = error instanceof Error ? error.message : 'PPT生成失败，请重试'
    ElMessage.error(errorMessage)
    
    // 如果是API密钥相关错误，提示重新配置
    if (errorMessage.includes('API密钥') || errorMessage.includes('401') || errorMessage.includes('403')) {
      ElMessage.error('API配置有误，请检查系统设置')
      router.push('/settings')
    }
  } finally {
    isGenerating.value = false
  }
}

const generatePlaceholderImage = (type: string) => {
  const canvas = document.createElement('canvas')
  canvas.width = 400
  canvas.height = 300
  const ctx = canvas.getContext('2d')
  
  if (ctx) {
    const theme = currentTheme.value
    
    // 渐变背景
    const gradient = ctx.createLinearGradient(0, 0, 400, 300)
    gradient.addColorStop(0, theme.colors.surface)
    gradient.addColorStop(1, theme.colors.background)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 400, 300)
    
    // 边框
    ctx.strokeStyle = theme.colors.primary
    ctx.lineWidth = 2
    ctx.strokeRect(1, 1, 398, 298)
    
    // 文字
    ctx.fillStyle = theme.colors.text.secondary
    ctx.font = `16px ${theme.typography.bodyFont.split(',')[0]}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(type, 200, 150)
  }
  
  return canvas.toDataURL()
}

const resetForm = () => {
  pptTheme.value = ''
  pptOutline.value = ''
  expectedPages.value = 10
  selectedThemeId.value = 'business'
  autoImage.value = true
  generatedPPT.value = []
  currentSlide.value = 0
}

const prevSlide = () => {
  if (currentSlide.value > 0) {
    currentSlide.value--
  }
}

const nextSlide = () => {
  if (currentSlide.value < generatedPPT.value.length - 1) {
    currentSlide.value++
  }
}

const exportPPT = async () => {
  try {
    await ElMessageBox.confirm(
      '是否导出当前PPT？导出功能需要连接到PPT生成服务。',
      '导出确认',
      {
        confirmButtonText: '确定导出',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    
    // 这里可以集成实际的PPT导出功能
    ElMessage.success('PPT导出功能开发中，敬请期待！')
  } catch {
    // 用户取消
  }
}

// 获取幻灯片布局类型
const getSlideLayout = (slide: PPTSlide, index: number): string => {
  if (index === 0) return 'title'
  if (index === generatedPPT.value.length - 1) return 'summary'
  if (slide.type === 'chart' || slide.chartType) return 'chart'
  if (slide.type === 'image' || slide.image) return 'image-focus'
  if (slide.leftContent && slide.rightContent) return 'two-column'
  return 'content'
}

onMounted(() => {
  // 组件挂载时的初始化逻辑
})
</script>

<style scoped>
.ai-ppt-assistant {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h2 {
  color: #2c3e50;
  margin-bottom: 10px;
  font-size: 28px;
  font-weight: 600;
}

.subtitle {
  color: #7f8c8d;
  font-size: 16px;
  margin: 0;
}

.content-wrapper {
  display: flex;
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.input-section {
  flex: 0 0 400px;
}

.preview-section {
  flex: 1;
}

.input-card,
.preview-card {
  height: fit-content;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.header-actions {
  margin-left: auto;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #2c3e50;
}

.action-buttons {
  display: flex;
  gap: 10px;
  margin-top: 30px;
}

.action-buttons .el-button {
  flex: 1;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
  color: #dcdfe6;
}

.ppt-preview {
  min-height: 600px;
}

.slide-navigation {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
  gap: 15px;
}

.slide-counter {
  font-weight: 500;
  color: #606266;
}

.slide-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  overflow: hidden;
}

.slide {
  padding: 40px;
  min-height: 400px;
}

.slide-title {
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 30px;
  text-align: center;
  border-bottom: 2px solid #3498db;
  padding-bottom: 15px;
}

.slide-content {
  display: flex;
  gap: 30px;
  align-items: flex-start;
}

.slide-text {
  flex: 1;
}

.slide-text ul {
  list-style: none;
  padding: 0;
}

.slide-text li {
  padding: 10px 0;
  font-size: 16px;
  line-height: 1.6;
  color: #34495e;
  position: relative;
  padding-left: 20px;
}

.slide-text li::before {
  content: '•';
  color: #3498db;
  font-weight: bold;
  position: absolute;
  left: 0;
}

.slide-image {
  flex: 0 0 300px;
}

.slide-image img {
  width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* 主题选择器样式 */
.theme-selector {
  margin-bottom: 30px;
}

.theme-selector h3 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 18px;
  font-weight: 600;
}

.theme-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.theme-option {
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.theme-option:hover {
  border-color: var(--theme-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.theme-option.active {
  border-color: var(--theme-primary);
  background: linear-gradient(135deg, var(--theme-background), #f8f9ff);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.theme-preview {
  width: 100%;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.theme-header {
  height: 18px;
  width: 100%;
}

.theme-content {
  height: 42px;
  padding: 6px 10px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
}

.theme-text-line {
  height: 2px;
  border-radius: 1px;
}

.theme-text-line:first-child {
  width: 70%;
}

.theme-text-line:last-child {
  width: 50%;
}

.theme-accent-dot {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.theme-info h4 {
  margin: 0 0 6px 0;
  color: #2c3e50;
  font-size: 14px;
  font-weight: 600;
}

.theme-info p {
  margin: 0;
  color: #6c757d;
  font-size: 12px;
  line-height: 1.4;
}

.slide-thumbnails {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 10px 0;
}

.thumbnail {
  flex: 0 0 120px;
  background: white;
  border: 2px solid #e1e8ed;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
}

.thumbnail:hover {
  border-color: #3498db;
  transform: translateY(-2px);
}

.thumbnail.active {
  border-color: #3498db;
  background: #ecf5ff;
}

.thumbnail-preview {
  height: 60px;
  overflow: hidden;
  position: relative;
}

.thumbnail-preview :deep(.ppt-slide) {
  transform: scale(0.25);
  transform-origin: top left;
  width: 400%;
  height: 400%;
}

.thumbnail-info {
  padding: 6px 8px;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  gap: 6px;
}

.thumbnail-number {
  background: #3498db;
  color: white;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  flex-shrink: 0;
}

.thumbnail-title {
  font-size: 11px;
  color: #2c3e50;
  font-weight: 500;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 1200px) {
  .content-wrapper {
    flex-direction: column;
  }
  
  .input-section {
    flex: none;
  }
  
  .slide-content {
    flex-direction: column;
  }
  
  .slide-image {
    flex: none;
    align-self: center;
  }
  
  .theme-options {
    grid-template-columns: 1fr;
  }
}
</style>