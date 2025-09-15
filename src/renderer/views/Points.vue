<template>
  <Layout>
    <el-tabs v-model="activeTab" class="points-tabs">
      <!-- 积分排行榜标签页 -->
      <el-tab-pane label="积分排行榜" name="ranking">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>积分排行榜</span>
              <div class="card-header-actions">
                <el-select 
                  v-model="selectedClassId" 
                  placeholder="选择班级" 
                  @change="loadPoints"
                  style="width: 200px; margin-right: 10px;"
                >
                  <el-option
                    v-for="cls in classes"
                    :key="cls.id"
                    :label="`${cls.grade}${cls.class_number}班 - ${cls.name}`"
                    :value="cls.id"
                  />
                </el-select>
                <el-button type="primary" @click="showAddPointDialog = true">
                  添加积分
                </el-button>
              </div>
            </div>
          </template>
          
          <el-tabs v-model="rankingTab" type="card">
            <el-tab-pane label="学生排名" name="student">
              <el-table 
                :data="studentPoints" 
                style="width: 100%" 
                v-loading="loading"
              >
                <el-table-column type="index" label="#" width="60" />
                <el-table-column prop="student_name" label="学生姓名" />
                <el-table-column prop="class_name" label="班级" />
                <el-table-column prop="total_points" label="总积分" sortable>
                  <template #default="scope">
                    <el-tag :type="scope.row.total_points > 0 ? 'success' : 'danger'">
                      {{ scope.row.total_points }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="total_reward_points" label="奖励积分" />
                <el-table-column prop="total_penalty_points" label="惩罚积分" />
                <el-table-column prop="reward_count" label="奖励次数" />
                <el-table-column prop="penalty_count" label="惩罚次数" />
                <el-table-column label="操作" width="120">
                  <template #default="scope">
                    <el-button 
                      size="small" 
                      type="primary" 
                      @click="showStudentPoints(scope.row)"
                    >
                      详情
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>
            
            <el-tab-pane label="小组排名" name="group">
              <el-table 
                :data="groupPoints" 
                style="width: 100%" 
                v-loading="loading"
              >
                <el-table-column type="index" label="#" width="60" />
                <el-table-column prop="group_name" label="小组名称" />
                <el-table-column prop="member_count" label="成员数" />
                <el-table-column prop="total_points" label="总积分" sortable>
                  <template #default="scope">
                    <el-tag :type="scope.row.total_points > 0 ? 'success' : 'danger'">
                      {{ scope.row.total_points }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="total_reward_points" label="奖励积分" />
                <el-table-column prop="total_penalty_points" label="惩罚积分" />
                <el-table-column prop="reward_count" label="奖励次数" />
                <el-table-column prop="penalty_count" label="惩罚次数" />
                <el-table-column label="操作" width="120">
                  <template #default="scope">
                    <el-button 
                      size="small" 
                      type="primary" 
                      @click="showGroupPoints(scope.row)"
                    >
                      详情
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-tab-pane>
      
      <!-- 积分记录标签页 -->
      <el-tab-pane label="积分记录" name="records">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>积分记录</span>
              <div class="card-header-actions">
                <el-select 
                  v-model="selectedClassId" 
                  placeholder="选择班级" 
                  @change="loadPoints"
                  style="width: 200px; margin-right: 10px;"
                >
                  <el-option
                    v-for="cls in classes"
                    :key="cls.id"
                    :label="`${cls.grade}${cls.class_number}班 - ${cls.name}`"
                    :value="cls.id"
                  />
                </el-select>
                <el-button type="primary" @click="showAddPointDialog = true">
                  添加积分
                </el-button>
              </div>
            </div>
          </template>
          
          <el-table 
            :data="points" 
            style="width: 100%" 
            v-loading="loading"
          >
            <el-table-column prop="student_name" label="学生姓名" />
            <el-table-column prop="group_name" label="小组名称" />
            <el-table-column prop="class_name" label="班级" />
            <el-table-column prop="points" label="积分值" sortable>
              <template #default="scope">
                <el-tag :type="scope.row.points > 0 ? 'success' : 'danger'">
                  {{ scope.row.points > 0 ? '+' : '' }}{{ scope.row.points }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="type" label="类型">
              <template #default="scope">
                <el-tag :type="scope.row.type === 'reward' ? 'success' : 'danger'">
                  {{ scope.row.type === 'reward' ? '奖励' : '惩罚' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="reason" label="原因" />
            <el-table-column prop="given_date" label="日期" />
            <el-table-column label="操作" width="100">
              <template #default="scope">
                <el-button 
                  size="small" 
                  type="danger" 
                  @click="deletePoint(scope.row.id)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <el-pagination
            v-model:current-page="pointsPage"
            v-model:page-size="pointsPageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="pointsTotal"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handlePointsSizeChange"
            @current-change="handlePointsCurrentChange"
            style="margin-top: 20px; justify-content: flex-end;"
          />
        </el-card>
      </el-tab-pane>
      
      <!-- 积分发放管理标签页 -->
      <el-tab-pane label="积分发放管理" name="management">
        <PointsManagement />
      </el-tab-pane>

    </el-tabs>

    <!-- 添加积分对话框 -->
    <el-dialog v-model="showAddPointDialog" title="添加积分" width="600px">
      <el-tabs v-model="pointDialogTab" type="card">
        <!-- 单个积分 -->
        <el-tab-pane label="单个积分" name="single">
          <el-form :model="newPoint" label-width="80px">
            <el-form-item label="积分类型">
              <el-radio-group v-model="newPoint.type">
                <el-radio label="reward">奖励</el-radio>
                <el-radio label="penalty">惩罚</el-radio>
              </el-radio-group>
            </el-form-item>
            
            <el-form-item label="积分值">
              <el-input-number 
                v-model="newPoint.points" 
                :min="-100" 
                :max="100" 
                controls-position="right"
              />
            </el-form-item>
            
            <el-form-item label="学生">
              <el-select 
                v-model="newPoint.student_id" 
                placeholder="选择学生" 
                style="width: 100%"
                filterable
              >
                <el-option
                  v-for="student in classStudents"
                  :key="student.id"
                  :label="student.name"
                  :value="student.id"
                />
              </el-select>
            </el-form-item>
            
            <el-form-item label="原因">
              <el-input 
                v-model="newPoint.reason" 
                type="textarea" 
                placeholder="请输入积分原因"
              />
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <!-- 快速积分模板 -->
        <el-tab-pane label="快速积分模板" name="template">
          <div class="template-section">
            <el-form label-width="100px">
              <el-form-item label="小组数量">
                <el-input-number 
                  v-model="templateForm.groupCount" 
                  :min="2" 
                  :max="10" 
                  controls-position="right"
                  @change="generateGroups"
                />
              </el-form-item>
              
              <el-form-item label="积分类型">
                <el-radio-group v-model="templateForm.type">
                  <el-radio label="reward">奖励</el-radio>
                  <el-radio label="penalty">惩罚</el-radio>
                </el-radio-group>
              </el-form-item>
              
              <el-form-item label="积分原因">
                <el-input 
                  v-model="templateForm.reason" 
                  placeholder="请输入积分原因"
                />
              </el-form-item>
            </el-form>
            
            <div class="groups-container">
              <div 
                v-for="(group, index) in templateGroups" 
                :key="index" 
                class="group-item"
              >
                <div class="group-header">
                  <span class="group-name">第{{ index + 1 }}组</span>
                  <el-input-number 
                    v-model="group.points" 
                    :min="-100" 
                    :max="100" 
                    size="small"
                    controls-position="right"
                    style="width: 120px;"
                  />
                </div>
                <el-button 
                  size="small" 
                  type="primary" 
                  @click="addGroupPoints(group, index + 1)"
                  :disabled="!templateForm.reason || group.points === 0"
                >
                  为第{{ index + 1 }}组加分
                </el-button>
              </div>
            </div>
            
            <div class="template-actions">
              <el-button 
                type="success" 
                @click="addAllGroupsPoints"
                :disabled="!templateForm.reason || templateGroups.every(g => g.points === 0)"
              >
                为所有小组加分
              </el-button>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddPointDialog = false">取消</el-button>
          <el-button 
            v-if="pointDialogTab === 'single'" 
            type="primary" 
            @click="addPoint"
          >
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>




  </Layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import Layout from './Layout.vue'
import PointsManagement from '../components/shop/PointsManagement.vue'
import { usePointStore } from '../stores/point'
import { useStudentStore } from '../stores/student'
import { useGroupStore } from '../stores/group'
import type { PointFormData, PointRule } from '../types/point'

// 状态管理
const pointStore = usePointStore()
const studentStore = useStudentStore()
const groupStore = useGroupStore()

// 响应式数据
const activeTab = ref('ranking')
const rankingTab = ref('student')
const showAddPointDialog = ref(false)
const selectedClassId = ref<number | null>(null)
const pointDialogTab = ref('single')



// 表单数据
const newPoint = ref<PointFormData>({
  student_id: null,
  points: 0,
  type: 'reward',
  reason: '',
  class_id: null
})

// 快速积分模板表单
const templateForm = ref({
  groupCount: 4,
  type: 'reward' as 'reward' | 'penalty',
  reason: ''
})

// 模板小组数据
const templateGroups = ref<Array<{ points: number }>>([])

// 分页数据
const pointsPage = ref(1)
const pointsPageSize = ref(20)
const pointsTotal = ref(0)

// 计算属性
const points = computed(() => pointStore.points)
const studentPoints = computed(() => pointStore.studentPoints)
const groupPoints = computed(() => pointStore.groupPoints)
const loading = computed(() => pointStore.loading)
const classes = computed(() => studentStore.classes)
const classStudents = computed(() => studentStore.students)

// 方法
const loadPoints = async () => {
  if (!selectedClassId.value) return
  
  try {
    await pointStore.getPoints({
      class_id: selectedClassId.value,
      page: pointsPage.value,
      page_size: pointsPageSize.value
    })
    pointsTotal.value = pointStore.total
  } catch (error) {
    ElMessage.error('加载积分记录失败')
  }
}

const addPoint = async () => {
  if (!newPoint.value.student_id) {
    ElMessage.warning('请选择学生')
    return
  }
  
  if (!newPoint.value.reason) {
    ElMessage.warning('请输入积分原因')
    return
  }
  
  try {
    newPoint.value.class_id = selectedClassId.value
    const result = await pointStore.addPoint(newPoint.value)
    if (result.success) {
      ElMessage.success('添加积分成功')
      showAddPointDialog.value = false
      resetPointForm()
      loadPoints()
    } else {
      ElMessage.error('添加积分失败: ' + result.error)
    }
  } catch (error) {
    ElMessage.error('添加积分失败')
  }
}

const deletePoint = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这条积分记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const result = await pointStore.deletePoint(id)
    if (result.success) {
      ElMessage.success('删除成功')
      loadPoints()
    } else {
      ElMessage.error('删除失败: ' + result.error)
    }
  } catch (error) {
    // 用户取消删除
  }
}

const resetPointForm = () => {
  newPoint.value = {
    student_id: null,
    points: 0,
    type: 'reward',
    reason: '',
    class_id: null
  }
}

// 生成小组
const generateGroups = () => {
  templateGroups.value = Array.from({ length: templateForm.value.groupCount }, () => ({
    points: 0
  }))
}

// 为单个小组加分
const addGroupPoints = async (group: { points: number }, groupIndex: number) => {
  if (!selectedClassId.value) {
    ElMessage.warning('请先选择班级')
    return
  }
  
  if (!templateForm.value.reason) {
    ElMessage.warning('请输入积分原因')
    return
  }
  
  if (group.points === 0) {
    ElMessage.warning('请设置积分值')
    return
  }
  
  try {
    // 获取班级的小组列表
    await groupStore.fetchGroups(selectedClassId.value)
    const groups = groupStore.groups
    
    if (groups.length === 0) {
      ElMessage.warning('该班级暂无小组，请先创建小组')
      return
    }
    
    // 找到对应的小组（按索引）
    const targetGroup = groups[groupIndex - 1]
    if (!targetGroup) {
      ElMessage.warning(`第${groupIndex}组不存在`)
      return
    }
    
    // 为小组添加积分
    const pointData: PointFormData = {
      group_id: targetGroup.id,
      student_id: null,
      points: templateForm.value.type === 'penalty' ? -Math.abs(group.points) : Math.abs(group.points),
      type: templateForm.value.type,
      reason: `${templateForm.value.reason}（第${groupIndex}组）`,
      class_id: selectedClassId.value
    }
    
    const result = await pointStore.addPoint(pointData)
    if (result.success) {
      ElMessage.success(`第${groupIndex}组积分添加成功`)
      // 重置该组积分值
      group.points = 0
      // 刷新数据
      loadPoints()
    } else {
      ElMessage.error(`第${groupIndex}组积分添加失败: ` + result.error)
    }
  } catch (error) {
    ElMessage.error(`第${groupIndex}组积分添加失败`)
  }
}

// 为所有小组加分
const addAllGroupsPoints = async () => {
  if (!selectedClassId.value) {
    ElMessage.warning('请先选择班级')
    return
  }
  
  if (!templateForm.value.reason) {
    ElMessage.warning('请输入积分原因')
    return
  }
  
  const validGroups = templateGroups.value.filter(g => g.points !== 0)
  if (validGroups.length === 0) {
    ElMessage.warning('请至少为一个小组设置积分值')
    return
  }
  
  try {
    // 获取班级的小组列表
    await groupStore.fetchGroups(selectedClassId.value)
    const groups = groupStore.groups
    
    if (groups.length === 0) {
      ElMessage.warning('该班级暂无小组，请先创建小组')
      return
    }
    
    let successCount = 0
    let errorCount = 0
    
    // 为每个有积分值的小组添加积分
    for (let i = 0; i < templateGroups.value.length; i++) {
      const group = templateGroups.value[i]
      if (group.points === 0) continue
      
      const targetGroup = groups[i]
      if (!targetGroup) {
        errorCount++
        continue
      }
      
      const pointData: PointFormData = {
        group_id: targetGroup.id,
        student_id: null,
        points: templateForm.value.type === 'penalty' ? -Math.abs(group.points) : Math.abs(group.points),
        type: templateForm.value.type,
        reason: `${templateForm.value.reason}（第${i + 1}组）`,
        class_id: selectedClassId.value
      }
      
      const result = await pointStore.addPoint(pointData)
      if (result.success) {
        successCount++
        // 重置该组积分值
        group.points = 0
      } else {
        errorCount++
      }
    }
    
    if (successCount > 0) {
      ElMessage.success(`成功为${successCount}个小组添加积分`)
      // 刷新数据
      loadPoints()
    }
    
    if (errorCount > 0) {
      ElMessage.warning(`${errorCount}个小组积分添加失败`)
    }
  } catch (error) {
    ElMessage.error('批量添加积分失败')
  }
}



const showStudentPoints = (student: any) => {
  // 显示学生积分详情
  console.log('显示学生积分详情:', student)
}

const showGroupPoints = (group: any) => {
  // 显示小组积分详情
  console.log('显示小组积分详情:', group)
}

const onClassChange = async (classId: number) => {
  selectedClassId.value = classId
  await studentStore.getStudents({ class_id: classId })
  await loadPoints()
}

const handlePointsSizeChange = (val: number) => {
  pointsPageSize.value = val
  loadPoints()
}

const handlePointsCurrentChange = (val: number) => {
  pointsPage.value = val
  loadPoints()
}

// 生命周期
onMounted(async () => {
  try {
    await studentStore.getClasses()
    if (studentStore.classes.length > 0) {
      selectedClassId.value = studentStore.classes[0].id
      await onClassChange(selectedClassId.value)
    }
    // 初始化模板小组
    generateGroups()
  } catch (error) {
    ElMessage.error('初始化失败')
  }
})

// 监听班级变化
watch(selectedClassId, (newClassId) => {
  if (newClassId) {
    onClassChange(newClassId)
  }
})
</script>

<style scoped>
.points-tabs {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header-actions {
  display: flex;
  align-items: center;
}

.template-section {
  padding: 10px 0;
}

.groups-container {
  margin: 20px 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.group-item {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 15px;
  background-color: #fafafa;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.group-name {
  font-weight: 600;
  color: #303133;
}

.template-actions {
  margin-top: 20px;
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}
</style>