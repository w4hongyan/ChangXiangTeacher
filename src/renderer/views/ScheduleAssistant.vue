<template>
  <Layout>
    <div class="schedule-assistant">
      <div class="schedule-header">
        <div class="header-left">
          <el-button @click="goBack" type="text" size="large">
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
          <h2>📅 日程提醒</h2>
        </div>
        <div class="header-right">
          <el-button type="primary" @click="showAddEvent" size="small">
            <el-icon><Plus /></el-icon>
            新建事件
          </el-button>
          <el-button @click="showSettings" size="small">
            <el-icon><Setting /></el-icon>
            设置
          </el-button>
        </div>
      </div>

      <div class="schedule-container">
        <!-- 左侧日历和快捷操作 -->
        <div class="schedule-sidebar">
          <!-- 迷你日历 -->
          <div class="mini-calendar">
            <el-calendar v-model="selectedDate" size="small">
              <template #date-cell="{ data }">
                <div class="calendar-cell" :class="{ 'has-events': hasEventsOnDate(data.day) }">
                  <span>{{ data.day.split('-').slice(-1)[0] }}</span>
                  <div v-if="hasEventsOnDate(data.day)" class="event-indicator"></div>
                </div>
              </template>
            </el-calendar>
          </div>

          <!-- 快捷操作 -->
          <div class="quick-actions">
            <h4>快捷操作</h4>
            <el-button @click="addQuickEvent('课程')" size="small" style="width: 100%; margin-bottom: 8px;">
              <el-icon><Reading /></el-icon>
              添加课程
            </el-button>
            <el-button @click="addQuickEvent('会议')" size="small" style="width: 100%; margin-bottom: 8px;">
              <el-icon><ChatDotRound /></el-icon>
              添加会议
            </el-button>
            <el-button @click="addQuickEvent('任务')" size="small" style="width: 100%; margin-bottom: 8px;">
              <el-icon><List /></el-icon>
              添加任务
            </el-button>
            <el-button @click="addQuickEvent('提醒')" size="small" style="width: 100%;">
              <el-icon><Bell /></el-icon>
              添加提醒
            </el-button>
          </div>

          <!-- 统计信息 -->
          <div class="schedule-stats">
            <h4>今日统计</h4>
            <div class="stat-item">
              <span class="stat-label">今日课程</span>
              <span class="stat-value">{{ todayStats.courses }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">待办任务</span>
              <span class="stat-value">{{ todayStats.tasks }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">即将到期</span>
              <span class="stat-value">{{ todayStats.upcoming }}</span>
            </div>
          </div>
        </div>

        <!-- 主要内容区域 -->
        <div class="schedule-main">
          <!-- 视图切换 -->
          <div class="view-controls">
            <el-radio-group v-model="currentView" size="small">
              <el-radio-button label="day">日视图</el-radio-button>
              <el-radio-button label="week">周视图</el-radio-button>
              <el-radio-button label="month">月视图</el-radio-button>
              <el-radio-button label="agenda">议程</el-radio-button>
            </el-radio-group>
            
            <div class="date-navigation">
              <el-button @click="previousPeriod" size="small">
                <el-icon><ArrowLeft /></el-icon>
              </el-button>
              <span class="current-period">{{ currentPeriodText }}</span>
              <el-button @click="nextPeriod" size="small">
                <el-icon><ArrowRight /></el-icon>
              </el-button>
              <el-button @click="goToToday" size="small" type="primary">今天</el-button>
            </div>
          </div>

          <!-- 日视图 -->
          <div v-if="currentView === 'day'" class="day-view">
            <div class="time-grid">
              <div class="time-column">
                <div v-for="hour in 24" :key="hour" class="time-slot">
                  {{ String(hour - 1).padStart(2, '0') }}:00
                </div>
              </div>
              <div class="events-column">
                <div v-for="hour in 24" :key="hour" class="hour-slot" @click="createEventAtTime(hour - 1)">
                  <div 
                    v-for="event in getEventsForHour(hour - 1)" 
                    :key="event.id" 
                    class="event-block"
                    :class="`event-${event.type}`"
                    @click.stop="editEvent(event)"
                  >
                    <div class="event-time">{{ event.startTime }} - {{ event.endTime }}</div>
                    <div class="event-title">{{ event.title }}</div>
                    <div class="event-location" v-if="event.location">📍 {{ event.location }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 周视图 -->
          <div v-else-if="currentView === 'week'" class="week-view">
            <div class="week-header">
              <div class="time-header"></div>
              <div v-for="day in weekDays" :key="day.date" class="day-header">
                <div class="day-name">{{ day.name }}</div>
                <div class="day-date" :class="{ today: day.isToday }">{{ day.date }}</div>
              </div>
            </div>
            <div class="week-grid">
              <div class="time-column">
                <div v-for="hour in 24" :key="hour" class="time-slot">
                  {{ String(hour - 1).padStart(2, '0') }}:00
                </div>
              </div>
              <div v-for="day in weekDays" :key="day.date" class="day-column">
                <div v-for="hour in 24" :key="hour" class="hour-slot" @click="createEventAtDateTime(day.fullDate, hour - 1)">
                  <div 
                    v-for="event in getEventsForDayHour(day.fullDate, hour - 1)" 
                    :key="event.id" 
                    class="event-block"
                    :class="`event-${event.type}`"
                    @click.stop="editEvent(event)"
                  >
                    <div class="event-title">{{ event.title }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 月视图 -->
          <div v-else-if="currentView === 'month'" class="month-view">
            <div class="month-grid">
              <div class="month-header">
                <div v-for="day in ['日', '一', '二', '三', '四', '五', '六']" :key="day" class="day-name">
                  {{ day }}
                </div>
              </div>
              <div class="month-body">
                <div 
                  v-for="date in monthDates" 
                  :key="date.date" 
                  class="month-cell"
                  :class="{ 
                    'other-month': !date.isCurrentMonth,
                    'today': date.isToday,
                    'selected': date.date === selectedDate
                  }"
                  @click="selectDate(date.date)"
                >
                  <div class="cell-date">{{ date.day }}</div>
                  <div class="cell-events">
                    <div 
                      v-for="event in getEventsForDate(date.date)" 
                      :key="event.id" 
                      class="month-event"
                      :class="`event-${event.type}`"
                      @click.stop="editEvent(event)"
                    >
                      {{ event.title }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 议程视图 -->
          <div v-else-if="currentView === 'agenda'" class="agenda-view">
            <div class="agenda-filters">
              <el-select v-model="agendaFilter" placeholder="筛选类型" size="small" style="width: 120px;">
                <el-option label="全部" value="all"></el-option>
                <el-option label="课程" value="course"></el-option>
                <el-option label="会议" value="meeting"></el-option>
                <el-option label="任务" value="task"></el-option>
                <el-option label="提醒" value="reminder"></el-option>
              </el-select>
              
              <el-date-picker
                v-model="agendaDateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                size="small"
                style="width: 240px;"
              />
            </div>
            
            <div class="agenda-list">
              <div v-for="dateGroup in filteredAgendaEvents" :key="dateGroup.date" class="agenda-date-group">
                <div class="agenda-date-header">
                  <h4>{{ formatAgendaDate(dateGroup.date) }}</h4>
                  <span class="event-count">{{ dateGroup.events.length }} 个事件</span>
                </div>
                
                <div class="agenda-events">
                  <div 
                    v-for="event in dateGroup.events" 
                    :key="event.id" 
                    class="agenda-event"
                    :class="`event-${event.type}`"
                    @click="editEvent(event)"
                  >
                    <div class="event-time-badge">
                      <div class="event-time">{{ event.startTime }}</div>
                      <div class="event-duration">{{ calculateDuration(event) }}</div>
                    </div>
                    
                    <div class="event-content">
                      <div class="event-header">
                        <h5 class="event-title">{{ event.title }}</h5>
                        <el-tag :type="getEventTagType(event.type)" size="small">{{ getEventTypeText(event.type) }}</el-tag>
                      </div>
                      
                      <div class="event-details">
                        <div v-if="event.location" class="event-location">
                          <el-icon><Location /></el-icon>
                          {{ event.location }}
                        </div>
                        <div v-if="event.description" class="event-description">
                          {{ event.description }}
                        </div>
                        <div v-if="event.attendees && event.attendees.length > 0" class="event-attendees">
                          <el-icon><User /></el-icon>
                          {{ event.attendees.length }} 人参与
                        </div>
                      </div>
                      
                      <div class="event-actions">
                        <el-button @click.stop="completeEvent(event)" size="small" v-if="event.type === 'task' && !event.completed">
                          <el-icon><Check /></el-icon>
                          完成
                        </el-button>
                        <el-button @click.stop="editEvent(event)" size="small">
                          <el-icon><Edit /></el-icon>
                          编辑
                        </el-button>
                        <el-button @click.stop="deleteEvent(event)" size="small" type="danger">
                          <el-icon><Delete /></el-icon>
                          删除
                        </el-button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div v-if="filteredAgendaEvents.length === 0" class="empty-agenda">
                <el-empty description="暂无事件" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 新建/编辑事件对话框 -->
      <el-dialog 
        v-model="eventDialogVisible" 
        :title="isEditingEvent ? '编辑事件' : '新建事件'" 
        width="600px"
        @close="resetEventForm"
      >
        <el-form :model="eventForm" :rules="eventRules" ref="eventFormRef" label-width="80px">
          <el-form-item label="事件类型" prop="type">
            <el-select v-model="eventForm.type" placeholder="选择事件类型">
              <el-option label="课程" value="course">
                <span style="float: left">📚 课程</span>
              </el-option>
              <el-option label="会议" value="meeting">
                <span style="float: left">💼 会议</span>
              </el-option>
              <el-option label="任务" value="task">
                <span style="float: left">✅ 任务</span>
              </el-option>
              <el-option label="提醒" value="reminder">
                <span style="float: left">🔔 提醒</span>
              </el-option>
            </el-select>
          </el-form-item>
          
          <el-form-item label="标题" prop="title">
            <el-input v-model="eventForm.title" placeholder="输入事件标题" />
          </el-form-item>
          
          <el-form-item label="日期" prop="date">
            <el-date-picker
              v-model="eventForm.date"
              type="date"
              placeholder="选择日期"
              style="width: 100%;"
            />
          </el-form-item>
          
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="开始时间" prop="startTime">
                <el-time-picker
                  v-model="eventForm.startTime"
                  placeholder="选择开始时间"
                  format="HH:mm"
                  style="width: 100%;"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="结束时间" prop="endTime">
                <el-time-picker
                  v-model="eventForm.endTime"
                  placeholder="选择结束时间"
                  format="HH:mm"
                  style="width: 100%;"
                />
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-form-item label="地点">
            <el-input v-model="eventForm.location" placeholder="输入地点（可选）" />
          </el-form-item>
          
          <el-form-item label="描述">
            <el-input 
              v-model="eventForm.description" 
              type="textarea" 
              :rows="3" 
              placeholder="输入事件描述（可选）" 
            />
          </el-form-item>
          
          <el-form-item label="提醒设置">
            <el-checkbox-group v-model="eventForm.reminders">
              <el-checkbox label="5min">提前5分钟</el-checkbox>
              <el-checkbox label="15min">提前15分钟</el-checkbox>
              <el-checkbox label="30min">提前30分钟</el-checkbox>
              <el-checkbox label="1hour">提前1小时</el-checkbox>
              <el-checkbox label="1day">提前1天</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          
          <el-form-item label="重复" v-if="eventForm.type !== 'reminder'">
            <el-select v-model="eventForm.repeat" placeholder="选择重复方式">
              <el-option label="不重复" value="none"></el-option>
              <el-option label="每天" value="daily"></el-option>
              <el-option label="每周" value="weekly"></el-option>
              <el-option label="每月" value="monthly"></el-option>
            </el-select>
          </el-form-item>
        </el-form>
        
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="eventDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="saveEvent" :loading="isSavingEvent">
              {{ isEditingEvent ? '更新' : '创建' }}
            </el-button>
          </span>
        </template>
      </el-dialog>

      <!-- 设置对话框 -->
      <el-dialog v-model="settingsDialogVisible" title="日程设置" width="500px">
        <el-form :model="settings" label-width="120px">
          <el-form-item label="工作时间">
            <el-row :gutter="16">
              <el-col :span="12">
                <el-time-picker
                  v-model="settings.workStartTime"
                  placeholder="开始时间"
                  format="HH:mm"
                  style="width: 100%;"
                />
              </el-col>
              <el-col :span="12">
                <el-time-picker
                  v-model="settings.workEndTime"
                  placeholder="结束时间"
                  format="HH:mm"
                  style="width: 100%;"
                />
              </el-col>
            </el-row>
          </el-form-item>
          
          <el-form-item label="工作日">
            <el-checkbox-group v-model="settings.workDays">
              <el-checkbox label="1">周一</el-checkbox>
              <el-checkbox label="2">周二</el-checkbox>
              <el-checkbox label="3">周三</el-checkbox>
              <el-checkbox label="4">周四</el-checkbox>
              <el-checkbox label="5">周五</el-checkbox>
              <el-checkbox label="6">周六</el-checkbox>
              <el-checkbox label="0">周日</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          
          <el-form-item label="默认提醒">
            <el-select v-model="settings.defaultReminder" placeholder="选择默认提醒时间">
              <el-option label="不提醒" value="none"></el-option>
              <el-option label="提前5分钟" value="5min"></el-option>
              <el-option label="提前15分钟" value="15min"></el-option>
              <el-option label="提前30分钟" value="30min"></el-option>
              <el-option label="提前1小时" value="1hour"></el-option>
            </el-select>
          </el-form-item>
          
          <el-form-item label="周开始日">
            <el-select v-model="settings.weekStartDay">
              <el-option label="周日" value="0"></el-option>
              <el-option label="周一" value="1"></el-option>
            </el-select>
          </el-form-item>
          
          <el-form-item label="通知设置">
            <el-switch v-model="settings.enableNotifications" active-text="启用桌面通知" />
          </el-form-item>
          
          <el-form-item label="声音提醒">
            <el-switch v-model="settings.enableSound" active-text="启用声音提醒" />
          </el-form-item>
        </el-form>
        
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="settingsDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="saveSettings">保存设置</el-button>
          </span>
        </template>
      </el-dialog>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  ArrowLeft, 
  Plus, 
  Setting, 
  Reading, 
  ChatDotRound, 
  List, 
  Bell,
  ArrowRight,
  Location,
  User,
  Check,
  Edit,
  Delete
} from '@element-plus/icons-vue'
import Layout from './Layout.vue'

const router = useRouter()

// 响应式数据
const selectedDate = ref(new Date())
const currentView = ref('day')
const eventDialogVisible = ref(false)
const settingsDialogVisible = ref(false)
const isEditingEvent = ref(false)
const isSavingEvent = ref(false)
const agendaFilter = ref('all')
const agendaDateRange = ref([new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)])

// 表单引用
const eventFormRef = ref(null)

// 事件数据
const events = ref([
  {
    id: 1,
    type: 'course',
    title: '高中数学课',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:30',
    location: '教室A101',
    description: '函数与方程专题讲解',
    reminders: ['15min'],
    repeat: 'weekly',
    completed: false
  },
  {
    id: 2,
    type: 'meeting',
    title: '教研组会议',
    date: new Date().toISOString().split('T')[0],
    startTime: '14:00',
    endTime: '15:30',
    location: '会议室B203',
    description: '讨论新学期教学计划',
    reminders: ['30min'],
    repeat: 'none',
    attendees: ['张老师', '李老师', '王老师']
  },
  {
    id: 3,
    type: 'task',
    title: '批改作业',
    date: new Date().toISOString().split('T')[0],
    startTime: '16:00',
    endTime: '17:00',
    description: '批改高一数学作业',
    reminders: ['1hour'],
    repeat: 'daily',
    completed: false
  }
])

// 事件表单
const eventForm = reactive({
  type: '',
  title: '',
  date: new Date(),
  startTime: null,
  endTime: null,
  location: '',
  description: '',
  reminders: [],
  repeat: 'none'
})

// 表单验证规则
const eventRules = {
  type: [{ required: true, message: '请选择事件类型', trigger: 'change' }],
  title: [{ required: true, message: '请输入事件标题', trigger: 'blur' }],
  date: [{ required: true, message: '请选择日期', trigger: 'change' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }]
}

// 设置
const settings = reactive({
  workStartTime: new Date(2024, 0, 1, 9, 0),
  workEndTime: new Date(2024, 0, 1, 17, 0),
  workDays: ['1', '2', '3', '4', '5'],
  defaultReminder: '15min',
  weekStartDay: '1',
  enableNotifications: true,
  enableSound: true
})

// 计算属性
const todayStats = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  const todayEvents = events.value.filter(event => event.date === today)
  
  return {
    courses: todayEvents.filter(event => event.type === 'course').length,
    tasks: todayEvents.filter(event => event.type === 'task' && !event.completed).length,
    upcoming: todayEvents.filter(event => {
      const now = new Date()
      const eventTime = new Date(`${event.date} ${event.startTime}`)
      return eventTime > now && eventTime <= new Date(now.getTime() + 2 * 60 * 60 * 1000)
    }).length
  }
})

