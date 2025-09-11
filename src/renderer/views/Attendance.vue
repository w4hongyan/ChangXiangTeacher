<template>
  <Layout>
    <div class="attendance-container">
      <div class="page-header">
        <h2>班级点名</h2>
        <div class="header-actions">
          <el-select v-model="selectedClassId" placeholder="选择班级" @change="loadStudents">
            <el-option
              v-for="cls in classes"
              :key="cls.id"
              :label="`${cls.grade}${cls.class_number}班`"
              :value="cls.id"
            />
          </el-select>
          <el-button type="primary" @click="startAttendance" :disabled="!selectedClassId">
            <el-icon><VideoPlay /></el-icon>
            开始点名
          </el-button>
          <el-button @click="showHistoryDialog = true">
            <el-icon><Clock /></el-icon>
            考勤记录
          </el-button>
          <el-button @click="exportAttendance">
            <el-icon><Download /></el-icon>
            导出考勤
          </el-button>
        </div>
      </div>

      <!-- 快速点名模式 -->
      <div v-if="attendanceMode === 'quick'" class="quick-attendance">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>快速点名 - {{ currentClassName }}</span>
              <div class="attendance-stats">
                <el-tag type="success">出勤: {{ attendanceStats.present }}</el-tag>
                <el-tag type="danger">缺勤: {{ attendanceStats.absent }}</el-tag>
                <el-tag type="warning">请假: {{ attendanceStats.leave }}</el-tag>
                <el-tag type="info">迟到: {{ attendanceStats.late }}</el-tag>
              </div>
            </div>
          </template>

          <div class="students-grid">
            <div
              v-for="student in students"
              :key="student.id"
              class="student-card"
              :class="{
                'present': getAttendanceStatus(student.id) === 'present',
                'absent': getAttendanceStatus(student.id) === 'absent',
                'leave': getAttendanceStatus(student.id) === 'leave',
                'late': getAttendanceStatus(student.id) === 'late'
              }"
              @click="toggleAttendance(student.id)"
            >
              <div class="student-avatar">
                <el-avatar :size="50" :src="student.avatar">
                  {{ student.name.charAt(0) }}
                </el-avatar>
              </div>
              <div class="student-info">
                <div class="student-name">{{ student.name }}</div>
                <div class="student-number">{{ student.student_number }}</div>
              </div>
              <div class="attendance-status">
                <el-icon v-if="getAttendanceStatus(student.id) === 'present'" class="status-icon present">
                  <Check />
                </el-icon>
                <el-icon v-else-if="getAttendanceStatus(student.id) === 'absent'" class="status-icon absent">
                  <Close />
                </el-icon>
                <el-icon v-else-if="getAttendanceStatus(student.id) === 'leave'" class="status-icon leave">
                  <Warning />
                </el-icon>
                <el-icon v-else-if="getAttendanceStatus(student.id) === 'late'" class="status-icon late">
                  <Clock />
                </el-icon>
                <el-icon v-else class="status-icon pending">
                  <QuestionFilled />
                </el-icon>
              </div>
            </div>
          </div>

          <div class="attendance-actions">
            <el-button-group>
              <el-button @click="markAllPresent">
                <el-icon><Check /></el-icon>
                全部出勤
              </el-button>
              <el-button @click="markAllAbsent">
                <el-icon><Close /></el-icon>
                全部缺勤
              </el-button>
              <el-button @click="resetAttendance">
                <el-icon><RefreshLeft /></el-icon>
                重置
              </el-button>
            </el-button-group>
            
            <div class="save-actions">
              <el-button type="success" @click="saveAttendance">
                <el-icon><Check /></el-icon>
                保存考勤
              </el-button>
              <el-button @click="cancelAttendance">
                取消
              </el-button>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 详细点名模式 -->
      <div v-else-if="attendanceMode === 'detailed'" class="detailed-attendance">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>详细点名 - {{ currentClassName }}</span>
              <el-progress 
                :percentage="attendanceProgress" 
                :stroke-width="8"
                :show-text="false"
                class="progress-bar"
              />
              <span class="progress-text">{{ currentStudentIndex + 1 }} / {{ students.length }}</span>
            </div>
          </template>

          <div v-if="currentStudent" class="current-student">
            <div class="student-display">
              <el-avatar :size="120" :src="currentStudent.avatar">
                {{ currentStudent.name.charAt(0) }}
              </el-avatar>
              <div class="student-details">
                <h3 class="student-name">{{ currentStudent.name }}</h3>
                <p class="student-number">学号: {{ currentStudent.student_number }}</p>
                <p class="student-seat">座位: {{ currentStudent.seat_row }}排{{ currentStudent.seat_col }}列</p>
              </div>
            </div>

            <div class="attendance-buttons">
              <el-button 
                type="success" 
                size="large" 
                @click="markStudent('present')"
                class="attendance-btn"
              >
                <el-icon><Check /></el-icon>
                出勤
              </el-button>
              <el-button 
                type="danger" 
                size="large" 
                @click="markStudent('absent')"
                class="attendance-btn"
              >
                <el-icon><Close /></el-icon>
                缺勤
              </el-button>
              <el-button 
                type="warning" 
                size="large" 
                @click="markStudent('leave')"
                class="attendance-btn"
              >
                <el-icon><Warning /></el-icon>
                请假
              </el-button>
              <el-button 
                type="info" 
                size="large" 
                @click="markStudent('late')"
                class="attendance-btn"
              >
                <el-icon><Clock /></el-icon>
                迟到
              </el-button>
            </div>

            <div class="navigation-buttons">
              <el-button @click="previousStudent" :disabled="currentStudentIndex === 0">
                <el-icon><ArrowLeft /></el-icon>
                上一个
              </el-button>
              <el-button @click="nextStudent" :disabled="currentStudentIndex === students.length - 1">
                下一个
                <el-icon><ArrowRight /></el-icon>
              </el-button>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 考勤统计 -->
      <div v-if="attendanceMode !== 'none'" class="attendance-summary">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card class="stat-card present">
              <div class="stat-content">
                <div class="stat-number">{{ attendanceStats.present }}</div>
                <div class="stat-label">出勤</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card absent">
              <div class="stat-content">
                <div class="stat-number">{{ attendanceStats.absent }}</div>
                <div class="stat-label">缺勤</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card leave">
              <div class="stat-content">
                <div class="stat-number">{{ attendanceStats.leave }}</div>
                <div class="stat-label">请假</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card late">
              <div class="stat-content">
                <div class="stat-number">{{ attendanceStats.late }}</div>
                <div class="stat-label">迟到</div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 点名模式选择对话框 -->
      <el-dialog v-model="showModeDialog" title="选择点名模式" width="500px">
        <div class="mode-selection">
          <div class="mode-option" @click="selectMode('quick')">
            <el-icon class="mode-icon"><Grid /></el-icon>
            <h3>快速点名</h3>
            <p>一次性查看所有学生，快速标记考勤状态</p>
          </div>
          <div class="mode-option" @click="selectMode('detailed')">
            <el-icon class="mode-icon"><User /></el-icon>
            <h3>详细点名</h3>
            <p>逐个点名学生，适合正式场合</p>
          </div>
        </div>
      </el-dialog>

      <!-- 考勤记录对话框 -->
      <el-dialog v-model="showHistoryDialog" title="考勤记录" width="800px">
        <div class="history-filters">
          <el-date-picker
            v-model="historyDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            @change="loadAttendanceHistory"
          />
        </div>
        
        <el-table :data="attendanceHistory" stripe>
          <el-table-column prop="date" label="日期" width="120" />
          <el-table-column prop="student_name" label="学生姓名" width="120" />
          <el-table-column prop="status" label="考勤状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="notes" label="备注" />
          <el-table-column prop="created_at" label="记录时间" width="160" />
        </el-table>
      </el-dialog>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  VideoPlay,
  Clock,
  Download,
  Check,
  Close,
  Warning,
  QuestionFilled,
  RefreshLeft,
  ArrowLeft,
  ArrowRight,
  Grid,
  User
} from '@element-plus/icons-vue'
import Layout from './Layout.vue'

