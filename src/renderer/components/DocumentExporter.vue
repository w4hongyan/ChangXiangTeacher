<template>
  <div class="document-exporter">
    <!-- 导出配置面板 -->
    <el-card class="export-config">
      <template #header>
        <div class="config-header">
          <h3>导出配置</h3>
          <el-button @click="resetConfig">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </div>
      </template>
      
      <el-form :model="exportConfig" label-width="100px">
        <!-- 输出格式 -->
        <el-form-item label="输出格式">
          <el-radio-group v-model="exportConfig.format">
            <el-radio label="pdf">
              <el-icon><Document /></el-icon>
              PDF
            </el-radio>
            <el-radio label="docx">
              <el-icon><DocumentCopy /></el-icon>
              Word
            </el-radio>
            <el-radio label="xlsx">
              <el-icon><Grid /></el-icon>
              Excel
            </el-radio>
            <el-radio label="html">
              <el-icon><Monitor /></el-icon>
              HTML
            </el-radio>
          </el-radio-group>
        </el-form-item>
        
        <!-- 页面设置 -->
        <el-form-item label="页面大小">
          <el-select v-model="exportConfig.pageSize">
            <el-option label="A4" value="A4" />
            <el-option label="A3" value="A3" />
            <el-option label="A5" value="A5" />
            <el-option label="Letter" value="Letter" />
            <el-option label="Legal" value="Legal" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="页面方向">
          <el-radio-group v-model="exportConfig.orientation">
            <el-radio label="portrait">纵向</el-radio>
            <el-radio label="landscape">横向</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <!-- 自定义页面尺寸 -->
        <div v-if="exportConfig.pageSize === 'custom'">
          <el-form-item label="页面宽度">
            <el-input-number 
              v-model="exportConfig.customWidth" 
              :min="100" 
              :max="1000"
              controls-position="right"
            />
            <span class="unit">mm</span>
          </el-form-item>
          <el-form-item label="页面高度">
            <el-input-number 
              v-model="exportConfig.customHeight" 
              :min="100" 
              :max="1000"
              controls-position="right"
            />
            <span class="unit">mm</span>
          </el-form-item>
        </div>
        
        <!-- 边距设置 -->
        <el-form-item label="页边距">
          <div class="margin-inputs">
            <div class="margin-item">
              <label>上</label>
              <el-input-number 
                v-model="exportConfig.margins.top" 
                :min="0" 
                :max="50"
                size="small"
                controls-position="right"
              />
            </div>
            <div class="margin-item">
              <label>右</label>
              <el-input-number 
                v-model="exportConfig.margins.right" 
                :min="0" 
                :max="50"
                size="small"
                controls-position="right"
              />
            </div>
            <div class="margin-item">
              <label>下</label>
              <el-input-number 
                v-model="exportConfig.margins.bottom" 
                :min="0" 
                :max="50"
                size="small"
                controls-position="right"
              />
            </div>
            <div class="margin-item">
              <label>左</label>
              <el-input-number 
                v-model="exportConfig.margins.left" 
                :min="0" 
                :max="50"
                size="small"
                controls-position="right"
              />
            </div>
          </div>
          <div class="margin-presets">
            <el-button size="small" @click="setMarginPreset('narrow')">窄边距</el-button>
            <el-button size="small" @click="setMarginPreset('normal')">标准</el-button>
            <el-button size="small" @click="setMarginPreset('wide')">宽边距</el-button>
          </div>
        </el-form-item>
        
        <!-- 高级选项 -->
        <el-form-item label="高级选项">
          <div class="advanced-options">
            <el-checkbox v-model="exportConfig.includeHeader">包含页眉</el-checkbox>
            <el-checkbox v-model="exportConfig.includeFooter">包含页脚</el-checkbox>
            <el-checkbox v-model="exportConfig.includePageNumbers">显示页码</el-checkbox>
            <el-checkbox v-model="exportConfig.includeWatermark">添加水印</el-checkbox>
          </div>
        </el-form-item>
        
        <!-- 页眉页脚设置 -->
        <div v-if="exportConfig.includeHeader || exportConfig.includeFooter">
          <el-form-item v-if="exportConfig.includeHeader" label="页眉内容">
            <el-input 
              v-model="exportConfig.headerText" 
              placeholder="输入页眉文字"
              clearable
            />
          </el-form-item>
          <el-form-item v-if="exportConfig.includeFooter" label="页脚内容">
            <el-input 
              v-model="exportConfig.footerText" 
              placeholder="输入页脚文字"
              clearable
            />
          </el-form-item>
        </div>
        
        <!-- 水印设置 -->
        <div v-if="exportConfig.includeWatermark">
          <el-form-item label="水印文字">
            <el-input 
              v-model="exportConfig.watermarkText" 
              placeholder="输入水印文字"
              clearable
            />
          </el-form-item>
          <el-form-item label="水印透明度">
            <el-slider 
              v-model="exportConfig.watermarkOpacity" 
              :min="10" 
              :max="100"
              show-input
            />
          </el-form-item>
        </div>
        
        <!-- 文件名设置 -->
        <el-form-item label="文件名">
          <el-input 
            v-model="exportConfig.filename" 
            placeholder="输入文件名（不含扩展名）"
            clearable
          >
            <template #append>
              .{{ exportConfig.format }}
            </template>
          </el-input>
        </el-form-item>
        
        <!-- 保存路径 -->
        <el-form-item label="保存路径">
          <el-input 
            v-model="exportConfig.savePath" 
            placeholder="选择保存路径"
            readonly
          >
            <template #append>
              <el-button @click="selectSavePath">
                <el-icon><Folder /></el-icon>
                浏览
              </el-button>
            </template>
          </el-input>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 预览区域 -->
    <el-card class="preview-area">
      <template #header>
        <div class="preview-header">
          <h3>预览</h3>
          <div class="preview-controls">
            <el-button-group>
              <el-button 
                :type="previewMode === 'desktop' ? 'primary' : ''"
                @click="previewMode = 'desktop'"
              >
                <el-icon><Monitor /></el-icon>
                桌面
              </el-button>
              <el-button 
                :type="previewMode === 'print' ? 'primary' : ''"
                @click="previewMode = 'print'"
              >
                <el-icon><Printer /></el-icon>
                打印
              </el-button>
            </el-button-group>
            
            <div class="zoom-controls">
              <el-button @click="zoomOut">
                <el-icon><ZoomOut /></el-icon>
              </el-button>
              <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
              <el-button @click="zoomIn">
                <el-icon><ZoomIn /></el-icon>
              </el-button>
              <el-button @click="resetZoom">
                <el-icon><Refresh /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </template>
      
      <div class="preview-container" :class="{ 'print-mode': previewMode === 'print' }">
        <div 
          class="preview-page"
          :style="previewPageStyle"
          ref="previewRef"
        >
          <div class="page-header" v-if="exportConfig.includeHeader">
            {{ exportConfig.headerText || '页眉内容' }}
          </div>
          
          <div class="page-content">
            <div 
              class="watermark" 
              v-if="exportConfig.includeWatermark"
              :style="watermarkStyle"
            >
              {{ exportConfig.watermarkText || '水印' }}
            </div>
            
            <div class="document-content" v-html="documentContent"></div>
          </div>
          
          <div class="page-footer" v-if="exportConfig.includeFooter || exportConfig.includePageNumbers">
            <span v-if="exportConfig.includeFooter">{{ exportConfig.footerText || '页脚内容' }}</span>
            <span v-if="exportConfig.includePageNumbers" class="page-number">第 1 页</span>
          </div>
        </div>
      </div>
    </el-card>
    
    <!-- 操作按钮 -->
    <div class="export-actions">
      <el-button @click="previewDocument">
        <el-icon><View /></el-icon>
        预览
      </el-button>
      <el-button @click="printDocument">
        <el-icon><Printer /></el-icon>
        打印
      </el-button>
      <el-button type="primary" @click="exportDocument" :loading="exporting">
        <el-icon><Download /></el-icon>
        {{ exporting ? '导出中...' : '导出文档' }}
      </el-button>
    </div>
    
    <!-- 导出进度对话框 -->
    <el-dialog 
      v-model="showProgress" 
      title="导出进度" 
      width="400px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="export-progress">
        <el-progress 
          :percentage="exportProgress" 
          :status="exportStatus"
          :stroke-width="8"
        />
        <p class="progress-text">{{ progressText }}</p>
        
        <div class="progress-details" v-if="exportSteps.length > 0">
          <div 
            v-for="(step, index) in exportSteps" 
            :key="index"
            class="progress-step"
            :class="{ 
              'completed': step.status === 'completed',
              'active': step.status === 'active',
              'error': step.status === 'error'
            }"
          >
            <el-icon v-if="step.status === 'completed'"><Check /></el-icon>
            <el-icon v-else-if="step.status === 'error'"><Close /></el-icon>
            <el-icon v-else-if="step.status === 'active'" class="loading"><Loading /></el-icon>
            <el-icon v-else><Clock /></el-icon>
            <span>{{ step.name }}</span>
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button v-if="exportStatus === 'success'" type="primary" @click="openExportedFile">
          打开文件
        </el-button>
        <el-button v-if="exportStatus === 'success'" @click="showProgress = false">
          关闭
        </el-button>
        <el-button v-if="exportStatus === 'exception'" @click="retryExport">
          重试
        </el-button>
        <el-button v-if="exportStatus === 'exception'" @click="showProgress = false">
          取消
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Document, DocumentCopy, Grid, Monitor, Printer, Folder, View, Download,
  Refresh, ZoomIn, ZoomOut, Check, Close, Loading, Clock
} from '@element-plus/icons-vue'

