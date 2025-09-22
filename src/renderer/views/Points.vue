<template>
  <Layout>
    <div class="points-container">
      <div class="header">
        <h2>积分管理</h2>
        <div class="header-controls">
          <el-select v-model="selectedClassId" placeholder="选择班级" @change="handleClassChange" style="width: 200px">
            <el-option
              v-for="classItem in classes"
              :key="classItem.id"
              :label="classItem.name"
              :value="classItem.id"
            />
          </el-select>
          
          <el-button-group>
            <el-button 
              :type="multiSelectMode ? 'primary' : 'default'" 
              @click="toggleMultiSelectMode"
            >
              <el-icon><CircleCheck /></el-icon>
              多选模式
            </el-button>
            <el-button 
              type="success" 
              @click="showGroupDialog = true"
              :disabled="selectedStudents.length === 0"
            >
              <el-icon><Plus /></el-icon>
              保存为小组
            </el-button>
            <el-button 
              type="warning" 
              @click="clearSelection"
              :disabled="selectedStudents.length === 0"
            >
              <el-icon><Close /></el-icon>
              清空选择
            </el-button>
          </el-button-group>
          
          <!-- 快速积分按钮 -->
          <el-button-group v-if="!multiSelectMode">
            <el-button type="success" @click="quickAddPoints(1)">
              <el-icon><Plus /></el-icon>
              全部+1
            </el-button>
            <el-button type="danger" @click="quickAddPoints(-1)">
              <el-icon><Minus /></el-icon>
              全部-1
            </el-button>
          </el-button-group>
        </div>
      </div>
    </div>
    <!-- 小组列表 -->
    <div class="groups-section" v-if="groups.length > 0">
      <h3>小组列表</h3>
      <div class="groups-list">
        <el-tag
          v-for="group in groups"
          :key="group.id"
          closable
          @close="deleteGroup(group.id)"
          @click="selectGroup(group)"
          :type="selectedGroup?.id === group.id ? 'primary' : 'info'"
          style="margin-right: 10px; margin-bottom: 10px; cursor: pointer"
        >
          {{ group.name }} ({{ group.studentIds.length }}人)
        </el-tag>
      </div>
    </div>

    <!-- 学生卡片列表 -->
    <div class="students-section" v-loading="loading">
      <div class="students-header">
        <h3>学生列表</h3>
        <div class="selected-info" v-if="selectedStudents.length > 0">
          已选择 {{ selectedStudents.length }} 名学生
        </div>
      </div>
      
      <div class="students-grid">
        <div 
          v-for="student in students" 
          :key="student.id"
          class="student-card"
          :class="{ 
            selected: selectedStudents.includes(student.id),
            'multi-select': multiSelectMode
          }"
          @click="selectStudent(student)"
        >
          <div class="student-info">
            <div class="student-name">{{ student.name }}</div>
            <div class="student-points">积分: {{ student.points || 0 }}</div>
          </div>
          
          <div class="student-actions" v-if="!multiSelectMode">
            <el-button-group>
              <el-button 
                type="success" 
                size="small" 
                @click.stop="addPoint(student, 1)"
              >
                +1
              </el-button>
              <el-button 
                type="danger" 
                size="small" 
                @click.stop="addPoint(student, -1)"
              >
                -1
              </el-button>
              <el-button 
                type="info" 
                size="small" 
                @click.stop="showPointHistory(student)"
              >
                <el-icon><Clock /></el-icon>
              </el-button>
            </el-button-group>
          </div>
          
          <div class="selection-indicator" v-if="multiSelectMode && selectedStudents.includes(student.id)">
            <el-icon class="check-icon"><Check /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- 批量操作栏 -->
    <div class="batch-actions" v-if="selectedStudents.length > 0">
      <el-card>
        <template #header>
          <div class="batch-header">
            <span>批量操作 ({{ selectedStudents.length }} 名学生)</span>
          </div>
        </template>
        
        <div class="batch-controls">
          <el-input-number 
            v-model="batchPoints" 
            :min="-10" 
            :max="10" 
            :step="1"
            style="width: 120px"
          />
          <el-button-group>
            <el-button type="success" @click="batchAddPoints">
              <el-icon><Plus /></el-icon>
              批量加分
            </el-button>
            <el-button type="danger" @click="batchSubtractPoints">
              <el-icon><Minus /></el-icon>
              批量减分
            </el-button>
          </el-button-group>
        </div>
      </el-card>
    </div>

    <!-- 保存小组对话框 -->
    <el-dialog v-model="showGroupDialog" title="保存为小组" width="400px">
      <el-form :model="groupForm" label-width="80px">
        <el-form-item label="小组名称">
          <el-input v-model="groupForm.name" placeholder="请输入小组名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showGroupDialog = false">取消</el-button>
        <el-button type="primary" @click="saveGroup">保存</el-button>
      </template>
    </el-dialog>

    <!-- 积分历史对话框 -->
    <el-dialog v-model="showHistoryDialog" :title="`${selectedStudentHistory?.name}的积分历史`" width="600px">
      <div class="point-history" v-if="studentPointHistory.length > 0">
        <div v-for="record in studentPointHistory" :key="record.id" class="history-item">
          <div class="history-header">
            <span class="history-points" :class="record.points > 0 ? 'positive' : 'negative'">
              {{ record.points > 0 ? '+' : '' }}{{ record.points }}
            </span>
            <span class="history-date">{{ formatDate(record.created_at) }}</span>
          </div>
          <div class="history-reason">{{ record.reason }}</div>
        </div>
      </div>
      <div v-else class="no-history">
        暂无积分记录
      </div>
      <template #footer>
        <el-button @click="showHistoryDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </Layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Minus, CircleCheck, Close, Star, Delete, View, Clock, Check } from '@element-plus/icons-vue'
