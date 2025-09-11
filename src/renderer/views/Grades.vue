<template>
  <Layout>
    <div class="grades-container">
      <div class="page-header">
        <h1>成绩管理</h1>
        <p>管理学生成绩，包括成绩录入、统计分析、趋势图表等功能</p>
      </div>

      <div class="content">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>成绩列表</span>
              <div class="header-actions">
                <el-button type="primary" @click="handleAdd">
                  <el-icon><Plus /></el-icon>
                  录入成绩
                </el-button>
                <el-dropdown @command="handleImportCommand" trigger="click">
                  <el-button type="success">
                    <el-icon><Upload /></el-icon>
                    导入
                    <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="template">
                        <el-icon><Document /></el-icon>
                        下载导入模板
                      </el-dropdown-item>
                      <el-dropdown-item command="import">
                        <el-icon><Upload /></el-icon>
                        导入成绩
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
                <el-button @click="handleExport">
                  <el-icon><Download /></el-icon>
                  导出成绩
                </el-button>
                <el-button @click="showStatsDialog = true">
                  <el-icon><DataAnalysis /></el-icon>
                  统计分析
                </el-button>
              </div>
            </div>
          </template>

          <!-- 搜索和筛选 -->
          <div class="search-section">
            <el-row :gutter="20">
              <el-col :span="4">
                <el-select
                  v-model="searchParams.class_id"
                  placeholder="选择班级"
                  clearable
                  @change="handleSearch"
                >
                  <el-option
                    v-for="classItem in classes"
                    :key="classItem.id"
                    :label="`${classItem.grade}${classItem.class_number}班`"
                    :value="classItem.id"
                  />
                </el-select>
              </el-col>
              <el-col :span="4">
                <el-select
                  v-model="searchParams.subject"
                  placeholder="选择学科"
                  clearable
                  filterable
                  @change="handleSearch"
                >
                  <el-option
                    v-for="subject in subjects"
                    :key="subject"
                    :label="subject"
                    :value="subject"
                  />
                </el-select>
              </el-col>
              <el-col :span="4">
                <el-select
                  v-model="searchParams.exam_type"
                  placeholder="考试类型"
                  clearable
                  filterable
                  @change="handleSearch"
                >
                  <el-option
                    v-for="examType in examTypes"
                    :key="examType"
                    :label="examType"
                    :value="examType"
                  />
                </el-select>
              </el-col>
              <el-col :span="3">
                <el-select
                  v-model="searchParams.semester"
                  placeholder="学期"
                  clearable
                  @change="handleSearch"
                >
                  <el-option label="上学期" value="上学期" />
                  <el-option label="下学期" value="下学期" />
                </el-select>
              </el-col>
              <el-col :span="3">
                <el-select
                  v-model="searchParams.year"
                  placeholder="学年"
                  clearable
                  @change="handleSearch"
                >
                  <el-option
                    v-for="year in availableYears"
                    :key="year"
                    :label="`${year}年`"
                    :value="year"
                  />
                </el-select>
              </el-col>
              <el-col :span="6">
                <el-button type="primary" @click="handleSearch">搜索</el-button>
                <el-button @click="handleReset">重置</el-button>
              </el-col>
            </el-row>
          </div>

          <!-- 批量操作 -->
          <div class="batch-actions" v-if="selectedGrades.length > 0">
            <el-button type="danger" @click="handleBatchDelete" :loading="loading">
              <el-icon><Delete /></el-icon>
              批量删除 ({{ selectedGrades.length }})
            </el-button>
          </div>

          <!-- 成绩列表 -->
          <el-table
            :data="grades"
            v-loading="loading"
            @selection-change="handleSelectionChange"
            style="width: 100%"
            row-key="id"
          >
            <template #empty>
              <div>没有找到成绩数据。</div>
            </template>
            <el-table-column type="selection" width="55" />
            <el-table-column prop="student_name" label="学生姓名" width="100" />
            <el-table-column prop="student_number" label="学号" width="120" />
            <el-table-column prop="class_name" label="班级" width="120" />
            <el-table-column prop="subject" label="学科" width="100" />
            <el-table-column prop="score" label="成绩" width="80">
              <template #default="{ row }">
                <el-tag
                  :type="getScoreType(row.score)"
                  effect="light"
                >
                  {{ row.score }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="exam_type" label="考试类型" width="120" />
            <el-table-column prop="exam_date" label="考试日期" width="120" />
            <el-table-column prop="semester" label="学期" width="80" />
            <el-table-column prop="year" label="学年" width="80" />
            <el-table-column prop="notes" label="备注" min-width="150" show-overflow-tooltip />
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link @click="handleEdit(row)">
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-button>
                <el-button type="danger" link @click="handleDelete(row)">
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination">
            <el-pagination
              v-model:current-page="pagination.currentPage"
              v-model:page-size="pagination.pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="pagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-card>
      </div>

      <!-- 成绩录入/编辑表单 -->
      <GradeForm
        v-model="formVisible"
        :grade="currentGrade"
        :classes="classes"
        :students="students"
        @submit="handleFormSubmit"
      />

      <!-- 统计分析对话框 -->
      <el-dialog v-model="showStatsDialog" title="成绩统计分析" width="95%" top="3vh">
        <el-tabs v-model="activeStatsTab" type="card">
          <el-tab-pane label="图表分析" name="charts">
            <GradeCharts
              :statsData="gradeStats"
              :classes="classes"
              :subjects="subjects"
            />
          </el-tab-pane>
          <el-tab-pane label="趋势分析" name="trend">
            <GradeTrendAnalysis
              :classes="classes"
              :students="students"
              :subjects="subjects"
            />
          </el-tab-pane>
          <el-tab-pane label="深度分析" name="deep">
            <GradeDeepAnalysis
              :classes="classes"
              :students="students"
              :subjects="subjects"
            />
          </el-tab-pane>
          <el-tab-pane label="对比分析" name="comparison">
            <GradeComparisonAnalysis
              :classes="classes"
              :students="students"
              :subjects="subjects"
            />
          </el-tab-pane>
          <el-tab-pane label="预测分析" name="prediction">
            <GradePredictionAnalysis
              :classes="classes"
              :students="students"
              :subjects="subjects"
            />
          </el-tab-pane>
          <el-tab-pane label="报告生成" name="report">
            <GradeReportGenerator
              :classes="classes"
              :subjects="subjects"
            />
          </el-tab-pane>
        </el-tabs>
      </el-dialog>
      
      <!-- 成绩导入对话框 -->
      <el-dialog v-model="importVisible" title="导入成绩" width="500px">
        <el-upload
          class="upload-demo"
          drag
          :auto-upload="false"
          :on-change="handleFileChange"
          :file-list="fileList"
          accept=".xlsx,.xls,.csv"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            拖拽文件到此处或 <em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              支持 .xlsx, .xls, .csv 格式文件
              <br />
              <span style="color: #409eff; cursor: pointer;" @click="handleDownloadTemplate()">
                点击这里下载导入模板
              </span>
              <br />
              请确保文件包含：学生ID、班级ID、学科、成绩、考试类型等列
            </div>
          </template>
        </el-upload>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="importVisible = false">取消</el-button>
            <el-button type="primary" @click="handleImportSubmit" :loading="loading">
              导入
            </el-button>
          </span>
        </template>
      </el-dialog>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download, DataAnalysis, Delete, Edit, Upload, ArrowDown, Document, UploadFilled } from '@element-plus/icons-vue'
