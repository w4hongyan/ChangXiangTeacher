<template>
  <div class="seating-point-container">
    <div class="seating-point-header">
      <h3>座位图积分操作</h3>
      <div class="controls">
        <el-button 
          type="primary" 
          @click="showPointDialog(null)"
          :disabled="selectedStudents.length === 0"
        >
          为选中学生({{ selectedStudents.length }})添加积分
        </el-button>
        <el-button @click="clearSelection">清空选择</el-button>
      </div>
    </div>
    
    <div class="seating-point-content">
      <div v-if="arrangement" class="seating-map">
        <div 
          v-for="(row, rowIndex) in arrangement.layout.seats" 
          :key="rowIndex" 
          class="seat-row"
        >
          <div
            v-for="(seat, colIndex) in row"
            :key="colIndex"
            :class="[
              'seat',
              seat.type === 'seat' ? 'seat-available' : 'seat-unavailable',
              isSelected(rowIndex + 1, colIndex + 1) ? 'seat-selected' : '',
              seat.student_name ? 'seat-occupied' : 'seat-empty'
            ]"
            @click="handleSeatClick(rowIndex + 1, colIndex + 1, seat)"
          >
            <div v-if="seat.type === 'seat'" class="seat-content">
              <div class="seat-number">{{ getSeatNumber(rowIndex, colIndex) }}</div>
              <div 
                v-if="seat.student_name" 
                class="seat-student"
                @dblclick="showPointDialog(getStudentInSeat(rowIndex + 1, colIndex + 1))"
              >
                {{ seat.student_name }}
              </div>
              <div v-else class="seat-empty-label">空座位</div>
            </div>
            <div v-else-if="seat.type === 'aisle'" class="aisle-content">
              过道
            </div>
            <div v-else-if="seat.type === 'podium'" class="podium-content">
              讲台
            </div>
          </div>
        </div>
      </div>
      <div v-else class="seating-map-empty">
        <el-empty description="暂无座位数据" />
      </div>
    </div>
    
    <!-- 积分操作对话框 -->
    <el-dialog v-model="showPointDialogVisible" title="积分操作" width="500px">
      <el-form :model="pointForm" label-width="80px">
        <el-form-item label="学生">
          <div v-if="pointTargetStudent" class="student-info">
            <el-tag>{{ pointTargetStudent.name }}</el-tag>
          </div>
          <div v-else>
            <el-tag v-for="student in selectedStudents" :key="student.id" style="margin-right: 5px;">
              {{ student.name }}
            </el-tag>
          </div>
        </el-form-item>
        
        <el-form-item label="积分类型">
          <el-radio-group v-model="pointForm.type">
            <el-radio label="reward">奖励</el-radio>
            <el-radio label="penalty">惩罚</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="积分值">
          <el-input-number 
            v-model="pointForm.points" 
            :min="1" 
            :max="100" 
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="原因">
          <el-input 
            v-model="pointForm.reason" 
            type="textarea" 
            placeholder="请输入积分原因"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showPointDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitPoint">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { SeatingArrangement } from '../types/seating'

interface Props {
  arrangement: SeatingArrangement | null
  loading?: boolean
  numberingMode?: string
  numberingDirection?: string
}

