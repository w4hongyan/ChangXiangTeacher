import { ipcMain } from 'electron'
import type { DatabaseManager } from '../database'
import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'

// 成绩报告接口
interface GradeReport {
  id?: number
  title: string
  class_id: number
  subject?: string
  exam_type?: string
  semester: string
  year: number
  report_type: 'class_summary' | 'student_detail' | 'subject_analysis' | 'comparison'
  content: any
  created_at?: string
  updated_at?: string
}

// 成绩对比分析接口
interface GradeComparison {
  student_id: number
  student_name: string
  subject: string
  midterm_score?: number
  final_score?: number
  improvement: number
  trend: 'up' | 'down' | 'stable'
  rank_change?: number
}

// 班级成绩分析接口
interface ClassGradeAnalysis {
  class_id: number
  class_name: string
  subject: string
  exam_type: string
  semester: string
  year: number
  statistics: {
    total_students: number
    average_score: number
    median_score: number
    max_score: number
    min_score: number
    pass_rate: number
    excellent_rate: number
    score_distribution: { range: string; count: number }[]
  }
  top_students: { student_name: string; score: number; rank: number }[]
  improvement_needed: { student_name: string; score: number; suggestions: string[] }[]
}

export function setupEnhancedGradeHandlers(dbManager: DatabaseManager) {
  
  // 生成班级成绩报告
  ipcMain.handle('grades:generateClassReport', async (_, params: {
    class_id: number
    subject?: string
    exam_type: string
    semester: string
    year: number
  }) => {
    try {
      const { class_id, subject, exam_type, semester, year } = params
      
      // 获取班级信息
      const classInfo = await dbManager.get('SELECT * FROM classes WHERE id = ?', [class_id])
      if (!classInfo) {
        return { success: false, error: '班级不存在' }
      }
      
      // 构建查询条件
      let gradeQuery = `
        SELECT 
          g.*,
          s.name as student_name,
          s.student_id as student_number
        FROM grades g
        LEFT JOIN students s ON g.student_id = s.id
        WHERE g.class_id = ? AND g.exam_type = ? AND g.semester = ? AND g.year = ?
      `
      const queryParams = [class_id, exam_type, semester, year]
      
      if (subject) {
        gradeQuery += ' AND g.subject = ?'
        queryParams.push(subject)
      }
      
      gradeQuery += ' ORDER BY g.score DESC'
      
      const grades = await dbManager.all(gradeQuery, queryParams)
      
      if (grades.length === 0) {
        return { success: false, error: '没有找到相关成绩数据' }
      }
      
      // 计算统计数据
      const scores = grades.map(g => g.score)
      const totalStudents = scores.length
      const averageScore = scores.reduce((sum, score) => sum + score, 0) / totalStudents
      const sortedScores = [...scores].sort((a, b) => a - b)
      const medianScore = totalStudents % 2 === 0 
        ? (sortedScores[totalStudents / 2 - 1] + sortedScores[totalStudents / 2]) / 2
        : sortedScores[Math.floor(totalStudents / 2)]
      const maxScore = Math.max(...scores)
      const minScore = Math.min(...scores)
      const passCount = scores.filter(score => score >= 60).length
      const excellentCount = scores.filter(score => score >= 85).length
      const passRate = (passCount / totalStudents) * 100
      const excellentRate = (excellentCount / totalStudents) * 100
      
      // 分数分布
      const scoreDistribution = [
        { range: '90-100', count: scores.filter(s => s >= 90).length },
        { range: '80-89', count: scores.filter(s => s >= 80 && s < 90).length },
        { range: '70-79', count: scores.filter(s => s >= 70 && s < 80).length },
        { range: '60-69', count: scores.filter(s => s >= 60 && s < 70).length },
        { range: '0-59', count: scores.filter(s => s < 60).length }
      ]
      
      // 前5名学生
      const topStudents = grades.slice(0, 5).map((g, index) => ({
        student_name: g.student_name,
        score: g.score,
        rank: index + 1
      }))
      
      // 需要提升的学生（分数低于平均分的学生）
      const improvementNeeded = grades
        .filter(g => g.score < averageScore)
        .map(g => ({
          student_name: g.student_name,
          score: g.score,
          suggestions: generateImprovementSuggestions(g.score, averageScore)
        }))
      
      const analysis: ClassGradeAnalysis = {
        class_id,
        class_name: classInfo.name,
        subject: subject || '全科',
        exam_type,
        semester,
        year,
        statistics: {
          total_students: totalStudents,
          average_score: Math.round(averageScore * 100) / 100,
          median_score: Math.round(medianScore * 100) / 100,
          max_score: maxScore,
          min_score: minScore,
          pass_rate: Math.round(passRate * 100) / 100,
          excellent_rate: Math.round(excellentRate * 100) / 100,
          score_distribution: scoreDistribution
        },
        top_students: topStudents,
        improvement_needed: improvementNeeded
      }
      
      // 保存报告到数据库
      const reportTitle = `${classInfo.name} ${subject || '全科'} ${exam_type} 成绩报告`
      const reportResult = await dbManager.run(`
        INSERT INTO grade_reports (title, class_id, subject, exam_type, semester, year, report_type, content)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        reportTitle,
        class_id,
        subject || null,
        exam_type,
        semester,
        year,
        'class_summary',
        JSON.stringify(analysis)
      ])
      
      return {
        success: true,
        data: {
          report_id: reportResult.lastID,
          analysis
        }
      }
    } catch (error) {
      console.error('生成班级成绩报告失败:', error)
      return { success: false, error: error.message }
    }
  })
  
  // 生成学生个人成绩报告
  ipcMain.handle('grades:generateStudentReport', async (_, params: {
    student_id: number
    class_id: number
    semester: string
    year: number
  }) => {
    try {
      const { student_id, class_id, semester, year } = params
      
      // 获取学生信息
      const studentInfo = await dbManager.get(`
        SELECT s.*, c.name as class_name 
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        WHERE s.id = ?
      `, [student_id])
      
      if (!studentInfo) {
        return { success: false, error: '学生不存在' }
      }
      
      // 获取学生所有科目成绩
      const grades = await dbManager.all(`
        SELECT 
          g.*,
          sub.name as subject_name
        FROM grades g
        LEFT JOIN subjects sub ON g.subject = sub.name
        WHERE g.student_id = ? AND g.class_id = ? AND g.semester = ? AND g.year = ?
        ORDER BY g.subject
      `, [student_id, class_id, semester, year])
      
      if (grades.length === 0) {
        return { success: false, error: '没有找到该学生的成绩数据' }
      }
      
      // 计算班级排名
      const subjectGrades = []
      for (const grade of grades) {
        // 获取该科目班级所有成绩用于排名计算
        const classGrades = await dbManager.all(`
          SELECT score FROM grades 
          WHERE class_id = ? AND subject = ? AND semester = ? AND year = ?
          ORDER BY score DESC
        `, [class_id, grade.subject, semester, year])
        
        const rank = classGrades.findIndex(g => g.score <= grade.score) + 1
        
        subjectGrades.push({
          subject: grade.subject,
          score: grade.score,
          class_rank: rank,
          total_students: classGrades.length
        })
      }
      
      // 分析优势和薄弱科目
      const averageScore = subjectGrades.reduce((sum, g) => sum + g.score, 0) / subjectGrades.length
      const strengths = subjectGrades.filter(g => g.score >= averageScore + 10).map(g => g.subject)
      const weaknesses = subjectGrades.filter(g => g.score < averageScore - 10).map(g => g.subject)
      
      // 生成改进建议
      const suggestions = []
      if (weaknesses.length > 0) {
        suggestions.push(`重点关注${weaknesses.join('、')}等薄弱科目，加强基础知识学习`)
      }
      if (strengths.length > 0) {
        suggestions.push(`继续保持${strengths.join('、')}等优势科目的良好表现`)
      }
      if (averageScore >= 85) {
        suggestions.push('整体成绩优秀，建议挑战更高难度的题目')
      } else if (averageScore >= 70) {
        suggestions.push('成绩良好，建议加强薄弱环节的练习')
      } else {
        suggestions.push('需要加强基础知识学习，建议制定详细的学习计划')
      }
      
      // 总体表现评价
      let overallPerformance = ''
      if (averageScore >= 90) {
        overallPerformance = '优秀'
      } else if (averageScore >= 80) {
        overallPerformance = '良好'
      } else if (averageScore >= 70) {
        overallPerformance = '中等'
      } else if (averageScore >= 60) {
        overallPerformance = '及格'
      } else {
        overallPerformance = '需要努力'
      }
      
      const analysis = {
        student_name: studentInfo.name,
        student_number: studentInfo.student_id,
        class_name: studentInfo.class_name,
        semester,
        year,
        subject_grades: subjectGrades,
        overall_performance: overallPerformance,
        average_score: Math.round(averageScore * 100) / 100,
        strengths,
        weaknesses,
        suggestions
      }
      
      // 保存报告到数据库
      const reportTitle = `${studentInfo.name} 个人成绩报告`
      const reportResult = await dbManager.run(`
        INSERT INTO grade_reports (title, class_id, subject, exam_type, semester, year, report_type, content)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        reportTitle,
        class_id,
        null,
        '个人报告',
        semester,
        year,
        'student_detail',
        JSON.stringify(analysis)
      ])
      
      return {
        success: true,
        data: {
          report_id: reportResult.lastID,
          analysis
        }
      }
    } catch (error) {
      console.error('生成学生个人成绩报告失败:', error)
      return { success: false, error: error.message }
    }
  })
  
  // 生成期中期末对比分析
  ipcMain.handle('grades:generateComparison', async (_, params: {
    class_id: number
    subject: string
    semester: string
    year: number
  }) => {
    try {
      const { class_id, subject, semester, year } = params
      
      // 获取期中成绩
      const midtermGrades = await dbManager.all(`
        SELECT g.*, s.name as student_name
        FROM grades g
        LEFT JOIN students s ON g.student_id = s.id
        WHERE g.class_id = ? AND g.subject = ? AND g.exam_type = '期中考试' AND g.semester = ? AND g.year = ?
      `, [class_id, subject, semester, year])
      
      // 获取期末成绩
      const finalGrades = await dbManager.all(`
        SELECT g.*, s.name as student_name
        FROM grades g
        LEFT JOIN students s ON g.student_id = s.id
        WHERE g.class_id = ? AND g.subject = ? AND g.exam_type = '期末考试' AND g.semester = ? AND g.year = ?
      `, [class_id, subject, semester, year])
      
      if (midtermGrades.length === 0 || finalGrades.length === 0) {
        return { success: false, error: '期中或期末成绩数据不完整' }
      }
      
      // 创建学生成绩映射
      const midtermMap = new Map(midtermGrades.map(g => [g.student_id, g]))
      const finalMap = new Map(finalGrades.map(g => [g.student_id, g]))
      
      // 生成对比分析
      const comparisons: GradeComparison[] = []
      
      // 获取期中排名
      const midtermRanked = [...midtermGrades].sort((a, b) => b.score - a.score)
      const finalRanked = [...finalGrades].sort((a, b) => b.score - a.score)
      
      const midtermRankMap = new Map(midtermRanked.map((g, index) => [g.student_id, index + 1]))
      const finalRankMap = new Map(finalRanked.map((g, index) => [g.student_id, index + 1]))
      
      for (const [studentId, midtermGrade] of midtermMap) {
        const finalGrade = finalMap.get(studentId)
        if (finalGrade) {
          const improvement = finalGrade.score - midtermGrade.score
          const midtermRank = midtermRankMap.get(studentId) || 0
          const finalRank = finalRankMap.get(studentId) || 0
          const rankChange = midtermRank - finalRank // 正数表示排名上升
          
          let trend: 'up' | 'down' | 'stable'
          if (improvement > 5) trend = 'up'
          else if (improvement < -5) trend = 'down'
          else trend = 'stable'
          
          comparisons.push({
            student_id: studentId,
            student_name: midtermGrade.student_name,
            subject,
            midterm_score: midtermGrade.score,
            final_score: finalGrade.score,
            improvement,
            trend,
            rank_change: rankChange
          })
        }
      }
      
      // 按进步幅度排序
      comparisons.sort((a, b) => b.improvement - a.improvement)
      
      // 统计分析
      const totalStudents = comparisons.length
      const improvedStudents = comparisons.filter(c => c.improvement > 0).length
      const declinedStudents = comparisons.filter(c => c.improvement < 0).length
      const stableStudents = totalStudents - improvedStudents - declinedStudents
      
      const avgMidtermScore = comparisons.reduce((sum, c) => sum + (c.midterm_score || 0), 0) / totalStudents
      const avgFinalScore = comparisons.reduce((sum, c) => sum + (c.final_score || 0), 0) / totalStudents
      const avgImprovement = avgFinalScore - avgMidtermScore
      
      const analysisResult = {
        class_id,
        subject,
        semester,
        year,
        summary: {
          total_students: totalStudents,
          improved_students: improvedStudents,
          declined_students: declinedStudents,
          stable_students: stableStudents,
          avg_midterm_score: Math.round(avgMidtermScore * 100) / 100,
          avg_final_score: Math.round(avgFinalScore * 100) / 100,
          avg_improvement: Math.round(avgImprovement * 100) / 100
        },
        comparisons,
        top_improvers: comparisons.filter(c => c.improvement > 0).slice(0, 5),
        need_attention: comparisons.filter(c => c.improvement < -10).slice(0, 5)
      }
      
      // 保存对比报告
      const classInfo = await dbManager.get('SELECT name FROM classes WHERE id = ?', [class_id])
      const reportTitle = `${classInfo?.name || ''} ${subject} 期中期末对比分析`
      
      const reportResult = await dbManager.run(`
        INSERT INTO grade_reports (title, class_id, subject, exam_type, semester, year, report_type, content)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        reportTitle,
        class_id,
        subject,
        '期中期末对比',
        semester,
        year,
        'comparison',
        JSON.stringify(analysisResult)
      ])
      
      return {
        success: true,
        data: {
          report_id: reportResult.lastID,
          analysis: analysisResult
        }
      }
    } catch (error) {
      console.error('生成期中期末对比分析失败:', error)
      return { success: false, error: error.message }
    }
  })
  
  // 获取成绩报告列表
  ipcMain.handle('grades:getReports', async (_, params: {
    class_id?: number
    subject?: string
    report_type?: string
    page?: number
    page_size?: number
  } = {}) => {
    try {
      let baseQuery = `
        SELECT 
          gr.*,
          c.name as class_name
        FROM grade_reports gr
        LEFT JOIN classes c ON gr.class_id = c.id
        WHERE 1=1
      `
      
      const queryParams: any[] = []
      
      if (params.class_id) {
        baseQuery += ' AND gr.class_id = ?'
        queryParams.push(params.class_id)
      }
      
      if (params.subject) {
        baseQuery += ' AND gr.subject = ?'
        queryParams.push(params.subject)
      }
      
      if (params.report_type) {
        baseQuery += ' AND gr.report_type = ?'
        queryParams.push(params.report_type)
      }
      
      baseQuery += ' ORDER BY gr.created_at DESC'
      
      // 分页
      const page = params.page || 1
      const pageSize = params.page_size || 20
      const offset = (page - 1) * pageSize
      
      baseQuery += ' LIMIT ? OFFSET ?'
      queryParams.push(pageSize, offset)
      
      const reports = await dbManager.all(baseQuery, queryParams)
      
      // 获取总数
      let countQuery = `
        SELECT COUNT(*) as total
        FROM grade_reports gr
        WHERE 1=1
      `
      const countParams: any[] = []
      
      if (params.class_id) {
        countQuery += ' AND gr.class_id = ?'
        countParams.push(params.class_id)
      }
      
      if (params.subject) {
        countQuery += ' AND gr.subject = ?'
        countParams.push(params.subject)
      }
      
      if (params.report_type) {
        countQuery += ' AND gr.report_type = ?'
        countParams.push(params.report_type)
      }
      
      const countResult = await dbManager.get(countQuery, countParams)
      
      return {
        success: true,
        data: {
          reports: reports.map(r => ({
            ...r,
            content: JSON.parse(r.content)
          })),
          pagination: {
            page,
            page_size: pageSize,
            total: countResult.total,
            total_pages: Math.ceil(countResult.total / pageSize)
          }
        }
      }
    } catch (error) {
      console.error('获取成绩报告列表失败:', error)
      return { success: false, error: error.message }
    }
  })
  
  // 获取单个成绩报告详情
  ipcMain.handle('grades:getReportDetail', async (_, reportId: number) => {
    try {
      const report = await dbManager.get(`
        SELECT 
          gr.*,
          c.name as class_name
        FROM grade_reports gr
        LEFT JOIN classes c ON gr.class_id = c.id
        WHERE gr.id = ?
      `, [reportId])
      
      if (!report) {
        return { success: false, error: '报告不存在' }
      }
      
      return {
        success: true,
        data: {
          ...report,
          content: JSON.parse(report.content)
        }
      }
    } catch (error) {
      console.error('获取成绩报告详情失败:', error)
      return { success: false, error: error.message }
    }
  })
  
  // 导出成绩报告
  ipcMain.handle('grades:exportReport', async (_, reportId: number, format: 'pdf' | 'excel' | 'html' = 'html') => {
    try {
      const report = await dbManager.get(`
        SELECT 
          gr.*,
          c.name as class_name
        FROM grade_reports gr
        LEFT JOIN classes c ON gr.class_id = c.id
        WHERE gr.id = ?
      `, [reportId])
      
      if (!report) {
        return { success: false, error: '报告不存在' }
      }
      
      const content = JSON.parse(report.content)
      const fileName = `${report.title}_${new Date().toISOString().split('T')[0]}.${format}`
      const documentsPath = app.getPath('documents')
      const filePath = path.join(documentsPath, 'ChangXiangTeacher', 'Reports', fileName)
      
      // 确保目录存在
      const dirPath = path.dirname(filePath)
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
      }
      
      if (format === 'html') {
        const htmlContent = generateReportHTML(report, content)
        fs.writeFileSync(filePath, htmlContent, 'utf8')
      } else if (format === 'excel') {
        // 这里可以集成 Excel 生成库
        return { success: false, error: 'Excel 导出功能待实现' }
      } else if (format === 'pdf') {
        // 这里可以集成 PDF 生成库
        return { success: false, error: 'PDF 导出功能待实现' }
      }
      
      return {
        success: true,
        data: {
          file_path: filePath,
          file_name: fileName
        }
      }
    } catch (error) {
      console.error('导出成绩报告失败:', error)
      return { success: false, error: error.message }
    }
  })
  
  // 删除成绩报告
  ipcMain.handle('grades:deleteReport', async (_, reportId: number) => {
    try {
      const result = await dbManager.run('DELETE FROM grade_reports WHERE id = ?', [reportId])
      
      if (result.changes === 0) {
        return { success: false, error: '报告不存在' }
      }
      
      return { success: true }
    } catch (error) {
      console.error('删除成绩报告失败:', error)
      return { success: false, error: error.message }
    }
  })
}

// 生成改进建议
function generateImprovementSuggestions(score: number, averageScore: number): string[] {
  const suggestions: string[] = []
  const gap = averageScore - score
  
  if (gap > 20) {
    suggestions.push('建议加强基础知识学习')
    suggestions.push('增加课后练习时间')
    suggestions.push('寻求老师或同学帮助')
  } else if (gap > 10) {
    suggestions.push('重点复习薄弱知识点')
    suggestions.push('提高学习效率')
  } else {
    suggestions.push('保持当前学习状态')
    suggestions.push('适当提高学习难度')
  }
  
  return suggestions
}

// 生成报告HTML
function generateReportHTML(report: any, content: any): string {
  const reportType = report.report_type
  
  if (reportType === 'class_summary') {
    return generateClassSummaryHTML(report, content)
  } else if (reportType === 'comparison') {
    return generateComparisonHTML(report, content)
  }
  
  return '<html><body><h1>报告内容</h1></body></html>'
}

// 生成班级总结报告HTML
function generateClassSummaryHTML(report: any, analysis: ClassGradeAnalysis): string {
  const stats = analysis.statistics
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${report.title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
        .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        .stat-value { font-size: 24px; font-weight: bold; color: #2196F3; }
        .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .table th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${report.title}</h1>
        <p>生成时间: ${new Date(report.created_at).toLocaleString()}</p>
    </div>
    
    <div class="stats-grid">
        <div class="stat-card">
            <h3>总人数</h3>
            <div class="stat-value">${stats.total_students}</div>
        </div>
        <div class="stat-card">
            <h3>平均分</h3>
            <div class="stat-value">${stats.average_score}</div>
        </div>
        <div class="stat-card">
            <h3>及格率</h3>
            <div class="stat-value">${stats.pass_rate}%</div>
        </div>
        <div class="stat-card">
            <h3>优秀率</h3>
            <div class="stat-value">${stats.excellent_rate}%</div>
        </div>
        <div class="stat-card">
            <h3>最高分</h3>
            <div class="stat-value">${stats.max_score}</div>
        </div>
        <div class="stat-card">
            <h3>最低分</h3>
            <div class="stat-value">${stats.min_score}</div>
        </div>
    </div>
    
    <h2>分数分布</h2>
    <table class="table">
        <thead>
            <tr><th>分数段</th><th>人数</th><th>占比</th></tr>
        </thead>
        <tbody>
            ${stats.score_distribution.map(d => `
                <tr>
                    <td>${d.range}</td>
                    <td>${d.count}</td>
                    <td>${((d.count / stats.total_students) * 100).toFixed(1)}%</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    
    <h2>优秀学生 (前5名)</h2>
    <table class="table">
        <thead>
            <tr><th>排名</th><th>姓名</th><th>分数</th></tr>
        </thead>
        <tbody>
            ${analysis.top_students.map(s => `
                <tr>
                    <td>${s.rank}</td>
                    <td>${s.student_name}</td>
                    <td>${s.score}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    
    ${analysis.improvement_needed.length > 0 ? `
    <h2>需要关注的学生</h2>
    <table class="table">
        <thead>
            <tr><th>姓名</th><th>分数</th><th>改进建议</th></tr>
        </thead>
        <tbody>
            ${analysis.improvement_needed.map(s => `
                <tr>
                    <td>${s.student_name}</td>
                    <td>${s.score}</td>
                    <td>${s.suggestions.join('; ')}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    ` : ''}
</body>
</html>
  `
}

// 生成对比分析报告HTML
function generateComparisonHTML(report: any, analysis: any): string {
  const summary = analysis.summary
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${report.title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
        .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        .stat-value { font-size: 24px; font-weight: bold; color: #2196F3; }
        .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .table th { background-color: #f2f2f2; }
        .trend-up { color: #4CAF50; }
        .trend-down { color: #f44336; }
        .trend-stable { color: #FF9800; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${report.title}</h1>
        <p>生成时间: ${new Date(report.created_at).toLocaleString()}</p>
    </div>
    
    <div class="stats-grid">
        <div class="stat-card">
            <h3>总人数</h3>
            <div class="stat-value">${summary.total_students}</div>
        </div>
        <div class="stat-card">
            <h3>进步人数</h3>
            <div class="stat-value">${summary.improved_students}</div>
        </div>
        <div class="stat-card">
            <h3>退步人数</h3>
            <div class="stat-value">${summary.declined_students}</div>
        </div>
        <div class="stat-card">
            <h3>期中平均分</h3>
            <div class="stat-value">${summary.avg_midterm_score}</div>
        </div>
        <div class="stat-card">
            <h3>期末平均分</h3>
            <div class="stat-value">${summary.avg_final_score}</div>
        </div>
        <div class="stat-card">
            <h3>平均提升</h3>
            <div class="stat-value">${summary.avg_improvement}</div>
        </div>
    </div>
    
    <h2>进步最大的学生</h2>
    <table class="table">
        <thead>
            <tr><th>姓名</th><th>期中成绩</th><th>期末成绩</th><th>提升幅度</th><th>排名变化</th></tr>
        </thead>
        <tbody>
            ${analysis.top_improvers.map(s => `
                <tr>
                    <td>${s.student_name}</td>
                    <td>${s.midterm_score}</td>
                    <td>${s.final_score}</td>
                    <td class="trend-up">+${s.improvement}</td>
                    <td>${s.rank_change > 0 ? `↑${s.rank_change}` : s.rank_change < 0 ? `↓${Math.abs(s.rank_change)}` : '-'}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    
    ${analysis.need_attention.length > 0 ? `
    <h2>需要重点关注的学生</h2>
    <table class="table">
        <thead>
            <tr><th>姓名</th><th>期中成绩</th><th>期末成绩</th><th>退步幅度</th><th>排名变化</th></tr>
        </thead>
        <tbody>
            ${analysis.need_attention.map(s => `
                <tr>
                    <td>${s.student_name}</td>
                    <td>${s.midterm_score}</td>
                    <td>${s.final_score}</td>
                    <td class="trend-down">${s.improvement}</td>
                    <td>${s.rank_change > 0 ? `↑${s.rank_change}` : s.rank_change < 0 ? `↓${Math.abs(s.rank_change)}` : '-'}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    ` : ''}
</body>
</html>
  `
}