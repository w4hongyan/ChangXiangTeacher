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
          <el-dropdown @command="handleAutoAssignCommand" trigger="click">
            <el-button type="success" :loading="loading">
              <el-icon><Star /></el-icon>
              自动分配
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="sequential">
                  <el-icon><Sort /></el-icon>
                  靠台优先平衡分配
                </el-dropdown-item>
                <el-dropdown-item command="balanced-row">
                  <el-icon><Grid /></el-icon>
                  按行平衡（靠台优先）
                </el-dropdown-item>
                <el-dropdown-item command="balanced-column">
                  <el-icon><Grid /></el-icon>
                  按列平衡（靠台优先）
                </el-dropdown-item>
                <el-dropdown-item command="podium-priority">
                  <el-icon><LocationInformation /></el-icon>
                  强制靠台优先
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
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
      <!-- 学生列表（上方） -->
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
            @dragend="handleDragEnd"
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
      
      <!-- 座位区域（下方） -->
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
                  :class="[
                    getSeatClass(seat, rowIndex, colIndex),
                    {
                      'drag-over': dragOverSeat?.row === rowIndex + 1 && dragOverSeat?.column === colIndex + 1,
                      'drag-valid': isDragging && seat.type === 'seat',
                      'drag-invalid': isDragging && seat.type !== 'seat'
                    }
                  ]"
                  @click="handleSeatClick(rowIndex + 1, colIndex + 1)"
                  @drop="handleDrop($event, rowIndex + 1, colIndex + 1)"
                  @dragover="handleDragOver"
                  @dragenter="handleDragEnter($event, rowIndex + 1, colIndex + 1)"
                  @dragleave="handleDragLeave"
                >
                  <div v-if="seat.type === 'seat'" class="seat-content">
                    <div class="seat-number">{{ getSeatNumber(rowIndex, colIndex) }}</div>
                    <div 
                      v-if="seat.student_name" 
                      class="student-info"
                      draggable="true"
                      @dragstart="handleSeatDragStart($event, rowIndex + 1, colIndex + 1, seat)"
                      @dragend="handleDragEnd"
                    >
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Star, Delete, UserFilled, User, DocumentAdd, Download, ArrowDown, Document, Picture, Sort, Grid, LocationInformation } from '@element-plus/icons-vue'
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
  (e: 'swap-students', data: { seat1: { row: number; column: number }; seat2: { row: number; column: number } }): void
  (e: 'auto-assign', data: { numberingMode: string; numberingDirection: string; strategy?: string }): void
  (e: 'clear-all'): void
  (e: 'save-arrangement'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

let draggedStudent: UnassignedStudent | null = null
let draggedSeat: { row: number; column: number; student: any } | null = null
let dragSource: 'unassigned' | 'seat' = 'unassigned'
const isDragging = ref(false)
const dragOverSeat = ref<{ row: number; column: number } | null>(null)

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

// 开始拖拽学生（从未分配列表）
const handleDragStart = (event: DragEvent, student: UnassignedStudent) => {
  draggedStudent = student
  draggedSeat = null
  dragSource = 'unassigned'
  isDragging.value = true
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', student.name)
  }
}

// 开始拖拽学生（从座位）
const handleSeatDragStart = (event: DragEvent, row: number, column: number, seat: any) => {
  const student = getStudentInSeat(row, column)
  if (!student) return
  
  draggedStudent = null
  draggedSeat = { row, column, student }
  dragSource = 'seat'
  isDragging.value = true
  
  // 添加拖拽样式
  const target = event.target as HTMLElement
  target.classList.add('dragging')
  
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', student.name)
  }
}

// 拖拽悬停
const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

// 拖拽进入座位
const handleDragEnter = (event: DragEvent, row: number, column: number) => {
  event.preventDefault()
  const seat = props.arrangement?.layout.seats[row - 1]?.[column - 1]
  if (seat?.type === 'seat') {
    dragOverSeat.value = { row, column }
  }
}

// 拖拽离开座位
const handleDragLeave = (event: DragEvent) => {
  event.preventDefault()
  dragOverSeat.value = null
}

// 拖拽结束
const handleDragEnd = (event: DragEvent) => {
  isDragging.value = false
  dragOverSeat.value = null
  
  // 移除所有拖拽样式
  const target = event.target as HTMLElement
  target.classList.remove('dragging')
  document.querySelectorAll('.dragging').forEach(el => {
    el.classList.remove('dragging')
  })
}

