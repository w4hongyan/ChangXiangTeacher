<template>
  <div class="class-summary-report">
    <div class="report-header">
      <h3>{{ data.class_name }} {{ data.subject }} {{ data.exam_type }} 成绩报告</h3>
      <div class="report-meta">
        <span>{{ data.semester }} {{ data.year }}年</span>
      </div>
    </div>

    <!-- 统计概览 -->
    <div class="statistics-overview">
      <h4>统计概览</h4>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">总人数</div>
          <div class="stat-value primary">{{ data.statistics.total_students }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">平均分</div>
          <div class="stat-value success">{{ data.statistics.average_score }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">中位数</div>
          <div class="stat-value info">{{ data.statistics.median_score }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">最高分</div>
          <div class="stat-value warning">{{ data.statistics.max_score }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">最低分</div>
          <div class="stat-value danger">{{ data.statistics.min_score }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">及格率</div>
          <div class="stat-value success">{{ data.statistics.pass_rate }}%</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">优秀率</div>
          <div class="stat-value primary">{{ data.statistics.excellent_rate }}%</div>
        </div>
      </div>
    </div>

    <!-- 分数分布 -->
    <div class="score-distribution">
      <h4>分数分布</h4>
      <div class="distribution-chart">
        <div class="chart-container">
          <div 
            v-for="item in data.statistics.score_distribution" 
            :key="item.range"
            class="distribution-bar"
          >
            <div class="bar-label">{{ item.range }}</div>
            <div class="bar-container">
              <div 
                class="bar-fill"
                :style="{ 
                  height: `${(item.count / data.statistics.total_students) * 100}%`,
                  backgroundColor: getDistributionColor(item.range)
                }"
              ></div>
            </div>
            <div class="bar-count">{{ item.count }}人</div>
            <div class="bar-percentage">
              {{ ((item.count / data.statistics.total_students) * 100).toFixed(1) }}%
            </div>
          </div>
        </div>
      </div>
      
      <!-- 分布表格 -->
      <el-table :data="data.statistics.score_distribution" class="distribution-table">
        <el-table-column prop="range" label="分数段" width="120" />
        <el-table-column prop="count" label="人数" width="100" />
        <el-table-column label="占比" width="100">
          <template #default="{ row }">
            {{ ((row.count / data.statistics.total_students) * 100).toFixed(1) }}%
          </template>
        </el-table-column>
        <el-table-column label="进度条">
          <template #default="{ row }">
            <el-progress 
              :percentage="(row.count / data.statistics.total_students) * 100"
              :color="getDistributionColor(row.range)"
              :show-text="false"
            />
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 优秀学生 -->
    <div class="top-students">
      <h4>优秀学生 (前{{ data.top_students.length }}名)</h4>
      <el-table :data="data.top_students" class="students-table">
        <el-table-column prop="rank" label="排名" width="80">
          <template #default="{ row }">
            <el-tag 
              :type="getRankTagType(row.rank)"
              effect="dark"
              size="small"
            >
              第{{ row.rank }}名
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="student_name" label="姓名" />
        <el-table-column prop="score" label="分数" width="100">
          <template #default="{ row }">
            <span class="score-highlight">{{ row.score }}</span>
          </template>
        </el-table-column>
        <el-table-column label="与平均分差距" width="120">
          <template #default="{ row }">
            <span :class="{
              'positive-diff': row.score > data.statistics.average_score,
              'negative-diff': row.score < data.statistics.average_score
            }">
              {{ row.score > data.statistics.average_score ? '+' : '' }}
              {{ (row.score - data.statistics.average_score).toFixed(1) }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 需要关注的学生 -->
    <div v-if="data.improvement_needed.length > 0" class="improvement-needed">
      <h4>需要关注的学生</h4>
      <el-table :data="data.improvement_needed" class="students-table">
        <el-table-column prop="student_name" label="姓名" />
        <el-table-column prop="score" label="分数" width="100">
          <template #default="{ row }">
            <span class="score-warning">{{ row.score }}</span>
          </template>
        </el-table-column>
        <el-table-column label="与平均分差距" width="120">
          <template #default="{ row }">
            <span class="negative-diff">
              {{ (row.score - data.statistics.average_score).toFixed(1) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="suggestions" label="改进建议">
          <template #default="{ row }">
            <div class="suggestions">
              <el-tag 
                v-for="(suggestion, index) in row.suggestions" 
                :key="index"
                size="small"
                type="warning"
                class="suggestion-tag"
              >
                {{ suggestion }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 总结分析 -->
    <div class="analysis-summary">
      <h4>分析总结</h4>
      <div class="summary-content">
        <div class="summary-item">
          <strong>整体表现：</strong>
          <span v-if="data.statistics.average_score >= 85" class="excellent">
            班级整体表现优秀，平均分达到{{ data.statistics.average_score }}分
          </span>
          <span v-else-if="data.statistics.average_score >= 75" class="good">
            班级整体表现良好，平均分为{{ data.statistics.average_score }}分
          </span>
          <span v-else-if="data.statistics.average_score >= 60" class="average">
            班级整体表现一般，平均分为{{ data.statistics.average_score }}分，有提升空间
          </span>
          <span v-else class="poor">
            班级整体表现需要改进，平均分仅为{{ data.statistics.average_score }}分
          </span>
        </div>
        
        <div class="summary-item">
          <strong>及格情况：</strong>
          <span v-if="data.statistics.pass_rate >= 90" class="excellent">
            及格率{{ data.statistics.pass_rate }}%，表现优异
          </span>
          <span v-else-if="data.statistics.pass_rate >= 80" class="good">
            及格率{{ data.statistics.pass_rate }}%，表现良好
          </span>
          <span v-else-if="data.statistics.pass_rate >= 60" class="average">
            及格率{{ data.statistics.pass_rate }}%，需要加强基础教学
          </span>
          <span v-else class="poor">
            及格率仅{{ data.statistics.pass_rate }}%，需要重点关注
          </span>
        </div>
        
        <div class="summary-item">
          <strong>优秀情况：</strong>
          <span v-if="data.statistics.excellent_rate >= 30" class="excellent">
            优秀率{{ data.statistics.excellent_rate }}%，优秀学生较多
          </span>
          <span v-else-if="data.statistics.excellent_rate >= 20" class="good">
            优秀率{{ data.statistics.excellent_rate }}%，有一定数量的优秀学生
          </span>
          <span v-else-if="data.statistics.excellent_rate >= 10" class="average">
            优秀率{{ data.statistics.excellent_rate }}%，可以培养更多优秀学生
          </span>
          <span v-else class="poor">
            优秀率仅{{ data.statistics.excellent_rate }}%，需要提高教学质量
          </span>
        </div>
        
        <div class="summary-item">
          <strong>分数分布：</strong>
          <span>
            分数主要集中在{{ getMostCommonRange() }}分段，
            {{ getDistributionAnalysis() }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  data: any
}

const props = defineProps<Props>()

// 计算属性
const getMostCommonRange = () => {
  const distribution = props.data.statistics.score_distribution
  const maxCount = Math.max(...distribution.map(d => d.count))
  const mostCommon = distribution.find(d => d.count === maxCount)
  return mostCommon?.range || ''
}

const getDistributionAnalysis = () => {
  const distribution = props.data.statistics.score_distribution
  const total = props.data.statistics.total_students
  
  const excellent = distribution.find(d => d.range === '90-100')?.count || 0
  const good = distribution.find(d => d.range === '80-89')?.count || 0
  const average = distribution.find(d => d.range === '70-79')?.count || 0
  const poor = distribution.find(d => d.range === '0-59')?.count || 0
  
  if (excellent / total > 0.3) {
    return '优秀学生占比较高，整体水平优异'
  } else if ((excellent + good) / total > 0.6) {
    return '良好以上学生占多数，整体表现不错'
  } else if (poor / total > 0.3) {
    return '不及格学生较多，需要加强基础教学'
  } else {
    return '分数分布相对均匀，可针对性提升'
  }
}

// 方法
const getDistributionColor = (range: string) => {
  const colorMap = {
    '90-100': '#67c23a',
    '80-89': '#409eff',
    '70-79': '#e6a23c',
    '60-69': '#f56c6c',
    '0-59': '#909399'
  }
  return colorMap[range] || '#909399'
}

const getRankTagType = (rank: number) => {
  if (rank === 1) return 'danger'
  if (rank === 2) return 'warning'
  if (rank === 3) return 'success'
  return 'info'
}
</script>

<style scoped>
.class-summary-report {
  padding: 20px;
  background: white;
  border-radius: 8px;
}

.report-header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e4e7ed;
}

.report-header h3 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 24px;
}

.report-meta {
  color: #909399;
  font-size: 14px;
}

.statistics-overview {
  margin-bottom: 30px;
}

.statistics-overview h4 {
  margin-bottom: 20px;
  color: #303133;
  border-left: 4px solid #409eff;
  padding-left: 10px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  border: 1px solid #e4e7ed;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-value.primary { color: #409eff; }
.stat-value.success { color: #67c23a; }
.stat-value.info { color: #909399; }
.stat-value.warning { color: #e6a23c; }
.stat-value.danger { color: #f56c6c; }

.score-distribution,
.top-students,
.improvement-needed,
.analysis-summary {
  margin-bottom: 30px;
}

.score-distribution h4,
.top-students h4,
.improvement-needed h4,
.analysis-summary h4 {
  margin-bottom: 20px;
  color: #303133;
  border-left: 4px solid #67c23a;
  padding-left: 10px;
}

.distribution-chart {
  margin-bottom: 20px;
}

.chart-container {
  display: flex;
  align-items: end;
  justify-content: space-around;
  height: 200px;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.distribution-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  max-width: 80px;
}

.bar-label {
  font-size: 12px;
  color: #606266;
  margin-bottom: 10px;
  font-weight: bold;
}

.bar-container {
  width: 40px;
  height: 120px;
  background: #e4e7ed;
  border-radius: 4px;
  display: flex;
  align-items: end;
  margin-bottom: 10px;
}

.bar-fill {
  width: 100%;
  border-radius: 4px;
  transition: height 0.5s ease;
  min-height: 2px;
}

.bar-count {
  font-size: 12px;
  color: #303133;
  font-weight: bold;
  margin-bottom: 5px;
}

.bar-percentage {
  font-size: 11px;
  color: #909399;
}

.distribution-table,
.students-table {
  margin-top: 20px;
}

.score-highlight {
  font-weight: bold;
  color: #67c23a;
  font-size: 16px;
}

.score-warning {
  font-weight: bold;
  color: #f56c6c;
  font-size: 16px;
}

.positive-diff {
  color: #67c23a;
  font-weight: bold;
}

.negative-diff {
  color: #f56c6c;
  font-weight: bold;
}

.suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.suggestion-tag {
  margin: 2px 0;
}

.summary-content {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.summary-item {
  margin-bottom: 15px;
  line-height: 1.6;
}

.summary-item:last-child {
  margin-bottom: 0;
}

.summary-item strong {
  color: #303133;
  margin-right: 8px;
}

.excellent { color: #67c23a; font-weight: bold; }
.good { color: #409eff; font-weight: bold; }
.average { color: #e6a23c; font-weight: bold; }
.poor { color: #f56c6c; font-weight: bold; }
</style>