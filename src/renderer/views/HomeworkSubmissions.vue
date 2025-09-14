<template>
  <div class="submissions-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <el-button @click="$router.go(-1)" type="text">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h2>{{ homework?.title }} - 提交管理</h2>
      </div>
      <div class="header-right">
        <el-button @click="exportSubmissions">
          <el-icon><Download /></el-icon>
          导出成绩
        </el-button>
        <el-button type="primary" @click="batchGrade">
          <el-icon><Edit /></el-icon>
          批量批改
        </el-button>
      </div>
    </div>

    <!-- 作业信息卡片 -->
    <el-card class="homework-info" v-if="homework">
      <div class="homework-summary">
        <div class="info-item">
          <span class="label">科目：</span>
          <span>{{ homework.subject }}</span>
        </div>
        <div class="info-item">
          <span class="label">班级：</span>
          <span>{{ homework.class_name }}</span>
        </div>
        <div class="info-item">
          <span class="label">截止日期：</span>
          <span :class="{ 'overdue': isOverdue(homework.due_date) }">
            {{ homework.due_date }}
          </span>
        </div>
        <div class="info-item">
          <span class="label">满分：</span>
          <span>{{ homework.max_score }}分</span>
        </div>
        <div class="info-item">
          <span class="label">提交情况：</span>
          <span>{{ submissionStats.submitted }}/{{ submissionStats.total }}</span>
          <el-progress
            :percentage="submissionStats.percentage"
            :stroke-width="6"
            style="width: 100px; margin-left: 10px"
          />
        </div>
      </div>
    </el-card>

    <!-- 筛选和统计 -->
    <div class="filter-section">
      <el-form :model="filters" inline>
        <el-form-item label="提交状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable @change="loadSubmissions">
            <el-option label="已提交" value="submitted" />
            <el-option label="未提交" value="not_submitted" />
            <el-option label="已批改" value="graded" />
            <el-option label="逾期提交" value="late" />
          </el-select>
        </el-form-item>
        <el-form-item label="成绩范围">
          <el-select v-model="filters.scoreRange" placeholder="全部成绩" clearable @change="loadSubmissions">
            <el-option label="优秀 (90-100)" value="excellent" />
            <el-option label="良好 (80-89)" value="good" />
            <el-option label="中等 (70-79)" value="average" />
            <el-option label="及格 (60-69)" value="pass" />
            <el-option label="不及格 (<60)" value="fail" />
          </el-select>
        </el-form-item>
        <el-form-item label="搜索">
          <el-input
            v-model="filters.search"
            placeholder="搜索学生姓名或学号"
            clearable
            @keyup.enter="loadSubmissions"
            @clear="loadSubmissions"
          >
            <template #append>
              <el-button @click="loadSubmissions">
                <el-icon><Search /></el-icon>
              </el-button>
            </template>
          </el-input>
        </el-form-item>
      </el-form>
    </div>

    <!-- 提交列表 -->
    <div class="submissions-list">
      <el-table :data="submissionsList" v-loading="loading" stripe>
        <el-table-column prop="student_name" label="学生姓名" width="120" />
        <el-table-column prop="student_number" label="学号" width="120" />
        <el-table-column label="提交状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="submit_time" label="提交时间" width="160">
          <template #default="{ row }">
            <span v-if="row.submit_time">
              {{ formatDateTime(row.submit_time) }}
            </span>
            <span v-else class="not-submitted">未提交</span>
          </template>
        </el-table-column>
        <el-table-column label="成绩" width="100">
          <template #default="{ row }">
            <span v-if="row.score !== null" :class="getScoreClass(row.score)">
              {{ row.score }}/{{ homework?.max_score }}
            </span>
            <span v-else class="not-graded">未批改</span>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="作业内容" min-width="200">
          <template #default="{ row }">
            <div v-if="row.content" class="content-preview">
              {{ row.content.substring(0, 100) }}{{ row.content.length > 100 ? '...' : '' }}
            </div>
            <span v-else class="no-content">无内容</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status !== 'not_submitted'"
              size="small"
              @click="viewSubmission(row)"
            >
              查看
            </el-button>
            <el-button
              v-if="row.status !== 'not_submitted'"
              size="small"
              type="primary"
              @click="gradeSubmission(row)"
            >
              {{ row.score !== null ? '重新批改' : '批改' }}
            </el-button>
            <el-button
              v-if="row.status === 'not_submitted'"
              size="small"
              type="warning"
              @click="remindStudent(row)"
            >
              提醒
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadSubmissions"
          @current-change="loadSubmissions"
        />
      </div>
    </div>

    <!-- 查看提交详情对话框 -->
    <el-dialog v-model="showDetailDialog" title="作业详情" width="800px">
      <div v-if="selectedSubmission" class="submission-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="学生姓名">
            {{ selectedSubmission.student_name }}
          </el-descriptions-item>
          <el-descriptions-item label="学号">
            {{ selectedSubmission.student_number }}
          </el-descriptions-item>
          <el-descriptions-item label="提交时间">
            {{ formatDateTime(selectedSubmission.submit_time) }}
          </el-descriptions-item>
          <el-descriptions-item label="提交状态">
            <el-tag :type="getStatusType(selectedSubmission.status)">
              {{ getStatusText(selectedSubmission.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="当前成绩" v-if="selectedSubmission.score !== null">
            <span :class="getScoreClass(selectedSubmission.score)">
              {{ selectedSubmission.score }}/{{ homework?.max_score }}
            </span>
          </el-descriptions-item>
        </el-descriptions>
        <div class="submission-content" style="margin-top: 20px">
          <h4>作业内容</h4>
          <div class="content-box">
            {{ selectedSubmission.content || '无内容' }}
          </div>
        </div>
        <div v-if="selectedSubmission.feedback" class="feedback-content" style="margin-top: 20px">
          <h4>批改反馈</h4>
          <div class="feedback-box">
            {{ selectedSubmission.feedback }}
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 批改对话框 -->
    <el-dialog v-model="showGradeDialog" title="批改作业" width="600px">
      <div v-if="gradingSubmission">
        <div class="grading-info">
          <p><strong>学生：</strong>{{ gradingSubmission.student_name }} ({{ gradingSubmission.student_number }})</p>
          <p><strong>提交时间：</strong>{{ formatDateTime(gradingSubmission.submit_time) }}</p>
        </div>
        <div class="submission-content">
          <h4>作业内容</h4>
          <div class="content-box">
            {{ gradingSubmission.content || '无内容' }}
          </div>
        </div>
        <el-form :model="gradeForm" :rules="gradeRules" ref="gradeFormRef" label-width="80px">
          <el-form-item label="成绩" prop="score">
            <el-input-number
              v-model="gradeForm.score"
              :min="0"
              :max="homework?.max_score || 100"
              :precision="1"
              style="width: 200px"
            />
            <span style="margin-left: 10px">/ {{ homework?.max_score || 100 }}分</span>
          </el-form-item>
          <el-form-item label="反馈">
            <el-input
              v-model="gradeForm.feedback"
              type="textarea"
              :rows="4"
              placeholder="请输入批改反馈和建议"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showGradeDialog = false">取消</el-button>
        <el-button type="primary" @click="saveGrade" :loading="grading">
          保存批改
        </el-button>
      </template>
    </el-dialog>

    <!-- 批量批改对话框 -->
    <el-dialog v-model="showBatchGradeDialog" title="批量批改" width="500px">
      <el-form :model="batchGradeForm" label-width="100px">
        <el-form-item label="批改范围">
          <el-radio-group v-model="batchGradeForm.scope">
            <el-radio label="all">全部提交</el-radio>
            <el-radio label="ungraded">未批改</el-radio>
            <el-radio label="selected">选中项</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="统一成绩">
          <el-input-number
            v-model="batchGradeForm.score"
            :min="0"
            :max="homework?.max_score || 100"
            :precision="1"
            style="width: 200px"
          />
          <span style="margin-left: 10px">/ {{ homework?.max_score || 100 }}分</span>
        </el-form-item>
        <el-form-item label="统一反馈">
          <el-input
            v-model="batchGradeForm.feedback"
            type="textarea"
            :rows="3"
            placeholder="请输入统一的批改反馈"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBatchGradeDialog = false">取消</el-button>
        <el-button type="primary" @click="saveBatchGrade" :loading="batchGrading">
          批量批改
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Download, Edit, Search } from '@element-plus/icons-vue'

// 路由参数
const route = useRoute()
const homeworkId = route.params.id

// 响应式数据
const loading = ref(false)
const grading = ref(false)
const batchGrading = ref(false)
const showDetailDialog = ref(false)
const showGradeDialog = ref(false)
const showBatchGradeDialog = ref(false)
const selectedSubmission = ref(null)
const gradingSubmission = ref(null)
const gradeFormRef = ref()

// 作业信息
const homework = ref(null)

// 提交列表
const submissionsList = ref([])

// 筛选条件
const filters = reactive({
  status: '',
  scoreRange: '',
  search: ''
})

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 批改表单
const gradeForm = reactive({
  score: null,
  feedback: ''
})

// 批量批改表单
const batchGradeForm = reactive({
  scope: 'ungraded',
  score: null,
  feedback: ''
})

// 表单验证规则
const gradeRules = {
  score: [{ required: true, message: '请输入成绩', trigger: 'blur' }]
}

// 提交统计
const submissionStats = computed(() => {
  const total = submissionsList.value.length
  const submitted = submissionsList.value.filter(s => s.status !== 'not_submitted').length
  const percentage = total > 0 ? Math.round(submitted / total * 100) : 0
  return { total, submitted, percentage }
})

// 加载作业信息
const loadHomework = async () => {
  try {
    const result = await window.electronAPI.invoke('homework:detail', homeworkId)
    if (result.success) {
      homework.value = result.data
    } else {
      ElMessage.error(result.message || '加载作业信息失败')
    }
  } catch (error) {
    console.error('加载作业信息失败:', error)
    ElMessage.error('加载作业信息失败')
  }
}

// 加载提交列表
const loadSubmissions = async () => {
  loading.value = true
  try {
    const params = {
      homework_id: homeworkId,
      ...filters,
      page: pagination.page,
      page_size: pagination.pageSize
    }
    
    const result = await window.electronAPI.invoke('homework:submissions', params)
    if (result.success) {
      submissionsList.value = result.data.submissions
      pagination.total = result.data.total
    } else {
      ElMessage.error(result.message || '加载提交列表失败')
    }
  } catch (error) {
    console.error('加载提交列表失败:', error)
    ElMessage.error('加载提交列表失败')
  } finally {
    loading.value = false
  }
}

// 查看提交详情
const viewSubmission = (submission) => {
  selectedSubmission.value = submission
  showDetailDialog.value = true
}

// 批改作业
const gradeSubmission = (submission) => {
  gradingSubmission.value = submission
  gradeForm.score = submission.score
  gradeForm.feedback = submission.feedback || ''
  showGradeDialog.value = true
}

// 保存批改
const saveGrade = async () => {
  if (!gradeFormRef.value) return
  
  try {
    await gradeFormRef.value.validate()
    grading.value = true
    
    const result = await window.electronAPI.invoke('homework:grade', {
      homework_id: homeworkId,
      student_id: gradingSubmission.value.student_id,
      score: gradeForm.score,
      feedback: gradeForm.feedback
    })
    
    if (result.success) {
      ElMessage.success('批改成功')
      showGradeDialog.value = false
      loadSubmissions()
    } else {
      ElMessage.error(result.message || '批改失败')
    }
  } catch (error) {
    console.error('批改失败:', error)
    ElMessage.error('批改失败')
  } finally {
    grading.value = false
  }
}

// 批量批改
const batchGrade = () => {
  showBatchGradeDialog.value = true
}

// 保存批量批改
const saveBatchGrade = async () => {
  try {
    batchGrading.value = true
    
    const result = await window.electronAPI.invoke('homework:batchGrade', {
      homework_id: homeworkId,
      scope: batchGradeForm.scope,
      score: batchGradeForm.score,
      feedback: batchGradeForm.feedback
    })
    
    if (result.success) {
      ElMessage.success(`批量批改成功，共批改 ${result.data.count} 份作业`)
      showBatchGradeDialog.value = false
      loadSubmissions()
    } else {
      ElMessage.error(result.message || '批量批改失败')
    }
  } catch (error) {
    console.error('批量批改失败:', error)
    ElMessage.error('批量批改失败')
  } finally {
    batchGrading.value = false
  }
}

// 提醒学生
const remindStudent = (submission) => {
  ElMessage.info(`已提醒学生 ${submission.student_name} 提交作业`)
}

// 导出成绩
const exportSubmissions = async () => {
  try {
    const result = await window.electronAPI.invoke('homework:export', homeworkId)
    if (result.success) {
      ElMessage.success('导出成功')
    } else {
      ElMessage.error(result.message || '导出失败')
    }
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 获取状态类型
const getStatusType = (status) => {
  const types = {
    submitted: 'success',
    not_submitted: 'info',
    graded: 'primary',
    late: 'warning'
  }
  return types[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const texts = {
    submitted: '已提交',
    not_submitted: '未提交',
    graded: '已批改',
    late: '逾期提交'
  }
  return texts[status] || status
}

// 获取成绩样式类
const getScoreClass = (score) => {
  const maxScore = homework.value?.max_score || 100
  const percentage = (score / maxScore) * 100
  
  if (percentage >= 90) return 'score-excellent'
  if (percentage >= 80) return 'score-good'
  if (percentage >= 70) return 'score-average'
  if (percentage >= 60) return 'score-pass'
  return 'score-fail'
}

// 检查是否过期
const isOverdue = (dueDate) => {
  return new Date(dueDate) < new Date()
}

// 格式化日期时间
const formatDateTime = (dateTime) => {
  if (!dateTime) return ''
  return new Date(dateTime).toLocaleString('zh-CN')
}

// 初始化
onMounted(() => {
  loadHomework()
  loadSubmissions()
})
</script>

<style scoped>
.submissions-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-left h2 {
  margin: 0;
  color: #303133;
}

.header-right {
  display: flex;
  gap: 10px;
}

.homework-info {
  margin-bottom: 20px;
}

.homework-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.info-item .label {
  font-weight: bold;
  color: #606266;
}

.overdue {
  color: #f56c6c;
  font-weight: bold;
}

.filter-section {
  background: #f5f7fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.submissions-list {
  background: white;
  border-radius: 8px;
  padding: 20px;
}

.content-preview {
  font-size: 12px;
  color: #606266;
  line-height: 1.4;
}

.not-submitted,
.not-graded,
.no-content {
  color: #c0c4cc;
  font-style: italic;
}

.score-excellent { color: #67c23a; font-weight: bold; }
.score-good { color: #409eff; font-weight: bold; }
.score-average { color: #e6a23c; }
.score-pass { color: #909399; }
.score-fail { color: #f56c6c; font-weight: bold; }

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.submission-detail h4,
.feedback-content h4 {
  margin: 16px 0 8px 0;
  color: #303133;
}

.content-box,
.feedback-box {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #dcdfe6;
  white-space: pre-wrap;
  line-height: 1.6;
  color: #606266;
}

.grading-info {
  background: #f0f9ff;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
}

.grading-info p {
  margin: 5px 0;
  color: #606266;
}
</style>