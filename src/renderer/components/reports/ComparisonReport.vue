<template>
  <div class="comparison-report">
    <div class="report-header">
      <h3>{{ data.class_name || '班级' }} {{ data.subject }} 期中期末对比分析</h3>
      <div class="report-meta">
        <span>{{ data.semester }} {{ data.year }}年</span>
      </div>
    </div>

    <!-- 整体对比概览 -->
    <div class="comparison-overview">
      <h4>整体对比概览</h4>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">参与对比人数</div>
          <div class="stat-value primary">{{ data.summary.total_students }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">期中平均分</div>
          <div class="stat-value info">{{ data.summary.avg_midterm_score }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">期末平均分</div>
          <div class="stat-value success">{{ data.summary.avg_final_score }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">平均提升</div>
          <div class="stat-value" :class="getImprovementClass(data.summary.avg_improvement)">
            {{ data.summary.avg_improvement > 0 ? '+' : '' }}{{ data.summary.avg_improvement }}
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">进步人数</div>
          <div class="stat-value success">{{ data.summary.improved_students }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">退步人数</div>
          <div class="stat-value danger">{{ data.summary.declined_students }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">稳定人数</div>
          <div class="stat-value warning">{{ data.summary.stable_students }}</div>
        </div>
      </div>
    </div>

    <!-- 进步率分析 -->
    <div class="improvement-analysis">
      <h4>进步情况分析</h4>
      <div class="analysis-charts">
        <div class="chart-item">
          <div class="chart-title">学生进步分布</div>
          <div class="progress-chart">
            <div class="progress-item">
              <span class="progress-label">进步学生</span>
              <el-progress 
                :percentage="(data.summary.improved_students / data.summary.total_students) * 100"
                color="#67c23a"
                :show-text="true"
                :format="() => `${data.summary.improved_students}人`"
              />
            </div>
            <div class="progress-item">
              <span class="progress-label">退步学生</span>
              <el-progress 
                :percentage="(data.summary.declined_students / data.summary.total_students) * 100"
                color="#f56c6c"
                :show-text="true"
                :format="() => `${data.summary.declined_students}人`"
              />
            </div>
            <div class="progress-item">
              <span class="progress-label">稳定学生</span>
              <el-progress 
                :percentage="(data.summary.stable_students / data.summary.total_students) * 100"
                color="#e6a23c"
                :show-text="true"
                :format="() => `${data.summary.stable_students}人`"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 进步最大的学生 -->
    <div class="top-improvers">
      <h4>进步最大的学生</h4>
      <el-table :data="data.top_improvers" class="comparison-table">
        <el-table-column prop="student_name" label="姓名" width="120" />
        <el-table-column prop="midterm_score" label="期中成绩" width="100">
          <template #default="{ row }">
            <span class="score-midterm">{{ row.midterm_score }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="final_score" label="期末成绩" width="100">
          <template #default="{ row }">
            <span class="score-final">{{ row.final_score }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="improvement" label="提升幅度" width="120">
          <template #default="{ row }">
            <el-tag 
              :type="getImprovementTagType(row.improvement)"
              effect="dark"
            >
              {{ row.improvement > 0 ? '+' : '' }}{{ row.improvement }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="rank_change" label="排名变化" width="120">
          <template #default="{ row }">
            <span :class="getRankChangeClass(row.rank_change)">
              {{ formatRankChange(row.rank_change) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="trend" label="趋势" width="100">
          <template #default="{ row }">
            <el-icon :class="getTrendClass(row.trend)" size="20">
              <component :is="getTrendIcon(row.trend)" />
            </el-icon>
          </template>
        </el-table-column>
        <el-table-column label="表现评价">
          <template #default="{ row }">
            <span class="performance-comment">
              {{ getPerformanceComment(row.improvement, row.rank_change) }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 需要重点关注的学生 -->
    <div v-if="data.need_attention.length > 0" class="need-attention">
      <h4>需要重点关注的学生</h4>
      <el-table :data="data.need_attention" class="comparison-table attention-table">
        <el-table-column prop="student_name" label="姓名" width="120" />
        <el-table-column prop="midterm_score" label="期中成绩" width="100">
          <template #default="{ row }">
            <span class="score-midterm">{{ row.midterm_score }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="final_score" label="期末成绩" width="100">
          <template #default="{ row }">
            <span class="score-final warning">{{ row.final_score }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="improvement" label="退步幅度" width="120">
          <template #default="{ row }">
            <el-tag type="danger" effect="dark">
              {{ row.improvement }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="rank_change" label="排名变化" width="120">
          <template #default="{ row }">
            <span class="rank-decline">
              {{ formatRankChange(row.rank_change) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="建议措施">
          <template #default="{ row }">
            <div class="suggestions">
              <el-tag 
                v-for="(suggestion, index) in getAttentionSuggestions(row.improvement)"
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

    <!-- 全体学生对比详情 -->
    <div class="all-students-comparison">
      <h4>全体学生对比详情</h4>
      <div class="table-controls">
        <el-radio-group v-model="sortBy" @change="sortComparisons">
          <el-radio-button label="improvement">按提升幅度排序</el-radio-button>
          <el-radio-button label="final_score">按期末成绩排序</el-radio-button>
          <el-radio-button label="rank_change">按排名变化排序</el-radio-button>
        </el-radio-group>
      </div>
      
      <el-table :data="sortedComparisons" class="comparison-table full-table" max-height="400">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="student_name" label="姓名" width="120" fixed="left" />
        <el-table-column prop="midterm_score" label="期中成绩" width="100">
          <template #default="{ row }">
            <span class="score-midterm">{{ row.midterm_score }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="final_score" label="期末成绩" width="100">
          <template #default="{ row }">
            <span class="score-final">{{ row.final_score }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="improvement" label="变化" width="100">
          <template #default="{ row }">
            <span :class="getImprovementClass(row.improvement)">
              {{ row.improvement > 0 ? '+' : '' }}{{ row.improvement }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="rank_change" label="排名变化" width="120">
          <template #default="{ row }">
            <span :class="getRankChangeClass(row.rank_change)">
              {{ formatRankChange(row.rank_change) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="trend" label="趋势" width="80">
          <template #default="{ row }">
            <el-icon :class="getTrendClass(row.trend)" size="18">
              <component :is="getTrendIcon(row.trend)" />
            </el-icon>
          </template>
        </el-table-column>
        <el-table-column label="表现分析">
          <template #default="{ row }">
            <span class="performance-analysis">
              {{ getDetailedAnalysis(row) }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 总结建议 -->
    <div class="summary-recommendations">
      <h4>总结与建议</h4>
      <div class="recommendations-content">
        <div class="recommendation-section">
          <h5>整体表现分析</h5>
          <p>{{ getOverallAnalysis() }}</p>
        </div>
        
        <div class="recommendation-section">
          <h5>教学建议</h5>
          <ul class="recommendation-list">
            <li v-for="(suggestion, index) in getTeachingSuggestions()" :key="index">
              {{ suggestion }}
            </li>
          </ul>
        </div>
        
        <div class="recommendation-section">
          <h5>后续关注重点</h5>
          <ul class="recommendation-list">
            <li v-for="(focus, index) in getFocusPoints()" :key="index">
              {{ focus }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ArrowUp, ArrowDown, Minus } from '@element-plus/icons-vue'

interface Props {
  data: any
}

const props = defineProps<Props>()

// 响应式数据
const sortBy = ref('improvement')

// 计算属性
const sortedComparisons = computed(() => {
  const comparisons = [...props.data.comparisons]
  
  switch (sortBy.value) {
    case 'improvement':
      return comparisons.sort((a, b) => b.improvement - a.improvement)
    case 'final_score':
      return comparisons.sort((a, b) => b.final_score - a.final_score)
    case 'rank_change':
      return comparisons.sort((a, b) => b.rank_change - a.rank_change)
    default:
      return comparisons
  }
})

// 方法
const sortComparisons = () => {
  // 触发重新计算
}

const getImprovementClass = (improvement: number) => {
  if (improvement > 10) return 'excellent'
  if (improvement > 0) return 'good'
  if (improvement > -5) return 'stable'
  return 'poor'
}

const getImprovementTagType = (improvement: number) => {
  if (improvement > 15) return 'success'
  if (improvement > 5) return 'primary'
  if (improvement > 0) return 'info'
  return 'warning'
}

const getRankChangeClass = (rankChange: number) => {
  if (rankChange > 0) return 'rank-up'
  if (rankChange < 0) return 'rank-down'
  return 'rank-stable'
}

const formatRankChange = (rankChange: number) => {
  if (rankChange > 0) return `↑${rankChange}`
  if (rankChange < 0) return `↓${Math.abs(rankChange)}`
  return '-'
}

const getTrendClass = (trend: string) => {
  const classMap = {
    'up': 'trend-up',
    'down': 'trend-down',
    'stable': 'trend-stable'
  }
  return classMap[trend] || 'trend-stable'
}

const getTrendIcon = (trend: string) => {
  const iconMap = {
    'up': ArrowUp,
    'down': ArrowDown,
    'stable': Minus
  }
  return iconMap[trend] || Minus
}

const getPerformanceComment = (improvement: number, rankChange: number) => {
  if (improvement > 15 && rankChange > 0) {
    return '表现优异，进步显著'
  } else if (improvement > 10) {
    return '进步明显，值得表扬'
  } else if (improvement > 5) {
    return '稳步提升，继续努力'
  } else if (improvement > 0) {
    return '略有进步，需要加油'
  } else if (improvement > -5) {
    return '基本稳定，保持状态'
  } else {
    return '需要关注，加强辅导'
  }
}

const getAttentionSuggestions = (improvement: number) => {
  const suggestions = ['加强基础复习', '个别辅导']
  
  if (improvement < -15) {
    suggestions.push('家校沟通', '学习方法指导')
  } else if (improvement < -10) {
    suggestions.push('查找问题原因')
  }
  
  return suggestions
}

const getDetailedAnalysis = (row: any) => {
  const { improvement, rank_change, midterm_score, final_score } = row
  
  if (improvement > 10 && rank_change > 0) {
    return '进步显著，排名上升，学习状态良好'
  } else if (improvement > 0 && rank_change >= 0) {
    return '稳步提升，保持良好学习态势'
  } else if (improvement > 0 && rank_change < 0) {
    return '成绩提升但排名下降，需要更大努力'
  } else if (improvement <= 0 && rank_change < 0) {
    return '成绩和排名双下降，需要重点关注'
  } else {
    return '表现基本稳定，可适当提高要求'
  }
}

const getOverallAnalysis = () => {
  const { summary } = props.data
  const improveRate = (summary.improved_students / summary.total_students * 100).toFixed(1)
  const declineRate = (summary.declined_students / summary.total_students * 100).toFixed(1)
  
  let analysis = `本次期中期末对比中，全班${summary.total_students}名学生参与对比。`
  
  if (summary.avg_improvement > 5) {
    analysis += `整体表现优秀，平均提升${summary.avg_improvement}分，${improveRate}%的学生取得进步。`
  } else if (summary.avg_improvement > 0) {
    analysis += `整体表现良好，平均提升${summary.avg_improvement}分，${improveRate}%的学生取得进步。`
  } else {
    analysis += `整体表现需要改进，平均下降${Math.abs(summary.avg_improvement)}分，${declineRate}%的学生出现退步。`
  }
  
  return analysis
}

const getTeachingSuggestions = () => {
  const { summary } = props.data
  const suggestions = []
  
  if (summary.avg_improvement > 5) {
    suggestions.push('继续保持现有教学方法，巩固教学成果')
    suggestions.push('适当提高教学难度，挑战优秀学生')
  } else if (summary.avg_improvement > 0) {
    suggestions.push('总结成功经验，推广有效教学方法')
    suggestions.push('关注中等学生，帮助他们进一步提升')
  } else {
    suggestions.push('反思教学方法，寻找问题根源')
    suggestions.push('加强基础知识教学，夯实学生基础')
  }
  
  if (summary.declined_students > summary.total_students * 0.3) {
    suggestions.push('重点关注退步学生，制定个性化辅导方案')
  }
  
  return suggestions
}

const getFocusPoints = () => {
  const { summary, need_attention } = props.data
  const points = []
  
  if (need_attention.length > 0) {
    points.push(`重点关注${need_attention.length}名退步较大的学生`)
  }
  
  if (summary.improved_students > 0) {
    points.push(`表扬和鼓励${summary.improved_students}名进步学生`)
  }
  
  points.push('定期进行学习情况跟踪和反馈')
  points.push('加强与家长的沟通，形成教育合力')
  
  return points
}
</script>

<style scoped>
.comparison-report {
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

.comparison-overview,
.improvement-analysis,
.top-improvers,
.need-attention,
.all-students-comparison,
.summary-recommendations {
  margin-bottom: 30px;
}

.comparison-overview h4,
.improvement-analysis h4,
.top-improvers h4,
.need-attention h4,
.all-students-comparison h4,
.summary-recommendations h4 {
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
.stat-value.excellent { color: #67c23a; }
.stat-value.good { color: #409eff; }
.stat-value.stable { color: #e6a23c; }
.stat-value.poor { color: #f56c6c; }

.progress-chart {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
}

.progress-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.progress-item:last-child {
  margin-bottom: 0;
}

.progress-label {
  width: 80px;
  font-size: 14px;
  color: #606266;
  margin-right: 15px;
}

.comparison-table {
  margin-top: 20px;
}

.attention-table {
  border: 2px solid #f56c6c;
  border-radius: 8px;
}

.score-midterm {
  color: #909399;
  font-weight: bold;
}

.score-final {
  color: #303133;
  font-weight: bold;
  font-size: 16px;
}

.score-final.warning {
  color: #f56c6c;
}

.excellent { color: #67c23a; font-weight: bold; }
.good { color: #409eff; font-weight: bold; }
.stable { color: #e6a23c; font-weight: bold; }
.poor { color: #f56c6c; font-weight: bold; }

.rank-up { color: #67c23a; font-weight: bold; }
.rank-down { color: #f56c6c; font-weight: bold; }
.rank-stable { color: #909399; }
.rank-decline { color: #f56c6c; font-weight: bold; }

.trend-up { color: #67c23a; }
.trend-down { color: #f56c6c; }
.trend-stable { color: #e6a23c; }

.performance-comment,
.performance-analysis {
  font-size: 13px;
  color: #606266;
}

.suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.suggestion-tag {
  margin: 2px 0;
}

.table-controls {
  margin-bottom: 15px;
  text-align: center;
}

.full-table {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.recommendations-content {
  background: #f8f9fa;
  padding: 25px;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.recommendation-section {
  margin-bottom: 20px;
}

.recommendation-section:last-child {
  margin-bottom: 0;
}

.recommendation-section h5 {
  color: #303133;
  margin-bottom: 10px;
  font-size: 16px;
}

.recommendation-section p {
  color: #606266;
  line-height: 1.6;
  margin-bottom: 15px;
}

.recommendation-list {
  color: #606266;
  line-height: 1.8;
  padding-left: 20px;
}

.recommendation-list li {
  margin-bottom: 8px;
}
</style>