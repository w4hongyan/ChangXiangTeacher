<template>
  <div class="calendar-container">
    <el-card class="calendar-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-button @click="prevMonth">上一月</el-button>
            <el-button @click="nextMonth">下一月</el-button>
            <el-button type="primary" @click="today">今天</el-button>
            <el-date-picker
              v-model="currentDate"
              type="month"
              placeholder="选择月份"
              format="YYYY年MM月"
              value-format="YYYY-MM"
              @change="handleMonthChange"
              style="width: 150px; margin-left: 10px;"
            />
          </div>
          <div class="header-right">
            <el-button type="primary" @click="showSemesterForm">学期管理</el-button>
            <el-button type="primary" @click="showEventForm">添加事件</el-button>
          </div>
        </div>
      </template>
      
      <div class="calendar-content">
        <!-- 倒计时显示 -->
        <div v-if="currentSemester" class="countdown-section">
          <el-card class="countdown-card">
            <div class="countdown-title">{{ currentSemester.name }} 倒计时</div>
            <div class="countdown-display">
              <span class="countdown-number">{{ daysUntilEnd }}</span>
              <span class="countdown-label">天</span>
            </div>
            <div class="semester-dates">
              {{ formatDate(currentSemester.start_date) }} - {{ formatDate(currentSemester.end_date) }}
            </div>
          </el-card>
        </div>
        
        <!-- 日历表格 -->
        <div class="calendar-grid">
          <!-- 星期标题 -->
          <div class="calendar-header">
            <div class="calendar-cell calendar-weekday" v-for="day in weekdays" :key="day">
              {{ day }}
            </div>
          </div>
          
          <!-- 日期单元格 -->
          <div 
            class="calendar-cell calendar-day" 
            v-for="day in calendarDays" 
            :key="day.date"
            :class="{
              'today': day.isToday,
              'other-month': day.isOtherMonth,
              'has-events': day.events && day.events.length > 0
            }"
            @click="selectDate(day)"
          >
            <div class="day-number">{{ day.day }}</div>
            <div class="day-events">
              <div 
                v-for="event in day.events" 
                :key="event.id"
                class="event-dot"
                :style="{ backgroundColor: event.color }"
                :title="event.title"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </el-card>
    
    <!-- 学期管理对话框 -->
    <el-dialog
      v-model="semesterFormVisible"
      title="学期管理"
      width="600px"
    >
      <el-tabs v-model="semesterActiveTab">
        <el-tab-pane label="学期列表" name="list">
          <el-table :data="semesters" style="width: 100%">
            <el-table-column prop="name" label="学期名称" />
            <el-table-column prop="year" label="年份" />
            <el-table-column prop="start_date" label="开始日期">
              <template #default="scope">
                {{ formatDate(scope.row.start_date) }}
              </template>
            </el-table-column>
            <el-table-column prop="end_date" label="结束日期">
              <template #default="scope">
                {{ formatDate(scope.row.end_date) }}
              </template>
            </el-table-column>
            <el-table-column label="状态">
              <template #default="scope">
                <el-tag :type="scope.row.is_current ? 'success' : 'info'">
                  {{ scope.row.is_current ? '当前学期' : '非当前' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="scope">
                <el-button 
                  v-if="!scope.row.is_current" 
                  size="small" 
                  @click="setCurrentSemester(scope.row.id)"
                >
                  设为当前
                </el-button>
                <el-button size="small" @click="editSemester(scope.row)">
                  编辑
                </el-button>
                <el-button size="small" type="danger" @click="deleteSemester(scope.row.id)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <div style="margin-top: 20px; text-align: right;">
            <el-button type="primary" @click="showSemesterCreateForm">添加学期</el-button>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="添加/编辑学期" name="form">
          <el-form
            ref="semesterFormRef"
            :model="semesterForm"
            :rules="semesterFormRules"
            label-width="100px"
          >
            <el-form-item label="学期名称" prop="name">
              <el-input v-model="semesterForm.name" placeholder="请输入学期名称" />
            </el-form-item>
            
            <el-form-item label="年份" prop="year">
              <el-input-number v-model="semesterForm.year" :min="2020" :max="2030" />
            </el-form-item>
            
            <el-form-item label="开始日期" prop="start_date">
              <el-date-picker
                v-model="semesterForm.start_date"
                type="date"
                placeholder="选择开始日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
            
            <el-form-item label="结束日期" prop="end_date">
              <el-date-picker
                v-model="semesterForm.end_date"
                type="date"
                placeholder="选择结束日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
            
            <el-form-item label="设为当前">
              <el-switch v-model="semesterForm.is_current" />
            </el-form-item>
          </el-form>
          
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="semesterActiveTab = 'list'">取消</el-button>
              <el-button type="primary" @click="saveSemester">保存</el-button>
            </span>
          </template>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
    
    <!-- 事件管理对话框 -->
    <el-dialog
      v-model="eventFormVisible"
      :title="editingEvent ? '编辑事件' : '添加事件'"
      width="500px"
    >
      <el-form
        ref="eventFormRef"
        :model="eventForm"
        :rules="eventFormRules"
        label-width="80px"
      >
        <el-form-item label="事件标题" prop="title">
          <el-input v-model="eventForm.title" placeholder="请输入事件标题" />
        </el-form-item>
        
        <el-form-item label="事件日期" prop="event_date">
          <el-date-picker
            v-model="eventForm.event_date"
            type="date"
            placeholder="选择事件日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="事件类型">
          <el-select v-model="eventForm.event_type" placeholder="请选择事件类型" style="width: 100%">
            <el-option label="普通事件" value="event" />
            <el-option label="考试" value="exam" />
            <el-option label="假期" value="holiday" />
            <el-option label="活动" value="activity" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="事件颜色">
          <el-color-picker v-model="eventForm.color" />
        </el-form-item>
        
        <el-form-item label="是否假期">
          <el-switch v-model="eventForm.is_holiday" />
        </el-form-item>
        
        <el-form-item label="描述">
          <el-input 
            v-model="eventForm.description" 
            type="textarea"
            placeholder="请输入事件描述"
            :rows="3"
          />
        </el-form-item>
        
        <el-form-item label="关联学期">
          <el-select 
            v-model="eventForm.semester_id" 
            placeholder="请选择关联学期" 
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="item in semesters"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="eventFormVisible = false">取消</el-button>
          <el-button type="primary" @click="saveEvent">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCalendarStore } from '../stores/calendar'
import type { Semester, CalendarEvent, SemesterFormData, CalendarEventFormData } from '../types/calendar'

const calendarStore = useCalendarStore()

// 响应式数据
const currentDate = ref(new Date().toISOString().slice(0, 7)) // YYYY-MM格式
const selectedDate = ref('')
const semesterFormVisible = ref(false)
const eventFormVisible = ref(false)
const semesterActiveTab = ref('list')
const editingSemester = ref<Semester | null>(null)
const editingEvent = ref<CalendarEvent | null>(null)

// 表单引用
const semesterFormRef = ref()
const eventFormRef = ref()

// 表单数据
const semesterForm = reactive<SemesterFormData>({
  name: '',
  start_date: '',
  end_date: '',
  year: new Date().getFullYear(),
  is_current: false
})

const eventForm = reactive<CalendarEventFormData>({
  title: '',
  description: '',
  event_date: '',
  event_type: 'event',
  color: '#409EFF',
  is_holiday: false,
  semester_id: null
})

// 表单验证规则
const semesterFormRules = {
  name: [{ required: true, message: '请输入学期名称', trigger: 'blur' }],
  start_date: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  end_date: [{ required: true, message: '请选择结束日期', trigger: 'change' }]
}

const eventFormRules = {
  title: [{ required: true, message: '请输入事件标题', trigger: 'blur' }],
  event_date: [{ required: true, message: '请选择事件日期', trigger: 'change' }]
}

// 计算属性
const weekdays = ['日', '一', '二', '三', '四', '五', '六']

const calendarDays = computed(() => {
  const year = parseInt(currentDate.value.split('-')[0])
  const month = parseInt(currentDate.value.split('-')[1]) - 1 // JS月份从0开始
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDay.getDay()) // 从周日开始
  
  const days = []
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  
  for (let i = 0; i < 42; i++) { // 6行7列
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]
    const isOtherMonth = date.getMonth() !== month
    const isToday = dateStr === todayStr
    
    // 查找当天的事件
    const dayEvents = calendarStore.events.filter(event => event.event_date === dateStr)
    
    days.push({
      date: dateStr,
      day: date.getDate(),
      isOtherMonth,
      isToday,
      events: dayEvents
    })
  }
  
  return days
})