import { useClassStore } from '../stores/class'
import { useStudentStore } from '../stores/student'
import { usePointStore } from '../stores/point'
import type { Class } from '../types/class'
import Layout from './Layout.vue'


// 存储
const classStore = useClassStore()
const studentStore = useStudentStore()
const pointStore = usePointStore()

// 数据
const selectedClassId = ref<string>('')
const loading = ref(false)
const multiSelectMode = ref(false)
const selectedStudents = ref<string[]>([])
const selectedGroup = ref<any>(null)
const showGroupDialog = ref(false)
const batchPoints = ref(1)
const showHistoryDialog = ref(false)
const selectedStudentHistory = ref<any>(null)
const studentPointHistory = ref<any[]>([])

const groupForm = ref({
  name: ''
})

// 计算属性
const classes = computed(() => classStore.classes)
const students = computed(() => {
  // 合并学生基本信息和积分数据
  const studentList = studentStore.students
  const pointSummary = pointStore.studentPoints
  
  return studentList.map(student => {
    const pointData = pointSummary.find(p => p.student_id === student.id)
    return {
      ...student,
      points: pointData?.total_points || 0
    }
  })
})
const groups = computed(() => {
  // 从localStorage获取小组数据
  const savedGroups = localStorage.getItem(`groups_${selectedClassId.value}`)
  return savedGroups ? JSON.parse(savedGroups) : []
})

// 方法
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const loadClasses = async () => {
  await classStore.fetchClasses()
  if (classes.value.length > 0 && !selectedClassId.value) {
    selectedClassId.value = classes.value[0].id
    await loadStudents()
  }
}

const loadStudents = async () => {
  if (!selectedClassId.value) return
  
  loading.value = true
  try {
    // 获取所有学生，不限制每页数量
    await studentStore.fetchStudents({ 
      class_id: Number(selectedClassId.value),
      page: 1,
      page_size: 999 // 设置一个大数字来获取所有学生
    })
    await pointStore.fetchStudentPointsSummary(Number(selectedClassId.value))
  } finally {
    loading.value = false
  }
}

const handleClassChange = async () => {
  selectedStudents.value = []
  selectedGroup.value = null
  await loadStudents()
}

const toggleMultiSelectMode = () => {
  multiSelectMode.value = !multiSelectMode.value
  if (!multiSelectMode.value) {
    selectedStudents.value = []
    selectedGroup.value = null
  }
}

const selectStudent = (student: any) => {
  if (multiSelectMode.value) {
    const index = selectedStudents.value.indexOf(student.id)
    if (index > -1) {
      selectedStudents.value.splice(index, 1)
    } else {
      selectedStudents.value.push(student.id)
    }
  } else {
    // 单击模式可以添加快速操作
  }
}

const clearSelection = () => {
  selectedStudents.value = []
  selectedGroup.value = null
}

