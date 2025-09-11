<template>
  <div class="template-editor">
    <!-- 工具栏 -->
    <div class="editor-toolbar">
      <div class="toolbar-left">
        <el-button-group>
          <el-button 
            :type="editorMode === 'visual' ? 'primary' : ''"
            @click="editorMode = 'visual'"
          >
            <el-icon><View /></el-icon>
            可视化
          </el-button>
          <el-button 
            :type="editorMode === 'code' ? 'primary' : ''"
            @click="editorMode = 'code'"
          >
            <el-icon><Document /></el-icon>
            代码
          </el-button>
          <el-button 
            :type="editorMode === 'preview' ? 'primary' : ''"
            @click="editorMode = 'preview'"
          >
            <el-icon><Monitor /></el-icon>
            预览
          </el-button>
        </el-button-group>
      </div>
      
      <div class="toolbar-center">
        <el-button @click="insertVariable">
          <el-icon><Plus /></el-icon>
          插入变量
        </el-button>
        <el-button @click="showImportDialog = true">
          <el-icon><Upload /></el-icon>
          导入文件
        </el-button>
        <el-button @click="saveTemplate">
          <el-icon><Check /></el-icon>
          保存模板
        </el-button>
      </div>
      
      <div class="toolbar-right">
        <el-button @click="previewTemplate">
          <el-icon><View /></el-icon>
          预览
        </el-button>
        <el-button type="primary" @click="generateDocument">
          <el-icon><DocumentAdd /></el-icon>
          生成文档
        </el-button>
      </div>
    </div>

    <!-- 编辑区域 -->
    <div class="editor-content">
      <!-- 可视化编辑器 -->
      <div v-if="editorMode === 'visual'" class="visual-editor">
        <div class="editor-canvas" ref="canvasRef">
          <div 
            class="editor-page"
            :style="{
              width: pageSettings.width + 'mm',
              height: pageSettings.height + 'mm',
              padding: pageSettings.padding + 'mm'
            }"
          >
            <div 
              v-html="templateContent" 
              @click="handleCanvasClick"
              contenteditable="true"
              @input="handleContentChange"
            ></div>
          </div>
        </div>
        
        <!-- 组件面板 -->
        <div class="component-panel">
          <el-collapse v-model="activePanel">
            <el-collapse-item title="基础组件" name="basic">
              <div class="component-list">
                <div 
                  v-for="component in basicComponents" 
                  :key="component.type"
                  class="component-item"
                  draggable="true"
                  @dragstart="handleDragStart(component)"
                >
                  <el-icon><component :is="component.icon" /></el-icon>
                  <span>{{ component.name }}</span>
                </div>
              </div>
            </el-collapse-item>
            
            <el-collapse-item title="数据组件" name="data">
              <div class="component-list">
                <div 
                  v-for="component in dataComponents" 
                  :key="component.type"
                  class="component-item"
                  draggable="true"
                  @dragstart="handleDragStart(component)"
                >
                  <el-icon><component :is="component.icon" /></el-icon>
                  <span>{{ component.name }}</span>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </div>
      
      <!-- 代码编辑器 -->
      <div v-else-if="editorMode === 'code'" class="code-editor">
        <textarea 
          v-model="templateContent"
          class="code-textarea"
          placeholder="请输入模板代码..."
        ></textarea>
      </div>
      
      <!-- 预览模式 -->
      <div v-else-if="editorMode === 'preview'" class="preview-mode">
        <div class="preview-container">
          <div 
            class="preview-content"
            v-html="previewContent"
          ></div>
        </div>
      </div>
    </div>

    <!-- 变量面板 -->
    <div class="variable-panel" v-if="showVariablePanel">
      <div class="panel-header">
        <h3>模板变量</h3>
        <el-button 
          text 
          @click="showVariablePanel = false"
        >
          <el-icon><Close /></el-icon>
        </el-button>
      </div>
      
      <div class="panel-content">
        <el-tabs v-model="activeVariableTab">
          <el-tab-pane label="系统变量" name="system">
            <div class="variable-list">
              <div 
                v-for="variable in systemVariables" 
                :key="variable.key"
                class="variable-item"
                @click="insertVariableToEditor(variable)"
              >
                <div class="variable-info">
                  <span class="variable-name">{{ variable.name }}</span>
                  <span class="variable-key">{{ variable.key }}</span>
                </div>
                <span class="variable-desc">{{ variable.description }}</span>
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="数据变量" name="data">
            <div class="variable-list">
              <div 
                v-for="variable in dataVariables" 
                :key="variable.key"
                class="variable-item"
                @click="insertVariableToEditor(variable)"
              >
                <div class="variable-info">
                  <span class="variable-name">{{ variable.name }}</span>
                  <span class="variable-key">{{ variable.key }}</span>
                </div>
                <span class="variable-desc">{{ variable.description }}</span>
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="自定义变量" name="custom">
            <div class="custom-variables">
              <el-button 
                type="primary" 
                @click="showAddVariableDialog = true"
                style="width: 100%; margin-bottom: 10px;"
              >
                <el-icon><Plus /></el-icon>
                添加变量
              </el-button>
              
              <div class="variable-list">
                <div 
                  v-for="variable in customVariables" 
                  :key="variable.key"
                  class="variable-item"
                >
                  <div class="variable-info" @click="insertVariableToEditor(variable)">
                    <span class="variable-name">{{ variable.name }}</span>
                    <span class="variable-key">{{ variable.key }}</span>
                  </div>
                  <el-button 
                    text 
                    @click="editCustomVariable(variable)"
                  >
                    <el-icon><Edit /></el-icon>
                  </el-button>
                  <el-button 
                    text 
                    @click="deleteCustomVariable(variable.key)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <!-- 文件导入对话框 -->
    <el-dialog 
      v-model="showImportDialog" 
      title="导入文件" 
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="import-content">
        <el-upload
          ref="uploadRef"
          class="upload-demo"
          drag
          :auto-upload="false"
          :on-change="handleFileChange"
          :accept="'.docx,.doc,.xlsx,.xls,.pdf,.txt'"
        >
          <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
          <div class="el-upload__text">
            拖拽文件到此处或 <em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              支持 Word(.docx/.doc)、Excel(.xlsx/.xls)、PDF(.pdf)、文本(.txt) 格式
            </div>
          </template>
        </el-upload>
        
        <div v-if="importPreview" class="import-preview">
          <h4>导入预览</h4>
          <div class="preview-info">
            <p><strong>文件名：</strong>{{ importPreview.fileName }}</p>
            <p><strong>文件类型：</strong>{{ importPreview.fileType }}</p>
            <p><strong>识别变量：</strong>{{ importPreview.variables.length }} 个</p>
          </div>
          
          <div class="variables-preview">
            <h5>识别的变量：</h5>
            <el-tag 
              v-for="variable in importPreview.variables" 
              :key="variable"
              style="margin: 2px;"
            >
              {{ variable }}
            </el-tag>
          </div>
          
          <div class="content-preview">
            <h5>内容预览：</h5>
            <div class="preview-text" v-html="importPreview.content"></div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showImportDialog = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="confirmImport"
            :disabled="!importPreview"
          >
            确认导入
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 添加自定义变量对话框 -->
    <el-dialog 
      v-model="showAddVariableDialog" 
      title="添加自定义变量" 
      width="500px"
    >
      <el-form :model="variableForm" :rules="variableRules" ref="variableFormRef">
        <el-form-item label="变量名称" prop="name">
          <el-input v-model="variableForm.name" placeholder="请输入变量名称" />
        </el-form-item>
        <el-form-item label="变量键名" prop="key">
          <el-input v-model="variableForm.key" placeholder="请输入变量键名（如：custom_field）" />
        </el-form-item>
        <el-form-item label="变量类型" prop="type">
          <el-select v-model="variableForm.type" placeholder="请选择变量类型">
            <el-option label="文本" value="text" />
            <el-option label="数字" value="number" />
            <el-option label="日期" value="date" />
            <el-option label="选择" value="select" />
          </el-select>
        </el-form-item>
        <el-form-item label="默认值" prop="defaultValue">
          <el-input v-model="variableForm.defaultValue" placeholder="请输入默认值" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input 
            v-model="variableForm.description" 
            type="textarea" 
            placeholder="请输入变量描述"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddVariableDialog = false">取消</el-button>
          <el-button type="primary" @click="addCustomVariable">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  View, Document, Monitor, Plus, Check, DocumentAdd, Upload, Close, Edit, Delete,
  UploadFilled, Files, User, Calendar, Trophy
} from '@element-plus/icons-vue'

