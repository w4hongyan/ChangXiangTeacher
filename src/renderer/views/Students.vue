<template>
  <Layout>
    <div class="students-container">
      <div class="page-header">
        <h1>学生管理</h1>
        <p>管理学生信息，包括基本信息、班级分配、学习情况等</p>
      </div>

      <div class="content">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>学生列表</span>
              <div class="header-actions">
                <el-button type="primary" @click="handleAdd">
                  <el-icon><Plus /></el-icon>
                  添加学生
                </el-button>
                <el-button type="success" @click="handleImport">
                  <el-icon><Upload /></el-icon>
                  导入
                </el-button>
                <el-button @click="handleExport">
                  <el-icon><Download /></el-icon>
                  导出
                </el-button>
              </div>
            </div>
          </template>

          <!-- 搜索和筛选 -->
          <div class="search-section">
            <el-row :gutter="20">
              <el-col :span="6">
                <el-input
                  v-model="searchParams.keyword"
                  placeholder="搜索姓名或学号"
                  clearable
                  @clear="handleSearch"
                  @keyup.enter="handleSearch"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
              </el-col>
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
                  v-model="searchParams.is_active"
                  placeholder="状态"
                  clearable
                  @change="handleSearch"
                >
                  <el-option label="启用" :value="true" />
                  <el-option label="禁用" :value="false" />
                </el-select>
              </el-col>
              <el-col :span="6">
                <el-button type="primary" @click="handleSearch">搜索</el-button>
                <el-button @click="handleReset">重置</el-button>
              </el-col>
            </el-row>
          </div>

          <!-- 批量操作 -->
          <div class="batch-actions" v-if="selectedStudents.length > 0">
            <el-button type="danger" @click="handleBatchDelete" :loading="loading">
              <el-icon><Delete /></el-icon>
              批量删除 ({{ selectedStudents.length }})
            </el-button>
          </div>

          <!-- 学生列表 -->
          <el-table
            :data="students"
            v-loading="loading"
            @selection-change="handleSelectionChange"
            style="width: 100%"
            row-key="id"
            v-if="students.length > 0"
          >
            <template #empty>
              <div>没有找到学生数据。</div>
            </template>
            <el-table-column type="selection" width="55" />
            <el-table-column prop="student_id" label="学号" width="120" />
            <el-table-column prop="name" label="姓名" width="100" />
            <el-table-column prop="gender" label="性别" width="60" />
            <el-table-column prop="class_name" label="班级" width="120" />
            <el-table-column prop="birth_date" label="出生日期" width="120" />
            <el-table-column prop="phone" label="联系电话" width="120" />
            <el-table-column prop="address" label="住址" min-width="200" show-overflow-tooltip />
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.is_active ? 'success' : 'danger'">
                  {{ row.is_active ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
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

      <!-- 学生表单 -->
      <StudentForm
        v-model="formVisible"
        :student="currentStudent"
        :classes="classes"
        @submit="handleFormSubmit"
      />

      <!-- 导入对话框 -->
      <el-dialog v-model="importVisible" title="导入学生" width="500px">
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
              请确保文件包含：学号、姓名、班级、性别、联系电话等列
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
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Upload, Download, Search, Edit, Delete, UploadFilled } from '@element-plus/icons-vue'
import Layout from './Layout.vue'
import StudentForm from '../components/StudentForm.vue'
import { useStudentStore } from '../stores/student'
import { useClassStore } from '../stores/class'
import type { StudentListItem, StudentFormData } from '../types/student'

const studentStore = useStudentStore()
const classStore = useClassStore()

const loading = ref(false)
const formVisible = ref(false)
const importVisible = ref(false)
const currentStudent = ref<StudentFormData & { id?: number }>()
const selectedStudents = ref<number[]>([])
const fileList = ref([])

const students = computed(() => {
  console.log('Students computed - raw value:', studentStore.students)
  return studentStore.students
})
const classes = computed(() => {
  console.log('Classes computed - raw value:', classStore.classes)
  return classStore.classes
})

const searchParams = reactive({
  keyword: '',
  class_id: undefined as number | undefined,
  is_active: true as boolean | undefined
})

const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: computed(() => studentStore.total)
})