interface Student {
  id: number
  name: string
  student_number: string
  avatar?: string
  seat_row?: number
  seat_col?: number
}

interface Class {
  id: number
  name: string
  grade: string
  class_number: string
}

interface AttendanceRecord {
  student_id: number
  status: 'present' | 'absent' | 'leave' | 'late'
  notes?: string
}

interface AttendanceHistory {
  id: number
  date: string
  student_name: string
  status: string
  notes?: string
  created_at: string
}

const classes = ref<Class[]>([])
const students = ref<Student[]>([])
const selectedClassId = ref<number>()
const attendanceMode = ref<'none' | 'quick' | 'detailed'>('none')
const showModeDialog = ref(false)
const showHistoryDialog = ref(false)
const currentStudentIndex = ref(0)
const attendanceRecords = ref<Map<number, AttendanceRecord>>(new Map())
const attendanceHistory = ref<AttendanceHistory[]>([])
const historyDateRange = ref<[Date, Date]>()

const currentClassName = computed(() => {
  const cls = classes.value.find(c => c.id === selectedClassId.value)
  return cls ? `${cls.grade}${cls.class_number}班` : ''
})

const currentStudent = computed(() => {
  return students.value[currentStudentIndex.value]
})

const attendanceProgress = computed(() => {
  if (students.value.length === 0) return 0
  return Math.round(((currentStudentIndex.value + 1) / students.value.length) * 100)
})

