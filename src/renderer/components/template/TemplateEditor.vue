<template>
  <div class="template-editor">
    <!-- 编辑器头部 -->
    <div class="editor-header">
      <div class="editor-title">
        <el-input
          v-model="templateData.name"
          placeholder="请输入模板名称"
          class="template-name-input"
          size="large"
        />
      </div>
      <div class="editor-actions">
        <el-button @click="previewTemplate" :loading="previewing">
          <el-icon><View /></el-icon>
          预览
        </el-button>
        <el-button @click="parseVariables" :loading="parsing">
          <el-icon><MagicStick /></el-icon>
          解析变量
        </el-button>
        <el-button type="primary" @click="saveTemplate" :loading="saving">
          <el-icon><Check /></el-icon>
          保存
        </el-button>
      </div>
    </div>

    <!-- 编辑器主体 -->
    <div class="editor-body">
      <!-- 左侧：模板信息和设置 -->
      <div class="editor-sidebar">
        <el-tabs v-model="activeTab" tab-position="top">
          <!-- 基本信息 -->
          <el-tab-pane label="基本信息" name="basic">
            <div class="form-section">
              <el-form :model="templateData" label-width="80px" size="small">
                <el-form-item label="分类">
                  <el-select v-model="templateData.category" placeholder="选择分类">
                    <el-option
                      v-for="category in categories"
                      :key="category.value"
                      :label="category.label"
                      :value="category.value"
                    />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="描述">
                  <el-input
                    v-model="templateData.description"
                    type="textarea"
                    :rows="3"
                    placeholder="请输入模板描述"
                  />
                </el-form-item>
                
                <el-form-item label="标签">
                  <el-select
                    v-model="templateData.tags"
                    multiple
                    filterable
                    allow-create
                    placeholder="添加标签"
                  >
                    <el-option
                      v-for="tag in availableTags"
                      :key="tag"
                      :label="tag"
                      :value="tag"
                    />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="版本">
                  <el-input v-model="templateData.version" placeholder="1.0.0" />
                </el-form-item>
                
                <el-form-item>
                  <el-checkbox v-model="templateData.is_public">公开模板</el-checkbox>
                </el-form-item>
              </el-form>
            </div>
          </el-tab-pane>
          
          <!-- 变量设置 -->
          <el-tab-pane label="变量" name="variables">
            <div class="variables-section">
              <div class="variables-header">
                <el-button size="small" @click="addVariable">
                  <el-icon><Plus /></el-icon>
                  添加变量
                </el-button>
              </div>
              
              <div class="variables-list">
                <div
                  v-for="(variable, index) in templateData.variables"
                  :key="index"
                  class="variable-item"
                >
                  <el-card shadow="never">
                    <div class="variable-header">
                      <el-input
                        v-model="variable.name"
                        placeholder="变量名"
                        size="small"
                        style="width: 120px"
                      />
                      <el-input
                        v-model="variable.label"
                        placeholder="显示名称"
                        size="small"
                        style="width: 120px; margin-left: 8px"
                      />
                      <el-button
                        size="small"
                        type="danger"
                        text
                        @click="removeVariable(index)"
                        style="margin-left: 8px"
                      >
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </div>
                    
                    <div class="variable-config">
                      <el-row :gutter="12">
                        <el-col :span="8">
                          <el-select v-model="variable.type" size="small">
                            <el-option label="文本" value="text" />
                            <el-option label="数字" value="number" />
                            <el-option label="日期" value="date" />
                            <el-option label="选择" value="select" />
                            <el-option label="多选" value="multiselect" />
                            <el-option label="布尔" value="boolean" />
                            <el-option label="表格" value="table" />
                            <el-option label="长文本" value="textarea" />
                          </el-select>
                        </el-col>
                        <el-col :span="8">
                          <el-input
                            v-model="variable.default_value"
                            placeholder="默认值"
                            size="small"
                          />
                        </el-col>
                        <el-col :span="8">
                          <el-checkbox v-model="variable.required" size="small">
                            必填
                          </el-checkbox>
                        </el-col>
                      </el-row>
                      
                      <el-input
                        v-model="variable.description"
                        placeholder="变量描述"
                        size="small"
                        style="margin-top: 8px"
                      />
                      
                      <!-- 选择类型的选项配置 -->
                      <div v-if="variable.type === 'select' || variable.type === 'multiselect'" style="margin-top: 8px">
                        <el-input
                          v-model="variable.optionsText"
                          placeholder="选项（用逗号分隔）"
                          size="small"
                          @input="updateVariableOptions(variable)"
                        />
                      </div>
                    </div>
                  </el-card>
                </div>
              </div>
            </div>
          </el-tab-pane>
          
          <!-- 输出设置 -->
          <el-tab-pane label="输出设置" name="settings">
            <div class="settings-section">
              <el-form :model="templateData.settings" label-width="100px" size="small">
                <el-form-item label="输出格式">
                  <el-select v-model="templateData.settings.output_format">
                    <el-option label="HTML" value="html" />
                    <el-option label="Excel" value="xlsx" />
                    <el-option label="Word" value="docx" />
                    <el-option label="PDF" value="pdf" />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="页面大小">
                  <el-select v-model="templateData.settings.page_size">
                    <el-option label="A4" value="A4" />
                    <el-option label="A3" value="A3" />
                    <el-option label="Letter" value="Letter" />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="页面方向">
                  <el-radio-group v-model="templateData.settings.orientation">
                    <el-radio label="portrait">纵向</el-radio>
                    <el-radio label="landscape">横向</el-radio>
                  </el-radio-group>
                </el-form-item>
                
                <el-form-item label="字体">
                  <el-input v-model="templateData.settings.font_family" placeholder="Microsoft YaHei" />
                </el-form-item>
                
                <el-form-item label="字体大小">
                  <el-input-number
                    v-model="templateData.settings.font_size"
                    :min="8"
                    :max="72"
                    controls-position="right"
                  />
                </el-form-item>
                
                <el-form-item>
                  <el-checkbox v-model="templateData.settings.auto_save">自动保存</el-checkbox>
                </el-form-item>
                
                <el-form-item>
                  <el-checkbox v-model="templateData.settings.enable_preview">启用预览</el-checkbox>
                </el-form-item>
              </el-form>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
      
      <!-- 右侧：内容编辑器 -->
      <div class="editor-main">
        <div class="editor-toolbar">
          <el-button-group size="small">
            <el-button @click="insertVariable">
              <el-icon><Promotion /></el-icon>
              插入变量
            </el-button>
            <el-button @click="insertTable">
              <el-icon><Grid /></el-icon>
              插入表格
            </el-button>
            <el-button @click="formatText">
              <el-icon><EditPen /></el-icon>
              格式化
            </el-button>
          </el-button-group>
        </div>
        
        <div class="content-editor">
          <el-input
            v-model="templateData.content"
            type="textarea"
            :rows="20"
            placeholder="请输入模板内容，使用 {{变量名}} 来插入变量"
            class="template-content"
          />
        </div>
      </div>
    </div>
    
    <!-- 预览对话框 -->
    <el-dialog
      v-model="previewVisible"
      title="模板预览"
      width="80%"
      :before-close="closePreview"
    >
      <div class="preview-container">
        <div class="preview-variables" v-if="previewVariables.length > 0">
          <h4>填写变量值：</h4>
          <el-form :model="previewData" size="small">
            <el-form-item
              v-for="variable in previewVariables"
              :key="variable.name"
              :label="variable.label"
            >
              <component
                :is="getVariableComponent(variable.type)"
                v-model="previewData[variable.name]"
                :placeholder="variable.description"
                v-bind="getVariableProps(variable)"
              />
            </el-form-item>
          </el-form>
          <el-button type="primary" @click="updatePreview" style="margin-top: 16px">
            更新预览
          </el-button>
        </div>
        
        <div class="preview-content">
          <div v-html="previewContent" class="preview-html"></div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { View, MagicStick, Check, Plus, Delete, Promotion, Grid, EditPen } from '@element-plus/icons-vue'