// 获取数据
const loadData = async () => {
  console.log('loadData 开始执行...')
  loading.value = true
  try {
    console.log('调用 fetchStudents 和 fetchClasses...')
    await Promise.all([
      studentStore.fetchStudents({
        ...searchParams,
        page: pagination.currentPage,
        page_size: pagination.pageSize
      }),
      classStore.fetchClasses()
    ])
    console.log('数据加载完成 - students count:', students.value.length)
    console.log('数据加载完成 - classes count:', classes.value.length)
  } catch (error) {
    console.error('数据加载失败:', error)
  } finally {
    loading.value = false
    console.log('loadData 执行完成')
  }
}

// 搜索和筛选
const handleSearch = () => {
  pagination.currentPage = 1
  loadData()
}

const handleReset = () => {
  searchParams.keyword = ''
  searchParams.class_id = undefined
  searchParams.is_active = true
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
const handleSelectionChange = (selection: StudentListItem[]) => {
  selectedStudents.value = selection.map(item => item.id)
}

// 添加学生
const handleAdd = () => {
  currentStudent.value = undefined
  formVisible.value = true
}

// 编辑学生
const handleEdit = (student: StudentListItem) => {
  currentStudent.value = {
    id: student.id,
    student_id: student.student_id,
    name: student.name,
    gender: student.gender || undefined,
    birth_date: student.birth_date || undefined,
    phone: student.phone || undefined,
    parent_phone: student.parent_phone || undefined,
    email: student.email || undefined,
    address: student.address || undefined,
    class_id: student.class_id || 0
  }
  formVisible.value = true
}

// 删除学生
const handleDelete = async (student: StudentListItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除学生 "${student.name}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const result = await studentStore.deleteStudent(student.id)
    if (result.success) {
      ElMessage.success('删除成功')
      loadData()
    } else {
      ElMessage.error(result.error || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除学生失败:', error)
    }
  }
}

// 批量删除
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedStudents.value.length} 个学生吗？此操作不可恢复。`,
      '确认批量删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const result = await studentStore.batchDeleteStudents(selectedStudents.value)
    if (result.success) {
      ElMessage.success(`成功删除 ${result.data?.deleted_count || 0} 个学生`)
      selectedStudents.value = []
      loadData()
    } else {
      ElMessage.error(result.error || '批量删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除学生失败:', error)
    }
  }
}

// 表单提交
const handleFormSubmit = async (data: StudentFormData & { id?: number }) => {
  let result
  if (data.id) {
    result = await studentStore.updateStudent(data.id, data)
  } else {
    result = await studentStore.createStudent(data)
  }

  if (result.success) {
    ElMessage.success(data.id ? '更新成功' : '添加成功')
    // 添加学生成功后，重置到第一页以显示新添加的学生
    if (!data.id) {
      pagination.currentPage = 1
    }
    loadData()
  } else {
    ElMessage.error(result.error || '操作失败')
  }
}

// 导入导出
const handleImport = () => {
  importVisible.value = true
  fileList.value = []
}

const handleExport = async () => {
  try {
    const result = await studentStore.exportStudents(searchParams)
    if (result.success) {
      ElMessage.success('导出成功')
      // 这里可以添加文件下载逻辑
    } else {
      ElMessage.error(result.error || '导出失败')
    }
  } catch (error) {
    console.error('导出学生失败:', error)
    ElMessage.error('导出失败')
  }
}

const handleFileChange = (file: any) => {
  fileList.value = [file]
}

const handleImportSubmit = async () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('请选择要导入的文件')
    return
  }

  try {
    const result = await studentStore.importStudents(fileList.value[0].raw)
    if (result.success) {
      ElMessage.success(`成功导入 ${result.data?.success_count || 0} 个学生`)
      importVisible.value = false
      loadData()
    } else {
      ElMessage.error(result.error || '导入失败')
    }
  } catch (error) {
    console.error('导入学生失败:', error)
    ElMessage.error('导入失败')
  }
}

onMounted(() => {
  console.log('Students.vue onMounted 开始...')
  console.log('studentStore:', studentStore)
  console.log('classStore:', classStore)
  console.log('window.electronAPI:', window.electronAPI)
  loadData()
})
</script>

<style scoped>
.students-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  padding: 24px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
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

.upload-demo {
  width: 100%;
}

.upload-demo .el-upload-dragger {
  width: 100%;
}
</style>
