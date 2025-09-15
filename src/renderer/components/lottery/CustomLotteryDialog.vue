<template>
  <el-dialog
    v-model="visible"
    title="自定义抽签"
    width="700px"
    :before-close="handleClose"
    class="custom-lottery-dialog"
  >
    <div class="dialog-content">
      <!-- 抽签模式选择 -->
      <div class="mode-selector">
        <el-radio-group v-model="lotteryMode" @change="onModeChange">
          <el-radio-button label="text">文本抽签</el-radio-button>
          <el-radio-button label="number">数字抽签</el-radio-button>
          <el-radio-button label="student">学生抽签</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 文本抽签 -->
      <div v-if="lotteryMode === 'text'" class="text-lottery">
        <div class="input-section">
          <el-input
            v-model="textInput"
            type="textarea"
            :rows="6"
            placeholder="请输入抽签选项，每行一个选项&#10;例如：&#10;选项1&#10;选项2&#10;选项3"
            @input="parseTextOptions"
          />
          <div class="quick-templates">
            <span class="template-label">快速模板：</span>
            <el-button size="small" @click="loadTemplate('yesno')">是/否</el-button>
            <el-button size="small" @click="loadTemplate('abcd')">A/B/C/D</el-button>
            <el-button size="small" @click="loadTemplate('numbers')">1234</el-button>
            <el-button size="small" @click="loadTemplate('weekdays')">星期</el-button>
            <el-button size="small" @click="loadTemplate('colors')">颜色</el-button>
            <el-button size="small" @click="loadTemplate('cities')">城市</el-button>
          </div>
        </div>
        <div class="text-config">
          <el-form :model="textConfig" label-width="80px">
            <el-form-item label="抽取数量">
              <el-input-number v-model="textConfig.count" :min="1" :max="textOptions.length" />
            </el-form-item>
            <el-form-item label="允许重复">
              <el-switch v-model="textConfig.allowDuplicate" />
            </el-form-item>
          </el-form>
        </div>
      </div>

      <!-- 数字抽签 -->
      <div v-if="lotteryMode === 'number'" class="number-lottery">
        <div class="number-range">
          <el-form :model="numberConfig" label-width="80px">
            <el-form-item label="起始数字">
              <el-input-number v-model="numberConfig.min" :min="0" :max="numberConfig.max - 1" />
            </el-form-item>
            <el-form-item label="结束数字">
              <el-input-number v-model="numberConfig.max" :min="numberConfig.min + 1" :max="1000" />
            </el-form-item>
            <el-form-item label="抽取数量">
              <el-input-number v-model="numberConfig.count" :min="1" :max="numberConfig.max - numberConfig.min + 1" />
            </el-form-item>
            <el-form-item label="允许重复">
              <el-switch v-model="numberConfig.allowDuplicate" />
            </el-form-item>
          </el-form>
        </div>
      </div>

      <!-- 学生抽签 -->
      <div v-if="lotteryMode === 'student'" class="student-lottery">
        <div class="class-selector">
          <el-select
            v-model="selectedClassId"
            placeholder="请选择班级"
            @change="loadStudents"
            style="width: 200px"
          >
            <el-option
              v-for="cls in classes"
              :key="cls.id"
              :label="cls.name"
              :value="cls.id"
            />
          </el-select>
          <el-switch
            v-model="excludeAbsent"
            active-text="排除缺席"
            @change="filterStudents"
          />
        </div>
        <div class="student-config">
          <el-form :model="studentConfig" label-width="80px">
            <el-form-item label="抽取数量">
              <el-input-number v-model="studentConfig.count" :min="1" :max="filteredStudents.length" />
            </el-form-item>
            <el-form-item label="允许重复">
              <el-switch v-model="studentConfig.allowDuplicate" />
            </el-form-item>
          </el-form>
        </div>
      </div>

      <!-- 选项预览 -->
      <div class="options-preview" v-if="currentOptions.length > 0">
        <div class="preview-header">
          <span>抽签选项预览 ({{ currentOptions.length }}个)</span>
          <el-button size="small" @click="shuffleOptions">
            <el-icon><Refresh /></el-icon>
            打乱顺序
          </el-button>
        </div>
        <div class="options-grid">
          <el-tag
            v-for="(option, index) in currentOptions"
            :key="index"
            class="option-tag"
            :type="getOptionTagType(index)"
          >
            {{ option }}
          </el-tag>
        </div>
      </div>

      <!-- 抽签区域 -->
      <div class="lottery-area">
        <div class="result-display" :class="{ 'animating': isAnimating }">
          <div class="result-content">
            <div v-if="!lotteryResult.length" class="placeholder">
              <el-icon class="placeholder-icon"><Dice /></el-icon>
              <p>点击开始抽签</p>
            </div>
            <div v-else class="results">
              <div class="result-title">🎉 抽签结果</div>
              <div class="result-items">
                <el-tag
                  v-for="(result, index) in lotteryResult"
                  :key="index"
                  size="large"
                  type="success"
                  class="result-tag"
                >
                  {{ result }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>

        <div class="control-buttons">
          <el-button
            type="primary"
            size="large"
            @click="startLottery"
            :disabled="!canStart || isAnimating"
            :loading="isAnimating"
          >
            <el-icon><Operation /></el-icon>
            {{ isAnimating ? '抽签中...' : '开始抽签' }}
          </el-button>
          
          <el-button
            v-if="lotteryResult.length > 0"
            type="success"
            size="large"
            @click="confirmResult"
            :disabled="isAnimating"
          >
            <el-icon><Check /></el-icon>
            确认结果
          </el-button>
          
          <el-button
            v-if="lotteryResult.length > 0"
            size="large"
            @click="resetLottery"
            :disabled="isAnimating"
          >
            <el-icon><RefreshRight /></el-icon>
            重新抽签
          </el-button>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
      <el-button type="primary" @click="saveTemplate" v-if="lotteryMode === 'text' && textOptions.length > 0">
        保存模板
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Operation, Check, Refresh, RefreshRight } from '@element-plus/icons-vue'