// 编辑器模式
const editorMode = ref<'visual' | 'code' | 'preview'>('visual')
const templateContent = ref('')
const showVariablePanel = ref(false)
const showImportDialog = ref(false)
const showAddVariableDialog = ref(false)
const activePanel = ref(['basic', 'data'])
const activeVariableTab = ref('system')

// 页面设置
const pageSettings = reactive({
  width: 210, // A4宽度
  height: 297, // A4高度
  padding: 20
})

// 组件定义
const basicComponents = [
  { type: 'text', name: '文本框', icon: 'Document' },
  { type: 'image', name: '图片', icon: 'Picture' },
  { type: 'table', name: '表格', icon: 'Grid' },
  { type: 'list', name: '列表', icon: 'List' },
  { type: 'divider', name: '分割线', icon: 'Minus' }
]

const dataComponents = [
  { type: 'student-info', name: '学生信息', icon: 'User' },
  { type: 'class-info', name: '班级信息', icon: 'Files' },
  { type: 'grade-data', name: '成绩数据', icon: 'Trophy' },
  { type: 'attendance-data', name: '考勤数据', icon: 'Calendar' }
]

// 系统变量
const systemVariables = [
  { key: '{{current_date}}', name: '当前日期', description: '系统当前日期' },
  { key: '{{current_time}}', name: '当前时间', description: '系统当前时间' },
  { key: '{{semester}}', name: '学期', description: '当前学期' },
  { key: '{{academic_year}}', name: '学年', description: '当前学年' },
  { key: '{{teacher.name}}', name: '教师姓名', description: '当前登录教师姓名' },
  { key: '{{school.name}}', name: '学校名称', description: '学校名称' }
]

