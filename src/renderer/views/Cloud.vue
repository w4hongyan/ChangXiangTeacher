<template>
  <Layout>
    <div class="cloud-container">
    <div class="header">
      <h2>云存储管理</h2>
      <p class="description">配置和管理云存储服务，实现数据的自动同步和备份</p>
    </div>

    <!-- 云服务提供商列表 -->
    <el-card class="providers-card">
      <template #header>
        <div class="card-header">
          <span>云服务提供商</span>
          <el-button type="primary" @click="showAddProvider = true">
            <el-icon><Plus /></el-icon>
            添加服务商
          </el-button>
        </div>
      </template>

      <div class="providers-grid">
        <div 
          v-for="provider in cloudProviders" 
          :key="provider.id"
          class="provider-card"
          :class="{ connected: provider.connected }"
        >
          <div class="provider-header">
            <div class="provider-info">
              <el-icon class="provider-icon" :color="provider.connected ? '#67C23A' : '#909399'">
                <component :is="getProviderIcon(provider.type)" />
              </el-icon>
              <div>
                <h4>{{ provider.name }}</h4>
                <p class="provider-type">{{ getProviderTypeName(provider.type) }}</p>
              </div>
            </div>
            <el-tag :type="provider.connected ? 'success' : 'info'">
              {{ provider.connected ? '已连接' : '未连接' }}
            </el-tag>
          </div>

          <div class="provider-details">
            <div class="detail-item">
              <span class="label">存储空间:</span>
              <span class="value">{{ provider.storage || '未知' }}</span>
            </div>
            <div class="detail-item" v-if="provider.lastSync">
              <span class="label">最后同步:</span>
              <span class="value">{{ formatTime(provider.lastSync) }}</span>
            </div>
          </div>

          <div class="provider-actions">
            <el-button 
              v-if="!provider.connected" 
              type="primary" 
              size="small"
              @click="connectProvider(provider)"
              :loading="provider.connecting"
            >
              连接
            </el-button>
            <template v-else>
              <el-button 
                type="success" 
                size="small"
                @click="syncProvider(provider)"
                :loading="provider.syncing"
              >
                同步
              </el-button>
              <el-button 
                type="warning" 
                size="small"
                @click="disconnectProvider(provider)"
              >
                断开
              </el-button>
            </template>
            <el-button 
              type="info" 
              size="small"
              @click="editProvider(provider)"
            >
              编辑
            </el-button>
            <el-button 
              type="danger" 
              size="small"
              @click="deleteProvider(provider)"
            >
              删除
            </el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 同步状态 -->
    <el-card class="sync-status-card">
      <template #header>
        <span>同步状态</span>
      </template>

      <div class="sync-status">
        <div class="status-item">
          <el-icon class="status-icon"><Upload /></el-icon>
          <div class="status-info">
            <h4>自动同步</h4>
            <p>{{ syncSettings.autoSync ? '已启用' : '已禁用' }}</p>
          </div>
          <el-switch v-model="syncSettings.autoSync" @change="updateSyncSettings" />
        </div>

        <div class="status-item">
          <el-icon class="status-icon"><Timer /></el-icon>
          <div class="status-info">
            <h4>同步频率</h4>
            <p>每{{ syncSettings.frequency }}小时同步一次</p>
          </div>
          <el-select v-model="syncSettings.frequency" @change="updateSyncSettings">
            <el-option label="1小时" :value="1" />
            <el-option label="6小时" :value="6" />
            <el-option label="12小时" :value="12" />
            <el-option label="24小时" :value="24" />
          </el-select>
        </div>

        <div class="status-item">
          <el-icon class="status-icon"><Files /></el-icon>
          <div class="status-info">
            <h4>同步内容</h4>
            <p>选择要同步的数据类型</p>
          </div>
          <el-checkbox-group v-model="syncSettings.syncTypes" @change="updateSyncSettings">
            <el-checkbox label="backup">备份文件</el-checkbox>
            <el-checkbox label="data">数据库</el-checkbox>
            <el-checkbox label="config">配置文件</el-checkbox>
          </el-checkbox-group>
        </div>
      </div>
    </el-card>

    <!-- 添加/编辑服务商对话框 -->
    <el-dialog 
      v-model="showAddProvider" 
      :title="editingProvider ? '编辑云服务商' : '添加云服务商'"
      width="600px"
    >
      <el-form :model="providerForm" :rules="providerRules" ref="providerFormRef" label-width="100px">
        <el-form-item label="服务商类型" prop="type">
          <el-select v-model="providerForm.type" placeholder="选择云服务商类型">
            <el-option label="阿里云 OSS" value="aliyun" />
            <el-option label="腾讯云 COS" value="tencent" />
            <el-option label="百度云 BOS" value="baidu" />
            <el-option label="七牛云" value="qiniu" />
            <el-option label="Amazon S3" value="aws" />
          </el-select>
        </el-form-item>

        <el-form-item label="服务商名称" prop="name">
          <el-input v-model="providerForm.name" placeholder="输入自定义名称" />
        </el-form-item>

        <el-form-item label="Access Key" prop="accessKey">
          <el-input v-model="providerForm.accessKey" placeholder="输入Access Key" />
        </el-form-item>

        <el-form-item label="Secret Key" prop="secretKey">
          <el-input v-model="providerForm.secretKey" type="password" placeholder="输入Secret Key" show-password />
        </el-form-item>

        <el-form-item label="区域" prop="region">
          <el-input v-model="providerForm.region" placeholder="输入区域代码" />
        </el-form-item>

        <el-form-item label="存储桶" prop="bucket">
          <el-input v-model="providerForm.bucket" placeholder="输入存储桶名称" />
        </el-form-item>

        <el-form-item label="存储路径" prop="path">
          <el-input v-model="providerForm.path" placeholder="输入存储路径（可选）" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showAddProvider = false">取消</el-button>
        <el-button type="primary" @click="saveProvider" :loading="saving">
          {{ editingProvider ? '更新' : '添加' }}
        </el-button>
      </template>
    </el-dialog>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Upload, Timer, Files, Connection, Folder, Document } from '@element-plus/icons-vue'
