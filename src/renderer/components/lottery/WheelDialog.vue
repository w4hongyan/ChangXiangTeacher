<template>
  <el-dialog
    v-model="visible"
    title="大转盘抽签"
    width="800px"
    :before-close="handleClose"
    class="wheel-dialog"
  >
    <div class="dialog-content">
      <!-- 模式选择和快速选项 -->
      <div class="mode-selector">
        <el-radio-group v-model="wheelMode" @change="onModeChange">
          <el-radio-button label="students">学生抽签</el-radio-button>
          <el-radio-button label="custom">自定义选项</el-radio-button>
        </el-radio-group>
        
        <!-- 快速选项 -->
        <div class="quick-options" v-if="wheelMode === 'custom'">
          <el-button
                v-for="option in quickOptions"
                :key="option.label"
                size="small"
                @click="selectQuickOption(option)"
                class="quick-option-btn"
                :class="{ active: customOptions === option.options }"
              >
                {{ option.label }}
              </el-button>
        </div>
      </div>

      <!-- 班级选择（学生模式） -->
      <div class="class-selector" v-if="wheelMode === 'students'">
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

      <!-- 自定义选项输入（自定义模式） -->
      <div class="custom-options" v-if="wheelMode === 'custom'">
        <el-input
          v-model="customOptions"
          type="textarea"
          :rows="3"
          placeholder="请输入选项，每行一个选项，例如：&#10;一等奖&#10;二等奖&#10;三等奖&#10;谢谢参与"
        />
        <div class="option-tips">
          <el-text size="small" type="info">
            每行输入一个选项，空行会被自动忽略
          </el-text>
        </div>
      </div>

      <!-- 转盘区域 -->
      <div class="wheel-container">
        <div class="wheel-wrapper">
          <!-- 转盘 -->
          <div 
            class="wheel" 
            :style="{ transform: `rotate(${wheelRotation}deg)` }"
            ref="wheelRef"
          >
            <svg 
              class="wheel-svg" 
              viewBox="0 0 400 400"
              xmlns="http://www.w3.org/2000/svg"
            >
              <!-- 转盘扇形 -->
              <g transform="translate(200,200)">
                <path
                  v-for="(item, index) in wheelItems"
                  :key="item.id"
                  :d="getSegmentPath(index)"
                  :fill="wheelColors[index % wheelColors.length]"
                  stroke="#fff"
                  stroke-width="2"
                  class="wheel-segment"
                />
                
                <!-- 选项文本 -->
                <text
                  v-for="(item, index) in wheelItems"
                  :key="'text-' + item.id"
                  :transform="getTextTransform(index)"
                  text-anchor="middle"
                  dominant-baseline="middle"
                  class="wheel-text"
                  fill="white"
                >
                  {{ item.name }}
                </text>
              </g>
            </svg>
          </div>
          
          <!-- 指针 -->
          <div class="wheel-pointer">
            <div class="pointer-triangle"></div>
            <div class="pointer-circle"></div>
          </div>
          
          <!-- 中心按钮 -->
          <div class="wheel-center">
            <el-button
              type="primary"
              size="large"
              circle
              @click="startSpin"
              :disabled="!canSpin || isSpinning"
              :loading="isSpinning"
              class="spin-button"
            >
              <el-icon v-if="!isSpinning"><Compass /></el-icon>
            </el-button>
          </div>
        </div>
      </div>

      <!-- 结果显示 -->
      <div class="result-area" v-if="selectedItem">
        <el-card class="result-card">
          <div class="result-content">
            <el-avatar 
              :size="80" 
              :src="wheelMode === 'students' ? selectedItem.avatar : ''"
              v-if="wheelMode === 'students'"
            >
              <el-icon><User /></el-icon>
            </el-avatar>
            <div class="result-info">
              <h3 class="winner-name">🎉 {{ selectedItem.name }}</h3>
              <p class="winner-details" v-if="wheelMode === 'students'">
                学号：{{ selectedItem.student_id }} | 座位：{{ selectedItem.seat_number }}
              </p>
            </div>
            <el-button
              type="success"
              @click="confirmResult"
              :disabled="isSpinning"
            >
              <el-icon><Check /></el-icon>
              确认结果
            </el-button>
          </div>
        </el-card>
      </div>

      <!-- 空状态 -->
      <div v-if="wheelItems.length === 0" class="empty-state">
        <el-empty 
          :description="wheelMode === 'students' 
            ? '请先选择班级并确保有可抽签的学生' 
            : '请先输入自定义选项'"
        />
      </div>
    </div>

