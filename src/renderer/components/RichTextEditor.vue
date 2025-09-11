<template>
  <div class="rich-text-editor">
    <!-- 工具栏 -->
    <div class="editor-toolbar">
      <!-- 基础格式化工具 -->
      <div class="toolbar-group">
        <el-button-group>
          <el-button
            size="small"
            :type="isActive('bold') ? 'primary' : ''"
            @click="toggleFormat('bold')"
            title="粗体"
          >
            <el-icon><Bold /></el-icon>
          </el-button>
          <el-button
            size="small"
            :type="isActive('italic') ? 'primary' : ''"
            @click="toggleFormat('italic')"
            title="斜体"
          >
            <el-icon><Italic /></el-icon>
          </el-button>
          <el-button
            size="small"
            :type="isActive('underline') ? 'primary' : ''"
            @click="toggleFormat('underline')"
            title="下划线"
          >
            <el-icon><Underline /></el-icon>
          </el-button>
        </el-button-group>
      </div>

      <el-divider direction="vertical" />

      <!-- 标题工具 -->
      <div class="toolbar-group">
        <el-select
          v-model="currentHeading"
          size="small"
          style="width: 100px"
          @change="setHeading"
          placeholder="标题"
        >
          <el-option label="正文" value="" />
          <el-option label="标题1" value="h1" />
          <el-option label="标题2" value="h2" />
          <el-option label="标题3" value="h3" />
        </el-select>
      </div>

      <el-divider direction="vertical" />

      <!-- 对齐工具 -->
      <div class="toolbar-group">
        <el-button-group>
          <el-button
            size="small"
            :type="isActive('justifyLeft') ? 'primary' : ''"
            @click="toggleFormat('justifyLeft')"
            title="左对齐"
          >
            <el-icon><AlignLeft /></el-icon>
          </el-button>
          <el-button
            size="small"
            :type="isActive('justifyCenter') ? 'primary' : ''"
            @click="toggleFormat('justifyCenter')"
            title="居中对齐"
          >
            <el-icon><AlignCenter /></el-icon>
          </el-button>
          <el-button
            size="small"
            :type="isActive('justifyRight') ? 'primary' : ''"
            @click="toggleFormat('justifyRight')"
            title="右对齐"
          >
            <el-icon><AlignRight /></el-icon>
          </el-button>
        </el-button-group>
      </div>

      <el-divider direction="vertical" />

      <!-- 列表工具 -->
      <div class="toolbar-group">
        <el-button-group>
          <el-button
            size="small"
            :type="isActive('insertOrderedList') ? 'primary' : ''"
            @click="toggleFormat('insertOrderedList')"
            title="有序列表"
          >
            <el-icon><List /></el-icon>
          </el-button>
          <el-button
            size="small"
            :type="isActive('insertUnorderedList') ? 'primary' : ''"
            @click="toggleFormat('insertUnorderedList')"
            title="无序列表"
          >
            <el-icon><Operation /></el-icon>
          </el-button>
        </el-button-group>
      </div>

      <el-divider direction="vertical" />

      <!-- 变量插入工具 -->
      <div class="toolbar-group">
        <el-dropdown @command="insertVariable" trigger="click">
          <el-button size="small" type="success">
            <el-icon><Plus /></el-icon>
            插入变量
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="variable in commonVariables"
                :key="variable.name"
                :command="variable"
              >
                <el-icon><Tag /></el-icon>
                {{ variable.label }}
              </el-dropdown-item>
              <el-dropdown-item divided command="custom">
                <el-icon><Edit /></el-icon>
                自定义变量...
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <el-divider direction="vertical" />

      <!-- 其他工具 -->
      <div class="toolbar-group">
        <el-button size="small" @click="insertTable" title="插入表格">
          <el-icon><Grid /></el-icon>
        </el-button>
        <el-button size="small" @click="insertHorizontalRule" title="插入分割线">
          <el-icon><Minus /></el-icon>
        </el-button>
      </div>

      <div class="toolbar-spacer"></div>

      <!-- 预览切换 -->
      <div class="toolbar-group">
        <el-button-group>
          <el-button
            size="small"
            :type="viewMode === 'edit' ? 'primary' : ''"
            @click="viewMode = 'edit'"
          >
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-button
            size="small"
            :type="viewMode === 'split' ? 'primary' : ''"
            @click="viewMode = 'split'"
          >
            <el-icon><CopyDocument /></el-icon>
            分屏
          </el-button>
          <el-button
            size="small"
            :type="viewMode === 'preview' ? 'primary' : ''"
            @click="viewMode = 'preview'"
          >
            <el-icon><View /></el-icon>
            预览
          </el-button>
        </el-button-group>
      </div>
    </div>

    <!-- 编辑器内容区域 -->
    <div class="editor-content" :class="`view-mode-${viewMode}`">
      <!-- 编辑器 -->
      <div v-show="viewMode === 'edit' || viewMode === 'split'" class="editor-panel">
        <div
          ref="editorRef"
          class="editor-area"
          contenteditable="true"
          @input="handleInput"
          @keydown="handleKeydown"
          @paste="handlePaste"
          @focus="handleFocus"
          @blur="handleBlur"
          v-html="editorContent"
        ></div>
      </div>

      <!-- 预览面板 -->
      <div v-show="viewMode === 'preview' || viewMode === 'split'" class="preview-panel">
        <div class="preview-header">
          <h4>实时预览</h4>
          <div class="preview-actions">
            <el-button size="small" @click="copyPreview">
              <el-icon><CopyDocument /></el-icon>
              复制
            </el-button>
          </div>
        </div>
        <div class="preview-content" v-html="previewContent"></div>
      </div>
    </div>

    <!-- 自定义变量对话框 -->
    <el-dialog v-model="showCustomVariableDialog" title="添加自定义变量" width="400px">
      <el-form :model="customVariableForm" label-width="80px">
        <el-form-item label="变量名">
          <el-input
            v-model="customVariableForm.name"
            placeholder="例如：studentName"
            @input="validateVariableName"
          />
          <div class="form-hint">变量名只能包含字母、数字和下划线</div>
        </el-form-item>
        <el-form-item label="显示名称">
          <el-input
            v-model="customVariableForm.label"
            placeholder="例如：学生姓名"
          />
        </el-form-item>
        <el-form-item label="变量类型">
          <el-select v-model="customVariableForm.type" style="width: 100%">
            <el-option label="文本" value="text" />
            <el-option label="数字" value="number" />
            <el-option label="日期" value="date" />
            <el-option label="选择" value="select" />
            <el-option label="多行文本" value="textarea" />
            <el-option label="是/否" value="boolean" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="customVariableForm.type === 'select'" label="选项">
          <el-input
            v-model="customVariableForm.options"
            placeholder="用逗号分隔，例如：选项1,选项2,选项3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCustomVariableDialog = false">取消</el-button>
        <el-button type="primary" @click="addCustomVariable">添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  Operation,
  Plus,
  Tag,
  Edit,
  Grid,
  Minus,
  CopyDocument,
  View
} from '@element-plus/icons-vue'
import { TemplateVariableParser } from '../utils/templateVariableParser'

