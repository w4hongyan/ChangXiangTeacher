<template>
  <Layout>
    <div class="schedule-container">
    <div class="page-header">
      <h2>课程表管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon>
          添加课程
        </el-button>
        <el-button @click="importSchedule">
          <el-icon><Upload /></el-icon>
          导入课程表
        </el-button>
        <el-button @click="exportSchedule">
          <el-icon><Download /></el-icon>
          导出课程表
        </el-button>
      </div>
    </div>

    <!-- 课程表视图 -->
    <div class="schedule-view">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>课程表</span>
            <div class="view-controls">
              <el-select v-model="currentWeek" placeholder="选择周次" style="width: 120px">
                <el-option
                  v-for="week in 20"
                  :key="week"
                  :label="`第${week}周`"
                  :value="week"
                />
              </el-select>
              <el-button-group>
                <el-button :type="viewMode === 'week' ? 'primary' : ''" @click="viewMode = 'week'">周视图</el-button>
                <el-button :type="viewMode === 'day' ? 'primary' : ''" @click="viewMode = 'day'">日视图</el-button>
              </el-button-group>
            </div>
          </div>
        </template>

        <div class="schedule-table">
          <table class="timetable">
            <thead>
              <tr>
                <th class="time-header">时间</th>
                <th v-for="day in weekDays" :key="day.value" class="day-header">
                  {{ day.label }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="period in timePeriods" :key="period.id">
                <td class="time-cell">
                  <div class="period-info">
                    <div class="period-name">{{ period.name }}</div>
                    <div class="period-time">{{ period.startTime }}-{{ period.endTime }}</div>
                  </div>
                </td>
                <td v-for="day in weekDays" :key="day.value" class="schedule-cell">
                  <div 
                    class="course-slot"
                    :class="{ 'has-course': getCourse(day.value, period.id) }"
                    @click="handleCellClick(day.value, period.id)"
                  >
                    <div v-if="getCourse(day.value, period.id)" class="course-info">
                      <div class="course-name">{{ getCourse(day.value, period.id)?.subject }}</div>
                      <div class="course-teacher">{{ getCourse(day.value, period.id)?.teacher }}</div>
                      <div class="course-location">{{ getCourse(day.value, period.id)?.location }}</div>
                    </div>
                    <div v-else class="empty-slot">
                      <el-icon><Plus /></el-icon>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </el-card>
    </div>

    <!-- 添加/编辑课程对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingCourse ? '编辑课程' : '添加课程'"
      width="500px"
    >
      <el-form :model="courseForm" :rules="courseRules" ref="courseFormRef" label-width="80px">
        <el-form-item label="课程名称" prop="subject">
          <el-input v-model="courseForm.subject" placeholder="请输入课程名称" />
        </el-form-item>
        <el-form-item label="任课教师" prop="teacher">
          <el-input v-model="courseForm.teacher" placeholder="请输入任课教师" />
        </el-form-item>
        <el-form-item label="上课地点" prop="location">
          <el-input v-model="courseForm.location" placeholder="请输入上课地点" />
        </el-form-item>
        <el-form-item label="星期" prop="dayOfWeek">
          <el-select v-model="courseForm.dayOfWeek" placeholder="选择星期">
            <el-option
              v-for="day in weekDays"
              :key="day.value"
              :label="day.label"
              :value="day.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="节次" prop="period">
          <el-select v-model="courseForm.period" placeholder="选择节次">
            <el-option
              v-for="period in timePeriods"
              :key="period.id"
              :label="period.name"
              :value="period.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="周次" prop="weeks">
          <el-checkbox-group v-model="courseForm.weeks">
            <el-checkbox v-for="week in 20" :key="week" :label="week">
              第{{ week }}周
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="courseForm.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="saveCourse">保存</el-button>
      </template>
    </el-dialog>

    <!-- 课程详情对话框 -->
    <el-dialog v-model="showDetailDialog" title="课程详情" width="400px">
      <div v-if="selectedCourse" class="course-detail">
        <div class="detail-item">
          <label>课程名称：</label>
          <span>{{ selectedCourse.subject }}</span>
        </div>
        <div class="detail-item">
          <label>任课教师：</label>
          <span>{{ selectedCourse.teacher }}</span>
        </div>
        <div class="detail-item">
          <label>上课地点：</label>
          <span>{{ selectedCourse.location }}</span>
        </div>
        <div class="detail-item">
          <label>上课时间：</label>
          <span>{{ getTimeText(selectedCourse.dayOfWeek, selectedCourse.period) }}</span>
        </div>
        <div class="detail-item">
          <label>周次：</label>
          <span>{{ selectedCourse.weeks?.join('、') }}周</span>
        </div>
        <div class="detail-item" v-if="selectedCourse.notes">
          <label>备注：</label>
          <span>{{ selectedCourse.notes }}</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="editCourse(selectedCourse)">编辑</el-button>
        <el-button type="danger" @click="deleteCourse(selectedCourse.id)">删除</el-button>
        <el-button @click="showDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Upload, Download } from '@element-plus/icons-vue'
import Layout from './Layout.vue'

interface Schedule {
  id?: number
  classId: number
  subject: string
  teacher: string
  location: string
  dayOfWeek: number
  period: number
  weeks: number[]
  notes?: string
  createdAt?: string
  updatedAt?: string
}

const schedules = ref<Schedule[]>([])
const showAddDialog = ref(false)
const showDetailDialog = ref(false)
const editingCourse = ref<Schedule | null>(null)
const selectedCourse = ref<Schedule | null>(null)
const currentWeek = ref(1)
const viewMode = ref('week')
const courseFormRef = ref()

const courseForm = reactive<Schedule>({
  classId: 1, // 当前班级ID
  subject: '',
  teacher: '',
  location: '',
  dayOfWeek: 1,
  period: 1,
  weeks: [],
  notes: ''
})

const courseRules = {
  subject: [{ required: true, message: '请输入课程名称', trigger: 'blur' }],
  teacher: [{ required: true, message: '请输入任课教师', trigger: 'blur' }],
  location: [{ required: true, message: '请输入上课地点', trigger: 'blur' }],
  dayOfWeek: [{ required: true, message: '请选择星期', trigger: 'change' }],
  period: [{ required: true, message: '请选择节次', trigger: 'change' }],
  weeks: [{ required: true, message: '请选择周次', trigger: 'change' }]
}

const weekDays = [
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 }
]