import type { DocumentTemplate, TemplateVariable, TemplateSettings } from '../../types/templateEnhanced'
import { useTemplateEnhancedStore } from '../../stores/templateEnhanced'

interface Props {
  template?: DocumentTemplate
  mode?: 'create' | 'edit'
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'create'
})

const emit = defineEmits<{
  save: [template: DocumentTemplate]
  cancel: []
}>()

const templateStore = useTemplateEnhancedStore()

// 响应式数据
const activeTab = ref('basic')
const saving = ref(false)
const parsing = ref(false)
const previewing = ref(false)
const previewVisible = ref(false)
const previewContent = ref('')
const previewVariables = ref<TemplateVariable[]>([])
const previewData = reactive<Record<string, any>>({})

// 模板数据
const templateData = reactive<DocumentTemplate>({
  name: '',
  category: 'other',
  description: '',
  content: '',
  variables: [],
  settings: {
    output_format: 'html',
    page_size: 'A4',
    orientation: 'portrait',
    font_family: 'Microsoft YaHei',
    font_size: 14,
    auto_save: false,
    enable_preview: true
  } as TemplateSettings,
  tags: [],
  version: '1.0.0',
  is_public: false,
  is_system: false,
  is_active: true
})

// 分类选项
const categories = computed(() => templateStore.categories.filter(cat => cat.value !== 'all'))

// 可用标签
const availableTags = computed(() => templateStore.allTags)

// 初始化
onMounted(() => {
  if (props.template) {
    Object.assign(templateData, props.template)
  }
})

// 添加变量
const addVariable = () => {
  templateData.variables = templateData.variables || []
  templateData.variables.push({
    name: '',
    label: '',
    type: 'text',
    required: false,
    description: ''
  })
}

// 删除变量
const removeVariable = (index: number) => {
  templateData.variables?.splice(index, 1)
}

// 更新变量选项
const updateVariableOptions = (variable: TemplateVariable) => {
  if (variable.optionsText) {
    variable.options = variable.optionsText.split(',').map(opt => opt.trim()).filter(opt => opt)
  }
}

