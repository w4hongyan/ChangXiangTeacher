<template>
  <Layout>
    <div class="settings-container">
      <div class="page-header">
        <h1>系统设置</h1>
        <p>配置系统参数，个性化您的教学管理工具</p>
      </div>

      <div class="content">
        <el-tabs v-model="activeTab" class="settings-tabs" tab-position="left">
          <!-- 课程表设置 -->
          <el-tab-pane label="课程表设置" name="schedule">
            <div class="tab-content">
              <div class="tab-header">
                <h3>课程表设置</h3>
                <el-button type="primary" @click="saveScheduleSettings">保存设置</el-button>
              </div>
              
              <el-form :model="scheduleSettings" label-width="120px" class="settings-form">
                <el-form-item label="每周天数">
                  <el-select v-model="scheduleSettings.weekDays" placeholder="选择每周天数">
                    <el-option label="5天（周一到周五）" :value="5" />
                    <el-option label="6天（周一到周六）" :value="6" />
                    <el-option label="7天（周一到周日）" :value="7" />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="每天节数">
                  <el-input-number 
                    v-model="scheduleSettings.periodsPerDay" 
                    :min="1" 
                    :max="12" 
                    placeholder="每天课程节数"
                  />
                </el-form-item>
                
                <el-divider>课程时间设置</el-divider>
                
                <div class="time-periods-section">
                  <div class="section-header">
                    <span>节次时间安排</span>
                    <el-button type="primary" size="small" @click="addTimePeriod">添加节次</el-button>
                  </div>
                  
                  <div class="time-periods-list">
                    <div 
                      v-for="(period, index) in scheduleSettings.timePeriods" 
                      :key="index"
                      class="time-period-item"
                    >
                      <el-form-item :label="`第${index + 1}节`" class="period-form">
                        <div class="period-inputs">
                          <el-time-picker
                            v-model="period.startTime"
                            placeholder="开始时间"
                            format="HH:mm"
                            value-format="HH:mm"
                          />
                          <span class="time-separator">-</span>
                          <el-time-picker
                            v-model="period.endTime"
                            placeholder="结束时间"
                            format="HH:mm"
                            value-format="HH:mm"
                          />
                          <el-button 
                            type="danger" 
                            size="small" 
                            @click="removeTimePeriod(index)"
                            :disabled="scheduleSettings.timePeriods.length <= 1"
                          >
                            删除
                          </el-button>
                        </div>
                      </el-form-item>
                    </div>
                  </div>
                </div>
              </el-form>
            </div>
          </el-tab-pane>
          
          <!-- AI服务设置 -->
          <el-tab-pane label="AI服务设置" name="ai">
            <div class="tab-content">
              <div class="tab-header">
                <h3>AI服务设置</h3>
                <el-button type="primary" @click="saveAISettings">保存设置</el-button>
              </div>
              
              <el-form :model="aiSettings" label-width="120px" class="settings-form">
                <el-form-item label="智谱AI密钥">
                  <el-input
                    v-model="aiSettings.zhipuApiKey"
                    type="password"
                    placeholder="请输入智谱AI的API密钥"
                    show-password
                    clearable
                  />
                  <div class="setting-tip">
                    <el-text type="info" size="small">
                      用于AI PPT生成功能，请前往 
                      <el-link href="https://www.bigmodel.cn/" target="_blank" type="primary">智谱AI官网</el-link> 
                      获取API密钥
                    </el-text>
                  </div>
                </el-form-item>
                
                <el-form-item label="API基础URL">
                  <el-input
                    v-model="aiSettings.baseURL"
                    placeholder="API基础URL（可选，使用默认值）"
                    clearable
                  />
                  <div class="setting-tip">
                    <el-text type="info" size="small">
                      默认：https://open.bigmodel.cn/api/paas/v4/chat/completions
                    </el-text>
                  </div>
                </el-form-item>
                
                <el-form-item label="AI模型">
                  <el-select v-model="aiSettings.model" placeholder="选择AI模型">
                    <el-option label="GLM-4-Plus（推荐）" value="glm-4-plus" />
                    <el-option label="GLM-4" value="glm-4" />
                    <el-option label="GLM-4-Air" value="glm-4-air" />
                    <el-option label="GLM-4-Flash" value="glm-4-flash" />
                  </el-select>
                  <div class="setting-tip">
                    <el-text type="info" size="small">
                      GLM-4-Plus提供最佳的生成质量，GLM-4-Flash响应更快
                    </el-text>
                  </div>
                </el-form-item>
                
                <el-form-item label="连接测试">
                  <el-button 
                    type="success" 
                    @click="testAIConnection" 
                    :loading="testingConnection"
                    :disabled="!aiSettings.zhipuApiKey"
                  >
                    {{ testingConnection ? '测试中...' : '测试连接' }}
                  </el-button>
                  <div class="setting-tip">
                    <el-text type="info" size="small">
                      测试API密钥是否有效以及网络连接是否正常
                    </el-text>
                  </div>
                </el-form-item>
              </el-form>
            </div>
          </el-tab-pane>
          
          <!-- 系统设置 -->
          <el-tab-pane label="系统设置" name="system">
            <div class="tab-content">
              <div class="tab-header">
                <h3>系统设置</h3>
              </div>
              
              <div class="coming-soon">
                <el-empty description="更多系统设置功能正在开发中，敬请期待...">
                  <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
                </el-empty>
              </div>
            </div>
          </el-tab-pane>
          
          <!-- 外观设置 -->
          <el-tab-pane label="外观设置" name="appearance">
            <div class="tab-content">
              <div class="tab-header">
                <h3>外观设置</h3>
              </div>
              
              <el-form label-width="120px" class="settings-form">
                <el-form-item label="主题模式">
                  <el-radio-group v-model="themeMode">
                    <el-radio label="light">浅色模式</el-radio>
                    <el-radio label="dark">深色模式</el-radio>
                    <el-radio label="auto">跟随系统</el-radio>
                  </el-radio-group>
                  <div class="setting-tip">
                    <el-text type="info" size="small">
                      选择您喜欢的界面主题，深色模式可以减少眼部疲劳
                    </el-text>
                  </div>
                </el-form-item>
                
                <el-form-item label="界面缩放">
                  <el-slider 
                    v-model="uiScale" 
                    :min="80" 
                    :max="150" 
                    :step="10"
                    show-stops
                    show-input
                    :format-tooltip="(val) => val + '%'"
                  />
                  <div class="setting-tip">
                    <el-text type="info" size="small">
                      调整界面元素的大小，适应不同分辨率的显示器
                    </el-text>
                  </div>
                </el-form-item>
              </el-form>
            </div>
          </el-tab-pane>
          
          <!-- 数据管理 -->
          <el-tab-pane label="数据管理" name="data">
            <div class="tab-content">
              <div class="tab-header">
                <h3>数据管理</h3>
              </div>
              
              <el-form label-width="120px" class="settings-form">
                <el-form-item label="数据备份">
                  <div class="data-actions">
                    <el-button type="primary" @click="exportData">导出数据</el-button>
                    <el-button type="success" @click="importData">导入数据</el-button>
                  </div>
                  <div class="setting-tip">
                    <el-text type="info" size="small">
                      定期备份您的数据，防止意外丢失
                    </el-text>
                  </div>
                </el-form-item>
                
                <el-form-item label="数据清理">
                  <div class="data-actions">
                    <el-button type="warning" @click="clearCache">清理缓存</el-button>
                    <el-button type="danger" @click="resetData">重置数据</el-button>
                  </div>
                  <div class="setting-tip">
                    <el-text type="warning" size="small">
                      重置数据将清除所有本地数据，请谨慎操作
                    </el-text>
                  </div>
                </el-form-item>
              </el-form>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import Layout from './Layout.vue'
