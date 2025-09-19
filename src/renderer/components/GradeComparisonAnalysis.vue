<template>
  <div class="grade-comparison-analysis">
    <!-- 对比设置面板 -->
    <el-card class="comparison-settings">
      <template #header>
        <span>对比分析设置</span>
      </template>
      <el-row :gutter="20">
        <el-col :span="4">
          <el-select v-model="comparisonConfig.type" placeholder="对比类型" @change="resetComparison">
            <el-option label="班级对比" value="class" />
            <el-option label="学科对比" value="subject" />
            <el-option label="时间对比" value="time" />
            <el-option label="学生对比" value="student" />
          </el-select>
        </el-col>
        <el-col :span="6" v-if="comparisonConfig.type === 'class'">
          <el-select
            v-model="comparisonConfig.selectedClasses"
            placeholder="选择班级（最多4个）"
            multiple
            :max="4"
            @change="runComparison"
          >
            <el-option
              v-for="classItem in classes"
              :key="classItem.id"
              :label="`${classItem.grade}${classItem.class_number}班`"
              :value="classItem.id"
            />
          </el-select>
        </el-col>
        <el-col :span="6" v-if="comparisonConfig.type === 'subject'">
          <el-select
            v-model="comparisonConfig.selectedSubjects"
            placeholder="选择学科（最多6个）"
            multiple
            :max="6"
            @change="runComparison"
          >
            <el-option
              v-for="subject in subjects"
              :key="subject"
              :label="subject"
              :value="subject"
            />
          </el-select>
        </el-col>
        <el-col :span="6" v-if="comparisonConfig.type === 'time'">
          <el-select
            v-model="comparisonConfig.selectedPeriods"
            placeholder="选择时间段（最多4个）"
            multiple
            :max="4"
            @change="runComparison"
          >
            <el-option label="2024上学期" value="2024-1" />
            <el-option label="2024下学期" value="2024-2" />
            <el-option label="2023上学期" value="2023-1" />
            <el-option label="2023下学期" value="2023-2" />
          </el-select>
        </el-col>
        <el-col :span="6" v-if="comparisonConfig.type === 'student'">
          <el-select
            v-model="comparisonConfig.selectedStudents"
            placeholder="选择学生（最多8个）"
            multiple
            :max="8"
            filterable
            @change="runComparison"
          >
            <el-option
              v-for="student in students"
              :key="student.id"
              :label="student.name"
              :value="student.id"
            />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="comparisonConfig.subject" placeholder="学科" @change="runComparison">
            <el-option
              v-for="subject in subjects"
              :key="subject"
              :label="subject"
              :value="subject"
            />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-button type="primary" @click="runComparison" :loading="comparing">
            <el-icon><TrendCharts /></el-icon>
            开始对比
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 对比结果展示 -->
    <div v-if="comparisonResults" class="comparison-results">
      <!-- 对比概览 -->
      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="24">
          <el-card>
            <template #header>
              <span>对比概览</span>
            </template>
            <div class="comparison-overview">
              <div class="overview-item" v-for="item in comparisonResults.overview" :key="item.name">
                <div class="item-name">{{ item.name }}</div>
                <div class="item-stats">
                  <div class="stat">
                    <span class="label">平均分:</span>
                    <span class="value" :class="getScoreClass(item.average)">{{ item.average }}</span>
                  </div>
                  <div class="stat">
                    <span class="label">最高分:</span>
                    <span class="value">{{ item.highest }}</span>
                  </div>
                  <div class="stat">
                    <span class="label">最低分:</span>
                    <span class="value">{{ item.lowest }}</span>
                  </div>
                  <div class="stat">
                    <span class="label">标准差:</span>
                    <span class="value">{{ item.stdDev }}</span>
                  </div>
                </div>
                <div class="item-trend" :class="item.trend">
                  <el-icon v-if="item.trend === 'up'"><TrendCharts /></el-icon>
                  <el-icon v-else-if="item.trend === 'down'"><TrendCharts /></el-icon>
                  <span>{{ item.trendText }}</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 对比图表 -->
      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>平均分对比</span>
            </template>
            <div class="chart-container">
              <Bar
                v-if="averageComparisonData"
                :data="averageComparisonData"
                :options="barChartOptions"
              />
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>分数分布对比</span>
            </template>
            <div class="chart-container">
              <Line
                v-if="distributionComparisonData"
                :data="distributionComparisonData"
                :options="lineChartOptions"
              />
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 详细对比表格 -->
      <el-row style="margin-top: 20px;">
        <el-col :span="24">
          <el-card>
            <template #header>
              <div class="table-header">
                <span>详细对比数据</span>
                <el-button @click="exportComparison">
                  <el-icon><Download /></el-icon>
                  导出对比报告
                </el-button>
              </div>
            </template>
            <el-table :data="comparisonResults.detailData" style="width: 100%">
              <el-table-column prop="name" :label="getTableLabel()" width="150" />
              <el-table-column prop="count" label="人数" width="80" />
              <el-table-column prop="average" label="平均分" width="100">
                <template #default="{ row }">
                  <span :class="getScoreClass(row.average)">{{ row.average }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="highest" label="最高分" width="100" />
              <el-table-column prop="lowest" label="最低分" width="100" />
              <el-table-column prop="stdDev" label="标准差" width="100" />
              <el-table-column prop="passRate" label="及格率" width="100">
                <template #default="{ row }">
                  <el-progress
                    :percentage="row.passRate"
                    :color="getProgressColor(row.passRate)"
                    :stroke-width="8"
                  />
                </template>
              </el-table-column>
              <el-table-column prop="excellentRate" label="优秀率" width="100">
                <template #default="{ row }">
                  <el-progress
                    :percentage="row.excellentRate"
                    :color="getProgressColor(row.excellentRate)"
                    :stroke-width="8"
                  />
                </template>
              </el-table-column>
              <el-table-column prop="improvement" label="提升幅度" width="120">
                <template #default="{ row }">
                  <el-tag :type="row.improvement > 0 ? 'success' : row.improvement < 0 ? 'danger' : 'info'">
                    {{ row.improvement > 0 ? '+' : '' }}{{ row.improvement }}%
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="ranking" label="排名" width="80" />
              <el-table-column prop="notes" label="备注" min-width="150" />
            </el-table>
          </el-card>
        </el-col>
      </el-row>

      <!-- 对比分析结论 -->
      <el-row style="margin-top: 20px;">
        <el-col :span="24">
          <el-card>
            <template #header>
              <span>分析结论与建议</span>
            </template>
            <div class="analysis-conclusions">
              <div class="conclusion-section">
                <h4>主要发现</h4>
                <ul>
                  <li v-for="finding in comparisonResults.conclusions.findings" :key="finding">
                    {{ finding }}
                  </li>
                </ul>
              </div>
              <div class="conclusion-section">
                <h4>改进建议</h4>
                <ul>
                  <li v-for="suggestion in comparisonResults.conclusions.suggestions" :key="suggestion">
                    {{ suggestion }}
                  </li>
                </ul>
              </div>
              <div class="conclusion-section">
                <h4>关注重点</h4>
                <ul>
                  <li v-for="focus in comparisonResults.conclusions.focuses" :key="focus">
                    {{ focus }}
                  </li>
                </ul>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 无数据提示 -->
    <div v-else class="no-comparison">
      <el-empty description="请选择对比条件并点击开始对比" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js'
import { Bar, Line } from 'vue-chartjs'
import { TrendCharts, Download } from '@element-plus/icons-vue'
import type { Class } from '../types/class'
import type { Student } from '../types/student'
import * as XLSX from 'xlsx'

// 注册 Chart.js 组件
ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  PointElement,
  LineElement
)

