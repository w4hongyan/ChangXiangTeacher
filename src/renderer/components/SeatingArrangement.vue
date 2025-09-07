<template>
  <div class="seating-arrangement">
    <!-- 班级信息栏 -->
    <div class="class-info">
      <div class="info-content">
        <h3>{{ arrangement?.class_name }}</h3>
        <div class="stats">
          <el-tag type="info">总学生: {{ arrangement?.total_students || 0 }}</el-tag>
          <el-tag type="success">已安排: {{ arrangement?.assigned_students || 0 }}</el-tag>
          <el-tag type="warning">未安排: {{ (arrangement?.total_students || 0) - (arrangement?.assigned_students || 0) }}</el-tag>
        </div>
      </div>
      <div class="controls">
        <div class="numbering-mode">
          <span class="mode-label">座位编号:</span>
          <el-select v-model="numberingMode" size="small" style="width: 120px; margin-right: 8px;">
            <el-option label="行列式" value="row-column" />
            <el-option label="S形" value="s-shape" />
            <el-option label="Z形" value="z-shape" />
            <el-option label="靠台S形" value="podium-s" />
          </el-select>
          <el-select v-model="numberingDirection" size="small" style="width: 100px;">
            <el-option label="从上开始" value="top" />
            <el-option label="从下开始" value="bottom" />
          </el-select>
        </div>
        <div class="actions">
          <el-button type="success" @click="handleAutoAssign" :loading="loading">
            <el-icon><Star /></el-icon>
            自动分配
          </el-button>
          <el-button type="primary" @click="handleSaveArrangement" :loading="loading">
            <el-icon><DocumentAdd /></el-icon>
            保存排位
          </el-button>
          <el-dropdown @command="handleExportCommand" trigger="click">
            <el-button type="info" :loading="loading">
              <el-icon><Download /></el-icon>
              导出
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="excel">
                  <el-icon><Document /></el-icon>
                  导出Excel
                </el-dropdown-item>
                <el-dropdown-item command="image">
                  <el-icon><Picture /></el-icon>
                  导出图片
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button @click="handleClearAll">
            <el-icon><Delete /></el-icon>
            清空座位
          </el-button>
        </div>
      </div>
    </div>

    <div class="arrangement-content">
      <!-- 座位区域 -->
      <div class="seating-area" ref="seatingAreaRef">
        <div class="classroom">
          <!-- 座位布局 -->
          <div class="classroom-layout">
            <!-- 座位区域 -->
            <div class="seats-grid" v-if="arrangement?.layout">
              <div
                v-for="(row, rowIndex) in arrangement.layout.seats"
                :key="rowIndex"
                class="seat-row"
              >
                <div
                  v-for="(seat, colIndex) in row"
                  :key="colIndex"
                  :class="getSeatClass(seat, rowIndex, colIndex)"
                  @click="handleSeatClick(rowIndex + 1, colIndex + 1)"
                  @drop="handleDrop($event, rowIndex + 1, colIndex + 1)"
                  @dragover="handleDragOver"
                >
                  <div v-if="seat.type === 'seat'" class="seat-content">
                    <div class="seat-number">{{ getSeatNumber(rowIndex, colIndex) }}</div>
                    <div v-if="seat.student_name" class="student-info">
                      <div class="student-name">{{ seat.student_name }}</div>
                    </div>
                    <div v-else class="empty-seat">空座位</div>
                  </div>
                  <div v-else-if="seat.type === 'aisle'" class="aisle-content">过道</div>
                  <div v-else-if="seat.type === 'podium'" class="podium-content">讲台</div>
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

      <!-- 学生列表 -->
      <div class="students-panel">
        <div class="panel-header">
          <h4>未分配学生</h4>
          <el-badge :value="arrangement?.unassigned_students?.length || 0" type="warning">
            <el-icon><UserFilled /></el-icon>
          </el-badge>
        </div>
        
        <div class="students-list">
          <div
            v-for="student in arrangement?.unassigned_students"
            :key="student.id"
            class="student-item"
            draggable="true"
            @dragstart="handleDragStart($event, student)"
          >
            <div class="student-avatar">
              <el-icon><User /></el-icon>
            </div>
            <div class="student-details">
              <div class="student-name">{{ student.name }}</div>
              <div class="student-id">{{ student.student_id || '无学号' }}</div>
            </div>
            <div class="student-gender">
              <el-tag :type="student.gender === '男' ? 'primary' : 'danger'" size="small">
                {{ student.gender || '未知' }}
              </el-tag>
            </div>
          </div>
          
          <div v-if="!arrangement?.unassigned_students?.length" class="empty-students">
            <el-empty description="所有学生都已分配座位" :image-size="60" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Star, Delete, UserFilled, User, DocumentAdd, Download, ArrowDown, Document, Picture } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'
