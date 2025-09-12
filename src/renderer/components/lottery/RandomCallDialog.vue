<template>
  <el-dialog
    v-model="visible"
    title="随机点名"
    width="600px"
    :before-close="handleClose"
    class="random-call-dialog"
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
        <el-button type="primary" @click="refreshStudents" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新学生列表
        </el-button>
      </div>

      <!-- 抽签区域 -->
      <div class="lottery-area">
        <div class="result-display" :class="{ 'animating': isAnimating }">
          <div class="student-avatar">
            <el-avatar :size="120" :src="selectedStudent?.avatar">
              <el-icon><User /></el-icon>
            </el-avatar>
          </div>
          <div class="student-info">
            <h2 class="student-name">{{ selectedStudent?.name || '点击开始抽签' }}</h2>
            <p class="student-details" v-if="selectedStudent">
              学号：{{ selectedStudent.student_id }} | 座位：{{ selectedStudent.seat_number }}
            </p>
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
            v-if="selectedStudent"
            type="success"
            size="large"
            @click="confirmResult"
            :disabled="isAnimating"
          >
            <el-icon><Check /></el-icon>
            确认结果
          </el-button>
        </div>
      </div>

      <!-- 学生列表 -->
      <div class="students-list" v-if="students.length > 0">
        <div class="list-header">
          <span>可抽签学生 ({{ students.length }}人)</span>
          <el-switch
            v-model="excludeAbsent"
            active-text="排除缺席"
            @change="filterStudents"
          />
        </div>
        <div class="students-grid">
          <div
            v-for="student in filteredStudents"
            :key="student.id"
            class="student-item"
            :class="{ 'selected': selectedStudent?.id === student.id }"
          >
            <el-avatar :size="40" :src="student.avatar">
              <el-icon><User /></el-icon>
            </el-avatar>
            <span class="student-name">{{ student.name }}</span>
            <el-tag v-if="student.is_absent" type="info" size="small">缺席</el-tag>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <el-empty v-else description="请先选择班级并加载学生列表" />
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
      <el-button type="primary" @click="handleClose" v-if="selectedStudent">
        完成
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { User, Operation, Check, Refresh } from '@element-plus/icons-vue'

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
const isAnimating = ref(false)
const loading = ref(false)
const excludeAbsent = ref(true)

const canStart = computed(() => {
  return filteredStudents.value.length > 0 && !isAnimating.value
})

const loadClasses = async () => {
  try {
    // 模拟API调用 - 实际项目中应该调用真实的API
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
  
  loading.value = true
  try {
    // 模拟API调用 - 实际项目中应该调用真实的API
    await new Promise(resolve => setTimeout(resolve, 500))
    
    students.value = [
      { id: 1, name: '张三', student_id: '2024001', seat_number: 'A1', is_absent: false },
      { id: 2, name: '李四', student_id: '2024002', seat_number: 'A2', is_absent: false },
      { id: 3, name: '王五', student_id: '2024003', seat_number: 'A3', is_absent: true },
      { id: 4, name: '赵六', student_id: '2024004', seat_number: 'A4', is_absent: false },
      { id: 5, name: '钱七', student_id: '2024005', seat_number: 'B1', is_absent: false },
      { id: 6, name: '孙八', student_id: '2024006', seat_number: 'B2', is_absent: false },
      { id: 7, name: '周九', student_id: '2024007', seat_number: 'B3', is_absent: false },
      { id: 8, name: '吴十', student_id: '2024008', seat_number: 'B4', is_absent: true }
    ]
    
    filterStudents()
  } catch (error) {
    ElMessage.error('加载学生列表失败')
  } finally {
    loading.value = false
  }
}

const refreshStudents = () => {
  if (selectedClassId.value) {
    loadStudents()
  }
}

const filterStudents = () => {
  if (excludeAbsent.value) {
    filteredStudents.value = students.value.filter(student => !student.is_absent)
  } else {
    filteredStudents.value = [...students.value]
  }
}

const startLottery = () => {
  if (!canStart.value) return
  
  isAnimating.value = true
  selectedStudent.value = null
  
  // 动画效果：快速切换显示不同学生
  let animationCount = 0
  const maxAnimations = 20
  
  const animationInterval = setInterval(() => {
    const randomIndex = Math.floor(Math.random() * filteredStudents.value.length)
    selectedStudent.value = filteredStudents.value[randomIndex]
    
    animationCount++
    
    if (animationCount >= maxAnimations) {
      clearInterval(animationInterval)
      
      // 最终结果
      setTimeout(() => {
        const finalIndex = Math.floor(Math.random() * filteredStudents.value.length)
        selectedStudent.value = filteredStudents.value[finalIndex]
        isAnimating.value = false
        
        ElMessage.success(`抽中了：${selectedStudent.value?.name}`)
      }, 500)
    }
  }, 100)
}

const confirmResult = () => {
  if (selectedStudent.value) {
    emit('record', {
      type: '随机点名',
      result: `${selectedStudent.value.name} (${selectedStudent.value.student_id})`
    })
    
    ElMessage.success('结果已记录')
    handleClose()
  }
}

const handleClose = () => {
  visible.value = false
  selectedStudent.value = null
  isAnimating.value = false
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
})

onMounted(() => {
  loadClasses()
})
</script>

<style scoped>
.random-call-dialog .dialog-content {
  padding: 20px 0;
}

.class-selector {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.lottery-area {
  text-align: center;
  margin-bottom: 30px;
}

.result-display {
  padding: 40px 20px;
  border: 2px dashed #e4e7ed;
  border-radius: 12px;
  margin-bottom: 30px;
  transition: all 0.3s ease;
}

.result-display.animating {
  border-color: #409eff;
  background: linear-gradient(45deg, #f0f9ff, #e1f5fe);
  animation: pulse 0.5s infinite alternate;
}

@keyframes pulse {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.02);
  }
}

.student-avatar {
  margin-bottom: 20px;
}

.student-name {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.student-details {
  font-size: 14px;
  color: #606266;
  margin: 0;
}

.control-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.students-list {
  border-top: 1px solid #f0f0f0;
  padding-top: 20px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-weight: 500;
  color: #303133;
}

.students-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.student-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.student-item:hover {
  border-color: #409eff;
  background: #f0f9ff;
}

.student-item.selected {
  border-color: #409eff;
  background: #e1f5fe;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.student-item .student-name {
  flex: 1;
  font-size: 14px;
  color: #303133;
}

.dark-theme .result-display {
  border-color: #4c4d4f;
}

.dark-theme .result-display.animating {
  border-color: #409eff;
  background: linear-gradient(45deg, #1a1a1a, #2a2a2a);
}

.dark-theme .student-name {
  color: #e5eaf3;
}

.dark-theme .student-details {
  color: #a3a6ad;
}

.dark-theme .student-item {
  border-color: #4c4d4f;
  background: #1a1a1a;
}

.dark-theme .student-item:hover {
  background: #2a2a2a;
}

.dark-theme .student-item.selected {
  background: #2a3a4a;
}
</style>