// Props
interface Props {
  template?: any
  documentContent?: string
  variables?: Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  documentContent: '<div>文档内容预览...</div>',
  variables: () => ({})
})

// Emits
const emit = defineEmits(['export-complete', 'export-error'])

// 响应式数据
const exportConfig = reactive({
  format: 'pdf',
  pageSize: 'A4',
  orientation: 'portrait',
  customWidth: 210,
  customHeight: 297,
  margins: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20
  },
  includeHeader: false,
  includeFooter: false,
  includePageNumbers: true,
  includeWatermark: false,
  headerText: '',
  footerText: '',
  watermarkText: '',
  watermarkOpacity: 30,
  filename: '',
  savePath: ''
})

const previewMode = ref('desktop')
const zoomLevel = ref(1)
const exporting = ref(false)
const showProgress = ref(false)
const exportProgress = ref(0)
const exportStatus = ref('')
const progressText = ref('')
const exportedFilePath = ref('')
const previewRef = ref()

const exportSteps = ref([
  { name: '准备数据', status: 'pending' },
  { name: '渲染模板', status: 'pending' },
  { name: '生成文档', status: 'pending' },
  { name: '保存文件', status: 'pending' }
])

// 计算属性
const previewPageStyle = computed(() => {
  const baseWidth = exportConfig.pageSize === 'A4' ? 210 : 
                   exportConfig.pageSize === 'A3' ? 297 :
                   exportConfig.pageSize === 'custom' ? exportConfig.customWidth : 210
  
  const baseHeight = exportConfig.pageSize === 'A4' ? 297 :
                    exportConfig.pageSize === 'A3' ? 420 :
                    exportConfig.pageSize === 'custom' ? exportConfig.customHeight : 297
  
  const width = exportConfig.orientation === 'landscape' ? baseHeight : baseWidth
  const height = exportConfig.orientation === 'landscape' ? baseWidth : baseHeight
  
  return {
    width: `${width * zoomLevel.value * 2}px`,
    height: `${height * zoomLevel.value * 2}px`,
    padding: `${exportConfig.margins.top * zoomLevel.value * 2}px ${exportConfig.margins.right * zoomLevel.value * 2}px ${exportConfig.margins.bottom * zoomLevel.value * 2}px ${exportConfig.margins.left * zoomLevel.value * 2}px`,
    transform: `scale(${zoomLevel.value})`,
    transformOrigin: 'top left'
  }
})

