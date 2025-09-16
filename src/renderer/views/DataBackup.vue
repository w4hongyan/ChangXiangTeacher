<template>
  <Layout>
    <div class="backup-container">
      <!-- 页面头部 -->
      <div class="backup-header">
        <div class="header-left">
          <h2>💾 数据备份</h2>
          <p class="subtitle">保护您的教学数据，支持自动备份和云同步</p>
        </div>
        <div class="header-right">
          <el-button @click="showSettings = true" type="primary" plain>
            <el-icon><Setting /></el-icon>
            备份设置
          </el-button>
          <el-button @click="refreshBackupList" :loading="isLoading">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </div>

      <!-- 快速操作区域 -->
      <div class="quick-actions">
        <el-row :gutter="24">
          <el-col :span="6">
            <el-card class="action-card" shadow="hover" @click="createBackup">
              <div class="action-content">
                <el-icon size="32" color="#409EFF"><FolderAdd /></el-icon>
                <h3>立即备份</h3>
                <p>创建完整数据备份</p>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="action-card" shadow="hover" @click="showRestoreDialog = true">
              <div class="action-content">
                <el-icon size="32" color="#67C23A"><Download /></el-icon>
                <h3>恢复数据</h3>
                <p>从备份文件恢复</p>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="action-card" shadow="hover" @click="syncToCloud">
              <div class="action-content">
                <el-icon size="32" color="#E6A23C"><Upload /></el-icon>
                <h3>云端同步</h3>
                <p>同步到云存储</p>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="action-card" shadow="hover" @click="exportData">
              <div class="action-content">
                <el-icon size="32" color="#F56C6C"><Document /></el-icon>
                <h3>导出数据</h3>
                <p>导出为Excel文件</p>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 备份状态概览 -->
      <div class="backup-overview">
        <el-row :gutter="24">
          <el-col :span="8">
            <el-card class="stats-card">
              <div class="stats-content">
                <div class="stats-icon">
                  <el-icon size="24" color="#409EFF"><FolderOpened /></el-icon>
                </div>
                <div class="stats-info">
                  <div class="stats-number">{{ backupStats.totalBackups }}</div>
                  <div class="stats-label">总备份数</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card class="stats-card">
              <div class="stats-content">
                <div class="stats-icon">
                  <el-icon size="24" color="#67C23A"><Clock /></el-icon>
                </div>
                <div class="stats-info">
                  <div class="stats-number">{{ formatDate(backupStats.lastBackup) }}</div>
                  <div class="stats-label">最后备份</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card class="stats-card">
              <div class="stats-content">
                <div class="stats-icon">
                  <el-icon size="24" color="#E6A23C"><Coin /></el-icon>
                </div>
                <div class="stats-info">
                  <div class="stats-number">{{ formatSize(backupStats.totalSize) }}</div>
                  <div class="stats-label">总大小</div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 备份列表 -->
      <div class="backup-list">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>📋 备份记录</span>
              <div class="header-actions">
                <el-select v-model="filterType" placeholder="筛选类型" size="small" style="width: 120px">
                  <el-option label="全部" value="" />
                  <el-option label="手动备份" value="manual" />
                  <el-option label="自动备份" value="auto" />
                  <el-option label="云端备份" value="cloud" />
                </el-select>
              </div>
            </div>
          </template>
          
          <el-table :data="filteredBackupList" v-loading="isLoading" stripe>
            <el-table-column prop="name" label="备份名称" min-width="200">
              <template #default="{ row }">
                <div class="backup-name">
                  <el-icon :color="getBackupTypeColor(row.type)"><component :is="getBackupTypeIcon(row.type)" /></el-icon>
                  <span>{{ row.name }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="type" label="类型" width="100">
              <template #default="{ row }">
                <el-tag :type="getBackupTypeTagType(row.type)" size="small">
                  {{ getBackupTypeName(row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="size" label="大小" width="100">
              <template #default="{ row }">
                {{ formatSize(row.size) }}
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusTagType(row.status)" size="small">
                  {{ getStatusName(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <el-button size="small" type="primary" @click="restoreBackup(row)" :disabled="row.status !== 'completed'">
                  恢复
                </el-button>
                <el-button size="small" type="info" @click="downloadBackup(row)" :disabled="row.status !== 'completed'">
                  下载
                </el-button>
                <el-button size="small" type="danger" @click="deleteBackup(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="totalBackups"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-card>
      </div>

      <!-- 备份设置对话框 -->
      <el-dialog v-model="showSettings" title="备份设置" width="600px">
        <el-form :model="backupSettings" label-width="120px">
          <el-form-item label="自动备份">
            <el-switch v-model="backupSettings.autoBackup" />
            <span style="margin-left: 8px; color: #909399;">启用定时自动备份</span>
          </el-form-item>
          
          <el-form-item label="备份频率" v-if="backupSettings.autoBackup">
            <el-select v-model="backupSettings.frequency">
              <el-option label="每天" value="daily" />
              <el-option label="每周" value="weekly" />
              <el-option label="每月" value="monthly" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="备份时间" v-if="backupSettings.autoBackup">
            <el-time-picker v-model="backupSettings.backupTime" format="HH:mm" />
          </el-form-item>
          
          <el-form-item label="保留数量">
            <el-input-number v-model="backupSettings.maxBackups" :min="1" :max="100" />
            <span style="margin-left: 8px; color: #909399;">最多保留的备份数量</span>
          </el-form-item>
          
          <el-form-item label="云存储">
            <el-switch v-model="backupSettings.cloudSync" />
            <span style="margin-left: 8px; color: #909399;">自动同步到云端</span>
          </el-form-item>
          
          <el-form-item label="云存储类型" v-if="backupSettings.cloudSync">
            <el-select v-model="backupSettings.cloudProvider">
              <el-option label="阿里云OSS" value="aliyun" />
              <el-option label="腾讯云COS" value="tencent" />
              <el-option label="七牛云" value="qiniu" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="备份内容">
            <el-checkbox-group v-model="backupSettings.backupContent">
              <el-checkbox label="students">学生信息</el-checkbox>
              <el-checkbox label="classes">班级信息</el-checkbox>
              <el-checkbox label="grades">成绩数据</el-checkbox>
              <el-checkbox label="homework">作业数据</el-checkbox>
              <el-checkbox label="attendance">考勤记录</el-checkbox>
              <el-checkbox label="settings">系统设置</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          
          <el-form-item label="数据加密">
            <el-switch v-model="backupSettings.encryption" />
            <span style="margin-left: 8px; color: #909399;">加密备份文件</span>
          </el-form-item>
        </el-form>
        
        <template #footer>
          <el-button @click="showSettings = false">取消</el-button>
          <el-button type="primary" @click="saveSettings">保存设置</el-button>
        </template>
      </el-dialog>

      <!-- 恢复数据对话框 -->
      <el-dialog v-model="showRestoreDialog" title="恢复数据" width="500px">
        <el-form :model="restoreForm" label-width="100px">
          <el-form-item label="恢复方式">
            <el-radio-group v-model="restoreForm.method">
              <el-radio label="file">从文件恢复</el-radio>
              <el-radio label="backup">从备份恢复</el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item label="选择文件" v-if="restoreForm.method === 'file'">
            <el-upload
              ref="uploadRef"
              :auto-upload="false"
              :limit="1"
              accept=".db,.sql,.json"
              :on-change="handleFileChange"
            >
              <el-button type="primary">选择备份文件</el-button>
            </el-upload>
          </el-form-item>
          
          <el-form-item label="选择备份" v-if="restoreForm.method === 'backup'">
            <el-select v-model="restoreForm.backupId" placeholder="选择要恢复的备份">
              <el-option 
                v-for="backup in completedBackups" 
                :key="backup.id" 
                :label="backup.name" 
                :value="backup.id"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item>
            <el-alert
              title="注意：恢复操作将覆盖当前所有数据，请确保已做好备份！"
              type="warning"
              :closable="false"
            />
          </el-form-item>
        </el-form>
        
        <template #footer>
          <el-button @click="showRestoreDialog = false">取消</el-button>
          <el-button type="danger" @click="confirmRestore" :loading="isRestoring">
            确认恢复
          </el-button>
        </template>
      </el-dialog>

      <!-- 备份进度对话框 -->
      <el-dialog v-model="showProgress" title="备份进度" width="400px" :close-on-click-modal="false">
        <div class="progress-content">
          <div class="progress-info">
            <el-icon size="48" color="#409EFF" class="rotating"><Loading /></el-icon>
            <p>{{ progressMessage }}</p>
          </div>
          <el-progress :percentage="progressPercentage" :show-text="false" />
          <div class="progress-details">
            <span>{{ progressDetails }}</span>
          </div>
        </div>
      </el-dialog>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Setting, 
  Refresh, 
  FolderAdd, 
  Download, 
  Upload, 
  Document,
  FolderOpened,
  Clock,
  Coin,
  Loading
} from '@element-plus/icons-vue'
import Layout from './Layout.vue'

interface BackupItem {
  id: number
  name: string
  type: 'manual' | 'auto' | 'cloud'
  size: number
  created_at: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  file_path?: string
  description?: string
}

interface BackupStats {
  totalBackups: number
  lastBackup: string
  totalSize: number
}

interface BackupSettings {
  autoBackup: boolean
  frequency: string
  backupTime: Date | null
  maxBackups: number
  cloudSync: boolean
  cloudProvider: string
  backupContent: string[]
  encryption: boolean
}

interface RestoreForm {
  method: 'file' | 'backup'
  backupId: number | null
  file: File | null
}

// 响应式数据
const backupList = ref<BackupItem[]>([])
const backupStats = ref<BackupStats>({
  totalBackups: 0,
  lastBackup: '',
  totalSize: 0
})
const isLoading = ref(false)
const showSettings = ref(false)
const showRestoreDialog = ref(false)
const showProgress = ref(false)
const isRestoring = ref(false)
const filterType = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const totalBackups = ref(0)
const progressPercentage = ref(0)
const progressMessage = ref('')
const progressDetails = ref('')

// 备份设置
const backupSettings = reactive<BackupSettings>({
  autoBackup: false,
  frequency: 'daily',
  backupTime: null,
  maxBackups: 10,
  cloudSync: false,
  cloudProvider: 'aliyun',
  backupContent: ['students', 'classes', 'grades', 'homework', 'attendance', 'settings'],
  encryption: true
})

// 恢复表单
const restoreForm = reactive<RestoreForm>({
  method: 'backup',
  backupId: null,
  file: null
})

// 计算属性
const filteredBackupList = computed(() => {
  if (!filterType.value) return backupList.value
  return backupList.value.filter(item => item.type === filterType.value)
})

const completedBackups = computed(() => {
  return backupList.value.filter(item => item.status === 'completed')
})

// 加载备份列表
const loadBackupList = async () => {
  isLoading.value = true
  try {
    const response = await window.electronAPI.invoke('backup:list', {
      page: currentPage.value,
      page_size: pageSize.value,
      type: filterType.value
    })
    
    if (response.success) {
      backupList.value = response.data.list
      totalBackups.value = response.data.total
    } else {
      ElMessage.error(response.message || '加载备份列表失败')
    }
  } catch (error) {
    console.error('加载备份列表失败:', error)
    ElMessage.error('加载备份列表失败')
  } finally {
    isLoading.value = false
  }
}

// 加载备份统计
const loadBackupStats = async () => {
  try {
    const response = await window.electronAPI.invoke('backup:stats')
    if (response.success) {
      backupStats.value = response.data
    }
  } catch (error) {
    console.error('加载备份统计失败:', error)
  }
}

// 创建备份
const createBackup = async () => {
  try {
    await ElMessageBox.confirm('确定要创建新的数据备份吗？', '确认备份', {
      type: 'info'
    })
    
    showProgress.value = true
    progressPercentage.value = 0
    progressMessage.value = '正在准备备份...'
    progressDetails.value = '初始化备份任务'
    
    const response = await window.electronAPI.invoke('backup:create', {
      type: 'manual',
      content: backupSettings.backupContent,
      encryption: backupSettings.encryption
    })
    
    if (response.success) {
      // 模拟进度更新
      const progressInterval = setInterval(() => {
        if (progressPercentage.value < 90) {
          progressPercentage.value += Math.random() * 15
          if (progressPercentage.value > 20) progressMessage.value = '正在备份数据库...'
          if (progressPercentage.value > 50) progressMessage.value = '正在压缩文件...'
          if (progressPercentage.value > 80) progressMessage.value = '正在完成备份...'
        }
      }, 500)
      
      // 等待备份完成
      setTimeout(() => {
        clearInterval(progressInterval)
        progressPercentage.value = 100
        progressMessage.value = '备份完成！'
        
        setTimeout(() => {
          showProgress.value = false
          ElMessage.success('数据备份创建成功')
          refreshBackupList()
        }, 1000)
      }, 3000)
    } else {
      showProgress.value = false
      ElMessage.error(response.message || '创建备份失败')
    }
  } catch (error) {
    showProgress.value = false
    if (error !== 'cancel') {
      console.error('创建备份失败:', error)
      ElMessage.error('创建备份失败')
    }
  }
}

// 恢复备份
const restoreBackup = async (backup: BackupItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要从备份 "${backup.name}" 恢复数据吗？这将覆盖当前所有数据！`,
      '确认恢复',
      { type: 'warning' }
    )
    
    isRestoring.value = true
    const response = await window.electronAPI.invoke('backup:restore', backup.id)
    
    if (response.success) {
      ElMessage.success('数据恢复成功，请重启应用')
    } else {
      ElMessage.error(response.message || '数据恢复失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('恢复备份失败:', error)
      ElMessage.error('恢复备份失败')
    }
  } finally {
    isRestoring.value = false
  }
}

// 下载备份
const downloadBackup = async (backup: BackupItem) => {
  try {
    const response = await window.electronAPI.invoke('backup:download', backup.id)
    if (response.success) {
      ElMessage.success('备份文件下载成功')
    } else {
      ElMessage.error(response.message || '下载失败')
    }
  } catch (error) {
    console.error('下载备份失败:', error)
    ElMessage.error('下载备份失败')
  }
}

// 删除备份
const deleteBackup = async (backup: BackupItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除备份 "${backup.name}" 吗？`,
      '确认删除',
      { type: 'warning' }
    )
    
    const response = await window.electronAPI.invoke('backup:delete', backup.id)
    if (response.success) {
      ElMessage.success('备份删除成功')
      refreshBackupList()
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除备份失败:', error)
      ElMessage.error('删除备份失败')
    }
  }
}

// 云端同步
const syncToCloud = async () => {
  if (!backupSettings.cloudSync) {
    ElMessage.warning('请先在设置中启用云存储功能')
    showSettings.value = true
    return
  }
  
  try {
    const response = await window.electronAPI.invoke('backup:syncToCloud')
    if (response.success) {
      ElMessage.success('云端同步成功')
      refreshBackupList()
    } else {
      ElMessage.error(response.message || '云端同步失败')
    }
  } catch (error) {
    console.error('云端同步失败:', error)
    ElMessage.error('云端同步失败')
  }
}

// 导出数据
const exportData = async () => {
  try {
    const response = await window.electronAPI.invoke('backup:exportData')
    if (response.success) {
      ElMessage.success('数据导出成功')
    } else {
      ElMessage.error(response.message || '数据导出失败')
    }
  } catch (error) {
    console.error('数据导出失败:', error)
    ElMessage.error('数据导出失败')
  }
}

// 保存设置
const saveSettings = async () => {
  try {
    const response = await window.electronAPI.invoke('backup:updateSettings', backupSettings)
    if (response.success) {
      ElMessage.success('备份设置保存成功')
      showSettings.value = false
    } else {
      ElMessage.error(response.message || '保存设置失败')
    }
  } catch (error) {
    console.error('保存设置失败:', error)
    ElMessage.error('保存设置失败')
  }
}

// 确认恢复
const confirmRestore = async () => {
  if (restoreForm.method === 'backup' && !restoreForm.backupId) {
    ElMessage.warning('请选择要恢复的备份')
    return
  }
  
  if (restoreForm.method === 'file' && !restoreForm.file) {
    ElMessage.warning('请选择备份文件')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      '确定要恢复数据吗？这将覆盖当前所有数据！',
      '确认恢复',
      { type: 'warning' }
    )
    
    isRestoring.value = true
    let response
    
    if (restoreForm.method === 'backup') {
      response = await window.electronAPI.invoke('backup:restore', restoreForm.backupId)
    } else {
      response = await window.electronAPI.invoke('backup:restoreFromFile', restoreForm.file)
    }
    
    if (response.success) {
      ElMessage.success('数据恢复成功，请重启应用')
      showRestoreDialog.value = false
    } else {
      ElMessage.error(response.message || '数据恢复失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('恢复数据失败:', error)
      ElMessage.error('恢复数据失败')
    }
  } finally {
    isRestoring.value = false
  }
}

// 处理文件选择
const handleFileChange = (file: any) => {
  restoreForm.file = file.raw
}

// 刷新备份列表
const refreshBackupList = () => {
  loadBackupList()
  loadBackupStats()
}

// 分页处理
const handleSizeChange = (size: number) => {
  pageSize.value = size
  loadBackupList()
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  loadBackupList()
}

// 工具函数
const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '暂无'
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

const formatDateTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

const getBackupTypeColor = (type: string) => {
  const colors = {
    manual: '#409EFF',
    auto: '#67C23A',
    cloud: '#E6A23C'
  }
  return colors[type as keyof typeof colors] || '#909399'
}

const getBackupTypeIcon = (type: string) => {
  const icons = {
    manual: 'User',
    auto: 'Timer',
    cloud: 'CloudUpload'
  }
  return icons[type as keyof typeof icons] || 'Document'
}

const getBackupTypeName = (type: string) => {
  const names = {
    manual: '手动',
    auto: '自动',
    cloud: '云端'
  }
  return names[type as keyof typeof names] || type
}

const getBackupTypeTagType = (type: string) => {
  const types = {
    manual: 'primary',
    auto: 'success',
    cloud: 'warning'
  }
  return types[type as keyof typeof types] || 'info'
}

const getStatusName = (status: string) => {
  const names = {
    pending: '等待中',
    processing: '处理中',
    completed: '已完成',
    failed: '失败'
  }
  return names[status as keyof typeof names] || status
}

const getStatusTagType = (status: string) => {
  const types = {
    pending: 'info',
    processing: 'warning',
    completed: 'success',
    failed: 'danger'
  }
  return types[status as keyof typeof types] || 'info'
}

// 加载设置
const loadSettings = async () => {
  try {
    const response = await window.electronAPI.invoke('backup:getSettings')
    if (response.success) {
      Object.assign(backupSettings, response.data)
    }
  } catch (error) {
    console.error('加载设置失败:', error)
  }
}

onMounted(() => {
  refreshBackupList()
  loadSettings()
})
</script>

<style scoped>
.backup-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.backup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.header-left h2 {
  margin: 0 0 4px 0;
  font-size: 20px;
  color: #303133;
}

.subtitle {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.header-right {
  display: flex;
  gap: 12px;
}

.quick-actions {
  padding: 24px;
}

.action-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.action-card:hover {
  border-color: #409EFF;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(64, 158, 255, 0.15);
}

.action-content {
  text-align: center;
  padding: 16px;
}

.action-content h3 {
  margin: 12px 0 8px 0;
  color: #303133;
  font-size: 16px;
}

.action-content p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.backup-overview {
  padding: 0 24px 24px;
}

.stats-card {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.stats-content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px;
}

.stats-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #f0f9ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stats-info {
  flex: 1;
}

.stats-number {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
}

.stats-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.backup-list {
  flex: 1;
  padding: 0 24px 24px;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.backup-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.progress-content {
  text-align: center;
  padding: 24px;
}

.progress-info {
  margin-bottom: 24px;
}

.progress-info p {
  margin: 16px 0 0 0;
  font-size: 16px;
  color: #303133;
}

.progress-details {
  margin-top: 12px;
  font-size: 14px;
  color: #909399;
}

.rotating {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .backup-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .header-right {
    width: 100%;
    justify-content: flex-end;
  }
  
  .quick-actions .el-col {
    margin-bottom: 16px;
  }
  
  .backup-overview .el-col {
    margin-bottom: 16px;
  }
}
</style>