const currentPeriodText = computed(() => {
  const date = selectedDate.value
  if (currentView.value === 'day') {
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
  } else if (currentView.value === 'week') {
    const startOfWeek = new Date(date)
    startOfWeek.setDate(date.getDate() - date.getDay())
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    return `${startOfWeek.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}`
  } else if (currentView.value === 'month') {
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })
  }
  return ''
})

const weekDays = computed(() => {
  const startOfWeek = new Date(selectedDate.value)
  startOfWeek.setDate(selectedDate.value.getDate() - selectedDate.value.getDay())
  
  const days = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek)
    day.setDate(startOfWeek.getDate() + i)
    const today = new Date()
    
    days.push({
      name: ['日', '一', '二', '三', '四', '五', '六'][i],
      date: day.getDate(),
      fullDate: day.toISOString().split('T')[0],
      isToday: day.toDateString() === today.toDateString()
    })
  }
  
  return days
})

const monthDates = computed(() => {
  const year = selectedDate.value.getFullYear()
  const month = selectedDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDate = new Date(firstDay)
  startDate.setDate(firstDay.getDate() - firstDay.getDay())
  
  const dates = []
  const today = new Date()
  
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    
    dates.push({
      date: date.toISOString().split('T')[0],
      day: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
      isToday: date.toDateString() === today.toDateString()
    })
  }
  
  return dates
})