import { useSettingsStore, type TimePeriod, type ScheduleSettings } from '../stores/settings'

// AI服务配置接口
interface AISettings {
  zhipuApiKey: string
  baseURL: string
  model: string
}

// 使用设置store
const settingsStore = useSettingsStore()
const scheduleSettings = reactive<ScheduleSettings>({ ...settingsStore.scheduleSettings })

// AI设置
const aiSettings = reactive<AISettings>({
  zhipuApiKey: '',
  baseURL: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
  model: 'glm-4-plus'
})

// 测试连接状态
const testingConnection = ref(false)

// 当前激活的tab
const activeTab = ref('schedule')

// 外观设置
const themeMode = ref('light')
const uiScale = ref(100)

const addTimePeriod = () => {
  scheduleSettings.timePeriods.push({
    startTime: '',
    endTime: ''
  })
  scheduleSettings.periodsPerDay = scheduleSettings.timePeriods.length
}

const removeTimePeriod = (index: number) => {
  if (scheduleSettings.timePeriods.length > 1) {
    scheduleSettings.timePeriods.splice(index, 1)
    scheduleSettings.periodsPerDay = scheduleSettings.timePeriods.length
  }
}

const saveScheduleSettings = async () => {
  try {
    // 验证时间设置
    for (let i = 0; i < scheduleSettings.timePeriods.length; i++) {
      const period = scheduleSettings.timePeriods[i]
      if (!period.startTime || !period.endTime) {
        ElMessage.error(`第${i + 1}节课时间不能为空`)
        return
      }
      if (period.startTime >= period.endTime) {
        ElMessage.error(`第${i + 1}节课开始时间必须早于结束时间`)
        return
      }
    }
    
    // 使用store保存设置
    settingsStore.saveScheduleSettings(scheduleSettings)
    
    // 这里可以调用后端API保存设置
    // const result = await window.electron.ipcRenderer.invoke('settings:saveScheduleSettings', scheduleSettings)
    
    ElMessage.success('课程表设置保存成功')
  } catch (error) {
    console.error('保存设置失败:', error)
    ElMessage.error('保存设置失败')
  }
}

