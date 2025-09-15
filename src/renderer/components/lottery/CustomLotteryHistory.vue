<template>
  <div class="custom-lottery-history">
    <el-card>
      <template #header>
        <div class="history-header">
          <div class="header-left">
            <el-icon><Clock /></el-icon>
            <span>自定义抽签历史</span>
            <el-tag type="info" size="small">{{ historyRecords.length }}条记录</el-tag>
          </div>
          <div class="header-right">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索抽签结果..."
              size="small"
              style="width: 200px; margin-right: 12px"
              clearable
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-select
              v-model="filterMode"
              placeholder="筛选模式"
              size="small"
              style="width: 120px; margin-right: 12px"
              clearable
            >
              <el-option label="文本抽签" value="text" />
              <el-option label="数字抽签" value="number" />
              <el-option label="学生抽签" value="student" />
            </el-select>
            <el-button type="danger" size="small" @click="clearAllHistory" :disabled="historyRecords.length === 0">
              <el-icon><Delete /></el-icon>
              清空历史
            </el-button>
          </div>
        </div>
      </template>

      <div class="history-content">
        <div v-if="filteredRecords.length === 0" class="empty-state">
          <el-empty description="暂无抽签历史记录">
            <template #image>
              <el-icon size="64" color="#c0c4cc"><DocumentCopy /></el-icon>
            </template>
          </el-empty>
        </div>

        <div v-else class="history-list">
          <div
            v-for="record in paginatedRecords"
            :key="record.id"
            class="history-item"
          >
            <div class="item-header">
              <div class="item-type">
                <el-tag :type="getModeTagType(record.mode)" size="small">
                  {{ getModeLabel(record.mode) }}
                </el-tag>
                <span class="item-time">{{ formatTime(record.time) }}</span>
              </div>
              <div class="item-actions">
                <el-button type="primary" text size="small" @click="replayLottery(record)">
                  <el-icon><Refresh /></el-icon>
                  重新抽签
                </el-button>
                <el-button type="danger" text size="small" @click="deleteRecord(record.id)">
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </div>
            </div>

            <div class="item-content">
              <div class="lottery-config">
                <div class="config-item">
                  <span class="config-label">抽签选项：</span>
                  <div class="options-display">
                    <el-tag
                      v-for="(option, index) in record.options.slice(0, 5)"
                      :key="index"
                      size="small"
                      class="option-tag"
                    >
                      {{ option }}
                    </el-tag>
                    <el-tag v-if="record.options.length > 5" size="small" type="info">
                      +{{ record.options.length - 5 }}个
                    </el-tag>
                  </div>
                </div>
                <div class="config-item">
                  <span class="config-label">抽取配置：</span>
                  <span class="config-value">
                    抽取{{ record.config.count }}个
                    {{ record.config.allowDuplicate ? '(允许重复)' : '(不允许重复)' }}
                  </span>
                </div>
              </div>

              <div class="lottery-result">
                <div class="result-label">🎉 抽签结果：</div>
                <div class="result-items">
                  <el-tag
                    v-for="(result, index) in record.results"
                    :key="index"
                    type="success"
                    size="large"
                    class="result-tag"
                  >
                    {{ result }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div v-if="filteredRecords.length > pageSize" class="pagination">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="filteredRecords.length"
            layout="prev, pager, next, total"
            small
          />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Clock, Search, Delete, DocumentCopy, Refresh } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

interface LotteryConfig {
  count: number
  allowDuplicate: boolean
  min?: number
  max?: number
}

interface CustomLotteryRecord {
  id: string
  mode: 'text' | 'number' | 'student'
  options: string[]
  results: string[]
  config: LotteryConfig
  time: Date
  className?: string // 学生抽签时的班级名称
}

const emit = defineEmits<{
  'replay': [record: CustomLotteryRecord]
}>()

const historyRecords = ref<CustomLotteryRecord[]>([])
const searchKeyword = ref('')
const filterMode = ref<string>('')
const currentPage = ref(1)
const pageSize = 10

const STORAGE_KEY = 'custom-lottery-history'

// 筛选后的记录
const filteredRecords = computed(() => {
  let records = historyRecords.value

  // 按模式筛选
  if (filterMode.value) {
    records = records.filter(record => record.mode === filterMode.value)
  }

  // 按关键词搜索
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase().trim()
    records = records.filter(record => {
      return record.results.some(result => result.toLowerCase().includes(keyword)) ||
             record.options.some(option => option.toLowerCase().includes(keyword))
    })
  }

  return records
})

