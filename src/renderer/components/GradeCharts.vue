<template>
  <div class="grade-charts">
    <el-row :gutter="20">
      <!-- 成绩分布饼图 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="chart-header">
              <span>成绩分布</span>
              <el-select v-model="selectedSubject" @change="updateCharts" placeholder="选择学科" size="small">
                <el-option label="全部学科" value="" />
                <el-option
                  v-for="subject in subjects"
                  :key="subject"
                  :label="subject"
                  :value="subject"
                />
              </el-select>
            </div>
          </template>
          <div class="chart-container">
            <Pie
              v-if="pieChartData"
              :data="pieChartData"
              :options="pieChartOptions"
              style="max-height: 300px;"
            />
            <div v-else class="no-data">暂无数据</div>
          </div>
        </el-card>
      </el-col>

      <!-- 各班级平均分对比 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="chart-header">
              <span>各班级平均分对比</span>
              <el-select v-model="selectedSubjectForBar" @change="updateCharts" placeholder="选择学科" size="small">
                <el-option
                  v-for="subject in subjects"
                  :key="subject"
                  :label="subject"
                  :value="subject"
                />
              </el-select>
            </div>
          </template>
          <div class="chart-container">
            <Bar
              v-if="barChartData"
              :data="barChartData"
              :options="barChartOptions"
              style="max-height: 300px;"
            />
            <div v-else class="no-data">暂无数据</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <!-- 成绩趋势折线图 -->
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="chart-header">
              <span>成绩趋势分析</span>
              <div style="display: flex; gap: 10px;">
                <el-select v-model="selectedClassForTrend" @change="updateCharts" placeholder="选择班级" size="small">
                  <el-option
                    v-for="classItem in classes"
                    :key="classItem.id"
                    :label="`${classItem.grade}${classItem.class_number}班`"
                    :value="classItem.id"
                  />
                </el-select>
                <el-select v-model="selectedSubjectForTrend" @change="updateCharts" placeholder="选择学科" size="small">
                  <el-option
                    v-for="subject in subjects"
                    :key="subject"
                    :label="subject"
                    :value="subject"
                  />
                </el-select>
              </div>
            </div>
          </template>
          <div class="chart-container">
            <Line
              v-if="lineChartData"
              :data="lineChartData"
              :options="lineChartOptions"
              style="max-height: 400px;"
            />
            <div v-else class="no-data">暂无数据</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 统计数据表格 -->
    <el-row style="margin-top: 20px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>详细统计数据</span>
          </template>
          <el-table :data="statsData" style="width: 100%">
            <el-table-column prop="class_name" label="班级" width="120" />
            <el-table-column prop="subject" label="学科" width="100" />
            <el-table-column prop="student_count" label="参考人数" width="100" />
            <el-table-column prop="average_score" label="平均分" width="100">
              <template #default="{ row }">
                {{ parseFloat(row.average_score).toFixed(1) }}
              </template>
            </el-table-column>
            <el-table-column prop="max_score" label="最高分" width="100" />
            <el-table-column prop="min_score" label="最低分" width="100" />
            <el-table-column prop="pass_rate" label="及格率" width="100">
              <template #default="{ row }">
                {{ row.pass_rate }}%
              </template>
            </el-table-column>
            <el-table-column prop="excellent_rate" label="优秀率" width="100">
              <template #default="{ row }">
                {{ row.excellent_rate }}%
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
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
import { Bar, Pie, Line } from 'vue-chartjs'
import type { GradeStats } from '../types/grade'
import type { Class } from '../types/class'

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
  statsData: GradeStats[]
  classes: Class[]
  subjects: string[]
}

const props = defineProps<Props>()

const selectedSubject = ref('')
const selectedSubjectForBar = ref('')
const selectedSubjectForTrend = ref('')
const selectedClassForTrend = ref<number>()