const timePeriods = [
  { id: 1, name: '第1节', startTime: '08:00', endTime: '08:45' },
  { id: 2, name: '第2节', startTime: '08:55', endTime: '09:40' },
  { id: 3, name: '第3节', startTime: '10:00', endTime: '10:45' },
  { id: 4, name: '第4节', startTime: '10:55', endTime: '11:40' },
  { id: 5, name: '第5节', startTime: '14:00', endTime: '14:45' },
  { id: 6, name: '第6节', startTime: '14:55', endTime: '15:40' },
  { id: 7, name: '第7节', startTime: '16:00', endTime: '16:45' },
  { id: 8, name: '第8节', startTime: '16:55', endTime: '17:40' }
]

const getCourse = (dayOfWeek: number, period: number) => {
  return schedules.value.find(s => 
    s.dayOfWeek === dayOfWeek && 
    s.period === period && 
    s.weeks?.includes(currentWeek.value)
  )
}

const getTimeText = (dayOfWeek: number, period: number) => {
  const day = weekDays.find(d => d.value === dayOfWeek)?.label
  const time = timePeriods.find(p => p.id === period)
  return `${day} ${time?.name} (${time?.startTime}-${time?.endTime})`
}

const handleCellClick = (dayOfWeek: number, period: number) => {
  const course = getCourse(dayOfWeek, period)
  if (course) {
    selectedCourse.value = course
    showDetailDialog.value = true
  } else {
    // 添加新课程
    courseForm.dayOfWeek = dayOfWeek
    courseForm.period = period
    courseForm.weeks = [currentWeek.value]
    showAddDialog.value = true
  }
}

