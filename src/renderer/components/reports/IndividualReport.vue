<template>
  <div class="individual-report">
    <div class="report-header">
      <h3>{{ data.student_info.student_name }} 个人成绩报告</h3>
      <div class="report-meta">
        <span>学号: {{ data.student_info.student_number }}</span>
        <span>班级: {{ data.student_info.class_name }}</span>
        <span>{{ data.semester }} {{ data.year }}年</span>
      </div>
    </div>

    <!-- 学生基本信息 -->
    <div class="student-info">
      <h4>学生信息</h4>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">姓名:</span>
          <span class="value">{{ data.student_info.student_name }}</span>
        </div>
        <div class="info-item">
          <span class="label">学号:</span>
          <span class="value">{{ data.student_info.student_number }}</span>
        </div>
        <div class="info-item">
          <span class="label">班级:</span>
          <span class="value">{{ data.student_info.class_name }}</span>
        </div>
        <div class="info-item">
          <span class="label">学期:</span>
          <span class="value">{{ data.semester }} {{ data.year }}年</span>
        </div>
      </div>
    </div>

    <!-- 考试成绩记录 -->
    <div class="exam-records">
      <h4>考试成绩记录</h4>
      <el-table :data="data.exam_records" class="records-table">
        <el-table-column prop="exam_name" label="考试名称" width="150" />
        <el-table-column prop="exam_date" label="考试日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.exam_date) }}
          </template>
        </el-table-column>
        <el-table-column prop="score" label="成绩" width="80">
          <template #default="{ row }">
            <span :class="getScoreClass(row.score)">{{ row.score }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="rank" label="班级排名" width="100">
          <template #default="{ row }">
            <el-tag :type="getRankTagType(row.rank, row.total_students)">
              {{ row.rank }}/{{ row.total_students }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="subject_avg" label="学科平均分" width="120" />
        <el-table-column prop="class_avg" label="班级平均分" width="120" />
        <el-table-column label="与平均分差距" width="120">
          <template #default="{ row }">
            <span :class="getDifferenceClass(row.score - row.class_avg)">
              {{ row.score - row.class_avg > 0 ? '+' : '' }}{{ (row.score - row.class_avg).toFixed(1) }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 趋势分析 -->
    <div class="trend-analysis">
      <h4>趋势分析</h4>
      <div class="analysis-grid">
        <div class="analysis-card">
          <div class="card-header">
            <h5>总体趋势</h5>
            <el-tag :type="getTrendTagType(data.trend_analysis.overall_trend)">
              {{ getTrendText(data.trend_analysis.overall_trend) }}
            </el-tag>
          </div>
          <div class="card-content">
            <p>近期表现: <strong>{{ getPerformanceText(data.trend_analysis.recent_performance) }}</strong></p>
          </div>
        </div>
        
        <div class="analysis-card">
          <div class="card-header">
            <h5>优势科目</h5>
          </div>
          <div class="card-content">
            <div v-if="data.trend_analysis.strengths.length > 0" class="strength-list">
              <el-tag 
                v-for="strength in data.trend_analysis.strengths" 
                :key="strength"
                type="success"
                class="strength-tag"
              >
                {{ strength }}
              </el-tag>
            </div>
            <p v-else class="no-data">暂无数据</p>
          </div>
        </div>
        
        <div class="analysis-card">
          <div class="card-header">
            <h5>需要改进</h5>
          </div>
          <div class="card-content">
            <div v-if="data.trend_analysis.areas_for_improvement.length > 0" class="improvement-list">
              <el-tag 
                v-for="area in data.trend_analysis.areas_for_improvement" 
                :key="area"
                type="warning"
                class="improvement-tag"
              >
                {{ area }}
              </el-tag>
            </div>
            <p v-else class="no-data">暂无数据</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 学习建议 -->
    <div class="recommendations">
      <h4>学习建议</h4>
      <div v-if="data.recommendations.length > 0" class="recommendation-list">
        <div 
          v-for="(recommendation, index) in data.recommendations" 
          :key="index"
          class="recommendation-item"
        >
          <el-icon class="recommendation-icon"><InfoFilled /></el-icon>
          <span>{{ recommendation }}</span>
        </div>
      </div>
      <p v-else class="no-data">暂无学习建议</p>
    </div>

    <!-- 成绩趋势图表 -->
    <div class="score-chart">
      <h4>成绩趋势图</h4>
      <div ref="chartContainer" class="chart-container"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { InfoFilled } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import type { IndividualReport } from '../../types/reports'

interface Props {
  data: IndividualReport['data']
}

const props = defineProps<Props>()
const chartContainer = ref<HTMLElement>()

// 格式化日期
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

// 获取成绩样式类
const getScoreClass = (score: number) => {
  if (score >= 90) return 'score excellent'
  if (score >= 80) return 'score good'
  if (score >= 70) return 'score average'
  if (score >= 60) return 'score pass'
  return 'score fail'
}

// 获取排名标签类型
const getRankTagType = (rank: number, total: number) => {
  const percentage = rank / total
  if (percentage <= 0.1) return 'success'
  if (percentage <= 0.3) return 'primary'
  if (percentage <= 0.6) return 'warning'
  return 'danger'
}

// 获取差距样式类
const getDifferenceClass = (difference: number) => {
  if (difference > 0) return 'difference positive'
  if (difference < 0) return 'difference negative'
  return 'difference neutral'
}

// 获取趋势标签类型
const getTrendTagType = (trend: string) => {
  switch (trend) {
    case 'improving': return 'success'
    case 'declining': return 'danger'
    case 'stable': return 'info'
    default: return 'info'
  }
}

// 获取趋势文本
const getTrendText = (trend: string) => {
  switch (trend) {
    case 'improving': return '上升趋势'
    case 'declining': return '下降趋势'
    case 'stable': return '稳定'
    default: return '未知'
  }
}

// 获取表现文本
const getPerformanceText = (performance: string) => {
  switch (performance) {
    case 'excellent': return '优秀'
    case 'good': return '良好'
    case 'average': return '一般'
    case 'poor': return '需要努力'
    default: return '未知'
  }
}

// 初始化图表
const initChart = () => {
  if (!chartContainer.value) return
  
  const chart = echarts.init(chartContainer.value)
  
  const option = {
    title: {
      text: '成绩趋势',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const data = params[0]
        return `${data.name}<br/>成绩: ${data.value}<br/>排名: ${data.data.rank}/${data.data.total}`
      }
    },
    xAxis: {
      type: 'category',
      data: props.data.exam_records.map(record => record.exam_name)
    },
    yAxis: {
      type: 'value',
      name: '成绩',
      min: 0,
      max: 100
    },
    series: [
      {
        name: '成绩',
        type: 'line',
        data: props.data.exam_records.map(record => ({
          value: record.score,
          rank: record.rank,
          total: record.total_students
        })),
        smooth: true,
        lineStyle: {
          color: '#409EFF'
        },
        itemStyle: {
          color: '#409EFF'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
            ]
          }
        }
      },
      {
        name: '班级平均分',
        type: 'line',
        data: props.data.exam_records.map(record => record.class_avg),
        lineStyle: {
          color: '#E6A23C',
          type: 'dashed'
        },
        itemStyle: {
          color: '#E6A23C'
        }
      }
    ]
  }
  
  chart.setOption(option)
  
  // 响应式调整
  window.addEventListener('resize', () => {
    chart.resize()
  })
}