const semesters = computed(() => calendarStore.semesters)
const currentSemester = computed(() => calendarStore.currentSemester)

const daysUntilEnd = computed(() => {
  if (!currentSemester.value) return 0
  
  const today = new Date()
  const endDate = new Date(currentSemester.value.end_date)
  
  // 计算两个日期之间的天数差
  const diffTime = endDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return Math.max(0, diffDays)
})

// 方法
const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

const prevMonth = () => {
  const [year, month] = currentDate.value.split('-').map(Number)
  const prevMonthDate = new Date(year, month - 2) // month-1-1 = month-2
  currentDate.value = prevMonthDate.toISOString().slice(0, 7)
}

const nextMonth = () => {
  const [year, month] = currentDate.value.split('-').map(Number)
  const nextMonthDate = new Date(year, month) // month-1+1 = month
  currentDate.value = nextMonthDate.toISOString().slice(0, 7)
}

const today = () => {
  currentDate.value = new Date().toISOString().slice(0, 7)
}

const handleMonthChange = (val: string) => {
  currentDate.value = val
}

const selectDate = (day: any) => {
  selectedDate.value = day.date
  // 设置事件表单的默认日期
  eventForm.event_date = day.date
  eventFormVisible.value = true
}

const showSemesterForm = () => {
  semesterFormVisible.value = true
  semesterActiveTab.value = 'list'
}

