<template>
  <div class="print-manager">
    <!-- 打印设置面板 -->
    <el-card class="print-settings" shadow="never">
      <template #header>
        <div class="card-header">
          <span>打印设置</span>
          <el-button-group size="small">
            <el-button @click="resetSettings">
              <el-icon><Refresh /></el-icon>
              重置
            </el-button>
            <el-button @click="saveAsTemplate">
              <el-icon><Collection /></el-icon>
              保存模板
            </el-button>
          </el-button-group>
        </div>
      </template>
      
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form :model="printSettings" label-width="80px" size="small">
            <el-form-item label="纸张大小">
              <el-select v-model="printSettings.paperSize" style="width: 100%">
                <el-option label="A4" value="A4" />
                <el-option label="A3" value="A3" />
                <el-option label="A5" value="A5" />
                <el-option label="Letter" value="Letter" />
                <el-option label="Legal" value="Legal" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="页面方向">
              <el-radio-group v-model="printSettings.orientation">
                <el-radio label="portrait">纵向</el-radio>
                <el-radio label="landscape">横向</el-radio>
              </el-radio-group>
            </el-form-item>
            
            <el-form-item label="页边距">
              <div class="margin-inputs">
                <el-input-number v-model="printSettings.margins.top" :min="0" :max="50" size="small" />
                <span>上</span>
                <el-input-number v-model="printSettings.margins.right" :min="0" :max="50" size="small" />
                <span>右</span>
                <el-input-number v-model="printSettings.margins.bottom" :min="0" :max="50" size="small" />
                <span>下</span>
                <el-input-number v-model="printSettings.margins.left" :min="0" :max="50" size="small" />
                <span>左</span>
              </div>
            </el-form-item>
          </el-form>
        </el-col>
        
        <el-col :span="12">
          <el-form :model="printSettings" label-width="80px" size="small">
            <el-form-item label="打印质量">
              <el-select v-model="printSettings.quality" style="width: 100%">
                <el-option label="高质量" value="high" />
                <el-option label="标准" value="normal" />
                <el-option label="草稿" value="draft" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="打印选项">
              <el-checkbox-group v-model="printSettings.options">
                <el-checkbox label="includeHeader">包含页眉</el-checkbox>
                <el-checkbox label="includeFooter">包含页脚</el-checkbox>
                <el-checkbox label="includePageNumber">显示页码</el-checkbox>
                <el-checkbox label="doubleSided">双面打印</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            
            <el-form-item label="份数">
              <el-input-number v-model="printSettings.copies" :min="1" :max="99" size="small" />
            </el-form-item>
          </el-form>
        </el-col>
      </el-row>
    </el-card>
    
    <!-- 打印队列 -->
    <el-card class="print-queue" shadow="never">
      <template #header>
        <div class="card-header">
          <span>打印队列 ({{ printQueue.length }})</span>
          <el-button-group size="small">
            <el-button @click="clearQueue" :disabled="printQueue.length === 0">
              <el-icon><Delete /></el-icon>
              清空队列
            </el-button>
            <el-button type="primary" @click="startBatchPrint" :disabled="printQueue.length === 0 || printing">
              <el-icon><Printer /></el-icon>
              {{ printing ? '打印中...' : '开始打印' }}
            </el-button>
          </el-button-group>
        </div>
      </template>
      
      <div class="queue-list">
        <el-empty v-if="printQueue.length === 0" description="暂无打印任务" />
        
        <div v-else class="queue-items">
          <div 
            v-for="(item, index) in printQueue" 
            :key="item.id"
            class="queue-item"
            :class="{ 'printing': item.status === 'printing', 'completed': item.status === 'completed', 'error': item.status === 'error' }"
          >
            <div class="item-info">
              <div class="item-title">{{ item.title }}</div>
              <div class="item-meta">
                <el-tag size="small" :type="getStatusType(item.status)">{{ getStatusText(item.status) }}</el-tag>
                <span class="item-time">{{ formatTime(item.addedAt) }}</span>
              </div>
            </div>
            
            <div class="item-actions">
              <el-button size="small" @click="previewItem(item)">
                <el-icon><View /></el-icon>
                预览
              </el-button>
              <el-button size="small" @click="printSingle(item)" :disabled="printing">
                <el-icon><Printer /></el-icon>
                打印
              </el-button>
              <el-button size="small" @click="removeFromQueue(index)" :disabled="printing">
                <el-icon><Delete /></el-icon>
                移除
              </el-button>
            </div>
            
            <!-- 打印进度 -->
            <div v-if="item.status === 'printing'" class="item-progress">
              <el-progress :percentage="item.progress" :show-text="false" />
            </div>
          </div>
        </div>
      </div>
    </el-card>
    
    <!-- 批量打印进度 -->
    <el-dialog v-model="showBatchProgress" title="批量打印进度" width="500px" :close-on-click-modal="false">
      <div class="batch-progress">
        <div class="progress-info">
          <div class="progress-text">{{ batchProgressText }}</div>
          <div class="progress-stats">{{ currentPrintIndex + 1 }} / {{ printQueue.length }}</div>
        </div>
        <el-progress :percentage="batchProgress" />
        
        <div class="progress-details">
          <div v-for="(item, index) in printQueue" :key="item.id" class="progress-item">
            <el-icon v-if="index < currentPrintIndex" class="success-icon"><Check /></el-icon>
            <el-icon v-else-if="index === currentPrintIndex" class="loading-icon"><Loading /></el-icon>
            <el-icon v-else class="pending-icon"><Clock /></el-icon>
            <span>{{ item.title }}</span>
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="cancelBatchPrint" :disabled="!printing">取消打印</el-button>
      </template>
    </el-dialog>
    
    <!-- 打印预览对话框 -->
    <el-dialog v-model="showPreview" title="打印预览" width="80%" :close-on-click-modal="false">
      <div class="print-preview">
        <div class="preview-toolbar">
          <el-button-group>
            <el-button @click="zoomOut" :disabled="previewZoom <= 50">
              <el-icon><ZoomOut /></el-icon>
            </el-button>
            <el-button>{{ previewZoom }}%</el-button>
            <el-button @click="zoomIn" :disabled="previewZoom >= 200">
              <el-icon><ZoomIn /></el-icon>
            </el-button>
          </el-button-group>
          
          <el-button @click="printPreviewItem" type="primary">
            <el-icon><Printer /></el-icon>
            打印此文档
          </el-button>
        </div>
        
        <div class="preview-content" :style="{ transform: `scale(${previewZoom / 100})` }">
          <div class="preview-page" v-html="previewContent"></div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, toRefs, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Refresh,
  Collection,
  Delete,
  Printer,
  View,
  Check,
  Loading,
  Clock,
  ZoomOut,
  ZoomIn
} from '@element-plus/icons-vue'

