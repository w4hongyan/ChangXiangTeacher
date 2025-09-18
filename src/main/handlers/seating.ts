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
        ORDER BY s.row_number, s.col_number
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
        if (seat.student_id && layoutObj.seats[seat.row_number - 1] && layoutObj.seats[seat.row_number - 1][seat.col_number - 1]) {
          const seatPosition = layoutObj.seats[seat.row_number - 1][seat.col_number - 1]
          if (seatPosition.type === 'seat') {
            seatPosition.occupied = true
            seatPosition.student_id = seat.student_id
            seatPosition.student_name = seat.student_name
          }
        }
      })

      // 构建学生座位映射
      const studentsInSeats = seats.filter(seat => seat.student_id).map(seat => ({
        id: parseInt(seat.student_id.toString()), // 确保返回数字类型
        name: seat.student_name,
        student_id: seat.student_id,
        gender: seat.gender,
        row_number: seat.row_number,
        col_number: seat.col_number,
        seat_id: seat.id
      }))

      // 找出未分配座位的学生
      // 座位表的student_id存储的是students表的主键id
      const assignedStudentIds = new Set<number>()
      const realStudentsInSeats: any[] = []
      
      // 统计实际已分配的座位数量（有student_id的座位）
      const actualAssignedCount = seats.filter(seat => seat.student_id).length
      
      seats.filter(seat => seat.student_id).forEach(seat => {
        // 座位表的student_id存储的是学生的学号，需要与students表的student_id字段匹配
        const student = allStudents.find(s => {
          // 使用学号进行匹配
          return String(s.student_id) === String(seat.student_id)
        })
        // 匹配成功后添加到已分配列表
        if (student) {
          assignedStudentIds.add(student.id)
          realStudentsInSeats.push({
            id: student.id,
            name: student.name,
            student_id: student.student_id,
            gender: student.gender,
            row_number: seat.row_number,
            col_number: seat.col_number,
            seat_id: seat.id
          })
        }
      })
      
      const unassignedStudents = allStudents.filter(student => !assignedStudentIds.has(student.id))

      // 数据处理完成，构建返回结果

      const result = {
        class_id: classId,
        class_name: `${classInfo.grade}${classInfo.class_number}班`,
        layout: layoutObj,
        students: realStudentsInSeats,  // 使用新的数据
        unassigned_students: unassignedStudents,
        total_students: allStudents.length,
        assigned_students: actualAssignedCount  // 使用实际已分配的座位数量
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
        'SELECT id, student_id FROM seats WHERE class_id = ? AND row_number = ? AND col_number = ?',
        [data.class_id, data.row, data.column]
      )

      // 检查学生当前的座位
      const currentStudentSeat = await db.get(
        'SELECT id, row_number, col_number FROM seats WHERE class_id = ? AND student_id = ?',
        [data.class_id, data.student_id]
      )

      if (existingSeat) {
        if (existingSeat.student_id && existingSeat.student_id !== data.student_id) {
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
          'INSERT INTO seats (class_id, student_id, row_number, col_number) VALUES (?, ?, ?, ?)',
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
        'UPDATE seats SET student_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE class_id = ? AND row_number = ? AND col_number = ?',
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
        'SELECT id, student_id FROM seats WHERE class_id = ? AND row_number = ? AND col_number = ?',
        [data.class_id, data.seat1.row, data.seat1.column]
      )
      
      const seat2 = await db.get(
        'SELECT id, student_id FROM seats WHERE class_id = ? AND row_number = ? AND col_number = ?',
        [data.class_id, data.seat2.row, data.seat2.column]
      )

      // 交换座位
      if (seat1 && seat2) {
        // 直接交换学生ID，避免事务嵌套问题
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

  // 批量交换多个学生的座位
  const handleSwapMultipleStudents = async (_: IpcMainInvokeEvent, data: {
    class_id: number
    swaps: Array<{
      seat1: { row: number; column: number }
      seat2: { row: number; column: number }
    }>
  }) => {
    try {
      // 使用事务来确保数据一致性
      await db.run('BEGIN TRANSACTION')
      
      try {
        // 收集所有需要交换的座位信息
        const seatInfos: Array<{
          id: number
          student_id: number | null
        }> = []
        
        // 获取所有座位的学生信息
        for (const swap of data.swaps) {
          const seat1 = await db.get(
            'SELECT id, student_id FROM seats WHERE class_id = ? AND row_number = ? AND col_number = ?',
            [data.class_id, swap.seat1.row, swap.seat1.column]
          )
          
          const seat2 = await db.get(
            'SELECT id, student_id FROM seats WHERE class_id = ? AND row_number = ? AND col_number = ?',
            [data.class_id, swap.seat2.row, swap.seat2.column]
          )
          
          if (seat1 && seat2) {
            seatInfos.push(
              { id: seat1.id, student_id: seat1.student_id },
              { id: seat2.id, student_id: seat2.student_id }
            )
          }
        }
        
        // 先将所有座位的学生ID都设为NULL，避免唯一性约束冲突
        for (const seatInfo of seatInfos) {
          await db.run(
            'UPDATE seats SET student_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [seatInfo.id]
          )
        }
        
        // 然后交换学生ID
        for (const swap of data.swaps) {
          const seat1 = await db.get(
            'SELECT id, student_id FROM seats WHERE class_id = ? AND row_number = ? AND col_number = ?',
            [data.class_id, swap.seat1.row, swap.seat1.column]
          )
          
          const seat2 = await db.get(
            'SELECT id, student_id FROM seats WHERE class_id = ? AND row_number = ? AND col_number = ?',
            [data.class_id, swap.seat2.row, swap.seat2.column]
          )
          
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
        }
        
        await db.run('COMMIT')
        return { success: true }
      } catch (error) {
        await db.run('ROLLBACK')
        throw error
      }
    } catch (error) {
      console.error('批量交换座位失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '批量交换座位失败' }
    }
  }
  ipcMain.handle('seating:swapMultipleStudents', handleSwapMultipleStudents)

  // 自动分配座位
  const handleAutoAssign = async (_: IpcMainInvokeEvent, classId: number, options?: { 
    numberingMode: string; 
    numberingDirection: string;
    strategy?: string;
    fixedStudents?: string[];
  }) => {
    try {
      // 获取班级配置
      const config = await db.get('SELECT * FROM class_configs WHERE class_id = ?', [classId])
      if (!config) {
        return { success: false, error: '请先设置座位布局' }
      }

      // 获取编号模式、方向和分配策略
      const numberingMode = options?.numberingMode || config.numbering_mode || 'row-column'
      const numberingDirection = options?.numberingDirection || config.numbering_direction || 'top'
      const strategy = options?.strategy || 'sequential'
      const fixedStudentIds = options?.fixedStudents || []

      // 对于新的策略，仅清除未固定学生的座位
      if (strategy === 'fixed-preserve' || strategy === 'random') {
        // 获取当前座位安排，找出固定学生的座位
        const currentSeats = await db.all(
          'SELECT * FROM seats WHERE class_id = ? AND student_id IS NOT NULL',
          [classId]
        )
        
        // 只清除未固定学生的座位
        for (const seat of currentSeats) {
          if (!fixedStudentIds.includes(seat.student_id.toString())) {
            await db.run(
              'UPDATE seats SET student_id = NULL WHERE class_id = ? AND row_number = ? AND col_number = ?',
              [classId, seat.row_number, seat.col_number]
            )
          }
        }
      } else {
        // 其他策略清除所有座位分配
        await db.run('UPDATE seats SET student_id = NULL WHERE class_id = ?', [classId])
      }

      // 获取所有学生
      const allStudents = await db.all(
        'SELECT id, name, gender FROM students WHERE class_id = ? AND is_active = 1 ORDER BY name',
        [classId]
      )
      
      // 筛选出需要分配的学生（排除固定学生）
      const studentsToAssign = strategy === 'fixed-preserve' || strategy === 'random'
        ? allStudents.filter(student => !fixedStudentIds.includes(student.id.toString()))
        : allStudents

      // 解析座位布局
      let seatLayoutArray = null
      if (config.seat_layout) {
        try {
          seatLayoutArray = JSON.parse(config.seat_layout)
        } catch (e) {
          console.error('解析座位布局失败:', e)
        }
      }

      // 获取可用座位（排除固定学生占用的座位）
      const availableSeats = []
      const occupiedPositions = new Set<string>()
      
      // 对于固定策略，获取已被固定学生占用的位置
      if (strategy === 'fixed-preserve' || strategy === 'random') {
        const fixedSeats = await db.all(
          'SELECT row, column FROM seats WHERE class_id = ? AND student_id IS NOT NULL',
          [classId]
        )
        fixedSeats.forEach(seat => {
          occupiedPositions.add(`${seat.row}-${seat.column}`)
        })
      }
      
      if (seatLayoutArray && Array.isArray(seatLayoutArray)) {
        // 使用保存的座位布局
        for (let row = 0; row < seatLayoutArray.length; row++) {
          for (let col = 0; col < seatLayoutArray[row].length; col++) {
            const seat = seatLayoutArray[row][col]
            const position = `${row + 1}-${col + 1}`
            if (seat && seat.type === 'seat' && !occupiedPositions.has(position)) {
              availableSeats.push({ row: row + 1, column: col + 1, rowIndex: row, colIndex: col })
            }
          }
        }
      } else {
        // 默认布局，所有位置都是座位
        for (let row = 1; row <= config.rows; row++) {
          for (let col = 1; col <= config.columns; col++) {
            const position = `${row}-${col}`
            if (!occupiedPositions.has(position)) {
              availableSeats.push({ row, column: col, rowIndex: row - 1, colIndex: col - 1 })
            }
          }
        }
      }

      // 按不同策略分配学生
      let assignedCount = 0
      
      switch (strategy) {
        case 'sequential':
          // 顺序分配：按编号顺序分配，同时考虑靠台优先
          assignedCount = await assignStudentsWithPodiumPriority(studentsToAssign, availableSeats, seatLayoutArray, numberingMode, numberingDirection, classId, db)
          break
          
        case 'balanced-row':
          // 按行平均分配：保持行平衡，同时靠台优先
          assignedCount = await assignStudentsBalancedByRowWithPodium(studentsToAssign, availableSeats, seatLayoutArray, classId, db)
          break
          
        case 'balanced-column':
          // 按列平均分配：保持列平衡，同时靠台优先
          assignedCount = await assignStudentsBalancedByColumnWithPodium(studentsToAssign, availableSeats, seatLayoutArray, classId, db)
          break
          
        case 'podium-priority':
          // 靠台优先分配：强制使用靠台优先算法
          assignedCount = await assignStudentsWithPodiumPriority(studentsToAssign, availableSeats, seatLayoutArray, 'podium-s', numberingDirection, classId, db)
          break
          
        case 'fixed-preserve':
          // 固定学生后自动分配：使用靠台优先策略
          assignedCount = await assignStudentsWithPodiumPriority(studentsToAssign, availableSeats, seatLayoutArray, numberingMode, numberingDirection, classId, db)
          break
          
        case 'random':
          // 随机分配
          assignedCount = await assignStudentsRandomly(studentsToAssign, availableSeats, classId, db)
          break
          
        default:
          // 默认使用靠台优先平衡分配
          assignedCount = await assignStudentsWithPodiumPriority(studentsToAssign, availableSeats, seatLayoutArray, numberingMode, numberingDirection, classId, db)
      }

      return { success: true, data: { assigned: assignedCount } }
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

// 辅助函数：靠台优先平衡分配算法
async function assignStudentsWithPodiumPriority(
  students: any[], 
  availableSeats: any[], 
  seatLayoutArray: any[][],
  numberingMode: string,
  numberingDirection: string,
  classId: number, 
  db: any
): Promise<number> {
  // 计算每个座位到讲台的距离分数（越小越靠近讲台）
  const seatsWithScore = availableSeats.map(seat => {
    const podiumScore = calculatePodiumDistance(seat, seatLayoutArray)
    const balanceScore = calculateBalanceScore(seat, availableSeats)
    
    return {
      ...seat,
      podiumScore,
      balanceScore,
      // 综合评分：靠台距离权重70%，平衡性权重30%
      totalScore: podiumScore * 0.7 + balanceScore * 0.3
    }
  })
  
  // 按综合评分排序（评分越小越优）
  seatsWithScore.sort((a, b) => a.totalScore - b.totalScore)
  
  return await assignStudentsSequentially(students, seatsWithScore, classId, db)
}

// 辅助函数：按行平均分配（靠台优先）
async function assignStudentsBalancedByRowWithPodium(
  students: any[], 
  availableSeats: any[], 
  seatLayoutArray: any[][], 
  classId: number, 
  db: any
): Promise<number> {
  // 按行分组座位
  const seatsByRow = new Map<number, any[]>()
  
  availableSeats.forEach(seat => {
    if (!seatsByRow.has(seat.row)) {
      seatsByRow.set(seat.row, [])
    }
    seatsByRow.get(seat.row)!.push(seat)
  })
  
  // 对每行座位按靠台距离排序
  seatsByRow.forEach(seats => {
    seats.forEach(seat => {
      seat.podiumScore = calculatePodiumDistance(seat, seatLayoutArray)
    })
    seats.sort((a, b) => a.podiumScore - b.podiumScore)
  })
  
  // 按行到讲台的平均距离排序（靠讲台的行优先）
  const rows = Array.from(seatsByRow.keys()).sort((a, b) => {
    const aAvgDistance = seatsByRow.get(a)!.reduce((sum, seat) => sum + seat.podiumScore, 0) / seatsByRow.get(a)!.length
    const bAvgDistance = seatsByRow.get(b)!.reduce((sum, seat) => sum + seat.podiumScore, 0) / seatsByRow.get(b)!.length
    return aAvgDistance - bAvgDistance
  })
  
  const totalRows = rows.length
  const studentsPerRow = Math.ceil(students.length / totalRows)
  
  let assignedCount = 0
  let studentIndex = 0
  
  // 按行平均分配，优先填满靠讲台的行
  for (const row of rows) {
    const rowSeats = seatsByRow.get(row)!
    const seatsToFill = Math.min(studentsPerRow, rowSeats.length, students.length - studentIndex)
    
    for (let i = 0; i < seatsToFill; i++) {
      if (studentIndex >= students.length) break
      
      const student = students[studentIndex]
      const seat = rowSeats[i] // 已按靠台距离排序
      
      if (await assignSingleStudent(student, seat, classId, db)) {
        assignedCount++
      }
      studentIndex++
    }
  }
  
  return assignedCount
}

// 辅助函数：按列平均分配（靠台优先）
async function assignStudentsBalancedByColumnWithPodium(
  students: any[], 
  availableSeats: any[], 
  seatLayoutArray: any[][], 
  classId: number, 
  db: any
): Promise<number> {
  // 按列分组座位
  const seatsByColumn = new Map<number, any[]>()
  
  availableSeats.forEach(seat => {
    if (!seatsByColumn.has(seat.column)) {
      seatsByColumn.set(seat.column, [])
    }
    seatsByColumn.get(seat.column)!.push(seat)
  })
  
  // 对每列座位按靠台距离排序
  seatsByColumn.forEach(seats => {
    seats.forEach(seat => {
      seat.podiumScore = calculatePodiumDistance(seat, seatLayoutArray)
    })
    seats.sort((a, b) => a.podiumScore - b.podiumScore)
  })
  
  // 按列到讲台的平均距离排序（靠讲台的列优先）
  const columns = Array.from(seatsByColumn.keys()).sort((a, b) => {
    const aAvgDistance = seatsByColumn.get(a)!.reduce((sum, seat) => sum + seat.podiumScore, 0) / seatsByColumn.get(a)!.length
    const bAvgDistance = seatsByColumn.get(b)!.reduce((sum, seat) => sum + seat.podiumScore, 0) / seatsByColumn.get(b)!.length
    return aAvgDistance - bAvgDistance
  })
  
  const totalColumns = columns.length
  const studentsPerColumn = Math.ceil(students.length / totalColumns)
  
  let assignedCount = 0
  let studentIndex = 0
  
  // 按列平均分配，优先填满靠讲台的列
  for (const column of columns) {
    const columnSeats = seatsByColumn.get(column)!
    const seatsToFill = Math.min(studentsPerColumn, columnSeats.length, students.length - studentIndex)
    
    for (let i = 0; i < seatsToFill; i++) {
      if (studentIndex >= students.length) break
      
      const student = students[studentIndex]
      const seat = columnSeats[i] // 已按靠台距离排序
      
      if (await assignSingleStudent(student, seat, classId, db)) {
        assignedCount++
      }
      studentIndex++
    }
  }
  
  return assignedCount
}

// 辅助函数：计算座位到讲台的距离分数
function calculatePodiumDistance(seat: any, seatLayoutArray: any[][]): number {
  const rows = seatLayoutArray?.length || 6
  const cols = seatLayoutArray?.[0]?.length || 8
  
  // 讲台在右侧，所以右下角是最靠近讲台的位置
  const podiumRow = rows - 1 // 最后一行
  const podiumCol = cols - 1 // 最后一列
  
  // 使用曼哈顿距离计算
  const rowDistance = Math.abs(seat.row - 1 - podiumRow)
  const colDistance = Math.abs(seat.column - 1 - podiumCol)
  
  return rowDistance + colDistance
}

// 辅助函数：计算座位的平衡性分数
function calculateBalanceScore(seat: any, allSeats: any[]): number {
  // 计算在同行和同列的座位数量
  const sameRowSeats = allSeats.filter(s => s.row_number === seat.row_number).length
  const sameColSeats = allSeats.filter(s => s.col_number === seat.col_number).length
  
  // 返回平衡性分数（数量越多越不平衡）
  return (sameRowSeats + sameColSeats) / 2
}

// 辅助函数：分配单个学生
async function assignSingleStudent(
  student: any,
  seat: any,
  classId: number,
  db: any
): Promise<boolean> {
  try {
    // 检查座位是否存在
    const existingSeat = await db.get(
      'SELECT id FROM seats WHERE class_id = ? AND row_number = ? AND col_number = ?',
      [classId, seat.row, seat.column]
    )

    if (existingSeat) {
      await db.run(
        'UPDATE seats SET student_id = ? WHERE id = ?',
        [student.id, existingSeat.id]
      )
    } else {
      await db.run(
        'INSERT INTO seats (class_id, student_id, row_number, col_number) VALUES (?, ?, ?, ?)',
        [classId, student.id, seat.row, seat.column]
      )
    }
    return true
  } catch (error) {
    console.error(`分配学生 ${student.name} 到座位 ${seat.row}-${seat.column} 失败:`, error)
    return false
  }
}

// 辅助函数：顺序分配学生（保留原有函数兼容性）
async function assignStudentsSequentially(
  students: any[], 
  availableSeats: any[], 
  classId: number, 
  db: any
): Promise<number> {
  let assignedCount = 0
  
  for (let i = 0; i < Math.min(students.length, availableSeats.length); i++) {
    const student = students[i]
    const seat = availableSeats[i]
    
    if (await assignSingleStudent(student, seat, classId, db)) {
      assignedCount++
    }
  }
  
  return assignedCount
}

// 辅助函数：随机分配学生
async function assignStudentsRandomly(
  students: any[], 
  availableSeats: any[], 
  classId: number, 
  db: any
): Promise<number> {
  // 打乱学生和座位顺序
  const shuffledStudents = [...students].sort(() => Math.random() - 0.5)
  const shuffledSeats = [...availableSeats].sort(() => Math.random() - 0.5)
  
  let assignedCount = 0
  
  for (let i = 0; i < Math.min(shuffledStudents.length, shuffledSeats.length); i++) {
    const student = shuffledStudents[i]
    const seat = shuffledSeats[i]
    
    if (await assignSingleStudent(student, seat, classId, db)) {
      assignedCount++
    }
  }
  
  return assignedCount
}