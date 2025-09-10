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
          <div class="template-editor">
            <div class="editor-toolbar">
              <el-button-group>
                <el-button size="small" @click="insertVariable('{{学生姓名}}')">学生姓名</el-button>
                <el-button size="small" @click="insertVariable('{{班级名称}}')">班级名称</el-button>
                <el-button size="small" @click="insertVariable('{{日期}}')">日期</el-button>
                <el-button size="small" @click="insertVariable('{{教师姓名}}')">教师姓名</el-button>
              </el-button-group>
              <el-divider direction="vertical" />
              <el-button-group>
                <el-button size="small" @click="formatText('bold')">粗体</el-button>
                <el-button size="small" @click="formatText('italic')">斜体</el-button>
                <el-button size="small" @click="formatText('underline')">下划线</el-button>
              </el-button-group>
            </div>
            <el-input
              v-model="templateForm.content"
              type="textarea"
              :rows="12"
              placeholder="请输入模板内容，可以使用变量如 {{学生姓名}}、{{班级名称}} 等"
              ref="contentTextarea"
            />
          </div>
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
    <el-dialog v-model="showGenerateDialog" title="生成文档" width="600px">
      <div class="generate-form">
        <h4>请填写文档变量</h4>
        <el-form :model="generateForm" label-width="100px">
          <el-form-item
            v-for="variable in documentVariables"
            :key="variable"
            :label="variable"
          >
            <el-input v-model="generateForm[variable]" :placeholder="`请输入${variable}`" />
          </el-form-item>
        </el-form>
        <el-divider />
        <div class="document-preview">
          <h4>文档预览</h4>
          <div class="preview-content" v-html="generatePreview"></div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showGenerateDialog = false">取消</el-button>
        <el-button @click="saveDocument">保存文档</el-button>
        <el-button type="primary" @click="printDocument">打印文档</el-button>
      </template>
    </el-dialog>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Upload,
  Document,
  DocumentAdd,
  View,
  More,
  Edit,
  CopyDocument,
  Download,
  Delete,
  Files,
  Notebook,
  Trophy,
  Calendar,
  Setting
} from '@element-plus/icons-vue'
import Layout from './Layout.vue'

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
const showAddDialog = ref(false)
const showPreviewDialog = ref(false)
const showGenerateDialog = ref(false)
const editingTemplate = ref<DocumentTemplate | null>(null)
const previewTemplateData = ref<DocumentTemplate | null>(null)
const selectedCategory = ref('all')
const templateFormRef = ref()
const contentTextarea = ref()

const templateForm = reactive<DocumentTemplate>({
  name: '',
  description: '',
  category: 'notice',
  content: ''
})

const generateForm = reactive<Record<string, string>>({})

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
  if (!selectedTemplate.value) return ''
  let content = selectedTemplate.value.content
  
  Object.keys(generateForm).forEach(key => {
    const value = generateForm[key] || `[${key}]`
    content = content.replace(new RegExp(`{{${key}}}`, 'g'), value)
  })
  
  return formatPreviewContent(content)
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
  
  // 重置生成表单
  Object.keys(generateForm).forEach(key => {
    delete generateForm[key]
  })
  
  // 初始化变量
  documentVariables.value.forEach(variable => {
    generateForm[variable] = ''
  })
  
  showPreviewDialog.value = false
  showGenerateDialog.value = true
}

const insertVariable = (variable: string) => {
  const textarea = contentTextarea.value?.textarea
  if (textarea) {
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = templateForm.content
    templateForm.content = text.substring(0, start) + variable + text.substring(end)
    
    // 设置光标位置
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + variable.length
      textarea.focus()
    }, 0)
  }
}

const formatText = (format: string) => {
  const textarea = contentTextarea.value?.textarea
  if (textarea) {
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = templateForm.content.substring(start, end)
    
    if (selectedText) {
      let formattedText = selectedText
      switch (format) {
        case 'bold':
          formattedText = `**${selectedText}**`
          break
        case 'italic':
          formattedText = `*${selectedText}*`
          break
        case 'underline':
          formattedText = `__${selectedText}__`
          break
      }
      
      const text = templateForm.content
      templateForm.content = text.substring(0, start) + formattedText + text.substring(end)
    }
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
    const result = await window.electronAPI.templates.generate(template.id, {
      templateId: selectedTemplate.value?.id,
      content: documentContent,
      variables: generateForm
    })
    
    if (result.success) {
      ElMessage.success('文档保存成功')
      showGenerateDialog.value = false
    } else {
      ElMessage.error('文档保存失败')
    }
  } catch (error) {
    console.error('保存文档失败:', error)
  }
}

const printDocument = async () => {
  try {
    const documentContent = generatePreview.value
    const result = await window.electronAPI.templates.preview(template.id, {
      content: documentContent,
      title: selectedTemplate.value?.name
    })
    
    if (result.success) {
      ElMessage.success('文档已发送到打印机')
    } else {
      ElMessage.error('打印失败')
    }
  } catch (error) {
    console.error('打印文档失败:', error)
  }
}

const exportTemplate = (template: DocumentTemplate) => {
  ElMessage.info('导出功能开发中...')
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

.template-editor {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  gap: 10px;
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
</style>