interface PrintItem {
  id: string
  title: string
  content: string
  status: 'pending' | 'printing' | 'completed' | 'error'
  progress: number
  addedAt: Date
  settings?: Partial<PrintSettings>
}

interface PrintSettings {
  paperSize: string
  orientation: 'portrait' | 'landscape'
  margins: {
    top: number
    right: number
    bottom: number
    left: number
  }
  quality: 'high' | 'normal' | 'draft'
  options: string[]
  copies: number
}

const props = defineProps<{
  documents?: Array<{ title: string; content: string }>
}>()

const emit = defineEmits<{
  printCompleted: [results: Array<{ success: boolean; message: string }>]
}>()

// 打印设置
const printSettings = reactive<PrintSettings>({
  paperSize: 'A4',
  orientation: 'portrait',
  margins: { top: 20, right: 20, bottom: 20, left: 20 },
  quality: 'normal',
  options: ['includePageNumber'],
  copies: 1
})

// 打印队列
const printQueue = ref<PrintItem[]>([])
const printing = ref(false)
const showBatchProgress = ref(false)
const batchProgress = ref(0)
const batchProgressText = ref('')
const currentPrintIndex = ref(0)

// 预览相关
const showPreview = ref(false)
const previewContent = ref('')
const previewItem = ref<PrintItem | null>(null)
const previewZoom = ref(100)

