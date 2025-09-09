<template>
  <div class="schedules-container">
    <el-card class="schedule-card">
      <template #header>
        <div class="card-header">
          <span>课程表管理</span>
          <div>
            <el-button type="primary" @click="showScheduleForm()">添加课程</el-button>
          </div>
        </div>
      </template>
      
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="班级课表" name="class">
          <el-form :inline="true" :model="classSearchForm" class="search-form">
            <el-form-item label="选择班级">
              <el-select 
                v-model="classSearchForm.class_id" 
                placeholder="请选择班级" 
                clearable
                @change="loadClassSchedules"
              >
                <el-option
                  v-for="item in classes"
                  :key="item.id"
                  :label="`${item.grade}${item.name}`"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadClassSchedules">查询</el-button>
            </el-form-item>
          </el-form>
          
          <div v-if="classSearchForm.class_id" class="schedule-table">
            <h3>{{ selectedClassName }} 课程表</h3>
            <el-table :data="classSchedules" style="width: 100%" border>
              <el-table-column prop="day_of_week" label="星期" width="80">
                <template #default="scope">
                  {{ getDayOfWeek(scope.row.day_of_week) }}
                </template>
              </el-table-column>
              <el-table-column prop="start_time" label="开始时间" width="100" />
              <el-table-column prop="end_time" label="结束时间" width="100" />
              <el-table-column prop="subject" label="科目" />
              <el-table-column prop="teacher_name" label="教师" />
              <el-table-column prop="classroom" label="教室" />
              <el-table-column label="操作" width="150">
                <template #default="scope">
                  <el-button size="small" @click="editSchedule(scope.row)">编辑</el-button>
                  <el-button size="small" type="danger" @click="deleteSchedule(scope.row.id)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div v-else class="empty-schedule">
            <el-empty description="请选择班级查看课程表" />
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="教师课表" name="teacher">
          <el-form :inline="true" :model="teacherSearchForm" class="search-form">
            <el-form-item label="教师姓名">
              <el-input 
                v-model="teacherSearchForm.teacher_name" 
                placeholder="请输入教师姓名" 
                clearable
                @keyup.enter="loadTeacherSchedules"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadTeacherSchedules">查询</el-button>
            </el-form-item>
          </el-form>
          
          <div v-if="teacherSearchForm.teacher_name" class="schedule-table">
            <h3>{{ teacherSearchForm.teacher_name }} 课程表</h3>
            <el-table :data="teacherSchedules" style="width: 100%" border>
              <el-table-column prop="day_of_week" label="星期" width="80">
                <template #default="scope">
                  {{ getDayOfWeek(scope.row.day_of_week) }}
                </template>
              </el-table-column>
              <el-table-column prop="start_time" label="开始时间" width="100" />
              <el-table-column prop="end_time" label="结束时间" width="100" />
              <el-table-column prop="subject" label="科目" />
              <el-table-column prop="class_name" label="班级" />
              <el-table-column prop="classroom" label="教室" />
              <el-table-column label="操作" width="150">
                <template #default="scope">
                  <el-button size="small" @click="editSchedule(scope.row)">编辑</el-button>
                  <el-button size="small" type="danger" @click="deleteSchedule(scope.row.id)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div v-else class="empty-schedule">
            <el-empty description="请输入教师姓名查看课程表" />
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="所有课程" name="all">
          <el-table :data="allSchedules" style="width: 100%" border>
            <el-table-column prop="day_of_week" label="星期" width="80">
              <template #default="scope">
                {{ getDayOfWeek(scope.row.day_of_week) }}
              </template>
            </el-table-column>
            <el-table-column prop="start_time" label="开始时间" width="100" />
            <el-table-column prop="end_time" label="结束时间" width="100" />
            <el-table-column prop="subject" label="科目" />
            <el-table-column prop="class_name" label="班级" />
            <el-table-column prop="teacher_name" label="教师" />
            <el-table-column prop="classroom" label="教室" />
            <el-table-column label="操作" width="150">
              <template #default="scope">
                <el-button size="small" @click="editSchedule(scope.row)">编辑</el-button>
                <el-button size="small" type="danger" @click="deleteSchedule(scope.row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>
    
    <!-- 课程表表单对话框 -->
    <el-dialog
      v-model="scheduleFormVisible"
      :title="editingSchedule ? '编辑课程' : '添加课程'"
      width="500px"
    >
      <el-form
        ref="scheduleFormRef"
        :model="scheduleForm"
        :rules="scheduleFormRules"
        label-width="80px"
      >
        <el-form-item label="班级" prop="class_id">
          <el-select 
            v-model="scheduleForm.class_id" 
            placeholder="请选择班级" 
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="item in classes"
              :key="item.id"
              :label="`${item.grade}${item.name}`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="教师" prop="teacher_name">
          <el-input 
            v-model="scheduleForm.teacher_name" 
            placeholder="请输入教师姓名"
          />
        </el-form-item>
        
        <el-form-item label="科目" prop="subject">
          <el-input 
            v-model="scheduleForm.subject" 
            placeholder="请输入科目名称"
          />
        </el-form-item>
        
        <el-form-item label="星期" prop="day_of_week">
          <el-select 
            v-model="scheduleForm.day_of_week" 
            placeholder="请选择星期"
            style="width: 100%"
          >
            <el-option label="星期一" :value="1" />
            <el-option label="星期二" :value="2" />
            <el-option label="星期三" :value="3" />
            <el-option label="星期四" :value="4" />
            <el-option label="星期五" :value="5" />
            <el-option label="星期六" :value="6" />
            <el-option label="星期日" :value="7" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="开始时间" prop="start_time">
          <el-time-picker
            v-model="scheduleForm.start_time"
            value-format="HH:mm"
            format="HH:mm"
            placeholder="选择开始时间"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="结束时间" prop="end_time">
          <el-time-picker
            v-model="scheduleForm.end_time"
            value-format="HH:mm"
            format="HH:mm"
            placeholder="选择结束时间"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="教室" prop="classroom">
          <el-input 
            v-model="scheduleForm.classroom" 
            placeholder="请输入教室"
          />
        </el-form-item>
        
        <el-form-item label="备注" prop="notes">
          <el-input 
            v-model="scheduleForm.notes" 
            type="textarea"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="scheduleFormVisible = false">取消</el-button>
          <el-button type="primary" @click="saveSchedule">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useClassStore } from '../stores/class'
