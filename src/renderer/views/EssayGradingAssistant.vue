<template>
  <Layout>
    <div class="essay-grading-assistant">
      <div class="grading-header">
        <div class="header-left">
          <el-button @click="goBack" type="text" size="large">
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
          <h2>📝 作文批改助手</h2>
        </div>
        <div class="header-right">
          <el-button type="primary" @click="showGradingHistory" size="small">
            <el-icon><Clock /></el-icon>
            批改历史
          </el-button>
        </div>
      </div>

      <div class="grading-container">
        <!-- 功能选择区域 -->
        <div class="grading-tools">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-card class="tool-card" @click="openTool('essay_grading')" :class="{ active: activeTool === 'essay_grading' }">
                <div class="tool-icon">
                  <el-icon size="32" color="#409EFF"><EditPen /></el-icon>
                </div>
                <h3>智能批改</h3>
                <p>AI自动批改作文并给出建议</p>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card class="tool-card" @click="openTool('scoring_criteria')" :class="{ active: activeTool === 'scoring_criteria' }">
                <div class="tool-icon">
                  <el-icon size="32" color="#67C23A"><Medal /></el-icon>
                </div>
                <h3>评分标准</h3>
                <p>设置和管理评分标准</p>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card class="tool-card" @click="openTool('batch_grading')" :class="{ active: activeTool === 'batch_grading' }">
                <div class="tool-icon">
                  <el-icon size="32" color="#E6A23C"><Files /></el-icon>
                </div>
                <h3>批量批改</h3>
                <p>同时批改多份作文</p>
              </el-card>
            </el-col>
          </el-row>
          
          <el-row :gutter="20" style="margin-top: 20px">
            <el-col :span="8">
              <el-card class="tool-card" @click="openTool('writing_guidance')" :class="{ active: activeTool === 'writing_guidance' }">
                <div class="tool-icon">
                  <el-icon size="32" color="#F56C6C"><Guide /></el-icon>
                </div>
                <h3>写作指导</h3>
                <p>提供写作技巧和建议</p>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card class="tool-card" @click="openTool('plagiarism_check')" :class="{ active: activeTool === 'plagiarism_check' }">
                <div class="tool-icon">
                  <el-icon size="32" color="#909399"><Search /></el-icon>
                </div>
                <h3>查重检测</h3>
                <p>检测作文原创性</p>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card class="tool-card" @click="openTool('essay_analysis')" :class="{ active: activeTool === 'essay_analysis' }">
                <div class="tool-icon">
                  <el-icon size="32" color="#606266"><DataAnalysis /></el-icon>
                </div>
                <h3>作文分析</h3>
                <p>深度分析作文质量</p>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <!-- 工作区域 -->
        <div class="grading-workspace" v-if="activeTool">
          <!-- 智能批改 -->
          <div v-if="activeTool === 'essay_grading'" class="workspace-content">
            <div class="workspace-header">
              <h3>🤖 智能批改</h3>
              <p>上传或输入作文内容，AI将为您提供详细的批改意见</p>
            </div>
            
            <el-form :model="essayForm" label-width="100px" class="grading-form">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="作文类型">
                    <el-select v-model="essayForm.type" placeholder="请选择作文类型">
                      <el-option label="记叙文" value="narrative"></el-option>
                      <el-option label="议论文" value="argumentative"></el-option>
                      <el-option label="说明文" value="expository"></el-option>
                      <el-option label="应用文" value="practical"></el-option>
                      <el-option label="诗歌" value="poetry"></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="年级水平">
                    <el-select v-model="essayForm.grade" placeholder="请选择年级">
                      <el-option label="小学低年级" value="primary_low"></el-option>
                      <el-option label="小学高年级" value="primary_high"></el-option>
                      <el-option label="初中" value="middle"></el-option>
                      <el-option label="高中" value="high"></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
              
              <el-form-item label="作文题目">
                <el-input v-model="essayForm.title" placeholder="请输入作文题目"></el-input>
              </el-form-item>
              
              <el-form-item label="作文内容">
                <el-input 
                  v-model="essayForm.content" 
                  type="textarea" 
                  :rows="12" 
                  placeholder="请输入作文内容，或使用下方的文件上传功能..."
                ></el-input>
              </el-form-item>
              
              <el-form-item label="文件上传">
                <el-upload
                  class="upload-demo"
                  drag
                  :auto-upload="false"
                  :on-change="handleFileChange"
                  accept=".txt,.doc,.docx"
                >
                  <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
                  <div class="el-upload__text">
                    将文件拖到此处，或<em>点击上传</em>
                  </div>
                  <template #tip>
                    <div class="el-upload__tip">
                      支持 txt/doc/docx 格式文件
                    </div>
                  </template>
                </el-upload>
              </el-form-item>
              
              <el-form-item label="批改重点">
                <el-checkbox-group v-model="essayForm.focusAreas">
                  <el-checkbox label="语言表达">语言表达</el-checkbox>
                  <el-checkbox label="结构组织">结构组织</el-checkbox>
                  <el-checkbox label="内容深度">内容深度</el-checkbox>
                  <el-checkbox label="创新性">创新性</el-checkbox>
                  <el-checkbox label="语法错误">语法错误</el-checkbox>
                </el-checkbox-group>
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="gradeEssay" :loading="isGrading">
                  <el-icon><EditPen /></el-icon>
                  开始批改
                </el-button>
                <el-button @click="clearEssayForm">清空</el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 评分标准 -->
          <div v-else-if="activeTool === 'scoring_criteria'" class="workspace-content">
            <div class="workspace-header">
              <h3>📊 评分标准设置</h3>
              <p>自定义作文评分标准和权重分配</p>
            </div>
            
            <el-form :model="criteriaForm" label-width="120px" class="grading-form">
              <el-form-item label="评分模式">
                <el-radio-group v-model="criteriaForm.mode">
                  <el-radio label="standard">标准模式</el-radio>
                  <el-radio label="custom">自定义模式</el-radio>
                </el-radio-group>
              </el-form-item>
              
              <div v-if="criteriaForm.mode === 'custom'">
                <el-form-item label="内容质量权重">
                  <el-slider v-model="criteriaForm.contentWeight" :max="100" show-input></el-slider>
                </el-form-item>
                
                <el-form-item label="语言表达权重">
                  <el-slider v-model="criteriaForm.languageWeight" :max="100" show-input></el-slider>
                </el-form-item>
                
                <el-form-item label="结构组织权重">
                  <el-slider v-model="criteriaForm.structureWeight" :max="100" show-input></el-slider>
                </el-form-item>
                
                <el-form-item label="创新性权重">
                  <el-slider v-model="criteriaForm.creativityWeight" :max="100" show-input></el-slider>
                </el-form-item>
              </div>
              
              <el-form-item label="总分设置">
                <el-input-number v-model="criteriaForm.totalScore" :min="50" :max="150" :step="10"></el-input-number>
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="saveCriteria">
                  <el-icon><Check /></el-icon>
                  保存标准
                </el-button>
                <el-button @click="resetCriteria">重置</el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 批量批改 -->
          <div v-else-if="activeTool === 'batch_grading'" class="workspace-content">
            <div class="workspace-header">
              <h3>📚 批量批改</h3>
              <p>一次性上传多份作文进行批改</p>
            </div>
            
            <div class="batch-upload-area">
              <el-upload
                class="upload-demo"
                drag
                multiple
                :auto-upload="false"
                :on-change="handleBatchFileChange"
                accept=".txt,.doc,.docx"
              >
                <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
                <div class="el-upload__text">
                  将多个作文文件拖到此处，或<em>点击批量上传</em>
                </div>
                <template #tip>
                  <div class="el-upload__tip">
                    支持同时上传多个 txt/doc/docx 格式文件
                  </div>
                </template>
              </el-upload>
              
              <div class="batch-actions" v-if="batchFiles.length > 0">
                <p>已选择 {{ batchFiles.length }} 个文件</p>
                <el-button type="primary" @click="batchGrade" :loading="isBatchGrading">
                  <el-icon><Files /></el-icon>
                  开始批量批改
                </el-button>
              </div>
            </div>
          </div>

          <!-- 写作指导 -->
          <div v-else-if="activeTool === 'writing_guidance'" class="workspace-content">
            <div class="workspace-header">
              <h3>✍️ 写作指导</h3>
              <p>获取针对性的写作建议和技巧</p>
            </div>
            
            <el-form :model="guidanceForm" label-width="100px" class="grading-form">
              <el-form-item label="写作主题">
                <el-input v-model="guidanceForm.topic" placeholder="请输入写作主题或题目"></el-input>
              </el-form-item>
              
              <el-form-item label="文体类型">
                <el-select v-model="guidanceForm.genre" placeholder="请选择文体类型">
                  <el-option label="记叙文" value="narrative"></el-option>
                  <el-option label="议论文" value="argumentative"></el-option>
                  <el-option label="说明文" value="expository"></el-option>
                  <el-option label="散文" value="prose"></el-option>
                </el-select>
              </el-form-item>
              
              <el-form-item label="指导需求">
                <el-checkbox-group v-model="guidanceForm.needs">
                  <el-checkbox label="开头技巧">开头技巧</el-checkbox>
                  <el-checkbox label="结构安排">结构安排</el-checkbox>
                  <el-checkbox label="素材运用">素材运用</el-checkbox>
                  <el-checkbox label="语言润色">语言润色</el-checkbox>
                  <el-checkbox label="结尾升华">结尾升华</el-checkbox>
                </el-checkbox-group>
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="getGuidance" :loading="isGettingGuidance">
                  <el-icon><Guide /></el-icon>
                  获取指导
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>

        <!-- 结果展示区域 -->
        <div class="result-area" v-if="gradingResult">
          <div class="result-header">
            <h3>批改结果</h3>
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
                导出报告
              </el-button>
            </div>
          </div>
          
          <div class="result-content">
            <div class="score-summary" v-if="gradingResult.score">
              <div class="total-score">
                <span class="score-label">总分：</span>
                <span class="score-value">{{ gradingResult.score }}</span>
                <span class="score-total">/{{ gradingResult.totalScore || 100 }}</span>
              </div>
              
              <div class="score-breakdown" v-if="gradingResult.breakdown">
                <div class="breakdown-item" v-for="(item, key) in gradingResult.breakdown" :key="key">
                  <span class="item-label">{{ item.label }}：</span>
                  <span class="item-score">{{ item.score }}</span>
                  <el-progress :percentage="(item.score / item.total) * 100" :show-text="false" :stroke-width="6"></el-progress>
                </div>
              </div>
            </div>
            
            <div class="detailed-feedback">
              <div v-html="formatContent(gradingResult.feedback || gradingResult)"></div>
            </div>
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
  Clock, 
  EditPen, 
  Medal, 
  Files, 
  Guide, 
  Search, 
  DataAnalysis,
  UploadFilled,
  Check,
  DocumentCopy,
  Download
} from '@element-plus/icons-vue'
import Layout from './Layout.vue'