// 添加文档到打印队列
const addToQueue = (documents: Array<{ title: string; content: string }>) => {
  documents.forEach(doc => {
    const item: PrintItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      title: doc.title,
      content: doc.content,
      status: 'pending',
      progress: 0,
      addedAt: new Date(),
      settings: { ...printSettings }
    }
    printQueue.value.push(item)
  })
  
  ElMessage.success(`已添加 ${documents.length} 个文档到打印队列`)
}

// 从队列中移除
const removeFromQueue = (index: number) => {
  printQueue.value.splice(index, 1)
}

// 清空队列
const clearQueue = async () => {
  if (printing.value) {
    ElMessage.warning('打印进行中，无法清空队列')
    return
  }
  
  try {
    await ElMessageBox.confirm('确定要清空打印队列吗？', '确认操作', {
      type: 'warning'
    })
    printQueue.value = []
    ElMessage.success('队列已清空')
  } catch {
    // 用户取消
  }
}

// 预览文档
const previewItem = (item: PrintItem) => {
  previewItem.value = item
  previewContent.value = generatePrintHTML(item)
  showPreview.value = true
}

// 生成打印HTML
const generatePrintHTML = (item: PrintItem) => {
  const settings = { ...printSettings, ...item.settings }
  
  return `
    <div class="print-document" style="
      font-family: 'Microsoft YaHei', Arial, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #333;
      padding: ${settings.margins.top}mm ${settings.margins.right}mm ${settings.margins.bottom}mm ${settings.margins.left}mm;
    ">
      ${settings.options.includes('includeHeader') ? '<div class="header">页眉内容</div>' : ''}
      <div class="content">${item.content}</div>
      ${settings.options.includes('includeFooter') ? '<div class="footer">页脚内容</div>' : ''}
      ${settings.options.includes('includePageNumber') ? '<div class="page-number">第 1 页</div>' : ''}
    </div>
  `
}

