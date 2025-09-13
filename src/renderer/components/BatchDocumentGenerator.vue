<template>
  <el-dialog
    v-model="visible"
    title="批量文档生成"
    width="80%"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @close="handleClose"
  >
    <div class="batch-generator">
      <!-- 步骤指示器 -->
      <el-steps :active="currentStep" align-center class="steps">
        <el-step title="选择模板" />
        <el-step title="选择数据" />
        <el-step title="配置选项" />
        <el-step title="生成文档" />
      </el-steps>

      <!-- 步骤内容 -->
      <div class="step-content">
        <!-- 步骤1: 选择模板 -->
        <div v-if="currentStep === 0" class="step-panel">
          <h3>选择文档模板</h3>
          <div class="template-grid">
            <div 
              v-for="template in availableTemplates" 
              :key="template.id"
              class="template-card"
              :class="{ 'selected': selectedTemplate?.id === template.id }"
              @click="selectTemplate(template)"
            >
              <div class="template-icon">
                <el-icon><Document /></el-icon>
              </div>
              <div class="template-info">
                <h4>{{ template.name }}</h4>
                <p>{{ template.description }}</p>
                <div class="template-meta">
                  <el-tag size="small">{{ template.category }}</el-tag>
                  <span class="template-type">{{ template.file_type.toUpperCase() }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 步骤2: 选择数据 -->
        <div v-if="currentStep === 1" class="step-panel">
          <h3>选择生成数据</h3>
          <el-tabs v-model="dataSourceType" @tab-change="handleDataSourceChange">
            <el-tab-pane label="学生数据" name="students">
              <BatchDataSelector
                v-model:selected-items="selectedStudents"
                title="选择学生"
                :data="studentList"
                :show-class-filter="true"
                :show-status-filter="true"
                :class-list="classList"
                name-field="name"
                info-field="student_number"
                meta-field="class_name"
                @selection-change="handleStudentSelectionChange"
              />
            </el-tab-pane>
            <el-tab-pane label="班级数据" name="classes">
              <BatchDataSelector
                v-model:selected-items="selectedClasses"
                title="选择班级"
                :data="classList"
                name-field="name"
                info-field="grade"
                meta-field="student_count"
                @selection-change="handleClassSelectionChange"
              />
            </el-tab-pane>
            <el-tab-pane label="自定义数据" name="custom">
              <div class="custom-data-panel">
                <el-button type="primary" @click="showImportDialog = true">
                  <el-icon><Upload /></el-icon>
                  导入Excel数据
                </el-button>
                <div v-if="customData.length > 0" class="custom-data-preview">
                  <h4>已导入数据 ({{ customData.length }} 条)</h4>
                  <el-table :data="customData.slice(0, 5)" size="small">
                    <el-table-column 
                      v-for="(value, key) in customData[0]" 
                      :key="key"
                      :prop="key"
                      :label="key"
                      show-overflow-tooltip
                    />
                  </el-table>
                  <div v-if="customData.length > 5" class="more-data-hint">
                    还有 {{ customData.length - 5 }} 条数据...
                  </div>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>

        <!-- 步骤3: 配置选项 -->
        <div v-if="currentStep === 2" class="step-panel">
          <h3>生成配置</h3>
          <el-form :model="generateConfig" label-width="120px">
            <el-form-item label="输出格式">
              <el-select v-model="generateConfig.format">
                <el-option label="PDF" value="pdf" />
                <el-option label="Word文档" value="docx" />
                <el-option label="Excel表格" value="xlsx" />
                <el-option label="HTML网页" value="html" />
              </el-select>
            </el-form-item>
            <el-form-item label="文件命名">
              <el-input 
                v-model="generateConfig.filenameTemplate" 
                placeholder="例: {name}_{date}"
              >
                <template #append>
                  <el-button @click="showVariableHelp = true">变量说明</el-button>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item label="保存位置">
              <el-input v-model="generateConfig.outputPath" readonly>
                <template #append>
                  <el-button @click="selectOutputPath">选择文件夹</el-button>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item label="生成选项">
              <el-checkbox-group v-model="generateConfig.options">
                <el-checkbox label="autoOpen">生成后自动打开</el-checkbox>
                <el-checkbox label="createZip">打包为ZIP文件</el-checkbox>
                <el-checkbox label="addTimestamp">文件名添加时间戳</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </el-form>
        </div>

        <!-- 步骤4: 生成文档 -->
        <div v-if="currentStep === 3" class="step-panel">
          <h3>生成进度</h3>
          <div class="generation-progress">
            <div class="progress-summary">
              <el-statistic title="总数量" :value="totalCount" />
              <el-statistic title="已完成" :value="completedCount" />
              <el-statistic title="成功" :value="successCount" />
              <el-statistic title="失败" :value="failedCount" />
            </div>
            
            <el-progress 
              :percentage="progressPercentage" 
              :status="progressStatus"
              :stroke-width="8"
            />
            
            <div class="progress-details">
              <div class="current-task" v-if="currentTask">
                <el-icon class="rotating"><Loading /></el-icon>
                正在生成: {{ currentTask }}
              </div>
              
              <div class="task-list">
                <div 
                  v-for="(task, index) in generationTasks" 
                  :key="index"
                  class="task-item"
                  :class="task.status"
                >
                  <el-icon v-if="task.status === 'pending'"><Clock /></el-icon>
                  <el-icon v-else-if="task.status === 'processing'" class="rotating"><Loading /></el-icon>
                  <el-icon v-else-if="task.status === 'success'"><Check /></el-icon>
                  <el-icon v-else-if="task.status === 'failed'"><Close /></el-icon>
                  
                  <span class="task-name">{{ task.name }}</span>
                  <span class="task-result" v-if="task.result">{{ task.result }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 对话框底部 -->
    <template #footer>
      <div class="dialog-footer">
        <div class="footer-left">
          <el-button 
            v-if="currentStep > 0 && !isGenerating" 
            @click="prevStep"
          >
            上一步
          </el-button>
        </div>
        <div class="footer-right">
          <el-button @click="handleClose" :disabled="isGenerating">
            {{ isGenerating ? '生成中...' : '取消' }}
          </el-button>
          <el-button 
            v-if="currentStep < 3" 
            type="primary" 
            @click="nextStep"
            :disabled="!canProceed"
          >
            下一步
          </el-button>
          <el-button 
            v-else-if="currentStep === 3 && !isGenerating && !isCompleted" 
            type="primary" 
            @click="startGeneration"
          >
            开始生成
          </el-button>
          <el-button 
            v-else-if="isCompleted" 
            type="success" 
            @click="openOutputFolder"
          >
            打开文件夹
          </el-button>
        </div>
      </div>
    </template>

    <!-- 数据导入对话框 -->
    <el-dialog v-model="showImportDialog" title="导入Excel数据" width="600px">
      <div class="import-panel">
        <el-upload
          ref="uploadRef"
          :auto-upload="false"
          :show-file-list="false"
          accept=".xlsx,.xls"
          @change="handleFileChange"
        >
          <el-button type="primary">
            <el-icon><Upload /></el-icon>
            选择Excel文件
          </el-button>
        </el-upload>
        <div v-if="importPreview.length > 0" class="import-preview">
          <h4>数据预览</h4>
          <el-table :data="importPreview" size="small" max-height="300">
            <el-table-column 
              v-for="(value, key) in importPreview[0]" 
              :key="key"
              :prop="key"
              :label="key"
              show-overflow-tooltip
            />
          </el-table>
        </div>
      </div>
      <template #footer>
        <el-button @click="showImportDialog = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="confirmImport"
          :disabled="importPreview.length === 0"
        >
          确认导入
        </el-button>
      </template>
    </el-dialog>

    <!-- 变量说明对话框 -->
    <el-dialog v-model="showVariableHelp" title="文件命名变量说明" width="500px">
      <div class="variable-help">
        <h4>可用变量:</h4>
        <ul>
          <li><code>{name}</code> - 数据项名称</li>
          <li><code>{id}</code> - 数据项ID</li>
          <li><code>{date}</code> - 当前日期 (YYYY-MM-DD)</li>
          <li><code>{time}</code> - 当前时间 (HH-mm-ss)</li>
          <li><code>{template}</code> - 模板名称</li>
          <li><code>{index}</code> - 序号</li>
        </ul>
        <h4>示例:</h4>
        <ul>
          <li><code>{name}_{date}</code> → 张三_2024-01-15</li>
          <li><code>{template}_{name}_{index}</code> → 成绩单_张三_001</li>
        </ul>
      </div>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, Upload, Loading, Check, Close, Clock } from '@element-plus/icons-vue'
import BatchDataSelector from './BatchDataSelector.vue'
import { useTemplateStore } from '../stores/template'
import { useStudentStore } from '../stores/student'
import { useClassStore } from '../stores/class'
import * as XLSX from 'xlsx'

// Props
const props = defineProps<{
  modelValue: boolean
}>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'generation-complete': [results: any[]]
}>()