const addPoint = async (student: any, points: number) => {
  try {
    const result = await pointStore.addPoint({
      student_id: student.id,
      points,
      reason: '手动积分操作',
      type: points > 0 ? 'reward' : 'penalty',
      class_id: Number(selectedClassId.value)
    })
    
    if (result.success) {
      ElMessage.success(`${points > 0 ? '+' : ''}${points}分 操作成功`)
      // 刷新学生数据（积分存储会自动刷新积分汇总）
      await loadStudents()
    } else {
      ElMessage.error(result.error || '操作失败')
    }
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const batchAddPoints = async () => {
  if (selectedStudents.value.length === 0) return
  
  try {
    for (const studentId of selectedStudents.value) {
      await pointStore.addPoint({
        student_id: Number(studentId),
        points: batchPoints.value,
        reason: '批量积分操作',
        type: 'reward',
        class_id: Number(selectedClassId.value)
      })
    }
    
    ElMessage.success(`批量添加 ${batchPoints.value} 分成功`)
    selectedStudents.value = []
    // 刷新学生数据（积分存储会自动刷新积分汇总）
    await loadStudents()
  } catch (error) {
    ElMessage.error('批量操作失败')
  }
}

const batchSubtractPoints = async () => {
  if (selectedStudents.value.length === 0) return
  
  try {
    for (const studentId of selectedStudents.value) {
      await pointStore.addPoint({
        student_id: Number(studentId),
        points: -batchPoints.value,
        reason: '批量扣分操作',
        type: 'penalty',
        class_id: Number(selectedClassId.value)
      })
    }
    
    ElMessage.success(`批量扣除 ${batchPoints.value} 分成功`)
    selectedStudents.value = []
    // 刷新学生数据（积分存储会自动刷新积分汇总）
    await loadStudents()
  } catch (error) {
    ElMessage.error('批量操作失败')
  }
}

const saveGroup = () => {
  if (!groupForm.value.name.trim()) {
    ElMessage.warning('请输入小组名称')
    return
  }
  
  if (selectedStudents.value.length === 0) {
    ElMessage.warning('请选择学生')
    return
  }
  
  const newGroup = {
    id: Date.now().toString(),
    name: groupForm.value.name.trim(),
    studentIds: [...selectedStudents.value]
  }
  
  const existingGroups = groups.value
  existingGroups.push(newGroup)
  
  localStorage.setItem(`groups_${selectedClassId.value}`, JSON.stringify(existingGroups))
  
  ElMessage.success('小组保存成功')
  showGroupDialog.value = false
  groupForm.value.name = ''
}

const selectGroup = (group: any) => {
  if (selectedGroup.value?.id === group.id) {
    selectedGroup.value = null
    selectedStudents.value = []
  } else {
    selectedGroup.value = group
    selectedStudents.value = [...group.studentIds]
    multiSelectMode.value = true
  }
}

const deleteGroup = async (groupId: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这个小组吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const existingGroups = groups.value.filter(g => g.id !== groupId)
    localStorage.setItem(`groups_${selectedClassId.value}`, JSON.stringify(existingGroups))
    
    if (selectedGroup.value?.id === groupId) {
      selectedGroup.value = null
      selectedStudents.value = []
    }
    
    ElMessage.success('小组删除成功')
  } catch (error) {
    // 用户取消操作
  }
}

// 快速积分功能
const quickAddPoints = async (points: number) => {
  if (students.value.length === 0) {
    ElMessage.warning('没有学生数据')
    return
  }
  
  try {
    const promises = students.value.map(student => 
      pointStore.addPoint({
        student_id: student.id,
        points,
        reason: '快速批量操作',
        type: points > 0 ? 'reward' : 'penalty',
        class_id: Number(selectedClassId.value)
      })
    )
    
    await Promise.all(promises)
    
    ElMessage.success(`全部${points > 0 ? '+' : ''}${points}分操作成功`)
    // 刷新学生数据（积分存储会自动刷新积分汇总）
    await loadStudents()
  } catch (error) {
    ElMessage.error('快速操作失败')
  }
}

// 显示积分历史
const showPointHistory = async (student: any) => {
  selectedStudentHistory.value = student
  showHistoryDialog.value = true
  
  try {
    await pointStore.fetchPoints({
      student_id: student.id,
      class_id: Number(selectedClassId.value),
      page: 1,
      page_size: 10
    })
    studentPointHistory.value = pointStore.points
  } catch (error) {
    ElMessage.error('获取积分历史失败')
    studentPointHistory.value = []
  }
}

// 生命周期
onMounted(() => {
  loadClasses()
})
</script>

<style scoped>
.points-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-controls {
  display: flex;
  gap: 15px;
  align-items: center;
}

.groups-section {
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
}

.groups-section h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #303133;
}

.groups-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.students-section {
  margin-bottom: 20px;
}

.students-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.selected-info {
  color: #409eff;
  font-weight: bold;
}

.students-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.student-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 15px;
  background: white;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
}

.student-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.student-card.selected {
  border-color: #409eff;
  background: #ecf5ff;
}

.student-card.multi-select {
  cursor: pointer;
}

.student-info {
  margin-bottom: 10px;
}

.student-name {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.student-points {
  font-size: 14px;
  color: #67c23a;
  font-weight: bold;
}

.student-actions {
  display: flex;
  gap: 5px;
}

.selection-indicator {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 24px;
  height: 24px;
  background: #409eff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.check-icon {
  color: white;
  font-size: 14px;
}

.batch-actions {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 400px;
  z-index: 1000;
}

.batch-header {
  font-weight: bold;
}

.batch-controls {
  display: flex;
  gap: 15px;
  align-items: center;
}

.point-history {
  max-height: 400px;
  overflow-y: auto;
}

.history-item {
  padding: 10px;
  border-bottom: 1px solid #e4e7ed;
}

.history-item:last-child {
  border-bottom: none;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.history-points {
  font-weight: bold;
  font-size: 16px;
}

.history-points.positive {
  color: #67c23a;
}

.history-points.negative {
  color: #f56c6c;
}

.history-date {
  color: #909399;
  font-size: 12px;
}

.history-reason {
  color: #606266;
  font-size: 14px;
}

.no-history {
  text-align: center;
  padding: 40px;
  color: #909399;
}
</style>