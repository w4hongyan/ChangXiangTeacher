<template>
  <div class="grade-deep-analysis">
    <!-- 分析控制面板 -->
    <el-card class="control-panel">
      <template #header>
        <span>深度分析设置</span>
      </template>
      <el-row :gutter="20">
        <el-col :span="4">
          <el-select v-model="analysisConfig.classId" placeholder="选择班级" @change="runAnalysis">
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
          <el-select v-model="analysisConfig.subject" placeholder="选择学科" @change="runAnalysis">
            <el-option
              v-for="subject in subjects"
              :key="subject"
              :label="subject"
              :value="subject"
            />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="analysisConfig.analysisType" placeholder="分析类型" @change="runAnalysis">
            <el-option label="成绩分布分析" value="distribution" />
            <el-option label="学习能力分析" value="ability" />
            <el-option label="进步潜力分析" value="potential" />
            <el-option label="薄弱环节分析" value="weakness" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-button type="primary" @click="runAnalysis" :loading="analyzing">
            <el-icon><DataAnalysis /></el-icon>
            开始分析
          </el-button>
        </el-col>
        <el-col :span="4">
          <el-button @click="exportAnalysisReport">
            <el-icon><Document /></el-icon>
            导出报告
          </el-button>
        </el-col>
        <el-col :span="4">
          <el-button @click="generateSuggestions">
            <el-icon><Star /></el-icon>
            生成建议
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 分析结果展示 -->
    <div v-if="analysisResults" class="analysis-results">
      <!-- 总体概览 -->
      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="24">
          <el-card>
            <template #header>
              <span>分析概览</span>
            </template>
            <div class="overview-stats">
              <div class="stat-item">
                <div class="stat-number">{{ analysisResults.overview.totalStudents }}</div>
                <div class="stat-label">参与学生</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">{{ analysisResults.overview.averageScore }}</div>
                <div class="stat-label">平均分</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">{{ analysisResults.overview.standardDeviation }}</div>
                <div class="stat-label">标准差</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">{{ analysisResults.overview.coefficient }}</div>
                <div class="stat-label">变异系数</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">{{ analysisResults.overview.normalityTest }}</div>
                <div class="stat-label">正态性</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 分布分析图表 -->
      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>成绩分布直方图</span>
            </template>
            <div class="chart-container">
              <Bar
                v-if="distributionChartData"
                :data="distributionChartData"
                :options="distributionChartOptions"
              />
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>正态分布对比</span>
            </template>
            <div class="chart-container">
              <Line
                v-if="normalDistributionData"
                :data="normalDistributionData"
                :options="normalDistributionOptions"
              />
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 学生能力分析 -->
      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="16">
          <el-card>
            <template #header>
              <span>学生能力分布矩阵</span>
            </template>
            <div class="chart-container">
              <Scatter
                v-if="abilityMatrixData"
                :data="abilityMatrixData"
                :options="abilityMatrixOptions"
              />
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card>
            <template #header>
              <span>能力分层统计</span>
            </template>
            <div class="ability-stats">
              <div class="ability-level" v-for="level in analysisResults.abilityLevels" :key="level.name">
                <div class="level-header">
                  <span class="level-name">{{ level.name }}</span>
                  <span class="level-count">{{ level.count }}人</span>
                </div>
                <div class="level-description">{{ level.description }}</div>
                <div class="level-students">
                  <el-tag
                    v-for="student in level.students.slice(0, 5)"
                    :key="student"
                    size="small"
                    style="margin: 2px;"
                  >
                    {{ student }}
                  </el-tag>
                  <span v-if="level.students.length > 5" class="more-students">
                    等{{ level.students.length }}人
                  </span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 薄弱环节分析 -->
      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>知识点掌握情况</span>
            </template>
            <div class="chart-container">
              <Radar
                v-if="knowledgeRadarData"
                :data="knowledgeRadarData"
                :options="knowledgeRadarOptions"
              />
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>薄弱环节排行</span>
            </template>
            <div class="weakness-list">
              <div
                v-for="(weakness, index) in analysisResults.weaknesses"
                :key="weakness.topic"
                class="weakness-item"
              >
                <div class="weakness-rank">{{ index + 1 }}</div>
                <div class="weakness-content">
                  <div class="weakness-topic">{{ weakness.topic }}</div>
                  <div class="weakness-stats">
                    <span class="error-rate">错误率: {{ weakness.errorRate }}%</span>
                    <span class="difficulty">难度: {{ weakness.difficulty }}</span>
                  </div>
                  <div class="weakness-suggestion">{{ weakness.suggestion }}</div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 个性化建议 -->
      <el-row style="margin-top: 20px;">
        <el-col :span="24">
          <el-card>
            <template #header>
              <span>个性化教学建议</span>
            </template>
            <div class="suggestions-container">
              <el-tabs v-model="activeSuggestionTab">
                <el-tab-pane label="整体建议" name="overall">
                  <div class="suggestion-content">
                    <h4>教学策略调整</h4>
                    <ul>
                      <li v-for="suggestion in analysisResults.suggestions.overall" :key="suggestion">
                        {{ suggestion }}
                      </li>
                    </ul>
                  </div>
                </el-tab-pane>
                <el-tab-pane label="分层教学" name="layered">
                  <div class="suggestion-content">
                    <div v-for="layer in analysisResults.suggestions.layered" :key="layer.level" class="layer-suggestion">
                      <h4>{{ layer.level }}</h4>
                      <ul>
                        <li v-for="suggestion in layer.suggestions" :key="suggestion">
                          {{ suggestion }}
                        </li>
                      </ul>
                    </div>
                  </div>
                </el-tab-pane>
                <el-tab-pane label="个别辅导" name="individual">
                  <div class="suggestion-content">
                    <el-table :data="analysisResults.suggestions.individual" style="width: 100%">
                      <el-table-column prop="studentName" label="学生姓名" width="120" />
                      <el-table-column prop="currentLevel" label="当前水平" width="120" />
                      <el-table-column prop="targetLevel" label="目标水平" width="120" />
                      <el-table-column prop="suggestions" label="具体建议" />
                      <el-table-column prop="timeline" label="预期时间" width="120" />
                    </el-table>
                  </div>
                </el-tab-pane>
              </el-tabs>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 无数据提示 -->
    <div v-else class="no-analysis">
      <el-empty description="请选择分析条件并点击开始分析" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Bar, Line, Scatter, Radar } from 'vue-chartjs'
