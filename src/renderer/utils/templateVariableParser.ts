/**
 * 模板变量解析器
 * 用于智能识别模板中的变量并生成动态表单
 */

export interface TemplateVariable {
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'boolean'
  required: boolean
  defaultValue?: any
  options?: string[] // 用于select类型
  placeholder?: string
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
}

export interface ParsedTemplate {
  content: string
  variables: TemplateVariable[]
  variableMap: Map<string, TemplateVariable>
}

/**
 * 模板变量解析器类
 */
export class TemplateVariableParser {
  // 变量匹配正则表达式
  private static readonly VARIABLE_REGEX = /\{\{\s*([^}]+)\s*\}\}/g
  
  // 预定义变量类型映射
  private static readonly TYPE_MAPPING: Record<string, TemplateVariable['type']> = {
    // 日期相关
    'date': 'date',
    'time': 'date',
    'year': 'number',
    'month': 'number',
    'day': 'number',
    
    // 数字相关
    'score': 'number',
    'grade': 'number',
    'count': 'number',
    'number': 'number',
    'age': 'number',
    
    // 文本相关
    'name': 'text',
    'title': 'text',
    'subject': 'text',
    'teacher': 'text',
    'student': 'text',
    'class': 'text',
    
    // 长文本
    'content': 'textarea',
    'description': 'textarea',
    'remark': 'textarea',
    'note': 'textarea',
    
    // 布尔值
    'completed': 'boolean',
    'passed': 'boolean',
    'active': 'boolean'
  }
  
  // 预定义选项映射
  private static readonly OPTIONS_MAPPING: Record<string, string[]> = {
    'gender': ['男', '女'],
    'semester': ['上学期', '下学期'],
    'level': ['优秀', '良好', '及格', '不及格'],
    'status': ['正常', '请假', '迟到', '早退'],
    'subject': ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治']
  }

  /**
   * 解析模板内容，提取变量信息
   */
  static parseTemplate(content: string): ParsedTemplate {
    const variables: TemplateVariable[] = []
    const variableMap = new Map<string, TemplateVariable>()
    const matches = content.matchAll(this.VARIABLE_REGEX)
    
    for (const match of matches) {
      const variableExpression = match[1].trim()
      const variable = this.parseVariableExpression(variableExpression)
      
      if (!variableMap.has(variable.name)) {
        variables.push(variable)
        variableMap.set(variable.name, variable)
      }
    }
    
    return {
      content,
      variables,
      variableMap
    }
  }
  
  /**
   * 解析单个变量表达式
   * 支持格式：
   * - {{name}} - 基本变量
   * - {{name:text}} - 指定类型
   * - {{name:select:选项1,选项2,选项3}} - 选择类型带选项
   * - {{name:text:required}} - 必填字段
   * - {{name:number:min=0,max=100}} - 数字类型带验证
   */
  private static parseVariableExpression(expression: string): TemplateVariable {
    const parts = expression.split(':')
    const name = parts[0].trim()
    
    // 生成友好的标签名
    const label = this.generateLabel(name)
    
    // 默认变量配置
    const variable: TemplateVariable = {
      name,
      label,
      type: 'text',
      required: false,
      placeholder: `请输入${label}`
    }
    
    // 根据变量名推断类型
    const inferredType = this.inferTypeFromName(name)
    if (inferredType) {
      variable.type = inferredType
    }
    
    // 根据变量名设置选项
    const options = this.getOptionsForName(name)
    if (options) {
      variable.type = 'select'
      variable.options = options
    }
    
    // 解析类型声明
    if (parts.length > 1) {
      const typeDeclaration = parts[1].trim()
      if (typeDeclaration in this.TYPE_MAPPING) {
        variable.type = typeDeclaration as TemplateVariable['type']
      }
    }
    
    // 解析选项或验证规则
    if (parts.length > 2) {
      const optionsOrRules = parts[2].trim()
      
      if (variable.type === 'select') {
        // 解析选项
        variable.options = optionsOrRules.split(',').map(opt => opt.trim())
      } else {
        // 解析验证规则
        this.parseValidationRules(variable, optionsOrRules)
      }
    }
    
    // 解析额外规则
    if (parts.length > 3) {
      const extraRules = parts[3].trim()
      this.parseValidationRules(variable, extraRules)
    }
    
    return variable
  }
  
  /**
   * 根据变量名推断类型
   */
  private static inferTypeFromName(name: string): TemplateVariable['type'] | null {
    const lowerName = name.toLowerCase()
    
    for (const [keyword, type] of Object.entries(this.TYPE_MAPPING)) {
      if (lowerName.includes(keyword)) {
        return type
      }
    }
    
    return null
  }
  
  /**
   * 根据变量名获取预定义选项
   */
  private static getOptionsForName(name: string): string[] | null {
    const lowerName = name.toLowerCase()
    
    for (const [keyword, options] of Object.entries(this.OPTIONS_MAPPING)) {
      if (lowerName.includes(keyword)) {
        return options
      }
    }
    
    return null
  }
  
  /**
   * 生成友好的标签名
   */
  private static generateLabel(name: string): string {
    // 常见变量名映射
    const labelMap: Record<string, string> = {
      'studentName': '学生姓名',
      'teacherName': '教师姓名',
      'className': '班级名称',
      'subject': '科目',
      'date': '日期',
      'time': '时间',
      'score': '分数',
      'grade': '年级',
      'semester': '学期',
      'content': '内容',
      'title': '标题',
      'description': '描述',
      'remark': '备注'
    }
    
    if (labelMap[name]) {
      return labelMap[name]
    }
    
    // 将驼峰命名转换为中文标签
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim()
  }
  
  /**
   * 解析验证规则
   */
  private static parseValidationRules(variable: TemplateVariable, rules: string): void {
    const ruleList = rules.split(',')
    
    for (const rule of ruleList) {
      const trimmedRule = rule.trim()
      
      if (trimmedRule === 'required') {
        variable.required = true
      } else if (trimmedRule.startsWith('min=')) {
        const min = parseInt(trimmedRule.substring(4))
        if (!isNaN(min)) {
          variable.validation = variable.validation || {}
          variable.validation.min = min
        }
      } else if (trimmedRule.startsWith('max=')) {
        const max = parseInt(trimmedRule.substring(4))
        if (!isNaN(max)) {
          variable.validation = variable.validation || {}
          variable.validation.max = max
        }
      } else if (trimmedRule.startsWith('pattern=')) {
        const pattern = trimmedRule.substring(8)
        variable.validation = variable.validation || {}
        variable.validation.pattern = pattern
      }
    }
  }
  
  /**
   * 替换模板中的变量
   */
  static replaceVariables(content: string, values: Record<string, any>): string {
    return content.replace(this.VARIABLE_REGEX, (match, variableName) => {
      const name = variableName.split(':')[0].trim()
      return values[name] !== undefined ? String(values[name]) : match
    })
  }
  
  /**
   * 验证变量值
   */
  static validateVariableValue(variable: TemplateVariable, value: any): string | null {
    // 必填验证
    if (variable.required && (value === undefined || value === null || value === '')) {
      return `${variable.label}是必填项`
    }
    
    // 如果值为空且非必填，跳过其他验证
    if (value === undefined || value === null || value === '') {
      return null
    }
    
    // 类型验证
    if (variable.type === 'number' && isNaN(Number(value))) {
      return `${variable.label}必须是数字`
    }
    
    // 验证规则
    if (variable.validation) {
      const { min, max, pattern, message } = variable.validation
      
      if (min !== undefined && Number(value) < min) {
        return message || `${variable.label}不能小于${min}`
      }
      
      if (max !== undefined && Number(value) > max) {
        return message || `${variable.label}不能大于${max}`
      }
      
      if (pattern && !new RegExp(pattern).test(String(value))) {
        return message || `${variable.label}格式不正确`
      }
    }
    
    return null
  }
}