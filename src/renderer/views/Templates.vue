<template>
  <Layout>
    <div class="templates-container">
    <div class="page-header">
      <h2>文档模板中心</h2>
      <div class="header-actions">
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon>
          创建模板
        </el-button>
        <el-button @click="importTemplate">
          <el-icon><Upload /></el-icon>
          导入模板
        </el-button>
      </div>
    </div>

    <!-- 模板分类 -->
    <div class="template-categories">
      <el-card>
        <div class="category-tabs">
          <el-button-group>
            <el-button
              v-for="category in categories"
              :key="category.value"
              :type="selectedCategory === category.value ? 'primary' : ''"
              @click="selectedCategory = category.value"
            >
              <el-icon><component :is="category.icon" /></el-icon>
              {{ category.label }}
            </el-button>
          </el-button-group>
        </div>
      </el-card>
    </div>

    <!-- 模板网格 -->
    <div class="templates-grid">
      <el-row :gutter="20">
        <el-col :span="6" v-for="template in filteredTemplates" :key="template.id">
          <el-card class="template-card" @click="selectTemplate(template)">
            <div class="template-preview">
              <div class="template-icon">
                <el-icon size="48"><Document /></el-icon>
              </div>
              <div class="template-info">
                <h3 class="template-title">{{ template.name }}</h3>
                <p class="template-description">{{ template.description }}</p>
                <div class="template-meta">
                  <el-tag size="small" :type="getCategoryTagType(template.category)">
                    {{ getCategoryLabel(template.category) }}
                  </el-tag>
                  <span class="template-date">{{ formatDate(template.updatedAt) }}</span>
                </div>
              </div>
            </div>
            <div class="template-actions">
              <el-button size="small" type="primary" @click.stop="generateDocument(template)">
                <el-icon><DocumentAdd /></el-icon>
                生成文档
              </el-button>
              <el-button size="small" @click.stop="previewTemplateAction(template)">
                <el-icon><View /></el-icon>
                预览
              </el-button>
              <el-dropdown @click.stop trigger="click">
                <el-button size="small">
                  <el-icon><More /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="editTemplate(template)">
                      <el-icon><Edit /></el-icon>
                      编辑
                    </el-dropdown-item>
                    <el-dropdown-item @click="duplicateTemplate(template)">
                      <el-icon><CopyDocument /></el-icon>
                      复制
                    </el-dropdown-item>
                    <el-dropdown-item @click="exportTemplate(template)">
                      <el-icon><Download /></el-icon>
                      导出
                    </el-dropdown-item>
                    <el-dropdown-item divided @click="deleteTemplate(template.id)">
                      <el-icon><Delete /></el-icon>
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 添加/编辑模板对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingTemplate ? '编辑模板' : '创建模板'"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form :model="templateForm" :rules="templateRules" ref="templateFormRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="模板名称" prop="name">
              <el-input v-model="templateForm.name" placeholder="请输入模板名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="模板分类" prop="category">
              <el-select v-model="templateForm.category" placeholder="选择分类">
                <el-option
                  v-for="category in categories.slice(1)"
                  :key="category.value"
                  :label="category.label"
                  :value="category.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="模板描述" prop="description">
          <el-input
            v-model="templateForm.description"
            type="textarea"
            :rows="2"
            placeholder="请输入模板描述"
          />
        </el-form-item>
        <el-form-item label="模板内容" prop="content">
          <RichTextEditor
            v-model="templateForm.content"
            height="400px"
            placeholder="请输入模板内容，可以使用变量如 {{学生姓名}}、{{班级名称}} 等"
            :preview-variables="{
              学生姓名: '张三',
              班级名称: '高一(1)班',
              日期: new Date().toLocaleDateString(),
              教师姓名: '李老师',
              科目: '数学',
              学期: '2024年春季学期'
            }"
          />
        </el-form-item>
        <el-form-item label="变量说明">
          <div class="variables-help">
            <el-tag v-for="variable in commonVariables" :key="variable" size="small" class="variable-tag">
              {{ variable }}
            </el-tag>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button @click="previewTemplateContent">预览</el-button>
        <el-button type="primary" @click="saveTemplate">保存</el-button>
      </template>
    </el-dialog>

    <!-- 模板预览对话框 -->
    <el-dialog v-model="showPreviewDialog" title="模板预览" width="700px">
      <div class="template-preview-content">
        <div class="preview-header">
          <h3>{{ previewTemplateData?.name }}</h3>
          <p>{{ previewTemplateData?.description }}</p>
        </div>
        <el-divider />
        <div class="preview-body" v-html="formatPreviewContent(previewTemplateData?.content || '')"></div>
      </div>
      <template #footer>
        <el-button @click="showPreviewDialog = false">关闭</el-button>
        <el-button type="primary" @click="generateDocument(previewTemplateData)">生成文档</el-button>
      </template>
    </el-dialog>

    <!-- 生成文档对话框 -->
    <el-dialog v-model="showGenerateDialog" title="生成文档" width="800px">
      <div class="generate-form">
        <div class="generate-header">
          <h4>{{ currentTemplate?.name }}</h4>
          <p class="template-desc">{{ currentTemplate?.description }}</p>
        </div>
        
        <el-divider />
        
        <!-- 使用动态表单组件 -->
        <DynamicForm
          ref="dynamicFormRef"
          :variables="parsedVariables"
          :template-content="currentTemplate?.content"
          :show-preview="true"
          :show-actions="false"
          @change="handleFormDataChange"
        />
        <el-divider />
        <div class="document-preview">
          <h4>文档预览</h4>
          <div class="preview-content" v-html="generatePreview"></div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <div class="footer-left">
            <el-button @click="validateAndGenerate" :disabled="!canGenerate">
              <el-icon><Refresh /></el-icon>
              重新生成
            </el-button>
          </div>
          <div class="footer-center">
            <el-select v-model="selectedExportFormat" placeholder="选择导出格式" style="width: 120px">
              <el-option
                v-for="format in exportFormats"
                :key="format.value"
                :label="format.label"
                :value="format.value"
              />
            </el-select>
          </div>
          <div class="footer-right">
            <el-button @click="showGenerateDialog = false">取消</el-button>
            <el-button @click="saveDocument" :disabled="!canGenerate">
              <el-icon><Download /></el-icon>
              导出{{ getFormatLabel(selectedExportFormat) }}
            </el-button>
            <el-button type="primary" @click="printDocument" :disabled="!canGenerate">
              <el-icon><Printer /></el-icon>
              打印文档
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Upload,
  Document,
  DocumentAdd,
  View,
  Edit,
  Delete,
  Download,
  CopyDocument,
  More,
  Files,
  Notebook,
  Trophy,
  Calendar,
  Setting,
  Refresh,
  Printer
} from '@element-plus/icons-vue'
import Layout from './Layout.vue'
import DynamicForm from '../components/DynamicForm.vue'
import RichTextEditor from '../components/RichTextEditor.vue'
import { TemplateVariableParser, type TemplateVariable } from '../utils/templateVariableParser'
import { DocumentExporter, type ExportFormat, type ExportOptions } from '../utils/documentExporter'

