<template>
  <div class="dynamic-form">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      label-position="left"
    >
      <div v-for="variable in variables" :key="variable.name" class="form-item-wrapper">
        <!-- 文本输入 -->
        <el-form-item
          v-if="variable.type === 'text'"
          :label="variable.label"
          :prop="variable.name"
        >
          <el-input
            v-model="formData[variable.name]"
            :placeholder="variable.placeholder"
            clearable
          />
        </el-form-item>

        <!-- 数字输入 -->
        <el-form-item
          v-else-if="variable.type === 'number'"
          :label="variable.label"
          :prop="variable.name"
        >
          <el-input-number
            v-model="formData[variable.name]"
            :min="variable.validation?.min"
            :max="variable.validation?.max"
            :placeholder="variable.placeholder"
            style="width: 100%"
          />
        </el-form-item>

        <!-- 日期选择 -->
        <el-form-item
          v-else-if="variable.type === 'date'"
          :label="variable.label"
          :prop="variable.name"
        >
          <el-date-picker
            v-model="formData[variable.name]"
            type="date"
            :placeholder="variable.placeholder || '选择日期'"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>

        <!-- 下拉选择 -->
        <el-form-item
          v-else-if="variable.type === 'select'"
          :label="variable.label"
          :prop="variable.name"
        >
          <el-select
            v-model="formData[variable.name]"
            :placeholder="variable.placeholder || '请选择'"
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="option in variable.options"
              :key="option"
              :label="option"
              :value="option"
            />
          </el-select>
        </el-form-item>

        <!-- 多行文本 -->
        <el-form-item
          v-else-if="variable.type === 'textarea'"
          :label="variable.label"
          :prop="variable.name"
        >
          <el-input
            v-model="formData[variable.name]"
            type="textarea"
            :placeholder="variable.placeholder"
            :rows="4"
            resize="vertical"
          />
        </el-form-item>

        <!-- 布尔值开关 -->
        <el-form-item
          v-else-if="variable.type === 'boolean'"
          :label="variable.label"
          :prop="variable.name"
        >
          <el-switch
            v-model="formData[variable.name]"
            :active-text="'是'"
            :inactive-text="'否'"
          />
        </el-form-item>

        <!-- 变量说明 -->
        <div v-if="variable.validation?.message" class="variable-hint">
          <el-text type="info" size="small">
            <el-icon><InfoFilled /></el-icon>
            {{ variable.validation.message }}
          </el-text>
        </div>
      </div>

      <!-- 表单操作按钮 -->
      <div class="form-actions" v-if="showActions">
        <el-button @click="handleReset">重置</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ submitText }}
        </el-button>
      </div>
    </el-form>

    <!-- 实时预览 -->
    <div v-if="showPreview" class="form-preview">
      <el-divider>实时预览</el-divider>
      <div class="preview-content" v-html="previewContent"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'
import { TemplateVariableParser, type TemplateVariable } from '../utils/templateVariableParser'

interface Props {
  variables: TemplateVariable[]
  templateContent?: string
  initialValues?: Record<string, any>
  showActions?: boolean
  showPreview?: boolean
  submitText?: string
  submitting?: boolean
}

interface Emits {
  submit: [values: Record<string, any>]
  change: [values: Record<string, any>]
  reset: []
}

const props = withDefaults(defineProps<Props>(), {
  showActions: true,
  showPreview: false,
  submitText: '提交',
  submitting: false
})

const emit = defineEmits<Emits>()

// 表单引用
const formRef = ref<FormInstance>()

// 表单数据
const formData = reactive<Record<string, any>>({})

// 初始化表单数据
const initFormData = () => {
  // 清空现有数据
  Object.keys(formData).forEach(key => {
    delete formData[key]
  })
  
  // 设置默认值
  props.variables.forEach(variable => {
    if (props.initialValues && props.initialValues[variable.name] !== undefined) {
      formData[variable.name] = props.initialValues[variable.name]
    } else if (variable.defaultValue !== undefined) {
      formData[variable.name] = variable.defaultValue
    } else {
      // 根据类型设置默认值
      switch (variable.type) {
        case 'boolean':
          formData[variable.name] = false
          break
        case 'number':
          formData[variable.name] = undefined
          break
        default:
          formData[variable.name] = ''
      }
    }
  })
}

