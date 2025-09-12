<template>
  <el-dialog
    v-model="visible"
    title="分类管理"
    width="600px"
    @close="$emit('close')"
  >
    <div class="category-management">
      <el-form :model="form" label-width="80px">
        <el-form-item label="分类名称">
          <el-input v-model="form.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="addCategory">添加分类</el-button>
        </el-form-item>
      </el-form>
      
      <el-divider />
      
      <div class="category-list">
        <h4>现有分类</h4>
        <el-tag
          v-for="category in categories"
          :key="category.id"
          closable
          @close="deleteCategory(category.id)"
          style="margin: 5px;"
        >
          {{ category.name }}
        </el-tag>
      </div>
    </div>
    
    <template #footer>
      <el-button @click="$emit('close')">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['close'])

const visible = ref(true)
const form = ref({
  name: ''
})
const categories = ref([])

const addCategory = () => {
  if (!form.value.name.trim()) {
    ElMessage.warning('请输入分类名称')
    return
  }
  
  // 这里应该调用API添加分类
  categories.value.push({
    id: Date.now(),
    name: form.value.name
  })
  
  form.value.name = ''
  ElMessage.success('分类添加成功')
}

const deleteCategory = (id: number) => {
  categories.value = categories.value.filter(cat => cat.id !== id)
  ElMessage.success('分类删除成功')
}

onMounted(() => {
  // 这里应该从API加载分类数据
  categories.value = [
    { id: 1, name: '学习用品' },
    { id: 2, name: '生活用品' },
    { id: 3, name: '娱乐用品' }
  ]
})
</script>

<style scoped>
.category-management {
  padding: 20px 0;
}

.category-list {
  margin-top: 20px;
}

.category-list h4 {
  margin-bottom: 10px;
  color: #606266;
}
</style>