interface DocumentTemplate {
  id?: number
  name: string
  description: string
  category: string
  content: string
  variables?: string[]
  createdAt?: string
  updatedAt?: string
}

const templates = ref<DocumentTemplate[]>([])
const selectedTemplate = ref<DocumentTemplate | null>(null)
const showAddDialog = ref(false)
const showPreviewDialog = ref(false)
const showGenerateDialog = ref(false)
const editingTemplate = ref<DocumentTemplate | null>(null)
const previewTemplateData = ref<DocumentTemplate | null>(null)
const selectedCategory = ref('all')
const templateFormRef = ref()


const templateForm = reactive<DocumentTemplate>({
  name: '',
  description: '',
  category: 'notice',
  content: ''
})

const generateForm = reactive<Record<string, string>>({})

// 新增：智能变量解析相关
const dynamicFormRef = ref()
const currentTemplate = ref<DocumentTemplate | null>(null)
const parsedVariables = ref<VariableDefinition[]>([])
const formData = ref<Record<string, any>>({})

// 导出格式相关
const selectedExportFormat = ref<ExportFormat>('word')
const exportFormats = [
  { label: 'Word文档', value: 'word' as ExportFormat },
  { label: 'PDF文档', value: 'pdf' as ExportFormat },
  { label: 'Excel表格', value: 'excel' as ExportFormat },
  { label: 'HTML网页', value: 'html' as ExportFormat },
  { label: '纯文本', value: 'txt' as ExportFormat }
]