const editCourse = (course: Schedule) => {
  editingCourse.value = course
  Object.assign(courseForm, course)
  showDetailDialog.value = false
  showAddDialog.value = true
}

const saveCourse = async () => {
  try {
    await courseFormRef.value.validate()
    
    if (editingCourse.value) {
      // 更新课程
      const result = await window.electronAPI.schedules.update(editingCourse.value.id, courseForm)
      if (result.success) {
        ElMessage.success('课程更新成功')
        loadSchedules()
      } else {
        ElMessage.error('课程更新失败')
      }
    } else {
      // 添加课程
      const result = await window.electronAPI.schedules.create(courseForm)
      if (result.success) {
        ElMessage.success('课程添加成功')
        loadSchedules()
      } else {
        ElMessage.error('课程添加失败')
      }
    }
    
    showAddDialog.value = false
    resetForm()
  } catch (error) {
    console.error('保存课程失败:', error)
  }
}

const deleteCourse = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这门课程吗？', '确认删除', {
      type: 'warning'
    })
    
    const result = await window.electronAPI.schedules.delete(id)
    if (result.success) {
      ElMessage.success('课程删除成功')
      loadSchedules()
      showDetailDialog.value = false
    } else {
      ElMessage.error('课程删除失败')
    }
  } catch (error) {
    // 用户取消删除
  }
}

const resetForm = () => {
  Object.assign(courseForm, {
    classId: 1,
    subject: '',
    teacher: '',
    location: '',
    dayOfWeek: 1,
    period: 1,
    weeks: [],
    notes: ''
  })
  editingCourse.value = null
}

const loadSchedules = async () => {
  try {
    const result = await window.electronAPI.schedules.list({ classId: 1 })
    if (result.success) {
      schedules.value = result.data
    }
  } catch (error) {
    console.error('加载课程表失败:', error)
  }
}

const importSchedule = () => {
  ElMessage.info('导入功能开发中...')
}

const exportSchedule = () => {
  ElMessage.info('导出功能开发中...')
}

onMounted(() => {
  loadSchedules()
})
</script>

<style scoped>
.schedule-container {
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
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.view-controls {
  display: flex;
  gap: 10px;
  align-items: center;
}

.schedule-table {
  overflow-x: auto;
}

.timetable {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

.timetable th,
.timetable td {
  border: 1px solid #e4e7ed;
  text-align: center;
}

.time-header,
.day-header {
  background: #f5f7fa;
  padding: 12px 8px;
  font-weight: 600;
  color: #606266;
}

.time-cell {
  background: #fafafa;
  width: 120px;
  padding: 8px;
}

.period-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.period-name {
  font-weight: 600;
  color: #303133;
}

.period-time {
  font-size: 12px;
  color: #909399;
}

.schedule-cell {
  width: 150px;
  height: 80px;
  padding: 4px;
}

.course-slot {
  height: 100%;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.course-slot:hover {
  background: #f0f9ff;
}

.course-slot.has-course {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.course-slot.has-course:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.course-info {
  text-align: center;
  padding: 4px;
}

.course-name {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 2px;
}

.course-teacher,
.course-location {
  font-size: 12px;
  opacity: 0.9;
}

.empty-slot {
  color: #c0c4cc;
  font-size: 20px;
}

.empty-slot:hover {
  color: #409eff;
}

.course-detail {
  padding: 10px 0;
}

.detail-item {
  display: flex;
  margin-bottom: 12px;
  align-items: flex-start;
}

.detail-item label {
  width: 80px;
  font-weight: 600;
  color: #606266;
  flex-shrink: 0;
}

.detail-item span {
  color: #303133;
  flex: 1;
}
</style>