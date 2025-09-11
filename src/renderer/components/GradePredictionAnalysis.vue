<template>
  <div class="grade-prediction-analysis">
    <!-- 预测设置面板 -->
    <el-card class="prediction-settings">
      <template #header>
        <span>成绩预测设置</span>
      </template>
      <el-row :gutter="20">
        <el-col :span="4">
          <el-select v-model="predictionConfig.classId" placeholder="选择班级" @change="loadStudentData">
            <el-option label="全部班级" :value="undefined" />
            <el-option
              v-for="classItem in classes"
              :key="classItem.id"
              :label="`${classItem.grade}${classItem.class_number}班`"
              :value="classItem.id"
            />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="predictionConfig.subject" placeholder="选择学科" @change="loadStudentData">
            <el-option
              v-for="subject in subjects"
              :key="subject"
              :label="subject"
              :value="subject"
            />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="predictionConfig.predictionType" placeholder="预测类型">
            <el-option label="期末成绩预测" value="final" />
            <el-option label="下次考试预测" value="next" />
            <el-option label="学期趋势预测" value="trend" />
            <el-option label="升学预测" value="admission" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="predictionConfig.algorithm" placeholder="预测算法">
            <el-option label="线性回归" value="linear" />
            <el-option label="多项式回归" value="polynomial" />
            <el-option label="移动平均" value="moving_average" />
            <el-option label="指数平滑" value="exponential" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-button type="primary" @click="runPrediction" :loading="predicting">
            <el-icon><TrendCharts /></el-icon>
            开始预测
          </el-button>
        </el-col>
        <el-col :span="4">
          <el-button @click="exportPrediction">
            <el-icon><Document /></el-icon>
            导出预测
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 预测结果展示 -->
    <div v-if="predictionResults" class="prediction-results">
      <!-- 预测概览 -->
      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="24">
          <el-card>
            <template #header>
              <span>预测概览</span>
            </template>
            <div class="prediction-overview">
              <div class="overview-stat">
                <div class="stat-number">{{ predictionResults.overview.totalStudents }}</div>
                <div class="stat-label">预测学生数</div>
              </div>
              <div class="overview-stat">
                <div class="stat-number">{{ predictionResults.overview.averagePredicted }}</div>
                <div class="stat-label">预测平均分</div>
              </div>
              <div class="overview-stat">
                <div class="stat-number">{{ predictionResults.overview.accuracy }}%</div>
                <div class="stat-label">预测准确率</div>
              </div>
              <div class="overview-stat">
                <div class="stat-number">{{ predictionResults.overview.confidence }}%</div>
                <div class="stat-label">置信度</div>
              </div>
              <div class="overview-stat">
                <div class="stat-number">{{ predictionResults.overview.riskStudents }}</div>
                <div class="stat-label">风险学生</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 预测图表 -->
      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>成绩趋势预测</span>
            </template>
            <div class="chart-container">
              <Line
                v-if="trendPredictionData"
                :data="trendPredictionData"
                :options="trendChartOptions"
              />
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>预测分布对比</span>
            </template>
            <div class="chart-container">
              <Bar
                v-if="distributionPredictionData"
                :data="distributionPredictionData"
                :options="distributionChartOptions"
              />
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 学生个人预测 -->
      <el-row style="margin-top: 20px;">
        <el-col :span="24">
          <el-card>
            <template #header>
              <div class="table-header">
                <span>学生个人预测详情</span>
                <div class="header-controls">
                  <el-input
                    v-model="studentSearchText"
                    placeholder="搜索学生"
                    style="width: 200px; margin-right: 10px;"
                    clearable
                  >
                    <template #prefix>
                      <el-icon><Search /></el-icon>
                    </template>
                  </el-input>
                  <el-select v-model="riskFilter" placeholder="风险筛选" style="width: 120px;">
                    <el-option label="全部" value="all" />
                    <el-option label="高风险" value="high" />
                    <el-option label="中风险" value="medium" />
                    <el-option label="低风险" value="low" />
                  </el-select>
                </div>
              </div>
            </template>
            <el-table :data="filteredPredictions" style="width: 100%" max-height="400">
              <el-table-column prop="studentName" label="学生姓名" width="120" fixed="left" />
              <el-table-column prop="currentScore" label="当前成绩" width="100">
                <template #default="{ row }">
                  <span :class="getScoreClass(row.currentScore)">{{ row.currentScore }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="predictedScore" label="预测成绩" width="100">
                <template #default="{ row }">
                  <span :class="getScoreClass(row.predictedScore)">{{ row.predictedScore }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="change" label="预测变化" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.change > 0 ? 'success' : row.change < 0 ? 'danger' : 'info'">
                    {{ row.change > 0 ? '+' : '' }}{{ row.change }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="confidence" label="置信度" width="100">
                <template #default="{ row }">
                  <el-progress
                    :percentage="row.confidence"
                    :color="getConfidenceColor(row.confidence)"
                    :stroke-width="6"
                  />
                </template>
              </el-table-column>
              <el-table-column prop="riskLevel" label="风险等级" width="100">
                <template #default="{ row }">
                  <el-tag :type="getRiskTagType(row.riskLevel)">{{ row.riskLevel }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="factors" label="影响因素" min-width="200">
                <template #default="{ row }">
                  <el-tag
                    v-for="factor in row.factors.slice(0, 3)"
                    :key="factor"
                    size="small"
                    style="margin: 2px;"
                  >
                    {{ factor }}
                  </el-tag>
                  <span v-if="row.factors.length > 3" class="more-factors">
                    +{{ row.factors.length - 3 }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="suggestions" label="建议措施" min-width="250" />
              <el-table-column label="操作" width="120" fixed="right">
                <template #default="{ row }">
                  <el-button type="primary" link @click="viewStudentDetail(row)">
                    详情
                  </el-button>
                  <el-button type="success" link @click="createPlan(row)">
                    制定计划
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>

      <!-- 预测准确性分析 -->
      <el-row style="margin-top: 20px;">
        <el-col :span="24">
          <el-card>
            <template #header>
              <span>预测模型分析</span>
            </template>
            <div class="model-analysis">
              <el-row :gutter="20">
                <el-col :span="8">
                  <div class="analysis-section">
                    <h4>模型性能</h4>
                    <div class="performance-metrics">
                      <div class="metric">
                        <span class="label">R²决定系数:</span>
                        <span class="value">{{ predictionResults.modelAnalysis.r2Score }}</span>
                      </div>
                      <div class="metric">
                        <span class="label">平均绝对误差:</span>
                        <span class="value">{{ predictionResults.modelAnalysis.mae }}</span>
                      </div>
                      <div class="metric">
                        <span class="label">均方根误差:</span>
                        <span class="value">{{ predictionResults.modelAnalysis.rmse }}</span>
                      </div>
                    </div>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="analysis-section">
                    <h4>特征重要性</h4>
                    <div class="feature-importance">
                      <div
                        v-for="feature in predictionResults.modelAnalysis.featureImportance"
                        :key="feature.name"
                        class="feature-item"
                      >
                        <span class="feature-name">{{ feature.name }}</span>
                        <el-progress
                          :percentage="feature.importance"
                          :stroke-width="8"
                          :show-text="false"
                        />
                        <span class="importance-value">{{ feature.importance }}%</span>
                      </div>
                    </div>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="analysis-section">
                    <h4>预测建议</h4>
                    <ul class="prediction-suggestions">
                      <li v-for="suggestion in predictionResults.modelAnalysis.suggestions" :key="suggestion">
                        {{ suggestion }}
                      </li>
                    </ul>
                  </div>
                </el-col>
              </el-row>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 无数据提示 -->
    <div v-else class="no-prediction">
      <el-empty description="请选择预测条件并点击开始预测" />
    </div>

    <!-- 学生详情对话框 -->
    <el-dialog v-model="studentDetailVisible" title="学生预测详情" width="800px">
      <div v-if="selectedStudent" class="student-detail">
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-section">
              <h4>基本信息</h4>
              <div class="info-item">
                <span class="label">姓名:</span>
                <span class="value">{{ selectedStudent.studentName }}</span>
              </div>
              <div class="info-item">
                <span class="label">当前成绩:</span>
                <span class="value" :class="getScoreClass(selectedStudent.currentScore)">
                  {{ selectedStudent.currentScore }}
                </span>
              </div>
              <div class="info-item">
                <span class="label">预测成绩:</span>
                <span class="value" :class="getScoreClass(selectedStudent.predictedScore)">
                  {{ selectedStudent.predictedScore }}
                </span>
              </div>
              <div class="info-item">
                <span class="label">风险等级:</span>
                <el-tag :type="getRiskTagType(selectedStudent.riskLevel)">
                  {{ selectedStudent.riskLevel }}
                </el-tag>
              </div>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-section">
              <h4>历史趋势</h4>
              <div class="chart-container" style="height: 200px;">
                <Line
                  v-if="studentTrendData"
                  :data="studentTrendData"
                  :options="studentTrendOptions"
                />
              </div>
            </div>
          </el-col>
        </el-row>
        <el-row style="margin-top: 20px;">
          <el-col :span="24">
            <div class="detail-section">
              <h4>详细建议</h4>
              <p>{{ selectedStudent.suggestions }}</p>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Line, Bar } from 'vue-chartjs'
import { TrendCharts, Document, Search } from '@element-plus/icons-vue'
import type { Class } from '../types/class'
import type { Student } from '../types/student'
import * as XLSX from 'xlsx'

interface Props {
  classes: Class[]
  students: Student[]
  subjects: string[]
}

const props = defineProps<Props>()

// 预测配置
const predictionConfig = reactive({
  classId: undefined as number | undefined,
  subject: '' as string,
  predictionType: 'final' as string,
  algorithm: 'linear' as string
})

const predicting = ref(false)
const predictionResults = ref<any>(null)
const studentSearchText = ref('')
const riskFilter = ref('all')
const studentDetailVisible = ref(false)
const selectedStudent = ref<any>(null)

// 加载学生数据
const loadStudentData = () => {
  // 这里可以根据班级和学科加载相应的学生历史成绩数据
  console.log('Loading student data for prediction...')
}

// 运行预测
const runPrediction = async () => {
  if (!predictionConfig.subject) {
    ElMessage.warning('请选择学科')
    return
  }

  predicting.value = true
  try {
    // 模拟预测过程
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 生成模拟预测结果
    predictionResults.value = generateMockPredictionResults()
    
    ElMessage.success('预测完成')
  } catch (error) {
    console.error('预测失败:', error)
    ElMessage.error('预测失败，请重试')
  } finally {
    predicting.value = false
  }
}

// 生成模拟预测结果
const generateMockPredictionResults = () => {
  const students = [
    { name: '张三', current: 85, predicted: 88, risk: '低风险' },
    { name: '李四', current: 72, predicted: 68, risk: '中风险' },
    { name: '王五', current: 65, predicted: 62, risk: '高风险' },
    { name: '赵六', current: 90, predicted: 92, risk: '低风险' },
    { name: '钱七', current: 58, predicted: 55, risk: '高风险' }
  ]

  return {
    overview: {
      totalStudents: 45,
      averagePredicted: 75.8,
      accuracy: 87,
      confidence: 82,
      riskStudents: 8
    },
    predictions: students.map(student => ({
      studentName: student.name,
      currentScore: student.current,
      predictedScore: student.predicted,
      change: student.predicted - student.current,
      confidence: Math.floor(Math.random() * 20) + 70,
      riskLevel: student.risk,
      factors: ['历史成绩', '学习态度', '作业完成度', '课堂表现'],
      suggestions: `建议加强${student.risk === '高风险' ? '基础知识复习和个别辅导' : '巩固提升训练'}`
    })),
    modelAnalysis: {
      r2Score: 0.85,
      mae: 4.2,
      rmse: 5.8,
      featureImportance: [
        { name: '历史平均分', importance: 35 },
        { name: '最近趋势', importance: 28 },
        { name: '作业完成率', importance: 20 },
        { name: '课堂参与度', importance: 17 }
      ],
      suggestions: [
        '模型整体表现良好，R²达到0.85',
        '历史平均分是最重要的预测因子',
        '建议收集更多学习行为数据提升准确性',
        '对高风险学生需要人工干预'
      ]
    }
  }
}

// 筛选后的预测结果
const filteredPredictions = computed(() => {
  if (!predictionResults.value) return []
  
  let filtered = predictionResults.value.predictions
  
  // 按学生姓名搜索
  if (studentSearchText.value) {
    filtered = filtered.filter((item: any) => 
      item.studentName.includes(studentSearchText.value)
    )
  }
  
  // 按风险等级筛选
  if (riskFilter.value !== 'all') {
    const riskMap = {
      high: '高风险',
      medium: '中风险',
      low: '低风险'
    }
    filtered = filtered.filter((item: any) => 
      item.riskLevel === riskMap[riskFilter.value as keyof typeof riskMap]
    )
  }
  
  return filtered
})

// 图表数据
const trendPredictionData = computed(() => {
  if (!predictionResults.value) return null
  
  return {
    labels: ['第1次', '第2次', '第3次', '第4次', '第5次', '预测'],
    datasets: [
      {
        label: '历史成绩',
        data: [75, 78, 76, 80, 82, null],
        borderColor: '#409EFF',
        backgroundColor: 'rgba(64, 158, 255, 0.1)',
        tension: 0.4
      },
      {
        label: '预测成绩',
        data: [null, null, null, null, 82, 85],
        borderColor: '#67C23A',
        backgroundColor: 'rgba(103, 194, 58, 0.1)',
        borderDash: [5, 5],
        tension: 0.4
      }
    ]
  }
})

const distributionPredictionData = computed(() => {
  if (!predictionResults.value) return null
  
  return {
    labels: ['0-59', '60-69', '70-79', '80-89', '90-100'],
    datasets: [
      {
        label: '当前分布',
        data: [3, 8, 15, 12, 7],
        backgroundColor: '#409EFF'
      },
      {
        label: '预测分布',
        data: [2, 6, 14, 15, 8],
        backgroundColor: '#67C23A'
      }
    ]
  }
})

const studentTrendData = computed(() => {
  if (!selectedStudent.value) return null
  
  return {
    labels: ['第1次', '第2次', '第3次', '第4次', '第5次'],
    datasets: [{
      label: '成绩趋势',
      data: [70, 72, 68, 75, selectedStudent.value.currentScore],
      borderColor: '#409EFF',
      backgroundColor: 'rgba(64, 158, 255, 0.1)',
      tension: 0.4
    }]
  }
})

// 图表配置
const trendChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      max: 100
    }
  }
}

const distributionChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const
    }
  },
  scales: {
    y: {
      beginAtZero: true
    }
  }
}

const studentTrendOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      max: 100
    }
  }
}

// 工具函数
const getScoreClass = (score: number) => {
  if (score >= 85) return 'excellent'
  if (score >= 75) return 'good'
  if (score >= 60) return 'pass'
  return 'fail'
}

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 80) return '#67C23A'
  if (confidence >= 60) return '#E6A23C'
  return '#F56C6C'
}

const getRiskTagType = (risk: string) => {
  const typeMap = {
    '高风险': 'danger',
    '中风险': 'warning',
    '低风险': 'success'
  }
  return typeMap[risk as keyof typeof typeMap] || 'info'
}

// 查看学生详情
const viewStudentDetail = (student: any) => {
  selectedStudent.value = student
  studentDetailVisible.value = true
}

// 制定学习计划
const createPlan = (student: any) => {
  ElMessage.success(`正在为${student.studentName}制定个性化学习计划...`)
  // 这里可以跳转到学习计划制定页面
}

// 导出预测结果
const exportPrediction = () => {
  if (!predictionResults.value) {
    ElMessage.warning('请先进行预测分析')
    return
  }
  
  try {
    const reportData = {
      '预测概览': [predictionResults.value.overview],
      '学生预测': predictionResults.value.predictions,
      '模型分析': [
        {
          指标: 'R²决定系数',
          值: predictionResults.value.modelAnalysis.r2Score
        },
        {
          指标: '平均绝对误差',
          值: predictionResults.value.modelAnalysis.mae
        },
        {
          指标: '均方根误差',
          值: predictionResults.value.modelAnalysis.rmse
        }
      ]
    }
    
    const wb = XLSX.utils.book_new()
    
    Object.entries(reportData).forEach(([sheetName, data]) => {
      const ws = XLSX.utils.json_to_sheet(data)
      XLSX.utils.book_append_sheet(wb, ws, sheetName)
    })
    
    XLSX.writeFile(wb, `成绩预测分析报告_${new Date().toISOString().split('T')[0]}.xlsx`)
    ElMessage.success('预测报告导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

onMounted(() => {
  if (props.subjects.length > 0) {
    predictionConfig.subject = props.subjects[0]
  }
})
</script>

<style scoped>
.grade-prediction-analysis {
  padding: 20px;
}

.prediction-settings {
  margin-bottom: 20px;
}

.chart-container {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.prediction-overview {
  display: flex;
  justify-content: space-around;
  padding: 20px 0;
}

.overview-stat {
  text-align: center;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-controls {
  display: flex;
  align-items: center;
}

.more-factors {
  color: #999;
  font-size: 12px;
  margin-left: 5px;
}

.model-analysis {
  padding: 20px;
}

.analysis-section h4 {
  color: #409EFF;
  margin-bottom: 15px;
  border-left: 4px solid #409EFF;
  padding-left: 10px;
}

.performance-metrics .metric {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.metric .label {
  color: #666;
  font-size: 14px;
}

.metric .value {
  font-weight: bold;
  color: #303133;
}

.feature-importance .feature-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.feature-name {
  width: 80px;
  font-size: 13px;
  color: #666;
}

.importance-value {
  width: 40px;
  text-align: right;
  font-size: 12px;
  color: #409EFF;
  margin-left: 10px;
}

.prediction-suggestions {
  list-style: none;
  padding: 0;
}

.prediction-suggestions li {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  position: relative;
  padding-left: 20px;
  font-size: 14px;
  color: #666;
}

.prediction-suggestions li:before {
  content: '•';
  color: #409EFF;
  position: absolute;
  left: 0;
}

.student-detail .detail-section {
  margin-bottom: 20px;
}

.student-detail h4 {
  color: #409EFF;
  margin-bottom: 15px;
  border-left: 4px solid #409EFF;
  padding-left: 10px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item .label {
  color: #666;
  font-size: 14px;
}

.info-item .value {
  font-weight: bold;
}

.info-item .value.excellent {
  color: #67C23A;
}

.info-item .value.good {
  color: #409EFF;
}

.info-item .value.pass {
  color: #E6A23C;
}

.info-item .value.fail {
  color: #F56C6C;
}

.no-prediction {
  padding: 60px 0;
  text-align: center;
}
</style>