// 解析模板变量
const parseVariables = async () => {
  if (!templateData.content.trim()) {
    ElMessage.warning('请先输入模板内容')
    return
  }
  
  parsing.value = true
  try {
    const variables = await templateStore.parseTemplateVariables(templateData.content)
    
    // 合并现有变量和解析出的变量
    const existingNames = new Set(templateData.variables?.map(v => v.name) || [])
    const newVariables = variables.filter(v => !existingNames.has(v.name))
    
    templateData.variables = [...(templateData.variables || []), ...newVariables]
    
    ElMessage.success(`解析完成，发现 ${newVariables.length} 个新变量`)
  } catch (error) {
    ElMessage.error('解析变量失败')
  } finally {
    parsing.value = false
  }
}

// 预览模板
const previewTemplate = async () => {
  if (!templateData.content.trim()) {
    ElMessage.warning('请先输入模板内容')
    return
  }
  
  previewing.value = true
  try {
    previewVariables.value = templateData.variables || []
    
    // 初始化预览数据
    previewVariables.value.forEach(variable => {
      previewData[variable.name] = variable.default_value || ''
    })
    
    await updatePreview()
    previewVisible.value = true
  } catch (error) {
    ElMessage.error('预览失败')
  } finally {
    previewing.value = false
  }
}

// 更新预览内容
const updatePreview = async () => {
  try {
    previewContent.value = await templateStore.previewTemplate(templateData.id || 0, previewData)
  } catch (error) {
    // 本地预览
    let content = templateData.content
    for (const [key, value] of Object.entries(previewData)) {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g')
      content = content.replace(regex, String(value))
    }
    previewContent.value = content
  }
}

// 关闭预览
const closePreview = () => {
  previewVisible.value = false
  previewContent.value = ''
}

// 保存模板
const saveTemplate = async () => {
  if (!templateData.name.trim()) {
    ElMessage.warning('请输入模板名称')
    return
  }
  
  if (!templateData.content.trim()) {
    ElMessage.warning('请输入模板内容')
    return
  }
  
  saving.value = true
  try {
    await templateStore.saveTemplate(templateData)
    ElMessage.success('保存成功')
    emit('save', templateData)
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 插入变量
const insertVariable = () => {
  // 这里可以实现一个变量选择器
  ElMessage.info('请手动输入变量，格式：{{变量名}}')
}

// 插入表格
const insertTable = () => {
  const tableTemplate = `
<table>
  <thead>
    <tr>
      <th>列1</th>
      <th>列2</th>
      <th>列3</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>{{数据1}}</td>
      <td>{{数据2}}</td>
      <td>{{数据3}}</td>
    </tr>
  </tbody>
</table>
`
  templateData.content += tableTemplate
}

// 格式化文本
const formatText = () => {
  // 简单的格式化
  templateData.content = templateData.content
    .replace(/\n\s*\n/g, '\n\n') // 规范化换行
    .replace(/\s+/g, ' ') // 规范化空格
    .trim()
}

// 获取变量组件
const getVariableComponent = (type: string) => {
  const components: Record<string, string> = {
    text: 'el-input',
    textarea: 'el-input',
    number: 'el-input-number',
    date: 'el-date-picker',
    select: 'el-select',
    multiselect: 'el-select',
    boolean: 'el-switch'
  }
  return components[type] || 'el-input'
}

// 获取变量组件属性
const getVariableProps = (variable: TemplateVariable) => {
  const props: Record<string, any> = {}
  
  switch (variable.type) {
    case 'textarea':
      props.type = 'textarea'
      props.rows = 3
      break
    case 'number':
      props.controlsPosition = 'right'
      break
    case 'date':
      props.type = 'date'
      props.format = 'YYYY-MM-DD'
      break
    case 'select':
    case 'multiselect':
      props.multiple = variable.type === 'multiselect'
      break
  }
  
  return props
}
</script>

<style scoped>
.template-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.template-name-input {
  width: 300px;
}

.editor-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.editor-sidebar {
  width: 350px;
  border-right: 1px solid #e4e7ed;
  overflow-y: auto;
}

.editor-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.editor-toolbar {
  padding: 12px 16px;
  border-bottom: 1px solid #e4e7ed;
}

.content-editor {
  flex: 1;
  padding: 16px;
}

.template-content {
  font-family: 'Consolas', 'Monaco', monospace;
}

.form-section {
  padding: 16px;
}

.variables-section {
  padding: 16px;
}

.variables-header {
  margin-bottom: 16px;
}

.variable-item {
  margin-bottom: 12px;
}

.variable-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.variable-config {
  margin-top: 8px;
}

.settings-section {
  padding: 16px;
}

.preview-container {
  display: flex;
  gap: 20px;
}

.preview-variables {
  width: 300px;
  border-right: 1px solid #e4e7ed;
  padding-right: 20px;
}

.preview-content {
  flex: 1;
}

.preview-html {
  border: 1px solid #e4e7ed;
  padding: 20px;
  min-height: 400px;
  background: white;
}
</style>