interface Props {
  modelValue: string
  placeholder?: string
  readonly?: boolean
  height?: string
  previewVariables?: Record<string, any>
}

interface Emits {
  'update:modelValue': [value: string]
  'change': [value: string]
  'focus': []
  'blur': []
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请输入内容...',
  readonly: false,
  height: '400px',
  previewVariables: () => ({})
})

const emit = defineEmits<Emits>()

// 编辑器引用
const editorRef = ref<HTMLElement>()

// 视图模式
const viewMode = ref<'edit' | 'split' | 'preview'>('edit')

// 编辑器内容
const editorContent = ref('')

// 当前标题级别
const currentHeading = ref('')

// 自定义变量对话框
const showCustomVariableDialog = ref(false)
const customVariableForm = reactive({
  name: '',
  label: '',
  type: 'text',
  options: ''
})

// 常用变量
const commonVariables = [
  { name: 'studentName', label: '学生姓名' },
  { name: 'teacherName', label: '教师姓名' },
  { name: 'className', label: '班级名称' },
  { name: 'subject', label: '科目' },
  { name: 'date', label: '日期' },
  { name: 'time', label: '时间' },
  { name: 'semester', label: '学期' },
  { name: 'grade', label: '年级' },
  { name: 'score', label: '分数' },
  { name: 'rank', label: '排名' }
]