// 数据变量
const dataVariables = [
  { key: '{{student.name}}', name: '学生姓名', description: '学生姓名' },
  { key: '{{student.id}}', name: '学号', description: '学生学号' },
  { key: '{{student.class}}', name: '班级', description: '学生所在班级' },
  { key: '{{class.name}}', name: '班级名称', description: '班级名称' },
  { key: '{{class.teacher}}', name: '班主任', description: '班主任姓名' },
  { key: '{{grade.subject}}', name: '科目', description: '成绩科目' },
  { key: '{{grade.score}}', name: '分数', description: '考试分数' }
]

// 自定义变量
const customVariables = ref([])

// 变量表单
const variableForm = reactive({
  name: '',
  key: '',
  type: 'text',
  defaultValue: '',
  description: ''
})

const variableRules = {
  name: [{ required: true, message: '请输入变量名称', trigger: 'blur' }],
  key: [{ required: true, message: '请输入变量键名', trigger: 'blur' }],
  type: [{ required: true, message: '请选择变量类型', trigger: 'change' }]
}

// 导入预览
const importPreview = ref(null)
const uploadRef = ref()
const canvasRef = ref()
const variableFormRef = ref()

// 计算属性
const previewContent = computed(() => {
  // 这里应该处理模板变量替换
  return templateContent.value
})

// 方法
const insertVariable = () => {
  showVariablePanel.value = !showVariablePanel.value
}

const handleCanvasClick = (event: Event) => {
  // 处理画布点击事件
}

const handleContentChange = (event: Event) => {
  const target = event.target as HTMLElement
  templateContent.value = target.innerHTML
}

const handleDragStart = (component: any) => {
  // 处理组件拖拽开始
}

const insertVariableToEditor = (variable: any) => {
  // 插入变量到编辑器
  templateContent.value += variable.key
  ElMessage.success(`已插入变量：${variable.name}`)
}

