<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑成绩' : '录入成绩'"
    width="600px"
    :close-on-click-modal="false"
    @closed="resetForm"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      @submit.prevent="handleSubmit"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="班级" prop="class_id">
            <el-select
              v-model="formData.class_id"
              placeholder="选择班级"
              style="width: 100%"
              @change="handleClassChange"
              :disabled="isEdit"
            >
              <el-option
                v-for="classItem in classes"
                :key="classItem.id"
                :label="`${classItem.grade}${classItem.class_number}班`"
                :value="classItem.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="学生" prop="student_id">
            <el-select
              v-model="formData.student_id"
              placeholder="选择学生"
              style="width: 100%"
              filterable
              :disabled="isEdit"
            >
              <el-option
                v-for="student in filteredStudents"
                :key="student.id"
                :label="`${student.name} (${student.student_id})`"
                :value="student.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="学科" prop="subject">
            <el-select
              v-model="formData.subject"
              placeholder="选择学科"
              style="width: 100%"
              filterable
              allow-create
            >
              <el-option
                v-for="subject in predefinedSubjects"
                :key="subject"
                :label="subject"
                :value="subject"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="考试类型" prop="exam_type">
            <el-select
              v-model="formData.exam_type"
              placeholder="选择考试类型"
              style="width: 100%"
              filterable
              allow-create
            >
              <el-option
                v-for="examType in predefinedExamTypes"
                :key="examType"
                :label="examType"
                :value="examType"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="成绩" prop="score">
            <el-input-number
              v-model="formData.score"
              :min="0"
              :max="100"
              :precision="1"
              style="width: 100%"
              placeholder="请输入成绩"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="考试日期" prop="exam_date">
            <el-date-picker
              v-model="formData.exam_date"
              type="date"
              placeholder="选择考试日期"
              style="width: 100%"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="学期" prop="semester">
            <el-select
              v-model="formData.semester"
              placeholder="选择学期"
              style="width: 100%"
            >
              <el-option label="上学期" value="上学期" />
              <el-option label="下学期" value="下学期" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="学年" prop="year">
            <el-select
              v-model="formData.year"
              placeholder="选择学年"
              style="width: 100%"
            >
              <el-option
                v-for="year in availableYears"
                :key="year"
                :label="`${year}年`"
                :value="year"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="备注" prop="notes">
        <el-input
          v-model="formData.notes"
          type="textarea"
          :rows="3"
          placeholder="请输入备注（可选）"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="handleSubmit"
          :loading="loading"
        >
          {{ isEdit ? '更新' : '录入' }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElForm, ElMessage } from 'element-plus'
import { useStudentStore } from '../stores/student'
import { useClassStore } from '../stores/class'
import { useGradeStore } from '../stores/grade'
import type { GradeFormData } from '../types/grade'
import type { Student } from '../types/student'
import type { Class } from '../types/class'
import { SUBJECTS, EXAM_TYPES } from '../types/grade'

interface Props {
  modelValue: boolean
  grade?: GradeFormData & { id?: number }
  classes?: Class[]
  students?: Student[]
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', data: GradeFormData & { id?: number }): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  grade: undefined,
  classes: () => [],
  students: () => []
})

const emit = defineEmits<Emits>()

const studentStore = useStudentStore()
const classStore = useClassStore()
const gradeStore = useGradeStore()

const formRef = ref<InstanceType<typeof ElForm>>()
const loading = ref(false)

// 对话框显示状态
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 是否为编辑模式
const isEdit = computed(() => !!props.grade?.id)

// 表单数据
const formData = reactive<GradeFormData & { id?: number }>({
  student_id: 0,
  class_id: 0,
  subject: '',
  score: 0,
  exam_type: '',
  exam_date: '',
  semester: '上学期',
  year: new Date().getFullYear(),
  notes: ''
})

// 预定义选项
const predefinedSubjects = computed(() => [...SUBJECTS, ...(gradeStore.subjects || [])])
const predefinedExamTypes = computed(() => [...EXAM_TYPES, ...(gradeStore.examTypes || [])])

// 可用年份
const availableYears = computed(() => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let i = currentYear - 2; i <= currentYear + 1; i++) {
    years.push(i)
  }
  return years
})

// 根据班级筛选学生
const filteredStudents = computed(() => {
  if (!formData.class_id) return props.students
  
  // 筛选属于指定班级的学生
  // 注意：如果学生数据中没有 class_id 字段，则显示所有学生
  const studentsWithClassId = props.students.filter(student => {
    return student.class_id === formData.class_id
  })
  
  // 如果没有找到匹配的学生，可能是数据结构问题，返回所有学生作为后备
  return studentsWithClassId.length > 0 ? studentsWithClassId : props.students
})

// 表单验证规则
const formRules = {
  class_id: [
    { required: true, message: '请选择班级', trigger: 'change' }
  ],
  student_id: [
    { required: true, message: '请选择学生', trigger: 'change' }
  ],
  subject: [
    { required: true, message: '请输入学科', trigger: 'blur' }
  ],
  exam_type: [
    { required: true, message: '请输入考试类型', trigger: 'blur' }
  ],
  score: [
    { required: true, message: '请输入成绩', trigger: 'blur' },
    { type: 'number', min: 0, max: 100, message: '成绩应在0-100之间', trigger: 'blur' }
  ],
  exam_date: [
    { required: true, message: '请选择考试日期', trigger: 'change' }
  ],
  semester: [
    { required: true, message: '请选择学期', trigger: 'change' }
  ],
  year: [
    { required: true, message: '请选择学年', trigger: 'change' }
  ]
}

// 处理班级变化
const handleClassChange = () => {
  // 重置学生选择
  formData.student_id = 0
}

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  
  // 重置为默认值
  Object.assign(formData, {
    student_id: 0,
    class_id: 0,
    subject: '',
    score: 0,
    exam_type: '',
    exam_date: '',
    semester: '上学期',
    year: new Date().getFullYear(),
    notes: '',
    id: undefined
  })
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    
    loading.value = true
    
    // 创建提交数据的副本，确保数据类型正确
    const submitData = {
      ...formData,
      score: Number(formData.score),
      student_id: Number(formData.student_id),
      class_id: Number(formData.class_id),
      year: Number(formData.year)
    }
    
    emit('submit', submitData)
    
  } catch (error) {
    console.error('表单验证失败:', error)
    ElMessage.error('请检查表单数据')
  } finally {
    loading.value = false
  }
}

// 监听 props.grade 变化，填充表单
watch(
  () => props.grade,
  (newGrade) => {
    if (newGrade) {
      Object.assign(formData, {
        id: newGrade.id,
        student_id: newGrade.student_id || 0,
        class_id: newGrade.class_id || 0,
        subject: newGrade.subject || '',
        score: newGrade.score || 0,
        exam_type: newGrade.exam_type || '',
        exam_date: newGrade.exam_date || '',
        semester: newGrade.semester || '上学期',
        year: newGrade.year || new Date().getFullYear(),
        notes: newGrade.notes || ''
      })
    }
  },
  { immediate: true }
)

onMounted(() => {
  // 初始化数据
  if (props.classes.length === 0) {
    classStore.fetchClasses()
  }
  if (props.students.length === 0) {
    studentStore.fetchStudents({ page_size: 1000 }) // 获取所有学生
  }
  // 获取学科和考试类型
  gradeStore.fetchSubjects()
  gradeStore.fetchExamTypes()
})
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-input-number .el-input__inner) {
  text-align: left;
}
</style>