import Layout from './Layout.vue'
import GradeForm from '../components/GradeForm.vue'
import GradeCharts from '../components/GradeCharts.vue'
import GradeTrendAnalysis from '../components/GradeTrendAnalysis.vue'
import GradeDeepAnalysis from '../components/GradeDeepAnalysis.vue'
import GradeComparisonAnalysis from '../components/GradeComparisonAnalysis.vue'
import GradePredictionAnalysis from '../components/GradePredictionAnalysis.vue'
import GradeReportGenerator from '../components/GradeReportGenerator.vue'
import { useGradeStore } from '../stores/grade'
import { useStudentStore } from '../stores/student'
import { useClassStore } from '../stores/class'
import type { GradeListItem, GradeFormData } from '../types/grade'
import * as XLSX from 'xlsx'

const gradeStore = useGradeStore()
const studentStore = useStudentStore()
const classStore = useClassStore()

const loading = ref(false)
const formVisible = ref(false)
const showStatsDialog = ref(false)
const importVisible = ref(false)
const activeStatsTab = ref('charts')
const currentGrade = ref<GradeFormData & { id?: number }>()
const selectedGrades = ref<number[]>([])
const fileList = ref<any[]>([])

const grades = computed(() => gradeStore.grades)
const gradeStats = computed(() => gradeStore.gradeStats)
const classes = computed(() => classStore.classes)
const students = computed(() => studentStore.students)
const subjects = computed(() => gradeStore.subjects)
const examTypes = computed(() => gradeStore.examTypes)