interface Props {
  classes: Class[]
  students: Student[]
  subjects: string[]
}

const props = defineProps<Props>()

// 对比配置
const comparisonConfig = reactive({
  type: 'class' as string,
  selectedClasses: [] as number[],
  selectedSubjects: [] as string[],
  selectedPeriods: [] as string[],
  selectedStudents: [] as number[],
  subject: '' as string
})

const comparing = ref(false)
const comparisonResults = ref<any>(null)

// 重置对比设置
const resetComparison = () => {
  comparisonConfig.selectedClasses = []
  comparisonConfig.selectedSubjects = []
  comparisonConfig.selectedPeriods = []
  comparisonConfig.selectedStudents = []
  comparisonResults.value = null
}

// 运行对比分析
const runComparison = async () => {
  if (!comparisonConfig.subject) {
    ElMessage.warning('请选择学科')
    return
  }

  const hasSelection = 
    comparisonConfig.selectedClasses.length > 0 ||
    comparisonConfig.selectedSubjects.length > 0 ||
    comparisonConfig.selectedPeriods.length > 0 ||
    comparisonConfig.selectedStudents.length > 0

  if (!hasSelection) {
    ElMessage.warning('请选择对比对象')
    return
  }

  comparing.value = true
  try {
    // 模拟对比分析过程
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 生成模拟对比结果
    comparisonResults.value = generateMockComparisonResults()
    
    ElMessage.success('对比分析完成')
  } catch (error) {
    console.error('对比分析失败:', error)
    ElMessage.error('对比分析失败，请重试')
  } finally {
    comparing.value = false
  }
}