<!-- 按钮区域 -->
    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
      <el-button type="primary" @click="resetWheel" v-if="selectedItem">
        重新抽签
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { User, Compass, Check } from '@element-plus/icons-vue'

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

const wheelMode = ref<'students' | 'custom'>('students')
const customOptions = ref<string>('')
const classes = ref<Class[]>([])
const students = ref<Student[]>([])
const filteredStudents = ref<Student[]>([])
const selectedClassId = ref<number>()
const selectedItem = ref<Student | { id: number; name: string } | null>(null)
const isSpinning = ref(false)
const wheelRotation = ref(0)
const excludeAbsent = ref(true)
const wheelRef = ref<HTMLElement>()

// 快速选项配置
const quickOptions = [
  { label: '奖项', options: '一等奖\n二等奖\n三等奖\n参与奖' },
  { label: '奖品', options: 'iPhone\niPad\nMacBook\nAirPods' },
  { label: '活动', options: '唱歌\n跳舞\n朗诵\n讲故事\n猜谜语' },
  { label: '游戏', options: '真心话\n大冒险\n表演节目\n模仿秀' }
]

const wheelItems = computed(() => {
  if (wheelMode.value === 'custom') {
    return customOptions.value
      .split('\n')
      .map((option, index) => ({
        id: index + 1,
        name: option.trim()
      }))
      .filter(item => item.name)
  }
  
  // 学生模式
  return filteredStudents.value.map(student => ({
    id: student.id,
    name: student.name,
    text: student.name
  }))
})

const canSpin = computed(() => {
  return wheelItems.value.length > 0 && !isSpinning.value
})

// 生成转盘颜色
const wheelColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
]

// 生成扇形路径
const getSegmentPath = (index: number) => {
  const totalSegments = wheelItems.value.length
  const segmentAngle = 360 / totalSegments
  const startAngle = index * segmentAngle - 90 // 从顶部开始
  const endAngle = startAngle + segmentAngle
  
  const centerX = 0
  const centerY = 0
  const radius = 180
  
  const startAngleRad = (startAngle * Math.PI) / 180
  const endAngleRad = (endAngle * Math.PI) / 180
  
  const x1 = centerX + radius * Math.cos(startAngleRad)
  const y1 = centerY + radius * Math.sin(startAngleRad)
  const x2 = centerX + radius * Math.cos(endAngleRad)
  const y2 = centerY + radius * Math.sin(endAngleRad)
  
  const largeArcFlag = segmentAngle > 180 ? 1 : 0
  
  return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
}

// 生成文本位置
const getTextTransform = (index: number) => {
  const totalSegments = wheelItems.value.length
  const segmentAngle = 360 / totalSegments
  const textAngle = index * segmentAngle + segmentAngle / 2 - 90
  const textRadius = 120
  
  const textAngleRad = (textAngle * Math.PI) / 180
  const x = textRadius * Math.cos(textAngleRad)
  const y = textRadius * Math.sin(textAngleRad)
  
  const rotation = textAngle
  
  return `translate(${x}, ${y}) rotate(${rotation})`
}

const loadClasses = async () => {
  try {
    // 调用学生store获取班级列表
    const result = await window.electronAPI.students.getClasses()
    if (result.success) {
      classes.value = result.data
    } else {
      ElMessage.error('加载班级列表失败：' + result.error)
    }
  } catch (error) {
    ElMessage.error('加载班级列表失败')
  }
}