// 获取格式标签
const getFormatLabel = (format: ExportFormat) => {
  const formatMap = {
    word: 'Word',
    pdf: 'PDF',
    excel: 'Excel',
    html: 'HTML',
    txt: '文本'
  }
  return formatMap[format] || '文档'
}

const templateRules = {
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择模板分类', trigger: 'change' }],
  content: [{ required: true, message: '请输入模板内容', trigger: 'blur' }]
}

const categories = [
  { label: '全部', value: 'all', icon: 'Files' },
  { label: '通知公告', value: 'notice', icon: 'Notebook' },
  { label: '成绩单', value: 'grade', icon: 'Trophy' },
  { label: '课程表', value: 'schedule', icon: 'Calendar' },
  { label: '评语模板', value: 'comment', icon: 'Edit' },
  { label: '其他', value: 'other', icon: 'Setting' }
]

const commonVariables = [
  '{{学生姓名}}', '{{班级名称}}', '{{日期}}', '{{教师姓名}}',
  '{{学期}}', '{{年级}}', '{{科目}}', '{{成绩}}', '{{排名}}'
]

const filteredTemplates = computed(() => {
  if (selectedCategory.value === 'all') {
    return templates.value
  }
  return templates.value.filter(template => template.category === selectedCategory.value)
})

const documentVariables = computed(() => {
  if (!selectedTemplate.value) return []
  const content = selectedTemplate.value.content
  const matches = content.match(/{{([^}]+)}}/g)
  if (!matches) return []
  return [...new Set(matches.map(match => match.replace(/[{}]/g, '')))]
})

const generatePreview = computed(() => {
  if (!currentTemplate.value) return ''
  
  // 使用新的智能变量解析器生成预览
  if (Object.keys(formData.value).length > 0) {
    const content = TemplateVariableParser.replaceVariables(currentTemplate.value.content, formData.value)
    return formatPreviewContent(content)
  }
  
  // 兼容旧版本
  if (!selectedTemplate.value) return ''
  let content = selectedTemplate.value.content
  
  Object.keys(generateForm).forEach(key => {
    const value = generateForm[key] || `[${key}]`
    content = content.replace(new RegExp(`{{${key}}}`, 'g'), value)
  })
  
  return formatPreviewContent(content)
})

// 新增：检查是否可以生成文档
const canGenerate = computed(() => {
  if (!parsedVariables.value.length) return true
  
  // 检查必填字段是否已填写
  return parsedVariables.value.every(variable => {
    if (!variable.required) return true
    const value = formData.value[variable.name]
    return value !== undefined && value !== null && value !== ''
  })
})

const getCategoryLabel = (category: string) => {
  const cat = categories.find(c => c.value === category)
  return cat ? cat.label : '其他'
}

const getCategoryTagType = (category: string) => {
  const types = {
    notice: 'primary',
    grade: 'success',
    schedule: 'info',
    comment: 'warning',
    other: ''
  }
  return types[category] || ''
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

const formatPreviewContent = (content: string) => {
  return content
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/__(.*?)__/g, '<u>$1</u>')
}

const selectTemplate = (template: DocumentTemplate) => {
  selectedTemplate.value = template
}

const previewTemplateAction = (template: DocumentTemplate) => {
  previewTemplateData.value = template
  showPreviewDialog.value = true
}

const editTemplate = (template: DocumentTemplate) => {
  editingTemplate.value = template
  Object.assign(templateForm, template)
  showAddDialog.value = true
}

