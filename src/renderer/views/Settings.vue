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

// 使用设置store
const settingsStore = useSettingsStore()
const scheduleSettings = reactive<ScheduleSettings>({ ...settingsStore.scheduleSettings })

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

const loadScheduleSettings = () => {
  Object.assign(scheduleSettings, settingsStore.scheduleSettings)
}

onMounted(() => {
  loadScheduleSettings()
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
</style>