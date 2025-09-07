import { ipcMain, IpcMainInvokeEvent } from 'electron'
import type { DatabaseManager } from '../database'
import type { SeatingFormData, ClassConfig, SeatPosition } from '../../renderer/types/seating'

export function setupSeatingHandlers(db: DatabaseManager) {
  // 获取班级座位配置
  const handleGetClassConfig = async (_: IpcMainInvokeEvent, classId: number) => {
    try {
      const query = `
        SELECT 
          cc.*,
          c.name as class_name,
          c.grade,
          c.class_number
        FROM class_configs cc
        LEFT JOIN classes c ON cc.class_id = c.id
        WHERE cc.class_id = ?
      `
      const config = await db.get(query, [classId])
      
      if (!config) {
        // 如果没有配置，返回默认配置
        return {
          success: true,
          data: {
            class_id: classId,
            rows: 6,
            columns: 8,
            seat_layout: null,
            numbering_mode: 'row-column',
            numbering_direction: 'top'
          }
        }
      }

      // 解析座位布局
      if (config.seat_layout) {
        try {
          config.seat_layout = JSON.parse(config.seat_layout)
        } catch (e) {
          config.seat_layout = null
        }
      }

      return { success: true, data: config }
    } catch (error) {
      console.error('获取班级配置失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '获取班级配置失败' }
    }
  }
  ipcMain.handle('seating:getClassConfig', handleGetClassConfig)

  // 保存班级座位配置
  const handleSaveClassConfig = async (_: IpcMainInvokeEvent, data: SeatingFormData) => {
    try {
      // 检查班级是否存在
      const classExists = await db.get('SELECT id FROM classes WHERE id = ? AND is_active = 1', [data.class_id])
      if (!classExists) {
        return { success: false, error: '班级不存在' }
      }

      // 检查是否已有配置
      const existingConfig = await db.get('SELECT id FROM class_configs WHERE class_id = ?', [data.class_id])
      
      if (existingConfig) {
        // 更新现有配置
        const updateQuery = `
          UPDATE class_configs 
          SET rows = ?, columns = ?, seat_layout = ?, numbering_mode = ?, numbering_direction = ?, updated_at = CURRENT_TIMESTAMP
          WHERE class_id = ?
        `
        await db.run(updateQuery, [
          data.rows,
          data.columns,
          JSON.stringify(data.seat_layout),
          data.numbering_mode || 'row-column',
          data.numbering_direction || 'top',
          data.class_id
        ])
      } else {
        // 创建新配置
        const insertQuery = `
          INSERT INTO class_configs (class_id, rows, columns, seat_layout, numbering_mode, numbering_direction)
          VALUES (?, ?, ?, ?, ?, ?)
        `
        await db.run(insertQuery, [
          data.class_id,
          data.rows,
          data.columns,
          JSON.stringify(data.seat_layout),
          data.numbering_mode || 'row-column',
          data.numbering_direction || 'top'
        ])
      }

      return { success: true }
    } catch (error) {
      console.error('保存班级配置失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '保存班级配置失败' }
    }
  }
  ipcMain.handle('seating:saveClassConfig', handleSaveClassConfig)

  // 获取班级座位安排
  const handleGetSeatingArrangement = async (_: IpcMainInvokeEvent, classId: number) => {
    try {
      // 获取班级信息和配置
      const classQuery = `
        SELECT 
          c.*,
          cc.rows,
          cc.columns,
          cc.seat_layout
        FROM classes c
        LEFT JOIN class_configs cc ON c.id = cc.class_id
        WHERE c.id = ? AND c.is_active = 1
      `
      const classInfo = await db.get(classQuery, [classId])
      
      if (!classInfo) {
        return { success: false, error: '班级不存在' }
      }

      // 获取班级所有学生
      const studentsQuery = `
        SELECT id, name, student_id, gender
        FROM students 
        WHERE class_id = ? AND is_active = 1
        ORDER BY name
      `
      const allStudents = await db.all(studentsQuery, [classId])

      // 获取当前座位安排
      const seatsQuery = `
        SELECT 
          s.*,
          st.name as student_name,
          st.student_id,
          st.gender
        FROM seats s
        LEFT JOIN students st ON s.student_id = st.id
        WHERE s.class_id = ?
        ORDER BY s.row, s.column
      `
      const seats = await db.all(seatsQuery, [classId])

      // 解析座位布局
      let seatLayoutArray = null
      if (classInfo.seat_layout) {
        try {
          seatLayoutArray = JSON.parse(classInfo.seat_layout)
        } catch (e) {
          console.error('解析座位布局失败:', e)
        }
      }

      // 构建标准的 SeatLayout 对象
      let layoutObj
      if (seatLayoutArray && Array.isArray(seatLayoutArray)) {
        // 如果有座位布局数据，构建完整的布局对象
        layoutObj = {
          rows: classInfo.rows || seatLayoutArray.length,
          columns: classInfo.columns || (seatLayoutArray[0]?.length || 8),
          seats: seatLayoutArray
        }
      } else {
        // 如果没有座位布局，创建默认的空布局
        const rows = classInfo.rows || 6
        const columns = classInfo.columns || 8
        const defaultSeats = []
        
        for (let i = 0; i < rows; i++) {
          const row = []
          for (let j = 0; j < columns; j++) {
            row.push({
              row: i + 1,
              column: j + 1,
              type: 'seat',
              occupied: false
            })
          }
          defaultSeats.push(row)
        }
        
        layoutObj = {
          rows,
          columns,
          seats: defaultSeats
        }
      }
      
      // 将学生信息填充到座位布局中
      seats.forEach(seat => {
        if (seat.student_id && layoutObj.seats[seat.row - 1] && layoutObj.seats[seat.row - 1][seat.column - 1]) {
          const seatPosition = layoutObj.seats[seat.row - 1][seat.column - 1]
          if (seatPosition.type === 'seat') {
            seatPosition.occupied = true
            seatPosition.student_id = seat.student_id
            seatPosition.student_name = seat.student_name
          }
        }
      })

      // 构建学生座位映射
      const studentsInSeats = seats.filter(seat => seat.student_id).map(seat => ({
        id: seat.student_id,
        name: seat.student_name,
        student_id: seat.student_id,
        gender: seat.gender,
        row: seat.row,
        column: seat.column,
        seat_id: seat.id
      }))

      // 找出未分配座位的学生
      const assignedStudentIds = new Set(studentsInSeats.map(s => s.id))
      const unassignedStudents = allStudents.filter(student => !assignedStudentIds.has(student.id))

      const result = {
        class_id: classId,
        class_name: `${classInfo.grade}${classInfo.class_number}班`,
        layout: layoutObj,
        students: studentsInSeats,
        unassigned_students: unassignedStudents,
        total_students: allStudents.length,
        assigned_students: studentsInSeats.length
      }

      return { success: true, data: result }
    } catch (error) {
      console.error('获取座位安排失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '获取座位安排失败' }
    }
  }
  ipcMain.handle('seating:getArrangement', handleGetSeatingArrangement)

  // 分配学生到座位
  const handleAssignStudentToSeat = async (_: IpcMainInvokeEvent, data: {
    class_id: number
    student_id: number
    row: number
    column: number
  }) => {
    try {
      // 检查座位是否已被占用
      const existingSeat = await db.get(
        'SELECT id, student_id FROM seats WHERE class_id = ? AND row = ? AND column = ?',
        [data.class_id, data.row, data.column]
      )

      if (existingSeat) {
        if (existingSeat.student_id) {
          return { success: false, error: '该座位已被占用' }
        }
        
        // 先清除该学生在其他座位上的记录（防止一个学生坐在多个座位上）
        await db.run(
          'UPDATE seats SET student_id = NULL WHERE class_id = ? AND student_id = ?',
          [data.class_id, data.student_id]
        )
        
        // 更新现有座位
        await db.run(
          'UPDATE seats SET student_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [data.student_id, existingSeat.id]
        )
      } else {
        // 先清除该学生在其他座位上的记录（防止一个学生坐在多个座位上）
        await db.run(
          'UPDATE seats SET student_id = NULL WHERE class_id = ? AND student_id = ?',
          [data.class_id, data.student_id]
        )
        
        // 创建新座位
        await db.run(
          'INSERT INTO seats (class_id, student_id, row, column) VALUES (?, ?, ?, ?)',
          [data.class_id, data.student_id, data.row, data.column]
        )
      }

      return { success: true }
    } catch (error) {
      console.error('分配座位失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '分配座位失败' }
    }
  }
  ipcMain.handle('seating:assignStudent', handleAssignStudentToSeat)

  // 移除学生座位
  const handleRemoveStudentFromSeat = async (_: IpcMainInvokeEvent, data: {
    class_id: number
    row: number
    column: number
  }) => {
    try {
      await db.run(
        'UPDATE seats SET student_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE class_id = ? AND row = ? AND column = ?',
        [data.class_id, data.row, data.column]
      )

      return { success: true }
    } catch (error) {
      console.error('移除座位失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '移除座位失败' }
    }
  }
  ipcMain.handle('seating:removeStudent', handleRemoveStudentFromSeat)

  // 交换两个学生的座位
  const handleSwapStudents = async (_: IpcMainInvokeEvent, data: {
    class_id: number
    seat1: { row: number; column: number }
    seat2: { row: number; column: number }
  }) => {
    try {
      // 获取两个座位的学生信息
      const seat1 = await db.get(
        'SELECT id, student_id FROM seats WHERE class_id = ? AND row = ? AND column = ?',
        [data.class_id, data.seat1.row, data.seat1.column]
      )
      
      const seat2 = await db.get(
        'SELECT id, student_id FROM seats WHERE class_id = ? AND row = ? AND column = ?',
        [data.class_id, data.seat2.row, data.seat2.column]
      )

      // 交换座位
      if (seat1 && seat2) {
        await db.run(
          'UPDATE seats SET student_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [seat2.student_id, seat1.id]
        )
        await db.run(
          'UPDATE seats SET student_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [seat1.student_id, seat2.id]
        )
      }

      return { success: true }
    } catch (error) {
      console.error('交换座位失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '交换座位失败' }
    }
  }
  ipcMain.handle('seating:swapStudents', handleSwapStudents)

  // 自动分配座位
  const handleAutoAssign = async (_: IpcMainInvokeEvent, classId: number, options?: { numberingMode: string; numberingDirection: string }) => {
    try {
      // 获取班级配置
      const config = await db.get('SELECT * FROM class_configs WHERE class_id = ?', [classId])
      if (!config) {
        return { success: false, error: '请先设置座位布局' }
      }

      // 获取编号模式和方向，优先使用传入的参数，否则使用保存的配置
      const numberingMode = options?.numberingMode || config.numbering_mode || 'row-column'
      const numberingDirection = options?.numberingDirection || config.numbering_direction || 'top'

      // 清除现有座位分配
      await db.run('UPDATE seats SET student_id = NULL WHERE class_id = ?', [classId])

      // 获取所有学生（按姓名排序）
      const students = await db.all(
        'SELECT id, name, gender FROM students WHERE class_id = ? AND is_active = 1 ORDER BY name',
        [classId]
      )

      // 解析座位布局
      let seatLayoutArray = null
      if (config.seat_layout) {
        try {
          seatLayoutArray = JSON.parse(config.seat_layout)
        } catch (e) {
          console.error('解析座位布局失败:', e)
        }
      }

      // 获取可用座位
      const availableSeats = []
      if (seatLayoutArray && Array.isArray(seatLayoutArray)) {
        // 使用保存的座位布局
        for (let row = 0; row < seatLayoutArray.length; row++) {
          for (let col = 0; col < seatLayoutArray[row].length; col++) {
            const seat = seatLayoutArray[row][col]
            if (seat && seat.type === 'seat') {
              availableSeats.push({ row: row + 1, column: col + 1, rowIndex: row, colIndex: col })
            }
          }
        }
      } else {
        // 默认布局，所有位置都是座位
        for (let row = 1; row <= config.rows; row++) {
          for (let col = 1; col <= config.columns; col++) {
            availableSeats.push({ row, column: col, rowIndex: row - 1, colIndex: col - 1 })
          }
        }
      }

      // 总是根据编号模式对座位进行排序（从1号开始）
      availableSeats.sort((a, b) => {
        const aNumber = getSeatNumber(a.rowIndex, a.colIndex, seatLayoutArray || [], numberingMode, numberingDirection)
        const bNumber = getSeatNumber(b.rowIndex, b.colIndex, seatLayoutArray || [], numberingMode, numberingDirection)
        return aNumber - bNumber
      })

      // 自动分配学生到座位
      for (let i = 0; i < Math.min(students.length, availableSeats.length); i++) {
        const student = students[i]
        const seat = availableSeats[i]
        
        // 检查座位是否存在
        const existingSeat = await db.get(
          'SELECT id FROM seats WHERE class_id = ? AND row = ? AND column = ?',
          [classId, seat.row, seat.column]
        )

        if (existingSeat) {
          await db.run(
            'UPDATE seats SET student_id = ? WHERE id = ?',
            [student.id, existingSeat.id]
          )
        } else {
          await db.run(
            'INSERT INTO seats (class_id, student_id, row, column) VALUES (?, ?, ?, ?)',
            [classId, student.id, seat.row, seat.column]
          )
        }
      }

      return { success: true, data: { assigned: Math.min(students.length, availableSeats.length) } }
    } catch (error) {
      console.error('自动分配座位失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '自动分配座位失败' }
    }
  }
  ipcMain.handle('seating:autoAssign', handleAutoAssign)

  // 计算座位编号的辅助函数
  function getSeatNumber(rowIndex: number, colIndex: number, layout: any[][], numberingMode: string, numberingDirection: string): number {
    const rows = layout.length || 6
    const cols = layout[0]?.length || 8
    
    switch (numberingMode) {
      case 'row-column':
        if (numberingDirection === 'bottom') {
          return (rows - rowIndex - 1) * cols + colIndex + 1
        }
        return rowIndex * cols + colIndex + 1
        
      case 's-shape':
        let sNumber = 0
        const sRowStart = numberingDirection === 'bottom' ? rows - 1 : 0
        const sRowEnd = numberingDirection === 'bottom' ? -1 : rows
        const sRowStep = numberingDirection === 'bottom' ? -1 : 1
        
        for (let r = sRowStart; numberingDirection === 'bottom' ? r > sRowEnd : r < sRowEnd; r += sRowStep) {
          for (let c = 0; c < cols; c++) {
            const actualCol = r % 2 === 0 ? c : cols - 1 - c
            if (!layout.length || (layout[r] && layout[r][actualCol]?.type === 'seat')) {
              sNumber++
              if (r === rowIndex && actualCol === colIndex) {
                return sNumber
              }
            }
          }
        }
        return 0
        
      case 'z-shape':
        let zNumber = 0
        const zRowStart = numberingDirection === 'bottom' ? rows - 1 : 0
        const zRowEnd = numberingDirection === 'bottom' ? -1 : rows
        const zRowStep = numberingDirection === 'bottom' ? -1 : 1
        
        for (let r = zRowStart; numberingDirection === 'bottom' ? r > zRowEnd : r < zRowEnd; r += zRowStep) {
          for (let c = 0; c < cols; c++) {
            if (!layout.length || (layout[r] && layout[r][c]?.type === 'seat')) {
              zNumber++
              if (r === rowIndex && c === colIndex) {
                return zNumber
              }
            }
          }
        }
        return 0
        
      case 'podium-s':
        let psNumber = 0
        const psRowStart = numberingDirection === 'bottom' ? rows - 1 : 0
        const psRowEnd = numberingDirection === 'bottom' ? -1 : rows
        const psRowStep = numberingDirection === 'bottom' ? -1 : 1
        
        for (let r = psRowStart; numberingDirection === 'bottom' ? r > psRowEnd : r < psRowEnd; r += psRowStep) {
          for (let c = 0; c < cols; c++) {
            let actualCol
            if (numberingDirection === 'bottom') {
              const relativeRow = rows - 1 - r
              actualCol = relativeRow % 2 === 0 ? cols - 1 - c : c
            } else {
              actualCol = r % 2 === 0 ? cols - 1 - c : c
            }
            
            if (!layout.length || (layout[r] && layout[r][actualCol]?.type === 'seat')) {
              psNumber++
              if (r === rowIndex && actualCol === colIndex) {
                return psNumber
              }
            }
          }
        }
        return 0
        
      default:
        return rowIndex * cols + colIndex + 1
    }
  }

  // 保存排位安排
  const handleSaveSeatingArrangement = async (_: IpcMainInvokeEvent, classId: number) => {
    try {
      // 获取当前排位安排统计信息
      const stats = await db.all(
        `SELECT 
          COUNT(*) as total_seats,
          COUNT(student_id) as assigned_seats
        FROM seats 
        WHERE class_id = ?`,
        [classId]
      )
      
      const totalSeats = stats[0]?.total_seats || 0
      const assignedSeats = stats[0]?.assigned_seats || 0
      
      // 获取班级信息
      const classInfo = await db.get(
        'SELECT grade, class_number FROM classes WHERE id = ?',
        [classId]
      )
      
      if (!classInfo) {
        return { success: false, error: '班级不存在' }
      }
      
      const className = `${classInfo.grade}${classInfo.class_number}班`
      const saveTime = new Date().toLocaleString('zh-CN')
      
      console.log(`排位安排保存成功 - ${className}`, {
        total_seats: totalSeats,
        assigned_seats: assignedSeats,
        save_time: saveTime
      })
      
      return { 
        success: true, 
        data: {
          class_name: className,
          total_seats: totalSeats,
          assigned_seats: assignedSeats,
          save_time: saveTime
        }
      }
    } catch (error) {
      console.error('保存排位安排失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '保存失败' }
    }
  }
  ipcMain.handle('seating:saveArrangement', handleSaveSeatingArrangement)
}