const generateDocument = (template: DocumentTemplate) => {
  selectedTemplate.value = template
  currentTemplate.value = template
  
  // 使用智能变量解析器解析模板
  const parsed = TemplateVariableParser.parseTemplate(template.content)
  parsedVariables.value = parsed.variables
  
  // 重置表单数据
  formData.value = {}
  
  // 重置旧的生成表单（保持兼容性）
  Object.keys(generateForm).forEach(key => {
    delete generateForm[key]
  })
  
  showPreviewDialog.value = false
  showGenerateDialog.value = true
}

// 新增：处理动态表单数据变化
const handleFormDataChange = (data: Record<string, any>) => {
  formData.value = { ...data }
  
  // 同步到旧的generateForm（保持兼容性）
  Object.keys(generateForm).forEach(key => {
    delete generateForm[key]
  })
  Object.assign(generateForm, data)
}

// 新增：验证并重新生成文档
const validateAndGenerate = async () => {
  if (!dynamicFormRef.value) return
  
  try {
    const isValid = await dynamicFormRef.value.validate()
    if (isValid) {
      ElMessage.success('文档已重新生成')
    }
  } catch (error) {
    ElMessage.error('请检查表单填写是否正确')
  }
}

const previewTemplateContent = () => {
  if (!templateForm.content.trim()) {
    ElMessage.warning('请先输入模板内容')
    return
  }
  
  previewTemplateData.value = { ...templateForm }
  showPreviewDialog.value = true
}

const saveTemplate = async () => {
  try {
    await templateFormRef.value.validate()
    
    if (editingTemplate.value) {
      const result = await window.electronAPI.templates.update(editingTemplate.value.id, templateForm)
      if (result.success) {
        ElMessage.success('模板更新成功')
        loadTemplates()
      } else {
        ElMessage.error('模板更新失败')
      }
    } else {
      const result = await window.electronAPI.templates.create(templateForm)
      if (result.success) {
        ElMessage.success('模板创建成功')
        loadTemplates()
      } else {
        ElMessage.error('模板创建失败')
      }
    }
    
    showAddDialog.value = false
    resetForm()
  } catch (error) {
    console.error('保存模板失败:', error)
  }
}

const duplicateTemplate = async (template: DocumentTemplate) => {
  const newTemplate = {
    ...template,
    name: `${template.name} - 副本`,
    id: undefined
  }
  
  try {
    const result = await window.electronAPI.templates.create(newTemplate)
    if (result.success) {
      ElMessage.success('模板复制成功')
      loadTemplates()
    } else {
      ElMessage.error('模板复制失败')
    }
  } catch (error) {
    console.error('复制模板失败:', error)
  }
}

const deleteTemplate = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这个模板吗？', '确认删除', {
      type: 'warning'
    })
    
    const result = await window.electronAPI.templates.delete(id)
    if (result.success) {
      ElMessage.success('模板删除成功')
      loadTemplates()
    } else {
      ElMessage.error('模板删除失败')
    }
  } catch (error) {
    // 用户取消删除
  }
}

const saveDocument = async () => {
  try {
    const documentContent = generatePreview.value
    const exportOptions: ExportOptions = {
       title: currentTemplate.value?.name || '文档',
       content: documentContent,
       format: selectedExportFormat.value,
       filename: `${currentTemplate.value?.name || '文档'}_${new Date().toLocaleDateString()}`
     }
    
    const result = await DocumentExporter.exportDocument(exportOptions)
    
    if (result.success) {
      ElMessage.success(`${getFormatLabel(selectedExportFormat.value)}文档保存成功`)
      showGenerateDialog.value = false
    } else {
      ElMessage.error('文档保存失败: ' + result.error)
    }
  } catch (error) {
    console.error('保存文档失败:', error)
    ElMessage.error('保存文档失败')
  }
}

const printDocument = async () => {
  try {
    const documentContent = generatePreview.value
    const exportOptions: ExportOptions = {
       title: currentTemplate.value?.name || '文档',
       content: documentContent,
       format: 'pdf' as ExportFormat,
       filename: `${currentTemplate.value?.name || '文档'}_${new Date().toLocaleDateString()}`
     }
    
    const result = await DocumentExporter.exportDocument(exportOptions)
    
    if (result.success) {
      ElMessage.success('文档已发送到打印机')
    } else {
      ElMessage.error('打印失败: ' + result.error)
    }
  } catch (error) {
    console.error('打印文档失败:', error)
    ElMessage.error('打印文档失败')
  }
}