const searchParams = reactive({
  class_id: undefined as number | undefined,
  subject: undefined as string | undefined,
  exam_type: undefined as string | undefined,
  semester: undefined as string | undefined,
  year: undefined as number | undefined
})

const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: computed(() => gradeStore.total)
})

// 可用年份
const availableYears = computed(() => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let i = currentYear - 2; i <= currentYear + 1; i++) {
    years.push(i)
  }
  return years
})

// 根据分数获取标签类型
const getScoreType = (score: number) => {
  if (score >= 85) return 'success' // 优秀
  if (score >= 60) return 'warning' // 及格
  return 'danger' // 不及格
}

// 获取数据
const loadData = async () => {
  loading.value = true
  try {
    const cleanSearchParams = JSON.parse(JSON.stringify(searchParams))
    await Promise.all([
      gradeStore.fetchGrades({
        ...cleanSearchParams,
        page: pagination.currentPage,
        page_size: pagination.pageSize
      }),
      classStore.fetchClasses(),
      studentStore.fetchStudents({ page_size: 1000 }),
      gradeStore.fetchSubjects(),
      gradeStore.fetchExamTypes()
    ])
  } catch (error) {
    console.error('数据加载失败:', error)
  } finally {
    loading.value = false
  }
}

// 搜索和筛选
const handleSearch = () => {
  pagination.currentPage = 1
  loadData()
}

const handleReset = () => {
  searchParams.class_id = undefined
  searchParams.subject = undefined
  searchParams.exam_type = undefined
  searchParams.semester = undefined
  searchParams.year = undefined
  handleSearch()
}

// 分页
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  loadData()
}

const handleCurrentChange = (page: number) => {
  pagination.currentPage = page
  loadData()
}

// 表格选择
const handleSelectionChange = (selection: GradeListItem[]) => {
  selectedGrades.value = selection.map(item => item.id)
}

// 添加成绩
const handleAdd = () => {
  currentGrade.value = undefined
  
  // 使用 nextTick 确保DOM更新
  nextTick(() => {
    formVisible.value = true
  })
}

// 编辑成绩
const handleEdit = (grade: GradeListItem) => {
  currentGrade.value = {
    id: grade.id,
    student_id: grade.student_id,
    class_id: grade.class_id,
    subject: grade.subject,
    score: grade.score,
    exam_type: grade.exam_type,
    exam_date: grade.exam_date || undefined,
    semester: grade.semester || '上学期',
    year: grade.year || new Date().getFullYear(),
    notes: grade.notes || undefined
  }
  formVisible.value = true
}

// 删除成绩
const handleDelete = async (grade: GradeListItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除 "${grade.student_name}" 的 "${grade.subject}" 成绩吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const result = await gradeStore.deleteGrade(grade.id)
    if (result.success) {
      ElMessage.success('删除成功')
      loadData()
    } else {
      ElMessage.error(result.error || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除成绩失败:', error)
    }
  }
}

