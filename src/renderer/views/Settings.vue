<template>
  <Layout>
    <div class="settings-container">
      <div class="page-header">
        <h1>系统设置</h1>
        <p>配置系统参数，个性化您的教学管理工具</p>
      </div>

      <div class="content">
        <!-- 课程表设置 -->
        <el-card class="setting-card">
          <template #header>
            <div class="card-header">
              <span>课程表设置</span>
              <el-button type="primary" @click="saveScheduleSettings">保存设置</el-button>
            </div>
          </template>
          
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
        </el-card>
        
        <!-- AI服务设置 -->
        <el-card class="setting-card">
          <template #header>
            <div class="card-header">
              <span>AI服务设置</span>
              <el-button type="primary" @click="saveAISettings">保存设置</el-button>
            </div>
          </template>
          
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
        </el-card>
        
        <!-- 其他设置 -->
        <el-card class="setting-card">
          <template #header>
            <div class="card-header">
              <span>其他设置</span>
            </div>
          </template>
          
          <div class="coming-soon">
            <el-empty description="更多设置功能正在开发中，敬请期待...">
              <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
            </el-empty>
          </div>
        </el-card>
      </div>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
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
</style>