const watermarkStyle = computed(() => ({
  opacity: exportConfig.watermarkOpacity / 100,
  fontSize: `${24 * zoomLevel.value}px`
}))

const documentContent = computed(() => {
  // 处理模板变量替换
  let content = props.documentContent
  
  // 替换变量
  Object.entries(props.variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g')
    content = content.replace(regex, String(value))
  })
  
  return content
})

// 方法
const resetConfig = () => {
  Object.assign(exportConfig, {
    format: 'pdf',
    pageSize: 'A4',
    orientation: 'portrait',
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    includeHeader: false,
    includeFooter: false,
    includePageNumbers: true,
    includeWatermark: false,
    headerText: '',
    footerText: '',
    watermarkText: '',
    watermarkOpacity: 30,
    filename: '',
    savePath: ''
  })
}

const setMarginPreset = (preset: string) => {
  switch (preset) {
    case 'narrow':
      Object.assign(exportConfig.margins, { top: 10, right: 10, bottom: 10, left: 10 })
      break
    case 'normal':
      Object.assign(exportConfig.margins, { top: 20, right: 20, bottom: 20, left: 20 })
      break
    case 'wide':
      Object.assign(exportConfig.margins, { top: 30, right: 30, bottom: 30, left: 30 })
      break
  }
}

