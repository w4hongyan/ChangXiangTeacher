<template>
  <div class="grade-reports">
    <div class="reports-header">
      <h2>成绩报告管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="showGenerateDialog = true">
          <el-icon><Plus /></el-icon>
          生成报告
        </el-button>
        <el-button @click="refreshReports">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 筛选条件 -->
    <div class="filters">
      <el-form :model="filters" inline>
        <el-form-item label="班级">
          <el-select v-model="filters.class_id" placeholder="选择班级" clearable>
            <el-option
              v-for="cls in classes"
              :key="cls.id"
              :label="cls.name"
              :value="cls.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="学科">
          <el-select v-model="filters.subject" placeholder="选择学科" clearable>
            <el-option
              v-for="subject in subjects"
              :key="subject"
              :label="subject"
              :value="subject"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="报告类型">
          <el-select v-model="filters.report_type" placeholder="选择类型" clearable>
            <el-option label="班级总结" value="class_summary" />
            <el-option label="学生详情" value="student_detail" />
            <el-option label="学科分析" value="subject_analysis" />
            <el-option label="对比分析" value="comparison" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadReports">搜索</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 报告列表 -->
    <div class="reports-table">
      <el-table
        :data="reports"
        v-loading="loading"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="title" label="报告标题" min-width="200" />
        <el-table-column prop="class_name" label="班级" width="120" />
        <el-table-column prop="subject" label="学科" width="100" />
        <el-table-column prop="exam_type" label="考试类型" width="120" />
        <el-table-column prop="report_type" label="报告类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getReportTypeColor(row.report_type)">
              {{ getReportTypeName(row.report_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="生成时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewReport(row)">
              查看
            </el-button>
            <el-button size="small" type="success" @click="exportReport(row)">
              导出
            </el-button>
            <el-button size="small" type="danger" @click="deleteReport(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.page_size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadReports"
          @current-change="loadReports"
        />
      </div>
    </div>

    <!-- 生成报告对话框 -->
    <el-dialog
      v-model="showGenerateDialog"
      title="生成成绩报告"
      width="600px"
      @close="resetGenerateForm"
    >
      <el-form :model="generateForm" :rules="generateRules" ref="generateFormRef" label-width="100px">
        <el-form-item label="报告类型" prop="report_type">
          <el-radio-group v-model="generateForm.report_type">
            <el-radio label="class_summary">班级成绩报告</el-radio>
            <el-radio label="individual">学生个人报告</el-radio>
            <el-radio label="comparison">期中期末对比</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="班级" prop="class_id">
          <el-select v-model="generateForm.class_id" placeholder="选择班级">
            <el-option
              v-for="cls in classes"
              :key="cls.id"
              :label="cls.name"
              :value="cls.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="学科" prop="subject">
          <el-select v-model="generateForm.subject" placeholder="选择学科">
            <el-option
              v-for="subject in subjects"
              :key="subject"
              :label="subject"
              :value="subject"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item 
          v-if="generateForm.report_type === 'class_summary'"
          label="考试类型" 
          prop="exam_type"
        >
          <el-select v-model="generateForm.exam_type" placeholder="选择考试类型">
            <el-option
              v-for="type in examTypes"
              :key="type"
              :label="type"
              :value="type"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item 
          v-if="generateForm.report_type === 'individual'"
          label="选择学生" 
          prop="student_id"
        >
          <el-select v-model="generateForm.student_id" placeholder="选择学生" filterable>
            <el-option
              v-for="student in filteredStudents"
              :key="student.id"
              :label="`${student.name} (${student.student_id})`"
              :value="student.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="学期" prop="semester">
          <el-select v-model="generateForm.semester" placeholder="选择学期">
            <el-option label="上学期" value="上学期" />
            <el-option label="下学期" value="下学期" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="学年" prop="year">
          <el-select v-model="generateForm.year" placeholder="选择学年">
            <el-option
              v-for="year in years"
              :key="year"
              :label="year + '年'"
              :value="year"
            />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showGenerateDialog = false">取消</el-button>
        <el-button type="primary" @click="generateReport" :loading="generating">
          生成报告
        </el-button>
      </template>
    </el-dialog>

    <!-- 报告详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      :title="currentReport?.title"
      width="80%"
      top="5vh"
    >
      <div v-if="currentReport" class="report-detail">
        <div v-if="currentReport.report_type === 'class_summary'" class="class-summary">
          <ClassSummaryReport :data="currentReport.content" />
        </div>
        <div v-else-if="currentReport.report_type === 'individual'" class="individual">
          <IndividualReport :data="currentReport.content" />
        </div>
        <div v-else-if="currentReport.report_type === 'comparison'" class="comparison">
          <ComparisonReport :data="currentReport.content" />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import ClassSummaryReport from './ClassSummaryReport.vue'
import IndividualReport from './IndividualReport.vue'
import ComparisonReport from './ComparisonReport.vue'

// 响应式数据
const loading = ref(false)
const generating = ref(false)
const showGenerateDialog = ref(false)
const showDetailDialog = ref(false)
const generateFormRef = ref()

const reports = ref([])
const classes = ref([])
const subjects = ref([])
const examTypes = ref([])
const students = ref([])
const selectedReports = ref([])
const currentReport = ref(null)

// 筛选条件
const filters = reactive({
  class_id: null,
  subject: null,
  report_type: null
})

// 分页
const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})

// 生成报告表单
const generateForm = reactive({
  report_type: 'class_summary',
  class_id: null,
  subject: null,
  exam_type: null,
  student_id: null,
  semester: '上学期',
  year: new Date().getFullYear()
})

// 表单验证规则
const generateRules = computed(() => {
  const baseRules = {
    report_type: [{ required: true, message: '请选择报告类型', trigger: 'change' }],
    class_id: [{ required: true, message: '请选择班级', trigger: 'change' }],
    semester: [{ required: true, message: '请选择学期', trigger: 'change' }],
    year: [{ required: true, message: '请选择学年', trigger: 'change' }]
  }
  
  // 根据报告类型动态添加验证规则
  if (generateForm.report_type === 'class_summary') {
    baseRules.subject = [{ required: true, message: '请选择学科', trigger: 'change' }]
    baseRules.exam_type = [{ required: true, message: '请选择考试类型', trigger: 'change' }]
  } else if (generateForm.report_type === 'individual') {
    baseRules.student_id = [{ required: true, message: '请选择学生', trigger: 'change' }]
  } else if (generateForm.report_type === 'comparison') {
    baseRules.subject = [{ required: true, message: '请选择学科', trigger: 'change' }]
  }
  
  return baseRules
})

// 计算属性
const years = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => currentYear - i)
})