interface Student {
  id: number
  name: string
  student_id: string
  avatar?: string
  seat_number?: string
  is_absent?: boolean
}

interface Class {
  id: number
  name: string
}

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'record': [record: { type: string; result: string }]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const lotteryMode = ref<'text' | 'number' | 'student'>('text')
const textInput = ref('')
const textOptions = ref<string[]>([])
const isAnimating = ref(false)
const lotteryResult = ref<string[]>([])

// 文本抽签配置
const textConfig = ref({
  count: 1,
  allowDuplicate: false
})

// 数字抽签配置
const numberConfig = ref({
  min: 1,
  max: 10,
  count: 1,
  allowDuplicate: false
})

// 学生抽签配置
const classes = ref<Class[]>([])
const students = ref<Student[]>([])
const filteredStudents = ref<Student[]>([])
const selectedClassId = ref<number>()
const excludeAbsent = ref(true)
const studentConfig = ref({
  count: 1,
  allowDuplicate: false
})

// 当前抽签选项
const currentOptions = computed(() => {
  switch (lotteryMode.value) {
    case 'text':
      return textOptions.value
    case 'number':
      const numbers = []
      for (let i = numberConfig.value.min; i <= numberConfig.value.max; i++) {
        numbers.push(i.toString())
      }
      return numbers
    case 'student':
      return filteredStudents.value.map(s => s.name)
    default:
      return []
  }
})

const canStart = computed(() => {
  return currentOptions.value.length > 0 && !isAnimating.value
})

// 模板数据
const templates = {
  yesno: ['是', '否'],
  abcd: ['A', 'B', 'C', 'D'],
  numbers: ['1', '2', '3', '4'],
  weekdays: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
  colors: ['红色', '蓝色', '绿色', '黄色', '紫色', '橙色', '粉色', '黑色'],
  cities: ['北京', '上海', '广州', '哈尔滨']
}

const parseTextOptions = () => {
  textOptions.value = textInput.value
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
}

