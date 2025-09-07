<template>
  <Layout>
    <div class="seating-container">
      <div class="page-header">
        <h1>排位管理</h1>
        <p>可视化座位编排，智能推荐最佳座位安排方案</p>
      </div>

      <div class="content">
        <!-- 步骤指示器 -->
        <div class="steps-container">
          <el-steps :active="currentStep" align-center>
            <el-step title="选择班级" description="选择要进行排位的班级" />
            <el-step title="设置布局" description="设计教室座位布局" />
            <el-step title="分配学生" description="将学生分配到具体座位" />
          </el-steps>
        </div>

        <!-- 步骤1: 选择班级 -->
        <el-card v-if="currentStep === 0" class="step-card">
          <template #header>
            <div class="card-header">
              <span>选择班级</span>
              <el-button type="text" @click="refreshClasses">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </template>
          
          <div class="class-selection">
            <div v-if="loading" class="loading-state">
              <el-skeleton :rows="3" animated />
            </div>
            <div v-else-if="classes.length === 0" class="empty-state">
              <el-empty description="暂无班级数据">
                <el-button type="primary" @click="$router.push('/classes')">去创建班级</el-button>
              </el-empty>
            </div>
            <div v-else class="class-grid">
              <div
                v-for="classItem in classes"
                :key="classItem.id"
                :class="['class-card', { active: selectedClass?.id === classItem.id }]"
                @click="selectClass(classItem)"
              >
                <div class="class-info">
                  <h3>{{ classItem.grade }}{{ classItem.class_number }}班</h3>
                  <p>班主任：{{ classItem.homeroom_teacher || '未设置' }}</p>
                  <div class="class-stats">
                    <el-tag size="small">最大人数: {{ classItem.max_students }}</el-tag>
                  </div>
                </div>
                <div class="class-actions">
                  <el-icon><Right /></el-icon>
                </div>
              </div>
            </div>
            
            <div v-if="selectedClass" class="step-actions">
              <el-button type="primary" @click="nextStep">
                下一步：设置布局
                <el-icon><ArrowRight /></el-icon>
              </el-button>
            </div>
          </div>
        </el-card>

        <!-- 步骤2: 设置布局 -->
        <el-card v-if="currentStep === 1" class="step-card">
          <template #header>
            <div class="card-header">
              <span>设置座位布局 - {{ selectedClass?.grade }}{{ selectedClass?.class_number }}班</span>
              <div class="header-actions">
                <el-button @click="prevStep">
                  <el-icon><ArrowLeft /></el-icon>
                  上一步
                </el-button>
                <el-button type="primary" @click="showLayoutDesigner">
                  <el-icon><Setting /></el-icon>
                  设计布局
                </el-button>
              </div>
            </div>
          </template>
          
          <div class="layout-preview">
            <div v-if="loadingConfig" class="loading-state">
              <el-skeleton :rows="5" animated />
            </div>
            <div v-else-if="!hasLayout" class="empty-layout">
              <el-empty description="还未设置座位布局">
                <el-button type="primary" @click="showLayoutDesigner">
                  <el-icon><Plus /></el-icon>
                  创建布局
                </el-button>
              </el-empty>
            </div>
            <div v-else class="layout-display">
              <div class="layout-info">
                <el-descriptions :column="3" border>
                  <el-descriptions-item label="行数">{{ currentConfig?.rows }}</el-descriptions-item>
                  <el-descriptions-item label="列数">{{ currentConfig?.columns }}</el-descriptions-item>
                  <el-descriptions-item label="布局">
                    {{ currentConfig?.rows }}×{{ currentConfig?.columns }}
                  </el-descriptions-item>
                </el-descriptions>
              </div>
              
              <div class="layout-visual">
                <div class="mini-classroom">
                  <div class="mini-layout">
                    <!-- 座位区域 -->
                    <div class="mini-seats">
                      <div
                        v-for="(row, rowIndex) in (currentConfig?.seat_layout?.seats || currentConfig?.seat_layout || [])"
                        :key="rowIndex"
                        class="mini-row"
                      >
                        <div
                          v-for="(seat, colIndex) in row"
                          :key="colIndex"
                          :class="['mini-seat', `mini-${(seat as SeatPosition).type}`]"
                        ></div>
                      </div>
                    </div>
                    
                    <!-- 讲台区域（右侧） -->
                    <div class="mini-podium">讲台</div>
                  </div>
                </div>
              </div>
              
              <div class="step-actions">
                <el-button @click="showLayoutDesigner">
                  <el-icon><Edit /></el-icon>
                  修改布局
                </el-button>
                <el-button type="primary" @click="nextStep">
                  下一步：分配学生
                  <el-icon><ArrowRight /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 步骤3: 分配学生 -->
        <el-card v-if="currentStep === 2" class="step-card full-height">
          <template #header>
            <div class="card-header">
              <span>分配学生 - {{ selectedClass?.grade }}{{ selectedClass?.class_number }}班</span>
              <div class="header-actions">
                <el-button @click="prevStep">
                  <el-icon><ArrowLeft /></el-icon>
                  上一步
                </el-button>
                <el-button @click="refreshArrangement">
                  <el-icon><Refresh /></el-icon>
                  刷新
                </el-button>
              </div>
            </div>
          </template>
          
          <div class="arrangement-container">
            <div v-if="loadingArrangement" class="loading-state">
              <el-skeleton :rows="8" animated />
            </div>
            <SeatingArrangement
              v-else
              :arrangement="currentArrangement"
              :loading="seatingLoading"
              :saved-numbering-mode="currentConfig?.numbering_mode"
              :saved-numbering-direction="currentConfig?.numbering_direction"
              @assign-student="handleAssignStudent"
              @remove-student="handleRemoveStudent"
              @auto-assign="handleAutoAssign"
              @clear-all="handleClearAll"
              @save-arrangement="handleSaveArrangement"
            />
          </div>
        </el-card>
      </div>

      <!-- 布局设计器 -->
      <SeatLayoutDesigner
        v-model="designerVisible"
        :class-id="selectedClass?.id || 0"
        :initial-config="designerConfig"
        @saved="handleLayoutSaved"
      />
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Refresh, Right, ArrowRight, ArrowLeft, Setting, Plus, Edit
} from '@element-plus/icons-vue'
import Layout from './Layout.vue'
import SeatLayoutDesigner from '../components/SeatLayoutDesigner.vue'
import SeatingArrangement from '../components/SeatingArrangement.vue'
import { useClassStore } from '../stores/class'
import { useSeatingStore } from '../stores/seating'
import type { Class } from '../types/class'
import type { SeatingArrangement as SeatingArrangementType, SeatPosition } from '../types/seating'