const filteredStudents = computed(() => {
  if (!generateForm.class_id) return []
  return students.value.filter(student => student.class_id === generateForm.class_id)
})

// 方法
const loadReports = async () => {
  loading.value = true
  try {
    const params = {
      ...filters,
      page: pagination.page,
      page_size: pagination.page_size
    }
    
    const result = await window.electronAPI.invoke('grades:getReports', params)
    if (result.success) {
      reports.value = result.data.reports
      pagination.total = result.data.pagination.total
    } else {
      ElMessage.error(result.error || '加载报告失败')
    }
  } catch (error) {
    console.error('加载报告失败:', error)
    ElMessage.error('加载报告失败')
  } finally {
    loading.value = false
  }
}

const loadClasses = async () => {
  try {
    const result = await window.electronAPI.invoke('classes:getAll')
    if (result.success) {
      classes.value = result.data
    }
  } catch (error) {
    console.error('加载班级失败:', error)
  }
}

const loadSubjects = async () => {
  try {
    const result = await window.electronAPI.invoke('grades:getSubjects')
    if (result.success) {
      subjects.value = result.data
    }
  } catch (error) {
    console.error('加载学科失败:', error)
  }
}

const loadExamTypes = async () => {
  try {
    const result = await window.electronAPI.invoke('grades:getExamTypes')
    if (result.success) {
      examTypes.value = result.data
    }
  } catch (error) {
    console.error('加载考试类型失败:', error)
  }
}

const loadStudents = async () => {
  try {
    const result = await window.electronAPI.invoke('students:getAll')
    if (result.success) {
      students.value = result.data
    }
  } catch (error) {
    console.error('加载学生失败:', error)
  }
}

