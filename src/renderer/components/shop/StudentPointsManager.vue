<template>
  <div class="student-points-manager">
    <!-- 页面头部 -->
    <div class="management-header">
      <h3>学生积分管理</h3>
      <div class="header-actions">
        <el-button 
          type="primary" 
          @click="showGroupDialog = true"
          :disabled="selectedStudents.length === 0"
        >
          <el-icon><Plus /></el-icon>
          设置小组 ({{ selectedStudents.length }}人)
        </el-button>
        <el-button @click="clearSelection" v-if="selectedStudents.length > 0">
          <el-icon><Close /></el-icon>
          清空选择
        </el-button>
        <el-button @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 班级选择器 -->
    <div class="class-selector">
      <el-select
        v-model="selectedClassId"
        placeholder="请选择班级"
        clearable
        @change="handleClassChange"
        style="width: 300px"
      >
        <el-option
          v-for="cls in classes"
          :key="cls.id"
          :label="cls.name"
          :value="cls.id"
        />
      </el-select>
    </div>

    <!-- 小组列表 -->
    <div v-if="selectedClassId" class="groups-section">
      <div class="section-title">小组列表</div>
      <div class="groups-container">
        <el-tag 
          v-for="group in groups" 
          :key="group.id"
          @click="selectGroupStudents(group)"
          class="group-tag"
          closable
          @close="deleteGroup(group.id)"
        >
          {{ group.name }} ({{ group.student_count }}人)
        </el-tag>
      </div>
    </div>

    <!-- 学生卡片列表 -->
    <div v-if="selectedClassId" class="student-cards-container">
      <div class="selection-info" v-if="selectedStudents.length > 0">
        <el-tag type="info">已选择 {{ selectedStudents.length }} 名学生</el-tag>
      </div>
      <div class="student-cards">
        <div
          v-for="student in classStudents"
          :key="student.id"
          class="student-card"
          :class="{ 'selected': isStudentSelected(student.id) }"
          @click="toggleStudentSelection(student)"
        >
          <div class="selection-indicator" v-if="isStudentSelected(student.id)">
            <el-icon><Check /></el-icon>
          </div>
          <div class="student-info">
            <div class="student-name">{{ student.name }}</div>
            <div class="student-id" v-if="student.student_id">学号: {{ student.student_id }}</div>
            <div class="student-points">
              <span class="points-label">当前积分:</span>
              <span 
                :class="['points-value', { 'positive': getStudentPoints(student.id) > 0, 'negative': getStudentPoints(student.id) < 0 }]"
              >
                {{ getStudentPoints(student.id) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 快速加分减分面板 -->
    <div v-if="selectedStudent && selectedStudents.length === 1" class="points-panel">
      <div class="panel-header">
        <h4>为 {{ selectedStudent.name }} 快速操作积分</h4>
        <el-button @click="closePointsPanel" type="info" size="small">关闭</el-button>
      </div>
      
      <div class="points-actions">
        <div class="action-group">
          <div class="action-title">快速加分</div>
          <div class="quick-points">
            <el-button 
              v-for="point in quickPoints" 
              :key="'add-' + point" 
              @click="addPoints(point)"
              type="success"
              size="large"
            >
              +{{ point }}
            </el-button>
          </div>
        </div>
        
        <div class="action-group">
          <div class="action-title">快速减分</div>
          <div class="quick-points">
            <el-button 
              v-for="point in quickPoints" 
              :key="'subtract-' + point" 
              @click="subtractPoints(point)"
              type="danger"
              size="large"
            >
              -{{ point }}
            </el-button>
          </div>
        </div>
        
        <div class="action-group custom-points">
          <div class="action-title">自定义积分</div>
          <div class="custom-points-form">
            <el-input-number 
              v-model="customPoints" 
              :min="-100" 
              :max="100" 
              controls-position="right" 
              size="large"
            />
            <el-input 
              v-model="customReason" 
              placeholder="请输入原因" 
              style="margin-top: 10px"
            />
            <div class="custom-buttons">
              <el-button 
                @click="applyCustomPoints" 
                type="primary" 
                :disabled="!customReason || customPoints === 0"
                size="large"
              >
                {{ customPoints > 0 ? '加分' : customPoints < 0 ? '减分' : '应用' }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- 创建小组对话框 -->
  <el-dialog
    v-model="showGroupDialog"
    title="创建小组"
    width="500px"
    :before-close="handleDialogClose"
  >
    <el-form ref="groupFormRef" :model="groupForm" label-width="80px">
      <el-form-item label="小组名称" prop="name" :rules="[{ required: true, message: '请输入小组名称', trigger: 'blur' }]">
        <el-input v-model="groupForm.name" placeholder="请输入小组名称" />
      </el-form-item>
      <el-form-item label="小组描述">
        <el-input v-model="groupForm.description" type="textarea" placeholder="请输入小组描述" :rows="3" />
      </el-form-item>
      <el-form-item label="成员数量" label-width="80px">
        <el-tag type="info">{{ selectedStudents.length }}人</el-tag>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleDialogClose">取消</el-button>
        <el-button type="primary" @click="createGroup" :loading="loading">创建小组</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Plus, Check, Close, Delete } from '@element-plus/icons-vue'
import { useStudentStore } from '../../stores/student'
import { usePointStore } from '../../stores/point'
import { useClassStore } from '../../stores/class'
import { useGroupStore } from '../../stores/group'
import type { StudentListItem } from '../../types/student'
import type { Group } from '../../types/group'

const studentStore = useStudentStore()
const pointStore = usePointStore()
const classStore = useClassStore()
const groupStore = useGroupStore()

// 响应式数据
const selectedClassId = ref<number | null>(null)
const selectedStudent = ref<StudentListItem | null>(null)
const selectedStudents = ref<StudentListItem[]>([])
const showGroupDialog = ref(false)
const customPoints = ref(0)
const customReason = ref('')
const loading = ref(false)
const groups = ref<Group[]>([])
const groupForm = ref({ name: '', description: '' })

// 快速积分选项
const quickPoints = [1, 2, 3, 5, 10]

// 计算属性
const classes = computed(() => classStore.classes)
const classStudents = computed(() => studentStore.students)

// 获取学生积分
const getStudentPoints = (studentId: number) => {
  const summary = pointStore.studentPoints.find(item => item.student_id === studentId)
  return summary ? summary.total_points : 0
}

// 方法
const refreshData = async () => {
  await classStore.fetchClasses()
  if (selectedClassId.value) {
    await loadClassStudents()
    await loadStudentPoints()
  }
}

const handleClassChange = async () => {
  selectedStudent.value = null
  selectedStudents.value = []
  if (selectedClassId.value) {
    await loadClassStudents()
    await loadStudentPoints()
    await loadClassGroups()
  }
}

const loadClassGroups = async () => {
  if (!selectedClassId.value) return
  try {
    await groupStore.fetchGroups(selectedClassId.value)
    groups.value = groupStore.groups
  } catch (error) {
    ElMessage.error('加载小组列表失败')
  }
}

const handleDialogClose = () => {
  showGroupDialog.value = false
  resetGroupForm()
}

// 学生选择相关方法
const toggleStudentSelection = (student: StudentListItem) => {
  const index = selectedStudents.value.findIndex(s => s.id === student.id)
  if (index > -1) {
    selectedStudents.value.splice(index, 1)
    // 如果取消选择的是当前选中的单个学生，清空单个选择
    if (selectedStudent.value && selectedStudent.value.id === student.id) {
      selectedStudent.value = selectedStudents.value.length > 0 ? selectedStudents.value[0] : null
    }
  } else {
    selectedStudents.value.push(student)
    selectedStudent.value = student
  }
}

const isStudentSelected = (studentId: number) => {
  return selectedStudents.value.some(s => s.id === studentId)
}

const clearSelection = () => {
  selectedStudents.value = []
  selectedStudent.value = null
}

const selectStudent = (student: StudentListItem) => {
  // 保留原有功能，在多选模式下也能快速选择单个学生
  selectedStudent.value = student
  customPoints.value = 0
  customReason.value = ''
}

const loadClassStudents = async () => {
  if (!selectedClassId.value) return
  loading.value = true
  try {
    await studentStore.fetchStudents({ class_id: selectedClassId.value })
  } catch (error) {
    ElMessage.error('加载学生列表失败')
  } finally {
    loading.value = false
  }
}

const loadStudentPoints = async () => {
  if (!selectedClassId.value) return
  try {
    await pointStore.fetchStudentPointsSummary(selectedClassId.value)
  } catch (error) {
    ElMessage.error('加载学生积分失败')
  }
}

const closePointsPanel = () => {
  selectedStudent.value = null
  customPoints.value = 0
  customReason.value = ''
}

const addPoints = async (points: number) => {
  if (!selectedStudent.value || !selectedClassId.value) return
  await applyPoints(points, `快速加分${points}分`)
}

const subtractPoints = async (points: number) => {
  if (!selectedStudent.value || !selectedClassId.value) return
  await applyPoints(-points, `快速减分${points}分`)
}

const applyCustomPoints = async () => {
  if (!selectedStudent.value || !selectedClassId.value || !customReason.value) return
  await applyPoints(customPoints.value, customReason.value)
  customPoints.value = 0
  customReason.value = ''
}

const applyPoints = async (points: number, reason: string) => {
  if (!selectedStudent.value || !selectedClassId.value) return
  
  try {
    const result = await pointStore.createPoint({
      student_id: selectedStudent.value.id,
      class_id: selectedClassId.value,
      points: points,
      type: points > 0 ? 'reward' : 'penalty',
      reason: reason,
      given_date: new Date().toISOString().split('T')[0]
    })
    
    if (result.success) {
      ElMessage.success(`${points > 0 ? '加分' : '减分'}成功`)
      // 更新积分显示
      await loadStudentPoints()
    } else {
      ElMessage.error(result.error || `${points > 0 ? '加分' : '减分'}失败`)
    }
  } catch (error) {
    ElMessage.error(`${points > 0 ? '加分' : '减分'}失败`)
  }
}

// 小组管理相关方法
const resetGroupForm = () => {
  groupForm.value = {
    name: '',
    description: ''
  }
}

const createGroup = async () => {
  if (!groupForm.value.name.trim()) {
    ElMessage.warning('请输入小组名称')
    return
  }
  
  if (selectedStudents.value.length === 0) {
    ElMessage.warning('请选择至少一名学生')
    return
  }
  
  loading.value = true
  try {
    // 创建小组
    const groupData = {
      name: groupForm.value.name,
      description: groupForm.value.description,
      class_id: selectedClassId.value
    }
    
    const result = await groupStore.createGroup(groupData)
    
    if (result.success && result.data) {
      const groupId = result.data.id
      
      // 添加小组成员
      let successCount = 0
      let errorCount = 0
      
      for (const student of selectedStudents.value) {
        try {
          const memberResult = await groupStore.addGroupMember(groupId, student.id)
          if (memberResult.success) {
            successCount++
          } else {
            errorCount++
          }
        } catch (error) {
          errorCount++
        }
      }
      
      ElMessage.success(`小组「${groupForm.value.name}」创建成功，包含${successCount}名学生`)
      
      // 清空选择和关闭对话框
      clearSelection()
      showGroupDialog.value = false
      resetGroupForm()
      
      // 刷新小组列表
      await loadClassGroups()
    } else {
      ElMessage.error(result.error || '创建小组失败')
    }
  } catch (error) {
    console.error('创建小组失败:', error)
    ElMessage.error('创建小组失败，请重试')
  } finally {
    loading.value = false
  }
}

const selectGroupStudents = async (group: Group) => {
  // 清空当前选择
  clearSelection()
  
  try {
    // 获取小组的学生列表
    const students = await groupStore.getGroupStudents(group.id)
    if (students) {
      // 选择该小组的所有学生
      selectedStudents.value = students.filter(s => 
        classStudents.value.some(cs => cs.id === s.id)
      )
      
      // 如果有选中的学生，设置第一个为当前选中的单个学生
      if (selectedStudents.value.length > 0) {
        selectedStudent.value = selectedStudents.value[0]
      }
      
      ElMessage.success(`已选择 ${selectedStudents.value.length} 名学生（${group.name}）`)
    }
  } catch (error) {
    console.error('获取小组成员失败:', error)
    ElMessage.error('选择小组学生失败')
  }
}

const deleteGroup = async (groupId: number) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个小组吗？',
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const result = await groupStore.deleteGroup(groupId, selectedClassId.value!)
    if (result.success) {
      ElMessage.success('小组删除成功')
      await loadClassGroups()
    } else {
      ElMessage.error(result.error || '删除小组失败')
    }
  } catch (error) {
    // 用户取消删除
  }
}