// 生成模拟对比结果
const generateMockComparisonResults = () => {
  const mockData = {
    overview: [
      {
        name: '高一1班',
        average: 82.5,
        highest: 98,
        lowest: 45,
        stdDev: 12.3,
        trend: 'up',
        trendText: '较上次提升3.2分'
      },
      {
        name: '高一2班',
        average: 78.9,
        highest: 95,
        lowest: 52,
        stdDev: 11.8,
        trend: 'down',
        trendText: '较上次下降1.5分'
      },
      {
        name: '高一3班',
        average: 85.1,
        highest: 99,
        lowest: 58,
        stdDev: 10.5,
        trend: 'up',
        trendText: '较上次提升5.8分'
      }
    ],
    detailData: [
      {
        name: '高一1班',
        count: 45,
        average: 82.5,
        highest: 98,
        lowest: 45,
        stdDev: 12.3,
        passRate: 88,
        excellentRate: 65,
        improvement: 3.2,
        ranking: 2,
        notes: '整体表现良好，需关注后进生'
      },
      {
        name: '高一2班',
        count: 43,
        average: 78.9,
        highest: 95,
        lowest: 52,
        stdDev: 11.8,
        passRate: 82,
        excellentRate: 58,
        improvement: -1.5,
        ranking: 3,
        notes: '成绩有所下滑，需加强辅导'
      },
      {
        name: '高一3班',
        count: 44,
        average: 85.1,
        highest: 99,
        lowest: 58,
        stdDev: 10.5,
        passRate: 93,
        excellentRate: 72,
        improvement: 5.8,
        ranking: 1,
        notes: '表现优异，保持良好势头'
      }
    ],
    conclusions: {
      findings: [
        '高一3班整体成绩最优，平均分85.1分，排名第一',
        '高一1班进步明显，较上次提升3.2分',
        '高一2班成绩有所下滑，需要重点关注',
        '各班级标准差相近，说明学生水平分布较为均匀'
      ],
      suggestions: [
        '高一3班可作为标杆，分享优秀教学经验',
        '高一2班需要分析成绩下滑原因，制定针对性改进措施',
        '加强班级间的交流合作，促进共同提升',
        '关注各班级的后进生，提供个性化辅导'
      ],
      focuses: [
        '重点关注高一2班的教学质量提升',
        '保持高一3班的优势，防止成绩波动',
        '提高各班级的优秀率，争取更多学生达到优秀水平',
        '缩小班级间差距，实现均衡发展'
      ]
    }
  }
  
  return mockData
}

// 图表数据
const averageComparisonData = computed(() => {
  if (!comparisonResults.value) return null
  
  return {
    labels: comparisonResults.value.overview.map((item: any) => item.name),
    datasets: [{
      label: '平均分',
      data: comparisonResults.value.overview.map((item: any) => item.average),
      backgroundColor: [
        '#409EFF',
        '#67C23A',
        '#E6A23C',
        '#F56C6C'
      ]
    }]
  }
})