const attendanceStats = computed(() => {
  const stats = { present: 0, absent: 0, leave: 0, late: 0 }
  attendanceRecords.value.forEach(record => {
    stats[record.status]++
  })
  return stats
})

const getAttendanceStatus = (studentId: number) => {
  return attendanceRecords.value.get(studentId)?.status || 'pending'
}

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    present: 'success',
    absent: 'danger',
    leave: 'warning',
    late: 'info'
  }
  return types[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    present: '出勤',
    absent: '缺勤',
    leave: '请假',
    late: '迟到'
  }
  return texts[status] || status
}

const loadClasses = async () => {
  try {
    const result = await window.electronAPI.classes.getAll()
    if (result.success) {
      classes.value = result.data
      if (classes.value.length > 0) {
        selectedClassId.value = classes.value[0].id
        loadStudents()
      }
    }
  } catch (error) {
    console.error('加载班级列表失败:', error)
  }
}

const loadStudents = async () => {
  if (!selectedClassId.value) return
  
  try {
    const result = await window.electronAPI.students.list({ class_id: selectedClassId.value })
    if (result.success) {
      students.value = result.data
      resetAttendanceRecords()
    }
  } catch (error) {
    console.error('加载学生列表失败:', error)
  }
}

const startAttendance = () => {
  if (!selectedClassId.value || students.value.length === 0) {
    ElMessage.warning('请先选择班级')
    return
  }
  showModeDialog.value = true
}

const selectMode = (mode: 'quick' | 'detailed') => {
  attendanceMode.value = mode
  showModeDialog.value = false
  resetAttendanceRecords()
  currentStudentIndex.value = 0
}

const resetAttendanceRecords = () => {
  attendanceRecords.value.clear()
}

const toggleAttendance = (studentId: number) => {
  const currentStatus = getAttendanceStatus(studentId)
  const statusCycle = ['pending', 'present', 'absent', 'leave', 'late']
  const currentIndex = statusCycle.indexOf(currentStatus)
  const nextIndex = (currentIndex + 1) % statusCycle.length
  const nextStatus = statusCycle[nextIndex]
  
  if (nextStatus === 'pending') {
    attendanceRecords.value.delete(studentId)
  } else {
    attendanceRecords.value.set(studentId, {
      student_id: studentId,
      status: nextStatus as any
    })
  }
}

const markStudent = (status: 'present' | 'absent' | 'leave' | 'late') => {
  if (!currentStudent.value) return
  
  attendanceRecords.value.set(currentStudent.value.id, {
    student_id: currentStudent.value.id,
    status
  })
  
  // 自动跳转到下一个学生
  if (currentStudentIndex.value < students.value.length - 1) {
    nextStudent()
  }
}

const previousStudent = () => {
  if (currentStudentIndex.value > 0) {
    currentStudentIndex.value--
  }
}

const nextStudent = () => {
  if (currentStudentIndex.value < students.value.length - 1) {
    currentStudentIndex.value++
  }
}

const markAllPresent = () => {
  students.value.forEach(student => {
    attendanceRecords.value.set(student.id, {
      student_id: student.id,
      status: 'present'
    })
  })
}

const markAllAbsent = () => {
  students.value.forEach(student => {
    attendanceRecords.value.set(student.id, {
      student_id: student.id,
      status: 'absent'
    })
  })
}

const resetAttendance = () => {
  attendanceRecords.value.clear()
}