const handleFileChange = async (file: any) => {
  try {
    const formData = new FormData()
    formData.append('file', file.raw)
    
    // 这里应该调用后端API解析文件
    // const result = await parseFile(formData)
    
    // 模拟解析结果
    importPreview.value = {
      fileName: file.name,
      fileType: file.name.split('.').pop(),
      variables: ['{{student.name}}', '{{class.name}}', '{{date}}'],
      content: '<p>这是解析后的内容预览...</p>'
    }
  } catch (error) {
    ElMessage.error('文件解析失败')
  }
}

const confirmImport = () => {
  if (importPreview.value) {
    templateContent.value = importPreview.value.content
    showImportDialog.value = false
    importPreview.value = null
    ElMessage.success('文件导入成功')
  }
}

const addCustomVariable = async () => {
  try {
    await variableFormRef.value.validate()
    
    const newVariable = {
      key: `{{${variableForm.key}}}`,
      name: variableForm.name,
      type: variableForm.type,
      defaultValue: variableForm.defaultValue,
      description: variableForm.description
    }
    
    customVariables.value.push(newVariable)
    
    // 重置表单
    Object.assign(variableForm, {
      name: '',
      key: '',
      type: 'text',
      defaultValue: '',
      description: ''
    })
    
    showAddVariableDialog.value = false
    ElMessage.success('自定义变量添加成功')
  } catch (error) {
    // 验证失败
  }
}

const editCustomVariable = (variable: any) => {
  // 编辑自定义变量
}

const deleteCustomVariable = (key: string) => {
  const index = customVariables.value.findIndex(v => v.key === key)
  if (index > -1) {
    customVariables.value.splice(index, 1)
    ElMessage.success('变量删除成功')
  }
}

const saveTemplate = () => {
  // 保存模板
  ElMessage.success('模板保存成功')
}

const previewTemplate = () => {
  editorMode.value = 'preview'
}

const generateDocument = () => {
  // 生成文档
  ElMessage.success('文档生成成功')
}

onMounted(() => {
  // 初始化编辑器
})
</script>

<style scoped>
.template-editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toolbar-left,
.toolbar-center,
.toolbar-right {
  display: flex;
  gap: 10px;
}

.editor-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.visual-editor {
  display: flex;
  width: 100%;
}

.editor-canvas {
  flex: 1;
  padding: 20px;
  overflow: auto;
  background: #f0f0f0;
}

.editor-page {
  background: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin: 0 auto;
  min-height: 100%;
}

.component-panel {
  width: 250px;
  background: white;
  border-left: 1px solid #e4e7ed;
  overflow-y: auto;
}

.component-list {
  padding: 10px;
}

.component-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 5px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  cursor: grab;
  transition: all 0.2s;
}

.component-item:hover {
  background: #e9ecef;
  border-color: #409eff;
}

.code-editor {
  width: 100%;
  padding: 20px;
}

.code-textarea {
  width: 100%;
  height: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 15px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  outline: none;
}

.preview-mode {
  width: 100%;
  padding: 20px;
  background: #f0f0f0;
}

.preview-container {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  padding: 40px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.variable-panel {
  position: fixed;
  right: 0;
  top: 60px;
  width: 300px;
  height: calc(100vh - 60px);
  background: white;
  border-left: 1px solid #e4e7ed;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #e4e7ed;
}

.panel-content {
  height: calc(100% - 60px);
  overflow-y: auto;
}

.variable-list {
  padding: 10px;
}

.variable-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  margin-bottom: 5px;
  background: #f8f9fa;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.variable-item:hover {
  background: #e9ecef;
}

.variable-info {
  flex: 1;
}

.variable-name {
  display: block;
  font-weight: 500;
  color: #303133;
}

.variable-key {
  display: block;
  font-size: 12px;
  color: #909399;
  font-family: 'Courier New', monospace;
}

.variable-desc {
  font-size: 12px;
  color: #606266;
}

.custom-variables {
  padding: 10px;
}

.import-content {
  padding: 20px 0;
}

.import-preview {
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 4px;
}

.preview-info p {
  margin: 5px 0;
}

.variables-preview {
  margin: 15px 0;
}

.variables-preview h5 {
  margin-bottom: 10px;
}

.content-preview {
  margin-top: 15px;
}

.preview-text {
  max-height: 200px;
  overflow-y: auto;
  padding: 10px;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}
</style>