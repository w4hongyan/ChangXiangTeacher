<template>
  <Layout>
    <div class="calendar-container">
    <div class="page-header">
      <h2>学期日历</h2>
      <div class="header-actions">
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon>
          添加事件
        </el-button>
        <el-button @click="showCountdownDialog = true">
          <el-icon><Timer /></el-icon>
          倒计时设置
        </el-button>
        <el-button @click="exportCalendar">
          <el-icon><Download /></el-icon>
          导出日历
        </el-button>
      </div>
    </div>

    <!-- 倒计时卡片 -->
    <div class="countdown-section" v-if="countdownEvents.length > 0">
      <el-row :gutter="20">
        <el-col :span="8" v-for="event in countdownEvents" :key="event.id">
          <el-card class="countdown-card" :class="`countdown-${event.type}`">
            <div class="countdown-content">
              <div class="countdown-title">{{ event.title }}</div>
              <div class="countdown-days">{{ getDaysUntil(event.date) }}</div>
              <div class="countdown-label">天后</div>
              <div class="countdown-date">{{ formatDate(event.date) }}</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 日历视图 -->
    <div class="calendar-view">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>{{ currentYear }}年{{ currentMonth }}月</span>
            <div class="calendar-controls">
              <el-button-group>
                <el-button @click="previousMonth">
                  <el-icon><ArrowLeft /></el-icon>
                </el-button>
                <el-button @click="nextMonth">
                  <el-icon><ArrowRight /></el-icon>
                </el-button>
              </el-button-group>
              <el-button @click="goToToday">今天</el-button>
              <el-select v-model="viewMode" style="width: 100px">
                <el-option label="月视图" value="month" />
                <el-option label="周视图" value="week" />
              </el-select>
            </div>
          </div>
        </template>

        <div class="calendar-grid">
          <!-- 星期标题 -->
          <div class="weekdays">
            <div v-for="day in weekdays" :key="day" class="weekday-header">
              {{ day }}
            </div>
          </div>

          <!-- 日期网格 -->
          <div class="days-grid">
            <div
              v-for="day in calendarDays"
              :key="day.date"
              class="day-cell"
              :class="{
                'other-month': !day.isCurrentMonth,
                'today': day.isToday,
                'selected': day.date === selectedDate
              }"
              @click="selectDate(day.date)"
            >
              <div class="day-number">{{ day.day }}</div>
              <div class="day-events">
                <div
                  v-for="event in getDayEvents(day.date)"
                  :key="event.id"
                  class="event-item"
                  :class="`event-${event.type}`"
                  @click.stop="showEventDetail(event)"
                >
                  <div class="event-title">{{ event.title }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 事件列表 -->
    <div class="events-list" v-if="selectedDateEvents.length > 0">
      <el-card>
        <template #header>
          <span>{{ formatDate(selectedDate) }} 的事件</span>
        </template>
        <div class="event-list-items">
          <div
            v-for="event in selectedDateEvents"
            :key="event.id"
            class="event-list-item"
            :class="`event-${event.type}`"
            @click="showEventDetail(event)"
          >
            <div class="event-info">
              <div class="event-title">{{ event.title }}</div>
              <div class="event-time" v-if="event.time">{{ event.time }}</div>
              <div class="event-description" v-if="event.description">{{ event.description }}</div>
            </div>
            <div class="event-actions">
              <el-button size="small" @click.stop="editEvent(event)">编辑</el-button>
              <el-button size="small" type="danger" @click.stop="deleteEvent(event.id)">删除</el-button>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 添加/编辑事件对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingEvent ? '编辑事件' : '添加事件'"
      width="500px"
    >
      <el-form :model="eventForm" :rules="eventRules" ref="eventFormRef" label-width="80px">
        <el-form-item label="事件标题" prop="title">
          <el-input v-model="eventForm.title" placeholder="请输入事件标题" />
        </el-form-item>
        <el-form-item label="事件类型" prop="type">
          <el-select v-model="eventForm.type" placeholder="选择事件类型">
            <el-option label="考试" value="exam" />
            <el-option label="作业" value="homework" />
            <el-option label="活动" value="activity" />
            <el-option label="会议" value="meeting" />
            <el-option label="假期" value="holiday" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期" prop="date">
          <el-date-picker
            v-model="eventForm.date"
            type="date"
            placeholder="选择日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="时间">
          <el-time-picker
            v-model="eventForm.time"
            placeholder="选择时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="eventForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入事件描述"
          />
        </el-form-item>
        <el-form-item label="提醒">
          <el-checkbox v-model="eventForm.reminder">设置提醒</el-checkbox>
        </el-form-item>
        <el-form-item label="提醒时间" v-if="eventForm.reminder">
          <el-select v-model="eventForm.reminderMinutes" placeholder="选择提醒时间">
            <el-option label="事件开始时" :value="0" />
            <el-option label="提前5分钟" :value="5" />
            <el-option label="提前15分钟" :value="15" />
            <el-option label="提前30分钟" :value="30" />
            <el-option label="提前1小时" :value="60" />
            <el-option label="提前1天" :value="1440" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="saveEvent">保存</el-button>
      </template>
    </el-dialog>

    <!-- 事件详情对话框 -->
    <el-dialog v-model="showDetailDialog" title="事件详情" width="400px">
      <div v-if="selectedEvent" class="event-detail">
        <div class="detail-item">
          <label>标题：</label>
          <span>{{ selectedEvent.title }}</span>
        </div>
        <div class="detail-item">
          <label>类型：</label>
          <el-tag :type="getEventTagType(selectedEvent.type)">{{ getEventTypeLabel(selectedEvent.type) }}</el-tag>
        </div>
        <div class="detail-item">
          <label>日期：</label>
          <span>{{ formatDate(selectedEvent.date) }}</span>
        </div>
        <div class="detail-item" v-if="selectedEvent.time">
          <label>时间：</label>
          <span>{{ selectedEvent.time }}</span>
        </div>
        <div class="detail-item" v-if="selectedEvent.description">
          <label>描述：</label>
          <span>{{ selectedEvent.description }}</span>
        </div>
        <div class="detail-item" v-if="selectedEvent.reminder">
          <label>提醒：</label>
          <span>提前{{ selectedEvent.reminderMinutes }}分钟</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="editEvent(selectedEvent)">编辑</el-button>
        <el-button type="danger" @click="deleteEvent(selectedEvent.id)">删除</el-button>
        <el-button @click="showDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 倒计时设置对话框 -->
    <el-dialog v-model="showCountdownDialog" title="倒计时设置" width="600px">
      <div class="countdown-settings">
        <div class="countdown-list">
          <div v-for="event in countdownEvents" :key="event.id" class="countdown-item">
            <div class="countdown-info">
              <div class="countdown-title">{{ event.title }}</div>
              <div class="countdown-date">{{ formatDate(event.date) }}</div>
            </div>
            <div class="countdown-days">{{ getDaysUntil(event.date) }}天</div>
            <el-button size="small" type="danger" @click="removeCountdown(event.id)">移除</el-button>
          </div>
        </div>
        <el-divider />
        <div class="add-countdown">
          <el-select v-model="newCountdownEventId" placeholder="选择要添加倒计时的事件" style="width: 300px">
            <el-option
              v-for="event in availableCountdownEvents"
              :key="event.id"
              :label="`${event.title} - ${formatDate(event.date)}`"
              :value="event.id"
            />
          </el-select>
          <el-button type="primary" @click="addCountdown" :disabled="!newCountdownEventId">添加倒计时</el-button>
        </div>
      </div>
      <template #footer>
        <el-button @click="showCountdownDialog = false">关闭</el-button>
      </template>
    </el-dialog>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Timer, Download, ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import Layout from './Layout.vue'

interface CalendarEvent {
  id?: number
  title: string
  type: 'exam' | 'homework' | 'activity' | 'meeting' | 'holiday' | 'other'
  date: string
  time?: string
  description?: string
  reminder: boolean
  reminderMinutes?: number
  isCountdown?: boolean
  createdAt?: string
  updatedAt?: string
}

interface CalendarDay {
  date: string
  day: number
  isCurrentMonth: boolean
  isToday: boolean
}

const events = ref<CalendarEvent[]>([])
const showAddDialog = ref(false)
const showDetailDialog = ref(false)
const showCountdownDialog = ref(false)
const editingEvent = ref<CalendarEvent | null>(null)
const selectedEvent = ref<CalendarEvent | null>(null)
const selectedDate = ref(new Date().toISOString().split('T')[0])
const currentDate = ref(new Date())
const viewMode = ref('month')
const newCountdownEventId = ref<number | null>(null)
const eventFormRef = ref()

const eventForm = reactive<CalendarEvent>({
  title: '',
  type: 'other',
  date: '',
  time: '',
  description: '',
  reminder: false,
  reminderMinutes: 15
})

const eventRules = {
  title: [{ required: true, message: '请输入事件标题', trigger: 'blur' }],
  type: [{ required: true, message: '请选择事件类型', trigger: 'change' }],
  date: [{ required: true, message: '请选择日期', trigger: 'change' }]
}

const weekdays = ['日', '一', '二', '三', '四', '五', '六']

const currentYear = computed(() => currentDate.value.getFullYear())
const currentMonth = computed(() => currentDate.value.getMonth() + 1)

const countdownEvents = computed(() => {
  return events.value.filter(event => event.isCountdown && new Date(event.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
})

const availableCountdownEvents = computed(() => {
  return events.value.filter(event => !event.isCountdown && new Date(event.date) >= new Date())
})

const selectedDateEvents = computed(() => {
  return events.value.filter(event => event.date === selectedDate.value)
})

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDay.getDay())
  
  const days: CalendarDay[] = []
  const today = new Date().toISOString().split('T')[0]
  
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    
    const dateStr = date.toISOString().split('T')[0]
    days.push({
      date: dateStr,
      day: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
      isToday: dateStr === today
    })
  }
  
  return days
})