// Stores
const templateStore = useTemplateStore()
const studentStore = useStudentStore()
const classStore = useClassStore()

// 响应式数据
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const currentStep = ref(0)
const selectedTemplate = ref<any>(null)
const dataSourceType = ref('students')
const selectedStudents = ref<any[]>([])
const selectedClasses = ref<any[]>([])
const customData = ref<any[]>([])
const showImportDialog = ref(false)
const showVariableHelp = ref(false)
const importPreview = ref<any[]>([])
const uploadRef = ref()

// 生成配置
const generateConfig = ref({
  format: 'pdf',
  filenameTemplate: '{name}_{date}',
  outputPath: '',
  options: ['autoOpen']
})

// 生成进度
const isGenerating = ref(false)
const isCompleted = ref(false)
const currentTask = ref('')
const generationTasks = ref<any[]>([])
const totalCount = ref(0)
const completedCount = ref(0)
const successCount = ref(0)
const failedCount = ref(0)

// 计算属性
const availableTemplates = computed(() => templateStore.templates)
const studentList = computed(() => studentStore.students)
const classList = computed(() => classStore.classes)

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 0:
      return selectedTemplate.value !== null
    case 1:
      return getSelectedData().length > 0
    case 2:
      return generateConfig.value.outputPath !== ''
    default:
      return true
  }
})