const distributionComparisonData = computed(() => {
  if (!comparisonResults.value) return null
  
  const labels = ['0-59', '60-69', '70-79', '80-89', '90-100']
  const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C']
  
  return {
    labels,
    datasets: comparisonResults.value.overview.map((item: any, index: number) => ({
      label: item.name,
      data: [2, 5, 12, 18, 8], // 模拟分布数据
      borderColor: colors[index],
      backgroundColor: colors[index] + '20',
      tension: 0.4
    }))
  }
})

// 图表配置
const barChartOptions = {
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

const lineChartOptions = {
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

// 工具函数
const getScoreClass = (score: number) => {
  if (score >= 85) return 'excellent'
  if (score >= 75) return 'good'
  if (score >= 60) return 'pass'
  return 'fail'
}

const getProgressColor = (rate: number) => {
  if (rate >= 80) return '#67C23A'
  if (rate >= 60) return '#E6A23C'
  return '#F56C6C'
}

const getTableLabel = () => {
  const labels = {
    class: '班级',
    subject: '学科',
    time: '时间段',
    student: '学生'
  }
  return labels[comparisonConfig.type as keyof typeof labels] || '名称'
}

// 导出对比报告
const exportComparison = () => {
  if (!comparisonResults.value) {
    ElMessage.warning('请先进行对比分析')
    return
  }
  
  try {
    const reportData = {
      '对比概览': comparisonResults.value.overview,
      '详细数据': comparisonResults.value.detailData,
      '分析结论': [
        { 类型: '主要发现', 内容: comparisonResults.value.conclusions.findings.join('; ') },
        { 类型: '改进建议', 内容: comparisonResults.value.conclusions.suggestions.join('; ') },
        { 类型: '关注重点', 内容: comparisonResults.value.conclusions.focuses.join('; ') }
      ]
    }
    
    const wb = XLSX.utils.book_new()
    
    Object.entries(reportData).forEach(([sheetName, data]) => {
      const ws = XLSX.utils.json_to_sheet(data)
      XLSX.utils.book_append_sheet(wb, ws, sheetName)
    })
    
    XLSX.writeFile(wb, `成绩对比分析报告_${new Date().toISOString().split('T')[0]}.xlsx`)
    ElMessage.success('对比报告导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

onMounted(() => {
  if (props.subjects.length > 0) {
    comparisonConfig.subject = props.subjects[0]
  }
})
</script>

<style scoped>
.grade-comparison-analysis {
  padding: 20px;
}

.comparison-settings {
  margin-bottom: 20px;
}

.chart-container {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.comparison-overview {
  display: flex;
  gap: 20px;
  padding: 20px 0;
  overflow-x: auto;
}

.overview-item {
  min-width: 200px;
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fafafa;
}

.item-name {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 15px;
  text-align: center;
}

.item-stats {
  margin-bottom: 15px;
}

.stat {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.stat .label {
  color: #666;
  font-size: 13px;
}

.stat .value {
  font-weight: bold;
}

.stat .value.excellent {
  color: #67C23A;
}

.stat .value.good {
  color: #409EFF;
}

.stat .value.pass {
  color: #E6A23C;
}

.stat .value.fail {
  color: #F56C6C;
}

.item-trend {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  padding: 5px 10px;
  border-radius: 12px;
}

.item-trend.up {
  background: #f0f9ff;
  color: #67C23A;
}

.item-trend.down {
  background: #fef0f0;
  color: #F56C6C;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.analysis-conclusions {
  padding: 20px;
}

.conclusion-section {
  margin-bottom: 25px;
}

.conclusion-section h4 {
  color: #409EFF;
  margin-bottom: 15px;
  border-left: 4px solid #409EFF;
  padding-left: 10px;
}

.conclusion-section ul {
  list-style: none;
  padding: 0;
}

.conclusion-section li {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  position: relative;
  padding-left: 20px;
}

.conclusion-section li:before {
  content: '•';
  color: #409EFF;
  position: absolute;
  left: 0;
}

.no-comparison {
  padding: 60px 0;
  text-align: center;
}
</style>