const generateReport = async () => {
  if (!generateFormRef.value) return
  
  try {
    await generateFormRef.value.validate()
    generating.value = true
    
    let result
    if (generateForm.report_type === 'class_summary') {
      result = await window.electronAPI.invoke('grades:generateClassReport', {
        class_id: generateForm.class_id,
        subject: generateForm.subject,
        exam_type: generateForm.exam_type,
        semester: generateForm.semester,
        year: generateForm.year
      })
    } else if (generateForm.report_type === 'individual') {
      result = await window.electronAPI.invoke('grades:generateStudentReport', {
        student_id: generateForm.student_id,
        class_id: generateForm.class_id,
        semester: generateForm.semester,
        year: generateForm.year
      })
    } else if (generateForm.report_type === 'comparison') {
      result = await window.electronAPI.invoke('grades:generateComparison', {
        class_id: generateForm.class_id,
        subject: generateForm.subject,
        semester: generateForm.semester,
        year: generateForm.year
      })
    }
    
    if (result?.success) {
      ElMessage.success('报告生成成功')
      showGenerateDialog.value = false
      await loadReports()
    } else {
      ElMessage.error(result?.error || '生成报告失败')
    }
  } catch (error) {
    console.error('生成报告失败:', error)
    ElMessage.error('生成报告失败')
  } finally {
    generating.value = false
  }
}

const viewReport = async (report) => {
  try {
    const result = await window.electronAPI.invoke('grades:getReportDetail', report.id)
    if (result.success) {
      currentReport.value = result.data
      showDetailDialog.value = true
    } else {
      ElMessage.error(result.error || '加载报告详情失败')
    }
  } catch (error) {
    console.error('加载报告详情失败:', error)
    ElMessage.error('加载报告详情失败')
  }
}

const exportReport = async (report) => {
  try {
    const result = await window.electronAPI.invoke('grades:exportReport', report.id, 'html')
    if (result.success) {
      ElMessage.success(`报告已导出到: ${result.data.file_path}`)
    } else {
      ElMessage.error(result.error || '导出报告失败')
    }
  } catch (error) {
    console.error('导出报告失败:', error)
    ElMessage.error('导出报告失败')
  }
}

const deleteReport = async (report) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除报告 "${report.title}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const result = await window.electronAPI.invoke('grades:deleteReport', report.id)
    if (result.success) {
      ElMessage.success('删除成功')
      await loadReports()
    } else {
      ElMessage.error(result.error || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除报告失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const refreshReports = () => {
  loadReports()
}

const resetFilters = () => {
  filters.class_id = null
  filters.subject = null
  filters.report_type = null
  pagination.page = 1
  loadReports()
}

const resetGenerateForm = () => {
  generateForm.report_type = 'class_summary'
  generateForm.class_id = null
  generateForm.subject = null
  generateForm.exam_type = null
  generateForm.student_id = null
  generateForm.semester = '上学期'
  generateForm.year = new Date().getFullYear()
}

const handleSelectionChange = (selection) => {
  selectedReports.value = selection
}

const getReportTypeName = (type) => {
  const typeMap = {
    'class_summary': '班级总结',
    'individual': '个人报告',
    'student_detail': '学生详情',
    'subject_analysis': '学科分析',
    'comparison': '对比分析'
  }
  return typeMap[type] || type
}

const getReportTypeColor = (type) => {
  const colorMap = {
    'class_summary': 'primary',
    'individual': 'success',
    'student_detail': 'success',
    'subject_analysis': 'warning',
    'comparison': 'info'
  }
  return colorMap[type] || 'default'
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString()
}

// 生命周期
onMounted(async () => {
  await Promise.all([
    loadReports(),
    loadClasses(),
    loadSubjects(),
    loadExamTypes(),
    loadStudents()
  ])
})
</script>

<style scoped>
.grade-reports {
  padding: 20px;
}

.reports-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.reports-header h2 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.filters {
  background: #f5f7fa;
  padding: 20px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.reports-table {
  background: white;
  border-radius: 4px;
  overflow: hidden;
}

.pagination {
  display: flex;
  justify-content: center;
  padding: 20px;
}

.report-detail {
  max-height: 70vh;
  overflow-y: auto;
}

.class-summary,
.comparison {
  padding: 20px;
}
</style>