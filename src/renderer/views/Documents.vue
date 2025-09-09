<template>
  <div class="documents-container">
    <el-card class="documents-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span>文档模板中心</span>
          </div>
          <div class="header-right">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索模板..."
              clearable
              style="width: 200px; margin-right: 10px;"
              @keyup.enter="searchTemplates"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button type="primary" @click="showTemplateForm">添加模板</el-button>
          </div>
        </div>
      </template>
      
      <!-- 分类标签页 -->
      <el-tabs v-model="activeCategory" @tab-change="handleCategoryChange">
        <el-tab-pane 
          v-for="category in categories" 
          :key="category" 
          :label="category" 
          :name="category"
        >
          <!-- 模板网格 -->
          <div class="templates-grid">
            <el-card 
              v-for="template in filteredTemplates" 
              :key="template.id" 
              class="template-card"
              shadow="hover"
            >
              <div class="template-content">
                <div class="template-icon">
                  <el-icon size="30"><Document /></el-icon>
                </div>
                <div class="template-info">
                  <div class="template-name">{{ template.name }}</div>
                  <div class="template-description">{{ template.description || '暂无描述' }}</div>
                  <div class="template-meta">
                    <span class="download-count">
                      <el-icon><Download /></el-icon>
                      {{ template.download_count }}
                    </span>
                    <span class="template-date">
                      {{ formatDate(template.created_at) }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="template-actions">
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="downloadTemplate(template.id)"
                >
                  下载
                </el-button>
                <el-button 
                  size="small" 
                  @click="editTemplate(template)"
                >
                  编辑
                </el-button>
                <el-button 
                  size="small" 
                  type="danger" 
                  @click="deleteTemplate(template.id)"
                >
                  删除
                </el-button>
              </div>
            </el-card>
            
            <!-- 空状态 -->
            <div v-if="filteredTemplates.length === 0" class="empty-state">
              <el-empty description="暂无模板" />
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
    
    <!-- 模板表单对话框 -->
    <el-dialog
      v-model="templateFormVisible"
      :title="editingTemplate ? '编辑模板' : '添加模板'"
      width="600px"
    >
      <el-form
        ref="templateFormRef"
        :model="templateForm"
        :rules="templateFormRules"
        label-width="80px"
      >
        <el-form-item label="模板名称" prop="name">
          <el-input v-model="templateForm.name" placeholder="请输入模板名称" />
        </el-form-item>
        
        <el-form-item label="分类" prop="category">
          <el-select v-model="templateForm.category" placeholder="请选择分类" style="width: 100%">
            <el-option
              v-for="category in categories"
              :key="category"
              :label="category"
              :value="category"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="描述">
          <el-input 
            v-model="templateForm.description" 
            type="textarea"
            placeholder="请输入模板描述"
            :rows="3"
          />
        </el-form-item>
        
        <el-form-item label="内容">
          <el-input 
            v-model="templateForm.content" 
            type="textarea"
            placeholder="请输入模板内容"
            :rows="6"
          />
        </el-form-item>
        
        <el-form-item label="上传文件">
          <el-upload
            class="upload-demo"
            action=""
            :auto-upload="false"
            :on-change="handleFileChange"
            :show-file-list="true"
          >
            <el-button type="primary">选择文件</el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持 Word、Excel、PDF 等格式文件
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="templateFormVisible = false">取消</el-button>
          <el-button type="primary" @click="saveTemplate">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useDocumentStore } from '../stores/document'
import type { DocumentTemplate, DocumentTemplateFormData } from '../types/document'

const documentStore = useDocumentStore()

// 响应式数据
const searchKeyword = ref('')
const activeCategory = ref('教案模板')
const templateFormVisible = ref(false)
const editingTemplate = ref<DocumentTemplate | null>(null)
const selectedFile = ref<File | null>(null)

// 表单引用
const templateFormRef = ref()

// 表单数据
const templateForm = reactive<DocumentTemplateFormData>({
  name: '',
  description: '',
  category: '教案模板',
  content: '',
  file_path: '',
  file_size: 0
})