const progressPercentage = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((completedCount.value / totalCount.value) * 100)
})

const progressStatus = computed(() => {
  if (isGenerating.value) return 'active'
  if (isCompleted.value) {
    return failedCount.value > 0 ? 'warning' : 'success'
  }
  return 'normal'
})

// 方法
const selectTemplate = (template: any) => {
  selectedTemplate.value = template
}

const getSelectedData = () => {
  switch (dataSourceType.value) {
    case 'students':
      return selectedStudents.value
    case 'classes':
      return selectedClasses.value
    case 'custom':
      return customData.value
    default:
      return []
  }
}

const nextStep = () => {
  if (canProceed.value && currentStep.value < 3) {
    currentStep.value++
    if (currentStep.value === 3) {
      prepareGeneration()
    }
  }
}

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const handleDataSourceChange = () => {
  // 数据源切换时的处理
}

const handleStudentSelectionChange = (students: any[]) => {
  selectedStudents.value = students
}

const handleClassSelectionChange = (classes: any[]) => {
  selectedClasses.value = classes
}

const selectOutputPath = async () => {
  try {
    const result = await window.electronAPI.dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    
    if (!result.canceled && result.filePaths.length > 0) {
      generateConfig.value.outputPath = result.filePaths[0]
    }
  } catch (error) {
    console.error('选择输出路径失败:', error)
    ElMessage.error('选择输出路径失败')
  }
}

const handleFileChange = (file: any) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      
      importPreview.value = jsonData.slice(0, 10) // 只预览前10条
    } catch (error) {
      console.error('解析Excel文件失败:', error)
      ElMessage.error('解析Excel文件失败')
    }
  }
  reader.readAsArrayBuffer(file.raw)
}

const confirmImport = () => {
  const reader = new FileReader()
  const file = uploadRef.value?.uploadFiles[0]?.raw
  
  if (!file) {
    ElMessage.error('请选择文件')
    return
  }
  
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      
      customData.value = jsonData
      showImportDialog.value = false
      importPreview.value = []
      ElMessage.success(`成功导入 ${jsonData.length} 条数据`)
    } catch (error) {
      console.error('导入Excel数据失败:', error)
      ElMessage.error('导入Excel数据失败')
    }
  }
  reader.readAsArrayBuffer(file)
}

const prepareGeneration = () => {
  const data = getSelectedData()
  totalCount.value = data.length
  completedCount.value = 0
  successCount.value = 0
  failedCount.value = 0
  
  generationTasks.value = data.map((item, index) => ({
    id: index,
    name: item.name || `数据项 ${index + 1}`,
    data: item,
    status: 'pending',
    result: ''
  }))
}

