<template>
  <Layout>
    <div class="lesson-prep-assistant">
      <div class="prep-header">
        <div class="header-left">
          <el-button @click="goBack" type="text" size="large">
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
          <h2>📚 备课助手</h2>
        </div>
        <div class="header-right">
          <el-button type="primary" @click="showTemplateManager" size="small">
            <el-icon><DocumentChecked /></el-icon>
            模板管理
          </el-button>
        </div>
      </div>

      <div class="prep-container">
        <!-- 工具选择区域 -->
        <div class="prep-tools">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-card class="tool-card" @click="openTool('lesson_plan')" :class="{ active: activeTool === 'lesson_plan' }">
                <div class="tool-icon">
                  <el-icon size="32" color="#409EFF"><Notebook /></el-icon>
                </div>
                <h3>教案生成</h3>
                <p>智能生成详细教案</p>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card class="tool-card" @click="openTool('content_analysis')" :class="{ active: activeTool === 'content_analysis' }">
                <div class="tool-icon">
                  <el-icon size="32" color="#67C23A"><Reading /></el-icon>
                </div>
                <h3>内容分析</h3>
                <p>分析教学重点和难点</p>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card class="tool-card" @click="openTool('question_generation')" :class="{ active: activeTool === 'question_generation' }">
                <div class="tool-icon">
                  <el-icon size="32" color="#E6A23C"><QuestionFilled /></el-icon>
                </div>
                <h3>题目生成</h3>
                <p>自动生成练习题和测试题</p>
              </el-card>
            </el-col>
          </el-row>
          
          <el-row :gutter="20" style="margin-top: 20px">
            <el-col :span="8">
              <el-card class="tool-card" @click="openTool('curriculum_planning')" :class="{ active: activeTool === 'curriculum_planning' }">
                <div class="tool-icon">
                  <el-icon size="32" color="#F56C6C"><DataAnalysis /></el-icon>
                </div>
                <h3>课程规划</h3>
                <p>制定学期教学计划</p>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card class="tool-card" @click="openTool('resource_library')" :class="{ active: activeTool === 'resource_library' }">
                <div class="tool-icon">
                  <el-icon size="32" color="#909399"><Document /></el-icon>
                </div>
                <h3>资源库</h3>
                <p>教学资源收藏和管理</p>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card class="tool-card" @click="openTool('ppt_generation')" :class="{ active: activeTool === 'ppt_generation' }">
                <div class="tool-icon">
                  <el-icon size="32" color="#606266"><Present /></el-icon>
                </div>
                <h3>PPT生成</h3>
                <p>自动生成教学课件</p>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <!-- 工作区域 -->
        <div class="prep-workspace" v-if="activeTool">
          <!-- 教案生成 -->
          <div v-if="activeTool === 'lesson_plan'" class="workspace-content">
            <div class="workspace-header">
              <h3>📝 教案生成器</h3>
              <p>填写基本信息，AI将为您生成详细的教案</p>
            </div>
            
            <el-form :model="lessonForm" label-width="100px" class="prep-form">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="学科">
                    <el-select v-model="lessonForm.subject" placeholder="请选择学科">
                      <el-option label="语文" value="语文"></el-option>
                      <el-option label="数学" value="数学"></el-option>
                      <el-option label="英语" value="英语"></el-option>
                      <el-option label="物理" value="物理"></el-option>
                      <el-option label="化学" value="化学"></el-option>
                      <el-option label="生物" value="生物"></el-option>
                      <el-option label="历史" value="历史"></el-option>
                      <el-option label="地理" value="地理"></el-option>
                      <el-option label="政治" value="政治"></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="年级">
                    <el-select v-model="lessonForm.grade" placeholder="请选择年级">
                      <el-option label="小学一年级" value="小学一年级"></el-option>
                      <el-option label="小学二年级" value="小学二年级"></el-option>
                      <el-option label="小学三年级" value="小学三年级"></el-option>
                      <el-option label="小学四年级" value="小学四年级"></el-option>
                      <el-option label="小学五年级" value="小学五年级"></el-option>
                      <el-option label="小学六年级" value="小学六年级"></el-option>
                      <el-option label="初中一年级" value="初中一年级"></el-option>
                      <el-option label="初中二年级" value="初中二年级"></el-option>
                      <el-option label="初中三年级" value="初中三年级"></el-option>
                      <el-option label="高中一年级" value="高中一年级"></el-option>
                      <el-option label="高中二年级" value="高中二年级"></el-option>
                      <el-option label="高中三年级" value="高中三年级"></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
              
              <el-form-item label="课题">
                <el-input v-model="lessonForm.topic" placeholder="请输入课题名称"></el-input>
              </el-form-item>
              
              <el-form-item label="教学目标">
                <el-input 
                  v-model="lessonForm.objectives" 
                  type="textarea" 
                  :rows="3" 
                  placeholder="请描述教学目标（可选）"
                ></el-input>
              </el-form-item>
              
              <el-form-item label="课时">
                <el-input-number v-model="lessonForm.duration" :min="1" :max="10" placeholder="课时数"></el-input-number>
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="generateLessonPlan" :loading="isGenerating">
                  <el-icon><MagicStick /></el-icon>
                  生成教案
                </el-button>
                <el-button @click="clearForm">清空</el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 内容分析 -->
          <div v-else-if="activeTool === 'content_analysis'" class="workspace-content">
            <div class="workspace-header">
              <h3>🔍 内容分析器</h3>
              <p>输入教学内容，AI将分析重点难点和教学建议</p>
            </div>
            
            <el-form :model="analysisForm" label-width="100px" class="prep-form">
              <el-form-item label="教学内容">
                <el-input 
                  v-model="analysisForm.content" 
                  type="textarea" 
                  :rows="8" 
                  placeholder="请输入需要分析的教学内容..."
                ></el-input>
              </el-form-item>
              
              <el-form-item label="分析维度">
                <el-checkbox-group v-model="analysisForm.dimensions">
                  <el-checkbox label="重点难点">重点难点</el-checkbox>
                  <el-checkbox label="知识结构">知识结构</el-checkbox>
                  <el-checkbox label="教学方法">教学方法建议</el-checkbox>
                  <el-checkbox label="学生理解">学生理解难度</el-checkbox>
                </el-checkbox-group>
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="analyzeContent" :loading="isAnalyzing">
                  <el-icon><DataAnalysis /></el-icon>
                  开始分析
                </el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 题目生成 -->
          <div v-else-if="activeTool === 'question_generation'" class="workspace-content">
            <div class="workspace-header">
              <h3>❓ 题目生成器</h3>
              <p>根据教学内容自动生成各类练习题</p>
            </div>
            
            <el-form :model="questionForm" label-width="100px" class="prep-form">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="题目类型">
                    <el-select v-model="questionForm.type" placeholder="请选择题目类型">
                      <el-option label="选择题" value="choice"></el-option>
                      <el-option label="填空题" value="blank"></el-option>
                      <el-option label="简答题" value="short_answer"></el-option>
                      <el-option label="论述题" value="essay"></el-option>
                      <el-option label="计算题" value="calculation"></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="题目数量">
                    <el-input-number v-model="questionForm.count" :min="1" :max="20"></el-input-number>
                  </el-form-item>
                </el-col>
              </el-row>
              
              <el-form-item label="难度等级">
                <el-radio-group v-model="questionForm.difficulty">
                  <el-radio label="easy">简单</el-radio>
                  <el-radio label="medium">中等</el-radio>
                  <el-radio label="hard">困难</el-radio>
                </el-radio-group>
              </el-form-item>
              
              <el-form-item label="知识点">
                <el-input 
                  v-model="questionForm.knowledge" 
                  type="textarea" 
                  :rows="3" 
                  placeholder="请输入相关知识点..."
                ></el-input>
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="generateQuestions" :loading="isGeneratingQuestions">
                  <el-icon><QuestionFilled /></el-icon>
                  生成题目
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>

        <!-- 结果展示区域 -->
        <div class="result-area" v-if="generatedContent">
          <div class="result-header">
            <h3>生成结果</h3>
            <div class="result-actions">
              <el-button @click="copyResult" size="small">
                <el-icon><DocumentCopy /></el-icon>
                复制
              </el-button>
              <el-button @click="saveResult" size="small">
                <el-icon><Download /></el-icon>
                保存
              </el-button>
              <el-button @click="exportResult" size="small">
                <el-icon><UploadFilled /></el-icon>
                导出
              </el-button>
            </div>
          </div>
          
          <div class="result-content">
            <div v-html="formatContent(generatedContent)"></div>
          </div>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  ArrowLeft, 
  DocumentChecked, 
  Notebook, 
  Reading, 
  QuestionFilled, 
  DataAnalysis, 
  Document, 
  Present,
  MagicStick,
  DocumentCopy,
  Download,
  UploadFilled
} from '@element-plus/icons-vue'
import Layout from './Layout.vue'