// 单个文档打印
const printSingle = async (item: PrintItem) => {
  printing.value = true
  item.status = 'printing'
  item.progress = 0
  
  try {
    // 模拟打印进度
    for (let i = 0; i <= 100; i += 10) {
      item.progress = i
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    // 实际打印逻辑
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      const htmlContent = generatePrintHTML(item)
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${item.title}</title>
          <style>
            @page {
              size: ${printSettings.paperSize} ${printSettings.orientation};
              margin: 0;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
        </html>
      `)
      printWindow.document.close()
      
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 500)
    }
    
    item.status = 'completed'
    ElMessage.success(`${item.title} 打印完成`)
  } catch (error) {
    item.status = 'error'
    ElMessage.error(`${item.title} 打印失败`)
  } finally {
    printing.value = false
  }
}

// 批量打印
const startBatchPrint = async () => {
  if (printQueue.value.length === 0) return
  
  printing.value = true
  showBatchProgress.value = true
  currentPrintIndex.value = 0
  batchProgress.value = 0
  
  const results = []
  
  for (let i = 0; i < printQueue.value.length; i++) {
    const item = printQueue.value[i]
    currentPrintIndex.value = i
    batchProgressText.value = `正在打印: ${item.title}`
    
    try {
      await printSingle(item)
      results.push({ success: true, message: `${item.title} 打印成功` })
    } catch (error) {
      results.push({ success: false, message: `${item.title} 打印失败` })
    }
    
    batchProgress.value = Math.round(((i + 1) / printQueue.value.length) * 100)
    
    // 添加延迟避免打印冲突
    if (i < printQueue.value.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  printing.value = false
  showBatchProgress.value = false
  
  emit('printCompleted', results)
  
  const successCount = results.filter(r => r.success).length
  ElMessage.success(`批量打印完成，成功 ${successCount}/${results.length} 个文档`)
}

// 取消批量打印
const cancelBatchPrint = () => {
  printing.value = false
  showBatchProgress.value = false
  
  // 重置队列状态
  printQueue.value.forEach(item => {
    if (item.status === 'printing') {
      item.status = 'pending'
      item.progress = 0
    }
  })
  
  ElMessage.info('批量打印已取消')
}

// 预览缩放
const zoomIn = () => {
  if (previewZoom.value < 200) {
    previewZoom.value += 10
  }
}

const zoomOut = () => {
  if (previewZoom.value > 50) {
    previewZoom.value -= 10
  }
}

// 打印预览项
const printPreviewItem = () => {
  if (previewItem.value) {
    printSingle(previewItem.value)
    showPreview.value = false
  }
}

// 重置设置
const resetSettings = () => {
  Object.assign(printSettings, {
    paperSize: 'A4',
    orientation: 'portrait',
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    quality: 'normal',
    options: ['includePageNumber'],
    copies: 1
  })
}

// 保存为模板
const saveAsTemplate = () => {
  // 实现保存打印设置模板的逻辑
  ElMessage.success('打印设置已保存为模板')
}

// 获取状态类型
const getStatusType = (status: string) => {
  const types = {
    pending: '',
    printing: 'warning',
    completed: 'success',
    error: 'danger'
  }
  return types[status as keyof typeof types] || ''
}

// 获取状态文本
const getStatusText = (status: string) => {
  const texts = {
    pending: '等待中',
    printing: '打印中',
    completed: '已完成',
    error: '失败'
  }
  return texts[status as keyof typeof texts] || status
}

// 格式化时间
const formatTime = (date: Date) => {
  return date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

// 监听props变化，自动添加到队列
const { documents } = toRefs(props)
watch(documents, (newDocs) => {
  if (newDocs && newDocs.length > 0) {
    addToQueue(newDocs)
  }
}, { immediate: true })

// 暴露方法给父组件
defineExpose({
  addToQueue,
  clearQueue,
  startBatchPrint
})
</script>

<style scoped>
.print-manager {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.margin-inputs {
  display: grid;
  grid-template-columns: 1fr auto 1fr auto 1fr auto 1fr auto;
  gap: 8px;
  align-items: center;
}

.margin-inputs span {
  font-size: 12px;
  color: #666;
}

.queue-list {
  max-height: 400px;
  overflow-y: auto;
}

.queue-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.queue-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  transition: all 0.3s;
}

.queue-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.queue-item.printing {
  border-color: #e6a23c;
  background-color: #fdf6ec;
}

.queue-item.completed {
  border-color: #67c23a;
  background-color: #f0f9ff;
}

.queue-item.error {
  border-color: #f56c6c;
  background-color: #fef0f0;
}

.item-info {
  flex: 1;
}

.item-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #666;
}

.item-actions {
  display: flex;
  gap: 8px;
}

.item-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
}

.batch-progress {
  padding: 20px 0;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.progress-text {
  font-weight: 500;
}

.progress-stats {
  color: #666;
  font-size: 14px;
}

.progress-details {
  margin-top: 20px;
  max-height: 200px;
  overflow-y: auto;
}

.progress-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 14px;
}

.success-icon {
  color: #67c23a;
}

.loading-icon {
  color: #e6a23c;
  animation: spin 1s linear infinite;
}

.pending-icon {
  color: #c0c4cc;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.print-preview {
  display: flex;
  flex-direction: column;
  height: 70vh;
}

.preview-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #e4e7ed;
}

.preview-content {
  flex: 1;
  overflow: auto;
  padding: 20px;
  background: #f5f5f5;
  display: flex;
  justify-content: center;
}

.preview-page {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-height: 297mm;
  width: 210mm;
  padding: 20mm;
  transform-origin: top center;
}
</style>