// 表单验证规则
const formRules = computed<FormRules>(() => {
  const rules: FormRules = {}
  
  props.variables.forEach(variable => {
    const variableRules: any[] = []
    
    // 必填验证
    if (variable.required) {
      variableRules.push({
        required: true,
        message: `${variable.label}是必填项`,
        trigger: variable.type === 'select' ? 'change' : 'blur'
      })
    }
    
    // 类型验证
    if (variable.type === 'number') {
      variableRules.push({
        type: 'number',
        message: `${variable.label}必须是数字`,
        trigger: 'blur',
        transform: (value: any) => {
          if (value === '' || value === null || value === undefined) {
            return value
          }
          return Number(value)
        }
      })
    }
    
    // 自定义验证规则
    if (variable.validation) {
      const { min, max, pattern, message } = variable.validation
      
      if (min !== undefined || max !== undefined) {
        variableRules.push({
          validator: (rule: any, value: any, callback: any) => {
            if (value === '' || value === null || value === undefined) {
              callback()
              return
            }
            
            const numValue = Number(value)
            if (min !== undefined && numValue < min) {
              callback(new Error(message || `${variable.label}不能小于${min}`))
              return
            }
            
            if (max !== undefined && numValue > max) {
              callback(new Error(message || `${variable.label}不能大于${max}`))
              return
            }
            
            callback()
          },
          trigger: 'blur'
        })
      }
      
      if (pattern) {
        variableRules.push({
          pattern: new RegExp(pattern),
          message: message || `${variable.label}格式不正确`,
          trigger: 'blur'
        })
      }
    }
    
    if (variableRules.length > 0) {
      rules[variable.name] = variableRules
    }
  })
  
  return rules
})

// 实时预览内容
const previewContent = computed(() => {
  if (!props.templateContent) return ''
  
  try {
    return TemplateVariableParser.replaceVariables(props.templateContent, formData)
  } catch (error) {
    console.error('预览生成失败:', error)
    return '预览生成失败'
  }
})

// 监听变量变化，重新初始化表单
watch(
  () => props.variables,
  () => {
    initFormData()
  },
  { immediate: true, deep: true }
)

// 监听初始值变化
watch(
  () => props.initialValues,
  () => {
    initFormData()
  },
  { deep: true }
)

// 监听表单数据变化，触发change事件
watch(
  formData,
  (newData) => {
    emit('change', { ...newData })
  },
  { deep: true }
)

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    emit('submit', { ...formData })
  } catch (error) {
    ElMessage.error('请检查表单填写是否正确')
  }
}

// 重置表单
const handleReset = () => {
  if (!formRef.value) return
  
  formRef.value.resetFields()
  initFormData()
  emit('reset')
}

// 手动验证表单
const validate = async (): Promise<boolean> => {
  if (!formRef.value) return false
  
  try {
    await formRef.value.validate()
    return true
  } catch (error) {
    return false
  }
}

// 获取表单数据
const getFormData = () => {
  return { ...formData }
}

// 设置表单数据
const setFormData = (data: Record<string, any>) => {
  Object.keys(formData).forEach(key => {
    if (data[key] !== undefined) {
      formData[key] = data[key]
    }
  })
}

// 暴露方法给父组件
defineExpose({
  validate,
  getFormData,
  setFormData,
  reset: handleReset
})
</script>

<style scoped>
.dynamic-form {
  width: 100%;
}

.form-item-wrapper {
  margin-bottom: 20px;
}

.variable-hint {
  margin-top: 5px;
  padding-left: 120px;
}

.form-actions {
  margin-top: 30px;
  text-align: right;
  padding-top: 20px;
  border-top: 1px solid var(--el-border-color-light);
}

.form-actions .el-button {
  margin-left: 10px;
}

.form-preview {
  margin-top: 30px;
}

.preview-content {
  padding: 20px;
  background-color: var(--el-bg-color-page);
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  white-space: pre-wrap;
  line-height: 1.6;
  font-family: 'Microsoft YaHei', sans-serif;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .variable-hint {
    padding-left: 0;
    margin-top: 8px;
  }
  
  .form-actions {
    text-align: center;
  }
  
  .form-actions .el-button {
    margin: 5px;
  }
}
</style>