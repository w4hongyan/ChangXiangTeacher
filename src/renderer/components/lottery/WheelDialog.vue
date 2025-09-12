<template>
  <el-dialog
    v-model="visible"
    title="大转盘抽签"
    width="800px"
    :before-close="handleClose"
    class="wheel-dialog"
  >
    <div class="dialog-content">
      <!-- 班级选择 -->
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

      <!-- 转盘区域 -->
      <div class="wheel-container">
        <div class="wheel-wrapper">
          <!-- 转盘 -->
          <div 
            class="wheel" 
            :style="{ transform: `rotate(${wheelRotation}deg)` }"
            ref="wheelRef"
          >
            <div 
              v-for="(student, index) in filteredStudents"
              :key="student.id"
              class="wheel-segment"
              :style="getSegmentStyle(index)"
            >
              <div class="segment-content">
                <span class="student-name">{{ student.name }}</span>
              </div>
            </div>
          </div>
          
          <!-- 指针 -->
          <div class="wheel-pointer">
            <div class="pointer-triangle"></div>
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
      <div class="result-area" v-if="selectedStudent">
        <el-card class="result-card">
          <div class="result-content">
            <el-avatar :size="80" :src="selectedStudent.avatar">
              <el-icon><User /></el-icon>
            </el-avatar>
            <div class="result-info">
              <h3 class="winner-name">🎉 {{ selectedStudent.name }}</h3>
              <p class="winner-details">
                学号：{{ selectedStudent.student_id }} | 座位：{{ selectedStudent.seat_number }}
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
      <div v-if="filteredStudents.length === 0" class="empty-state">
        <el-empty description="请先选择班级并确保有可抽签的学生" />
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
      <el-button type="primary" @click="resetWheel" v-if="selectedStudent">
        重新抽签
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
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

const classes = ref<Class[]>([])
const students = ref<Student[]>([])
const filteredStudents = ref<Student[]>([])
const selectedClassId = ref<number>()
const selectedStudent = ref<Student | null>(null)
const isSpinning = ref(false)
const wheelRotation = ref(0)
const excludeAbsent = ref(true)
const wheelRef = ref<HTMLElement>()

const canSpin = computed(() => {
  return filteredStudents.value.length > 0 && !isSpinning.value
})

// 生成转盘颜色
const wheelColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
]

const getSegmentStyle = (index: number) => {
  const totalSegments = filteredStudents.value.length
  const segmentAngle = 360 / totalSegments
  const rotation = index * segmentAngle
  const color = wheelColors[index % wheelColors.length]
  
  // 计算扇形的路径
  const startAngle = 0
  const endAngle = segmentAngle
  const startAngleRad = (startAngle * Math.PI) / 180
  const endAngleRad = (endAngle * Math.PI) / 180
  
  const x1 = 50 + 50 * Math.cos(startAngleRad)
  const y1 = 50 + 50 * Math.sin(startAngleRad)
  const x2 = 50 + 50 * Math.cos(endAngleRad)
  const y2 = 50 + 50 * Math.sin(endAngleRad)
  
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0
  
  return {
    transform: `rotate(${rotation}deg)`,
    background: color,
    clipPath: `polygon(50% 50%, 50% 0%, ${x2}% ${y2}%)`
  }
}

const loadClasses = async () => {
  try {
    classes.value = [
      { id: 1, name: '七年级1班' },
      { id: 2, name: '七年级2班' },
      { id: 3, name: '八年级1班' }
    ]
  } catch (error) {
    ElMessage.error('加载班级列表失败')
  }
}

const loadStudents = async () => {
  if (!selectedClassId.value) return
  
  try {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    students.value = [
      { id: 1, name: '张三', student_id: '2024001', seat_number: 'A1', is_absent: false },
      { id: 2, name: '李四', student_id: '2024002', seat_number: 'A2', is_absent: false },
      { id: 3, name: '王五', student_id: '2024003', seat_number: 'A3', is_absent: true },
      { id: 4, name: '赵六', student_id: '2024004', seat_number: 'A4', is_absent: false },
      { id: 5, name: '钱七', student_id: '2024005', seat_number: 'B1', is_absent: false },
      { id: 6, name: '孙八', student_id: '2024006', seat_number: 'B2', is_absent: false },
      { id: 7, name: '周九', student_id: '2024007', seat_number: 'B3', is_absent: false },
      { id: 8, name: '吴十', student_id: '2024008', seat_number: 'B4', is_absent: true },
      { id: 9, name: '郑十一', student_id: '2024009', seat_number: 'C1', is_absent: false },
      { id: 10, name: '王十二', student_id: '2024010', seat_number: 'C2', is_absent: false }
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

const startSpin = () => {
  if (!canSpin.value) return
  
  isSpinning.value = true
  selectedStudent.value = null
  
  // 计算随机旋转角度
  const totalSegments = filteredStudents.value.length
  const segmentAngle = 360 / totalSegments
  const randomSegment = Math.floor(Math.random() * totalSegments)
  
  // 多转几圈增加视觉效果
  const extraRotations = 5 + Math.random() * 3 // 5-8圈
  const finalRotation = wheelRotation.value + (extraRotations * 360) + (randomSegment * segmentAngle) + (segmentAngle / 2)
  
  wheelRotation.value = finalRotation
  
  // 转盘动画持续时间
  const duration = 3000 + Math.random() * 2000 // 3-5秒
  
  setTimeout(() => {
    // 计算最终选中的学生（考虑指针位置）
    const normalizedRotation = (360 - (finalRotation % 360)) % 360
    const selectedIndex = Math.floor(normalizedRotation / segmentAngle)
    selectedStudent.value = filteredStudents.value[selectedIndex]
    
    isSpinning.value = false
    
    // 播放成功音效（如果需要）
    ElMessage.success(`🎉 恭喜 ${selectedStudent.value?.name} 被选中！`)
  }, duration)
}

const confirmResult = () => {
  if (selectedStudent.value) {
    emit('record', {
      type: '大转盘',
      result: `${selectedStudent.value.name} (${selectedStudent.value.student_id})`
    })
    
    ElMessage.success('结果已记录')
    handleClose()
  }
}

const resetWheel = () => {
  selectedStudent.value = null
  wheelRotation.value = 0
}

const handleClose = () => {
  visible.value = false
  resetWheel()
}

watch(visible, (newVal) => {
  if (newVal) {
    loadClasses()
    if (classes.value.length > 0 && !selectedClassId.value) {
      selectedClassId.value = classes.value[0].id
      loadStudents()
    }
  }
})

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
  width: 400px;
  height: 400px;
}

.wheel {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  position: relative;
  transition: transform 4s cubic-bezier(0.23, 1, 0.32, 1);
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.wheel-segment {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  transform-origin: 50% 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.segment-content {
  position: absolute;
  top: 25%;
  left: 50%;
  transform: translateX(-50%) rotate(-90deg);
  text-align: center;
  width: 80px;
}

.student-name {
  font-size: 11px;
  font-weight: bold;
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
}

.wheel-pointer {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.pointer-triangle {
  width: 0;
  height: 0;
  border-left: 15px solid transparent;
  border-right: 15px solid transparent;
  border-top: 30px solid #ff4757;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
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
    width: 300px;
    height: 300px;
  }
  
  .spin-button {
    width: 60px;
    height: 60px;
    font-size: 18px;
  }
  
  .student-name {
    font-size: 10px;
  }
}

/* 暗色主题 */
.dark-theme .result-card {
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
}

.dark-theme .class-selector {
  border-bottom-color: #4c4d4f;
}
</style>