// 批量删除
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedGrades.value.length} 个成绩记录吗？此操作不可恢复。`,
      '确认批量删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const result = await gradeStore.batchDeleteGrades(selectedGrades.value)
    if (result.success) {
      ElMessage.success(`成功删除 ${result.data?.deleted_count || 0} 个成绩记录`)
      selectedGrades.value = []
      loadData()
    } else {
      ElMessage.error(result.error || '批量删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除成绩失败:', error)
    }
  }
}

// 表单提交
const handleFormSubmit = async (data: GradeFormData & { id?: number }) => {
  let result
  if (data.id) {
    result = await gradeStore.updateGrade(data.id, data)
  } else {
    result = await gradeStore.createGrade(data)
  }

  if (result.success) {
    ElMessage.success(data.id ? '更新成功' : '添加成功')
    formVisible.value = false
    if (!data.id) {
      pagination.currentPage = 1
    }
    loadData()
  } else {
    ElMessage.error(result.error || '操作失败')
  }
}

// 处理导入命令
const handleImportCommand = (command: string) => {
  switch (command) {
    case 'template':
      handleDownloadTemplate()
      break
    case 'import':
      handleImport()
      break
  }
}

// 下载导入模板
const handleDownloadTemplate = () => {
  try {
    // 创建模板数据
    const templateData = [
      [
        '学生ID',
        '班级ID',
        '学科',
        '成绩',
        '考试类型',
        '考试日期',
        '学期',
        '学年',
        '备注'
      ],
      [
        '1',
        '1',
        '数学',
        '85',
        '期中考试',
        '2024-05-15',
        '上学期',
        '2024',
        '表现优秀'
      ],
      [
        '2',
        '1',
        '语文',
        '92',
        '期中考试',
        '2024-05-16',
        '上学期',
        '2024',
        ''
      ],
      [
        '3',
        '2',
        '英语',
        '78',
        '月考',
        '2024-05-20',
        '上学期',
        '2024',
        '需要加强练习'
      ]
    ]
    
    // 创建工作簿
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet(templateData)
    
    // 设置列宽
    const colWidths = [
      { wch: 10 }, // 学生ID
      { wch: 10 }, // 班级ID
      { wch: 12 }, // 学科
      { wch: 8 },  // 成绩
      { wch: 15 }, // 考试类型
      { wch: 15 }, // 考试日期
      { wch: 10 }, // 学期
      { wch: 10 }, // 学年
      { wch: 20 }  // 备注
    ]
    worksheet['!cols'] = colWidths
    
    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, '成绩导入模板')
    
    // 生成文件名
    const filename = '成绩导入模板.xlsx'
    
    // 保存文件
    XLSX.writeFile(workbook, filename)
    
    ElMessage.success(`模板下载成功：${filename}`)
  } catch (error) {
    console.error('下载模板失败:', error)
    ElMessage.error('下载模板失败')
  }
}

// 导入成绩
const handleImport = () => {
  importVisible.value = true
  fileList.value = []
}

// 处理文件变化
const handleFileChange = (file: any) => {
  fileList.value = [file]
}

// 提交导入
const handleImportSubmit = async () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('请选择要导入的文件')
    return
  }

  try {
    const file = fileList.value[0].raw
    
    // 读取Excel文件
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
    
    // 跳过表头行
    const rows = data.slice(1) as any[][]
    
    // 转换为成绩数据格式
    const gradesData = rows
      .filter(row => row.length >= 5 && row[0] && row[1] && row[2] && row[3] && row[4]) // 过滤空行和缺少必填字段的行
      .map(row => ({
        student_id: Number(row[0]) || 0,
        class_id: Number(row[1]) || 0,
        subject: String(row[2] || '').trim(),
        score: Number(row[3]) || 0,
        exam_type: String(row[4] || '').trim(),
        exam_date: row[5] ? String(row[5]).trim() : undefined,
        semester: row[6] ? String(row[6]).trim() : '上学期',
        year: row[7] ? Number(row[7]) : new Date().getFullYear(),
        notes: row[8] ? String(row[8]).trim() : undefined
      }))
    
    if (gradesData.length === 0) {
      ElMessage.warning('未找到有效的成绩数据')
      return
    }
    
    // 调用导入API
    const result = await gradeStore.importGrades(gradesData)
    if (result.success) {
      const { success_count, error_count, errors } = result.data
      let message = `成功导入 ${success_count} 条成绩记录`
      if (error_count > 0) {
        message += `，${error_count} 条失败`
        if (errors && errors.length > 0) {
          message += `\n错误信息：\n${errors.slice(0, 3).join('\n')}`
          if (errors.length > 3) {
            message += `\n...及其他 ${errors.length - 3} 个错误`
          }
        }
      }
      ElMessage.success(message)
      importVisible.value = false
      loadData()
    } else {
      ElMessage.error(result.error || '导入失败')
    }
  } catch (error) {
    console.error('导入成绩失败:', error)
    ElMessage.error('导入失败')
  }
}

// 导出成绩
const handleExport = async () => {
  try {
    const cleanSearchParams = JSON.parse(JSON.stringify(searchParams))
    const result = await gradeStore.exportGrades(cleanSearchParams)
    
    if (result.success && result.data) {
      // 根据用户偏好，仅显示有成绩记录的数据，并添加美化样式
      const exportData = result.data.map((grade: any) => ([
        grade.student_name || '',
        grade.student_number || '',
        grade.class_name || '',
        grade.subject || '',
        grade.score || '',
        grade.exam_type || '',
        grade.exam_date || '',
        grade.semester || '',
        grade.year || '',
        grade.notes || ''
      ]))
      
      // 添加表头
      const headers = [
        '学生姓名',
        '学号',
        '班级',
        '学科',
        '成绩',
        '考试类型',
        '考试日期',
        '学期',
        '学年',
        '备注'
      ]
      const dataWithHeaders = [headers, ...exportData]
      
      // 创建工作簿
      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.aoa_to_sheet(dataWithHeaders)
      
      // 设置列宽
      const colWidths = [
        { wch: 12 }, // 学生姓名
        { wch: 15 }, // 学号
        { wch: 12 }, // 班级
        { wch: 12 }, // 学科
        { wch: 8 },  // 成绩
        { wch: 15 }, // 考试类型
        { wch: 15 }, // 考试日期
        { wch: 10 }, // 学期
        { wch: 8 },  // 学年
        { wch: 20 }  // 备注
      ]
      worksheet['!cols'] = colWidths
      
      // 设置表头样式（简单的样式设置）
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
      
      // 添加边框和背景色（通过单元格样式）
      for (let C = range.s.c; C <= range.e.c; ++C) {
        for (let R = range.s.r; R <= range.e.r; ++R) {
          const cell_address = XLSX.utils.encode_cell({ c: C, r: R })
          if (!worksheet[cell_address]) continue
          
          // 设置边框
          if (!worksheet[cell_address].s) worksheet[cell_address].s = {}
          worksheet[cell_address].s.border = {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          }
          
          // 表头样式
          if (R === 0) {
            worksheet[cell_address].s.fill = {
              fgColor: { rgb: 'E6F3FF' }
            }
            worksheet[cell_address].s.font = {
              bold: true
            }
            worksheet[cell_address].s.alignment = {
              horizontal: 'center',
              vertical: 'center'
            }
          } else {
            // 交替行色
            if (R % 2 === 0) {
              worksheet[cell_address].s.fill = {
                fgColor: { rgb: 'F8F9FA' }
              }
            }
            
            // 数据对齐
            worksheet[cell_address].s.alignment = {
              horizontal: C === 4 ? 'center' : 'left', // 成绩列居中
              vertical: 'center'
            }
          }
        }
      }
      
      // 添加工作表到工作簿
      XLSX.utils.book_append_sheet(workbook, worksheet, '成绩列表')
      
      // 生成文件名
      const now = new Date()
      const dateStr = now.toISOString().slice(0, 10)
      const filename = `成绩列表_${dateStr}.xlsx`
      
      // 保存文件
      XLSX.writeFile(workbook, filename)
      
      ElMessage.success(`导出成功：${filename} (共 ${result.data.length} 条记录)`)
    } else {
      ElMessage.error(result.error || '导出失败')
    }
  } catch (error) {
    console.error('导出成绩失败:', error)
    ElMessage.error('导出失败')
  }
}

// 加载统计数据
const loadStats = async () => {
  const cleanSearchParams = JSON.parse(JSON.stringify(searchParams))
  await gradeStore.fetchGradeStats(cleanSearchParams)
}

// 监听统计对话框变化
watch(showStatsDialog, async (newValue) => {
  if (newValue) {
    await loadStats()
  }
})

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.grades-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  padding: 24px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.page-header h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
}

.page-header p {
  margin: 0;
  opacity: 0.9;
  font-size: 16px;
}

.content {
  flex: 1;
  padding: 20px;
  background: #f5f7fa;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.search-section {
  margin-bottom: 16px;
}

.batch-actions {
  margin-bottom: 16px;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.stats-container {
  min-height: 400px;
}

.coming-soon {
  padding: 40px 0;
}
</style>