const showSemesterCreateForm = () => {
  editingSemester.value = null
  semesterForm.name = ''
  semesterForm.start_date = ''
  semesterForm.end_date = ''
  semesterForm.year = new Date().getFullYear()
  semesterForm.is_current = false
  semesterActiveTab.value = 'form'
}

const editSemester = (semester: Semester) => {
  editingSemester.value = semester
  semesterForm.name = semester.name
  semesterForm.start_date = semester.start_date
  semesterForm.end_date = semester.end_date
  semesterForm.year = semester.year
  semesterForm.is_current = semester.is_current
  semesterActiveTab.value = 'form'
}

const saveSemester = async () => {
  if (!semesterFormRef.value) return
  
  // @ts-ignore
  await semesterFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      let result
      if (editingSemester.value) {
        // 更新学期
        result = await calendarStore.updateSemester(editingSemester.value.id, { ...semesterForm })
      } else {
        // 创建学期
        result = await calendarStore.createSemester({ ...semesterForm })
      }
      
      if (result.success) {
        ElMessage.success(editingSemester.value ? '更新成功' : '创建成功')
        semesterActiveTab.value = 'list'
      } else {
        ElMessage.error(result.error || (editingSemester.value ? '更新失败' : '创建失败'))
      }
    }
  })
}

const deleteSemester = async (id: number) => {
  ElMessageBox.confirm('确定要删除这个学期吗？', '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    const result = await calendarStore.deleteSemester(id)
    if (result.success) {
      ElMessage.success('删除成功')
    } else {
      ElMessage.error(result.error || '删除失败')
    }
  }).catch(() => {
    // 用户取消删除
  })
}

const setCurrentSemester = async (id: number) => {
  const result = await calendarStore.setCurrentSemester(id)
  if (result.success) {
    ElMessage.success('设置成功')
  } else {
    ElMessage.error(result.error || '设置失败')
  }
}

const showEventForm = () => {
  editingEvent.value = null
  eventForm.title = ''
  eventForm.description = ''
  eventForm.event_date = selectedDate.value || new Date().toISOString().split('T')[0]
  eventForm.event_type = 'event'
  eventForm.color = '#409EFF'
  eventForm.is_holiday = false
  eventForm.semester_id = currentSemester.value?.id || null
  eventFormVisible.value = true
}

const saveEvent = async () => {
  if (!eventFormRef.value) return
  
  // @ts-ignore
  await eventFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      let result
      if (editingEvent.value) {
        // 更新事件
        result = await calendarStore.updateEvent(editingEvent.value.id, { ...eventForm })
      } else {
        // 创建事件
        result = await calendarStore.createEvent({ ...eventForm })
      }
      
      if (result.success) {
        ElMessage.success(editingEvent.value ? '更新成功' : '创建成功')
        eventFormVisible.value = false
      } else {
        ElMessage.error(result.error || (editingEvent.value ? '更新失败' : '创建失败'))
      }
    }
  })
}

// 监听当前日期变化，加载对应月份的事件
watch(currentDate, async (newDate) => {
  const [year, month] = newDate.split('-').map(Number)
  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]
  
  await calendarStore.fetchEventsByDateRange(startDate, endDate)
})

// 初始化数据
onMounted(async () => {
  await calendarStore.fetchSemesters()
  await calendarStore.fetchCurrentSemester()
  
  // 加载当前月份的事件
  const today = new Date()
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]
  
  await calendarStore.fetchEventsByDateRange(startDate, endDate)
})
</script>

<style scoped>
.calendar-container {
  padding: 20px;
}

.calendar-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left, .header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.countdown-section {
  margin-bottom: 20px;
}

.countdown-card {
  text-align: center;
}

.countdown-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
}

.countdown-display {
  display: flex;
  justify-content: center;
  align-items: baseline;
  gap: 5px;
  margin-bottom: 10px;
}

.countdown-number {
  font-size: 36px;
  font-weight: bold;
  color: #409EFF;
}

.countdown-label {
  font-size: 16px;
  color: #666;
}

.semester-dates {
  color: #999;
  font-size: 14px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background-color: #e6e6e6;
  border: 1px solid #e6e6e6;
}

.calendar-header {
  display: contents;
}

.calendar-cell {
  background-color: #fff;
  padding: 10px;
  min-height: 100px;
  position: relative;
}

.calendar-weekday {
  background-color: #f5f7fa;
  text-align: center;
  font-weight: bold;
  padding: 10px 0;
  min-height: auto;
}

.calendar-day {
  cursor: pointer;
  transition: background-color 0.2s;
}

.calendar-day:hover {
  background-color: #f5f7fa;
}

.calendar-day.today {
  background-color: #ecf5ff;
  border: 1px solid #409EFF;
}

.calendar-day.other-month {
  background-color: #fafafa;
  color: #ccc;
}

.day-number {
  font-weight: bold;
  margin-bottom: 5px;
}

.day-events {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}

.event-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 2px;
}

.dialog-footer {
  text-align: right;
}
</style>