import Layout from './Layout.vue'

interface CloudProvider {
  id: string
  name: string
  type: string
  accessKey: string
  secretKey: string
  region: string
  bucket: string
  path?: string
  connected: boolean
  connecting?: boolean
  syncing?: boolean
  lastSync?: string
  storage?: string
}

interface SyncSettings {
  autoSync: boolean
  frequency: number
  syncTypes: string[]
}

const cloudProviders = ref<CloudProvider[]>([])
const showAddProvider = ref(false)
const editingProvider = ref<CloudProvider | null>(null)
const saving = ref(false)

const syncSettings = reactive<SyncSettings>({
  autoSync: false,
  frequency: 6,
  syncTypes: ['backup']
})

const providerForm = reactive({
  type: '',
  name: '',
  accessKey: '',
  secretKey: '',
  region: '',
  bucket: '',
  path: ''
})

const providerRules = {
  type: [{ required: true, message: '请选择服务商类型', trigger: 'change' }],
  name: [{ required: true, message: '请输入服务商名称', trigger: 'blur' }],
  accessKey: [{ required: true, message: '请输入Access Key', trigger: 'blur' }],
  secretKey: [{ required: true, message: '请输入Secret Key', trigger: 'blur' }],
  region: [{ required: true, message: '请输入区域', trigger: 'blur' }],
  bucket: [{ required: true, message: '请输入存储桶名称', trigger: 'blur' }]
}

const providerFormRef = ref()

const getProviderIcon = (type: string) => {
  const icons = {
    aliyun: Connection,
    tencent: Connection,
    baidu: Connection,
    qiniu: Connection,
    aws: Connection
  }
  return icons[type] || Connection
}

const getProviderTypeName = (type: string) => {
  const names = {
    aliyun: '阿里云 OSS',
    tencent: '腾讯云 COS',
    baidu: '百度云 BOS',
    qiniu: '七牛云',
    aws: 'Amazon S3'
  }
  return names[type] || type
}

const formatTime = (time: string) => {
  return new Date(time).toLocaleString('zh-CN')
}

const loadProviders = async () => {
  try {
    const providers = await window.electronAPI.cloud.getProviders()
    cloudProviders.value = providers
  } catch (error) {
    console.error('加载云服务提供商失败:', error)
    ElMessage.error('加载云服务提供商失败')
  }
}