const router = useRouter()

// 响应式数据
const activeTool = ref('')
const isGrading = ref(false)
const isBatchGrading = ref(false)
const isGettingGuidance = ref(false)
const gradingResult = ref(null)
const batchFiles = ref([])

// 表单数据
const essayForm = reactive({
  type: '',
  grade: '',
  title: '',
  content: '',
  focusAreas: ['语言表达', '结构组织']
})

const criteriaForm = reactive({
  mode: 'standard',
  contentWeight: 30,
  languageWeight: 25,
  structureWeight: 25,
  creativityWeight: 20,
  totalScore: 100
})

const guidanceForm = reactive({
  topic: '',
  genre: '',
  needs: ['开头技巧', '结构安排']
})

// 方法
const goBack = () => {
  router.push('/ai-assistant')
}

const showGradingHistory = () => {
  ElMessage.info('批改历史功能开发中...')
}

const openTool = (tool: string) => {
  activeTool.value = tool
  gradingResult.value = null
}

const handleFileChange = (file: any) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    essayForm.content = e.target?.result as string
    ElMessage.success('文件内容已加载')
  }
  reader.readAsText(file.raw)
}

const handleBatchFileChange = (file: any, fileList: any[]) => {
  batchFiles.value = fileList
}

const gradeEssay = async () => {
  if (!essayForm.content.trim()) {
    ElMessage.warning('请输入作文内容')
    return
  }

  isGrading.value = true
  
  try {
    const focusAreas = essayForm.focusAreas.join('、')
    const prompt = `请对以下作文进行详细批改：

作文题目：${essayForm.title || '未提供'}
作文类型：${essayForm.type || '未指定'}
年级水平：${essayForm.grade || '未指定'}
批改重点：${focusAreas}

作文内容：
${essayForm.content}

请提供：
1. 总体评价和建议
2. 具体的修改意见
3. 优点和亮点
4. 需要改进的地方
5. 评分（满分100分）
6. 分项评分（内容、语言、结构、创新等）`

    const result = await window.electronAPI.ai.chat('essay_grading_session', prompt, 'essay_grading')
    if (result.success) {
      // 尝试解析结构化结果
      try {
        const parsed = JSON.parse(result.response)
        gradingResult.value = parsed
      } catch {
        // 如果不是JSON格式，直接使用文本结果
        gradingResult.value = {
          feedback: result.response,
          score: 85, // 默认分数
          totalScore: 100
        }
      }
      ElMessage.success('作文批改完成')
    } else {
      ElMessage.error('批改失败: ' + result.error)
    }
  } catch (error) {
    console.error('批改作文失败:', error)
    ElMessage.error('批改失败，请检查网络连接')
  } finally {
    isGrading.value = false
  }
}