const selectSavePath = async () => {
  try {
    // 调用系统文件选择对话框
    const result = await window.electronAPI?.showSaveDialog({
      defaultPath: exportConfig.filename || 'document',
      filters: [
        { name: 'PDF Files', extensions: ['pdf'] },
        { name: 'Word Documents', extensions: ['docx'] },
        { name: 'Excel Files', extensions: ['xlsx'] },
        { name: 'HTML Files', extensions: ['html'] }
      ]
    })
    
    if (result && !result.canceled) {
      exportConfig.savePath = result.filePath
    }
  } catch (error) {
    ElMessage.error('选择保存路径失败')
  }
}

const zoomIn = () => {
  if (zoomLevel.value < 2) {
    zoomLevel.value = Math.min(2, zoomLevel.value + 0.1)
  }
}

const zoomOut = () => {
  if (zoomLevel.value > 0.3) {
    zoomLevel.value = Math.max(0.3, zoomLevel.value - 0.1)
  }
}

const resetZoom = () => {
  zoomLevel.value = 1
}

const previewDocument = () => {
  // 打开预览窗口
  const previewWindow = window.open('', '_blank', 'width=800,height=600')
  if (previewWindow) {
    previewWindow.document.write(`
      <html>
        <head>
          <title>文档预览</title>
          <style>
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
            .preview-content { max-width: 800px; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="preview-content">
            ${documentContent.value}
          </div>
        </body>
      </html>
    `)
    previewWindow.document.close()
  }
}

