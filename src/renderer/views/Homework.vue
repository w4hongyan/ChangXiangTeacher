<template>
  <Layout>
    <div class="homework-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>作业管理</h2>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        布置作业
      </el-button>
    </div>

    <!-- 筛选条件 -->
    <div class="filter-section">
      <el-form :model="filters" inline>
        <el-form-item label="班级">
          <el-select v-model="filters.class_id" placeholder="选择班级" clearable @change="loadHomework">
            <el-option
              v-for="cls in classes"
              :key="cls.id"
              :label="cls.name"
              :value="cls.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="科目">
          <el-select v-model="filters.subject" placeholder="选择科目" clearable @change="loadHomework">
            <el-option label="语文" value="语文" />
            <el-option label="数学" value="数学" />
            <el-option label="英语" value="英语" />
            <el-option label="物理" value="物理" />
            <el-option label="化学" value="化学" />
            <el-option label="生物" value="生物" />
            <el-option label="历史" value="历史" />
            <el-option label="地理" value="地理" />
            <el-option label="政治" value="政治" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="选择状态" clearable @change="loadHomework">
            <el-option label="草稿" value="draft" />
            <el-option label="已发布" value="published" />
            <el-option label="已关闭" value="closed" />
          </el-select>
        </el-form-item>
        <el-form-item label="搜索">
          <el-input
            v-model="filters.search"
            placeholder="搜索作业标题或描述"
            clearable
            @keyup.enter="loadHomework"
            @clear="loadHomework"
          >
            <template #append>
              <el-button @click="loadHomework">
                <el-icon><Search /></el-icon>
              </el-button>
            </template>
          </el-input>
        </el-form-item>
      </el-form>
    </div>

    <!-- 作业列表 -->
    <div class="homework-list">
      <el-table :data="homeworkList" v-loading="loading" stripe>
        <el-table-column prop="title" label="作业标题" min-width="200">
          <template #default="{ row }">
            <div class="homework-title">
              <span>{{ row.title }}</span>
              <el-tag
                :type="getStatusType(row.status)"
                size="small"
                style="margin-left: 8px"
              >
                {{ getStatusText(row.status) }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="subject" label="科目" width="100" />
        <el-table-column prop="class_name" label="班级" width="120" />
        <el-table-column label="优先级" width="100">
          <template #default="{ row }">
            <el-tag
              :type="getPriorityType(row.priority)"
              size="small"
            >
              {{ getPriorityText(row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="assign_date" label="布置日期" width="120" />
        <el-table-column prop="due_date" label="截止日期" width="120">
          <template #default="{ row }">
            <span :class="{ 'overdue': isOverdue(row.due_date) }">
              {{ row.due_date }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="提交情况" width="120">
          <template #default="{ row }">
            <div class="submission-stats">
              <span>{{ row.submitted_count || 0 }}/{{ row.total_students || 0 }}</span>
              <el-progress
                :percentage="getSubmissionPercentage(row)"
                :stroke-width="6"
                :show-text="false"
                style="margin-top: 4px"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewHomework(row)">
              查看
            </el-button>
            <el-button size="small" @click="viewSubmissions(row)">
              批改
            </el-button>
            <el-button size="small" type="primary" @click="editHomework(row)">
              编辑
            </el-button>
            <el-popconfirm
              title="确定删除这个作业吗？"
              @confirm="deleteHomework(row.id)"
            >
              <template #reference>
                <el-button size="small" type="danger">
                  删除
                </el-button>
              </template>
            </el-popconfirm>
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
          @size-change="loadHomework"
          @current-change="loadHomework"
        />
      </div>
    </div>

    <!-- 创建/编辑作业对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingHomework ? '编辑作业' : '布置作业'"
      width="800px"
      @close="resetForm"
    >
      <el-form
        ref="homeworkFormRef"
        :model="homeworkForm"
        :rules="homeworkRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="作业标题" prop="title">
              <el-input v-model="homeworkForm.title" placeholder="请输入作业标题" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="科目" prop="subject">
              <el-select v-model="homeworkForm.subject" placeholder="选择科目">
                <el-option label="语文" value="语文" />
                <el-option label="数学" value="数学" />
                <el-option label="英语" value="英语" />
                <el-option label="物理" value="物理" />
                <el-option label="化学" value="化学" />
                <el-option label="生物" value="生物" />
                <el-option label="历史" value="历史" />
                <el-option label="地理" value="地理" />
                <el-option label="政治" value="政治" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="班级" prop="class_id">
              <el-select v-model="homeworkForm.class_id" placeholder="选择班级">
                <el-option
                  v-for="cls in classes"
                  :key="cls.id"
                  :label="cls.name"
                  :value="cls.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级" prop="priority">
              <el-select v-model="homeworkForm.priority" placeholder="选择优先级">
                <el-option label="低" value="low" />
                <el-option label="中" value="medium" />
                <el-option label="高" value="high" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="布置日期" prop="assign_date">
              <el-date-picker
                v-model="homeworkForm.assign_date"
                type="date"
                placeholder="选择布置日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="截止日期" prop="due_date">
              <el-date-picker
                v-model="homeworkForm.due_date"
                type="date"
                placeholder="选择截止日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="满分" prop="max_score">
              <el-input-number
                v-model="homeworkForm.max_score"
                :min="1"
                :max="1000"
                placeholder="满分"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="homeworkForm.status" placeholder="选择状态">
                <el-option label="草稿" value="draft" />
                <el-option label="发布" value="published" />
                <el-option label="关闭" value="closed" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="作业描述">
          <el-input
            v-model="homeworkForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入作业描述"
          />
        </el-form-item>
        <el-form-item label="作业要求">
          <el-input
            v-model="homeworkForm.instructions"
            type="textarea"
            :rows="4"
            placeholder="请输入详细的作业要求和说明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="saveHomework" :loading="saving">
          {{ editingHomework ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 作业详情对话框 -->
    <el-dialog v-model="showDetailDialog" title="作业详情" width="700px">
      <div v-if="selectedHomework" class="homework-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="作业标题">
            {{ selectedHomework.title }}
          </el-descriptions-item>
          <el-descriptions-item label="科目">
            {{ selectedHomework.subject }}
          </el-descriptions-item>
          <el-descriptions-item label="班级">
            {{ selectedHomework.class_name }}
          </el-descriptions-item>
          <el-descriptions-item label="优先级">
            <el-tag :type="getPriorityType(selectedHomework.priority)">
              {{ getPriorityText(selectedHomework.priority) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="布置日期">
            {{ selectedHomework.assign_date }}
          </el-descriptions-item>
          <el-descriptions-item label="截止日期">
            {{ selectedHomework.due_date }}
          </el-descriptions-item>
          <el-descriptions-item label="满分">
            {{ selectedHomework.max_score }}分
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(selectedHomework.status)">
              {{ getStatusText(selectedHomework.status) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
        <div class="homework-content" style="margin-top: 20px">
          <h4>作业描述</h4>
          <p>{{ selectedHomework.description || '无描述' }}</p>
          <h4>作业要求</h4>
          <p style="white-space: pre-wrap">{{ selectedHomework.instructions || '无特殊要求' }}</p>
        </div>
      </div>
    </el-dialog>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import Layout from './Layout.vue'

// 路由
const router = useRouter()

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const showCreateDialog = ref(false)
const showDetailDialog = ref(false)
const editingHomework = ref(null)
const selectedHomework = ref(null)
const homeworkFormRef = ref()

// 班级列表
const classes = ref([])

// 作业列表
const homeworkList = ref([])

// 筛选条件
const filters = reactive({
  class_id: null,
  subject: '',
  status: '',
  search: ''
})

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 作业表单
const homeworkForm = reactive({
  title: '',
  description: '',
  subject: '',
  class_id: null,
  teacher_name: '当前教师',
  assign_date: '',
  due_date: '',
  status: 'draft',
  priority: 'medium',
  max_score: 100,
  instructions: ''
})

// 表单验证规则
const homeworkRules = {
  title: [{ required: true, message: '请输入作业标题', trigger: 'blur' }],
  subject: [{ required: true, message: '请选择科目', trigger: 'change' }],
  class_id: [{ required: true, message: '请选择班级', trigger: 'change' }],
  assign_date: [{ required: true, message: '请选择布置日期', trigger: 'change' }],
  due_date: [{ required: true, message: '请选择截止日期', trigger: 'change' }]
}

// 加载班级列表
const loadClasses = async () => {
  try {
    const result = await window.electronAPI.invoke('classes:getAll')
    if (result.success) {
      classes.value = result.data
    }
  } catch (error) {
    console.error('加载班级列表失败:', error)
  }
}

// 加载作业列表
const loadHomework = async () => {
  loading.value = true
  try {
    const params = {
      ...filters,
      page: pagination.page,
      page_size: pagination.pageSize
    }
    
    const result = await window.electronAPI.invoke('homework:list', params)
    if (result.success) {
      homeworkList.value = result.data.homework
      pagination.total = result.data.total
    } else {
      ElMessage.error(result.message || '加载作业列表失败')
    }
  } catch (error) {
    console.error('加载作业列表失败:', error)
    ElMessage.error('加载作业列表失败')
  } finally {
    loading.value = false
  }
}

// 保存作业
const saveHomework = async () => {
  if (!homeworkFormRef.value) return
  
  try {
    await homeworkFormRef.value.validate()
    saving.value = true
    
    let result
    if (editingHomework.value) {
      result = await window.electronAPI.invoke('homework:update', editingHomework.value.id, homeworkForm)
    } else {
      result = await window.electronAPI.invoke('homework:create', homeworkForm)
    }
    
    if (result.success) {
      ElMessage.success(result.message)
      showCreateDialog.value = false
      loadHomework()
    } else {
      ElMessage.error(result.message || '保存失败')
    }
  } catch (error) {
    console.error('保存作业失败:', error)
  } finally {
    saving.value = false
  }
}

// 编辑作业
const editHomework = (homework) => {
  editingHomework.value = homework
  Object.assign(homeworkForm, homework)
  showCreateDialog.value = true
}

// 查看作业详情
const viewHomework = (homework) => {
  selectedHomework.value = homework
  showDetailDialog.value = true
}

// 查看提交情况
const viewSubmissions = (homework) => {
  // 跳转到提交管理页面
  router.push(`/homework/${homework.id}/submissions`)
}

// 删除作业
const deleteHomework = async (id) => {
  try {
    const result = await window.electronAPI.invoke('homework:delete', id)
    if (result.success) {
      ElMessage.success('删除成功')
      loadHomework()
    } else {
      ElMessage.error(result.message || '删除失败')
    }
  } catch (error) {
    console.error('删除作业失败:', error)
    ElMessage.error('删除失败')
  }
}

// 重置表单
const resetForm = () => {
  editingHomework.value = null
  Object.assign(homeworkForm, {
    title: '',
    description: '',
    subject: '',
    class_id: null,
    teacher_name: '当前教师',
    assign_date: '',
    due_date: '',
    status: 'draft',
    priority: 'medium',
    max_score: 100,
    instructions: ''
  })
  if (homeworkFormRef.value) {
    homeworkFormRef.value.clearValidate()
  }
}

// 获取状态类型
const getStatusType = (status) => {
  const types = {
    draft: 'info',
    published: 'success',
    closed: 'danger'
  }
  return types[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const texts = {
    draft: '草稿',
    published: '已发布',
    closed: '已关闭'
  }
  return texts[status] || status
}

// 获取优先级类型
const getPriorityType = (priority) => {
  const types = {
    low: 'info',
    medium: 'warning',
    high: 'danger'
  }
  return types[priority] || 'info'
}

// 获取优先级文本
const getPriorityText = (priority) => {
  const texts = {
    low: '低',
    medium: '中',
    high: '高'
  }
  return texts[priority] || priority
}

// 检查是否过期
const isOverdue = (dueDate) => {
  return new Date(dueDate) < new Date()
}

// 获取提交百分比
const getSubmissionPercentage = (homework) => {
  if (!homework.total_students || homework.total_students === 0) return 0
  return Math.round((homework.submitted_count || 0) / homework.total_students * 100)
}

// 初始化
onMounted(() => {
  loadClasses()
  loadHomework()
  
  // 设置默认日期
  const today = new Date().toISOString().split('T')[0]
  homeworkForm.assign_date = today
  
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 7) // 默认一周后截止
  homeworkForm.due_date = tomorrow.toISOString().split('T')[0]
})
</script>

<style scoped>
.homework-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.filter-section {
  background: #f5f7fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.homework-list {
  background: white;
  border-radius: 8px;
  padding: 20px;
}

.homework-title {
  display: flex;
  align-items: center;
}

.submission-stats {
  font-size: 12px;
}

.overdue {
  color: #f56c6c;
  font-weight: bold;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.homework-detail h4 {
  margin: 16px 0 8px 0;
  color: #303133;
}

.homework-detail p {
  margin: 0 0 16px 0;
  color: #606266;
  line-height: 1.6;
}
</style>