import { DataAnalysis, Document, Star } from '@element-plus/icons-vue'
import type { Class } from '../types/class'
import type { Student } from '../types/student'
import * as XLSX from 'xlsx'

interface Props {
  classes: Class[]
  students: Student[]
  subjects: string[]
}

const props = defineProps<Props>()

// 分析配置
const analysisConfig = reactive({
  classId: undefined as number | undefined,
  subject: '' as string,
  analysisType: 'distribution' as string
})

const analyzing = ref(false)
const analysisResults = ref<any>(null)
const activeSuggestionTab = ref('overall')

// 运行分析
const runAnalysis = async () => {
  if (!analysisConfig.subject) {
    ElMessage.warning('请选择学科')
    return
  }

  analyzing.value = true
  try {
    // 模拟分析过程
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 生成模拟分析结果
    analysisResults.value = {
      overview: {
        totalStudents: 45,
        averageScore: 78.5,
        standardDeviation: 12.3,
        coefficient: 0.157,
        normalityTest: '接近正态'
      },
      abilityLevels: [
        {
          name: '优秀层',
          count: 12,
          description: '成绩稳定在85分以上，学习能力强',
          students: ['张三', '李四', '王五', '赵六', '钱七', '孙八']
        },
        {
          name: '良好层',
          count: 20,
          description: '成绩在70-85分之间，有提升空间',
          students: ['周九', '吴十', '郑一', '王二', '冯三', '陈四']
        },
        {
          name: '待提高层',
          count: 13,
          description: '成绩在60-70分之间，需要重点关注',
          students: ['褚五', '卫六', '蒋七', '沈八', '韩九', '杨十']
        }
      ],
      weaknesses: [
        {
          topic: '函数与方程',
          errorRate: 65,
          difficulty: '较难',
          suggestion: '加强基础概念理解，多做综合练习'
        },
        {
          topic: '立体几何',
          errorRate: 58,
          difficulty: '中等',
          suggestion: '提高空间想象能力，增加模型训练'
        },
        {
          topic: '概率统计',
          errorRate: 45,
          difficulty: '中等',
          suggestion: '注重实际应用，加强计算训练'
        }
      ],
      suggestions: {
        overall: [
          '整体成绩分布较为合理，但两极分化现象需要关注',
          '建议采用分层教学，针对不同水平学生制定不同策略',
          '加强薄弱知识点的专项训练，提高整体水平',
          '增加课堂互动，提高学生学习积极性'
        ],
        layered: [
          {
            level: '优秀层学生',
            suggestions: [
              '提供更具挑战性的题目，拓展思维深度',
              '鼓励参与数学竞赛，培养创新能力',
              '安排辅导其他同学，提升领导力'
            ]
          },
          {
            level: '良好层学生',
            suggestions: [
              '巩固基础知识，提高解题准确率',
              '增加综合题训练，提升应用能力',
              '定期检测，及时发现问题'
            ]
          },
          {
            level: '待提高层学生',
            suggestions: [
              '重点补习基础知识，夯实根基',
              '采用个别辅导，针对性解决问题',
              '增强学习信心，培养学习兴趣'
            ]
          }
        ],
        individual: [
          {
            studentName: '张三',
            currentLevel: '优秀',
            targetLevel: '拔尖',
            suggestions: '参加数学竞赛培训，挑战更高难度题目',
            timeline: '1个月'
          },
          {
            studentName: '李四',
            currentLevel: '良好',
            targetLevel: '优秀',
            suggestions: '加强函数专题训练，提高综合应用能力',
            timeline: '2个月'
          }
        ]
      }
    }
    
    ElMessage.success('分析完成')
  } catch (error) {
    console.error('分析失败:', error)
    ElMessage.error('分析失败，请重试')
  } finally {
    analyzing.value = false
  }
}