const saveAttendance = async () => {
  if (attendanceRecords.value.size === 0) {
    ElMessage.warning('请至少标记一个学生的考勤状态')
    return
  }
  
  try {
    const records = Array.from(attendanceRecords.value.values())
    const result = await window.electronAPI.attendance.save({
      class_id: selectedClassId.value,
      date: new Date().toISOString().split('T')[0],
      records
    })
    
    if (result.success) {
      ElMessage.success('考勤记录保存成功')
      cancelAttendance()
    } else {
      ElMessage.error('保存失败: ' + result.error)
    }
  } catch (error) {
    console.error('保存考勤记录失败:', error)
    ElMessage.error('保存考勤记录失败')
  }
}

const cancelAttendance = () => {
  attendanceMode.value = 'none'
  resetAttendanceRecords()
  currentStudentIndex.value = 0
}

const exportAttendance = () => {
  ElMessage.info('导出功能开发中...')
}

const loadAttendanceHistory = async () => {
  try {
    const params: any = { class_id: selectedClassId.value }
    if (historyDateRange.value) {
      params.start_date = historyDateRange.value[0].toISOString().split('T')[0]
      params.end_date = historyDateRange.value[1].toISOString().split('T')[0]
    }
    
    const result = await window.electronAPI.attendance.history(params)
    if (result.success) {
      attendanceHistory.value = result.data
    }
  } catch (error) {
    console.error('加载考勤记录失败:', error)
  }
}

onMounted(() => {
  loadClasses()
})
</script>

<style scoped>
.attendance-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.attendance-stats {
  display: flex;
  gap: 8px;
}

.students-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.student-card {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  background: #fff;
}

.student-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.student-card.present {
  border-color: #67c23a;
  background: #f0f9ff;
}

.student-card.absent {
  border-color: #f56c6c;
  background: #fef0f0;
}

.student-card.leave {
  border-color: #e6a23c;
  background: #fdf6ec;
}

.student-card.late {
  border-color: #909399;
  background: #f4f4f5;
}

.student-avatar {
  margin-right: 12px;
}

.student-info {
  flex: 1;
}

.student-name {
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.student-number {
  font-size: 12px;
  color: #909399;
}

.attendance-status {
  font-size: 20px;
}

.status-icon.present {
  color: #67c23a;
}

.status-icon.absent {
  color: #f56c6c;
}

.status-icon.leave {
  color: #e6a23c;
}

.status-icon.late {
  color: #909399;
}

.status-icon.pending {
  color: #c0c4cc;
}

.attendance-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

.save-actions {
  display: flex;
  gap: 10px;
}

.current-student {
  text-align: center;
  padding: 20px;
}

.student-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 30px;
  margin-bottom: 30px;
}

.student-details {
  text-align: left;
}

.student-details .student-name {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.student-details p {
  margin: 4px 0;
  color: #606266;
}

.attendance-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 30px;
}

.attendance-btn {
  width: 120px;
  height: 60px;
  font-size: 16px;
}

.navigation-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.progress-bar {
  flex: 1;
  margin: 0 20px;
}

.progress-text {
  font-weight: 600;
  color: #606266;
}

.attendance-summary {
  margin-top: 20px;
}

.stat-card {
  text-align: center;
  border: none;
}

.stat-card.present {
  border-left: 4px solid #67c23a;
}

.stat-card.absent {
  border-left: 4px solid #f56c6c;
}

.stat-card.leave {
  border-left: 4px solid #e6a23c;
}

.stat-card.late {
  border-left: 4px solid #909399;
}

.stat-content {
  padding: 20px;
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.mode-selection {
  display: flex;
  gap: 20px;
}

.mode-option {
  flex: 1;
  padding: 30px 20px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.mode-option:hover {
  border-color: #409eff;
  background: #f0f9ff;
}

.mode-icon {
  font-size: 48px;
  color: #409eff;
  margin-bottom: 16px;
}

.mode-option h3 {
  margin: 0 0 12px 0;
  color: #303133;
}

.mode-option p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.history-filters {
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .students-grid {
    grid-template-columns: 1fr;
  }
  
  .student-display {
    flex-direction: column;
    gap: 20px;
  }
  
  .student-details {
    text-align: center;
  }
  
  .attendance-buttons {
    flex-wrap: wrap;
    gap: 10px;
  }
  
  .attendance-btn {
    width: 100px;
    height: 50px;
    font-size: 14px;
  }
  
  .mode-selection {
    flex-direction: column;
  }
}
</style>