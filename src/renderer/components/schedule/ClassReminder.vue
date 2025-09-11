<template>
  <div class="class-reminder">
    <!-- 当前课程提醒 -->
    <el-card v-if="currentClass" class="current-class-card" shadow="always">
      <template #header>
        <div class="card-header">
          <el-icon class="reminder-icon"><Bell /></el-icon>
          <span class="reminder-title">当前课程</span>
          <el-tag :type="getClassStatus(currentClass).type" size="small">
            {{ getClassStatus(currentClass).text }}
          </el-tag>
        </div>
      </template>
      
      <div class="class-info">
        <div class="class-main">
          <h3 class="subject-name">{{ currentClass.subject }}</h3>
          <div class="class-details">
            <div class="detail-item">
              <el-icon><User /></el-icon>
              <span>{{ currentClass.teacher_name || '未设置' }}</span>
            </div>
            <div class="detail-item">
              <el-icon><Location /></el-icon>
              <span>{{ currentClass.classroom || '未设置' }}</span>
            </div>
            <div class="detail-item">
              <el-icon><Clock /></el-icon>
              <span>{{ formatTime(currentClass) }}</span>
            </div>
          </div>
        </div>
        
        <div class="class-actions">
          <el-button type="primary" @click="markAttendance">
            <el-icon><Check /></el-icon>
            开始上课
          </el-button>
          <el-button @click="postponeClass">
            <el-icon><Timer /></el-icon>
            延后提醒
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 即将开始的课程 -->
    <el-card v-if="upcomingClasses.length > 0" class="upcoming-classes-card">
      <template #header>
        <div class="card-header">
          <el-icon><Clock /></el-icon>
          <span>即将开始的课程</span>
        </div>
      </template>
      
      <div class="upcoming-list">
        <div 
          v-for="classItem in upcomingClasses" 
          :key="classItem.id"
          class="upcoming-item"
        >
          <div class="upcoming-info">
            <div class="upcoming-subject">{{ classItem.subject }}</div>
            <div class="upcoming-details">
              <span class="upcoming-time">{{ formatTime(classItem) }}</span>
              <span class="upcoming-teacher">{{ classItem.teacher_name }}</span>
              <span class="upcoming-location">{{ classItem.classroom }}</span>
            </div>
          </div>
          <div class="upcoming-countdown">
            <el-tag size="small" type="warning">
              {{ getCountdown(classItem) }}
            </el-tag>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 今日课程概览 -->
    <el-card class="today-schedule-card">
      <template #header>
        <div class="card-header">
          <el-icon><Calendar /></el-icon>
          <span>今日课程安排</span>
          <el-tag size="small">{{ todayClasses.length }}节课</el-tag>
        </div>
      </template>
      
      <div class="today-timeline">
        <div 
          v-for="classItem in todayClasses" 
          :key="classItem.id"
          class="timeline-item"
          :class="{
            'current': isCurrentClass(classItem),
            'completed': isClassCompleted(classItem),
            'upcoming': isClassUpcoming(classItem)
          }"
        >
          <div class="timeline-dot"></div>
          <div class="timeline-content">
            <div class="timeline-time">{{ formatTime(classItem) }}</div>
            <div class="timeline-subject">{{ classItem.subject }}</div>
            <div class="timeline-teacher">{{ classItem.teacher_name }}</div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 提醒设置 -->
    <el-card class="reminder-settings-card">
      <template #header>
        <div class="card-header">
          <el-icon><Setting /></el-icon>
          <span>提醒设置</span>
        </div>
      </template>
      
      <el-form :model="reminderSettings" label-width="120px">
        <el-form-item label="提前提醒">
          <el-select v-model="reminderSettings.advanceMinutes" @change="saveReminderSettings">
            <el-option label="5分钟" :value="5" />
            <el-option label="10分钟" :value="10" />
            <el-option label="15分钟" :value="15" />
            <el-option label="30分钟" :value="30" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="声音提醒">
          <el-switch 
            v-model="reminderSettings.soundEnabled" 
            @change="saveReminderSettings"
          />
        </el-form-item>
        
        <el-form-item label="桌面通知">
          <el-switch 
            v-model="reminderSettings.desktopNotification" 
            @change="saveReminderSettings"
          />
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import {
  Bell,
  User,
  Location,
  Clock,
  Check,
  Timer,
  Calendar,
  Setting
} from '@element-plus/icons-vue'

