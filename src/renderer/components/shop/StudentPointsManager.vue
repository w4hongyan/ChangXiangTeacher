<template>
  <div class="student-points-manager">
    <!-- 页面头部 -->
    <div class="management-header">
      <h3>学生积分管理</h3>
      <div class="header-actions">
        <el-button @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 班级选择器 -->
    <div class="class-selector">
      <el-select
        v-model="selectedClassId"
        placeholder="请选择班级"
        clearable
        @change="handleClassChange"
        style="width: 300px"
      >
        <el-option
          v-for="cls in classes"
          :key="cls.id"
          :label="cls.name"
          :value="cls.id"
        />
      </el-select>
    </div>

    <!-- 学生卡片列表 -->
    <div v-if="selectedClassId" class="student-cards-container">
      <div class="student-cards">
        <div
          v-for="student in classStudents"
          :key="student.id"
          class="student-card"
          @click="selectStudent(student)"
        >
          <div class="student-info">
            <div class="student-name">{{ student.name }}</div>
            <div class="student-id" v-if="student.student_id">学号: {{ student.student_id }}</div>
            <div class="student-points">
              <span class="points-label">当前积分:</span>
              <span 
                :class="['points-value', { 'positive': getStudentPoints(student.id) > 0, 'negative': getStudentPoints(student.id) < 0 }]"
              >
                {{ getStudentPoints(student.id) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 快速加分减分面板 -->
    <div v-if="selectedStudent" class="points-panel">
      <div class="panel-header">
        <h4>为 {{ selectedStudent.name }} 快速操作积分</h4>
        <el-button @click="closePointsPanel" type="info" size="small">关闭</el-button>
      </div>
      
      <div class="points-actions">
        <div class="action-group">
          <div class="action-title">快速加分</div>
          <div class="quick-points">
            <el-button 
              v-for="point in quickPoints" 
              :key="'add-' + point" 
              @click="addPoints(point)"
              type="success"
              size="large"
            >
              +{{ point }}
            </el-button>
          </div>
        </div>
        
        <div class="action-group">
          <div class="action-title">快速减分</div>
          <div class="quick-points">
            <el-button 
              v-for="point in quickPoints" 
              :key="'subtract-' + point" 
              @click="subtractPoints(point)"
              type="danger"
              size="large"
            >
              -{{ point }}
            </el-button>
          </div>
        </div>
        
        <div class="action-group custom-points">
          <div class="action-title">自定义积分</div>
          <div class="custom-points-form">
            <el-input-number 
              v-model="customPoints" 
              :min="-100" 
              :max="100" 
              controls-position="right" 
              size="large"
            />
            <el-input 
              v-model="customReason" 
              placeholder="请输入原因" 
              style="margin-top: 10px"
            />
            <div class="custom-buttons">
              <el-button 
                @click="applyCustomPoints" 
                type="primary" 
                :disabled="!customReason || customPoints === 0"
                size="large"
              >
                {{ customPoints > 0 ? '加分' : customPoints < 0 ? '减分' : '应用' }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { useStudentStore } from '../../stores/student'
import { usePointStore } from '../../stores/point'
import { useClassStore } from '../../stores/class'
import type { StudentListItem } from '../../types/student'

const studentStore = useStudentStore()
const pointStore = usePointStore()
const classStore = useClassStore()

// 响应式数据
const selectedClassId = ref<number | null>(null)
const selectedStudent = ref<StudentListItem | null>(null)
const customPoints = ref(0)
const customReason = ref('')
const loading = ref(false)

// 快速积分选项
const quickPoints = [1, 2, 3, 5, 10]

// 计算属性
const classes = computed(() => classStore.classes)
const classStudents = computed(() => studentStore.students)

// 获取学生积分
const getStudentPoints = (studentId: number) => {
  const summary = pointStore.studentPoints.find(item => item.student_id === studentId)
  return summary ? summary.total_points : 0
}

// 方法
const refreshData = async () => {
  await classStore.fetchClasses()
  if (selectedClassId.value) {
    await loadClassStudents()
    await loadStudentPoints()
  }
}

const handleClassChange = async () => {
  selectedStudent.value = null
  if (selectedClassId.value) {
    await loadClassStudents()
    await loadStudentPoints()
  }
}

const loadClassStudents = async () => {
  if (!selectedClassId.value) return
  loading.value = true
  try {
    await studentStore.fetchStudents({ class_id: selectedClassId.value })
  } catch (error) {
    ElMessage.error('加载学生列表失败')
  } finally {
    loading.value = false
  }
}

const loadStudentPoints = async () => {
  if (!selectedClassId.value) return
  try {
    await pointStore.fetchStudentPointsSummary(selectedClassId.value)
  } catch (error) {
    ElMessage.error('加载学生积分失败')
  }
}

const selectStudent = (student: StudentListItem) => {
  selectedStudent.value = student
  customPoints.value = 0
  customReason.value = ''
}

const closePointsPanel = () => {
  selectedStudent.value = null
  customPoints.value = 0
  customReason.value = ''
}

const addPoints = async (points: number) => {
  if (!selectedStudent.value || !selectedClassId.value) return
  await applyPoints(points, `快速加分${points}分`)
}

const subtractPoints = async (points: number) => {
  if (!selectedStudent.value || !selectedClassId.value) return
  await applyPoints(-points, `快速减分${points}分`)
}

const applyCustomPoints = async () => {
  if (!selectedStudent.value || !selectedClassId.value || !customReason.value) return
  await applyPoints(customPoints.value, customReason.value)
  customPoints.value = 0
  customReason.value = ''
}

const applyPoints = async (points: number, reason: string) => {
  if (!selectedStudent.value || !selectedClassId.value) return
  
  try {
    const result = await pointStore.createPoint({
      student_id: selectedStudent.value.id,
      class_id: selectedClassId.value,
      points: points,
      type: points > 0 ? 'reward' : 'penalty',
      reason: reason,
      given_date: new Date().toISOString().split('T')[0]
    })
    
    if (result.success) {
      ElMessage.success(`${points > 0 ? '加分' : '减分'}成功`)
      // 更新积分显示
      await loadStudentPoints()
    } else {
      ElMessage.error(result.error || `${points > 0 ? '加分' : '减分'}失败`)
    }
  } catch (error) {
    ElMessage.error(`${points > 0 ? '加分' : '减分'}失败`)
  }
}

// 生命周期
onMounted(async () => {
  await classStore.fetchClasses()
})
</script>

<style scoped>
.student-points-manager {
  padding: 20px;
}

.management-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.management-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.class-selector {
  margin-bottom: 20px;
}

.student-cards-container {
  margin-top: 20px;
}

.student-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.student-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s;
  background: white;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.student-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.15);
  border-color: #409eff;
}

.student-info .student-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #303133;
}

.student-info .student-id {
  font-size: 14px;
  color: #909399;
  margin-bottom: 12px;
}

.student-info .student-points {
  display: flex;
  align-items: center;
  gap: 8px;
}

.points-label {
  font-size: 14px;
  color: #606266;
}

.points-value {
  font-size: 18px;
  font-weight: 600;
}

.points-value.positive {
  color: #67c23a;
}

.points-value.negative {
  color: #f56c6c;
}

.points-panel {
  margin-top: 30px;
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: white;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.panel-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.points-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 30px;
}

.action-group {
  display: flex;
  flex-direction: column;
}

.action-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 15px;
  color: #606266;
}

.quick-points {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.quick-points .el-button {
  min-width: 60px;
}

.custom-points-form {
  display: flex;
  flex-direction: column;
}

.custom-buttons {
  margin-top: 15px;
}

@media (max-width: 768px) {
  .student-cards {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
  
  .points-actions {
    grid-template-columns: 1fr;
  }
}
</style>