const loadStudents = async () => {
  if (!selectedClassId.value) return
  
  try {
    // 调用学生store获取学生数据
    const result = await window.electronAPI.students.list({
      class_id: selectedClassId.value,
      page: 1,
      page_size: 1000 // 获取所有学生
    })
    
    if (result.success) {
      // 转换数据格式，添加座位号和缺席状态
      students.value = result.data.items.map((student: any) => ({
        id: student.id,
        name: student.name,
        student_id: student.student_id || student.id.toString(),
        seat_number: student.seat_number || '',
        is_absent: student.is_absent === undefined ? false : student.is_absent,
        avatar: student.avatar,
        class_id: student.class_id
      }))
      
      filterStudents()
      
      // 输出调试信息
      console.log('=== 学生数据加载完成 ===')
      console.log('学生总数:', students.value.length)
      console.log('过滤后学生数:', filteredStudents.value.length)
      console.log('班级ID:', selectedClassId.value)
      console.log('排除缺席:', excludeAbsent.value)
      console.log('学生列表:', students.value.map(s => ({ name: s.name, is_absent: s.is_absent, class_id: s.class_id })))
      console.log('过滤后列表:', filteredStudents.value.map(s => ({ name: s.name, is_absent: s.is_absent, class_id: s.class_id })))
      
      // 检查wheelItems计算
      console.log('=== wheelItems计算 ===')
      console.log('wheelMode:', wheelMode.value)
      console.log('wheelItems数量:', wheelItems.value.length)
      console.log('wheelItems内容:', wheelItems.value.map(item => item.name || item.text))
    } else {
      ElMessage.error('加载学生列表失败：' + result.error)
    }
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

const startSpin = () => {
  if (!canSpin.value) return
  
  isSpinning.value = true
  selectedItem.value = null
  
  // 计算随机旋转角度
  const totalSegments = wheelItems.value.length
  const segmentAngle = 360 / totalSegments
  const randomSegment = Math.floor(Math.random() * totalSegments)
  
  // 多转几圈增加视觉效果
  const extraRotations = 5 + Math.random() * 3 // 5-8圈
  
  // 指针指向顶部（0度），我们需要让选中扇形的中心对准指针
  // 扇形索引 * 扇形角度 + 扇形角度的一半 = 扇形中心角度
  const targetAngle = randomSegment * segmentAngle + segmentAngle / 2
  const finalRotation = wheelRotation.value + (extraRotations * 360) + targetAngle
  
  wheelRotation.value = finalRotation
  
  // 转盘动画持续时间
  const duration = 3000 + Math.random() * 2000 // 3-5秒
  
  setTimeout(() => {
    // 计算最终选中的项（考虑指针位置）
    // 指针指向顶部（0度），转盘顺时针旋转
    
    // 重要：SVG有 transform: rotate(-90deg)，这意味着第一个扇形从-90度开始
    // 扇形i的起始角度是：i * segmentAngle - 90
    // 扇形i的结束角度是：(i+1) * segmentAngle - 90
    
    // 计算转盘的实际旋转角度（0-360度）
    const actualRotation = finalRotation % 360
    
    // 核心逻辑：当转盘顺时针旋转actualRotation度后，
    // 指针指向的是原本在 (-actualRotation) % 360 度位置的扇形
    
    // 但由于SVG的-90度偏移，我们需要调整
    // 扇形i在旋转前的角度范围（考虑SVG偏移）：
    // 起始：i * segmentAngle - 90
    // 结束：(i+1) * segmentAngle - 90
    
    // 指针指向的角度（旋转前）：
    const pointerAngle = (-actualRotation + 360) % 360
    
    // 我们要找的是：哪个扇形包含这个指针角度
    let selectedIndex = 0
    for (let i = 0; i < totalSegments; i++) {
      const startAngle = i * segmentAngle - 90
      const endAngle = (i + 1) * segmentAngle - 90
      
      // 处理角度跨越0度的情况
      if (startAngle < 0) {
        // 这个扇形跨越了0度
        const normalizedStart = (startAngle + 360) % 360
        if (pointerAngle >= normalizedStart || pointerAngle < endAngle) {
          selectedIndex = i
          break
        }
      } else if (pointerAngle >= startAngle && pointerAngle < endAngle) {
        selectedIndex = i
        break
      }
    }
    
    // 调试信息
    console.log('=== 转盘调试信息 ===')
    console.log('最终旋转角度:', finalRotation)
    console.log('实际旋转角度:', actualRotation)
    console.log('指针角度:', pointerAngle)
    console.log('扇形角度:', segmentAngle)
    console.log('选中索引:', selectedIndex)
    console.log('总扇形数:', totalSegments)
    console.log('选中项:', wheelItems.value[selectedIndex])
    console.log('所有选项:', wheelItems.value.map((item, i) => `${i}: ${item.name}`))
    
    selectedItem.value = wheelItems.value[selectedIndex]
    
    isSpinning.value = false
    
    // 播放成功音效（如果需要）
    ElMessage.success(`🎉 恭喜 ${selectedItem.value?.name} 被选中！`)
  }, duration)
}

const confirmResult = () => {
  if (selectedItem.value) {
    const resultText = wheelMode.value === 'students' 
      ? `${selectedItem.value.name} (${(selectedItem.value as Student).student_id})`
      : selectedItem.value.name
    emit('record', {
      type: '大转盘',
      result: resultText
    })
    
    ElMessage.success('结果已记录')
    handleClose()
  }
}

const resetWheel = () => {
  selectedItem.value = null
  wheelRotation.value = 0
}

// 快速选项选择
const selectQuickOption = (option: { label: string; options: string }) => {
  customOptions.value = option.options
}

// 监听模式变化
watch(wheelMode, () => {
  selectedItem.value = null
  wheelRotation.value = 0
})

// 模式切换处理
const onModeChange = () => {
  selectedItem.value = null
  wheelRotation.value = 0
}

const handleClose = () => {
  visible.value = false
  resetWheel()
}

watch(visible, (newVal) => {
  if (newVal) {
    loadClasses()
  }
})

// 监听班级列表变化，自动选择第一个班级并加载学生
watch(classes, (newVal) => {
  if (newVal.length > 0 && !selectedClassId.value) {
    selectedClassId.value = newVal[0].id
    loadStudents()
  }
})

// 监听wheelItems变化，输出调试信息
watch(wheelItems, (newVal) => {
  console.log('=== wheelItems更新 ===')
  console.log('wheelItems数量:', newVal.length)
  console.log('wheelItems项目:', newVal.map(item => item.text || item.name))
  console.log('wheelItems完整数据:', newVal)
  console.log('当前模式:', wheelMode.value)
  console.log('选中班级:', selectedClassId.value)
  console.log('学生总数:', students.value.length)
  console.log('过滤后学生数:', filteredStudents.value.length)
  console.log('排除缺席状态:', excludeAbsent.value)
}, { immediate: true })

// 监听filteredStudents变化
watch(filteredStudents, (newVal) => {
  console.log('filteredStudents更新:', newVal.length, '个学生')
  console.log('filteredStudents内容:', newVal.map(s => s.name))
}, { immediate: true })

// 监听students变化
watch(students, (newVal) => {
  console.log('students更新:', newVal.length, '个学生')
  console.log('students内容:', newVal.map(s => s.name))
}, { immediate: true })

watch(excludeAbsent, () => {
  filterStudents()
  resetWheel()
})

onMounted(() => {
  loadClasses()
})
</script>

<style scoped>
.wheel-dialog .dialog-content {
  padding: 20px 0;
}

.class-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.wheel-container {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
}

.wheel-wrapper {
  position: relative;
  width: 420px;
  height: 420px;
}

.wheel {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  position: relative;
  transition: transform 4s cubic-bezier(0.23, 1, 0.32, 1);
  background: radial-gradient(circle, #f8f9fa 0%, #e9ecef 100%);
  box-shadow: 
    0 0 0 8px #fff,
    0 0 0 12px #dee2e6,
    0 10px 30px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.wheel-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg); /* 让第一个扇形从顶部开始 */
}

.wheel-segment {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  transition: filter 0.3s ease;
}

.wheel-segment:hover {
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
}

.wheel-text {
  font-size: 14px;
  font-weight: bold;
  fill: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
  pointer-events: none;
}

.wheel-pointer {
  position: absolute;
  top: -15px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.pointer-triangle {
  width: 0;
  height: 0;
  border-left: 20px solid transparent;
  border-right: 20px solid transparent;
  border-top: 35px solid #ff4757;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

.pointer-circle {
  width: 24px;
  height: 24px;
  background: #ff4757;
  border-radius: 50%;
  margin: 0 auto;
  margin-top: -8px;
  border: 3px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.wheel-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 20;
}

.spin-button {
  width: 80px;
  height: 80px;
  font-size: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.result-area {
  margin-top: 20px;
}

.result-card {
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.result-card :deep(.el-card__body) {
  padding: 20px;
}

.result-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.result-info {
  flex: 1;
}

.winner-name {
  font-size: 24px;
  font-weight: bold;
  margin: 0 0 8px 0;
  color: white;
}

.winner-details {
  font-size: 14px;
  margin: 0;
  opacity: 0.9;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
}

/* 动画效果 */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.wheel.spinning {
  animation: spin 3s cubic-bezier(0.23, 1, 0.32, 1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .wheel-wrapper {
    width: 320px;
    height: 320px;
  }
  
  .spin-button {
    width: 60px;
    height: 60px;
    font-size: 18px;
  }
  
  .wheel-text {
    font-size: 12px;
  }
  
  .pointer-triangle {
    border-left: 15px solid transparent;
    border-right: 15px solid transparent;
    border-top: 25px solid #ff4757;
  }
  
  .pointer-circle {
    width: 18px;
    height: 18px;
  }
}

.mode-selection {
  margin-bottom: 20px;
}

.quick-options {
  margin-bottom: 15px;
}

.quick-option-btn {
  margin-right: 10px;
  margin-bottom: 10px;
}

.quick-option-btn.active {
  background-color: #409eff;
  color: white;
  border-color: #409eff;
}

.custom-options {
  margin-bottom: 15px;
}

.custom-options textarea {
  font-family: inherit;
  resize: vertical;
  min-height: 100px;
}

/* 暗色主题 */
.dark-theme .result-card {
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
}

.dark-theme .class-selector {
  border-bottom-color: #4c4d4f;
}
</style>