// 放置学生到座位
const handleDrop = (event: DragEvent, row: number, column: number) => {
  event.preventDefault()
  
  const seat = props.arrangement?.layout.seats[row - 1]?.[column - 1]
  if (!seat || seat.type !== 'seat') {
    ElMessage.warning('无法分配到此位置')
    return
  }
  
  const existingStudent = getStudentInSeat(row, column)
  
  if (dragSource === 'unassigned' && draggedStudent) {
    // 从未分配列表拖拽到座位
    if (existingStudent) {
      ElMessage.warning('该座位已被占用')
      return
    }
    
    emit('assign-student', {
      student_id: draggedStudent.id,
      row,
      column
    })
  } else if (dragSource === 'seat' && draggedSeat) {
    // 从座位拖拽到另一个座位
    if (draggedSeat.row === row && draggedSeat.column === column) {
      // 拖拽到同一个座位，不做任何操作
      return
    }
    
    if (existingStudent) {
      // 目标座位有人，交换位置
      emit('swap-students', {
        seat1: { row: draggedSeat.row, column: draggedSeat.column },
        seat2: { row, column }
      })
      ElMessage.success(`${draggedSeat.student.name} 和 ${existingStudent.name} 已交换位置`)
    } else {
      // 目标座位空着，移动学生
      emit('assign-student', {
        student_id: draggedSeat.student.id,
        row,
        column
      })
      emit('remove-student', { 
        row: draggedSeat.row, 
        column: draggedSeat.column 
      })
    }
  }
  
  // 清理拖拽状态
  isDragging.value = false
  dragOverSeat.value = null
  draggedStudent = null
  draggedSeat = null
  
  // 移除所有拖拽样式
  document.querySelectorAll('.dragging').forEach(el => {
    el.classList.remove('dragging')
  })
}

// 处理自动分配命令
const handleAutoAssignCommand = (command: string) => {
  let strategy = 'sequential' // 默认策略
  let useNumberingMode = numberingMode.value
  let useNumberingDirection = numberingDirection.value
  
  switch (command) {
    case 'sequential':
      strategy = 'sequential'
      break
    case 'balanced-row':
      strategy = 'balanced-row'
      break
    case 'balanced-column':
      strategy = 'balanced-column'
      break
    case 'podium-priority':
      strategy = 'podium-priority'
      // 靠台优先分配自动使用靠台S形模式
      useNumberingMode = 'podium-s'
      break
  }
  
  emit('auto-assign', {
    numberingMode: useNumberingMode,
    numberingDirection: useNumberingDirection,
    strategy
  })
}

