<template>
  <div class="item-form">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      @submit.prevent="handleSubmit"
    >
      <el-form-item label="商品名称" prop="name">
        <el-input
          v-model="formData.name"
          placeholder="请输入商品名称"
          maxlength="50"
          show-word-limit
        />
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="兑换价格" prop="price">
            <el-input-number
              v-model="formData.price"
              :min="0"
              :max="99999"
              :precision="0"
              controls-position="right"
              style="width: 100%"
            />
            <div class="form-tip">单位：积分</div>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="商品库存" prop="stock">
            <el-input-number
              v-model="formData.stock"
              :min="-1"
              :max="99999"
              :precision="0"
              controls-position="right"
              style="width: 100%"
            />
            <div class="form-tip">-1表示无限库存</div>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="排序顺序" prop="sort_order">
            <el-input-number
              v-model="formData.sort_order"
              :min="0"
              :max="9999"
              :precision="0"
              controls-position="right"
              style="width: 100%"
            />
            <div class="form-tip">数字越小越靠前</div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="商品分类" prop="category">
        <el-select
          v-model="formData.category"
          placeholder="请选择商品分类"
          style="width: 100%"
          filterable
        >
          <el-option
            v-for="category in categories"
            :key="category.id"
            :label="category.name"
            :value="category.name"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="商品图片">
        <div class="image-upload">
          <div class="image-preview" v-if="formData.image_url">
            <img :src="formData.image_url" alt="商品图片" />
            <div class="image-actions">
              <el-button size="small" @click="editImage">
                <el-icon><Edit /></el-icon>
                更换
              </el-button>
              <el-button size="small" type="danger" @click="removeImage">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </div>
          <div class="upload-area" v-else @click="selectImage">
            <el-icon class="upload-icon"><Plus /></el-icon>
            <div class="upload-text">点击上传图片</div>
            <div class="upload-tip">支持 JPG、PNG 格式，建议尺寸 300x300</div>
          </div>
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            style="display: none"
            @change="handleImageSelect"
          />
        </div>
      </el-form-item>


    </el-form>

    <div class="form-actions">
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="loading">
        {{ isEdit ? '更新' : '创建' }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useShopStore } from '../../stores/shop'
import type { ShopItem, ShopItemFormData } from '../../types/shop'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'

interface Props {
  item?: ShopItem | null
}

interface Emits {
  success: []
  cancel: []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const shopStore = useShopStore()
const formRef = ref<FormInstance>()
const fileInput = ref<HTMLInputElement>()

// 表单数据
const formData = ref<ShopItemFormData>({
  name: '',
  description: '',
  price: 0,
  category: '',
  image_url: '',
  stock: 0,
  is_active: true,
  sort_order: 0,
  attributes: {}
})

// 属性编辑器（已注释掉，因为未使用且可能导致克隆问题）
// const attributes = ref<Array<{ key: string; value: string }>>([])

// 表单验证规则
const formRules: FormRules = {
  name: [
    { required: true, message: '请输入商品名称', trigger: 'blur' },
    { min: 1, max: 50, message: '商品名称长度在 1 到 50 个字符', trigger: 'blur' }
  ],
  price: [
    { required: true, message: '请输入兑换价格', trigger: 'blur' },
    { type: 'number', min: 0, message: '价格不能小于0', trigger: 'blur' }
  ],
  stock: [
    { required: true, message: '请输入商品库存', trigger: 'blur' },
    { type: 'number', min: -1, message: '库存不能小于-1', trigger: 'blur' }
  ]
}

// 计算属性
const categories = computed(() => shopStore.categories)
const loading = computed(() => shopStore.loading)
const isEdit = computed(() => !!props.item)

// 初始化表单数据
const initFormData = () => {
  if (props.item) {
    formData.value = {
      name: props.item.name,
      description: props.item.description || '',
      price: props.item.price,
      category: '',
      image_url: props.item.image_url || '',
      stock: props.item.stock,
      is_active: props.item.is_active,
      sort_order: props.item.sort_order,
      attributes: props.item.attributes || {}
    }
  } else {
    formData.value = {
      name: '',
      description: '',
      price: 0,
      category: '',
      image_url: '',
      stock: 0,
      is_active: true,
      sort_order: 0,
      attributes: {}
    }
  }
}

// 选择图片
const selectImage = () => {
  fileInput.value?.click()
}

// 编辑图片
const editImage = () => {
  fileInput.value?.click()
}

// 删除图片
const removeImage = () => {
  formData.value.image_url = ''
}

// 处理图片选择
const handleImageSelect = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件')
    return
  }

  // 检查文件大小（限制为2MB）
  if (file.size > 2 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过2MB')
    return
  }

  // 创建预览URL
  const reader = new FileReader()
  reader.onload = (e) => {
    formData.value.image_url = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

// 处理提交
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    // 创建一个深度克隆的纯JavaScript对象，确保所有数据都可被IPC克隆
    const formDataCopy = JSON.parse(JSON.stringify({
      name: formData.value.name,
      description: formData.value.description,
      price: formData.value.price,
      category: formData.value.category,
      image_url: formData.value.image_url,
      stock: formData.value.stock,
      is_active: formData.value.is_active,
      sort_order: formData.value.sort_order,
      attributes: formData.value.attributes
    }))

    if (isEdit.value && props.item) {
      await shopStore.updateItem(props.item.id, formDataCopy)
      ElMessage.success('商品更新成功')
    } else {
      await shopStore.createItem(formDataCopy)
      ElMessage.success('商品创建成功')
    }
    
    emit('success')
  } catch (error) {
    console.error('提交失败:', error)
  }
}

// 处理取消
const handleCancel = () => {
  emit('cancel')
}

// 监听props变化
watch(() => props.item, initFormData, { immediate: true })

// 初始化
onMounted(() => {
  shopStore.fetchCategories()
})
</script>

<style scoped>
.item-form {
  padding: 0;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.image-upload {
  width: 100%;
}

.image-preview {
  position: relative;
  width: 200px;
  height: 200px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  overflow: hidden;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-actions {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  padding: 8px;
  display: flex;
  gap: 8px;
  justify-content: center;
}

.upload-area {
  width: 200px;
  height: 200px;
  border: 2px dashed #dcdfe6;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.3s;
}

.upload-area:hover {
  border-color: #409eff;
}

.upload-icon {
  font-size: 48px;
  color: #c0c4cc;
  margin-bottom: 8px;
}

.upload-text {
  font-size: 14px;
  color: #606266;
  margin-bottom: 4px;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  text-align: center;
}

.attributes-editor {
  width: 100%;
}

.attribute-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}
</style>