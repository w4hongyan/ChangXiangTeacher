<template>
  <div>
    <!-- 更新检查中 -->
    <el-notification
      v-if="updateState.checking"
      title="检查更新"
      message="正在检查新版本..."
      type="info"
      :duration="0"
      :show-close="false"
    />

    <!-- 发现新版本 -->
    <el-dialog
      v-model="updateState.available"
      title="发现新版本"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="update-content">
        <el-icon class="update-icon" :size="48" color="#409EFF">
          <Download />
        </el-icon>
        <h3>新版本 {{ updateInfo.version }} 已发布</h3>
        <p class="update-description">{{ updateInfo.releaseNotes || '修复了一些问题并改进了性能' }}</p>
        <div class="version-info">
          <p><strong>当前版本：</strong>{{ currentVersion }}</p>
          <p><strong>最新版本：</strong>{{ updateInfo.version }}</p>
          <p><strong>发布时间：</strong>{{ formatDate(updateInfo.releaseDate) }}</p>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="skipUpdate">稍后提醒</el-button>
          <el-button type="primary" @click="downloadUpdate" :loading="updateState.downloading">
            {{ updateState.downloading ? '下载中...' : '立即更新' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 下载进度 -->
    <el-dialog
      v-model="updateState.downloading"
      title="下载更新"
      width="400px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <div class="download-progress">
        <el-progress
          :percentage="downloadProgress.percent"
          :status="downloadProgress.percent === 100 ? 'success' : undefined"
        />
        <div class="progress-info">
          <p>下载进度: {{ downloadProgress.percent?.toFixed(1) }}%</p>
          <p>下载速度: {{ formatBytes(downloadProgress.bytesPerSecond) }}/s</p>
          <p>已下载: {{ formatBytes(downloadProgress.transferred) }} / {{ formatBytes(downloadProgress.total) }}</p>
        </div>
      </div>
    </el-dialog>

    <!-- 下载完成 -->
    <el-dialog
      v-model="updateState.downloaded"
      title="更新已下载"
      width="400px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="update-ready">
        <el-icon class="success-icon" :size="48" color="#67C23A">
          <CircleCheck />
        </el-icon>
        <h3>更新已准备就绪</h3>
        <p>新版本已下载完成，重启应用后即可使用最新功能。</p>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="laterInstall">稍后重启</el-button>
          <el-button type="primary" @click="installUpdate">
            立即重启
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 更新错误 -->
    <el-dialog
      v-model="updateState.error"
      title="更新失败"
      width="400px"
    >
      <div class="update-error">
        <el-icon class="error-icon" :size="48" color="#F56C6C">
          <CircleClose />
        </el-icon>
        <h3>更新检查失败</h3>
        <p class="error-message">{{ errorMessage }}</p>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="updateState.error = false">关闭</el-button>
          <el-button type="primary" @click="retryUpdate">重试</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElNotification, ElDialog, ElButton, ElProgress, ElIcon } from 'element-plus'
import { Download, CircleCheck, CircleClose } from '@element-plus/icons-vue'

// 更新状态
const updateState = reactive({
  checking: false,
  available: false,
  downloading: false,
  downloaded: false,
  error: false
})

// 更新信息
const updateInfo = ref<any>({})
const currentVersion = ref('')
const downloadProgress = ref<any>({})
const errorMessage = ref('')

// 事件监听器清理函数
const cleanupFunctions: (() => void)[] = []

// 初始化
onMounted(async () => {
  try {
    // 检查是否在Electron环境中
    if (!window.electronAPI || !window.electronAPI.updater) {
      console.log('非Electron环境或开发环境，跳过更新功能初始化')
      currentVersion.value = '开发版本'
      return
    }
    
    // 获取当前版本
    currentVersion.value = await window.electronAPI.updater.getAppVersion()
    
    // 设置更新事件监听
    setupUpdateListeners()
  } catch (error) {
    console.error('初始化更新组件失败:', error)
    currentVersion.value = '未知版本'
  }
})

// 清理事件监听
onUnmounted(() => {
  cleanupFunctions.forEach(cleanup => cleanup())
})

// 设置更新事件监听
function setupUpdateListeners() {
  // 检查是否在Electron环境中
  if (!window.electronAPI || !window.electronAPI.updater) {
    console.log('非Electron环境，跳过更新事件监听设置')
    return
  }
  
  // 检查更新中
  const cleanupChecking = window.electronAPI.updater.onUpdateChecking(() => {
    updateState.checking = true
    setTimeout(() => {
      updateState.checking = false
    }, 3000)
  })
  cleanupFunctions.push(cleanupChecking)

  // 发现新版本
  const cleanupAvailable = window.electronAPI.updater.onUpdateAvailable((info: any) => {
    updateState.checking = false
    updateState.available = true
    updateInfo.value = info
  })
  cleanupFunctions.push(cleanupAvailable)

  // 没有新版本
  const cleanupNotAvailable = window.electronAPI.updater.onUpdateNotAvailable(() => {
    updateState.checking = false
    ElNotification({
      title: '已是最新版本',
      message: '当前已是最新版本，无需更新',
      type: 'success',
      duration: 3000
    })
  })
  cleanupFunctions.push(cleanupNotAvailable)

  // 下载进度
  const cleanupProgress = window.electronAPI.updater.onDownloadProgress((progress: any) => {
    downloadProgress.value = progress
  })
  cleanupFunctions.push(cleanupProgress)

  // 下载完成
  const cleanupDownloaded = window.electronAPI.updater.onUpdateDownloaded(() => {
    updateState.downloading = false
    updateState.downloaded = true
  })
  cleanupFunctions.push(cleanupDownloaded)

  // 更新错误
  const cleanupError = window.electronAPI.updater.onUpdateError((error: string) => {
    updateState.checking = false
    updateState.downloading = false
    updateState.error = true
    errorMessage.value = error
  })
  cleanupFunctions.push(cleanupError)
}

// 跳过更新
function skipUpdate() {
  updateState.available = false
}

// 下载更新
async function downloadUpdate() {
  if (!window.electronAPI || !window.electronAPI.updater) {
    console.log('非Electron环境，无法下载更新')
    return
  }
  
  try {
    updateState.available = false
    updateState.downloading = true
    await window.electronAPI.updater.downloadUpdate()
  } catch (error) {
    console.error('下载更新失败:', error)
    updateState.downloading = false
    updateState.error = true
    errorMessage.value = '下载更新失败，请检查网络连接'
  }
}

// 稍后安装
function laterInstall() {
  updateState.downloaded = false
}

// 安装更新
function installUpdate() {
  if (!window.electronAPI || !window.electronAPI.updater) {
    console.log('非Electron环境，无法安装更新')
    return
  }
  window.electronAPI.updater.installUpdate()
}

// 重试更新
async function retryUpdate() {
  if (!window.electronAPI || !window.electronAPI.updater) {
    console.log('非Electron环境，无法重试更新')
    return
  }
  
  updateState.error = false
  try {
    await window.electronAPI.updater.checkForUpdates()
  } catch (error) {
    console.error('重试更新失败:', error)
  }
}

// 格式化日期
function formatDate(dateString: string) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('zh-CN')
}

