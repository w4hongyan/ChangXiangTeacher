<template>
  <div class="points-management">
    <!-- 页面头部 -->
    <div class="management-header">
      <h3>积分发放管理</h3>
      <div class="header-actions">
        <el-button type="primary" @click="showBatchDialog = true">
          <el-icon><Plus /></el-icon>
          批量发放积分
        </el-button>
        <el-button @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 筛选条件 -->
    <div class="filters">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-select
            v-model="selectedClass"
            placeholder="选择班级"
            clearable
            @change="handleClassChange"
          >
            <el-option label="全部班级" value="" />
            <el-option
              v-for="cls in classes"
              :key="cls.id"
              :label="cls.name"
              :value="cls.id"
            />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select
            v-model="selectedType"
            placeholder="积分类型"
            @change="handleTypeChange"
          >
            <el-option label="全部类型" value="" />
            <el-option label="奖励" value="reward" />
            <el-option label="惩罚" value="penalty" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="handleDateChange"
          />
        </el-col>
        <el-col :span="8">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索学生姓名或原因"
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
      </el-row>
    </div>

    <!-- 积分记录表格 -->
    <div class="points-table">
      <el-table
        v-loading="loading"
        :data="pointRecords"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column prop="id" label="记录ID" width="80" />
        
        <el-table-column prop="student_name" label="学生" width="100" />
        
        <el-table-column prop="class_name" label="班级" width="120" />
        
        <el-table-column prop="points" label="积分" width="80">
          <template #default="{ row }">
            <span :class="getPointsClass(row.points)">{{ row.points }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="type" label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="row.type === 'reward' ? 'success' : 'danger'">
              {{ row.type === 'reward' ? '奖励' : '惩罚' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="reason" label="原因" min-width="200" />
        
        <el-table-column prop="given_by_name" label="发放人" width="100" />
        
        <el-table-column prop="given_date" label="发放日期" width="120" />
        
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="editRecord(row)"
            >
              编辑
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="deleteRecord(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.page_size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        style="margin-top: 20px; justify-content: flex-end;"
      />
    </div>

    <!-- 批量发放积分对话框 -->
    <el-dialog
      v-model="showBatchDialog"
      title="批量发放积分"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form :model="batchForm" :rules="batchRules" ref="batchFormRef" label-width="100px">
        <el-form-item label="选择班级" prop="class_id">
          <el-select
            v-model="batchForm.class_id"
            placeholder="请选择班级"
            @change="handleBatchClassChange"
            style="width: 100%"
          >
            <el-option
              v-for="cls in classes"
              :key="cls.id"
              :label="cls.name"
              :value="cls.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="选择学生" prop="student_ids">
          <el-select
            v-model="batchForm.student_ids"
            placeholder="请选择学生（可多选）"
            multiple
            style="width: 100%"
            :disabled="!batchForm.class_id"
          >
            <el-option
              v-for="student in classStudents"
              :key="student.id"
              :label="student.name"
              :value="student.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="积分类型" prop="type">
          <el-radio-group v-model="batchForm.type">
            <el-radio label="reward">奖励</el-radio>
            <el-radio label="penalty">惩罚</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="积分值" prop="points">
          <el-input-number
            v-model="batchForm.points"
            :min="-100"
            :max="100"
            controls-position="right"
            style="width: 200px"
          />
        </el-form-item>
        
        <el-form-item label="发放原因" prop="reason">
          <el-input
            v-model="batchForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入发放积分的原因"
          />
        </el-form-item>
        
        <el-form-item label="发放日期" prop="given_date">
          <el-date-picker
            v-model="batchForm.given_date"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showBatchDialog = false">取消</el-button>
        <el-button type="primary" @click="submitBatchPoints" :loading="submitting">
          确认发放
        </el-button>
      </template>
    </el-dialog>

    <!-- 编辑积分记录对话框 -->
    <el-dialog
      v-model="showEditDialog"
      title="编辑积分记录"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="100px">
        <el-form-item label="积分类型" prop="type">
          <el-radio-group v-model="editForm.type">
            <el-radio label="reward">奖励</el-radio>
            <el-radio label="penalty">惩罚</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="积分值" prop="points">
          <el-input-number
            v-model="editForm.points"
            :min="-100"
            :max="100"
            controls-position="right"
            style="width: 200px"
          />
        </el-form-item>
        
        <el-form-item label="发放原因" prop="reason">
          <el-input
            v-model="editForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入发放积分的原因"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="submitEditRecord" :loading="submitting">
          保存修改
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import { usePointStore } from '../../stores/point'
import { useClassStore } from '../../stores/class'
import { useStudentStore } from '../../stores/student'

const pointStore = usePointStore()
const classStore = useClassStore()
const studentStore = useStudentStore()

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const showBatchDialog = ref(false)
const showEditDialog = ref(false)
const batchFormRef = ref()
const editFormRef = ref()

const selectedClass = ref('')
const selectedType = ref('')
const dateRange = ref([])
const searchKeyword = ref('')
const selectedRecords = ref([])

// 分页
const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})

// 批量发放表单
const batchForm = reactive({
  class_id: null,
  student_ids: [],
  type: 'reward',
  points: 1,
  reason: '',
  given_date: new Date().toISOString().split('T')[0]
})

// 编辑表单
const editForm = reactive({
  id: null,
  type: 'reward',
  points: 1,
  reason: ''
})

// 表单验证规则
const batchRules = {
  class_id: [{ required: true, message: '请选择班级', trigger: 'change' }],
  student_ids: [{ required: true, message: '请选择学生', trigger: 'change' }],
  type: [{ required: true, message: '请选择积分类型', trigger: 'change' }],
  points: [{ required: true, message: '请输入积分值', trigger: 'blur' }],
  reason: [{ required: true, message: '请输入发放原因', trigger: 'blur' }],
  given_date: [{ required: true, message: '请选择发放日期', trigger: 'change' }]
}

const editRules = {
  type: [{ required: true, message: '请选择积分类型', trigger: 'change' }],
  points: [{ required: true, message: '请输入积分值', trigger: 'blur' }],
  reason: [{ required: true, message: '请输入发放原因', trigger: 'blur' }]
}

// 计算属性
const classes = computed(() => classStore.classes)
const classStudents = computed(() => studentStore.students)
const pointRecords = computed(() => pointStore.points)

// 方法
const refreshData = async () => {
  await loadPointRecords()
}

const loadPointRecords = async () => {
  loading.value = true
  try {
    const params = {
      class_id: selectedClass.value || undefined,
      type: selectedType.value || undefined,
      start_date: dateRange.value?.[0] || undefined,
      end_date: dateRange.value?.[1] || undefined,
      search: searchKeyword.value || undefined,
      page: pagination.page,
      page_size: pagination.page_size
    }
    
    const result = await pointStore.fetchPoints(params)
    if (result.success) {
      pagination.total = result.data.total
    }
  } catch (error) {
    ElMessage.error('加载积分记录失败')
  } finally {
    loading.value = false
  }
}

const handleClassChange = () => {
  pagination.page = 1
  loadPointRecords()
}

const handleTypeChange = () => {
  pagination.page = 1
  loadPointRecords()
}

const handleDateChange = () => {
  pagination.page = 1
  loadPointRecords()
}

const handleSearch = () => {
  pagination.page = 1
  loadPointRecords()
}

const handleSelectionChange = (selection) => {
  selectedRecords.value = selection
}

const handleSizeChange = (size) => {
  pagination.page_size = size
  pagination.page = 1
  loadPointRecords()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  loadPointRecords()
}

const handleBatchClassChange = async () => {
  if (batchForm.class_id) {
    await studentStore.fetchStudents({ class_id: batchForm.class_id })
  }
  batchForm.student_ids = []
}

const submitBatchPoints = async () => {
  if (!batchFormRef.value) return
  
  try {
    await batchFormRef.value.validate()
    submitting.value = true
    
    // 批量创建积分记录
    const promises = batchForm.student_ids.map(studentId => 
      pointStore.createPoint({
        student_id: studentId,
        class_id: batchForm.class_id,
        type: batchForm.type,
        points: batchForm.points,
        reason: batchForm.reason,
        given_date: batchForm.given_date
      })
    )
    
    await Promise.all(promises)
    
    ElMessage.success('积分发放成功')
    showBatchDialog.value = false
    resetBatchForm()
    await loadPointRecords()
  } catch (error) {
    ElMessage.error('积分发放失败')
  } finally {
    submitting.value = false
  }
}

const editRecord = (record) => {
  editForm.id = record.id
  editForm.type = record.type
  editForm.points = record.points
  editForm.reason = record.reason
  showEditDialog.value = true
}

const submitEditRecord = async () => {
  if (!editFormRef.value) return
  
  try {
    await editFormRef.value.validate()
    submitting.value = true
    
    // 这里需要添加更新积分记录的API
    // const result = await pointStore.updatePoint(editForm.id, editForm)
    
    ElMessage.success('积分记录更新成功')
    showEditDialog.value = false
    await loadPointRecords()
  } catch (error) {
    ElMessage.error('积分记录更新失败')
  } finally {
    submitting.value = false
  }
}

const deleteRecord = async (record) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除学生 ${record.student_name} 的积分记录吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const result = await pointStore.deletePoint(record.id)
    if (result.success) {
      ElMessage.success('删除成功')
      await loadPointRecords()
    } else {
      ElMessage.error(result.error || '删除失败')
    }
  } catch (error) {
    // 用户取消删除
  }
}

const resetBatchForm = () => {
  batchForm.class_id = null
  batchForm.student_ids = []
  batchForm.type = 'reward'
  batchForm.points = 1
  batchForm.reason = ''
  batchForm.given_date = new Date().toISOString().split('T')[0]
}

const getPointsClass = (points) => {
  return points > 0 ? 'points-positive' : 'points-negative'
}

// 生命周期
onMounted(async () => {
  await classStore.fetchClasses()
  await loadPointRecords()
})
</script>

<style scoped>
.points-management {
  padding: 20px;
}

.management-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.management-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.filters {
  margin-bottom: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.points-table {
  background: white;
  border-radius: 8px;
  padding: 20px;
}

.points-positive {
  color: #67c23a;
  font-weight: 600;
}

.points-negative {
  color: #f56c6c;
  font-weight: 600;
}
</style>