import { useScheduleStore } from '../stores/schedule'
import type { Schedule, ScheduleFormData } from '../types/schedule'

const classStore = useClassStore()
const scheduleStore = useScheduleStore()

// 表单引用
const scheduleFormRef = ref()

// 活动标签页
const activeTab = ref('class')

// 搜索表单
const classSearchForm = reactive({
  class_id: null as number | null
})

const teacherSearchForm = reactive({
  teacher_name: ''
})

// 课程表表单
const scheduleFormVisible = ref(false)
const editingSchedule = ref<Schedule | null>(null)

const scheduleForm = reactive<ScheduleFormData>({
  class_id: null,
  teacher_id: null,
  teacher_name: '',
  subject: '',
  day_of_week: 1,
  start_time: '',
  end_time: '',
  classroom: '',
  notes: ''
})

// 表单验证规则
const scheduleFormRules = {
  subject: [{ required: true, message: '请输入科目名称', trigger: 'blur' }],
  day_of_week: [{ required: true, message: '请选择星期', trigger: 'change' }],
  start_time: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  end_time: [{ required: true, message: '请选择结束时间', trigger: 'change' }]
}

// 数据
const classes = computed(() => classStore.classes)
const allSchedules = computed(() => scheduleStore.schedules)
const classSchedules = ref<Schedule[]>([])
const teacherSchedules = ref<Schedule[]>([])

// 计算属性
const selectedClassName = computed(() => {
  if (!classSearchForm.class_id) return ''
  const selectedClass = classes.value.find(c => c.id === classSearchForm.class_id)
  return selectedClass ? `${selectedClass.grade}${selectedClass.name}` : ''
})

// 方法
const getDayOfWeek = (day: number) => {
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  return days[day - 1] || ''
}

const handleTabChange = (tab: string) => {
  if (tab === 'all') {
    scheduleStore.fetchSchedules()
  }
}