// 预览内容
const previewContent = computed(() => {
  if (!editorContent.value) return ''
  
  try {
    // 使用变量解析器替换变量
    let content = TemplateVariableParser.replaceVariables(
      editorContent.value,
      props.previewVariables
    )
    
    // 处理HTML格式
    return content
  } catch (error) {
    console.error('预览生成失败:', error)
    return editorContent.value
  }
})

// 监听外部值变化
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== editorContent.value) {
      editorContent.value = newValue
    }
  },
  { immediate: true }
)

// 监听编辑器内容变化
watch(
  editorContent,
  (newValue) => {
    emit('update:modelValue', newValue)
    emit('change', newValue)
  }
)

// 处理输入事件
const handleInput = (event: Event) => {
  const target = event.target as HTMLElement
  editorContent.value = target.innerHTML
}

// 处理键盘事件
const handleKeydown = (event: KeyboardEvent) => {
  // Ctrl+B 粗体
  if (event.ctrlKey && event.key === 'b') {
    event.preventDefault()
    toggleFormat('bold')
  }
  // Ctrl+I 斜体
  else if (event.ctrlKey && event.key === 'i') {
    event.preventDefault()
    toggleFormat('italic')
  }
  // Ctrl+U 下划线
  else if (event.ctrlKey && event.key === 'u') {
    event.preventDefault()
    toggleFormat('underline')
  }
  // Tab 缩进
  else if (event.key === 'Tab') {
    event.preventDefault()
    document.execCommand('indent')
  }
}

// 处理粘贴事件
const handlePaste = (event: ClipboardEvent) => {
  event.preventDefault()
  const text = event.clipboardData?.getData('text/plain') || ''
  document.execCommand('insertText', false, text)
}

// 处理焦点事件
const handleFocus = () => {
  emit('focus')
}

const handleBlur = () => {
  emit('blur')
}

// 切换格式
const toggleFormat = (command: string) => {
  if (props.readonly) return
  
  document.execCommand(command, false)
  editorRef.value?.focus()
}

// 检查格式是否激活
const isActive = (command: string): boolean => {
  try {
    return document.queryCommandState(command)
  } catch {
    return false
  }
}

// 设置标题
const setHeading = (heading: string) => {
  if (props.readonly) return
  
  if (heading) {
    document.execCommand('formatBlock', false, heading)
  } else {
    document.execCommand('formatBlock', false, 'div')
  }
  editorRef.value?.focus()
}

// 插入变量
const insertVariable = (variable: any) => {
  if (props.readonly) return
  
  if (variable === 'custom') {
    showCustomVariableDialog.value = true
    return
  }
  
  const variableText = `{{${variable.name}}}`
  document.execCommand('insertText', false, variableText)
  editorRef.value?.focus()
}

// 插入表格
const insertTable = () => {
  if (props.readonly) return
  
  const tableHTML = `
    <table border="1" style="border-collapse: collapse; width: 100%; margin: 10px 0;">
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">单元格1</td>
        <td style="padding: 8px; border: 1px solid #ddd;">单元格2</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">单元格3</td>
        <td style="padding: 8px; border: 1px solid #ddd;">单元格4</td>
      </tr>
    </table>
  `
  document.execCommand('insertHTML', false, tableHTML)
  editorRef.value?.focus()
}

// 插入分割线
const insertHorizontalRule = () => {
  if (props.readonly) return
  
  document.execCommand('insertHorizontalRule')
  editorRef.value?.focus()
}

