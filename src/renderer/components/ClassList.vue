<template>
  <div class="class-list">
    <div class="header">
      <el-button type="primary" @click="handleAdd" :icon="Plus">
        添加班级
      </el-button>
      <el-input
        v-model="searchQuery"
        placeholder="搜索班级名称或班主任"
        style="width: 300px; margin-left: 16px"
        :prefix-icon="Search"
        clearable
      />
    </div>

    <el-table
      v-loading="loading"
      :data="filteredClasses"
      style="width: 100%"
      stripe
      border
    >
      <el-table-column prop="name" label="班级名称" width="120" />
      <el-table-column prop="grade" label="年级" width="80" />
      <el-table-column prop="class_number" label="序号" width="70" />
      <el-table-column prop="homeroom_teacher" label="班主任" width="100" />
      <el-table-column prop="teacher_phone" label="联系电话" width="120" />
      <el-table-column prop="max_students" label="最大人数" width="80" align="center" />
      <el-table-column prop="semester" label="学期" width="80" />
      <el-table-column prop="year" label="学年" width="80" />
      <el-table-column prop="description" label="班级描述" min-width="200" show-overflow-tooltip />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[10, 20, 50, 100]"
      :total="filteredClassesAll.length"
      layout="total, sizes, prev, pager, next, jumper"
      style="margin-top: 16px; text-align: right"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Plus, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useClassStore } from '../stores/class'
import type { Class } from '../types/class'

const emit = defineEmits<{
  add: []
  edit: [classData: Class]
}>()

const classStore = useClassStore()
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

const loading = computed(() => classStore.loading)
const classes = computed(() => classStore.classes)

// 过滤后的班级数据（用于计算总数）
const filteredClassesAll = computed(() => {
  return classes.value.filter(cls => 
    cls.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    cls.homeroom_teacher.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// 当前页显示的班级数据
const filteredClasses = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredClassesAll.value.slice(start, end)
})

const handleAdd = () => {
  emit('add')
}

const handleEdit = (row: Class) => {
  emit('edit', row)
}

const handleDelete = async (row: Class) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除班级 "${row.name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const result = await classStore.deleteClass(row.id!)
    if (result.success) {
      ElMessage.success('删除成功')
    } else {
      ElMessage.error(result.error || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除操作失败')
    }
  }
}

// 监听搜索查询变化，重置分页
watch(searchQuery, () => {
  currentPage.value = 1
})

onMounted(() => {
  classStore.fetchClasses()
})
</script>

<style scoped>
.class-list {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
</style>