const filteredAgendaEvents = computed(() => {
  let filteredEvents = events.value
  
  // 按类型筛选
  if (agendaFilter.value !== 'all') {
    filteredEvents = filteredEvents.filter(event => event.type === agendaFilter.value)
  }
  
  // 按日期范围筛选
  if (agendaDateRange.value && agendaDateRange.value.length === 2) {
    const startDate = agendaDateRange.value[0].toISOString().split('T')[0]
    const endDate = agendaDateRange.value[1].toISOString().split('T')[0]
    filteredEvents = filteredEvents.filter(event => event.date >= startDate && event.date <= endDate)
  }
  
  // 按日期分组
  const grouped = {}
  filteredEvents.forEach(event => {
    if (!grouped[event.date]) {
      grouped[event.date] = []
    }
    grouped[event.date].push(event)
  })
  
  // 转换为数组并排序
  return Object.keys(grouped)
    .sort()
    .map(date => ({
      date,
      events: grouped[date].sort((a, b) => a.startTime.localeCompare(b.startTime))
    }))
})

// 方法
const goBack = () => {
  router.push('/ai-assistant')
}

const showAddEvent = () => {
  isEditingEvent.value = false
  resetEventForm()
  eventDialogVisible.value = true
}

const showSettings = () => {
  settingsDialogVisible.value = true
}