const startGeneration = async () => {
  isGenerating.value = true
  isCompleted.value = false
  
  try {
    for (let i = 0; i < generationTasks.value.length; i++) {
      const task = generationTasks.value[i]
      task.status = 'processing'
      currentTask.value = task.name
      
      try {
        // 生成文档
        const filename = generateFilename(task.data, i)
        const outputPath = `${generateConfig.value.outputPath}/${filename}.${generateConfig.value.format}`
        
        const result = await templateStore.generateDocument({
          template_id: selectedTemplate.value.id,
          data: task.data,
          output_path: outputPath,
          format: generateConfig.value.format
        })
        
        if (result.success) {
          task.status = 'success'
          task.result = '生成成功'
          successCount.value++
        } else {
          task.status = 'failed'
          task.result = result.error || '生成失败'
          failedCount.value++
        }
      } catch (error) {
        task.status = 'failed'
        task.result = '生成异常'
        failedCount.value++
        console.error('生成文档失败:', error)
      }
      
      completedCount.value++
      
      // 添加延迟避免过快处理
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    isCompleted.value = true
    currentTask.value = ''
    
    if (generateConfig.value.options.includes('autoOpen') && successCount.value > 0) {
      openOutputFolder()
    }
    
    ElMessage.success(`批量生成完成！成功 ${successCount.value} 个，失败 ${failedCount.value} 个`)
    
  } catch (error) {
    console.error('批量生成失败:', error)
    ElMessage.error('批量生成失败')
  } finally {
    isGenerating.value = false
  }
}

const generateFilename = (data: any, index: number) => {
  let filename = generateConfig.value.filenameTemplate
  
  const now = new Date()
  const replacements = {
    '{name}': data.name || `item_${index + 1}`,
    '{id}': data.id || index + 1,
    '{date}': now.toISOString().split('T')[0],
    '{time}': now.toTimeString().split(' ')[0].replace(/:/g, '-'),
    '{template}': selectedTemplate.value?.name || 'template',
    '{index}': String(index + 1).padStart(3, '0')
  }
  
  Object.entries(replacements).forEach(([key, value]) => {
    filename = filename.replace(new RegExp(key, 'g'), String(value))
  })
  
  return filename
}

const openOutputFolder = async () => {
  try {
    await window.electronAPI.shell.openPath(generateConfig.value.outputPath)
  } catch (error) {
    console.error('打开文件夹失败:', error)
    ElMessage.error('打开文件夹失败')
  }
}

const handleClose = () => {
  if (isGenerating.value) {
    ElMessageBox.confirm('正在生成文档，确定要关闭吗？', '提示', {
      type: 'warning'
    }).then(() => {
      resetDialog()
      visible.value = false
    }).catch(() => {})
  } else {
    resetDialog()
    visible.value = false
  }
}

const resetDialog = () => {
  currentStep.value = 0
  selectedTemplate.value = null
  selectedStudents.value = []
  selectedClasses.value = []
  customData.value = []
  isGenerating.value = false
  isCompleted.value = false
  generationTasks.value = []
  generateConfig.value = {
    format: 'pdf',
    filenameTemplate: '{name}_{date}',
    outputPath: '',
    options: ['autoOpen']
  }
}

// 生命周期
onMounted(async () => {
  await templateStore.loadTemplates()
  await studentStore.loadStudents()
  await classStore.loadClasses()
})
</script>

<style scoped>
.batch-generator {
  min-height: 500px;
}

.steps {
  margin-bottom: 30px;
}

.step-content {
  min-height: 400px;
}

.step-panel h3 {
  margin: 0 0 20px 0;
  color: var(--el-text-color-primary);
  font-size: 18px;
  font-weight: 600;
}

/* 模板选择 */
.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.template-card {
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.template-card:hover {
  border-color: var(--el-color-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.template-card.selected {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.template-icon {
  font-size: 32px;
  color: var(--el-color-primary);
  margin-bottom: 12px;
}

.template-info h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: var(--el-text-color-primary);
}

.template-info p {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: var(--el-text-color-regular);
  line-height: 1.4;
}

.template-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.template-type {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  padding: 2px 6px;
  border-radius: 4px;
}

/* 自定义数据 */
.custom-data-panel {
  text-align: center;
  padding: 40px 20px;
}

.custom-data-preview {
  margin-top: 20px;
  text-align: left;
}

.custom-data-preview h4 {
  margin: 0 0 12px 0;
  color: var(--el-text-color-primary);
}

.more-data-hint {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

/* 生成进度 */
.generation-progress {
  padding: 20px 0;
}

.progress-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.current-task {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 20px 0;
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.task-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 14px;
}

.task-item:last-child {
  border-bottom: none;
}

.task-item.pending {
  color: var(--el-text-color-regular);
}

.task-item.processing {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.task-item.success {
  color: var(--el-color-success);
}

.task-item.failed {
  color: var(--el-color-danger);
}

.task-name {
  flex: 1;
}

.task-result {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 对话框底部 */
.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.footer-left,
.footer-right {
  display: flex;
  gap: 8px;
}

/* 导入面板 */
.import-panel {
  text-align: center;
  padding: 20px 0;
}

.import-preview {
  margin-top: 20px;
  text-align: left;
}

.import-preview h4 {
  margin: 0 0 12px 0;
  color: var(--el-text-color-primary);
}

/* 变量帮助 */
.variable-help h4 {
  margin: 0 0 12px 0;
  color: var(--el-text-color-primary);
}

.variable-help ul {
  margin: 0 0 16px 0;
  padding-left: 20px;
}

.variable-help li {
  margin-bottom: 4px;
  line-height: 1.4;
}

.variable-help code {
  background: var(--el-fill-color-light);
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
}
</style>