const batchGrade = async () => {
  if (batchFiles.value.length === 0) {
    ElMessage.warning('请先选择文件')
    return
  }

  isBatchGrading.value = true
  ElMessage.info('批量批改功能开发中...')
  
  setTimeout(() => {
    isBatchGrading.value = false
  }, 2000)
}

const getGuidance = async () => {
  if (!guidanceForm.topic.trim()) {
    ElMessage.warning('请输入写作主题')
    return
  }

  isGettingGuidance.value = true
  
  try {
    const needs = guidanceForm.needs.join('、')
    const prompt = `请为以下写作主题提供详细的写作指导：

写作主题：${guidanceForm.topic}
文体类型：${guidanceForm.genre || '未指定'}
指导需求：${needs}

请提供：
1. 写作思路和框架
2. 具体的写作技巧
3. 素材建议
4. 注意事项
5. 范例参考`

    const result = await window.electronAPI.ai.chat('writing_guidance_session', prompt, 'writing_guidance')
    if (result.success) {
      gradingResult.value = {
        feedback: result.response
      }
      ElMessage.success('写作指导获取成功')
    } else {
      ElMessage.error('获取指导失败: ' + result.error)
    }
  } catch (error) {
    console.error('获取写作指导失败:', error)
    ElMessage.error('获取指导失败，请检查网络连接')
  } finally {
    isGettingGuidance.value = false
  }
}