const loadTemplate = (templateName: keyof typeof templates) => {
  const template = templates[templateName]
  textInput.value = template.join('\n')
  parseTextOptions()
}

const onModeChange = () => {
  resetLottery()
  if (lotteryMode.value === 'student') {
    loadClasses()
  }
}

const loadClasses = async () => {
  try {
    classes.value = [
      { id: 1, name: '七年级1班' },
      { id: 2, name: '七年级2班' },
      { id: 3, name: '八年级1班' }
    ]
    if (classes.value.length > 0 && !selectedClassId.value) {
      selectedClassId.value = classes.value[0].id
      loadStudents()
    }
  } catch (error) {
    ElMessage.error('加载班级列表失败')
  }
}

const loadStudents = async () => {
  if (!selectedClassId.value) return
  
  try {
    students.value = [
      { id: 1, name: '张三', student_id: '2024001', seat_number: 'A1', is_absent: false },
      { id: 2, name: '李四', student_id: '2024002', seat_number: 'A2', is_absent: false },
      { id: 3, name: '王五', student_id: '2024003', seat_number: 'A3', is_absent: true },
      { id: 4, name: '赵六', student_id: '2024004', seat_number: 'A4', is_absent: false },
      { id: 5, name: '钱七', student_id: '2024005', seat_number: 'B1', is_absent: false },
      { id: 6, name: '孙八', student_id: '2024006', seat_number: 'B2', is_absent: false }
    ]
    filterStudents()
  } catch (error) {
    ElMessage.error('加载学生列表失败')
  }
}

const filterStudents = () => {
  if (excludeAbsent.value) {
    filteredStudents.value = students.value.filter(student => !student.is_absent)
  } else {
    filteredStudents.value = [...students.value]
  }
}

const shuffleOptions = () => {
  if (lotteryMode.value === 'text') {
    const shuffled = [...textOptions.value].sort(() => Math.random() - 0.5)
    textInput.value = shuffled.join('\n')
    textOptions.value = shuffled
  }
}

const startLottery = () => {
  if (!canStart.value) return
  
  isAnimating.value = true
  lotteryResult.value = []
  
  // 动画效果
  let animationCount = 0
  const maxAnimations = 15
  
  const animationInterval = setInterval(() => {
    // 随机显示选项
    const randomOptions = getRandomResults()
    lotteryResult.value = randomOptions
    
    animationCount++
    
    if (animationCount >= maxAnimations) {
      clearInterval(animationInterval)
      
      // 最终结果
      setTimeout(() => {
        lotteryResult.value = getRandomResults()
        isAnimating.value = false
        
        // 如果不允许重复，立即从原始选项中移除已抽取的项目
        if (lotteryMode.value === 'text' && !textConfig.value.allowDuplicate) {
          const remainingOptions = textOptions.value.filter(option => !lotteryResult.value.includes(option))
          textOptions.value = remainingOptions
          textInput.value = remainingOptions.join('\n')
        }
        
        const resultText = lotteryResult.value.join(', ')
        ElMessage.success(`抽签结果：${resultText}`)
      }, 300)
    }
  }, 150)
}

const getRandomResults = (): string[] => {
  const options = [...currentOptions.value]
  const results: string[] = []
  
  let count: number
  let allowDuplicate: boolean
  
  switch (lotteryMode.value) {
    case 'text':
      count = textConfig.value.count
      allowDuplicate = textConfig.value.allowDuplicate
      break
    case 'number':
      count = numberConfig.value.count
      allowDuplicate = numberConfig.value.allowDuplicate
      break
    case 'student':
      count = studentConfig.value.count
      allowDuplicate = studentConfig.value.allowDuplicate
      break
    default:
      count = 1
      allowDuplicate = false
  }
  
  // 如果不允许重复，确保抽取数量不超过可用选项数量
  const actualCount = allowDuplicate ? count : Math.min(count, options.length)
  
  for (let i = 0; i < actualCount && options.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * options.length)
    const selected = options[randomIndex]
    results.push(selected)
    
    if (!allowDuplicate) {
      options.splice(randomIndex, 1)
    }
  }
  
  return results
}