// 格式化字节大小
function formatBytes(bytes: number) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 暴露手动检查更新方法
defineExpose({
  checkForUpdates: async () => {
    if (!window.electronAPI || !window.electronAPI.updater) {
      console.log('非Electron环境，无法检查更新')
      return
    }
    
    try {
      await window.electronAPI.updater.checkForUpdates()
    } catch (error) {
      console.error('手动检查更新失败:', error)
    }
  }
})
</script>

<style scoped>
.update-content {
  text-align: center;
  padding: 20px 0;
}

.update-icon {
  margin-bottom: 16px;
}

.update-description {
  color: #666;
  margin: 16px 0;
  line-height: 1.6;
}

.version-info {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
  margin: 16px 0;
  text-align: left;
}

.version-info p {
  margin: 8px 0;
  color: #333;
}

.download-progress {
  padding: 20px 0;
}

.progress-info {
  margin-top: 16px;
  text-align: center;
}

.progress-info p {
  margin: 4px 0;
  color: #666;
  font-size: 14px;
}

.update-ready {
  text-align: center;
  padding: 20px 0;
}

.success-icon {
  margin-bottom: 16px;
}

.update-error {
  text-align: center;
  padding: 20px 0;
}

.error-icon {
  margin-bottom: 16px;
}

.error-message {
  color: #666;
  margin: 16px 0;
  word-break: break-all;
}

.dialog-footer {
  text-align: right;
}

.dialog-footer .el-button {
  margin-left: 12px;
}
</style>