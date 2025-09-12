<template>
  <Layout>
    <div class="lottery-container">
      <div class="lottery-header">
        <h1 class="page-title">
          <el-icon><Operation /></el-icon>
          课堂抽签
        </h1>
        <p class="page-description">让课堂互动更有趣，公平公正的抽签工具</p>
      </div>

      <div class="lottery-modes">
        <!-- 随机点名 -->
        <el-card class="mode-card" @click="openRandomCall">
          <div class="mode-content">
            <div class="mode-icon random-call">
              <el-icon><User /></el-icon>
            </div>
            <h3 class="mode-title">随机点名</h3>
            <p class="mode-description">从班级学生中随机选择一位同学</p>
            <div class="mode-features">
              <el-tag size="small">公平随机</el-tag>
              <el-tag size="small" type="success">快速选择</el-tag>
            </div>
          </div>
        </el-card>

        <!-- 大转盘 -->
        <el-card class="mode-card" @click="openWheel">
          <div class="mode-content">
            <div class="mode-icon wheel">
              <el-icon><Compass /></el-icon>
            </div>
            <h3 class="mode-title">大转盘</h3>
            <p class="mode-description">炫酷的转盘动画，增加课堂趣味性</p>
            <div class="mode-features">
              <el-tag size="small" type="warning">动画效果</el-tag>
              <el-tag size="small" type="info">视觉冲击</el-tag>
            </div>
          </div>
        </el-card>

        <!-- 自定义抽签 -->
        <el-card class="mode-card" @click="openCustom">
          <div class="mode-content">
            <div class="mode-icon custom">
              <el-icon><Setting /></el-icon>
            </div>
            <h3 class="mode-title">自定义抽签</h3>
            <p class="mode-description">自定义选项内容，灵活配置抽签规则</p>
            <div class="mode-features">
              <el-tag size="small" type="danger">自定义</el-tag>
              <el-tag size="small" type="success">灵活配置</el-tag>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 最近抽签记录 -->
      <div class="recent-records" v-if="recentRecords.length > 0">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最近抽签记录</span>
              <el-button type="primary" text @click="clearRecords">清空记录</el-button>
            </div>
          </template>
          
          <div class="records-list">
            <div 
              v-for="record in recentRecords" 
              :key="record.id"
              class="record-item"
            >
              <div class="record-type">
                <el-tag :type="getRecordTypeColor(record.type)">{{ record.type }}</el-tag>
              </div>
              <div class="record-content">
                <div class="record-result">{{ record.result }}</div>
                <div class="record-time">{{ formatTime(record.time) }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 随机点名弹窗 -->
    <RandomCallDialog 
      v-model="randomCallVisible" 
      @record="addRecord"
    />

    <!-- 大转盘弹窗 -->
    <WheelDialog 
      v-model="wheelVisible" 
      @record="addRecord"
    />

    <!-- 自定义抽签弹窗 -->
    <CustomLotteryDialog 
      v-model="customVisible" 
      @record="addRecord"
    />
  </Layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Operation, User, Compass, Setting } from '@element-plus/icons-vue'
import Layout from './Layout.vue'
import RandomCallDialog from '../components/lottery/RandomCallDialog.vue'
import WheelDialog from '../components/lottery/WheelDialog.vue'
import CustomLotteryDialog from '../components/lottery/CustomLotteryDialog.vue'
import dayjs from 'dayjs'

interface LotteryRecord {
  id: string
  type: string
  result: string
  time: Date
}

const randomCallVisible = ref(false)
const wheelVisible = ref(false)
const customVisible = ref(false)
const recentRecords = ref<LotteryRecord[]>([])

const openRandomCall = () => {
  randomCallVisible.value = true
}

const openWheel = () => {
  wheelVisible.value = true
}

const openCustom = () => {
  customVisible.value = true
}

const addRecord = (record: Omit<LotteryRecord, 'id' | 'time'>) => {
  const newRecord: LotteryRecord = {
    ...record,
    id: Date.now().toString(),
    time: new Date()
  }
  recentRecords.value.unshift(newRecord)
  
  // 只保留最近10条记录
  if (recentRecords.value.length > 10) {
    recentRecords.value = recentRecords.value.slice(0, 10)
  }
  
  // 保存到本地存储
  localStorage.setItem('lottery-records', JSON.stringify(recentRecords.value))
}

const clearRecords = () => {
  recentRecords.value = []
  localStorage.removeItem('lottery-records')
}

const getRecordTypeColor = (type: string) => {
  switch (type) {
    case '随机点名': return 'primary'
    case '大转盘': return 'warning'
    case '自定义抽签': return 'danger'
    default: return 'info'
  }
}

const formatTime = (time: Date) => {
  return dayjs(time).format('MM-DD HH:mm')
}

onMounted(() => {
  // 从本地存储加载记录
  const savedRecords = localStorage.getItem('lottery-records')
  if (savedRecords) {
    try {
      const records = JSON.parse(savedRecords)
      recentRecords.value = records.map((record: any) => ({
        ...record,
        time: new Date(record.time)
      }))
    } catch (error) {
      console.error('Failed to load lottery records:', error)
    }
  }
})
</script>

<style scoped>
.lottery-container {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.lottery-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-title {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.page-title .el-icon {
  font-size: 36px;
  color: #409eff;
}

.page-description {
  font-size: 16px;
  color: #606266;
  margin: 0;
}

.lottery-modes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.mode-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 12px;
  overflow: hidden;
}

.mode-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.mode-content {
  text-align: center;
  padding: 20px;
}

.mode-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  font-size: 36px;
  color: white;
}

.mode-icon.random-call {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.mode-icon.wheel {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.mode-icon.custom {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.mode-title {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 12px;
}

.mode-description {
  font-size: 14px;
  color: #606266;
  margin-bottom: 16px;
  line-height: 1.5;
}

.mode-features {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.recent-records {
  margin-top: 40px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.records-list {
  max-height: 300px;
  overflow-y: auto;
}

.record-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.record-item:last-child {
  border-bottom: none;
}

.record-type {
  margin-right: 16px;
}

.record-content {
  flex: 1;
}

.record-result {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.record-time {
  font-size: 12px;
  color: #909399;
}

.dark-theme .lottery-container {
  background: #141414;
}

.dark-theme .page-title {
  color: #e5eaf3;
}

.dark-theme .page-description {
  color: #a3a6ad;
}

.dark-theme .mode-title {
  color: #e5eaf3;
}

.dark-theme .mode-description {
  color: #a3a6ad;
}

.dark-theme .record-result {
  color: #e5eaf3;
}
</style>