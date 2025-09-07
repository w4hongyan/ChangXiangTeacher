<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑学生' : '添加学生'"
    width="600px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      label-position="left"
    >
      <el-form-item label="学号" prop="student_id">
        <el-input v-model="form.student_id" placeholder="请输入学号" maxlength="20" />
      </el-form-item>

      <el-form-item label="姓名" prop="name">
        <el-input v-model="form.name" placeholder="请输入姓名" maxlength="50" />
      </el-form-item>

      <el-form-item label="班级" prop="class_id">
        <el-select v-model="form.class_id" placeholder="请选择班级" style="width: 100%">
          <el-option
            v-for="classItem in classes"
            :key="classItem.id"
            :label="`${classItem.grade}${classItem.class_number}班`"
            :value="classItem.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="性别" prop="gender">
        <el-radio-group v-model="form.gender">
          <el-radio value="男">男</el-radio>
          <el-radio value="女">女</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="出生年月" prop="birth_date">
        <el-date-picker
          v-model="form.birth_date"
          type="date"
          placeholder="选择出生日期"
          style="width: 100%"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>

      <el-form-item label="联系电话" prop="phone">
        <el-input v-model="form.phone" placeholder="请输入联系电话" maxlength="20" />
      </el-form-item>

      <el-form-item label="家长电话" prop="parent_phone">
        <el-input v-model="form.parent_phone" placeholder="请输入家长电话" maxlength="20" />
      </el-form-item>

      <el-form-item label="邮箱" prop="email">
        <el-input v-model="form.email" placeholder="请输入邮箱" maxlength="100" />
      </el-form-item>

      <el-form-item label="住址" prop="address">
        <el-input v-model="form.address" placeholder="请输入住址" maxlength="200" />
      </el-form-item>

      <el-form-item label="身高(cm)" prop="height">
        <el-input-number v-model="form.height" :min="100" :max="250" style="width: 100%" />
      </el-form-item>

      <el-form-item label="视力" prop="eyesight">
        <el-input v-model="form.eyesight" placeholder="如：5.0" maxlength="10" />
      </el-form-item>

      <el-form-item label="特殊需求" prop="special_needs">
        <el-input
          v-model="form.special_needs"
          type="textarea"
          placeholder="请输入特殊需求或注意事项"
          :rows="3"
          maxlength="500"
        />
      </el-form-item>

      <el-form-item label="备注" prop="notes">
        <el-input
          v-model="form.notes"
          type="textarea"
          placeholder="请输入备注信息"
          :rows="3"
          maxlength="500"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          {{ isEdit ? '更新' : '添加' }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import type { StudentFormData } from '../types/student'
import { ElMessage } from 'element-plus'

interface Props {
  modelValue: boolean
  student?: StudentFormData & { id?: number }
  classes: Array<{ id: number; grade: string; class_number: string }>
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', data: StudentFormData & { id?: number }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formRef = ref()
const loading = ref(false)

const form = ref<StudentFormData>({
  student_id: '',
  name: '',
  class_id: 0,
  gender: '男',
  birth_date: '',
  phone: '',
  parent_phone: '',
  email: '',
  address: '',
  height: 160,
  eyesight: '',
  special_needs: '',
  notes: ''
})

const isEdit = computed(() => !!props.student?.id)

const rules = {
  student_id: [
    { required: true, message: '请输入学号', trigger: 'blur' },
    { min: 2, max: 20, message: '学号长度2-20位', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 50, message: '姓名长度2-50位', trigger: 'blur' }
  ],
  class_id: [
    { required: true, message: '请选择班级', trigger: 'change' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  parent_phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  height: [
    { type: 'number', min: 100, max: 250, message: '身高应在100-250cm之间', trigger: 'blur' }
  ]
}

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    nextTick(() => {
      if (props.student) {
        form.value = { ...props.student }
      } else {
        resetForm()
      }
    })
  }
})

const resetForm = () => {
  form.value = {
    student_id: '',
    name: '',
    class_id: 0,
    gender: '男',
    birth_date: '',
    phone: '',
    parent_phone: '',
    email: '',
    address: '',
    height: 160,
    eyesight: '',
    special_needs: '',
    notes: ''
  }
}

const handleClose = () => {
  formRef.value?.resetFields()
  emit('update:modelValue', false)
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    loading.value = true
    
    const data = {
      ...form.value,
      ...(isEdit.value && props.student?.id ? { id: props.student.id } : {})
    }
    
    emit('submit', data)
    handleClose()
  } catch (error) {
    console.error('表单验证失败:', error)
  } finally {
    loading.value = false
  }
}

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})
</script>