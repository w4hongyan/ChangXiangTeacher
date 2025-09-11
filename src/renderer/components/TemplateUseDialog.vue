<template>
  <el-dialog
    v-model="visible"
    :title="`使用模板：${template?.name || ''}`"
    width="800px"
    :before-close="handleClose"
  >
    <div class="template-use-container">
      <!-- 模板信息 -->
      <div class="template-info" v-if="template">
        <h3>{{ template.name }}</h3>
        <p class="template-desc">{{ template.description }}</p>
      </div>

      <!-- 数据填写表单 -->
      <div class="data-form" v-if="variables.length > 0">
        <h4>请填写以下信息：</h4>
        <el-form :model="formData" label-width="120px" class="form-content">
          <el-form-item
            v-for="variable in variables"
            :key="variable.name"
            :label="variable.label"
            :required="variable.required"
          >
            <el-input
              v-if="variable.type === 'text'"
              v-model="formData[variable.name]"
              :placeholder="variable.placeholder || `请输入${variable.label}`"
            />
            <el-input
              v-else-if="variable.type === 'textarea'"
              v-model="formData[variable.name]"
              type="textarea"
              :rows="3"
              :placeholder="variable.placeholder || `请输入${variable.label}`"
            />
            <el-date-picker
              v-else-if="variable.type === 'date'"
              v-model="formData[variable.name]"
              type="date"
              :placeholder="variable.placeholder || `请选择${variable.label}`"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />
            <el-select
              v-else-if="variable.type === 'select'"
              v-model="formData[variable.name]"
              :placeholder="variable.placeholder || `请选择${variable.label}`"
            >
              <el-option
                v-for="option in variable.options"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
            <el-input
              v-else
              v-model="formData[variable.name]"
              :placeholder="variable.placeholder || `请输入${variable.label}`"
            />
          </el-form-item>
        </el-form>
      </div>

      <!-- 预览区域 -->
      <div class="preview-section" v-if="previewContent">
        <h4>预览效果：</h4>
        <div class="preview-content" v-html="previewContent"></div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="generatePreview" :disabled="!canPreview">
          预览
        </el-button>
        <el-button type="success" @click="generateDocument" :disabled="!canGenerate">
          生成文档
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'

interface TemplateVariable {
  name: string
  label: string
  type: 'text' | 'textarea' | 'date' | 'select'
  required?: boolean
  placeholder?: string
  options?: { label: string; value: string }[]
}

interface Template {
  id: number
  name: string
  description: string
  content: string
  variables?: TemplateVariable[]
}

const props = defineProps<{
  modelValue: boolean
  template: Template | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'document-generated': [data: any]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const formData = ref<Record<string, any>>({})
const previewContent = ref('')

// 从模板内容中提取变量
const variables = computed(() => {
  if (!props.template?.content) return []
  
  // 提取 {{variable}} 格式的变量
  const matches = props.template.content.match(/\{\{([^}]+)\}\}/g) || []
  const variableNames = matches.map(match => match.replace(/[{}]/g, ''))
  
  // 生成变量配置
  const vars: TemplateVariable[] = []
  const uniqueNames = [...new Set(variableNames)]
  
  uniqueNames.forEach(name => {
    let label = name
    let type: TemplateVariable['type'] = 'text'
    
    // 根据变量名推断类型和标签
    if (name.includes('className') || name.includes('class')) {
      label = '班级名称'
    } else if (name.includes('semester') || name.includes('year')) {
      label = '学期/学年'
    } else if (name.includes('student')) {
      label = '学生姓名'
    } else if (name.includes('duty')) {
      label = '值日内容'
      type = 'textarea'
    } else if (name.includes('date')) {
      label = '日期'
      type = 'date'
    } else if (name.includes('teacher')) {
      label = '教师姓名'
    } else {
      // 将驼峰命名转换为中文标签
      label = name.replace(/([A-Z])/g, ' $1').trim()
    }
    
    vars.push({
      name,
      label,
      type,
      required: true
    })
  })
  
  return vars
})

// 检查是否可以预览
const canPreview = computed(() => {
  return variables.value.length === 0 || variables.value.some(v => formData.value[v.name])
})

// 检查是否可以生成文档
const canGenerate = computed(() => {
  if (variables.value.length === 0) return true
  return variables.value.filter(v => v.required).every(v => formData.value[v.name])
})

// 监听模板变化，重置表单数据
watch(() => props.template, (newTemplate) => {
  if (newTemplate) {
    formData.value = {}
    previewContent.value = ''
    
    // 为变量设置默认值
    variables.value.forEach(variable => {
      if (variable.name.includes('className')) {
        formData.value[variable.name] = '一年级(1)班'
      } else if (variable.name.includes('semester')) {
        formData.value[variable.name] = '2024-2025学年第一学期'
      } else if (variable.name.includes('monday_student')) {
        formData.value[variable.name] = '张三'
      } else if (variable.name.includes('monday_duty')) {
        formData.value[variable.name] = '擦黑板、整理讲台'
      }
    })
  }
}, { immediate: true })

// 生成预览
const generatePreview = () => {
  if (!props.template?.content) return
  
  let content = props.template.content
  
  // 如果是JSON格式，解析content字段
  try {
    const parsed = JSON.parse(content)
    if (parsed.content) {
      content = parsed.content
    }
  } catch (e) {
    // 不是JSON格式，直接使用
  }
  
  // 替换变量
  variables.value.forEach(variable => {
    const value = formData.value[variable.name] || `[${variable.label}]`
    const regex = new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g')
    content = content.replace(regex, value)
  })
  
  previewContent.value = content
  ElMessage.success('预览生成成功')
}

// 生成文档
const generateDocument = async () => {
  if (!props.template) return
  
  try {
    // 生成最终内容
    generatePreview()
    
    // 创建生成记录
    const documentData = {
      templateId: props.template.id,
      templateName: props.template.name,
      content: previewContent.value,
      data: { ...formData.value },
      generatedAt: new Date().toISOString()
    }
    
    // 触发文档生成事件
    emit('document-generated', documentData)
    
    ElMessage.success('文档生成成功！')
    handleClose()
  } catch (error) {
    console.error('生成文档失败:', error)
    ElMessage.error('生成文档失败')
  }
}

// 关闭对话框
const handleClose = () => {
  visible.value = false
  previewContent.value = ''
}
</script>

<style scoped>
.template-use-container {
  max-height: 600px;
  overflow-y: auto;
}

.template-info {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.template-info h3 {
  margin: 0 0 8px 0;
  color: #303133;
}

.template-desc {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.data-form {
  margin-bottom: 20px;
}

.data-form h4 {
  margin: 0 0 15px 0;
  color: #303133;
}

.form-content {
  max-height: 300px;
  overflow-y: auto;
}

.preview-section {
  margin-top: 20px;
}

.preview-section h4 {
  margin: 0 0 15px 0;
  color: #303133;
}

.preview-content {
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  padding: 15px;
  background-color: #fff;
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
}

.preview-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
}

.preview-content :deep(th),
.preview-content :deep(td) {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: center;
}

.preview-content :deep(th) {
  background-color: #f5f5f5;
  font-weight: bold;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>