// 图表数据
const distributionChartData = computed(() => {
  if (!analysisResults.value) return null
  
  return {
    labels: ['0-59', '60-69', '70-79', '80-89', '90-100'],
    datasets: [{
      label: '学生人数',
      data: [3, 10, 15, 12, 5],
      backgroundColor: [
        '#F56C6C',
        '#E6A23C',
        '#409EFF',
        '#67C23A',
        '#909399'
      ]
    }]
  }
})

const normalDistributionData = computed(() => {
  if (!analysisResults.value) return null
  
  return {
    labels: Array.from({length: 21}, (_, i) => (i * 5).toString()),
    datasets: [
      {
        label: '实际分布',
        data: [0, 1, 2, 3, 5, 8, 12, 15, 18, 20, 22, 20, 18, 15, 12, 8, 5, 3, 2, 1, 0],
        borderColor: '#409EFF',
        backgroundColor: 'rgba(64, 158, 255, 0.1)',
        tension: 0.4
      },
      {
        label: '理论正态分布',
        data: [0, 1, 2, 4, 7, 11, 16, 20, 23, 25, 25, 23, 20, 16, 11, 7, 4, 2, 1, 0, 0],
        borderColor: '#67C23A',
        backgroundColor: 'rgba(103, 194, 58, 0.1)',
        tension: 0.4,
        borderDash: [5, 5]
      }
    ]
  }
})

const abilityMatrixData = computed(() => {
  if (!analysisResults.value) return null
  
  return {
    datasets: [
      {
        label: '优秀层',
        data: Array.from({length: 12}, () => ({
          x: Math.random() * 20 + 80,
          y: Math.random() * 20 + 80
        })),
        backgroundColor: '#67C23A'
      },
      {
        label: '良好层',
        data: Array.from({length: 20}, () => ({
          x: Math.random() * 20 + 60,
          y: Math.random() * 20 + 60
        })),
        backgroundColor: '#409EFF'
      },
      {
        label: '待提高层',
        data: Array.from({length: 13}, () => ({
          x: Math.random() * 20 + 40,
          y: Math.random() * 20 + 40
        })),
        backgroundColor: '#E6A23C'
      }
    ]
  }
})