const connectProvider = async (provider: CloudProvider) => {
  provider.connecting = true
  try {
    const credentials = {
      accessKey: provider.accessKey,
      secretKey: provider.secretKey,
      region: provider.region,
      bucket: provider.bucket,
      path: provider.path
    }
    
    const result = await window.electronAPI.cloud.connect(provider.id, credentials)
    
    if (result.success) {
      provider.connected = true
      ElMessage.success(`${provider.name} 连接成功`)
    } else {
      throw new Error(result.error || '连接失败')
    }
  } catch (error) {
    console.error('连接失败:', error)
    ElMessage.error(`连接 ${provider.name} 失败: ${error.message}`)
  } finally {
    provider.connecting = false
  }
}

const disconnectProvider = async (provider: CloudProvider) => {
  try {
    const result = await window.electronAPI.cloud.disconnect(provider.id)
    
    if (result.success) {
      provider.connected = false
      provider.lastSync = undefined
      ElMessage.success(`${provider.name} 已断开连接`)
    } else {
      throw new Error(result.error || '断开连接失败')
    }
  } catch (error) {
    console.error('断开连接失败:', error)
    ElMessage.error(`断开 ${provider.name} 连接失败: ${error.message}`)
  }
}

const syncProvider = async (provider: CloudProvider) => {
  provider.syncing = true
  try {
    // 获取最新备份文件
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

const editProvider = (provider: CloudProvider) => {
  editingProvider.value = provider
  Object.assign(providerForm, {
    type: provider.type,
    name: provider.name,
    accessKey: provider.accessKey,
    secretKey: provider.secretKey,
    region: provider.region,
    bucket: provider.bucket,
    path: provider.path || ''
  })
  showAddProvider.value = true
}

const deleteProvider = async (provider: CloudProvider) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除云服务商 "${provider.name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 如果已连接，先断开连接
    if (provider.connected) {
      await disconnectProvider(provider)
    }
    
    // 从列表中移除
    const index = cloudProviders.value.findIndex(p => p.id === provider.id)
    if (index > -1) {
      cloudProviders.value.splice(index, 1)
    }
    
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const saveProvider = async () => {
  try {
    await providerFormRef.value.validate()
    
    saving.value = true
    
    if (editingProvider.value) {
      // 更新现有提供商
      Object.assign(editingProvider.value, providerForm)
      ElMessage.success('更新成功')
    } else {
      // 添加新提供商
      const newProvider: CloudProvider = {
        id: Date.now().toString(),
        ...providerForm,
        connected: false
      }
      cloudProviders.value.push(newProvider)
      ElMessage.success('添加成功')
    }
    
    showAddProvider.value = false
    resetForm()
  } catch (error) {
    console.error('保存失败:', error)
  } finally {
    saving.value = false
  }
}

const resetForm = () => {
  editingProvider.value = null
  Object.assign(providerForm, {
    type: '',
    name: '',
    accessKey: '',
    secretKey: '',
    region: '',
    bucket: '',
    path: ''
  })
  providerFormRef.value?.resetFields()
}

const updateSyncSettings = () => {
  // 这里可以调用API保存同步设置
  console.log('更新同步设置:', syncSettings)
}

onMounted(() => {
  loadProviders()
})
</script>

<style scoped>
.cloud-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  margin-bottom: 24px;
}

.header h2 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.description {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.providers-card {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.providers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 16px;
}

.provider-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s;
}

.provider-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.provider-card.connected {
  border-color: #67c23a;
  background-color: #f0f9ff;
}

.provider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.provider-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.provider-icon {
  font-size: 24px;
}

.provider-info h4 {
  margin: 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.provider-type {
  margin: 4px 0 0 0;
  color: #909399;
  font-size: 12px;
}

.provider-details {
  margin-bottom: 16px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.detail-item .label {
  color: #606266;
}

.detail-item .value {
  color: #303133;
  font-weight: 500;
}

.provider-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.sync-status-card {
  margin-bottom: 24px;
}

.sync-status {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.status-icon {
  font-size: 24px;
  color: #409eff;
}

.status-info {
  flex: 1;
}

.status-info h4 {
  margin: 0 0 4px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.status-info p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

@media (max-width: 768px) {
  .providers-grid {
    grid-template-columns: 1fr;
  }
  
  .status-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>