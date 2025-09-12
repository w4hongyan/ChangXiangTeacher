// 成绩报告相关类型定义

// 基础报告信息
export interface BaseReport {
  id: string
  title: string
  type: 'class_summary' | 'comparison' | 'individual' | 'subject_analysis'
  class_id: string
  class_name: string
  subject: string
  semester: string
  year: number
  created_at: string
  updated_at: string
  created_by: string
}

// 班级成绩总结报告
export interface ClassSummaryReport extends BaseReport {
  type: 'class_summary'
  data: {
    exam_info: {
      exam_name: string
      exam_date: string
      total_score: number
    }
    statistics: {
      total_students: number
      avg_score: number
      max_score: number
      min_score: number
      pass_rate: number
      excellent_rate: number
      std_deviation: number
    }
    score_distribution: {
      range: string
      count: number
      percentage: number
    }[]
    top_students: {
      student_id: string
      student_name: string
      score: number
      rank: number
      improvement?: number
    }[]
    need_attention: {
      student_id: string
      student_name: string
      score: number
      rank: number
      issues: string[]
    }[]
    analysis: {
      strengths: string[]
      weaknesses: string[]
      suggestions: string[]
    }
  }
}

// 期中期末对比报告
export interface ComparisonReport extends BaseReport {
  type: 'comparison'
  data: {
    summary: {
      total_students: number
      avg_midterm_score: number
      avg_final_score: number
      avg_improvement: number
      improved_students: number
      declined_students: number
      stable_students: number
    }
    comparisons: {
      student_id: string
      student_name: string
      midterm_score: number
      final_score: number
      improvement: number
      rank_change: number
      trend: 'up' | 'down' | 'stable'
    }[]
    top_improvers: {
      student_id: string
      student_name: string
      midterm_score: number
      final_score: number
      improvement: number
      rank_change: number
      trend: 'up' | 'down' | 'stable'
    }[]
    need_attention: {
      student_id: string
      student_name: string
      midterm_score: number
      final_score: number
      improvement: number
      rank_change: number
      issues: string[]
    }[]
  }
}

// 个人成绩报告
export interface IndividualReport extends BaseReport {
  type: 'individual'
  data: {
    student_info: {
      student_id: string
      student_name: string
      student_number: string
    }
    exam_records: {
      exam_name: string
      exam_date: string
      score: number
      rank: number
      total_students: number
      subject_avg: number
      class_avg: number
    }[]
    trend_analysis: {
      overall_trend: 'improving' | 'declining' | 'stable'
      recent_performance: 'excellent' | 'good' | 'average' | 'poor'
      strengths: string[]
      areas_for_improvement: string[]
    }
    recommendations: string[]
  }
}

// 学科分析报告
export interface SubjectAnalysisReport extends BaseReport {
  type: 'subject_analysis'
  data: {
    subject_info: {
      subject_name: string
      exam_count: number
      date_range: {
        start: string
        end: string
      }
    }
    class_comparison: {
      class_id: string
      class_name: string
      avg_score: number
      rank: number
      student_count: number
    }[]
    difficulty_analysis: {
      topic: string
      avg_score: number
      difficulty_level: 'easy' | 'medium' | 'hard'
      common_mistakes: string[]
    }[]
    teaching_suggestions: string[]
  }
}

// 报告生成参数
export interface ReportGenerationParams {
  type: 'class_summary' | 'comparison' | 'individual' | 'subject_analysis'
  title: string
  class_id: string
  subject: string
  semester: string
  year: number
  
  // 班级总结报告参数
  exam_id?: string
  
  // 对比报告参数
  midterm_exam_id?: string
  final_exam_id?: string
  
  // 个人报告参数
  student_id?: string
  
  // 学科分析报告参数
  start_date?: string
  end_date?: string
  include_classes?: string[]
}

// 报告查询参数
export interface ReportQueryParams {
  type?: 'class_summary' | 'comparison' | 'individual' | 'subject_analysis'
  class_id?: string
  subject?: string
  semester?: string
  year?: number
  created_by?: string
  start_date?: string
  end_date?: string
  page?: number
  limit?: number
  sort_by?: 'created_at' | 'updated_at' | 'title'
  sort_order?: 'asc' | 'desc'
}

// 报告导出参数
export interface ReportExportParams {
  report_id: string
  format: 'pdf' | 'excel' | 'word'
  include_charts?: boolean
  include_raw_data?: boolean
  template?: string
}

// 报告统计信息
export interface ReportStatistics {
  total_reports: number
  reports_by_type: {
    type: string
    count: number
  }[]
  reports_by_subject: {
    subject: string
    count: number
  }[]
  recent_reports: BaseReport[]
  popular_templates: {
    template_name: string
    usage_count: number
  }[]
}

// 报告模板
export interface ReportTemplate {
  id: string
  name: string
  type: 'class_summary' | 'comparison' | 'individual' | 'subject_analysis'
  description: string
  layout: {
    sections: {
      id: string
      title: string
      type: 'text' | 'table' | 'chart' | 'statistics'
      config: any
      order: number
    }[]
    styles: {
      font_family: string
      font_size: number
      colors: {
        primary: string
        secondary: string
        accent: string
      }
      spacing: {
        margin: number
        padding: number
      }
    }
  }
  is_default: boolean
  created_at: string
  updated_at: string
}

// 报告生成状态
export interface ReportGenerationStatus {
  id: string
  status: 'pending' | 'generating' | 'completed' | 'failed'
  progress: number
  message?: string
  result?: {
    report_id: string
    file_path?: string
  }
  error?: string
  created_at: string
  updated_at: string
}

// 报告分享设置
export interface ReportSharingSettings {
  report_id: string
  is_public: boolean
  share_link?: string
  password_protected: boolean
  password?: string
  expiry_date?: string
  allowed_users?: string[]
  permissions: {
    can_view: boolean
    can_download: boolean
    can_comment: boolean
  }
}

// 报告评论
export interface ReportComment {
  id: string
  report_id: string
  user_id: string
  user_name: string
  content: string
  created_at: string
  updated_at: string
  replies?: ReportComment[]
}

// 报告版本
export interface ReportVersion {
  id: string
  report_id: string
  version: number
  title: string
  data: any
  changes: string[]
  created_by: string
  created_at: string
}

// 联合类型
export type AnyReport = ClassSummaryReport | ComparisonReport | IndividualReport | SubjectAnalysisReport

// 报告操作结果
export interface ReportOperationResult {
  success: boolean
  message: string
  data?: any
  error?: string
}

// 报告筛选选项
export interface ReportFilterOptions {
  types: { label: string; value: string }[]
  subjects: { label: string; value: string }[]
  classes: { label: string; value: string }[]
  semesters: { label: string; value: string }[]
  years: { label: string; value: number }[]
  creators: { label: string; value: string }[]
}

// 报告预览数据
export interface ReportPreviewData {
  title: string
  type: string
  summary: string
  key_metrics: {
    label: string
    value: string | number
    trend?: 'up' | 'down' | 'stable'
  }[]
  charts: {
    type: 'bar' | 'line' | 'pie' | 'scatter'
    title: string
    data: any
  }[]
}