const knowledgeRadarData = computed(() => {
  if (!analysisResults.value) return null
  
  return {
    labels: ['函数', '几何', '代数', '概率', '数列', '三角'],
    datasets: [{
      label: '掌握程度',
      data: [65, 78, 82, 70, 75, 68],
      borderColor: '#409EFF',
      backgroundColor: 'rgba(64, 158, 255, 0.2)'
    }]
  }
})

// 图表配置
const distributionChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    y: {
      beginAtZero: true
    }
  }
}

const normalDistributionOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const
    }
  }
}

const abilityMatrixOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const
    }
  },
  scales: {
    x: {
      title: {
        display: true,
        text: '理解能力'
      }
    },
    y: {
      title: {
        display: true,
        text: '应用能力'
      }
    }
  }
}

const knowledgeRadarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    r: {
      beginAtZero: true,
      max: 100
    }
  }
}

// 导出分析报告
const exportAnalysisReport = () => {
  if (!analysisResults.value) {
    ElMessage.warning('请先进行分析')
    return
  }
  
  try {
    const reportData = {
      '分析概览': [analysisResults.value.overview],
      '能力分层': analysisResults.value.abilityLevels,
      '薄弱环节': analysisResults.value.weaknesses,
      '个别建议': analysisResults.value.suggestions.individual
    }
    
    const wb = XLSX.utils.book_new()
    
    Object.entries(reportData).forEach(([sheetName, data]) => {
      const ws = XLSX.utils.json_to_sheet(data)
      XLSX.utils.book_append_sheet(wb, ws, sheetName)
    })
    
    XLSX.writeFile(wb, `成绩深度分析报告_${new Date().toISOString().split('T')[0]}.xlsx`)
    ElMessage.success('报告导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 生成建议
const generateSuggestions = () => {
  if (!analysisResults.value) {
    ElMessage.warning('请先进行分析')
    return
  }
  
  ElMessage.success('建议已生成，请查看个性化教学建议部分')
  activeSuggestionTab.value = 'overall'
}

onMounted(() => {
  if (props.subjects.length > 0) {
    analysisConfig.subject = props.subjects[0]
  }
})
</script>

<style scoped>
.grade-deep-analysis {
  padding: 20px;
}

.control-panel {
  margin-bottom: 20px;
}

.chart-container {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.overview-stats {
  display: flex;
  justify-content: space-around;
  padding: 20px 0;
}

.stat-item {
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

.ability-stats {
  padding: 20px;
}

.ability-level {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
}

.level-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.level-name {
  font-weight: bold;
  color: #409EFF;
}

.level-count {
  background: #f0f9ff;
  color: #409EFF;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.level-description {
  color: #666;
  font-size: 13px;
  margin-bottom: 10px;
}

.level-students {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.more-students {
  color: #999;
  font-size: 12px;
  margin-left: 5px;
}

.weakness-list {
  padding: 20px;
}

.weakness-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 20px;
  padding: 15px;
  background: #fafafa;
  border-radius: 6px;
}

.weakness-rank {
  width: 30px;
  height: 30px;
  background: #409EFF;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 15px;
  flex-shrink: 0;
}

.weakness-content {
  flex: 1;
}

.weakness-topic {
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.weakness-stats {
  display: flex;
  gap: 15px;
  margin-bottom: 8px;
}

.error-rate {
  color: #F56C6C;
  font-size: 12px;
}

.difficulty {
  color: #E6A23C;
  font-size: 12px;
}

.weakness-suggestion {
  color: #666;
  font-size: 13px;
}

.suggestions-container {
  padding: 20px;
}

.suggestion-content h4 {
  color: #409EFF;
  margin-bottom: 15px;
}

.suggestion-content ul {
  list-style: none;
  padding: 0;
}

.suggestion-content li {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  position: relative;
  padding-left: 20px;
}

.suggestion-content li:before {
  content: '•';
  color: #409EFF;
  position: absolute;
  left: 0;
}

.layer-suggestion {
  margin-bottom: 25px;
}

.no-analysis {
  padding: 60px 0;
  text-align: center;
}
</style>