const printDocument = () => {
  // 创建打印窗口
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>打印文档</title>
          <style>
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
            body { 
              font-family: Arial, sans-serif;
              margin: ${exportConfig.margins.top}mm ${exportConfig.margins.right}mm ${exportConfig.margins.bottom}mm ${exportConfig.margins.left}mm;
            }
          </style>
        </head>
        <body>
          ${exportConfig.includeHeader ? `<div class="header">${exportConfig.headerText}</div>` : ''}
          <div class="content">
            ${documentContent.value}
          </div>
          ${exportConfig.includeFooter ? `<div class="footer">${exportConfig.footerText}</div>` : ''}
        </body>
      </html>
    `)
    printWindow.document.close()
    
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
  }
}

const exportDocument = async () => {
  if (!exportConfig.filename) {
    ElMessage.warning('请输入文件名')
    return
  }
  
  if (!exportConfig.savePath) {
    ElMessage.warning('请选择保存路径')
    return
  }
  
  exporting.value = true
  showProgress.value = true
  exportProgress.value = 0
  exportStatus.value = ''
  progressText.value = '开始导出...'
  
  // 重置步骤状态
  exportSteps.value.forEach(step => step.status = 'pending')
  
  try {
    // 步骤1：准备数据
    exportSteps.value[0].status = 'active'
    progressText.value = '准备导出数据...'
    await delay(500)
    exportProgress.value = 25
    exportSteps.value[0].status = 'completed'
    
    // 步骤2：渲染模板
    exportSteps.value[1].status = 'active'
    progressText.value = '渲染模板内容...'
    await delay(800)
    exportProgress.value = 50
    exportSteps.value[1].status = 'completed'
    
    // 步骤3：生成文档
    exportSteps.value[2].status = 'active'
    progressText.value = `生成${exportConfig.format.toUpperCase()}文档...`
    await delay(1200)
    exportProgress.value = 75
    exportSteps.value[2].status = 'completed'
    
    // 步骤4：保存文件
    exportSteps.value[3].status = 'active'
    progressText.value = '保存文件...'
    
    // 调用后端导出API
    const exportData = {
      content: documentContent.value,
      config: exportConfig,
      variables: props.variables
    }
    
    const result = await window.electronAPI?.exportDocument(exportData)
    
    if (result?.success) {
      exportedFilePath.value = result.filePath
      exportProgress.value = 100
      exportStatus.value = 'success'
      progressText.value = '导出完成！'
      exportSteps.value[3].status = 'completed'
      
      ElMessage.success('文档导出成功')
      emit('export-complete', result)
    } else {
      throw new Error(result?.error || '导出失败')
    }
  } catch (error) {
    exportStatus.value = 'exception'
    progressText.value = '导出失败：' + (error as Error).message
    exportSteps.value.find(step => step.status === 'active')!.status = 'error'
    
    ElMessage.error('文档导出失败')
    emit('export-error', error)
  } finally {
    exporting.value = false
  }
}

const openExportedFile = () => {
  if (exportedFilePath.value) {
    window.electronAPI?.openFile(exportedFilePath.value)
  }
  showProgress.value = false
}

const retryExport = () => {
  showProgress.value = false
  exportDocument()
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// 监听配置变化，自动生成文件名
watch(() => [exportConfig.format, props.template?.name], () => {
  if (props.template?.name && !exportConfig.filename) {
    exportConfig.filename = `${props.template.name}_${new Date().toISOString().slice(0, 10)}`
  }
}, { immediate: true })
</script>

<style scoped>
.document-exporter {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 20px;
  height: 100vh;
  padding: 20px;
}

.export-config {
  height: fit-content;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.config-header h3 {
  margin: 0;
}

.unit {
  margin-left: 8px;
  color: #909399;
  font-size: 12px;
}

.margin-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 10px;
}

.margin-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.margin-item label {
  width: 20px;
  font-size: 12px;
  color: #606266;
}

.margin-presets {
  display: flex;
  gap: 5px;
}

.advanced-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-area {
  display: flex;
  flex-direction: column;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-header h3 {
  margin: 0;
}

.preview-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 5px;
}

.zoom-level {
  min-width: 50px;
  text-align: center;
  font-size: 12px;
  color: #606266;
}

.preview-container {
  flex: 1;
  overflow: auto;
  background: #f5f7fa;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.preview-container.print-mode {
  background: white;
}

.preview-page {
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  position: relative;
  margin: 20px;
}

.page-header {
  text-align: center;
  padding: 10px 0;
  border-bottom: 1px solid #e4e7ed;
  font-size: 14px;
  color: #606266;
}

.page-content {
  position: relative;
  min-height: 200px;
}

.watermark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-45deg);
  font-size: 48px;
  color: #dcdfe6;
  pointer-events: none;
  z-index: 1;
  white-space: nowrap;
}

.document-content {
  position: relative;
  z-index: 2;
}

.page-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-top: 1px solid #e4e7ed;
  font-size: 12px;
  color: #909399;
}

.page-number {
  font-weight: 500;
}

.export-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  gap: 15px;
  padding: 20px 0;
  border-top: 1px solid #e4e7ed;
  background: white;
}

.export-progress {
  text-align: center;
}

.progress-text {
  margin: 15px 0;
  color: #606266;
}

.progress-details {
  margin-top: 20px;
  text-align: left;
}

.progress-step {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  color: #909399;
}

.progress-step.completed {
  color: #67c23a;
}

.progress-step.active {
  color: #409eff;
}

.progress-step.error {
  color: #f56c6c;
}

.progress-step .loading {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>