onMounted(() => {
  nextTick(() => {
    initChart()
  })
})
</script>

<style scoped>
.individual-report {
  padding: 20px;
  background: white;
  border-radius: 8px;
}

.report-header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
}

.report-header h3 {
  color: #303133;
  margin-bottom: 10px;
  font-size: 24px;
  font-weight: 600;
}

.report-meta {
  color: #606266;
  font-size: 14px;
}

.report-meta span {
  margin: 0 15px;
}

/* 学生信息 */
.student-info {
  margin-bottom: 30px;
}

.student-info h4 {
  color: #409EFF;
  margin-bottom: 15px;
  font-size: 18px;
  border-left: 4px solid #409EFF;
  padding-left: 10px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.info-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.info-item .label {
  font-weight: 500;
  color: #606266;
  margin-right: 10px;
  min-width: 60px;
}

.info-item .value {
  color: #303133;
  font-weight: 600;
}

/* 考试记录 */
.exam-records {
  margin-bottom: 30px;
}

.exam-records h4 {
  color: #67C23A;
  margin-bottom: 15px;
  font-size: 18px;
  border-left: 4px solid #67C23A;
  padding-left: 10px;
}

.records-table {
  width: 100%;
}

.score {
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 4px;
}

.score.excellent {
  background: #f0f9ff;
  color: #1890ff;
}

.score.good {
  background: #f6ffed;
  color: #52c41a;
}

.score.average {
  background: #fff7e6;
  color: #fa8c16;
}

.score.pass {
  background: #fff2f0;
  color: #ff4d4f;
}

.score.fail {
  background: #fff2f0;
  color: #ff4d4f;
  font-weight: bold;
}

.difference {
  font-weight: bold;
}

.difference.positive {
  color: #52c41a;
}

.difference.negative {
  color: #ff4d4f;
}

.difference.neutral {
  color: #606266;
}

/* 趋势分析 */
.trend-analysis {
  margin-bottom: 30px;
}

.trend-analysis h4 {
  color: #E6A23C;
  margin-bottom: 15px;
  font-size: 18px;
  border-left: 4px solid #E6A23C;
  padding-left: 10px;
}

.analysis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.analysis-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e4e7ed;
}

.analysis-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.analysis-card h5 {
  margin: 0;
  color: #303133;
  font-size: 16px;
}

.strength-list,
.improvement-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.strength-tag,
.improvement-tag {
  margin: 0;
}

/* 学习建议 */
.recommendations {
  margin-bottom: 30px;
}

.recommendations h4 {
  color: #F56C6C;
  margin-bottom: 15px;
  font-size: 18px;
  border-left: 4px solid #F56C6C;
  padding-left: 10px;
}

.recommendation-list {
  background: #fef0f0;
  border-radius: 8px;
  padding: 20px;
}

.recommendation-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
  padding: 8px 0;
}

.recommendation-item:last-child {
  margin-bottom: 0;
}

.recommendation-icon {
  color: #F56C6C;
  margin-right: 8px;
  margin-top: 2px;
  flex-shrink: 0;
}

/* 成绩趋势图 */
.score-chart {
  margin-bottom: 20px;
}

.score-chart h4 {
  color: #909399;
  margin-bottom: 15px;
  font-size: 18px;
  border-left: 4px solid #909399;
  padding-left: 10px;
}

.chart-container {
  width: 100%;
  height: 400px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.no-data {
  color: #909399;
  font-style: italic;
  text-align: center;
  margin: 0;
}
</style>