// 饼图数据 - 成绩分布
const pieChartData = computed(() => {
  const stats = props.statsData.filter(stat => 
    !selectedSubject.value || stat.subject === selectedSubject.value
  )
  
  if (stats.length === 0) return null
  
  const excellent = stats.reduce((sum, stat) => sum + parseFloat(stat.excellent_rate), 0)
  const good = stats.reduce((sum, stat) => {
    const pass = parseFloat(stat.pass_rate)
    const excellentRate = parseFloat(stat.excellent_rate)
    return sum + (pass - excellentRate)
  }, 0)
  const fail = stats.reduce((sum, stat) => sum + (100 - parseFloat(stat.pass_rate)), 0)
  
  const totalCount = stats.length
  
  return {
    labels: ['优秀(85+)', '良好(60-84)', '不及格(0-59)'],
    datasets: [
      {
        data: [
          (excellent / totalCount).toFixed(1),
          (good / totalCount).toFixed(1),
          (fail / totalCount).toFixed(1)
        ],
        backgroundColor: [
          '#67C23A', // 绿色 - 优秀
          '#E6A23C', // 橙色 - 良好
          '#F56C6C'  // 红色 - 不及格
        ],
        borderWidth: 1
      }
    ]
  }
})

// 柱状图数据 - 各班级平均分对比
const barChartData = computed(() => {
  if (!selectedSubjectForBar.value) return null
  
  const stats = props.statsData.filter(stat => stat.subject === selectedSubjectForBar.value)
  
  if (stats.length === 0) return null
  
  return {
    labels: stats.map(stat => stat.class_name),
    datasets: [
      {
        label: '平均分',
        data: stats.map(stat => parseFloat(stat.average_score).toFixed(1)),
        backgroundColor: '#409EFF',
        borderColor: '#409EFF',
        borderWidth: 1
      }
    ]
  }
})

// 折线图数据 - 成绩趋势（这里简化处理，实际需要按时间维度的数据）
const lineChartData = computed(() => {
  if (!selectedClassForTrend.value || !selectedSubjectForTrend.value) return null
  
  const stats = props.statsData.filter(stat => 
    stat.class_id === selectedClassForTrend.value && 
    stat.subject === selectedSubjectForTrend.value
  )
  
  if (stats.length === 0) return null
  
  // 这里是示例数据，实际应该从后端获取时间序列数据
  return {
    labels: ['第一次月考', '期中考试', '第二次月考', '期末考试'],
    datasets: [
      {
        label: '平均分',
        data: [
          parseFloat(stats[0].average_score),
          parseFloat(stats[0].average_score) + Math.random() * 10 - 5,
          parseFloat(stats[0].average_score) + Math.random() * 10 - 5,
          parseFloat(stats[0].average_score) + Math.random() * 10 - 5
        ],
        borderColor: '#409EFF',
        backgroundColor: 'rgba(64, 158, 255, 0.1)',
        tension: 0.4
      },
      {
        label: '及格率',
        data: [
          parseFloat(stats[0].pass_rate),
          parseFloat(stats[0].pass_rate) + Math.random() * 20 - 10,
          parseFloat(stats[0].pass_rate) + Math.random() * 20 - 10,
          parseFloat(stats[0].pass_rate) + Math.random() * 20 - 10
        ],
        borderColor: '#67C23A',
        backgroundColor: 'rgba(103, 194, 58, 0.1)',
        tension: 0.4
      }
    ]
  }
})

// 图表配置选项
const pieChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const
    },
    tooltip: {
      callbacks: {
        label: function(context: any) {
          return context.label + ': ' + context.parsed + '%'
        }
      }
    }
  }
}

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
      beginAtZero: true,
      max: 100
    }
  }
}

// 更新图表
const updateCharts = () => {
  // 图表会自动响应数据变化，这里可以添加额外的更新逻辑
}

onMounted(() => {
  // 初始化默认选择
  if (props.subjects.length > 0) {
    selectedSubjectForBar.value = props.subjects[0]
    selectedSubjectForTrend.value = props.subjects[0]
  }
  if (props.classes.length > 0) {
    selectedClassForTrend.value = props.classes[0].id
  }
})
</script>

<style scoped>
.grade-charts {
  padding: 20px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.no-data {
  color: #999;
  font-size: 14px;
}
</style>