const addQuickEvent = (type: string) => {
  isEditingEvent.value = false
  resetEventForm()
  eventForm.type = type.toLowerCase()
  eventForm.date = selectedDate.value
  eventDialogVisible.value = true
}

const hasEventsOnDate = (date: string) => {
  return events.value.some(event => event.date === date)
}

const previousPeriod = () => {
  const date = new Date(selectedDate.value)
  if (currentView.value === 'day') {
    date.setDate(date.getDate() - 1)
  } else if (currentView.value === 'week') {
    date.setDate(date.getDate() - 7)
  } else if (currentView.value === 'month') {
    date.setMonth(date.getMonth() - 1)
  }
  selectedDate.value = date
}

const nextPeriod = () => {
  const date = new Date(selectedDate.value)
  if (currentView.value === 'day') {
    date.setDate(date.getDate() + 1)
  } else if (currentView.value === 'week') {
    date.setDate(date.getDate() + 7)
  } else if (currentView.value === 'month') {
    date.setMonth(date.getMonth() + 1)
  }
  selectedDate.value = date
}

const goToToday = () => {
  selectedDate.value = new Date()
}

const getEventsForHour = (hour: number) => {
  const dateStr = selectedDate.value.toISOString().split('T')[0]
  return events.value.filter(event => {
    if (event.date !== dateStr) return false
    const startHour = parseInt(event.startTime.split(':')[0])
    const endHour = parseInt(event.endTime.split(':')[0])
    return hour >= startHour && hour < endHour
  })
}