const exportTemplate = async (template: DocumentTemplate) => {
  try {
    const exportOptions: ExportOptions = {
       title: template.name,
       content: template.content,
       format: 'word' as ExportFormat,
       filename: `模板_${template.name}_${new Date().toLocaleDateString()}`
     }
    
    const result = await DocumentExporter.exportDocument(exportOptions)
    
    if (result.success) {
      ElMessage.success('模板导出成功')
    } else {
      ElMessage.error('模板导出失败: ' + result.error)
    }
  } catch (error) {
    console.error('导出模板失败:', error)
    ElMessage.error('导出模板失败')
  }
}

const importTemplate = () => {
  ElMessage.info('导入功能开发中...')
}

const resetForm = () => {
  Object.assign(templateForm, {
    name: '',
    description: '',
    category: 'notice',
    content: ''
  })
  editingTemplate.value = null
}

const loadTemplates = async () => {
  try {
    const result = await window.electronAPI.templates.list()
    console.log('模板数据:', result) // 调试信息
    if (result.success) {
      templates.value = result.data
      console.log('模板列表:', templates.value) // 调试信息
    } else {
      console.error('获取模板失败:', result.error)
      ElMessage.error('获取模板失败: ' + result.error)
    }
  } catch (error) {
    console.error('加载模板失败:', error)
    ElMessage.error('加载模板失败')
  }
}

onMounted(() => {
  loadTemplates()
})
</script>

<style scoped>
.templates-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.template-categories {
  margin-bottom: 20px;
}

.category-tabs {
  padding: 10px 0;
}

.templates-grid {
  margin-top: 20px;
}

.template-card {
  cursor: pointer;
  transition: all 0.3s;
  height: 280px;
}

.template-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.template-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 20px 10px;
}

.template-icon {
  margin-bottom: 15px;
  color: #409eff;
}

.template-info {
  flex: 1;
  width: 100%;
}

.template-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.template-description {
  font-size: 14px;
  color: #606266;
  margin: 0 0 12px 0;
  line-height: 1.4;
  height: 40px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.template-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.template-date {
  font-size: 12px;
  color: #909399;
}

.template-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px 16px;
  border-top: 1px solid #f0f0f0;
  margin-top: 10px;
}



.variables-help {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.variable-tag {
  cursor: pointer;
}

.variable-tag:hover {
  opacity: 0.8;
}

.template-preview-content {
  padding: 20px 0;
}

.preview-header h3 {
  margin: 0 0 8px 0;
  color: #303133;
}

.preview-header p {
  margin: 0;
  color: #606266;
}

.preview-body {
  padding: 20px;
  background: #fafafa;
  border-radius: 4px;
  min-height: 200px;
  line-height: 1.6;
  font-size: 14px;
  color: #303133;
}

.generate-form {
  padding: 10px 0;
}

.generate-form h4 {
  margin: 0 0 15px 0;
  color: #303133;
}

.document-preview {
  margin-top: 20px;
}

.preview-content {
  padding: 15px;
  background: #fafafa;
  border-radius: 4px;
  min-height: 150px;
  line-height: 1.6;
  font-size: 14px;
  color: #303133;
}

/* 生成文档对话框样式 */
.generate-form {
  max-height: 70vh;
  overflow-y: auto;
}

.generate-header h4 {
  margin: 0 0 8px 0;
  color: var(--el-text-color-primary);
  font-size: 18px;
}

.template-desc {
  margin: 0;
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 20px 0;
  border-top: 1px solid #ebeef5;
}

.footer-left,
.footer-right {
  display: flex;
  gap: 10px;
}

.footer-center {
  display: flex;
  align-items: center;
  gap: 10px;
}

.footer-center .el-select {
  min-width: 120px;
}

.footer-right {
  margin-left: auto;
}
</style>