<template>
  <el-dialog
    v-model="visible"
    title="设置座位布局"
    width="800px"
    @close="handleClose"
  >
    <div class="layout-designer">
      <!-- 配置面板 -->
      <div class="config-panel">
        <el-form :model="form" label-width="80px" size="small">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="行数">
                <el-input-number 
                  v-model="form.rows" 
                  :min="3" 
                  :max="16" 
                  @change="updateLayout"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="列数">
                <el-input-number 
                  v-model="form.columns" 
                  :min="4" 
                  :max="15" 
                  @change="updateLayout"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="编号模式">
                <el-select v-model="numberingMode" size="small">
                  <el-option label="行列式" value="row-column" />
                  <el-option label="S形" value="s-shape" />
                  <el-option label="Z形" value="z-shape" />
                  <el-option label="靠台S形" value="podium-s" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="编号方向">
                <el-select v-model="numberingDirection" size="small">
                  <el-option label="从上开始" value="top" />
                  <el-option label="从下开始" value="bottom" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
        
        <div class="tools">
          <el-button-group size="small">
            <el-button 
              :type="currentTool === 'seat' ? 'primary' : 'default'"
              @click="currentTool = 'seat'"
            >
              <el-icon><User /></el-icon>
              座位
            </el-button>
            <el-button 
              :type="currentTool === 'aisle' ? 'primary' : 'default'"
              @click="currentTool = 'aisle'"
            >
              <el-icon><More /></el-icon>
              过道
            </el-button>
            <el-button 
              :type="currentTool === 'podium' ? 'primary' : 'default'"
              @click="currentTool = 'podium'"
            >
              <el-icon><Platform /></el-icon>
              讲台
            </el-button>
            <el-button 
              :type="currentTool === 'empty' ? 'primary' : 'default'"
              @click="currentTool = 'empty'"
            >
              <el-icon><Delete /></el-icon>
              空白
            </el-button>
          </el-button-group>
        </div>
      </div>

      <!-- 布局预览 -->
      <div class="layout-preview">
        <div class="classroom">
          <div class="classroom-layout">
            <!-- 座位区域 -->
            <div class="seats-area">
              <div
                v-for="(row, rowIndex) in layout"
                :key="rowIndex"
                class="seat-row"
              >
                <div
                  v-for="(seat, colIndex) in row"
                  :key="colIndex"
                  :class="getSeatClass(seat)"
                  @click="handleSeatClick(rowIndex, colIndex)"
                >
                  <span v-if="seat.type === 'seat'" class="seat-number">
                    {{ getSeatNumber(rowIndex, colIndex) }}
                  </span>
                  <span v-else-if="seat.type === 'podium'">讲台</span>
                  <span v-else-if="seat.type === 'aisle'">过道</span>
                </div>
              </div>
            </div>
            
            <!-- 讲台区域（右侧） -->
            <div class="podium-area">
              <div class="podium">讲台</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 统计信息 -->
      <div class="stats">
        <el-descriptions :column="4" size="small" border>
          <el-descriptions-item label="总座位">{{ seatCount }}</el-descriptions-item>
          <el-descriptions-item label="行数">{{ form.rows }}</el-descriptions-item>
          <el-descriptions-item label="列数">{{ form.columns }}</el-descriptions-item>
          <el-descriptions-item label="布局">{{ form.rows }}×{{ form.columns }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button @click="resetLayout">重置</el-button>
        <el-button type="primary" @click="handleSave" :loading="loading">
          保存布局
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, toRaw } from 'vue'
import { ElMessage } from 'element-plus'
import { User, More, Platform, Delete } from '@element-plus/icons-vue'
import type { SeatPosition } from '../types/seating'