const getEventsForDayHour = (date: string, hour: number) => {
  return events.value.filter(event => {
    if (event.date !== date) return false
    const startHour = parseInt(event.startTime.split(':')[0])
    const endHour = parseInt(event.endTime.split(':')[0])
    return hour >= startHour && hour < endHour
  })
}

const getEventsForDate = (date: string) => {
  return events.value.filter(event => event.date === date)
}

const createEventAtTime = (hour: number) => {
  isEditingEvent.value = false
  resetEventForm()
  eventForm.date = selectedDate.value
  eventForm.startTime = new Date(2024, 0, 1, hour, 0)
  eventForm.endTime = new Date(2024, 0, 1, hour + 1, 0)
  eventDialogVisible.value = true
}

const createEventAtDateTime = (date: string, hour: number) => {
  isEditingEvent.value = false
  resetEventForm()
  eventForm.date = new Date(date)
  eventForm.startTime = new Date(2024, 0, 1, hour, 0)
  eventForm.endTime = new Date(2024, 0, 1, hour + 1, 0)
  eventDialogVisible.value = true
}

const selectDate = (date: string) => {
  selectedDate.value = new Date(date)
  if (currentView.value === 'month') {
    currentView.value = 'day'
  }
}

const editEvent = (event: any) => {
  isEditingEvent.value = true
  eventForm.type = event.type
  eventForm.title = event.title
  eventForm.date = new Date(event.date)
  eventForm.startTime = new Date(`2024-01-01 ${event.startTime}`)
  eventForm.endTime = new Date(`2024-01-01 ${event.endTime}`)
  eventForm.location = event.location || ''
  eventForm.description = event.description || ''
  eventForm.reminders = event.reminders || []
  eventForm.repeat = event.repeat || 'none'
  eventForm.id = event.id
  eventDialogVisible.value = true
}