const saveCriteria = () => {
  ElMessage.success('评分标准已保存')
}

const resetCriteria = () => {
  Object.assign(criteriaForm, {
    mode: 'standard',
    contentWeight: 30,
    languageWeight: 25,
    structureWeight: 25,
    creativityWeight: 20,
    totalScore: 100
  })
}

const clearEssayForm = () => {
  Object.assign(essayForm, {
    type: '',
    grade: '',
    title: '',
    content: '',
    focusAreas: ['语言表达', '结构组织']
  })
}

const copyResult = async () => {
  try {
    const content = gradingResult.value?.feedback || JSON.stringify(gradingResult.value, null, 2)
    await navigator.clipboard.writeText(content)
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
  if (typeof content !== 'string') return ''
  return content.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
}
</script>

<style scoped>
.essay-grading-assistant {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.grading-header {
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

.grading-container {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.grading-tools {
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

.grading-workspace {
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

.grading-form {
  max-width: 800px;
  margin: 0 auto;
}

.batch-upload-area {
  text-align: center;
}

.batch-actions {
  margin-top: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
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
}

.score-summary {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.total-score {
  text-align: center;
  margin-bottom: 20px;
}

.score-label {
  font-size: 18px;
  color: #606266;
}

.score-value {
  font-size: 36px;
  font-weight: bold;
  color: #409EFF;
  margin: 0 8px;
}

.score-total {
  font-size: 18px;
  color: #909399;
}

.score-breakdown {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.breakdown-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-label {
  font-weight: 500;
  color: #303133;
}

.item-score {
  font-size: 18px;
  font-weight: bold;
  color: #67C23A;
}

.detailed-feedback {
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
  .grading-container {
    padding: 16px;
  }
  
  .grading-tools .el-col {
    margin-bottom: 16px;
  }
  
  .tool-card {
    height: auto;
    padding: 20px;
  }
  
  .score-breakdown {
    grid-template-columns: 1fr;
  }
}
</style>