const loadClassSchedules = async () => {
  if (!classSearchForm.class_id) {
    classSchedules.value = []
    return
  }
  
  const result = await scheduleStore.fetchClassSchedules(classSearchForm.class_id)
  if (result.success) {
    classSchedules.value = result.data || []
  } else {
    ElMessage.error(result.error || '获取班级课表失败')
  }
}

const loadTeacherSchedules = async () => {
  if (!teacherSearchForm.teacher_name) {
    teacherSchedules.value = []
    return
  }
  
  // 这里简化处理，实际应该通过教师ID查询
  const result = await scheduleStore.fetchSchedules()
  if (result.success) {
    teacherSchedules.value = scheduleStore.schedules.filter(
      s => s.teacher_name && s.teacher_name.includes(teacherSearchForm.teacher_name)
    )
  } else {
    ElMessage.error(result.error || '获取教师课表失败')
  }
}

const showScheduleForm = (schedule?: Schedule) => {
  if (schedule) {
    editingSchedule.value = schedule
    // 填充表单数据
    scheduleForm.class_id = schedule.class_id
    scheduleForm.teacher_id = schedule.teacher_id
    scheduleForm.teacher_name = schedule.teacher_name
    scheduleForm.subject = schedule.subject
    scheduleForm.day_of_week = schedule.day_of_week
    scheduleForm.start_time = schedule.start_time
    scheduleForm.end_time = schedule.end_time
    scheduleForm.classroom = schedule.classroom
    scheduleForm.notes = schedule.notes
  } else {
    editingSchedule.value = null
    // 重置表单
    scheduleForm.class_id = null
    scheduleForm.teacher_id = null
    scheduleForm.teacher_name = ''
    scheduleForm.subject = ''
    scheduleForm.day_of_week = 1
    scheduleForm.start_time = ''
    scheduleForm.end_time = ''
    scheduleForm.classroom = ''
    scheduleForm.notes = ''
  }
  scheduleFormVisible.value = true
}

const editSchedule = (schedule: Schedule) => {
  showScheduleForm(schedule)
}

const deleteSchedule = async (id: number) => {
  ElMessageBox.confirm('确定要删除这个课程安排吗？', '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    const result = await scheduleStore.deleteSchedule(id)
    if (result.success) {
      ElMessage.success('删除成功')
      // 重新加载当前视图的数据
      if (activeTab.value === 'class' && classSearchForm.class_id) {
        loadClassSchedules()
      } else if (activeTab.value === 'teacher' && teacherSearchForm.teacher_name) {
        loadTeacherSchedules()
      } else if (activeTab.value === 'all') {
        scheduleStore.fetchSchedules()
      }
    } else {
      ElMessage.error(result.error || '删除失败')
    }
  }).catch(() => {
    // 用户取消删除
  })
}

const saveSchedule = async () => {
  if (!scheduleFormRef.value) return
  
  // @ts-ignore
  await scheduleFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      let result
      if (editingSchedule.value) {
        // 更新课程
        result = await scheduleStore.updateSchedule(editingSchedule.value.id, { ...scheduleForm })
      } else {
        // 创建课程
        result = await scheduleStore.createSchedule({ ...scheduleForm })
      }
      
      if (result.success) {
        ElMessage.success(editingSchedule.value ? '更新成功' : '创建成功')
        scheduleFormVisible.value = false
        
        // 重新加载当前视图的数据
        if (activeTab.value === 'class' && classSearchForm.class_id) {
          loadClassSchedules()
        } else if (activeTab.value === 'teacher' && teacherSearchForm.teacher_name) {
          loadTeacherSchedules()
        } else if (activeTab.value === 'all') {
          scheduleStore.fetchSchedules()
        }
      } else {
        ElMessage.error(result.error || (editingSchedule.value ? '更新失败' : '创建失败'))
      }
    }
  })
}

// 初始化数据
onMounted(async () => {
  await classStore.fetchClasses()
})
</script>

<style scoped>
.schedules-container {
  padding: 20px;
}

.schedule-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}

.schedule-table {
  margin-top: 20px;
}

.empty-schedule {
  text-align: center;
  padding: 40px 0;
}

.dialog-footer {
  text-align: right;
}
</style>