const getDayEvents = (date: string) => {
  return events.value.filter(event => event.date === date)
}

const getDaysUntil = (date: string) => {
  const today = new Date()
  const targetDate = new Date(date)
  const diffTime = targetDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getEventTypeLabel = (type: string) => {
  const labels = {
    exam: '考试',
    homework: '作业',
    activity: '活动',
    meeting: '会议',
    holiday: '假期',
    other: '其他'
  }
  return labels[type] || '其他'
}

const getEventTagType = (type: string) => {
  const types = {
    exam: 'danger',
    homework: 'warning',
    activity: 'success',
    meeting: 'info',
    holiday: 'primary',
    other: ''
  }
  return types[type] || ''
}

const selectDate = (date: string) => {
  selectedDate.value = date
}

const previousMonth = () => {
  const newDate = new Date(currentDate.value)
  newDate.setMonth(newDate.getMonth() - 1)
  currentDate.value = newDate
}

const nextMonth = () => {
  const newDate = new Date(currentDate.value)
  newDate.setMonth(newDate.getMonth() + 1)
  currentDate.value = newDate
}

const goToToday = () => {
  currentDate.value = new Date()
  selectedDate.value = new Date().toISOString().split('T')[0]
}

const showEventDetail = (event: CalendarEvent) => {
  selectedEvent.value = event
  showDetailDialog.value = true
}

const editEvent = (event: CalendarEvent) => {
  editingEvent.value = event
  Object.assign(eventForm, {
    ...event,
    date: event.date,
    time: event.time || ''
  })
  showDetailDialog.value = false
  showAddDialog.value = true
}

const saveEvent = async () => {
  try {
    await eventFormRef.value.validate()
    
    const eventData = {
      ...eventForm,
      date: eventForm.date,
      time: eventForm.time || null
    }
    
    if (editingEvent.value) {
      const result = await window.electronAPI.calendar.update(editingEvent.value.id, eventData)
      if (result.success) {
        ElMessage.success('事件更新成功')
        loadEvents()
      } else {
        ElMessage.error('事件更新失败')
      }
    } else {
      const result = await window.electronAPI.calendar.create(eventData)
      if (result.success) {
        ElMessage.success('事件添加成功')
        loadEvents()
      } else {
        ElMessage.error('事件添加失败')
      }
    }
    
    showAddDialog.value = false
    resetForm()
  } catch (error) {
    console.error('保存事件失败:', error)
  }
}

const deleteEvent = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这个事件吗？', '确认删除', {
      type: 'warning'
    })
    
    const result = await window.electronAPI.calendar.delete(id)
    if (result.success) {
      ElMessage.success('事件删除成功')
      loadEvents()
      showDetailDialog.value = false
    } else {
      ElMessage.error('事件删除失败')
    }
  } catch (error) {
    // 用户取消删除
  }
}