// 复制预览内容
const copyPreview = async () => {
  try {
    await navigator.clipboard.writeText(previewContent.value.replace(/<[^>]*>/g, ''))
    ElMessage.success('预览内容已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

// 验证变量名
const validateVariableName = () => {
  const name = customVariableForm.name
  if (name && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    customVariableForm.name = name.replace(/[^a-zA-Z0-9_]/g, '')
  }
}

// 添加自定义变量
const addCustomVariable = () => {
  if (!customVariableForm.name || !customVariableForm.label) {
    ElMessage.warning('请填写变量名和显示名称')
    return
  }
  
  let variableText = `{{${customVariableForm.name}`
  
  if (customVariableForm.type !== 'text') {
    variableText += `:${customVariableForm.type}`
  }
  
  if (customVariableForm.type === 'select' && customVariableForm.options) {
    variableText += `:${customVariableForm.options}`
  }
  
  variableText += '}}'
  
  document.execCommand('insertText', false, variableText)
  
  // 重置表单
  Object.assign(customVariableForm, {
    name: '',
    label: '',
    type: 'text',
    options: ''
  })
  
  showCustomVariableDialog.value = false
  editorRef.value?.focus()
}

// 获取纯文本内容
const getTextContent = (): string => {
  return editorRef.value?.textContent || ''
}

// 设置焦点
const focus = () => {
  editorRef.value?.focus()
}

// 暴露方法
defineExpose({
  focus,
  getTextContent
})

// 组件挂载时设置初始内容
onMounted(() => {
  if (editorRef.value && props.modelValue) {
    editorRef.value.innerHTML = props.modelValue
  }
})
</script>

<style scoped>
.rich-text-editor {
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  background: var(--el-bg-color);
}

.editor-toolbar {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color-page);
  flex-wrap: wrap;
  gap: 8px;
}

.toolbar-group {
  display: flex;
  align-items: center;
}

.toolbar-spacer {
  flex: 1;
}

.editor-content {
  display: flex;
  min-height: v-bind(height);
}

.view-mode-edit .editor-panel {
  width: 100%;
}

.view-mode-preview .preview-panel {
  width: 100%;
}

.view-mode-split .editor-panel,
.view-mode-split .preview-panel {
  width: 50%;
}

.editor-panel {
  border-right: 1px solid var(--el-border-color-light);
}

.editor-area {
  padding: 16px;
  min-height: 100%;
  outline: none;
  line-height: 1.6;
  font-family: 'Microsoft YaHei', sans-serif;
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.editor-area:empty::before {
  content: attr(data-placeholder);
  color: var(--el-text-color-placeholder);
  pointer-events: none;
}

.preview-panel {
  background: var(--el-bg-color-page);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.preview-header h4 {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.preview-content {
  padding: 16px;
  line-height: 1.6;
  font-family: 'Microsoft YaHei', sans-serif;
  font-size: 14px;
  color: var(--el-text-color-primary);
  min-height: calc(100% - 60px);
}

.form-hint {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  margin-top: 4px;
}

/* 编辑器内容样式 */
.editor-area h1,
.preview-content h1 {
  font-size: 24px;
  font-weight: bold;
  margin: 16px 0 12px 0;
  color: var(--el-text-color-primary);
}

.editor-area h2,
.preview-content h2 {
  font-size: 20px;
  font-weight: bold;
  margin: 14px 0 10px 0;
  color: var(--el-text-color-primary);
}

.editor-area h3,
.preview-content h3 {
  font-size: 16px;
  font-weight: bold;
  margin: 12px 0 8px 0;
  color: var(--el-text-color-primary);
}

.editor-area table,
.preview-content table {
  border-collapse: collapse;
  width: 100%;
  margin: 10px 0;
}

.editor-area td,
.preview-content td {
  padding: 8px;
  border: 1px solid var(--el-border-color);
}

.editor-area ul,
.editor-area ol,
.preview-content ul,
.preview-content ol {
  margin: 10px 0;
  padding-left: 20px;
}

.editor-area hr,
.preview-content hr {
  border: none;
  border-top: 1px solid var(--el-border-color);
  margin: 16px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .editor-toolbar {
    padding: 6px 8px;
  }
  
  .view-mode-split .editor-panel,
  .view-mode-split .preview-panel {
    width: 100%;
  }
  
  .view-mode-split .editor-content {
    flex-direction: column;
  }
  
  .editor-panel {
    border-right: none;
    border-bottom: 1px solid var(--el-border-color-light);
  }
}
</style>