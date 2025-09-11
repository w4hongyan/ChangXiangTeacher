<template>
  <Layout>
    <div class="backup-container">
      <div class="page-header">
        <h2>数据备份与同步</h2>
        <div class="header-actions">
          <el-button type="primary" @click="createBackup" :loading="backupLoading">
            <el-icon><Download /></el-icon>
            创建备份
          </el-button>
          <el-button @click="showRestoreDialog = true">
            <el-icon><Upload /></el-icon>
            恢复数据
          </el-button>
          <el-button @click="showSettingsDialog = true">
            <el-icon><Setting /></el-icon>
            备份设置
          </el-button>
        </div>
      </div>

      <!-- 备份统计卡片 -->
      <el-row :gutter="20" class="stats-row">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon backup">
                <el-icon><FolderOpened /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ backupStats.total }}</div>
                <div class="stat-label">总备份数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon size">
                <el-icon><Coin /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ formatFileSize(backupStats.totalSize) }}</div>
                <div class="stat-label">总大小</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon cloud">
                <el-icon><CloudUpload /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ backupStats.cloudBackups }}</div>
                <div class="stat-label">云端备份</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon auto">
                <el-icon><Timer /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ backupStats.autoBackups }}</div>
                <div class="stat-label">自动备份</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 备份列表 -->
      <el-card class="backup-list-card">
        <template #header>
          <div class="card-header">
            <span>备份列表</span>
            <div class="header-controls">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索备份"
                style="width: 200px"
                clearable
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              <el-select v-model="filterType" placeholder="备份类型" style="width: 120px">
                <el-option label="全部" value="" />
                <el-option label="手动" value="manual" />
                <el-option label="自动" value="auto" />
                <el-option label="云端" value="cloud" />
              </el-select>
            </div>
          </div>
        </template>

        <el-table :data="filteredBackups" stripe v-loading="loading">
          <el-table-column prop="name" label="备份名称" min-width="200">
            <template #default="{ row }">
              <div class="backup-name">
                <el-icon class="backup-type-icon" :class="row.type">
                  <FolderOpened v-if="row.type === 'manual'" />
                  <Timer v-else-if="row.type === 'auto'" />
                  <CloudUpload v-else />
                </el-icon>
                <span>{{ row.name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="type" label="类型" width="100">
            <template #default="{ row }">
              <el-tag :type="getTypeColor(row.type)">{{ getTypeText(row.type) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="size" label="大小" width="120">
            <template #default="{ row }">
              {{ formatFileSize(row.size) }}
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusColor(row.status)">{{ getStatusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button-group>
                <el-button size="small" @click="restoreBackup(row)" :disabled="row.status !== 'completed'">
                  <el-icon><RefreshLeft /></el-icon>
                  恢复
                </el-button>
                <el-button size="small" @click="downloadBackup(row)" :disabled="row.status !== 'completed'">
                  <el-icon><Download /></el-icon>
                  下载
                </el-button>
                <el-button size="small" type="danger" @click="deleteBackup(row)">
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </el-button-group>
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
            @size-change="loadBackups"
            @current-change="loadBackups"
          />
        </div>
      </el-card>

      <!-- 云同步状态 -->
      <el-card class="cloud-sync-card">
        <template #header>
          <div class="card-header">
            <span>云同步状态</span>
            <el-switch
              v-model="cloudSyncEnabled"
              @change="toggleCloudSync"
              active-text="已启用"
              inactive-text="已禁用"
            />
          </div>
        </template>

        <div v-if="cloudSyncEnabled" class="cloud-providers">
          <div
            v-for="provider in cloudProviders"
            :key="provider.id"
            class="provider-card"
            :class="{ active: provider.connected }"
          >
            <div class="provider-info">
              <div class="provider-icon">
                <el-icon><CloudUpload /></el-icon>
              </div>
              <div class="provider-details">
                <h4>{{ provider.name }}</h4>
                <p class="provider-status">
                  <el-tag :type="provider.connected ? 'success' : 'info'">
                    {{ provider.connected ? '已连接' : '未连接' }}
                  </el-tag>
                </p>
                <p v-if="provider.connected" class="last-sync">
                  上次同步: {{ formatDateTime(provider.lastSync) }}
                </p>
              </div>
            </div>
            <div class="provider-actions">
              <el-button
                v-if="!provider.connected"
                type="primary"
                size="small"
                @click="connectProvider(provider)"
              >
                连接
              </el-button>
              <div v-else class="connected-actions">
                <el-button size="small" @click="syncNow(provider)" :loading="provider.syncing">
                  <el-icon><Refresh /></el-icon>
                  立即同步
                </el-button>
                <el-button size="small" type="danger" @click="disconnectProvider(provider)">
                  断开连接
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="cloud-disabled">
          <el-empty description="云同步已禁用" />
        </div>
      </el-card>

      <!-- 恢复数据对话框 -->
      <el-dialog v-model="showRestoreDialog" title="恢复数据" width="600px">
        <div class="restore-options">
          <el-radio-group v-model="restoreType">
            <el-radio label="file">从文件恢复</el-radio>
            <el-radio label="backup">从备份恢复</el-radio>
          </el-radio-group>
        </div>

        <div v-if="restoreType === 'file'" class="file-upload">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :show-file-list="true"
            :limit="1"
            accept=".db,.sql,.json"
            @change="handleFileChange"
          >
            <el-button type="primary">
              <el-icon><Upload /></el-icon>
              选择备份文件
            </el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持 .db、.sql、.json 格式的备份文件
              </div>
            </template>
          </el-upload>
        </div>

        <div v-else class="backup-select">
          <el-select v-model="selectedBackupId" placeholder="选择要恢复的备份" style="width: 100%">
            <el-option
              v-for="backup in availableBackups"
              :key="backup.id"
              :label="`${backup.name} (${formatDateTime(backup.created_at)})`"
              :value="backup.id"
            />
          </el-select>
        </div>

        <el-alert
          title="警告"
          type="warning"
          description="恢复数据将覆盖当前所有数据，请确保已做好备份！"
          show-icon
          :closable="false"
          style="margin-top: 20px"
        />

        <template #footer>
          <div class="dialog-footer">
            <el-button @click="showRestoreDialog = false">取消</el-button>
            <el-button
              type="danger"
              @click="confirmRestore"
              :loading="restoreLoading"
              :disabled="!canRestore"
            >
              确认恢复
            </el-button>
          </div>
        </template>
      </el-dialog>

      <!-- 备份设置对话框 -->
      <el-dialog v-model="showSettingsDialog" title="备份设置" width="700px">
        <el-form :model="backupSettings" label-width="120px">
          <el-form-item label="自动备份">
            <el-switch v-model="backupSettings.autoBackup" />
          </el-form-item>
          
          <template v-if="backupSettings.autoBackup">
            <el-form-item label="备份频率">
              <el-select v-model="backupSettings.frequency">
                <el-option label="每小时" value="hourly" />
                <el-option label="每天" value="daily" />
                <el-option label="每周" value="weekly" />
                <el-option label="每月" value="monthly" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="备份时间">
              <el-time-picker v-model="backupSettings.backupTime" format="HH:mm" />
            </el-form-item>
          </template>
          
          <el-form-item label="保留数量">
            <el-input-number v-model="backupSettings.keepCount" :min="1" :max="100" />
          </el-form-item>
          
          <el-form-item label="备份路径">
            <el-input v-model="backupSettings.backupPath" readonly>
              <template #append>
                <el-button @click="selectBackupPath">
                  <el-icon><Folder /></el-icon>
                  选择
                </el-button>
              </template>
            </el-input>
          </el-form-item>
          
          <el-form-item label="压缩备份">
            <el-switch v-model="backupSettings.compress" />
          </el-form-item>
          
          <el-form-item label="加密备份">
            <el-switch v-model="backupSettings.encrypt" />
          </el-form-item>
          
          <el-form-item v-if="backupSettings.encrypt" label="加密密码">
            <el-input v-model="backupSettings.encryptPassword" type="password" show-password />
          </el-form-item>
        </el-form>
        
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="showSettingsDialog = false">取消</el-button>
            <el-button type="primary" @click="saveSettings" :loading="settingsLoading">
              保存设置
            </el-button>
          </div>
        </template>
      </el-dialog>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Download,
  Upload,
  Setting,
  FolderOpened,
  Coin,
  Upload as CloudUpload,
  Timer,
  Search,
  RefreshLeft,
  Delete,
  Refresh,
  Folder
} from '@element-plus/icons-vue'
import Layout from './Layout.vue'

interface BackupItem {
  id: number
  name: string
  type: 'manual' | 'auto' | 'cloud'
  size: number
  created_at: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  path?: string
  description?: string
}

interface CloudProvider {
  id: string
  name: string
  connected: boolean
  lastSync?: string
  syncing?: boolean
}

interface BackupSettings {
  autoBackup: boolean
  frequency: string
  backupTime: Date
  keepCount: number
  backupPath: string
  compress: boolean
  encrypt: boolean
  encryptPassword: string
}

const loading = ref(false)
const backupLoading = ref(false)
const restoreLoading = ref(false)
const settingsLoading = ref(false)
const showRestoreDialog = ref(false)
const showSettingsDialog = ref(false)
const searchKeyword = ref('')
const filterType = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const totalBackups = ref(0)
const restoreType = ref('backup')
const selectedBackupId = ref<number>()
const cloudSyncEnabled = ref(false)

const backups = ref<BackupItem[]>([])
const availableBackups = ref<BackupItem[]>([])

const backupStats = reactive({
  total: 0,
  totalSize: 0,
  cloudBackups: 0,
  autoBackups: 0
})

const cloudProviders = ref<CloudProvider[]>([
  {
    id: 'onedrive',
    name: 'OneDrive',
    connected: false
  },
  {
    id: 'googledrive',
    name: 'Google Drive',
    connected: false
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    connected: false
  }
])

const backupSettings = reactive<BackupSettings>({
  autoBackup: false,
  frequency: 'daily',
  backupTime: new Date(),
  keepCount: 10,
  backupPath: '',
  compress: true,
  encrypt: false,
  encryptPassword: ''
})

const filteredBackups = computed(() => {
  let result = backups.value
  
  if (searchKeyword.value) {
    result = result.filter(backup => 
      backup.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  }
  
  if (filterType.value) {
    result = result.filter(backup => backup.type === filterType.value)
  }
  
  return result
})

const canRestore = computed(() => {
  if (restoreType.value === 'backup') {
    return !!selectedBackupId.value
  }
  return true // 文件上传会有单独的验证
})

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    manual: 'primary',
    auto: 'success',
    cloud: 'warning'
  }
  return colors[type] || 'info'
}

const getTypeText = (type: string) => {
  const texts: Record<string, string> = {
    manual: '手动',
    auto: '自动',
    cloud: '云端'
  }
  return texts[type] || type
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'info',
    processing: 'warning',
    completed: 'success',
    failed: 'danger'
  }
  return colors[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: '等待中',
    processing: '处理中',
    completed: '已完成',
    failed: '失败'
  }
  return texts[status] || status
}

const loadBackups = async () => {
  loading.value = true
  try {
    const options = {
      page: currentPage.value,
      pageSize: pageSize.value,
      search: searchKeyword.value,
      type: filterType.value
    }
    
    const result = await window.electronAPI.backup.list(options)
    backups.value = result.data
    totalBackups.value = result.total
    availableBackups.value = backups.value.filter(b => b.status === 'completed')
    
    // 获取统计数据
    const stats = await window.electronAPI.backup.stats()
    Object.assign(backupStats, stats)
  } catch (error) {
    console.error('加载备份列表失败:', error)
    ElMessage.error('加载备份列表失败')
  } finally {
    loading.value = false
  }
}

const createBackup = async () => {
  backupLoading.value = true
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const options = {
      name: `手动备份_${timestamp}`,
      description: '手动创建的备份',
      compress: true,
      encrypt: false
    }
    
    await window.electronAPI.backup.create(options)
    ElMessage.success('备份创建成功')
    loadBackups()
  } catch (error) {
    console.error('创建备份失败:', error)
    ElMessage.error('创建备份失败')
  } finally {
    backupLoading.value = false
  }
}