// 表单验证规则
const templateFormRules = {
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }]
}

// 计算属性
const categories = computed(() => documentStore.categories)
const templates = computed(() => documentStore.templates)

const filteredTemplates = computed(() => {
  // 如果有搜索关键词，过滤所有模板
  if (searchKeyword.value) {
    return templates.value.filter(template => 
      template.name.includes(searchKeyword.value) ||
      template.description?.includes(searchKeyword.value) ||
      template.category.includes(searchKeyword.value)
    )
  }
  
  // 否则只显示当前分类的模板
  return templates.value.filter(template => template.category === activeCategory.value)
})

// 方法
const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

const handleCategoryChange = (category: string) => {
  activeCategory.value = category
}

const searchTemplates = async () => {
  if (searchKeyword.value) {
    const result = await documentStore.searchTemplates(searchKeyword.value)
    if (!result.success) {
      ElMessage.error(result.error || '搜索失败')
    }
  } else {
    // 如果清空搜索关键词，重新加载当前分类的模板
    await documentStore.fetchTemplates()
  }
}

const showTemplateForm = () => {
  editingTemplate.value = null
  templateForm.name = ''
  templateForm.description = ''
  templateForm.category = activeCategory.value
  templateForm.content = ''
  templateForm.file_path = ''
  templateForm.file_size = 0
  selectedFile.value = null
  templateFormVisible.value = true
}

const editTemplate = (template: DocumentTemplate) => {
  editingTemplate.value = template
  templateForm.name = template.name
  templateForm.description = template.description
  templateForm.category = template.category
  templateForm.content = template.content
  templateForm.file_path = template.file_path
  templateForm.file_size = template.file_size
  selectedFile.value = null
  templateFormVisible.value = true
}

const handleFileChange = (file: any) => {
  selectedFile.value = file.raw
  templateForm.file_path = file.name
  templateForm.file_size = file.size
}

const saveTemplate = async () => {
  if (!templateFormRef.value) return
  
  // @ts-ignore
  await templateFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      let result
      if (editingTemplate.value) {
        // 更新模板
        result = await documentStore.updateTemplate(editingTemplate.value.id, { ...templateForm })
      } else {
        // 创建模板
        result = await documentStore.createTemplate({ ...templateForm })
      }
      
      if (result.success) {
        ElMessage.success(editingTemplate.value ? '更新成功' : '创建成功')
        templateFormVisible.value = false
      } else {
        ElMessage.error(result.error || (editingTemplate.value ? '更新失败' : '创建失败'))
      }
    }
  })
}

const deleteTemplate = async (id: number) => {
  ElMessageBox.confirm('确定要删除这个模板吗？', '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    const result = await documentStore.deleteTemplate(id)
    if (result.success) {
      ElMessage.success('删除成功')
    } else {
      ElMessage.error(result.error || '删除失败')
    }
  }).catch(() => {
    // 用户取消删除
  })
}

const downloadTemplate = async (id: number) => {
  const result = await documentStore.downloadTemplate(id)
  if (result.success) {
    ElMessage.success('下载成功，请在文档目录中查看')
  } else {
    ElMessage.error(result.error || '下载失败')
  }
}

// 初始化数据
onMounted(async () => {
  await documentStore.fetchTemplates()
})
</script>

<style scoped>
.documents-container {
  padding: 20px;
}

.documents-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left, .header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.template-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.template-card:hover {
  transform: translateY(-2px);
}

.template-content {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  margin-bottom: 15px;
}

.template-icon {
  color: #409EFF;
  flex-shrink: 0;
}

.template-info {
  flex: 1;
}

.template-name {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 5px;
  color: #333;
}

.template-description {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
  line-height: 1.4;
}

.template-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
}

.download-count {
  display: flex;
  align-items: center;
  gap: 3px;
}

.template-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px 0;
}

.upload-demo {
  width: 100%;
}
</style>