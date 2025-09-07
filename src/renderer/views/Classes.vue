<template>
  <Layout>
    <div class="classes-container">
      <div class="page-header">
        <h1>班级管理</h1>
        <p>管理您的班级信息，包括班级名称、年级、班主任等详细信息</p>
      </div>

      <div class="content">
        <ClassList @add="handleAdd" @edit="handleEdit" />
      </div>

      <ClassForm
        v-model="formVisible"
        :edit-data="editingClass"
        @success="handleFormSuccess"
      />
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Layout from './Layout.vue'
import ClassList from '../components/ClassList.vue'
import ClassForm from '../components/ClassForm.vue'
import type { Class } from '../types/class'

const formVisible = ref(false)
const editingClass = ref<Class | undefined>()

const handleAdd = () => {
  editingClass.value = undefined
  formVisible.value = true
}

const handleEdit = (classData: Class) => {
  editingClass.value = classData
  formVisible.value = true
}

const handleFormSuccess = () => {
  // 列表会自动刷新，这里不需要额外操作
}
</script>

<style scoped>
.classes-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  margin-bottom: 0;
}

.page-header h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
}

.page-header p {
  margin: 0;
  opacity: 0.9;
  font-size: 16px;
}

.content {
  flex: 1;
  padding: 0;
  background: #f5f7fa;
}
</style>