// AI设置相关方法
const saveAISettings = async () => {
  try {
    if (!aiSettings.zhipuApiKey.trim()) {
      ElMessage.error('请输入智谱AI密钥')
      return
    }
    
    // 保存到localStorage
    localStorage.setItem('ai-settings', JSON.stringify(aiSettings))
    
    ElMessage.success('AI服务设置保存成功')
  } catch (error) {
    console.error('保存AI设置失败:', error)
    ElMessage.error('保存AI设置失败')
  }
}

const testAIConnection = async () => {
  if (!aiSettings.zhipuApiKey.trim()) {
    ElMessage.error('请先输入API密钥')
    return
  }
  
  testingConnection.value = true
  
  try {
    const response = await fetch(aiSettings.baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiSettings.zhipuApiKey}`
      },
      body: JSON.stringify({
        model: aiSettings.model,
        messages: [{
          role: 'user',
          content: '测试连接'
        }],
        max_tokens: 10
      })
    })
    
    if (response.ok) {
      ElMessage.success('AI服务连接测试成功')
    } else {
      const errorData = await response.json()
      ElMessage.error(`连接测试失败: ${errorData.error?.message || '未知错误'}`)
    }
  } catch (error) {
    console.error('连接测试失败:', error)
    ElMessage.error('连接测试失败，请检查网络连接和API密钥')
  } finally {
    testingConnection.value = false
  }
}

const loadAISettings = () => {
  try {
    const saved = localStorage.getItem('ai-settings')
    if (saved) {
      const settings = JSON.parse(saved)
      Object.assign(aiSettings, settings)
    }
  } catch (error) {
    console.error('加载AI设置失败:', error)
  }
}

const loadScheduleSettings = () => {
  Object.assign(scheduleSettings, settingsStore.scheduleSettings)
}

// 数据管理方法
const exportData = async () => {
  try {
    ElMessage.info('数据导出功能开发中...')
  } catch (error) {
    console.error('导出数据失败:', error)
    ElMessage.error('导出数据失败')
  }
}

const importData = async () => {
  try {
    ElMessage.info('数据导入功能开发中...')
  } catch (error) {
    console.error('导入数据失败:', error)
    ElMessage.error('导入数据失败')
  }
}

const clearCache = async () => {
  try {
    // 清理本地缓存
    localStorage.clear()
    sessionStorage.clear()
    ElMessage.success('缓存清理成功')
  } catch (error) {
    console.error('清理缓存失败:', error)
    ElMessage.error('清理缓存失败')
  }
}

const resetData = async () => {
  try {
    await ElMessageBox.confirm(
      '此操作将清除所有本地数据，包括设置、学生信息、成绩等，是否继续？',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    // 重置所有数据
    localStorage.clear()
    sessionStorage.clear()
    
    ElMessage.success('数据重置成功，请重启应用')
    
    // 可以在这里调用应用重启逻辑
    setTimeout(() => {
      window.location.reload()
    }, 2000)
  } catch (error) {
    if (error !== 'cancel') {
      console.error('重置数据失败:', error)
      ElMessage.error('重置数据失败')
    }
  }
}

onMounted(() => {
  loadScheduleSettings()
  loadAISettings()
})
</script>

<style scoped>
.settings-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  padding: 24px;
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  color: #333;
}

.page-header h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
}

.page-header p {
  margin: 0;
  opacity: 0.9;
  font-size: 16px;
}

.content {
  flex: 1;
  padding: 20px;
  background: #f5f7fa;
  overflow-y: auto;
}

/* Tab样式优化 */
:deep(.settings-tabs) {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

:deep(.el-tabs--left .el-tabs__header) {
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  border-right: 1px solid #e9ecef;
  margin-right: 0;
}

:deep(.el-tabs--left .el-tabs__nav-wrap) {
  padding: 20px 0;
}

:deep(.el-tabs--left .el-tabs__item) {
  font-size: 16px;
  font-weight: 500;
  color: #666;
  transition: all 0.3s ease;
  padding: 16px 24px;
  margin-bottom: 8px;
  border-radius: 0 25px 25px 0;
  position: relative;
  overflow: hidden;
}

:deep(.el-tabs--left .el-tabs__item::before) {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 0;
  height: 100%;
  background: linear-gradient(135deg, #409eff, #66b3ff);
  transition: width 0.3s ease;
  z-index: -1;
}

:deep(.el-tabs--left .el-tabs__item:hover) {
  color: #409eff;
  background: rgba(64, 158, 255, 0.05);
  transform: translateX(4px);
}

:deep(.el-tabs--left .el-tabs__item:hover::before) {
  width: 4px;
}

:deep(.el-tabs--left .el-tabs__item.is-active) {
  color: #409eff;
  font-weight: 600;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.1), rgba(102, 179, 255, 0.05));
  transform: translateX(6px);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

:deep(.el-tabs--left .el-tabs__item.is-active::before) {
  width: 4px;
}

:deep(.el-tabs--left .el-tabs__active-bar) {
  display: none;
}

:deep(.el-tabs__content) {
  padding: 0;
}

/* Tab内容区域 */
:deep(.el-tab-pane) {
  animation: fadeInSlide 0.4s ease-out;
}

@keyframes fadeInSlide {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.tab-content {
  padding: 24px;
  background: #fff;
  min-height: 500px;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

.tab-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
  position: relative;
}

.tab-header h3::after {
  content: '';
  position: absolute;
  bottom: -16px;
  left: 0;
  width: 40px;
  height: 3px;
  background: linear-gradient(90deg, #409eff, #66b3ff);
  border-radius: 2px;
}

.setting-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.settings-form {
  max-width: 800px;
}

.time-periods-section {
  margin-top: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-weight: 500;
  color: #333;
}

.time-periods-list {
  background: #fafafa;
  border-radius: 8px;
  padding: 16px;
}

.time-period-item {
  margin-bottom: 16px;
}

.time-period-item:last-child {
  margin-bottom: 0;
}

.period-form {
  margin-bottom: 0;
}

.period-inputs {
  display: flex;
  align-items: center;
  gap: 12px;
}

.time-separator {
  color: #666;
  font-weight: 500;
}

.coming-soon {
  padding: 40px 0;
}

.data-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #333;
}

:deep(.el-divider__text) {
  font-weight: 500;
  color: #409eff;
}

.setting-tip {
  margin-top: 8px;
  padding: 8px 12px;
  background: #f0f9ff;
  border-radius: 4px;
  border-left: 3px solid #409eff;
}

.setting-tip .el-text {
  line-height: 1.5;
}

.setting-tip .el-link {
  margin: 0 2px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .content {
    padding: 10px;
  }
  
  :deep(.settings-tabs) {
    border-radius: 8px;
  }
  
  :deep(.el-tabs--left .el-tabs__item) {
    font-size: 14px;
    padding: 12px 16px;
  }
  
  .tab-content {
    padding: 16px;
  }
  
  .data-actions {
    flex-direction: column;
  }
  
  .data-actions .el-button {
    width: 100%;
  }
}
</style>