const addCountdown = async () => {
  if (!newCountdownEventId.value) return
  
  try {
    const result = await window.electronAPI.calendar.update(newCountdownEventId.value, {
      isCountdown: true
    })
    
    if (result.success) {
      ElMessage.success('倒计时添加成功')
      loadEvents()
      newCountdownEventId.value = null
    } else {
      ElMessage.error('倒计时添加失败')
    }
  } catch (error) {
    console.error('添加倒计时失败:', error)
  }
}

const removeCountdown = async (id: number) => {
  try {
    const result = await window.electronAPI.calendar.update(id, {
      isCountdown: false
    })
    
    if (result.success) {
      ElMessage.success('倒计时移除成功')
      loadEvents()
    } else {
      ElMessage.error('倒计时移除失败')
    }
  } catch (error) {
    console.error('移除倒计时失败:', error)
  }
}

const resetForm = () => {
  Object.assign(eventForm, {
    title: '',
    type: 'other',
    date: '',
    time: '',
    description: '',
    reminder: false,
    reminderMinutes: 15
  })
  editingEvent.value = null
}

const loadEvents = async () => {
  try {
    const result = await window.electronAPI.calendar.list()
    if (result.success) {
      events.value = result.data
    }
  } catch (error) {
    console.error('加载事件失败:', error)
  }
}