interface Schedule {
  id: number
  subject: string
  teacher_name?: string
  classroom?: string
  day_of_week: number
  period: number
  start_time?: string
  end_time?: string
}

interface ReminderSettings {
  advanceMinutes: number
  soundEnabled: boolean
  desktopNotification: boolean
}

const schedules = ref<Schedule[]>([])
const currentTime = ref(new Date())
const reminderSettings = ref<ReminderSettings>({
  advanceMinutes: 10,
  soundEnabled: true,
  desktopNotification: true
})

let timeInterval: NodeJS.Timeout | null = null

// 当前课程
const currentClass = computed(() => {
  const now = currentTime.value
  const currentDay = now.getDay() || 7 // 周日为7
  const currentTimeStr = now.toTimeString().slice(0, 5)
  
  return schedules.value.find(schedule => {
    if (schedule.day_of_week !== currentDay) return false
    if (!schedule.start_time || !schedule.end_time) return false
    
    return currentTimeStr >= schedule.start_time && currentTimeStr <= schedule.end_time
  })
})

// 即将开始的课程
const upcomingClasses = computed(() => {
  const now = currentTime.value
  const currentDay = now.getDay() || 7
  const currentTimeStr = now.toTimeString().slice(0, 5)
  const advanceTime = new Date(now.getTime() + reminderSettings.value.advanceMinutes * 60000)
  const advanceTimeStr = advanceTime.toTimeString().slice(0, 5)
  
  return schedules.value
    .filter(schedule => {
      if (schedule.day_of_week !== currentDay) return false
      if (!schedule.start_time) return false
      
      return schedule.start_time > currentTimeStr && schedule.start_time <= advanceTimeStr
    })
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
    .slice(0, 3)
})

// 今日课程
const todayClasses = computed(() => {
  const currentDay = currentTime.value.getDay() || 7
  
  return schedules.value
    .filter(schedule => schedule.day_of_week === currentDay)
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
})

const formatTime = (schedule: Schedule) => {
  if (schedule.start_time && schedule.end_time) {
    return `${schedule.start_time} - ${schedule.end_time}`
  }
  return `第${schedule.period}节`
}

const getClassStatus = (schedule: Schedule) => {
  const now = currentTime.value
  const currentTimeStr = now.toTimeString().slice(0, 5)
  
  if (!schedule.start_time || !schedule.end_time) {
    return { type: 'info', text: '进行中' }
  }
  
  if (currentTimeStr < schedule.start_time) {
    return { type: 'warning', text: '即将开始' }
  } else if (currentTimeStr <= schedule.end_time) {
    return { type: 'success', text: '进行中' }
  } else {
    return { type: 'info', text: '已结束' }
  }
}

const getCountdown = (schedule: Schedule) => {
  if (!schedule.start_time) return ''
  
  const now = currentTime.value
  const [hours, minutes] = schedule.start_time.split(':').map(Number)
  const classTime = new Date(now)
  classTime.setHours(hours, minutes, 0, 0)
  
  const diff = classTime.getTime() - now.getTime()
  const minutesLeft = Math.ceil(diff / (1000 * 60))
  
  if (minutesLeft <= 0) return '即将开始'
  if (minutesLeft < 60) return `${minutesLeft}分钟后`
  
  const hoursLeft = Math.floor(minutesLeft / 60)
  const remainingMinutes = minutesLeft % 60
  return `${hoursLeft}小时${remainingMinutes}分钟后`
}

const isCurrentClass = (schedule: Schedule) => {
  return currentClass.value?.id === schedule.id
}

