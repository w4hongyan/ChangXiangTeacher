<template>
  <div class="grade-trend-analysis">
    <!-- 筛选控制面板 -->
    <el-card class="filter-panel">
      <template #header>
        <span>趋势分析筛选</span>
      </template>
      <el-row :gutter="20">
        <el-col :span="6">
          <el-select v-model="filters.classId" placeholder="选择班级" @change="updateAnalysis">
            <el-option label="全部班级" :value="undefined" />
            <el-option
              v-for="classItem in classes"
              :key="classItem.id"
              :label="`${classItem.grade}${classItem.class_number}班`"
              :value="classItem.id"
            />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select v-model="filters.subject" placeholder="选择学科" @change="updateAnalysis">
            <el-option label="全部学科" :value="undefined" />
            <el-option
              v-for="subject in subjects"
              :key="subject"
              :label="subject"
              :value="subject"
            />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select v-model="filters.examType" placeholder="考试类型" @change="updateAnalysis">
            <el-option label="全部类型" :value="undefined" />
            <el-option
              v-for="type in examTypes"
              :key="type"
              :label="type"
              :value="type"
            />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            @change="updateAnalysis"
          />
        </el-col>
      </el-row>
    </el-card>

    <!-- 趋势图表区域 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <!-- 成绩趋势折线图 -->
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="chart-header">
              <span>成绩趋势变化</span>
              <el-radio-group v-model="trendType" @change="updateAnalysis">
                <el-radio-button label="average">平均分</el-radio-button>
                <el-radio-button label="pass_rate">及格率</el-radio-button>
                <el-radio-button label="excellent_rate">优秀率</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="chart-container">
            <Line
              v-if="trendChartData"
              :data="trendChartData"
              :options="trendChartOptions"
            />
            <div v-else class="no-data">暂无数据</div>
          </div>
        </el-card>
      </el-col>

      <!-- 统计指标卡片 -->
      <el-col :span="8">
        <div class="stats-cards">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-value">{{ analysisData.averageScore }}</div>
              <div class="stat-label">平均分</div>
              <div class="stat-trend" :class="analysisData.scoreTrend">
                <el-icon><TrendCharts /></el-icon>
                {{ analysisData.scoreTrendText }}
              </div>
            </div>
          </el-card>
          
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-value">{{ analysisData.passRate }}%</div>
              <div class="stat-label">及格率</div>
              <div class="stat-trend" :class="analysisData.passTrend">
                <el-icon><TrendCharts /></el-icon>
                {{ analysisData.passTrendText }}
              </div>
            </div>
          </el-card>
          
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-value">{{ analysisData.excellentRate }}%</div>
              <div class="stat-label">优秀率</div>
              <div class="stat-trend" :class="analysisData.excellentTrend">
                <el-icon><TrendCharts /></el-icon>
                {{ analysisData.excellentTrendText }}
              </div>
            </div>
          </el-card>
          
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-value">{{ analysisData.improvement }}</div>
              <div class="stat-label">进步幅度</div>
              <div class="stat-description">{{ analysisData.improvementText }}</div>
            </div>
          </el-card>
        </div>
      </el-col>
    </el-row>

    <!-- 详细分析表格 -->
    <el-row style="margin-top: 20px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="table-header">
              <span>详细趋势数据</span>
              <el-button type="primary" size="small" @click="exportTrendData">
                <el-icon><Download /></el-icon>
                导出数据
              </el-button>
            </div>
          </template>
          <el-table :data="trendTableData" style="width: 100%">
            <el-table-column prop="exam_date" label="考试时间" width="120" />
            <el-table-column prop="exam_type" label="考试类型" width="120" />
            <el-table-column prop="subject" label="学科" width="100" />
            <el-table-column prop="class_name" label="班级" width="120" />
            <el-table-column prop="student_count" label="参考人数" width="100" />
            <el-table-column prop="average_score" label="平均分" width="100">
              <template #default="{ row }">
                <span :class="getScoreClass(row.average_score)">{{ row.average_score }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="pass_rate" label="及格率" width="100">
              <template #default="{ row }">
                <span :class="getRateClass(row.pass_rate)">{{ row.pass_rate }}%</span>
              </template>
            </el-table-column>
            <el-table-column prop="excellent_rate" label="优秀率" width="100">
              <template #default="{ row }">
                <span :class="getRateClass(row.excellent_rate)">{{ row.excellent_rate }}%</span>
              </template>
            </el-table-column>
            <el-table-column prop="improvement" label="较上次" width="100">
              <template #default="{ row }">
                <span :class="getTrendClass(row.improvement)">{{ row.improvement }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 学生个人趋势分析 -->
    <el-row style="margin-top: 20px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="table-header">
              <span>学生个人趋势</span>
              <el-select v-model="selectedStudent" placeholder="选择学生" @change="updateStudentTrend">
                <el-option
                  v-for="student in filteredStudents"
                  :key="student.id"
                  :label="student.name"
                  :value="student.id"
                />
              </el-select>
            </div>
          </template>
          <div v-if="selectedStudent" class="student-trend">
            <div class="chart-container">
              <Line
                v-if="studentTrendData"
                :data="studentTrendData"
                :options="studentTrendOptions"
              />
              <div v-else class="no-data">该学生暂无成绩数据</div>
            </div>
          </div>
          <div v-else class="no-data">请选择学生查看个人趋势</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Line } from 'vue-chartjs'
import { TrendCharts, Download } from '@element-plus/icons-vue'
import type { Class } from '../types/class'
import type { Student } from '../types/student'
import type { GradeStats } from '../types/grade'
import * as XLSX from 'xlsx'

interface Props {
  classes: Class[]
  students: Student[]
  subjects: string[]
  examTypes: string[]
}

const props = defineProps<Props>()

// 筛选条件
const filters = reactive({
  classId: undefined as number | undefined,
  subject: undefined as string | undefined,
  examType: undefined as string | undefined,
  dateRange: null as [Date, Date] | null
})

// 趋势类型
const trendType = ref('average')
const selectedStudent = ref<number>()

// 模拟趋势数据（实际应从后端获取）
const trendData = ref<any[]>([])
const trendTableData = ref<any[]>([])
const analysisData = ref({
  averageScore: '0',
  passRate: '0',
  excellentRate: '0',
  improvement: '+0',
  scoreTrend: 'up',
  passTrend: 'up',
  excellentTrend: 'up',
  scoreTrendText: '上升',
  passTrendText: '上升',
  excellentTrendText: '上升',
  improvementText: '较上次持平'
})

// 筛选后的学生列表
const filteredStudents = computed(() => {
  if (!filters.classId) return props.students
  return props.students.filter(student => student.class_id === filters.classId)
})

// 趋势图表数据
const trendChartData = computed(() => {
  if (trendData.value.length === 0) return null
  
  const labels = trendData.value.map(item => item.exam_date)
  const dataKey = trendType.value === 'average' ? 'average_score' : 
                  trendType.value === 'pass_rate' ? 'pass_rate' : 'excellent_rate'
  
  return {
    labels,
    datasets: [{
      label: trendType.value === 'average' ? '平均分' : 
             trendType.value === 'pass_rate' ? '及格率(%)' : '优秀率(%)',
      data: trendData.value.map(item => item[dataKey]),
      borderColor: '#409EFF',
      backgroundColor: 'rgba(64, 158, 255, 0.1)',
      tension: 0.4,
      fill: true
    }]
  }
})

// 学生个人趋势数据
const studentTrendData = computed(() => {
  if (!selectedStudent.value) return null
  
  // 模拟学生个人数据
  const mockData = [
    { exam_date: '2024-03', score: 85, subject: '数学' },
    { exam_date: '2024-04', score: 88, subject: '数学' },
    { exam_date: '2024-05', score: 92, subject: '数学' },
    { exam_date: '2024-06', score: 89, subject: '数学' }
  ]
  
  return {
    labels: mockData.map(item => item.exam_date),
    datasets: [{
      label: '个人成绩',
      data: mockData.map(item => item.score),
      borderColor: '#67C23A',
      backgroundColor: 'rgba(103, 194, 58, 0.1)',
      tension: 0.4,
      fill: true
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
      max: trendType.value === 'average' ? 100 : 100
    }
  }
}

const studentTrendOptions = {
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

// 更新分析数据
const updateAnalysis = async () => {
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 生成模拟趋势数据
    const mockTrendData = [
      {
        exam_date: '2024-03-15',
        exam_type: '月考',
        subject: '数学',
        class_name: '高一1班',
        student_count: 45,
        average_score: 78.5,
        pass_rate: 82.2,
        excellent_rate: 35.6,
        improvement: '+2.3'
      },
      {
        exam_date: '2024-04-20',
        exam_type: '期中考试',
        subject: '数学',
        class_name: '高一1班',
        student_count: 45,
        average_score: 81.2,
        pass_rate: 86.7,
        excellent_rate: 42.2,
        improvement: '+2.7'
      },
      {
        exam_date: '2024-05-25',
        exam_type: '月考',
        subject: '数学',
        class_name: '高一1班',
        student_count: 45,
        average_score: 83.8,
        pass_rate: 91.1,
        excellent_rate: 48.9,
        improvement: '+2.6'
      }
    ]
    
    trendData.value = mockTrendData
    trendTableData.value = mockTrendData
    
    // 更新统计数据
    const latest = mockTrendData[mockTrendData.length - 1]
    analysisData.value = {
      averageScore: latest.average_score.toFixed(1),
      passRate: latest.pass_rate.toFixed(1),
      excellentRate: latest.excellent_rate.toFixed(1),
      improvement: latest.improvement,
      scoreTrend: 'up',
      passTrend: 'up',
      excellentTrend: 'up',
      scoreTrendText: '持续上升',
      passTrendText: '稳步提升',
      excellentTrendText: '显著改善',
      improvementText: '较上次考试有明显进步'
    }
  } catch (error) {
    console.error('更新趋势分析失败:', error)
    ElMessage.error('获取趋势数据失败')
  }
}

// 更新学生个人趋势
const updateStudentTrend = () => {
  // 这里应该调用API获取学生个人成绩趋势
  console.log('更新学生趋势:', selectedStudent.value)
}

// 导出趋势数据
const exportTrendData = () => {
  try {
    const ws = XLSX.utils.json_to_sheet(trendTableData.value)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '成绩趋势数据')
    XLSX.writeFile(wb, `成绩趋势分析_${new Date().toISOString().split('T')[0]}.xlsx`)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 样式类名
const getScoreClass = (score: number) => {
  if (score >= 85) return 'score-excellent'
  if (score >= 60) return 'score-good'
  return 'score-poor'
}

const getRateClass = (rate: number) => {
  if (rate >= 80) return 'rate-high'
  if (rate >= 60) return 'rate-medium'
  return 'rate-low'
}

const getTrendClass = (trend: string) => {
  if (trend.startsWith('+')) return 'trend-up'
  if (trend.startsWith('-')) return 'trend-down'
  return 'trend-stable'
}

onMounted(() => {
  updateAnalysis()
})

watch(() => [filters.classId, filters.subject], () => {
  updateAnalysis()
})
</script>

<style scoped>
.grade-trend-analysis {
  padding: 20px;
}

.filter-panel {
  margin-bottom: 20px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.no-data {
  color: #999;
  font-size: 14px;
  text-align: center;
}

.stats-cards {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.stat-card {
  height: 120px;
}

.stat-item {
  text-align: center;
  padding: 10px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.stat-trend {
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.stat-trend.up {
  color: #67C23A;
}

.stat-trend.down {
  color: #F56C6C;
}

.stat-trend.stable {
  color: #E6A23C;
}

.stat-description {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}

.student-trend {
  padding: 20px;
}

/* 表格样式 */
.score-excellent {
  color: #67C23A;
  font-weight: bold;
}

.score-good {
  color: #E6A23C;
}

.score-poor {
  color: #F56C6C;
  font-weight: bold;
}

.rate-high {
  color: #67C23A;
  font-weight: bold;
}

.rate-medium {
  color: #E6A23C;
}

.rate-low {
  color: #F56C6C;
}

.trend-up {
  color: #67C23A;
}

.trend-down {
  color: #F56C6C;
}

.trend-stable {
  color: #909399;
}
</style>