interface Emits {
  (e: 'add-point', data: { student_id: number; points: number; type: string; reason: string }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const selectedSeats = ref<Set<string>>(new Set())
const showPointDialogVisible = ref(false)
const pointTargetStudent = ref<any>(null)

const pointForm = ref({
  points: 1,
  type: 'reward',
  reason: ''
})

// 计算属性
const selectedStudents = computed(() => {
  if (!props.arrangement) return []
  
  const students: any[] = []
  selectedSeats.value.forEach(seatKey => {
    const [row, col] = seatKey.split('-').map(Number)
    const seat = props.arrangement?.layout.seats[row - 1][col - 1]
    if (seat && seat.student_id && seat.student_name) {
      students.push({
        id: seat.student_id,
        name: seat.student_name,
        row,
        col
      })
    }
  })
  
  return students
})

// 方法
const getStudentInSeat = (row: number, column: number) => {
  return props.arrangement?.students.find(s => s.row === row && s.column === column)
}

const isSelected = (row: number, col: number) => {
  return selectedSeats.value.has(`${row}-${col}`)
}

const handleSeatClick = (row: number, col: number, seat: any) => {
  if (seat.type !== 'seat') return
  
  const seatKey = `${row}-${col}`
  if (selectedSeats.value.has(seatKey)) {
    selectedSeats.value.delete(seatKey)
  } else {
    if (seat.student_name) {
      selectedSeats.value.add(seatKey)
    }
  }
}

const showPointDialog = (student: any) => {
  if (student) {
    // 单个学生积分
    pointTargetStudent.value = student
  } else {
    // 批量积分
    pointTargetStudent.value = null
  }
  showPointDialogVisible.value = true
}

const submitPoint = async () => {
  if (!pointForm.value.reason) {
    ElMessage.warning('请输入积分原因')
    return
  }
  
  if (pointTargetStudent.value) {
    // 单个学生积分
    emit('add-point', {
      student_id: pointTargetStudent.value.id,
      points: pointForm.value.points,
      type: pointForm.value.type,
      reason: pointForm.value.reason
    })
  } else {
    // 批量积分
    for (const student of selectedStudents.value) {
      emit('add-point', {
        student_id: student.id,
        points: pointForm.value.points,
        type: pointForm.value.type,
        reason: pointForm.value.reason
      })
    }
  }
  
  // 重置表单
  pointForm.value = {
    points: 1,
    type: 'reward',
    reason: ''
  }
  
  // 清空选择
  if (!pointTargetStudent.value) {
    clearSelection()
  }
  
  showPointDialogVisible.value = false
  pointTargetStudent.value = null
}

const clearSelection = () => {
  selectedSeats.value.clear()
}

const getSeatNumber = (rowIndex: number, colIndex: number) => {
  if (!props.arrangement?.layout?.seats) return `${rowIndex + 1}-${colIndex + 1}`
  
  const layout = props.arrangement.layout.seats
  const rows = layout.length
  const cols = layout[0]?.length || 0
  
  // 简化编号逻辑，使用行列式编号
  return `${rowIndex + 1}-${colIndex + 1}`
}
</script>

<style scoped>
.seating-point-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.seating-point-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
}

.seating-point-header h3 {
  margin: 0;
  color: #303133;
}

.controls {
  display: flex;
  gap: 10px;
}

.seating-point-content {
  flex: 1;
  overflow: auto;
  padding: 20px;
}

.seating-map {
  display: inline-block;
  padding: 20px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.seat-row {
  display: flex;
  margin-bottom: 8px;
}

.seat {
  width: 90px;
  height: 90px;
  margin: 3px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  border: 2px solid transparent;
}

.seat-available {
  background: #f8f9fa;
  border-color: #e9ecef;
}

.seat-unavailable {
  background: #e9ecef;
  border-color: #ced4da;
  cursor: not-allowed;
}

.seat-occupied {
  background: #e7f3ff;
  border-color: #b3d9ff;
}

.seat-empty {
  background: #f8f9fa;
  border-color: #e9ecef;
}

.seat-selected {
  background: #409eff;
  color: white;
  border-color: #409eff;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.3);
}

.seat-content {
  text-align: center;
  width: 100%;
}

.seat-number {
  position: absolute;
  top: 4px;
  left: 4px;
  font-size: 10px;
  font-weight: bold;
  color: #909399;
}

.seat-selected .seat-number {
  color: white;
}

.seat-student {
  font-size: 14px;
  font-weight: 500;
  margin-top: 15px;
  padding: 5px;
  border-radius: 3px;
  transition: background-color 0.2s;
}

.seat-student:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.seat-selected .seat-student {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
}

.seat-empty-label {
  font-size: 12px;
  color: #909399;
}

.seat-selected .seat-empty-label {
  color: white;
}

.aisle-content, .podium-content {
  font-size: 12px;
  color: #909399;
  font-weight: bold;
}

.seating-map-empty {
  text-align: center;
  padding: 60px 0;
}

.student-info {
  margin-bottom: 10px;
}
</style>