const isClassCompleted = (schedule: Schedule) => {
  if (!schedule.end_time) return false
  const currentTimeStr = currentTime.value.toTimeString().slice(0, 5)
  return currentTimeStr > schedule.end_time
}

const isClassUpcoming = (schedule: Schedule) => {
  if (!schedule.start_time) return false
  const currentTimeStr = currentTime.value.toTimeString().slice(0, 5)
  return currentTimeStr < schedule.start_time
}

const markAttendance = () => {
  ElMessage.success('已标记开始上课')
  // 这里可以添加考勤记录逻辑
}

const postponeClass = () => {
  ElMessage.info('已延后5分钟提醒')
  // 这里可以添加延后提醒逻辑
}

const saveReminderSettings = () => {
  localStorage.setItem('classReminderSettings', JSON.stringify(reminderSettings.value))
  ElMessage.success('提醒设置已保存')
}

const loadReminderSettings = () => {
  try {
    const saved = localStorage.getItem('classReminderSettings')
    if (saved) {
      Object.assign(reminderSettings.value, JSON.parse(saved))
    }
  } catch (error) {
    console.error('加载提醒设置失败:', error)
  }
}

const loadSchedules = async () => {
  try {
    const result = await window.electronAPI.schedules.list({ class_id: 1 })
    if (result.success) {
      schedules.value = result.data
    }
  } catch (error) {
    console.error('加载课程表失败:', error)
  }
}

const checkReminders = () => {
  // 检查是否需要发送提醒
  upcomingClasses.value.forEach(classItem => {
    if (reminderSettings.value.desktopNotification) {
      ElNotification({
        title: '上课提醒',
        message: `${classItem.subject} 即将在 ${getCountdown(classItem)} 开始`,
        type: 'warning',
        duration: 5000
      })
    }
  })
}

onMounted(() => {
  loadReminderSettings()
  loadSchedules()
  
  // 每分钟更新时间
  timeInterval = setInterval(() => {
    currentTime.value = new Date()
    checkReminders()
  }, 60000)
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>

<style scoped>
.class-reminder {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reminder-icon {
  color: #f56c6c;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.current-class-card {
  border-left: 4px solid #409eff;
}

.class-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.class-main {
  flex: 1;
}

.subject-name {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 20px;
  font-weight: 600;
}

.class-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
  font-size: 14px;
}

.class-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.upcoming-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.upcoming-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid #e6a23c;
}

.upcoming-info {
  flex: 1;
}

.upcoming-subject {
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.upcoming-details {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #909399;
}

.today-timeline {
  position: relative;
  padding-left: 20px;
}

.today-timeline::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e4e7ed;
}

.timeline-item {
  position: relative;
  padding: 12px 0;
  margin-left: 20px;
}

.timeline-dot {
  position: absolute;
  left: -27px;
  top: 16px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #c0c4cc;
  border: 2px solid #fff;
  box-shadow: 0 0 0 2px #e4e7ed;
}

.timeline-item.current .timeline-dot {
  background: #409eff;
  box-shadow: 0 0 0 2px #409eff;
  animation: pulse 2s infinite;
}

.timeline-item.completed .timeline-dot {
  background: #67c23a;
  box-shadow: 0 0 0 2px #67c23a;
}

.timeline-item.upcoming .timeline-dot {
  background: #e6a23c;
  box-shadow: 0 0 0 2px #e6a23c;
}

.timeline-content {
  padding-left: 8px;
}

.timeline-time {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.timeline-subject {
  font-weight: 600;
  color: #303133;
  margin-bottom: 2px;
}

.timeline-teacher {
  font-size: 12px;
  color: #606266;
}

.reminder-settings-card .el-form {
  margin-top: 10px;
}

@media (max-width: 768px) {
  .class-info {
    flex-direction: column;
  }
  
  .class-actions {
    flex-direction: row;
    justify-content: flex-start;
  }
  
  .upcoming-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>