// 生命周期
onMounted(async () => {
  await classStore.fetchClasses()
})
</script>

<style scoped>
.student-points-manager {
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

.class-selector {
  margin-bottom: 20px;
}

.groups-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #303133;
  display: flex;
  align-items: center;
}

.student-cards-container {
  margin-top: 20px;
}

.selection-info {
  margin-bottom: 15px;
}

.student-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.student-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s;
  background: white;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  position: relative;
  display: flex;
  flex-direction: column;
}

.student-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.15);
  border-color: #409eff;
}

.student-card.selected {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.selection-indicator {
  position: absolute;
  top: 10px;
  right: 10px;
  color: #409eff;
  font-size: 16px;
}

.student-info {
  flex: 1;
}

.student-info .student-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #303133;
}

.student-info .student-id {
  font-size: 14px;
  color: #909399;
  margin-bottom: 12px;
}

.student-info .student-points {
  display: flex;
  align-items: center;
  gap: 8px;
}

.points-label {
  font-size: 14px;
  color: #606266;
}

.points-value {
  font-size: 18px;
  font-weight: 600;
}

.points-value.positive {
  color: #67c23a;
}

.points-value.negative {
  color: #f56c6c;
}

.quick-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 15px;
}

.quick-action-btn {
  min-width: 50px;
  padding: 5px;
  font-size: 12px;
}

.points-panel {
  margin-top: 30px;
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.panel-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.points-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 30px;
}

.action-group {
  display: flex;
  flex-direction: column;
}

.action-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 15px;
  color: #606266;
}

.quick-points {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.quick-points .el-button {
  min-width: 60px;
}

.custom-points-form {
  display: flex;
  flex-direction: column;
}

.custom-buttons {
  margin-top: 15px;
}

/* 小组列表样式 */
.group-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.group-item {
  background-color: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 10px 15px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
}

.group-item:hover {
  background-color: #e6f7ff;
  border-color: #91d5ff;
  color: #1890ff;
}

.group-delete-btn {
  color: #ff4d4f;
  font-size: 12px;
  cursor: pointer;
  margin-left: 5px;
  opacity: 0.7;
}

.group-delete-btn:hover {
  opacity: 1;
}

@media (max-width: 768px) {
  .student-cards {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
  
  .points-actions {
    grid-template-columns: 1fr;
  }
  
  .management-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .header-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    width: 100%;
  }
  
  .header-actions .el-button {
    flex: 1;
    min-width: 120px;
  }
}
</style>