// 分页后的记录
const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filteredRecords.value.slice(start, end)
})

// 获取模式标签类型
const getModeTagType = (mode: string) => {
  switch (mode) {
    case 'text': return 'primary'
    case 'number': return 'warning'
    case 'student': return 'success'
    default: return 'info'
  }
}

// 获取模式标签文本
const getModeLabel = (mode: string) => {
  switch (mode) {
    case 'text': return '文本抽签'
    case 'number': return '数字抽签'
    case 'student': return '学生抽签'
    default: return '未知模式'
  }
}

// 格式化时间
const formatTime = (time: Date) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

// 添加历史记录
const addRecord = (record: Omit<CustomLotteryRecord, 'id' | 'time'>) => {
  const newRecord: CustomLotteryRecord = {
    ...record,
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    time: new Date()
  }
  
  historyRecords.value.unshift(newRecord)
  
  // 限制历史记录数量（最多保存100条）
  if (historyRecords.value.length > 100) {
    historyRecords.value = historyRecords.value.slice(0, 100)
  }
  
  saveToStorage()
}

// 删除单条记录
const deleteRecord = async (id: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这条抽签记录吗？', '确认删除', {
      type: 'warning'
    })
    
    historyRecords.value = historyRecords.value.filter(record => record.id !== id)
    saveToStorage()
    ElMessage.success('删除成功')
  } catch {
    // 用户取消
  }
}

// 清空所有历史记录
const clearAllHistory = async () => {
  try {
    await ElMessageBox.confirm('确定要清空所有抽签历史记录吗？此操作不可恢复！', '确认清空', {
      type: 'warning',
      confirmButtonText: '确定清空',
      cancelButtonText: '取消'
    })
    
    historyRecords.value = []
    saveToStorage()
    ElMessage.success('历史记录已清空')
  } catch {
    // 用户取消
  }
}

// 重新抽签
const replayLottery = (record: CustomLotteryRecord) => {
  emit('replay', record)
}

// 保存到本地存储
const saveToStorage = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(historyRecords.value))
  } catch (error) {
    console.error('保存抽签历史失败:', error)
    ElMessage.error('保存历史记录失败')
  }
}

// 从本地存储加载
const loadFromStorage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const records = JSON.parse(saved)
      historyRecords.value = records.map((record: any) => ({
        ...record,
        time: new Date(record.time)
      }))
    }
  } catch (error) {
    console.error('加载抽签历史失败:', error)
  }
}

// 暴露方法给父组件
defineExpose({
  addRecord,
  loadFromStorage
})

onMounted(() => {
  loadFromStorage()
})
</script>

<style scoped>
.custom-lottery-history {
  margin-top: 20px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.history-content {
  margin-top: 16px;
}

.empty-state {
  padding: 40px 0;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.history-item {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  background: #fafafa;
  transition: all 0.3s ease;
}

.history-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.item-type {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-time {
  color: #909399;
  font-size: 12px;
}

.item-actions {
  display: flex;
  gap: 8px;
}

.item-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.lottery-config {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex-wrap: wrap;
}

.config-label {
  font-weight: 500;
  color: #606266;
  min-width: 80px;
}

.config-value {
  color: #303133;
}

.options-display {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.option-tag {
  margin: 0;
}

.lottery-result {
  background: #f0f9ff;
  border: 1px solid #b3d8ff;
  border-radius: 6px;
  padding: 12px;
}

.result-label {
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.result-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.result-tag {
  margin: 0;
  font-weight: 500;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .history-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-right {
    justify-content: center;
  }
  
  .item-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .item-actions {
    justify-content: flex-end;
  }
  
  .config-item {
    flex-direction: column;
    align-items: stretch;
  }
  
  .config-label {
    min-width: auto;
  }
}

/* 暗色主题 */
.dark-theme .history-item {
  background: #2d3748;
  border-color: #4a5568;
}

.dark-theme .history-item:hover {
  border-color: #409eff;
}

.dark-theme .lottery-result {
  background: #2a4a5c;
  border-color: #4a90a4;
}

.dark-theme .header-left {
  color: #e2e8f0;
}
</style>