const router = useRouter()

// 响应式数据
const activeTool = ref('')
const isGenerating = ref(false)
const isAnalyzing = ref(false)
const isGeneratingQuestions = ref(false)
const generatedContent = ref('')

// 表单数据
const lessonForm = reactive({
  subject: '',
  grade: '',
  topic: '',
  objectives: '',
  duration: 1
})

const analysisForm = reactive({
  content: '',
  dimensions: ['重点难点', '教学方法']
})

const questionForm = reactive({
  type: 'choice',
  count: 5,
  difficulty: 'medium',
  knowledge: ''
})

// 方法
const goBack = () => {
  router.push('/ai-assistant')
}

const showTemplateManager = () => {
  ElMessage.info('模板管理功能开发中...')
}

const openTool = (tool: string) => {
  activeTool.value = tool
  generatedContent.value = ''
}

const generateLessonPlan = async () => {
  if (!lessonForm.subject || !lessonForm.grade || !lessonForm.topic) {
    ElMessage.warning('请填写必要信息')
    return
  }

  isGenerating.value = true
  
  try {
    const prompt = `请为${lessonForm.grade}${lessonForm.subject}课程生成一份详细的教案。
课题：${lessonForm.topic}
课时：${lessonForm.duration}课时
${lessonForm.objectives ? '教学目标：' + lessonForm.objectives : ''}

请包含以下内容：
1. 教学目标
2. 教学重点和难点
3. 教学方法
4. 教学过程（详细步骤）
5. 板书设计
6. 作业布置
7. 教学反思`

    const result = await window.electronAPI.ai.chat('lesson_prep_session', prompt, 'lesson_prep')
    if (result.success) {
      generatedContent.value = result.response
      ElMessage.success('教案生成成功')
    } else {
      ElMessage.error('生成失败: ' + result.error)
    }
  } catch (error) {
    console.error('生成教案失败:', error)
    ElMessage.error('生成失败，请检查网络连接')
  } finally {
    isGenerating.value = false
  }
}