const restoreBackup = async (backup: BackupItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要恢复备份 "${backup.name}" 吗？这将覆盖当前所有数据！`,
      '确认恢复',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await window.electronAPI.backup.restore({ backupId: backup.id })
    ElMessage.success('数据恢复成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('恢复备份失败:', error)
      ElMessage.error('恢复备份失败')
    }
  }
}

const downloadBackup = async (backup: BackupItem) => {
  try {
    ElMessage.info('开始下载备份文件...')
    const result = await window.electronAPI.backup.download(backup.id)
    if (result.success) {
      ElMessage.success('备份文件下载完成')
    } else {
      ElMessage.info('下载已取消')
    }
  } catch (error) {
    console.error('下载备份失败:', error)
    ElMessage.error('下载备份失败')
  }
}

const deleteBackup = async (backup: BackupItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除备份 "${backup.name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await window.electronAPI.backup.delete(backup.id)
    ElMessage.success('备份删除成功')
    loadBackups()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除备份失败:', error)
      ElMessage.error('删除备份失败')
    }
  }
}

const toggleCloudSync = (enabled: boolean) => {
  ElMessage.info(enabled ? '云同步已启用' : '云同步已禁用')
}

const connectProvider = async (provider: CloudProvider) => {
  try {
    ElMessage.info(`正在连接到 ${provider.name}...`)
    
    const result = await window.electronAPI.cloud.connect(provider.id, {
      provider: provider.id,
      name: provider.name
    })
    
    if (result.success) {
      provider.connected = true
      provider.lastSync = new Date().toISOString()
      ElMessage.success(`${provider.name} 连接成功`)
    } else {
      throw new Error(result.error || '连接失败')
    }
  } catch (error) {
    console.error('连接云服务失败:', error)
    ElMessage.error(`连接 ${provider.name} 失败: ${error.message}`)
  }
}

const disconnectProvider = async (provider: CloudProvider) => {
  try {
    await ElMessageBox.confirm(
      `确定要断开与 ${provider.name} 的连接吗？`,
      '确认断开',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const result = await window.electronAPI.cloud.disconnect(provider.id)
    
    if (result.success) {
      provider.connected = false
      provider.lastSync = undefined
      ElMessage.success(`已断开与 ${provider.name} 的连接`)
    } else {
      throw new Error(result.error || '断开连接失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('断开连接失败:', error)
      ElMessage.error(`断开 ${provider.name} 连接失败: ${error.message}`)
    }
  }
}

const syncNow = async (provider: CloudProvider) => {
  provider.syncing = true
  try {
    ElMessage.info(`正在同步到 ${provider.name}...`)
    
    // 获取最新备份文件路径
    const backups = await window.electronAPI.backup.list()
    if (backups.data.length === 0) {
      throw new Error('没有可同步的备份文件')
    }
    
    const latestBackup = backups.data[0]
    const result = await window.electronAPI.cloud.sync(provider.id, latestBackup.path)
    
    if (result.success) {
      provider.lastSync = new Date().toISOString()
      ElMessage.success(`${provider.name} 同步完成`)
    } else {
      throw new Error(result.error || '同步失败')
    }
  } catch (error) {
    console.error('同步失败:', error)
    ElMessage.error(`${provider.name} 同步失败: ${error.message}`)
  } finally {
    provider.syncing = false
  }
}

const handleFileChange = (file: any) => {
  console.log('选择的文件:', file)
}

const confirmRestore = async () => {
  restoreLoading.value = true
  try {
    const options: any = {}
    
    if (restoreType.value === 'backup') {
      options.backupId = selectedBackupId.value
    } else {
      // 文件恢复逻辑需要处理文件上传
      ElMessage.error('文件恢复功能开发中')
      return
    }
    
    await window.electronAPI.backup.restore(options)
    ElMessage.success('数据恢复成功')
    showRestoreDialog.value = false
  } catch (error) {
    console.error('恢复数据失败:', error)
    ElMessage.error('恢复数据失败')
  } finally {
    restoreLoading.value = false
  }
}

const selectBackupPath = async () => {
  try {
    const result = await window.electronAPI.backup.selectPath()
    if (result.success) {
      backupSettings.backupPath = result.path
      ElMessage.success('备份路径选择成功')
    }
  } catch (error) {
    console.error('选择备份路径失败:', error)
    ElMessage.error('选择备份路径失败')
  }
}

const saveSettings = async () => {
  settingsLoading.value = true
  try {
    await window.electronAPI.backup.saveSettings({
      autoBackup: backupSettings.autoBackup,
      frequency: backupSettings.frequency,
      backupTime: backupSettings.backupTime.toTimeString().slice(0, 5),
      keepCount: backupSettings.keepCount,
      backupPath: backupSettings.backupPath,
      compress: backupSettings.compress,
      encrypt: backupSettings.encrypt,
      encryptPassword: backupSettings.encryptPassword
    })
    ElMessage.success('备份设置保存成功')
    showSettingsDialog.value = false
  } catch (error) {
    console.error('保存设置失败:', error)
    ElMessage.error('保存设置失败')
  } finally {
    settingsLoading.value = false
  }
}

onMounted(async () => {
  loadBackups()
  
  // 加载备份设置
  try {
    const settings = await window.electronAPI.backup.getSettings()
    Object.assign(backupSettings, {
      autoBackup: settings.autoBackup,
      frequency: settings.frequency,
      backupTime: new Date(`2000-01-01 ${settings.backupTime}`),
      keepCount: settings.keepCount,
      backupPath: settings.backupPath,
      compress: settings.compress,
      encrypt: settings.encrypt,
      encryptPassword: settings.encryptPassword
    })
  } catch (error) {
    console.error('加载备份设置失败:', error)
  }
  
  // 加载云服务提供商
  try {
    const providers = await window.electronAPI.cloud.getProviders()
    cloudProviders.value = providers
  } catch (error) {
    console.error('加载云服务提供商失败:', error)
  }
})
</script>

<style scoped>
.backup-container {
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

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  padding: 20px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 24px;
  color: white;
}

.stat-icon.backup {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.size {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.cloud {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.auto {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.backup-list-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-controls {
  display: flex;
  gap: 10px;
  align-items: center;
}

.backup-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.backup-type-icon {
  font-size: 16px;
}

.backup-type-icon.manual {
  color: #409eff;
}

.backup-type-icon.auto {
  color: #67c23a;
}

.backup-type-icon.cloud {
  color: #e6a23c;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.cloud-sync-card {
  margin-bottom: 20px;
}

.cloud-providers {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.provider-card {
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.3s;
}

.provider-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.provider-card.active {
  border-color: #67c23a;
  background: #f0f9ff;
}

.provider-info {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.provider-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: #409eff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  color: white;
  font-size: 20px;
}

.provider-details h4 {
  margin: 0 0 8px 0;
  color: #303133;
}

.provider-status {
  margin: 4px 0;
}

.last-sync {
  margin: 4px 0 0 0;
  font-size: 12px;
  color: #909399;
}

.provider-actions {
  display: flex;
  justify-content: flex-end;
}

.connected-actions {
  display: flex;
  gap: 8px;
}

.cloud-disabled {
  text-align: center;
  padding: 40px;
}

.restore-options {
  margin-bottom: 20px;
}

.file-upload {
  margin-top: 20px;
}

.backup-select {
  margin-top: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 768px) {
  .stats-row .el-col {
    margin-bottom: 16px;
  }
  
  .header-controls {
    flex-direction: column;
    gap: 8px;
  }
  
  .cloud-providers {
    grid-template-columns: 1fr;
  }
  
  .provider-info {
    flex-direction: column;
    text-align: center;
  }
  
  .provider-icon {
    margin-right: 0;
    margin-bottom: 12px;
  }
}
</style>