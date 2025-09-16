<template>
  <Layout>
    <div class="essay-grading-container">
      <!-- 页面头部 -->
      <div class="grading-header">
        <div class="header-left">
          <el-button @click="$router.back()" type="text">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
          <h2>✍️ 作文批改</h2>
        </div>
        <div class="header-right">
          <el-button @click="showHistory = true" type="primary" plain>
            <el-icon><Clock /></el-icon>
            批改记录
          </el-button>
          <el-button @click="showSettings = true" type="info" plain>
            <el-icon><Setting /></el-icon>
            批改设置
          </el-button>
        </div>
      </div>

      <!-- 主要内容区域 -->
      <div class="grading-content">
        <el-row :gutter="24">
          <!-- 左侧输入区域 -->
          <el-col :span="12">
            <el-card class="input-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>📝 作文信息</span>
                </div>
              </template>
              
              <el-form :model="essayForm" label-width="100px" :rules="formRules" ref="essayFormRef">
                <el-form-item label="作文标题" prop="title">
                  <el-input v-model="essayForm.title" placeholder="请输入作文标题" />
                </el-form-item>
                
                <el-form-item label="年级" prop="grade">
                  <el-select v-model="essayForm.grade" placeholder="选择年级">
                    <el-option label="小学低年级" value="primary_low" />
                    <el-option label="小学高年级" value="primary_high" />
                    <el-option label="初中" value="middle" />
                    <el-option label="高中" value="high" />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="作文类型" prop="type">
                  <el-select v-model="essayForm.type" placeholder="选择作文类型">
                    <el-option label="记叙文" value="narrative" />
                    <el-option label="议论文" value="argumentative" />
                    <el-option label="说明文" value="expository" />
                    <el-option label="应用文" value="practical" />
                    <el-option label="诗歌" value="poetry" />
                    <el-option label="散文" value="prose" />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="满分" prop="maxScore">
                  <el-input-number v-model="essayForm.maxScore" :min="50" :max="150" :step="10" />
                  <span style="margin-left: 8px; color: #909399;">分</span>
                </el-form-item>
                
                <el-form-item label="作文要求">
                  <el-input 
                    v-model="essayForm.requirements" 
                    type="textarea" 
                    :rows="3" 
                    placeholder="请输入作文要求、评分标准等（可选）"
                  />
                </el-form-item>
                
                <el-form-item label="作文内容" prop="content">
                  <el-input 
                    v-model="essayForm.content" 
                    type="textarea" 
                    :rows="12" 
                    placeholder="请粘贴或输入学生的作文内容..."
                    show-word-limit
                    maxlength="5000"
                  />
                </el-form-item>
              </el-form>
              
              <div class="action-buttons">
                <el-button type="primary" @click="gradeEssay" :loading="isGrading" size="large">
                  <el-icon><Edit /></el-icon>
                  开始批改
                </el-button>
                <el-button @click="resetForm" size="large">
                  <el-icon><Refresh /></el-icon>
                  重置
                </el-button>
              </div>
            </el-card>
          </el-col>
          
          <!-- 右侧结果区域 -->
          <el-col :span="12">
            <el-card class="result-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>📊 批改结果</span>
                  <div v-if="gradingResult">
                    <el-button @click="saveResult" type="success" size="small">
                      <el-icon><Download /></el-icon>
                      保存
                    </el-button>
                    <el-button @click="exportResult" type="primary" size="small">
                      <el-icon><Document /></el-icon>
                      导出
                    </el-button>
                  </div>
                </div>
              </template>
              
              <div class="result-content">
                <div v-if="!gradingResult && !isGrading" class="empty-state">
                  <el-icon size="64" color="#C0C4CC"><Edit /></el-icon>
                  <p>请填写左侧作文信息并点击"开始批改"</p>
                </div>
                
                <div v-if="isGrading" class="grading-state">
                  <el-icon size="48" color="#409EFF" class="rotating"><Loading /></el-icon>
                  <p>AI正在仔细批改作文，请稍候...</p>
                  <div class="grading-progress">
                    <el-progress :percentage="gradingProgress" :show-text="false" />
                    <span class="progress-text">{{ gradingSteps[currentStep] }}</span>
                  </div>
                </div>
                
                <div v-if="gradingResult" class="grading-content">
                  <!-- 总体评分 -->
                  <div class="score-section">
                    <div class="score-display">
                      <div class="score-number">{{ gradingResult.totalScore }}</div>
                      <div class="score-total">/ {{ essayForm.maxScore }}</div>
                    </div>
                    <div class="score-level">
                      <el-tag :type="getScoreType(gradingResult.totalScore, essayForm.maxScore)" size="large">
                        {{ getScoreLevel(gradingResult.totalScore, essayForm.maxScore) }}
                      </el-tag>
                    </div>
                  </div>
                  
                  <!-- 分项评分 -->
                  <div class="detailed-scores">
                    <h3>📋 分项评分</h3>
                    <div class="score-items">
                      <div v-for="item in gradingResult.detailedScores" :key="item.category" class="score-item">
                        <div class="item-name">{{ item.category }}</div>
                        <div class="item-score">
                          <el-progress 
                            :percentage="(item.score / item.maxScore) * 100" 
                            :color="getProgressColor(item.score / item.maxScore)"
                          />
                          <span class="score-text">{{ item.score }}/{{ item.maxScore }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- 优点 -->
                  <div class="feedback-section">
                    <h3>✨ 优点</h3>
                    <div class="feedback-content positive">
                      <div v-html="formatFeedback(gradingResult.strengths)"></div>
                    </div>
                  </div>
                  
                  <!-- 需要改进的地方 -->
                  <div class="feedback-section">
                    <h3>🔧 需要改进</h3>
                    <div class="feedback-content improvement">
                      <div v-html="formatFeedback(gradingResult.improvements)"></div>
                    </div>
                  </div>
                  
                  <!-- 具体建议 -->
                  <div class="feedback-section">
                    <h3>💡 具体建议</h3>
                    <div class="feedback-content suggestions">
                      <div v-html="formatFeedback(gradingResult.suggestions)"></div>
                    </div>
                  </div>
                  
                  <!-- 总评 -->
                  <div class="feedback-section">
                    <h3>📝 总评</h3>
                    <div class="feedback-content summary">
                      <div v-html="formatFeedback(gradingResult.summary)"></div>
                    </div>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 批改记录对话框 -->
      <el-dialog v-model="showHistory" title="批改记录" width="80%" top="5vh">
        <div class="history-content">
          <div v-if="historyList.length === 0" class="empty-history">
            <el-empty description="暂无批改记录" />
          </div>
          <div v-else>
            <el-table :data="historyList" stripe>
              <el-table-column prop="title" label="作文标题" min-width="150" />
              <el-table-column prop="grade" label="年级" width="100">
                <template #default="{ row }">
                  <el-tag size="small">{{ getGradeName(row.grade) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="type" label="类型" width="100">
                <template #default="{ row }">
                  <el-tag size="small" type="info">{{ getTypeName(row.type) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="total_score" label="得分" width="100">
                <template #default="{ row }">
                  <span class="score-display-small">{{ row.total_score }}/{{ row.max_score }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="created_at" label="批改时间" width="150">
                <template #default="{ row }">
                  {{ formatDate(row.created_at) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="150">
                <template #default="{ row }">
                  <el-button size="small" type="primary" @click="loadHistoryItem(row)">
                    查看
                  </el-button>
                  <el-button size="small" type="danger" @click="deleteHistoryItem(row.id)">
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-dialog>

      <!-- 批改设置对话框 -->
      <el-dialog v-model="showSettings" title="批改设置" width="500px">
        <el-form :model="gradingSettings" label-width="120px">
          <el-form-item label="批改严格程度">
            <el-radio-group v-model="gradingSettings.strictness">
              <el-radio label="lenient">宽松</el-radio>
              <el-radio label="moderate">适中</el-radio>
              <el-radio label="strict">严格</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="重点关注">
            <el-checkbox-group v-model="gradingSettings.focusAreas">
              <el-checkbox label="content">内容</el-checkbox>
              <el-checkbox label="structure">结构</el-checkbox>
              <el-checkbox label="language">语言</el-checkbox>
              <el-checkbox label="creativity">创意</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          <el-form-item label="反馈详细程度">
            <el-slider v-model="gradingSettings.detailLevel" :min="1" :max="5" show-stops />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showSettings = false">取消</el-button>
          <el-button type="primary" @click="saveSettings">保存</el-button>
        </template>
      </el-dialog>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  ArrowLeft, 
  Clock, 
  Setting, 
  Edit, 
  Refresh, 
  Download, 
  Document, 
  Loading 
} from '@element-plus/icons-vue'
import Layout from '../Layout.vue'

interface EssayForm {
  title: string
  grade: string
  type: string
  maxScore: number
  requirements: string
  content: string
}

interface DetailedScore {
  category: string
  score: number
  maxScore: number
}

interface GradingResult {
  totalScore: number
  detailedScores: DetailedScore[]
  strengths: string
  improvements: string
  suggestions: string
  summary: string
}

interface GradingSettings {
  strictness: string
  focusAreas: string[]
  detailLevel: number
}

// 响应式数据
const essayForm = reactive<EssayForm>({
  title: '',
  grade: '',
  type: '',
  maxScore: 100,
  requirements: '',
  content: ''
})

const gradingResult = ref<GradingResult | null>(null)
const isGrading = ref(false)
const gradingProgress = ref(0)
const currentStep = ref(0)
const showHistory = ref(false)
const showSettings = ref(false)
const historyList = ref([])
const essayFormRef = ref()

// 批改设置
const gradingSettings = reactive<GradingSettings>({
  strictness: 'moderate',
  focusAreas: ['content', 'structure', 'language'],
  detailLevel: 3
})

// 批改步骤
const gradingSteps = [
  '正在分析作文结构...',
  '正在评估内容质量...',
  '正在检查语言表达...',
  '正在生成改进建议...',
  '正在完成最终评分...'
]

// 表单验证规则
const formRules = {
  title: [{ required: true, message: '请输入作文标题', trigger: 'blur' }],
  grade: [{ required: true, message: '请选择年级', trigger: 'change' }],
  type: [{ required: true, message: '请选择作文类型', trigger: 'change' }],
  content: [{ required: true, message: '请输入作文内容', trigger: 'blur' }]
}

// 批改作文
const gradeEssay = async () => {
  if (!essayFormRef.value) return
  
  try {
    await essayFormRef.value.validate()
    
    isGrading.value = true
    gradingProgress.value = 0
    currentStep.value = 0
    
    // 模拟批改进度
    const progressInterval = setInterval(() => {
      if (gradingProgress.value < 90) {
        gradingProgress.value += Math.random() * 15
        if (gradingProgress.value > 20 && currentStep.value === 0) currentStep.value = 1
        if (gradingProgress.value > 40 && currentStep.value === 1) currentStep.value = 2
        if (gradingProgress.value > 60 && currentStep.value === 2) currentStep.value = 3
        if (gradingProgress.value > 80 && currentStep.value === 3) currentStep.value = 4
      }
    }, 500)
    
    const response = await window.electronAPI.invoke('ai:gradeEssay', {
      ...essayForm,
      settings: gradingSettings
    })
    
    clearInterval(progressInterval)
    gradingProgress.value = 100
    
    if (response.success) {
      gradingResult.value = response.data
      ElMessage.success('作文批改完成！')
    } else {
      ElMessage.error(response.message || '批改失败')
    }
  } catch (error) {
    console.error('批改作文失败:', error)
    ElMessage.error('批改失败，请检查网络连接')
  } finally {
    isGrading.value = false
  }
}

// 重置表单
const resetForm = () => {
  Object.assign(essayForm, {
    title: '',
    grade: '',
    type: '',
    maxScore: 100,
    requirements: '',
    content: ''
  })
  gradingResult.value = null
  if (essayFormRef.value) {
    essayFormRef.value.clearValidate()
  }
}

// 保存结果
const saveResult = async () => {
  if (!gradingResult.value) return
  
  try {
    const response = await window.electronAPI.invoke('ai:saveEssayGrading', {
      ...essayForm,
      result: gradingResult.value
    })
    
    if (response.success) {
      ElMessage.success('批改结果已保存')
      loadHistory()
    } else {
      ElMessage.error(response.message || '保存失败')
    }
  } catch (error) {
    console.error('保存结果失败:', error)
    ElMessage.error('保存失败')
  }
}

// 导出结果
const exportResult = async () => {
  if (!gradingResult.value) return
  
  try {
    const response = await window.electronAPI.invoke('ai:exportEssayGrading', {
      ...essayForm,
      result: gradingResult.value
    })
    
    if (response.success) {
      ElMessage.success('批改结果已导出')
    } else {
      ElMessage.error(response.message || '导出失败')
    }
  } catch (error) {
    console.error('导出结果失败:', error)
    ElMessage.error('导出失败')
  }
}

// 保存设置
const saveSettings = async () => {
  try {
    await window.electronAPI.invoke('ai:updateGradingSettings', gradingSettings)
    showSettings.value = false
    ElMessage.success('设置已保存')
  } catch (error) {
    console.error('保存设置失败:', error)
    ElMessage.error('保存设置失败')
  }
}

// 加载历史记录
const loadHistory = async () => {
  try {
    const response = await window.electronAPI.invoke('ai:getEssayGradingHistory')
    if (response.success) {
      historyList.value = response.data
    }
  } catch (error) {
    console.error('加载历史记录失败:', error)
  }
}

// 加载历史项目
const loadHistoryItem = (item: any) => {
  Object.assign(essayForm, {
    title: item.title,
    grade: item.grade,
    type: item.type,
    maxScore: item.max_score,
    requirements: item.requirements,
    content: item.content
  })
  
  try {
    gradingResult.value = JSON.parse(item.result_data)
  } catch (error) {
    console.error('解析历史数据失败:', error)
  }
  
  showHistory.value = false
}

// 删除历史项目
const deleteHistoryItem = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定删除这条批改记录吗？', '确认删除', {
      type: 'warning'
    })
    
    const response = await window.electronAPI.invoke('ai:deleteEssayGrading', id)
    if (response.success) {
      ElMessage.success('删除成功')
      loadHistory()
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error) {
    // 用户取消删除
  }
}

// 工具函数
const getScoreType = (score: number, maxScore: number) => {
  const percentage = score / maxScore
  if (percentage >= 0.9) return 'success'
  if (percentage >= 0.8) return 'primary'
  if (percentage >= 0.7) return 'warning'
  return 'danger'
}

const getScoreLevel = (score: number, maxScore: number) => {
  const percentage = score / maxScore
  if (percentage >= 0.9) return '优秀'
  if (percentage >= 0.8) return '良好'
  if (percentage >= 0.7) return '中等'
  if (percentage >= 0.6) return '及格'
  return '需努力'
}

const getProgressColor = (percentage: number) => {
  if (percentage >= 0.8) return '#67C23A'
  if (percentage >= 0.6) return '#E6A23C'
  return '#F56C6C'
}

const formatFeedback = (content: string) => {
  if (!content) return ''
  return content
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^(\d+\.)\s/gm, '<strong>$1</strong> ')
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

const getGradeName = (grade: string) => {
  const names = {
    primary_low: '小学低年级',
    primary_high: '小学高年级',
    middle: '初中',
    high: '高中'
  }
  return names[grade as keyof typeof names] || grade
}

const getTypeName = (type: string) => {
  const names = {
    narrative: '记叙文',
    argumentative: '议论文',
    expository: '说明文',
    practical: '应用文',
    poetry: '诗歌',
    prose: '散文'
  }
  return names[type as keyof typeof names] || type
}

// 加载设置
const loadSettings = async () => {
  try {
    const response = await window.electronAPI.invoke('ai:getGradingSettings')
    if (response.success) {
      Object.assign(gradingSettings, response.data)
    }
  } catch (error) {
    console.error('加载设置失败:', error)
  }
}

onMounted(() => {
  loadHistory()
  loadSettings()
})
</script>

<style scoped>
.essay-grading-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.grading-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.header-right {
  display: flex;
  gap: 12px;
}

.grading-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.input-card, .result-card {
  height: calc(100vh - 140px);
  overflow-y: auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #303133;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
}

.result-content {
  height: calc(100% - 60px);
}

.empty-state, .grading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #909399;
}

.grading-state p {
  margin: 16px 0;
  font-size: 16px;
}

.grading-progress {
  width: 200px;
  text-align: center;
}

.progress-text {
  margin-top: 8px;
  font-size: 14px;
  color: #606266;
}

.rotating {
  animation: rotate 2s linear infinite;
}

.grading-content {
  padding: 16px 0;
}

.score-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  margin-bottom: 24px;
}

.score-display {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.score-number {
  font-size: 48px;
  font-weight: bold;
}

.score-total {
  font-size: 24px;
  opacity: 0.8;
}

.detailed-scores {
  margin-bottom: 24px;
}

.detailed-scores h3 {
  color: #303133;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #f0f0f0;
}

.score-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.score-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.item-name {
  width: 80px;
  font-weight: 500;
  color: #606266;
}

.item-score {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.score-text {
  min-width: 60px;
  text-align: right;
  font-weight: 500;
  color: #303133;
}

.feedback-section {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.feedback-section:last-child {
  border-bottom: none;
}

.feedback-section h3 {
  color: #303133;
  font-size: 16px;
  margin: 0 0 12px 0;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #409EFF;
}

.feedback-content {
  padding: 12px 16px;
  border-radius: 8px;
  line-height: 1.8;
}

.feedback-content.positive {
  background: #f0f9ff;
  border-left: 4px solid #67C23A;
  color: #529b2e;
}

.feedback-content.improvement {
  background: #fef0f0;
  border-left: 4px solid #F56C6C;
  color: #c45656;
}

.feedback-content.suggestions {
  background: #fdf6ec;
  border-left: 4px solid #E6A23C;
  color: #b88230;
}

.feedback-content.summary {
  background: #f4f4f5;
  border-left: 4px solid #909399;
  color: #606266;
}

.history-content {
  max-height: 60vh;
  overflow-y: auto;
}

.empty-history {
  text-align: center;
  padding: 40px;
}

.score-display-small {
  font-weight: 600;
  color: #409EFF;
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
  .grading-content {
    padding: 16px;
  }
  
  .grading-content .el-row {
    flex-direction: column;
  }
  
  .grading-content .el-col {
    width: 100%;
    margin-bottom: 16px;
  }
  
  .input-card, .result-card {
    height: auto;
  }
  
  .score-section {
    flex-direction: column;
    gap: 16px;
  }
  
  .score-number {
    font-size: 36px;
  }
}
</style>