const classStore = useClassStore()
const seatingStore = useSeatingStore()

const currentStep = ref(0)
const selectedClass = ref<Class | null>(null)
const designerVisible = ref(false)
const loading = ref(false)
const loadingConfig = ref(false)
const loadingArrangement = ref(false)
const seatingLoading = ref(false)

const classes = computed(() => classStore.classes)
const currentConfig = computed(() => seatingStore.currentConfig)
const currentArrangement = computed(() => seatingStore.currentArrangement)

const hasLayout = computed(() => {
  return currentConfig.value && (
    currentConfig.value.seat_layout ||
    (currentConfig.value.rows && currentConfig.value.columns)
  )
})

// 转换配置数据为设计器所需的格式
const designerConfig = computed(() => {
  if (!currentConfig.value) return undefined
  
  const config = currentConfig.value
  let layout: SeatPosition[][] | undefined
  
  if (config.seat_layout) {
    // 如果 seat_layout 是 SeatLayout 对象
    if ('seats' in config.seat_layout) {
      layout = config.seat_layout.seats
    } 
    // 如果 seat_layout 是 SeatPosition[][]
    else if (Array.isArray(config.seat_layout)) {
      layout = config.seat_layout as SeatPosition[][]
    }
  }
  
  return {
    rows: config.rows,
    columns: config.columns,
    layout,
    numbering_mode: config.numbering_mode,
    numbering_direction: config.numbering_direction
  }
})

// 加载班级列表
const loadClasses = async () => {
  loading.value = true
  try {
    await classStore.fetchClasses()
  } finally {
    loading.value = false
  }
}

// 刷新班级
const refreshClasses = () => {
  loadClasses()
}

// 选择班级
const selectClass = (classItem: Class) => {
  selectedClass.value = classItem
}

// 下一步
const nextStep = async () => {
  if (currentStep.value === 0 && selectedClass.value) {
    // 进入设置布局步骤，加载班级配置
    await loadClassConfig()
    currentStep.value = 1
  } else if (currentStep.value === 1 && hasLayout.value) {
    // 进入分配学生步骤，加载座位安排
    await loadSeatingArrangement()
    currentStep.value = 2
  }
}

// 上一步
const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

// 加载班级配置
const loadClassConfig = async () => {
  if (!selectedClass.value?.id) return
  
  loadingConfig.value = true
  try {
    await seatingStore.getClassConfig(selectedClass.value.id)
  } finally {
    loadingConfig.value = false
  }
}

// 加载座位安排
const loadSeatingArrangement = async () => {
  if (!selectedClass.value?.id) return
  
  loadingArrangement.value = true
  try {
    await seatingStore.getSeatingArrangement(selectedClass.value.id)
  } finally {
    loadingArrangement.value = false
  }
}

// 刷新座位安排
const refreshArrangement = () => {
  loadSeatingArrangement()
}

// 显示布局设计器
const showLayoutDesigner = () => {
  designerVisible.value = true
}

