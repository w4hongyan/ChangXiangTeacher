<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑班级' : '添加班级'"
    width="500px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
      label-position="right"
    >
      <el-form-item label="班级名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入班级名称" maxlength="50" />
      </el-form-item>

      <el-form-item label="年级" prop="grade">
        <el-select v-model="formData.grade" placeholder="请选择年级" style="width: 100%">
          <el-option
            v-for="grade in gradeOptions"
            :key="grade"
            :label="grade"
            :value="grade"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="班级序号" prop="class_number">
        <el-input v-model="formData.class_number" placeholder="请输入班级序号" maxlength="10" />
      </el-form-item>

      <el-form-item label="班主任" prop="homeroom_teacher">
        <el-input v-model="formData.homeroom_teacher" placeholder="请输入班主任姓名（选填）" maxlength="20" />
      </el-form-item>

      <el-form-item label="联系电话" prop="teacher_phone">
        <el-input v-model="formData.teacher_phone" placeholder="请输入联系电话（选填）" maxlength="20" />
      </el-form-item>

      <el-form-item label="最大人数" prop="max_students">
        <el-input-number
          v-model="formData.max_students"
          :min="10"
          :max="100"
          :step="5"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="学期">
        <el-select v-model="formData.semester" placeholder="请选择学期（选填）" style="width: 100%">
          <el-option label="上学期" value="上学期" />
          <el-option label="下学期" value="下学期" />
        </el-select>
      </el-form-item>

      <el-form-item label="学年">
        <el-date-picker
          v-model="formData.year"
          type="year"
          placeholder="请选择学年（选填）"
          style="width: 100%"
          format="YYYY"
          value-format="YYYY"
        />
      </el-form-item>

      <el-form-item label="班级描述">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="请输入班级描述（选填）"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          {{ isEdit ? '更新' : '创建' }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useClassStore } from '../stores/class'
import type { Class, ClassFormData } from '../types/class'

const props = defineProps<{
  modelValue: boolean
  editData?: Class
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  success: []
}>()

const classStore = useClassStore()
const formRef = ref()
const loading = ref(false)

const gradeOptions = [
  '一年级', '二年级', '三年级', '四年级', '五年级', '六年级',
  '七年级', '八年级', '九年级',
  '高一', '高二', '高三'
]

const formData = ref<ClassFormData>({
  name: '',
  grade: '',
  class_number: '',
  homeroom_teacher: '',
  teacher_phone: '',
  description: '',
  max_students: 50,
  semester: '上学期',
  year: new Date().getFullYear()
})

const rules = {
  name: [
    { required: true, message: '请输入班级名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  grade: [
    { required: true, message: '请选择年级', trigger: 'change' }
  ],
  class_number: [
    { required: true, message: '请输入班级序号', trigger: 'blur' }
  ],
  homeroom_teacher: [
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  teacher_phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  max_students: [
    { type: 'number', min: 10, max: 100, message: '人数应在 10 到 100 之间', trigger: 'blur' }
  ]
}

const resetForm = () => {
  formData.value = {
    name: '',
    grade: '',
    class_number: '',
    homeroom_teacher: '',
    teacher_phone: '',
    description: '',
    max_students: 50,
    semester: '上学期',
    year: new Date().getFullYear()
  }
  formRef.value?.resetFields()
}

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isEdit = computed(() => !!props.editData)

watch(() => props.editData, (newData) => {
  if (newData) {
    formData.value = {
      name: newData.name,
      grade: newData.grade,
      class_number: newData.class_number,
      homeroom_teacher: newData.homeroom_teacher,
      teacher_phone: newData.teacher_phone || '',
      description: newData.description || '',
      max_students: newData.max_students,
      semester: newData.semester,
      year: newData.year
    }
  } else {
    resetForm()
  }
}, { immediate: true })

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    loading.value = true

    // 创建纯对象数据，避免传递复杂对象
    const cleanData = {
      name: String(formData.value.name || ''),
      grade: String(formData.value.grade || ''),
      class_number: String(formData.value.class_number || ''),
      homeroom_teacher: String(formData.value.homeroom_teacher || ''),
      teacher_phone: String(formData.value.teacher_phone || ''),
      description: String(formData.value.description || ''),
      max_students: Number(formData.value.max_students || 50),
      semester: String(formData.value.semester || '上学期'),
      year: Number(formData.value.year || new Date().getFullYear())
    }

    let result
    if (isEdit.value) {
      result = await classStore.updateClass(props.editData!.id!, cleanData)
    } else {
      result = await classStore.createClass(cleanData)
    }

    if (result.success) {
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
      emit('success')
      handleClose()
    } else {
      ElMessage.error(result.error || '操作失败')
    }
  } catch (error) {
    console.error('表单验证失败:', error)
    ElMessage.error('表单验证失败')
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  visible.value = false
  resetForm()
}
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>