const exportCalendar = () => {
  ElMessage.info('导出功能开发中...')
}

onMounted(() => {
  loadEvents()
})
</script>

<style scoped>
.calendar-container {
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

.countdown-section {
  margin-bottom: 20px;
}

.countdown-card {
  text-align: center;
  cursor: pointer;
  transition: transform 0.3s;
}

.countdown-card:hover {
  transform: translateY(-2px);
}

.countdown-card.countdown-exam {
  border-left: 4px solid #f56c6c;
}

.countdown-card.countdown-activity {
  border-left: 4px solid #67c23a;
}

.countdown-card.countdown-meeting {
  border-left: 4px solid #409eff;
}

.countdown-content {
  padding: 10px;
}

.countdown-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}

.countdown-days {
  font-size: 32px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 5px;
}

.countdown-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 10px;
}

.countdown-date {
  font-size: 12px;
  color: #606266;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.calendar-controls {
  display: flex;
  gap: 10px;
  align-items: center;
}

.calendar-grid {
  width: 100%;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  margin-bottom: 1px;
}

.weekday-header {
  padding: 12px;
  text-align: center;
  background: #f5f7fa;
  font-weight: 600;
  color: #606266;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
}

.day-cell {
  min-height: 100px;
  padding: 8px;
  border: 1px solid #e4e7ed;
  cursor: pointer;
  transition: background-color 0.3s;
}

.day-cell:hover {
  background: #f0f9ff;
}

.day-cell.other-month {
  color: #c0c4cc;
  background: #fafafa;
}

.day-cell.today {
  background: #e1f3d8;
  border-color: #67c23a;
}

.day-cell.selected {
  background: #ecf5ff;
  border-color: #409eff;
}

.day-number {
  font-weight: 600;
  margin-bottom: 4px;
}

.day-events {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.event-item {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
  cursor: pointer;
  transition: opacity 0.3s;
}

.event-item:hover {
  opacity: 0.8;
}

.event-exam {
  background: #fef0f0;
  color: #f56c6c;
  border-left: 3px solid #f56c6c;
}

.event-homework {
  background: #fdf6ec;
  color: #e6a23c;
  border-left: 3px solid #e6a23c;
}

.event-activity {
  background: #f0f9ff;
  color: #409eff;
  border-left: 3px solid #409eff;
}

.event-meeting {
  background: #f4f4f5;
  color: #909399;
  border-left: 3px solid #909399;
}

.event-holiday {
  background: #f0f9ff;
  color: #409eff;
  border-left: 3px solid #409eff;
}

.event-other {
  background: #f5f7fa;
  color: #606266;
  border-left: 3px solid #dcdfe6;
}

.event-title {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.events-list {
  margin-top: 20px;
}

.event-list-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.event-list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.event-list-item:hover {
  background: rgba(64, 158, 255, 0.1);
}

.event-info {
  flex: 1;
}

.event-info .event-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.event-time {
  font-size: 14px;
  color: #909399;
  margin-bottom: 4px;
}

.event-description {
  font-size: 14px;
  color: #606266;
}

.event-actions {
  display: flex;
  gap: 8px;
}

.event-detail {
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

.countdown-settings {
  padding: 10px 0;
}

.countdown-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.countdown-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
}

.countdown-info .countdown-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.countdown-info .countdown-date {
  font-size: 14px;
  color: #909399;
}

.countdown-item .countdown-days {
  font-size: 18px;
  font-weight: bold;
  color: #409eff;
}

.add-countdown {
  display: flex;
  gap: 10px;
  align-items: center;
}
</style>