// 布局保存完成
const handleLayoutSaved = () => {
  loadClassConfig()
}

// 分配学生到座位
const handleAssignStudent = async (data: {
  student_id: number
  row: number
  column: number
}) => {
  if (!selectedClass.value?.id) return
  
  seatingLoading.value = true
  try {
    const result = await seatingStore.assignStudentToSeat({
      class_id: selectedClass.value.id,
      ...data
    })
    
    if (result.success) {
      ElMessage.success('学生座位分配成功')
      // 强制刷新数据确保同步
      await loadSeatingArrangement()
    } else {
      ElMessage.error(result.error || '分配失败')
    }
  } finally {
    seatingLoading.value = false
  }
}

// 移除学生座位
const handleRemoveStudent = async (data: {
  row: number
  column: number
}) => {
  if (!selectedClass.value?.id) return
  
  seatingLoading.value = true
  try {
    const result = await seatingStore.removeStudentFromSeat({
      class_id: selectedClass.value.id,
      ...data
    })
    
    if (result.success) {
      ElMessage.success('学生座位移除成功')
    } else {
      ElMessage.error(result.error || '移除失败')
    }
  } finally {
    seatingLoading.value = false
  }
}

// 自动分配座位
const handleAutoAssign = async (data?: { numberingMode: string; numberingDirection: string }) => {
  if (!selectedClass.value?.id) return
  
  seatingLoading.value = true
  try {
    const result = await seatingStore.autoAssignSeats(selectedClass.value.id, data)
    
    if (result.success) {
      ElMessage.success(`自动分配成功，共分配 ${result.data?.assigned || 0} 个学生`)
    } else {
      ElMessage.error(result.error || '自动分配失败')
    }
  } finally {
    seatingLoading.value = false
  }
}

// 清空所有座位
const handleClearAll = async () => {
  if (!selectedClass.value?.id || !currentArrangement.value) return
  
  seatingLoading.value = true
  try {
    // 移除所有已分配的学生
    const promises = currentArrangement.value.students.map(student => 
      seatingStore.removeStudentFromSeat({
        class_id: selectedClass.value!.id!,
        row: student.row,
        column: student.column
      })
    )
    
    await Promise.all(promises)
    ElMessage.success('所有座位已清空')
  } finally {
    seatingLoading.value = false
  }
}

// 保存排位安排
const handleSaveArrangement = async () => {
  if (!selectedClass.value?.id) return
  
  seatingLoading.value = true
  try {
    // 调用后端保存排位安排的API
    const result = await seatingStore.saveSeatingArrangement(selectedClass.value.id)
    
    if (result.success) {
      ElMessage.success('排位安排保存成功')
    } else {
      ElMessage.error(result.error || '保存失败')
    }
  } finally {
    seatingLoading.value = false
  }
}

onMounted(() => {
  loadClasses()
})
</script>

<style scoped>
.seating-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  padding: 24px;
  background: linear-gradient(135deg, #36d1dc 0%, #5b86e5 100%);
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
  overflow: auto;
}

.steps-container {
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
}

.step-card {
  margin-bottom: 20px;
}

.step-card.full-height {
  height: calc(100vh - 280px);
  margin-bottom: 0;
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

.loading-state {
  padding: 40px;
}

.empty-state {
  padding: 60px 0;
}

.class-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.class-card {
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.class-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.class-card.active {
  border-color: #409eff;
  background: #e7f4ff;
}

.class-info h3 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 18px;
}

.class-info p {
  margin: 0 0 8px 0;
  color: #666;
  font-size: 14px;
}

.class-stats {
  display: flex;
  gap: 8px;
}

.class-actions {
  color: #409eff;
  font-size: 20px;
}

.step-actions {
  text-align: center;
  padding: 20px 0;
  border-top: 1px solid #eee;
  margin-top: 20px;
}

.empty-layout {
  padding: 60px 0;
  text-align: center;
}

.layout-display {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.layout-info {
  margin-bottom: 20px;
}

.layout-visual {
  display: flex;
  justify-content: center;
  padding: 20px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #eee;
}

.mini-classroom {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 120px;
}

.mini-layout {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mini-podium {
  writing-mode: vertical-lr;
  text-orientation: mixed;
  padding: 20px 6px;
  background: #409eff;
  color: white;
  border-radius: 3px;
  font-size: 10px;
  font-weight: bold;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mini-seats {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mini-row {
  display: flex;
  gap: 3px;
}

.mini-seat {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background: #e7f4ff;
  border: 1px solid #409eff;
}

.mini-aisle {
  background: #f0f0f0;
  border: 1px dashed #ccc;
}

.mini-podium.mini-seat {
  background: #67c23a;
  border: 1px solid #67c23a;
}

.mini-empty {
  background: transparent;
  border: 1px dotted #ddd;
}

.arrangement-container {
  height: calc(100% - 60px);
  overflow: hidden;
}
</style>