const confirmResult = () => {
  if (lotteryResult.value.length > 0) {
    const resultText = lotteryResult.value.join(', ')
    emit('record', {
      type: '自定义抽签',
      result: resultText
    })
    
    ElMessage.success('结果已记录')
    handleClose()
  }
}

const resetLottery = () => {
  lotteryResult.value = []
  isAnimating.value = false
}

const saveTemplate = async () => {
  try {
    const { value: templateName } = await ElMessageBox.prompt('请输入模板名称', '保存模板', {
      confirmButtonText: '保存',
      cancelButtonText: '取消',
      inputPattern: /^.{1,20}$/,
      inputErrorMessage: '模板名称长度应在1-20个字符之间'
    })
    
    // 保存到本地存储
    const savedTemplates = JSON.parse(localStorage.getItem('custom-lottery-templates') || '{}')
    savedTemplates[templateName] = textOptions.value
    localStorage.setItem('custom-lottery-templates', JSON.stringify(savedTemplates))
    
    ElMessage.success('模板保存成功')
  } catch {
    // 用户取消
  }
}

const getOptionTagType = (index: number) => {
  const types = ['primary', 'success', 'info', 'warning', 'danger']
  return types[index % types.length]
}

const handleClose = () => {
  visible.value = false
  resetLottery()
}

watch(visible, (newVal) => {
  if (newVal) {
    resetLottery()
    if (lotteryMode.value === 'student') {
      loadClasses()
    }
  }
})

watch(excludeAbsent, () => {
  filterStudents()
})

onMounted(() => {
  // 加载默认模板
  loadTemplate('yesno')
})
</script>

<style scoped>
.custom-lottery-dialog .dialog-content {
  padding: 20px 0;
}

.mode-selector {
  margin-bottom: 30px;
  text-align: center;
}

.text-lottery {
  margin-bottom: 30px;
}

.input-section {
  margin-bottom: 20px;
}

.text-config {
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.text-config .el-form-item {
  margin-bottom: 12px;
}

.text-config .el-form-item:last-child {
  margin-bottom: 0;
}

.quick-templates {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.template-label {
  font-size: 14px;
  color: #606266;
  margin-right: 8px;
}

.number-lottery,
.student-lottery {
  margin-bottom: 30px;
}

.class-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.options-preview {
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-weight: 500;
  color: #303133;
}

.options-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.option-tag {
  margin: 0;
}

.lottery-area {
  text-align: center;
}

.result-display {
  padding: 40px 20px;
  border: 2px dashed #e4e7ed;
  border-radius: 12px;
  margin-bottom: 30px;
  min-height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.result-display.animating {
  border-color: #409eff;
  background: linear-gradient(45deg, #f0f9ff, #e1f5fe);
  animation: pulse 0.6s infinite alternate;
}

@keyframes pulse {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.02);
  }
}

.placeholder {
  text-align: center;
  color: #909399;
}

.placeholder-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: #c0c4cc;
}

.placeholder p {
  font-size: 16px;
  margin: 0;
}

.results {
  width: 100%;
}

.result-title {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 20px;
}

.result-items {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
}

.result-tag {
  font-size: 16px;
  padding: 8px 16px;
  margin: 0;
}

.control-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

/* 暗色主题 */
.dark-theme .options-preview {
  background: #1a1a1a;
}

.dark-theme .result-display {
  border-color: #4c4d4f;
}

.dark-theme .result-display.animating {
  border-color: #409eff;
  background: linear-gradient(45deg, #1a1a1a, #2a2a2a);
}

.dark-theme .result-title {
  color: #e5eaf3;
}

.dark-theme .placeholder {
  color: #a3a6ad;
}

.dark-theme .class-selector {
  border-bottom-color: #4c4d4f;
}

:global(.dark-theme) .text-config {
  background-color: #2d3748;
  border-color: #4a5568;
}
</style>