interface Props {
  modelValue: boolean
  classId: number
  initialConfig?: {
    rows: number
    columns: number
    layout?: SeatPosition[][]
    numbering_mode?: string
    numbering_direction?: string
  }
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const loading = ref(false)
const currentTool = ref<'seat' | 'aisle' | 'podium' | 'empty'>('seat')
const numberingMode = ref<'row-column' | 's-shape' | 'z-shape' | 'podium-s'>('row-column')
const numberingDirection = ref<'top' | 'bottom'>('top')

const form = ref({
  rows: 6,
  columns: 8
})

const layout = ref<SeatPosition[][]>([])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const seatCount = computed(() => {
  return layout.value.flat().filter(seat => seat.type === 'seat').length
})

// 计算座位编号
const getSeatNumber = (rowIndex: number, colIndex: number) => {
  const rows = layout.value.length
  const cols = layout.value[0]?.length || 0
  
  switch (numberingMode.value) {
    case 'row-column':
      if (numberingDirection.value === 'bottom') {
        return `${rows - rowIndex}-${colIndex + 1}`
      }
      return `${rowIndex + 1}-${colIndex + 1}`
      
    case 's-shape':
      // S形编号：奇数行从左到右，偶数行从右到左
      let sNumber = 0
      const sRowStart = numberingDirection.value === 'bottom' ? rows - 1 : 0
      const sRowEnd = numberingDirection.value === 'bottom' ? -1 : rows
      const sRowStep = numberingDirection.value === 'bottom' ? -1 : 1
      
      for (let r = sRowStart; numberingDirection.value === 'bottom' ? r > sRowEnd : r < sRowEnd; r += sRowStep) {
        for (let c = 0; c < cols; c++) {
          const actualCol = r % 2 === 0 ? c : cols - 1 - c
          if (layout.value[r] && layout.value[r][actualCol]?.type === 'seat') {
            sNumber++
            if (r === rowIndex && actualCol === colIndex) {
              return sNumber.toString()
            }
          }
        }
      }
      return '0'
      
    case 'z-shape':
      // Z形编号：按行顺序，每行都从左到右
      let zNumber = 0
      const zRowStart = numberingDirection.value === 'bottom' ? rows - 1 : 0
      const zRowEnd = numberingDirection.value === 'bottom' ? -1 : rows
      const zRowStep = numberingDirection.value === 'bottom' ? -1 : 1
      
      for (let r = zRowStart; numberingDirection.value === 'bottom' ? r > zRowEnd : r < zRowEnd; r += zRowStep) {
        for (let c = 0; c < cols; c++) {
          if (layout.value[r] && layout.value[r][c]?.type === 'seat') {
            zNumber++
            if (r === rowIndex && c === colIndex) {
              return zNumber.toString()
            }
          }
        }
      }
      return '0'
      
    case 'podium-s':
      // 靠讲台S形：确保1号座位始终在靠近讲台的位置
      // 在横向布局中讲台在右侧，所以靠讲台的位置是右侧
      let psNumber = 0
      const psRowStart = numberingDirection.value === 'bottom' ? rows - 1 : 0
      const psRowEnd = numberingDirection.value === 'bottom' ? -1 : rows
      const psRowStep = numberingDirection.value === 'bottom' ? -1 : 1
      
      for (let r = psRowStart; numberingDirection.value === 'bottom' ? r > psRowEnd : r < psRowEnd; r += psRowStep) {
        for (let c = 0; c < cols; c++) {
          // 靠台S形逻辑：
          // 1. 从下开始时：最下一行靠近讲台（右侧）的座位是1号
          // 2. 奇数行（相对于开始方向）从右到左，偶数行从左到右
          let actualCol
          if (numberingDirection.value === 'bottom') {
            // 从下开始：重新计算行索引以确保正确的S形
            const relativeRow = rows - 1 - r
            actualCol = relativeRow % 2 === 0 ? cols - 1 - c : c
          } else {
            // 从上开始：第0行（奇数行）从右到左，第1行（偶数行）从左到右
            actualCol = r % 2 === 0 ? cols - 1 - c : c
          }
          
          if (layout.value[r] && layout.value[r][actualCol]?.type === 'seat') {
            psNumber++
            if (r === rowIndex && actualCol === colIndex) {
              return psNumber.toString()
            }
          }
        }
      }
      return '0'
      
    default:
      return `${rowIndex + 1}-${colIndex + 1}`
  }
}

// 初始化布局
const initLayout = () => {
  layout.value = []
  for (let row = 0; row < form.value.rows; row++) {
    const rowSeats: SeatPosition[] = []
    for (let col = 0; col < form.value.columns; col++) {
      rowSeats.push({
        row: row + 1,
        column: col + 1,
        type: 'seat',
        occupied: false
      })
    }
    layout.value.push(rowSeats)
  }
}

// 更新布局
const updateLayout = () => {
  const newLayout: SeatPosition[][] = []
  
  for (let row = 0; row < form.value.rows; row++) {
    const rowSeats: SeatPosition[] = []
    for (let col = 0; col < form.value.columns; col++) {
      // 保留原有的座位类型，如果位置存在的话
      const existingSeat = layout.value[row]?.[col]
      rowSeats.push({
        row: row + 1,
        column: col + 1,
        type: existingSeat?.type || 'seat',
        occupied: false
      })
    }
    newLayout.push(rowSeats)
  }
  
  layout.value = newLayout
}

// 重置布局
const resetLayout = () => {
  initLayout()
}

// 获取座位样式类
const getSeatClass = (seat: SeatPosition) => {
  return [
    'seat-cell',
    `seat-${seat.type}`,
    { 'occupied': seat.occupied }
  ]
}

// 点击座位
const handleSeatClick = (rowIndex: number, colIndex: number) => {
  const seat = layout.value[rowIndex][colIndex]
  seat.type = currentTool.value
  
  // 如果设置为空白，则不能被占用
  if (seat.type === 'empty') {
    seat.occupied = false
  }
}

// 保存布局
const handleSave = async () => {
  loading.value = true
  try {
    // 使用 toRaw() 和 JSON 序列化来清理响应式对象
    const rawLayout = toRaw(layout.value)
    const seatLayoutData = JSON.parse(JSON.stringify(rawLayout))
    
    const result = await window.electronAPI.seating.saveClassConfig({
      class_id: props.classId,
      rows: form.value.rows,
      columns: form.value.columns,
      seat_layout: seatLayoutData,
      numbering_mode: numberingMode.value,
      numbering_direction: numberingDirection.value
    })
    
    if (result.success) {
      ElMessage.success('座位布局保存成功')
      emit('saved')
      handleClose()
    } else {
      ElMessage.error(result.error || '保存失败')
    }
  } catch (error) {
    console.error('保存座位布局失败:', error)
    ElMessage.error('保存失败')
  } finally {
    loading.value = false
  }
}

// 关闭对话框
const handleClose = () => {
  emit('update:modelValue', false)
}

// 监听初始配置变化
watch(() => props.initialConfig, (config) => {
  if (config) {
    form.value.rows = config.rows
    form.value.columns = config.columns
    
    // 加载保存的编号模式和方向
    if (config.numbering_mode) {
      numberingMode.value = config.numbering_mode as 'row-column' | 's-shape' | 'z-shape' | 'podium-s'
    }
    if (config.numbering_direction) {
      numberingDirection.value = config.numbering_direction as 'top' | 'bottom'
    }
    
    if (config.layout) {
      layout.value = config.layout
    } else {
      initLayout()
    }
  }
}, { immediate: true })

// 监听对话框显示
watch(visible, (isVisible) => {
  if (isVisible && !props.initialConfig) {
    initLayout()
  }
})
</script>

<style scoped>
.layout-designer {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.config-panel {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 16px;
  background: #fafafa;
}

.tools {
  margin-top: 16px;
}

.layout-preview {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  background: #fff;
  min-height: 300px;
}

.classroom {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.classroom-layout {
  display: flex;
  align-items: center;
  gap: 20px;
  width: 100%;
  max-width: 800px;
}

.podium-area {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 60px;
}

.podium {
  writing-mode: vertical-lr;
  text-orientation: mixed;
  padding: 30px 8px;
  background: #409eff;
  color: white;
  border-radius: 4px;
  font-weight: bold;
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.seats-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.seat-row {
  display: flex;
  justify-content: center;
  gap: 6px;
}

.seat-cell {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 10px;
  font-weight: bold;
}

.seat-seat {
  background: #e7f4ff;
  border: 2px solid #409eff;
  color: #409eff;
}

.seat-seat:hover {
  background: #409eff;
  color: white;
}

.seat-aisle {
  background: #f0f0f0;
  border: 2px dashed #ccc;
  color: #999;
}

.seat-podium {
  background: #67c23a;
  border: 2px solid #67c23a;
  color: white;
}

.seat-empty {
  background: transparent;
  border: 2px dotted #ddd;
  color: #ddd;
}

.seat-number {
  font-size: 8px;
}

.stats {
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
}

.dialog-footer {
  display: flex;
  gap: 8px;
}
</style>