const completeEvent = (event: any) => {
  const index = events.value.findIndex(e => e.id === event.id)
  if (index > -1) {
    events.value[index].completed = true
    ElMessage.success('任务已完成')
  }
}

const deleteEvent = (event: any) => {
  ElMessageBox.confirm('确定要删除这个事件吗？', '确认删除', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const index = events.value.findIndex(e => e.id === event.id)
    if (index > -1) {
      events.value.splice(index, 1)
      ElMessage.success('事件已删除')
    }
  }).catch(() => {})
}

const resetEventForm = () => {
  eventForm.type = ''
  eventForm.title = ''
  eventForm.date = new Date()
  eventForm.startTime = null
  eventForm.endTime = null
  eventForm.location = ''
  eventForm.description = ''
  eventForm.reminders = []
  eventForm.repeat = 'none'
  delete eventForm.id
}

const saveEvent = () => {
  if (!eventFormRef.value) return
  
  eventFormRef.value.validate((valid: boolean) => {
    if (valid) {
      isSavingEvent.value = true
      
      setTimeout(() => {
        const eventData = {
          type: eventForm.type,
          title: eventForm.title,
          date: eventForm.date.toISOString().split('T')[0],
          startTime: eventForm.startTime.toTimeString().slice(0, 5),
          endTime: eventForm.endTime.toTimeString().slice(0, 5),
          location: eventForm.location,
          description: eventForm.description,
          reminders: eventForm.reminders,
          repeat: eventForm.repeat,
          completed: false
        }
        
        if (isEditingEvent.value) {
          const index = events.value.findIndex(e => e.id === eventForm.id)
          if (index > -1) {
            events.value[index] = { ...eventData, id: eventForm.id }
            ElMessage.success('事件已更新')
          }
        } else {
          events.value.push({ ...eventData, id: Date.now() })
          ElMessage.success('事件已创建')
        }
        
        isSavingEvent.value = false
        eventDialogVisible.value = false
        resetEventForm()
      }, 1000)
    }
  })
}