// 自动分配座位（兼容原有接口）
const handleAutoAssign = () => {
  emit('auto-assign', {
    numberingMode: numberingMode.value,
    numberingDirection: numberingDirection.value,
    strategy: 'sequential'
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
    
    // 创建工作簿
    const workbook = XLSX.utils.book_new()
    
    // 获取已分配学生数据并按座位号排序
    const assignedStudents = []
    if (props.arrangement.students) {
      props.arrangement.students.forEach(student => {
        const seatNumber = getSeatNumber(student.row - 1, student.column - 1)
        assignedStudents.push({
          seatNumber: parseInt(seatNumber) || 999, // 转为数字便于排序，无效座位号排在最后
          seatNumberText: seatNumber,
          name: student.name,
          row: student.row,
          column: student.column
        })
      })
    }
    
    // 按座位号从小到大排序
    assignedStudents.sort((a, b) => a.seatNumber - b.seatNumber)
    
    // 准备Excel数据
    const excelData = []
    
    // 添加标题
    excelData.push([`${className} 座位安排表`])
    excelData.push([]) // 空行
    
    // 添加统计信息
    excelData.push(['统计信息'])
    excelData.push(['总学生数', props.arrangement.total_students || 0])
    excelData.push(['已分配', props.arrangement.assigned_students || 0])
    excelData.push(['未分配', (props.arrangement.total_students || 0) - (props.arrangement.assigned_students || 0)])
    excelData.push(['编号模式', getNumberingModeText()])
    excelData.push(['编号方向', numberingDirection.value === 'top' ? '从上开始' : '从下开始'])
    excelData.push([]) // 空行
    
    // 添加学生名单表头
    excelData.push(['已分配学生名单'])
    excelData.push(['序号', '座位号', '学生姓名', '行', '列'])
    
    // 添加学生数据
    assignedStudents.forEach((student, index) => {
      excelData.push([
        index + 1,
        student.seatNumberText,
        student.name,
        student.row,
        student.column
      ])
    })
    
    // 创建工作表
    const worksheet = XLSX.utils.aoa_to_sheet(excelData)
    
    // 设置列宽
    worksheet['!cols'] = [
      { wch: 8 },  // 序号
      { wch: 12 }, // 座位号
      { wch: 15 }, // 学生姓名
      { wch: 8 },  // 行
      { wch: 8 }   // 列
    ]
    
    // 设置样式和边框
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:E1')
    
    // 遍历所有单元格添加样式
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
        if (!worksheet[cellAddress]) worksheet[cellAddress] = { t: 's', v: '' }
        
        // 基础样式
        const cellStyle = {
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } }
          },
          alignment: { horizontal: 'center', vertical: 'center' },
          font: { name: '微软雅黑', size: 11 }
        }
        
        // 标题行样式（第一行）
        if (R === 0) {
          cellStyle.font = { name: '微软雅黑', size: 14, bold: true }
          cellStyle.fill = { fgColor: { rgb: 'E7F4FF' } }
        }
        // 统计信息标题行样式
        else if (R === 2) {
          cellStyle.font = { name: '微软雅黑', size: 12, bold: true }
          cellStyle.fill = { fgColor: { rgb: 'F0F9FF' } }
        }
        // 学生名单标题行样式
        else if (excelData[R] && excelData[R][0] === '已分配学生名单') {
          cellStyle.font = { name: '微软雅黑', size: 12, bold: true }
          cellStyle.fill = { fgColor: { rgb: 'F0F9FF' } }
        }
        // 表头样式
        else if (excelData[R] && excelData[R][0] === '序号') {
          cellStyle.font = { name: '微软雅黑', size: 11, bold: true }
          cellStyle.fill = { fgColor: { rgb: 'F5F5F5' } }
        }
        // 数据行样式（奇偶行不同背景色）
        else if (R > 0 && excelData[R] && typeof excelData[R][0] === 'number') {
          if (excelData[R][0] % 2 === 0) {
            cellStyle.fill = { fgColor: { rgb: 'FAFAFA' } }
          }
        }
        
        worksheet[cellAddress].s = cellStyle
      }
    }
    
    // 合并标题单元格
    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // 标题行合并
      { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } }, // 统计信息标题合并
    ]
    
    // 查找学生名单标题行位置并合并
    for (let i = 0; i < excelData.length; i++) {
      if (excelData[i] && excelData[i][0] === '已分配学生名单') {
        worksheet['!merges'].push({ s: { r: i, c: 0 }, e: { r: i, c: 4 } })
        break
      }
    }
    
    // 添加到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, '座位安排')
    
    // 生成文件名
    const now = new Date()
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
    const filename = `${className}_座位安排_${dateStr}_${timeStr}.xlsx`
    
    // 保存文件
    XLSX.writeFile(workbook, filename)
    
    ElMessage.success(`Excel导出成功：${filename}（共${assignedStudents.length}名学生）`)
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
    
    // 临时添加标题元素（放在底部）
    const titleElement = document.createElement('div')
    titleElement.style.cssText = `
      position: absolute;
      bottom: 10px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 18px;
      font-weight: bold;
      color: #333;
      background: white;
      padding: 8px 16px;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      z-index: 10;
      white-space: nowrap;
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
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  background: #f5f7fa;
}

.students-panel {
  background: white;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  max-height: 200px;
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
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.student-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid #eee;
  border-radius: 6px;
  cursor: move;
  transition: all 0.2s;
  min-width: 120px;
  flex-shrink: 0;
  user-select: none;
}

.student-item:hover {
  background: #f5f7fa;
  border-color: #409eff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
}

.student-item:active {
  opacity: 0.8;
  transform: translateY(0);
}

.student-item.dragging {
  opacity: 0.6;
  transform: rotate(-2deg) scale(0.95);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.student-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e7f4ff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #409eff;
  font-size: 12px;
}

.student-details {
  flex: 1;
  min-width: 0;
}

.student-name {
  font-weight: bold;
  color: #333;
  margin-bottom: 1px;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.student-id {
  font-size: 11px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.student-gender {
  flex-shrink: 0;
}

.empty-students {
  padding: 20px 0;
  text-align: center;
  width: 100%;
}

.seating-area {
  flex: 1;
  background: white;
  border-radius: 8px;
  padding: 20px;
  overflow: auto;
  position: relative;
  min-height: 400px;
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
  cursor: move;
  transition: all 0.2s;
  padding: 2px;
  border-radius: 4px;
  user-select: none;
}

.student-info:hover {
  background: rgba(64, 158, 255, 0.15);
  border: 1px dashed #409eff;
  transform: scale(1.02);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.student-info:active {
  opacity: 0.8;
  transform: scale(0.98);
}

.student-info.dragging {
  opacity: 0.5;
  transform: rotate(3deg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* 拖拽状态下的座位样式 */
.seat-cell.drag-over {
  background: rgba(64, 158, 255, 0.2) !important;
  border-color: #409eff !important;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.4);
  animation: dragPulse 1s infinite;
}

.seat-cell.drag-valid {
  border-style: dashed;
  border-color: #67c23a;
}

.seat-cell.drag-invalid {
  border-style: dashed;
  border-color: #f56c6c;
  opacity: 0.5;
}

@keyframes dragPulse {
  0%, 100% {
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.4);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.2);
  }
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


</style>