const analyzeContent = async () => {
  if (!analysisForm.content.trim()) {
    ElMessage.warning('请输入需要分析的内容')
    return
  }

  isAnalyzing.value = true
  
  try {
    const dimensions = analysisForm.dimensions.join('、')
    const prompt = `请分析以下教学内容，重点关注：${dimensions}

教学内容：
${analysisForm.content}

请提供详细的分析报告。`

    const result = await window.electronAPI.ai.chat('content_analysis_session', prompt, 'content_analysis')
    if (result.success) {
      generatedContent.value = result.response
      ElMessage.success('内容分析完成')
    } else {
      ElMessage.error('分析失败: ' + result.error)
    }
  } catch (error) {
    console.error('内容分析失败:', error)
    ElMessage.error('分析失败，请检查网络连接')
  } finally {
    isAnalyzing.value = false
  }
}

const generateQuestions = async () => {
  if (!questionForm.knowledge.trim()) {
    ElMessage.warning('请输入相关知识点')
    return
  }

  isGeneratingQuestions.value = true
  
  try {
    const typeMap = {
      choice: '选择题',
      blank: '填空题',
      short_answer: '简答题',
      essay: '论述题',
      calculation: '计算题'
    }
    
    const difficultyMap = {
      easy: '简单',
      medium: '中等',
      hard: '困难'
    }

    const prompt = `请根据以下知识点生成${questionForm.count}道${typeMap[questionForm.type]}，难度等级为${difficultyMap[questionForm.difficulty]}。

知识点：
${questionForm.knowledge}

要求：
1. 题目要有层次性和逻辑性
2. 如果是选择题，请提供4个选项和正确答案
3. 如果是填空题，请标明答案
4. 提供详细的解析
5. 题目要符合教学实际`

    const result = await window.electronAPI.ai.chat('question_generation_session', prompt, 'question_generation')
    if (result.success) {
      generatedContent.value = result.response
      ElMessage.success('题目生成成功')
    } else {
      ElMessage.error('生成失败: ' + result.error)
    }
  } catch (error) {
    console.error('生成题目失败:', error)
    ElMessage.error('生成失败，请检查网络连接')
  } finally {
    isGeneratingQuestions.value = false
  }
}

const clearForm = () => {
  Object.assign(lessonForm, {
    subject: '',
    grade: '',
    topic: '',
    objectives: '',
    duration: 1
  })
}

const copyResult = async () => {
  try {
    await navigator.clipboard.writeText(generatedContent.value)
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const saveResult = () => {
  ElMessage.info('保存功能开发中...')
}

const exportResult = () => {
  ElMessage.info('导出功能开发中...')
}

const formatContent = (content: string) => {
  return content.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
}
</script>

<style scoped>
.lesson-prep-assistant {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.prep-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e9ecef;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h2 {
  margin: 0;
  color: #303133;
  font-size: 20px;
}

.prep-container {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.prep-tools {
  margin-bottom: 32px;
}

.tool-card {
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  height: 160px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border: 2px solid transparent;
}

.tool-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.tool-card.active {
  border-color: #409EFF;
  background-color: #f0f9ff;
}

.tool-icon {
  margin-bottom: 12px;
}

.tool-card h3 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 16px;
}

.tool-card p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.prep-workspace {
  background: white;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.workspace-header {
  margin-bottom: 24px;
  text-align: center;
}

.workspace-header h3 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 20px;
}

.workspace-header p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.prep-form {
  max-width: 800px;
  margin: 0 auto;
}

.result-area {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e9ecef;
}

.result-header h3 {
  margin: 0;
  color: #303133;
}

.result-actions {
  display: flex;
  gap: 8px;
}

.result-content {
  line-height: 1.8;
  color: #303133;
  max-height: 600px;
  overflow-y: auto;
}

.workspace-content {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .prep-container {
    padding: 16px;
  }
  
  .prep-tools .el-col {
    margin-bottom: 16px;
  }
  
  .tool-card {
    height: auto;
    padding: 20px;
  }
}
</style>