const saveSettings = () => {
  ElMessage.success('设置已保存')
  settingsDialogVisible.value = false
}

const formatAgendaDate = (date: string) => {
  const d = new Date(date)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  
  if (d.toDateString() === today.toDateString()) {
    return '今天'
  } else if (d.toDateString() === tomorrow.toDateString()) {
    return '明天'
  } else {
    return d.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })
  }
}

const calculateDuration = (event: any) => {
  const start = new Date(`2024-01-01 ${event.startTime}`)
  const end = new Date(`2024-01-01 ${event.endTime}`)
  const diff = end.getTime() - start.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours > 0) {
    return `${hours}小时${minutes > 0 ? minutes + '分钟' : ''}`
  } else {
    return `${minutes}分钟`
  }
}

const getEventTagType = (type: string) => {
  const typeMap = {
    course: 'primary',
    meeting: 'success',
    task: 'warning',
    reminder: 'info'
  }
  return typeMap[type] || 'default'
}

const getEventTypeText = (type: string) => {
  const typeMap = {
    course: '课程',
    meeting: '会议',
    task: '任务',
    reminder: '提醒'
  }
  return typeMap[type] || type
}

// 生命周期
onMounted(() => {
  // 初始化
})

// 监听器
watch(selectedDate, () => {
  // 日期变化时的处理
})
</script>

<style scoped>
.schedule-assistant {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.schedule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e9ecef;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h2 {
  margin: 0;
  color: #303133;
  font-size: 20px;
}

.header-right {
  display: flex;
  gap: 12px;
}

.schedule-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.schedule-sidebar {
  width: 300px;
  background: white;
  border-right: 1px solid #e9ecef;
  padding: 20px;
  overflow-y: auto;
}

.mini-calendar {
  margin-bottom: 24px;
}

.calendar-cell {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.calendar-cell.has-events {
  font-weight: bold;
  color: #409EFF;
}

.event-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 6px;
  height: 6px;
  background: #409EFF;
  border-radius: 50%;
}

.quick-actions {
  margin-bottom: 24px;
}

.quick-actions h4 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 16px;
}

.schedule-stats h4 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 16px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-label {
  color: #606266;
  font-size: 14px;
}

.stat-value {
  color: #409EFF;
  font-weight: bold;
  font-size: 16px;
}

.schedule-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  overflow: hidden;
}

.view-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e9ecef;
}

.date-navigation {
  display: flex;
  align-items: center;
  gap: 12px;
}

.current-period {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  min-width: 200px;
  text-align: center;
}

/* 日视图样式 */
.day-view {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px;
}

.time-grid {
  display: flex;
  min-height: 100%;
}

.time-column {
  width: 80px;
  border-right: 1px solid #e9ecef;
}

.time-slot {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #909399;
  border-bottom: 1px solid #f0f0f0;
}

.events-column {
  flex: 1;
}

.hour-slot {
  height: 60px;
  border-bottom: 1px solid #f0f0f0;
  position: relative;
  cursor: pointer;
  transition: background-color 0.3s;
}

.hour-slot:hover {
  background-color: #f8f9fa;
}

.event-block {
  position: absolute;
  left: 4px;
  right: 4px;
  background: #409EFF;
  color: white;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  z-index: 1;
  transition: all 0.3s;
}

