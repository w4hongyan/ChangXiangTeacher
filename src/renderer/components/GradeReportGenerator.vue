<template>
  <div class="grade-report-generator">
    <!-- 报告设置面板 -->
    <el-card class="setting-panel" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>报告生成设置</span>
          <el-button type="primary" @click="generateReport" :loading="generating">
            <el-icon><Document /></el-icon>
            生成报告
          </el-button>
        </div>
      </template>

      <el-form :model="reportConfig" label-width="100px" class="report-form">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="报告类型">
              <el-select v-model="reportConfig.type" placeholder="请选择报告类型" style="width: 100%">
                <el-option label="班级成绩报告" value="class" />
                <el-option label="学科成绩报告" value="subject" />
                <el-option label="学生个人报告" value="student" />
                <el-option label="考试分析报告" value="exam" />
                <el-option label="综合分析报告" value="comprehensive" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="报告格式">
              <el-select v-model="reportConfig.format" placeholder="请选择报告格式" style="width: 100%">
                <el-option label="PDF文档" value="pdf" />
                <el-option label="Word文档" value="docx" />
                <el-option label="Excel表格" value="xlsx" />
                <el-option label="HTML网页" value="html" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="时间范围">
              <el-date-picker
                v-model="reportConfig.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="班级选择">
              <el-select v-model="reportConfig.classIds" multiple placeholder="请选择班级" style="width: 100%">
                <el-option
                  v-for="cls in classes"
                  :key="cls.id"
                  :label="cls.name"
                  :value="cls.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="学科选择">
              <el-select v-model="reportConfig.subjectIds" multiple placeholder="请选择学科" style="width: 100%">
                <el-option
                  v-for="subject in subjects"
                  :key="subject.id"
                  :label="subject.name"
                  :value="subject.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="考试类型">
              <el-select v-model="reportConfig.examTypes" multiple placeholder="请选择考试类型" style="width: 100%">
                <el-option label="月考" value="monthly" />
                <el-option label="期中考试" value="midterm" />
                <el-option label="期末考试" value="final" />
                <el-option label="模拟考试" value="mock" />
                <el-option label="单元测试" value="unit" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20" v-if="reportConfig.type === 'student'">
          <el-col :span="12">
            <el-form-item label="学生选择">
              <el-select v-model="reportConfig.studentId" placeholder="请选择学生" style="width: 100%" filterable>
                <el-option
                  v-for="student in filteredStudents"
                  :key="student.id"
                  :label="`${student.name} (${student.student_id})`"
                  :value="student.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="报告内容">
          <el-checkbox-group v-model="reportConfig.contents">
            <el-checkbox label="basic" border>基础统计</el-checkbox>
            <el-checkbox label="charts" border>图表分析</el-checkbox>
            <el-checkbox label="ranking" border>排名信息</el-checkbox>
            <el-checkbox label="trend" border>趋势分析</el-checkbox>
            <el-checkbox label="comparison" border>对比分析</el-checkbox>
            <el-checkbox label="suggestions" border>改进建议</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="报告模板">
          <el-radio-group v-model="reportConfig.template">
            <el-radio label="standard" border>标准模板</el-radio>
            <el-radio label="detailed" border>详细模板</el-radio>
            <el-radio label="summary" border>摘要模板</el-radio>
            <el-radio label="custom" border>自定义模板</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 报告预览 -->
    <el-card v-if="reportPreview" class="preview-panel" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>报告预览</span>
          <div>
            <el-button @click="downloadReport" :disabled="!reportGenerated">
              <el-icon><Download /></el-icon>
              下载报告
            </el-button>
            <el-button @click="printReport" :disabled="!reportGenerated">
              <el-icon><Printer /></el-icon>
              打印报告
            </el-button>
          </div>
        </div>
      </template>

      <div class="report-preview" v-html="reportPreview"></div>
    </el-card>

    <!-- 历史报告 -->
    <el-card class="history-panel" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>历史报告</span>
          <el-button @click="refreshHistory">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>

      <el-table :data="reportHistory" style="width: 100%">
        <el-table-column prop="name" label="报告名称" />
        <el-table-column prop="type" label="报告类型">
          <template #default="{ row }">
            <el-tag :type="getReportTypeTag(row.type)">{{ getReportTypeName(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="format" label="格式" width="80" />
        <el-table-column prop="createTime" label="生成时间" width="180" />
        <el-table-column prop="size" label="文件大小" width="100" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="previewHistoryReport(row)">
              <el-icon><View /></el-icon>
              预览
            </el-button>
            <el-button size="small" @click="downloadHistoryReport(row)">
              <el-icon><Download /></el-icon>
              下载
            </el-button>
            <el-button size="small" type="danger" @click="deleteHistoryReport(row)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="historyPagination.page"
        v-model:page-size="historyPagination.size"
        :total="historyPagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        class="pagination"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, Download, Printer, Refresh, View, Delete } from '@element-plus/icons-vue'

interface Class {
  id: string
  name: string
}

interface Subject {
  id: string
  name: string
}

interface ReportConfig {
  type: string
  format: string
  dateRange: [Date, Date] | null
  classIds: string[]
  subjectIds: string[]
  examTypes: string[]
  contents: string[]
  template: string
  studentId?: string
}

interface ReportHistoryItem {
  id: string
  name: string
  type: string
  format: string
  createTime: string
  size: string
  filePath: string
}

interface Student {
  id: string
  name: string
  student_id: string
  class_id: string
}

const props = defineProps<{
  classes: Class[]
  subjects: Subject[]
  students?: Student[]
}>()

// 响应式数据
const generating = ref(false)
const reportGenerated = ref(false)
const reportPreview = ref('')

const reportConfig = reactive<ReportConfig>({
  type: 'class',
  format: 'pdf',
  dateRange: null,
  classIds: [],
  subjectIds: [],
  examTypes: [],
  contents: ['basic', 'charts'],
  template: 'standard'
})

const reportHistory = ref<ReportHistoryItem[]>([])
const historyPagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

// 计算属性
const canGenerate = computed(() => {
  const baseValid = reportConfig.type && reportConfig.format && reportConfig.contents.length > 0
  if (reportConfig.type === 'student') {
    return baseValid && reportConfig.studentId && reportConfig.classIds.length > 0
  }
  return baseValid
})

const filteredStudents = computed(() => {
  if (!props.students || reportConfig.classIds.length === 0) {
    return []
  }
  return props.students.filter(student => 
    reportConfig.classIds.includes(student.class_id)
  )
})

// 方法
const generateReport = async () => {
  if (!canGenerate.value) {
    ElMessage.warning('请完善报告配置信息')
    return
  }

  generating.value = true
  try {
    let result
    
    if (reportConfig.type === 'class') {
      // 生成班级成绩报告
      const params = {
        class_id: reportConfig.classIds[0],
        subject: reportConfig.subjectIds.length > 0 ? reportConfig.subjectIds[0] : null,
        exam_type: reportConfig.examTypes[0] || 'final',
        semester: '上学期',
        year: new Date().getFullYear()
      }
      
      result = await window.electronAPI.invoke('grades:generateClassReport', params)
      if (result && result.success) {
        reportPreview.value = generateClassReportPreview(result.data.analysis)
      } else {
        throw new Error(result?.error || '班级报告生成失败')
      }
    } else if (reportConfig.type === 'student') {
      // 生成学生个人报告
      const params = {
        student_id: reportConfig.studentId,
        class_id: reportConfig.classIds[0],
        semester: '上学期',
        year: new Date().getFullYear()
      }
      
      result = await window.electronAPI.invoke('grades:generateStudentReport', params)
      if (result && result.success) {
        reportPreview.value = generateStudentReportPreview(result.data.analysis)
      } else {
        throw new Error(result?.error || '学生报告生成失败')
      }
    } else {
      // 其他类型使用模拟数据
      reportPreview.value = generateReportPreview()
    }
    
    reportGenerated.value = true
    ElMessage.success('报告生成成功')
  } catch (error) {
    console.error('生成报告失败:', error)
    ElMessage.error(`生成报告失败: ${error.message}`)
  } finally {
    generating.value = false
  }
}

const generateReportPreview = (): string => {
  const reportTypeName = getReportTypeName(reportConfig.type)
  const currentDate = new Date().toLocaleDateString('zh-CN')
  
  return `
    <div class="report-content">
      <div class="report-header">
        <h1>${reportTypeName}</h1>
        <p class="report-date">生成日期: ${currentDate}</p>
      </div>
      
      <div class="report-summary">
        <h2>报告摘要</h2>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="label">报告类型:</span>
            <span class="value">${reportTypeName}</span>
          </div>
          <div class="summary-item">
            <span class="label">涉及班级:</span>
            <span class="value">${reportConfig.classIds.length}个班级</span>
          </div>
          <div class="summary-item">
            <span class="label">涉及学科:</span>
            <span class="value">${reportConfig.subjectIds.length}个学科</span>
          </div>
          <div class="summary-item">
            <span class="label">数据范围:</span>
            <span class="value">近30天</span>
          </div>
        </div>
      </div>
      
      ${reportConfig.contents.includes('basic') ? `
        <div class="report-section">
          <h2>基础统计</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">85.6</div>
              <div class="stat-label">平均分</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">92.3</div>
              <div class="stat-label">最高分</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">68.5</div>
              <div class="stat-label">最低分</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">78%</div>
              <div class="stat-label">及格率</div>
            </div>
          </div>
        </div>
      ` : ''}
      
      ${reportConfig.contents.includes('charts') ? `
        <div class="report-section">
          <h2>图表分析</h2>
          <div class="chart-placeholder">
            <p>📊 成绩分布图表</p>
            <p>📈 趋势分析图表</p>
            <p>📉 对比分析图表</p>
          </div>
        </div>
      ` : ''}
      
      ${reportConfig.contents.includes('suggestions') ? `
        <div class="report-section">
          <h2>改进建议</h2>
          <ul class="suggestions-list">
            <li>加强基础知识的巩固练习</li>
            <li>针对薄弱环节进行专项训练</li>
            <li>提高学生的应试技巧</li>
            <li>增加课堂互动和讨论</li>
          </ul>
        </div>
      ` : ''}
    </div>
  `
}

// 生成班级报告预览
const generateClassReportPreview = (analysis: any): string => {
  const currentDate = new Date().toLocaleDateString('zh-CN')
  const stats = analysis.statistics
  
  return `
    <div class="report-content">
      <div class="report-header">
        <h1>${analysis.class_name} ${analysis.subject} ${analysis.exam_type} 成绩报告</h1>
        <p class="report-date">生成日期: ${currentDate}</p>
      </div>
      
      <div class="report-summary">
        <h2>班级概况</h2>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="label">班级名称:</span>
            <span class="value">${analysis.class_name}</span>
          </div>
          <div class="summary-item">
            <span class="label">考试科目:</span>
            <span class="value">${analysis.subject}</span>
          </div>
          <div class="summary-item">
            <span class="label">考试类型:</span>
            <span class="value">${analysis.exam_type}</span>
          </div>
          <div class="summary-item">
            <span class="label">学期:</span>
            <span class="value">${analysis.semester} ${analysis.year}</span>
          </div>
        </div>
      </div>
      
      <div class="report-section">
        <h2>成绩统计</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${stats.total_students}</div>
            <div class="stat-label">参考人数</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.average_score}</div>
            <div class="stat-label">平均分</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.max_score}</div>
            <div class="stat-label">最高分</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.min_score}</div>
            <div class="stat-label">最低分</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.pass_rate}%</div>
            <div class="stat-label">及格率</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.excellent_rate}%</div>
            <div class="stat-label">优秀率</div>
          </div>
        </div>
      </div>
      
      <div class="report-section">
        <h2>优秀学生</h2>
        <div class="student-list">
          ${analysis.top_students.map((student: any, index: number) => `
            <div class="student-item">
              <span class="rank">${index + 1}</span>
              <span class="name">${student.student_name}</span>
              <span class="score">${student.score}分</span>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="report-section">
        <h2>需要关注的学生</h2>
        <div class="student-list">
          ${analysis.improvement_needed.map((student: any) => `
            <div class="student-item attention">
              <span class="name">${student.student_name}</span>
              <span class="score">${student.score}分</span>
              <span class="suggestion">${student.suggestions}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `
}

// 生成学生个人报告预览
const generateStudentReportPreview = (analysis: any): string => {
  const currentDate = new Date().toLocaleDateString('zh-CN')
  
  return `
    <div class="report-content">
      <div class="report-header">
        <h1>${analysis.student_name} 个人成绩报告</h1>
        <p class="report-date">生成日期: ${currentDate}</p>
      </div>
      
      <div class="report-summary">
        <h2>学生信息</h2>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="label">学生姓名:</span>
            <span class="value">${analysis.student_name}</span>
          </div>
          <div class="summary-item">
            <span class="label">学号:</span>
            <span class="value">${analysis.student_number}</span>
          </div>
          <div class="summary-item">
            <span class="label">班级:</span>
            <span class="value">${analysis.class_name}</span>
          </div>
          <div class="summary-item">
            <span class="label">学期:</span>
            <span class="value">${analysis.semester} ${analysis.year}</span>
          </div>
        </div>
      </div>
      
      <div class="report-section">
        <h2>各科成绩</h2>
        <div class="subject-grades">
          ${analysis.subject_grades.map((grade: any) => `
            <div class="grade-item">
              <div class="subject">${grade.subject}</div>
              <div class="score ${grade.score >= 90 ? 'excellent' : grade.score >= 60 ? 'pass' : 'fail'}">${grade.score}分</div>
              <div class="rank">班级第${grade.class_rank}名</div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="report-section">
        <h2>成绩分析</h2>
        <div class="analysis-content">
          <p><strong>总体表现:</strong> ${analysis.overall_performance}</p>
          <p><strong>优势科目:</strong> ${analysis.strengths.join('、')}</p>
          <p><strong>薄弱科目:</strong> ${analysis.weaknesses.join('、')}</p>
        </div>
      </div>
      
      <div class="report-section">
        <h2>改进建议</h2>
        <ul class="suggestions-list">
          ${analysis.suggestions.map((suggestion: string) => `
            <li>${suggestion}</li>
          `).join('')}
        </ul>
      </div>
    </div>
  `
}

const downloadReport = async () => {
  try {
    // 模拟下载
    ElMessage.success('报告下载成功')
    
    // 添加到历史记录
    const newReport: ReportHistoryItem = {
      id: Date.now().toString(),
      name: `${getReportTypeName(reportConfig.type)}_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}`,
      type: reportConfig.type,
      format: reportConfig.format.toUpperCase(),
      createTime: new Date().toLocaleString('zh-CN'),
      size: '2.5MB',
      filePath: '/reports/example.pdf'
    }
    
    reportHistory.value.unshift(newReport)
    historyPagination.total++
  } catch (error) {
    console.error('下载报告失败:', error)
    ElMessage.error('下载报告失败')
  }
}

const printReport = () => {
  if (reportPreview.value) {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>成绩报告</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .report-header { text-align: center; margin-bottom: 30px; }
              .report-section { margin-bottom: 30px; }
              .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
              .stat-card { text-align: center; padding: 20px; border: 1px solid #ddd; }
              .stat-value { font-size: 24px; font-weight: bold; color: #409eff; }
              .stat-label { margin-top: 5px; color: #666; }
            </style>
          </head>
          <body>${reportPreview.value}</body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }
}

const refreshHistory = async () => {
  try {
    // 模拟刷新历史记录
    await loadReportHistory()
    ElMessage.success('历史记录刷新成功')
  } catch (error) {
    console.error('刷新历史记录失败:', error)
    ElMessage.error('刷新历史记录失败')
  }
}

const loadReportHistory = async () => {
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟历史数据
    const mockHistory: ReportHistoryItem[] = [
      {
        id: '1',
        name: '班级成绩报告_2024-01-15',
        type: 'class',
        format: 'PDF',
        createTime: '2024-01-15 14:30:25',
        size: '2.1MB',
        filePath: '/reports/class_2024-01-15.pdf'
      },
      {
        id: '2',
        name: '学科分析报告_2024-01-10',
        type: 'subject',
        format: 'XLSX',
        createTime: '2024-01-10 09:15:42',
        size: '1.8MB',
        filePath: '/reports/subject_2024-01-10.xlsx'
      }
    ]
    
    reportHistory.value = mockHistory
    historyPagination.total = mockHistory.length
  } catch (error) {
    console.error('加载历史记录失败:', error)
  }
}

const previewHistoryReport = (report: ReportHistoryItem) => {
  ElMessage.info(`预览报告: ${report.name}`)
}

const downloadHistoryReport = (report: ReportHistoryItem) => {
  ElMessage.success(`下载报告: ${report.name}`)
}

const deleteHistoryReport = async (report: ReportHistoryItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除报告 "${report.name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const index = reportHistory.value.findIndex(item => item.id === report.id)
    if (index > -1) {
      reportHistory.value.splice(index, 1)
      historyPagination.total--
      ElMessage.success('删除成功')
    }
  } catch {
    // 用户取消删除
  }
}

const getReportTypeName = (type: string): string => {
  const typeMap: Record<string, string> = {
    class: '班级成绩报告',
    subject: '学科成绩报告',
    student: '学生个人报告',
    exam: '考试分析报告',
    comprehensive: '综合分析报告'
  }
  return typeMap[type] || type
}

const getReportTypeTag = (type: string): string => {
  const tagMap: Record<string, string> = {
    class: 'primary',
    subject: 'success',
    student: 'info',
    exam: 'warning',
    comprehensive: 'danger'
  }
  return tagMap[type] || 'info'
}

// 生命周期
onMounted(() => {
  loadReportHistory()
})
</script>

<style scoped>
.grade-report-generator {
  padding: 20px;
}

.setting-panel,
.preview-panel,
.history-panel {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.report-form {
  margin-top: 20px;
}

.report-preview {
  max-height: 600px;
  overflow-y: auto;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 20px;
  background: #fff;
}

.report-content {
  font-family: 'Microsoft YaHei', sans-serif;
}

.report-header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #409eff;
}

.report-header h1 {
  color: #409eff;
  margin-bottom: 10px;
}

.report-date {
  color: #666;
  font-size: 14px;
}

.report-section {
  margin-bottom: 30px;
}

.report-section h2 {
  color: #333;
  border-left: 4px solid #409eff;
  padding-left: 10px;
  margin-bottom: 20px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
}

.summary-item .label {
  font-weight: bold;
  color: #666;
}

.summary-item .value {
  color: #409eff;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.stat-card {
  text-align: center;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 5px;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

.chart-placeholder {
  text-align: center;
  padding: 40px;
  background: #f5f7fa;
  border-radius: 8px;
  border: 2px dashed #d3d3d3;
}

.chart-placeholder p {
  margin: 10px 0;
  color: #666;
  font-size: 16px;
}

.suggestions-list {
  list-style: none;
  padding: 0;
}

.suggestions-list li {
  padding: 10px;
  margin-bottom: 10px;
  background: #f0f9ff;
  border-left: 4px solid #409eff;
  border-radius: 4px;
}

/* 学生列表样式 */
.student-list .student-item {
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  background: #f8f9fa;
  border-radius: 6px;
}

.student-list .student-item .rank {
  width: 30px;
  height: 30px;
  background: #409eff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 12px;
}

.student-list .student-item .name {
  flex: 1;
  font-weight: 500;
}

.student-list .student-item .score {
  font-weight: bold;
  color: #409eff;
}

.student-list .student-item .suggestion {
  margin-left: 12px;
  color: #666;
  font-size: 12px;
}

.student-list .student-item.attention {
  background: #fef0f0;
  border-left: 4px solid #f56c6c;
}

.student-list .student-item.attention .score {
  color: #f56c6c;
}

/* 学生个人报告样式 */
.subject-grades .grade-item {
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  background: #f8f9fa;
  border-radius: 6px;
}

.subject-grades .grade-item .subject {
  flex: 1;
  font-weight: 500;
}

.subject-grades .grade-item .score {
  margin: 0 12px;
  font-weight: bold;
  padding: 4px 8px;
  border-radius: 4px;
}

.subject-grades .grade-item .score.excellent {
  background: #f0f9ff;
  color: #1890ff;
}

.subject-grades .grade-item .score.pass {
  background: #f6ffed;
  color: #52c41a;
}

.subject-grades .grade-item .score.fail {
  background: #fff2f0;
  color: #ff4d4f;
}

.subject-grades .grade-item .rank {
  color: #666;
  font-size: 12px;
}

.analysis-content p {
  margin-bottom: 12px;
  line-height: 1.6;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .summary-grid,
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .card-header {
    flex-direction: column;
    gap: 10px;
  }
}
</style>