import html2canvas from 'html2canvas'
import type { SeatingArrangement, SeatPosition, UnassignedStudent } from '../types/seating'

interface Props {
  arrangement: SeatingArrangement | null
  loading?: boolean
  savedNumberingMode?: string
  savedNumberingDirection?: string
}

interface Emits {
  (e: 'assign-student', data: { student_id: number; row: number; column: number }): void
  (e: 'remove-student', data: { row: number; column: number }): void
  (e: 'auto-assign', data: { numberingMode: string; numberingDirection: string }): void
  (e: 'clear-all'): void
  (e: 'save-arrangement'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

let draggedStudent: UnassignedStudent | null = null

// DOM引用
const seatingAreaRef = ref<HTMLElement>()

// 座位编号模式
const numberingMode = ref<'row-column' | 's-shape' | 'z-shape' | 'podium-s'>('row-column')
// 编号方向
const numberingDirection = ref<'top' | 'bottom'>('top')

// 监听 props 中的保存设置并应用
watch(() => [props.savedNumberingMode, props.savedNumberingDirection], ([mode, direction]) => {
  if (mode) {
    numberingMode.value = mode as 'row-column' | 's-shape' | 'z-shape' | 'podium-s'
  }
  if (direction) {
    numberingDirection.value = direction as 'top' | 'bottom'
  }
}, { immediate: true })

// 计算座位编号
const getSeatNumber = (rowIndex: number, colIndex: number) => {
  if (!props.arrangement?.layout?.seats) return `${rowIndex + 1}-${colIndex + 1}`
  
  const layout = props.arrangement.layout.seats
  const rows = layout.length
  const cols = layout[0]?.length || 0
  
  // 根据方向调整行索引
  const actualRowIndex = numberingDirection.value === 'bottom' ? rows - 1 - rowIndex : rowIndex
  
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
          if (layout[r] && layout[r][actualCol]?.type === 'seat') {
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
          if (layout[r] && layout[r][c]?.type === 'seat') {
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
          
          if (layout[r] && layout[r][actualCol]?.type === 'seat') {
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

// 获取座位样式类
const getSeatClass = (seat: SeatPosition, rowIndex: number, colIndex: number) => {
  const classes = ['seat-cell', `seat-${seat.type}`]
  
  if (seat.type === 'seat') {
    classes.push(seat.student_name ? 'occupied' : 'empty')
  }
  
  return classes
}

// 获取座位中的学生信息
const getStudentInSeat = (row: number, column: number) => {
  return props.arrangement?.students.find(s => s.row === row && s.column === column)
}

// 点击座位
const handleSeatClick = async (row: number, column: number) => {
  const seat = props.arrangement?.layout.seats[row - 1]?.[column - 1]
  if (!seat || seat.type !== 'seat') return

  const student = getStudentInSeat(row, column)
  
  if (student) {
    // 获取当前编号模式下的座位编号
    const seatNumber = getSeatNumber(row - 1, column - 1)
    
    // 已有学生，询问是否移除
    try {
      await ElMessageBox.confirm(
        `确定要将 ${student.name} 从座位 ${seatNumber} 移除吗？`,
        '确认移除',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      
      emit('remove-student', { row, column })
    } catch {
      // 用户取消
    }
  }
}

// 开始拖拽学生
const handleDragStart = (event: DragEvent, student: UnassignedStudent) => {
  draggedStudent = student
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

// 拖拽悬停
const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

// 放置学生到座位
const handleDrop = (event: DragEvent, row: number, column: number) => {
  event.preventDefault()
  
  if (!draggedStudent) return
  
  const seat = props.arrangement?.layout.seats[row - 1]?.[column - 1]
  if (!seat || seat.type !== 'seat') {
    ElMessage.warning('无法分配到此位置')
    return
  }
  
  const existingStudent = getStudentInSeat(row, column)
  if (existingStudent) {
    ElMessage.warning('该座位已被占用')
    return
  }
  
  emit('assign-student', {
    student_id: draggedStudent.id,
    row,
    column
  })
  
  draggedStudent = null
}

// 自动分配座位
const handleAutoAssign = () => {
  emit('auto-assign', {
    numberingMode: numberingMode.value,
    numberingDirection: numberingDirection.value
  })
}

// 保存排位安排
const handleSaveArrangement = async () => {
  if (!props.arrangement?.assigned_students) {
    ElMessage.warning('请先分配学生到座位')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要保存当前的排位安排吗？\n\n已分配学生：${props.arrangement.assigned_students} 人\n未分配学生：${(props.arrangement.total_students || 0) - (props.arrangement.assigned_students || 0)} 人`,
      '确认保存',
      {
        confirmButtonText: '保存',
        cancelButtonText: '取消',
        type: 'info',
        dangerouslyUseHTMLString: false
      }
    )
    
    emit('save-arrangement')
  } catch {
    // 用户取消
  }
}

// 清空所有座位
const handleClearAll = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有座位安排吗？此操作不可恢复。',
      '确认清空',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    emit('clear-all')
  } catch {
    // 用户取消
  }
}

// 处理导出命令
const handleExportCommand = (command: string) => {
  if (!props.arrangement) {
    ElMessage.warning('请先设置座位安排')
    return
  }
  
  switch (command) {
    case 'excel':
      handleExportExcel()
      break
    case 'image':
      handleExportImage()
      break
  }
}

// 导出Excel
const handleExportExcel = () => {
  try {
    if (!props.arrangement?.layout?.seats) {
      ElMessage.error('没有座位布局数据')
      return
    }

    const className = props.arrangement.class_name || '未知班级'
    const layout = props.arrangement.layout.seats
    const rows = layout.length
    const cols = layout[0]?.length || 0

    // 创建工作簿
    const workbook = XLSX.utils.book_new()
    
    // 座位安排工作表
    const seatingData: any[][] = []
    
    // 标题行
    seatingData.push([`${className} 座位安排表`])
    seatingData.push([])
    
    // 统计信息
    seatingData.push(['统计信息'])
    seatingData.push(['总学生数:', props.arrangement.total_students || 0])
    seatingData.push(['已分配:', props.arrangement.assigned_students || 0])
    seatingData.push(['未分配:', (props.arrangement.total_students || 0) - (props.arrangement.assigned_students || 0)])
    seatingData.push(['编号模式:', getNumberingModeText()])
    seatingData.push(['编号方向:', numberingDirection.value === 'top' ? '从上开始' : '从下开始'])
    seatingData.push([])
    
    // 座位布局
    seatingData.push(['座位布局'])
    
    // 添加讲台标识
    const headerRow = new Array(cols + 1).fill('')
    headerRow[cols] = '讲台'
    seatingData.push(headerRow)
    
    // 添加座位数据
    for (let r = 0; r < rows; r++) {
      const row: any[] = []
      for (let c = 0; c < cols; c++) {
        const seat = layout[r][c]
        if (seat.type === 'seat') {
          const seatNumber = getSeatNumber(r, c)
          const studentName = seat.student_name || ''
          row.push(studentName ? `${seatNumber}: ${studentName}` : `${seatNumber}: [empty]`)
        } else if (seat.type === 'aisle') {
          row.push('[aisle]')
        } else {
          row.push('')
        }
      }
      row.push('') // 讲台列
      seatingData.push(row)
    }
    
    seatingData.push([])
    
    // 学生名单
    seatingData.push(['已分配学生名单'])
    seatingData.push(['座位号', '学生姓名', '行', '列'])
    
    if (props.arrangement.students) {
      props.arrangement.students.forEach(student => {
        const seatNumber = getSeatNumber(student.row - 1, student.column - 1)
        seatingData.push([seatNumber, student.name, student.row, student.column])
      })
    }
    
    if (props.arrangement.unassigned_students?.length) {
      seatingData.push([])
      seatingData.push(['未分配学生名单'])
      seatingData.push(['学生姓名', '学号', '性别'])
      
      props.arrangement.unassigned_students.forEach(student => {
        seatingData.push([student.name, student.student_id || '', student.gender || ''])
      })
    }
    
    // 创建工作表
    const worksheet = XLSX.utils.aoa_to_sheet(seatingData)
    
    // 设置列宽
    const colWidths = []
    for (let i = 0; i < cols + 1; i++) {
      colWidths.push({ wch: 15 })
    }
    worksheet['!cols'] = colWidths
    
    // 添加到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, '座位安排')
    
    // 生成文件名
    const now = new Date()
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
    const filename = `${className}_座位安排_${dateStr}_${timeStr}.xlsx`
    
    // 保存文件
    XLSX.writeFile(workbook, filename)
    
    ElMessage.success(`Excel导出成功：${filename}`)
  } catch (error) {
    console.error('Excel导出失败:', error)
    ElMessage.error('导出Excel失败')
  }
}

// 导出图片
const handleExportImage = async () => {
  try {
    if (!seatingAreaRef.value) {
      ElMessage.error('未找到座位区域')
      return
    }

    const className = props.arrangement?.class_name || '未知班级'
    
    // 临时添加标题元素
    const titleElement = document.createElement('div')
    titleElement.style.cssText = `
      position: absolute;
      top: 10px;
      left: 20px;
      font-size: 18px;
      font-weight: bold;
      color: #333;
      background: white;
      padding: 5px 10px;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      z-index: 10;
    `
    titleElement.textContent = `${className} 座位安排`
    seatingAreaRef.value.appendChild(titleElement)
    
    // 生成图片
    const canvas = await html2canvas(seatingAreaRef.value, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      logging: false,
      width: seatingAreaRef.value.scrollWidth,
      height: seatingAreaRef.value.scrollHeight
    })
    
    // 移除临时标题
    seatingAreaRef.value.removeChild(titleElement)
    
    // 下载图片
    const now = new Date()
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
    const filename = `${className}_座位安排_${dateStr}_${timeStr}.png`
    
    canvas.toBlob(blob => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        ElMessage.success(`图片导出成功：${filename}`)
      } else {
        ElMessage.error('生成图片失败')
      }
    }, 'image/png')
    
  } catch (error) {
    console.error('图片导出失败:', error)
    ElMessage.error('导出图片失败')
  }
}

// 获取编号模式文本
const getNumberingModeText = () => {
  switch (numberingMode.value) {
    case 'row-column':
      return '行列式'
    case 's-shape':
      return 'S形'
    case 'z-shape':
      return 'Z形'
    case 'podium-s':
      return '靠台S形'
    default:
      return '行列式'
  }
}
</script>

<style scoped>
.seating-arrangement {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.class-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: white;
  border-bottom: 1px solid #eee;
  flex-wrap: wrap;
  gap: 16px;
}

.info-content h3 {
  margin: 0 0 8px 0;
  color: #333;
}

.stats {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.controls {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.numbering-mode {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mode-label {
  font-size: 14px;
  color: #666;
  white-space: nowrap;
}

.actions {
  display: flex;
  gap: 8px;
}

.arrangement-content {
  flex: 1;
  display: flex;
  gap: 20px;
  padding: 20px;
  background: #f5f7fa;
}

.seating-area {
  flex: 1;
  background: white;
  border-radius: 8px;
  padding: 20px;
  overflow: auto;
  position: relative;
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
  gap: 30px;
  width: 100%;
  max-width: 1200px;
}

.podium-area {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
}

.podium {
  writing-mode: vertical-lr;
  text-orientation: mixed;
  padding: 40px 12px;
  background: #409eff;
  color: white;
  border-radius: 6px;
  font-weight: bold;
  font-size: 16px;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.seats-grid {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}

.seat-row {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.seat-cell {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.seat-seat {
  border: 2px solid #e4e7ed;
  background: #fafafa;
}

.seat-seat.occupied {
  border-color: #409eff;
  background: #e7f4ff;
}

.seat-seat.empty:hover {
  border-color: #409eff;
  background: #f0f9ff;
}

.seat-aisle {
  background: #f0f0f0;
  border: 2px dashed #ddd;
}

.seat-podium {
  background: #67c23a;
  border: 2px solid #67c23a;
}

.seat-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4px;
}

.seat-number {
  font-size: 10px;
  color: #999;
  margin-bottom: 2px;
}

.student-info {
  text-align: center;
}

.student-name {
  font-size: 12px;
  font-weight: bold;
  color: #333;
  line-height: 1.2;
}

.empty-seat {
  font-size: 10px;
  color: #ccc;
}

.aisle-content,
.podium-content {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #999;
}

.students-panel {
  width: 280px;
  background: white;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.panel-header h4 {
  margin: 0;
  color: #333;
}

.students-list {
  flex: 1;
  overflow-y: auto;
}

.student-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: move;
  transition: all 0.2s;
}

.student-item:hover {
  background: #f5f7fa;
  border-color: #409eff;
}

.student-item:active {
  opacity: 0.7;
}

.student-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e7f4ff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #409eff;
}

.student-details {
  flex: 1;
}

.student-name {
  font-weight: bold;
  color: #333;
  margin-bottom: 2px;
}

.student-id {
  font-size: 12px;
  color: #999;
}

.empty-students {
  padding: 40px 0;
  text-align: center;
}
</style>