.event-block:hover {
  transform: scale(1.02);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.event-block.event-course {
  background: #409EFF;
}

.event-block.event-meeting {
  background: #67C23A;
}

.event-block.event-task {
  background: #E6A23C;
}

.event-block.event-reminder {
  background: #909399;
}

.event-time {
  font-size: 10px;
  opacity: 0.9;
}

.event-title {
  font-weight: 500;
  margin: 2px 0;
}

.event-location {
  font-size: 10px;
  opacity: 0.8;
}

/* 周视图样式 */
.week-view {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px;
}

.week-header {
  display: flex;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
  position: sticky;
  top: 0;
  z-index: 2;
}

.time-header {
  width: 80px;
  height: 60px;
}

.day-header {
  flex: 1;
  text-align: center;
  padding: 12px;
  border-left: 1px solid #e9ecef;
}

.day-name {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.day-date {
  font-size: 18px;
  font-weight: 500;
  color: #303133;
}

.day-date.today {
  color: #409EFF;
  background: #e6f7ff;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.week-grid {
  display: flex;
  min-height: 100%;
}

.day-column {
  flex: 1;
  border-left: 1px solid #e9ecef;
}

/* 月视图样式 */
.month-view {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.month-grid {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.month-header {
  display: flex;
  background: #f8f9fa;
  border-radius: 8px 8px 0 0;
}

.month-header .day-name {
  flex: 1;
  text-align: center;
  padding: 12px;
  font-weight: 500;
  color: #606266;
}

.month-body {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border: 1px solid #e9ecef;
  border-top: none;
}

.month-cell {
  min-height: 100px;
  border-right: 1px solid #e9ecef;
  border-bottom: 1px solid #e9ecef;
  padding: 8px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.month-cell:hover {
  background-color: #f8f9fa;
}

.month-cell.other-month {
  color: #c0c4cc;
  background-color: #fafafa;
}

.month-cell.today {
  background-color: #e6f7ff;
}

.month-cell.selected {
  background-color: #409EFF;
  color: white;
}

.cell-date {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.cell-events {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.month-event {
  font-size: 10px;
  padding: 2px 4px;
  border-radius: 2px;
  color: white;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.month-event.event-course {
  background: #409EFF;
}

.month-event.event-meeting {
  background: #67C23A;
}

.month-event.event-task {
  background: #E6A23C;
}

.month-event.event-reminder {
  background: #909399;
}

/* 议程视图样式 */
.agenda-view {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.agenda-filters {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  align-items: center;
}

.agenda-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.agenda-date-group {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.agenda-date-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.agenda-date-header h4 {
  margin: 0;
  color: #303133;
  font-size: 16px;
}

.event-count {
  color: #909399;
  font-size: 14px;
}

.agenda-events {
  display: flex;
  flex-direction: column;
}

.agenda-event {
  display: flex;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.3s;
}

.agenda-event:hover {
  background-color: #f8f9fa;
}

.agenda-event:last-child {
  border-bottom: none;
}

.event-time-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 80px;
  padding: 8px;
  background: #f0f0f0;
  border-radius: 6px;
  text-align: center;
}

.agenda-event.event-course .event-time-badge {
  background: #e6f7ff;
  color: #409EFF;
}

.agenda-event.event-meeting .event-time-badge {
  background: #f0f9ff;
  color: #67C23A;
}

.agenda-event.event-task .event-time-badge {
  background: #fdf6ec;
  color: #E6A23C;
}

.agenda-event.event-reminder .event-time-badge {
  background: #f4f4f5;
  color: #909399;
}

.event-time-badge .event-time {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 2px;
}

.event-time-badge .event-duration {
  font-size: 10px;
  opacity: 0.8;
}

.event-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.event-header .event-title {
  margin: 0;
  color: #303133;
  font-size: 16px;
  font-weight: 500;
}

.event-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.event-location,
.event-description,
.event-attendees {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #606266;
}

.event-description {
  color: #909399;
}

.event-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.empty-agenda {
  text-align: center;
  padding: 60px 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .schedule-container {
    flex-direction: column;
  }
  
  .schedule-sidebar {
    width: 100%;
    max-height: 300px;
  }
  
  .view-controls {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .date-navigation {
    justify-content: center;
  }
  
  .current-period {
    min-width: auto;
  }
  
  .agenda-filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .agenda-event {
    flex-direction: column;
    gap: 12px;
  }
  
  .event-time-badge {
    min-width: auto;
    align-self: flex-start;
  }
  
  .event-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .event-actions {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
  
  .month-cell {
    min-height: 80px;
    padding: 4px;
  }
  
  .cell-date {
    font-size: 12px;
  }
  
  .month-event {
    font-size: 9px;
  }
}
</style>