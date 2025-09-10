<template>
  <Layout>
    <div class="points-container">
      <div class="page-header">
        <h1>积分管理</h1>
        <p>管理学生积分，包括积分规则、积分录入、排行榜等功能</p>
      </div>

      <div class="content">
        <el-tabs v-model="activeTab" type="card">
          <el-tab-pane label="积分排行榜" name="ranking">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>积分排行榜</span>
                  <div class="card-header-actions">
                    <el-select 
                      v-model="selectedClassId" 
                      placeholder="选择班级" 
                      @change="loadStudentPoints"
                      style="width: 200px; margin-right: 10px;"
                    >
                      <el-option
                        v-for="cls in classes"
                        :key="cls.id"
                        :label="`${cls.grade}${cls.class_number}班 - ${cls.name}`"
                        :value="cls.id"
                      />
                    </el-select>
                    <el-button type="primary" @click="showAddPointDialog = true">
                      添加积分记录
                    </el-button>
                  </div>
                </div>
              </template>
              
              <el-tabs v-model="rankingTab" type="border-card">
                <el-tab-pane label="学生排名" name="student">
                  <el-table 
                    :data="studentPoints" 
                    style="width: 100%" 
                    v-loading="loading"
                  >
                    <el-table-column type="index" label="#" width="60" />
                    <el-table-column prop="student_name" label="学生姓名" />
                    <el-table-column prop="total_points" label="总积分" sortable>
                      <template #default="scope">
                        <el-tag :type="scope.row.total_points > 0 ? 'success' : 'danger'">
                          {{ scope.row.total_points }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="total_reward_points" label="奖励积分" />
                    <el-table-column prop="total_penalty_points" label="惩罚积分" />
                    <el-table-column prop="reward_count" label="奖励次数" />
                    <el-table-column prop="penalty_count" label="惩罚次数" />
                    <el-table-column label="操作" width="150">
                      <template #default="scope">
                        <el-button 
                          size="small" 
                          type="primary" 
                          @click="showStudentPoints(scope.row.student_id)"
                        >
                          详情
                        </el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </el-tab-pane>
                
                <el-tab-pane label="小组排名" name="group">
                  <el-table 
                    :data="groupPoints" 
                    style="width: 100%" 
                    v-loading="loading"
                  >
                    <el-table-column type="index" label="#" width="60" />
                    <el-table-column prop="group_name" label="小组名称" />
                    <el-table-column prop="member_count" label="成员数" />
                    <el-table-column prop="total_points" label="总积分" sortable>
                      <template #default="scope">
                        <el-tag :type="scope.row.total_points > 0 ? 'success' : 'danger'">
                          {{ scope.row.total_points }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="total_reward_points" label="奖励积分" />
                    <el-table-column prop="total_penalty_points" label="惩罚积分" />
                    <el-table-column prop="reward_count" label="奖励次数" />
                    <el-table-column prop="penalty_count" label="惩罚次数" />
                    <el-table-column label="操作" width="150">
                      <template #default="scope">
                        <el-button 
                          size="small" 
                          type="primary" 
                          @click="showGroupPoints(scope.row.group_id)"
                        >
                          详情
                        </el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </el-tab-pane>
              </el-tabs>
            </el-card>
          </el-tab-pane>
          
          <el-tab-pane label="积分记录" name="records">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>积分记录</span>
                  <div class="card-header-actions">
                    <el-select 
                      v-model="recordFilter.class_id" 
                      placeholder="选择班级" 
                      clearable
                      style="width: 150px; margin-right: 10px;"
                    >
                      <el-option
                        v-for="cls in classes"
                        :key="cls.id"
                        :label="`${cls.grade}${cls.class_number}班`"
                        :value="cls.id"
                      />
                    </el-select>
                    <el-select 
                      v-model="recordFilter.student_id" 
                      placeholder="选择学生" 
                      clearable
                      style="width: 150px; margin-right: 10px;"
                    >
                      <el-option
                        v-for="student in filteredStudents"
                        :key="student.id"
                        :label="student.name"
                        :value="student.id"
                      />
                    </el-select>
                    <el-select 
                      v-model="recordFilter.type" 
                      placeholder="积分类型" 
                      clearable
                      style="width: 120px; margin-right: 10px;"
                    >
                      <el-option label="奖励" value="reward" />
                      <el-option label="惩罚" value="penalty" />
                    </el-select>
                    <el-date-picker
                      v-model="recordDateRange"
                      type="daterange"
                      range-separator="至"
                      start-placeholder="开始日期"
                      end-placeholder="结束日期"
                      style="width: 220px; margin-right: 10px;"
                    />
                    <el-button type="primary" @click="loadPoints">
                      查询
                    </el-button>
                  </div>
                </div>
              </template>
              
              <el-table 
                :data="points" 
                style="width: 100%" 
                v-loading="loading"
              >
                <el-table-column prop="student_name" label="学生姓名" />
                <el-table-column prop="group_name" label="小组名称" />
                <el-table-column prop="class_name" label="班级" />
                <el-table-column prop="points" label="积分值" sortable>
                  <template #default="scope">
                    <el-tag :type="scope.row.points > 0 ? 'success' : 'danger'">
                      {{ scope.row.points > 0 ? '+' : '' }}{{ scope.row.points }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="type" label="类型">
                  <template #default="scope">
                    <el-tag :type="scope.row.type === 'reward' ? 'success' : 'danger'">
                      {{ scope.row.type === 'reward' ? '奖励' : '惩罚' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="reason" label="原因" />
                <el-table-column prop="given_date" label="日期" />
                <el-table-column label="操作" width="100">
                  <template #default="scope">
                    <el-button 
                      size="small" 
                      type="danger" 
                      @click="deletePoint(scope.row.id)"
                    >
                      删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
              
              <el-pagination
                v-model:current-page="pointsPage"
                v-model:page-size="pointsPageSize"
                :page-sizes="[10, 20, 50, 100]"
                :total="pointsTotal"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="handlePointsSizeChange"
                @current-change="handlePointsCurrentChange"
                style="margin-top: 20px; justify-content: flex-end;"
              />
            </el-card>
          </el-tab-pane>
          
          <el-tab-pane label="积分规则" name="rules">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>积分规则配置</span>
                  <div class="card-header-actions">
                    <el-select 
                      v-model="ruleClassId" 
                      placeholder="选择班级" 
                      @change="loadPointRules"
                      style="width: 200px; margin-right: 10px;"
                    >
                      <el-option
                        v-for="cls in classes"
                        :key="cls.id"
                        :label="`${cls.grade}${cls.class_number}班 - ${cls.name}`"
                        :value="cls.id"
                      />
                    </el-select>
                    <el-button type="primary" @click="addPointRule">
                      添加规则
                    </el-button>
                    <el-button type="success" @click="savePointRules">
                      保存规则
                    </el-button>
                  </div>
                </div>
              </template>
              
              <el-table :data="pointRules" style="width: 100%">
                <el-table-column prop="name" label="规则名称" />
                <el-table-column prop="points" label="积分值">
                  <template #default="scope">
                    <el-input-number 
                      v-model="scope.row.points" 
                      :min="-100" 
                      :max="100" 
                      size="small"
                    />
                  </template>
                </el-table-column>
                <el-table-column prop="type" label="类型">
                  <template #default="scope">
                    <el-select v-model="scope.row.type" size="small">
                      <el-option label="奖励" value="reward" />
                      <el-option label="惩罚" value="penalty" />
                    </el-select>
                  </template>
                </el-table-column>
                <el-table-column label="启用">
                  <template #default="scope">
                    <el-switch v-model="scope.row.enabled" />
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="100">
                  <template #default="scope">
                    <el-button 
                      size="small" 
                      type="danger" 
                      @click="removePointRule(scope.$index)"
                    >
                      删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-tab-pane>
          
          <el-tab-pane label="小组管理" name="groups">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>小组管理</span>
                  <div class="card-header-actions">
                    <el-select 
                      v-model="groupClassId" 
                      placeholder="选择班级" 
                      @change="loadGroups"
                      style="width: 200px; margin-right: 10px;"
                    >
                      <el-option
                        v-for="cls in classes"
                        :key="cls.id"
                        :label="`${cls.grade}${cls.class_number}班 - ${cls.name}`"
                        :value="cls.id"
                      />
                    </el-select>
                    <el-button type="primary" @click="showCreateGroupDialog = true">
                      创建小组
                    </el-button>
                  </div>
                </div>
              </template>
              
              <el-row :gutter="20">
                <el-col :span="8">
                  <el-card class="group-list-card">
                    <div slot="header">
                      <span>小组列表</span>
                    </div>
                    <el-table 
                      :data="groups" 
                      style="width: 100%"
                      highlight-current-row
                      @current-change="handleGroupSelect"
                    >
                      <el-table-column prop="name" label="小组名称" />
                      <el-table-column prop="member_count" label="成员数" width="80" />
                      <el-table-column label="操作" width="120">
                        <template #default="scope">
                          <el-button 
                            size="small" 
                            type="danger" 
                            @click="deleteGroup(scope.row.id)"
                          >
                            删除
                          </el-button>
                        </template>
                      </el-table-column>
                    </el-table>
                  </el-card>
                </el-col>
                
                <el-col :span="16">
                  <el-card class="group-detail-card" v-if="currentGroup">
                    <div slot="header">
                      <span>{{ currentGroup.name }}</span>
                      <el-button 
                        style="float: right; padding: 3px 0" 
                        type="text"
                        @click="showAddMemberDialog = true"
                      >
                        添加成员
                      </el-button>
                    </div>
                    <el-table :data="currentGroup.members" style="width: 100%">
                      <el-table-column prop="student_name" label="学生姓名" />
                      <el-table-column label="操作" width="100">
                        <template #default="scope">
                          <el-button 
                            size="small" 
                            type="danger" 
                            @click="removeGroupMember(scope.row.student_id)"
                          >
                            移除
                          </el-button>
                        </template>
                      </el-table-column>
                    </el-table>
                  </el-card>
                  
                  <el-card class="group-detail-card" v-else>
                    <el-empty description="请选择一个小组查看详情" />
                  </el-card>
                </el-col>
              </el-row>
            </el-card>
          </el-tab-pane>
          
          <!-- 新增座位图积分标签页 -->
          <el-tab-pane label="座位图积分" name="seating-point">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>座位图积分操作</span>
                  <div class="card-header-actions">
                    <el-select 
                      v-model="seatingPointClassId" 
                      placeholder="选择班级" 
                      @change="loadSeatingArrangementForPoint"
                      style="width: 200px; margin-right: 10px;"
                    >
                      <el-option
                        v-for="cls in classes"
                        :key="cls.id"
                        :label="`${cls.grade}${cls.class_number}班 - ${cls.name}`"
                        :value="cls.id"
                      />
                    </el-select>
                  </div>
                </div>
              </template>
              
              <SeatingPoint 
                :arrangement="seatingArrangementForPoint" 
                :loading="loading"
                @add-point="handleAddPointFromSeating"
              />
            </el-card>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
    
    <!-- 添加积分记录对话框 -->
    <el-dialog v-model="showAddPointDialog" title="添加积分记录" width="800px">
      <el-form :model="newPoint" label-width="80px">
        <el-form-item label="班级">
          <el-select 
            v-model="newPoint.class_id" 
            placeholder="选择班级" 
            @change="onClassChange"
            style="width: 100%"
          >
            <el-option
              v-for="cls in classes"
              :key="cls.id"
              :label="`${cls.grade}${cls.class_number}班 - ${cls.name}`"
              :value="cls.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="积分对象">
          <el-radio-group v-model="pointTargetType" @change="onPointTargetTypeChange">
            <el-radio label="student">学生</el-radio>
            <el-radio label="group">小组</el-radio>
            <el-radio label="seat">座位图选择</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <!-- 学生选择 -->
        <el-form-item label="学生" v-if="pointTargetType === 'student'">
          <el-select 
            v-model="newPoint.student_id" 
            placeholder="选择学生" 
            style="width: 100%"
          >
            <el-option
              v-for="student in classStudents"
              :key="student.id"
              :label="student.name"
              :value="student.id"
            />
          </el-select>
        </el-form-item>
        
        <!-- 小组选择 -->
        <el-form-item label="小组" v-if="pointTargetType === 'group'">
          <el-select 
            v-model="newPoint.group_id" 
            placeholder="选择小组" 
            style="width: 100%"
          >
            <el-option
              v-for="group in classGroups"
              :key="group.id"
              :label="group.name"
              :value="group.id"
            />
          </el-select>
        </el-form-item>
        
        <!-- 座位图选择 -->
        <div v-if="pointTargetType === 'seat'">
          <el-form-item label="座位图">
            <div class="seating-map-container">
              <div v-if="seatingArrangement" class="seating-map">
                <div 
                  v-for="(row, rowIndex) in seatingArrangement.layout.seats" 
                  :key="rowIndex" 
                  class="seat-row"
                >
                  <div
                    v-for="(seat, colIndex) in row"
                    :key="colIndex"
                    :class="[
                      'seat',
                      seat.type === 'seat' ? 'seat-available' : 'seat-unavailable',
                      selectedSeats.has(`${rowIndex + 1}-${colIndex + 1}`) ? 'seat-selected' : ''
                    ]"
                    @click="toggleSeatSelection(rowIndex + 1, colIndex + 1, seat)"
                  >
                    <div v-if="seat.type === 'seat'" class="seat-content">
                      <div class="seat-number">{{ getSeatNumber(rowIndex, colIndex) }}</div>
                      <div v-if="seat.student_name" class="seat-student">
                        {{ seat.student_name }}
                      </div>
                      <div v-else class="seat-empty">空</div>
                    </div>
                    <div v-else-if="seat.type === 'aisle'" class="aisle-content">
                      过道
                    </div>
                    <div v-else-if="seat.type === 'podium'" class="podium-content">
                      讲台
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="seating-map-empty">
                <el-empty description="暂无座位数据" />
              </div>
            </div>
          </el-form-item>
          
          <el-form-item label="选中学生">
            <el-tag
              v-for="student in selectedStudentsFromSeats"
              :key="student.id"
              closable
              @close="removeSelectedStudent(student.id)"
              style="margin-right: 10px; margin-bottom: 10px;"
            >
              {{ student.name }}
            </el-tag>
          </el-form-item>
        </div>
        
        <el-form-item label="积分类型">
          <el-radio-group v-model="newPoint.type">
            <el-radio label="reward">奖励</el-radio>
            <el-radio label="penalty">惩罚</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="积分值">
          <el-input-number 
            v-model="newPoint.points" 
            :min="1" 
            :max="100" 
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="原因">
          <el-input 
            v-model="newPoint.reason" 
            type="textarea" 
            placeholder="请输入积分原因"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddPointDialog = false">取消</el-button>
          <el-button type="primary" @click="addPoint">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 创建小组对话框 -->
    <el-dialog v-model="showCreateGroupDialog" title="创建小组" width="500px">
      <el-form :model="newGroup" label-width="80px">
        <el-form-item label="小组名称">
          <el-input v-model="newGroup.name" placeholder="请输入小组名称" />
        </el-form-item>
        
        <el-form-item label="班级">
          <el-select 
            v-model="newGroup.class_id" 
            placeholder="选择班级" 
            style="width: 100%"
          >
            <el-option
              v-for="cls in classes"
              :key="cls.id"
              :label="`${cls.grade}${cls.class_number}班 - ${cls.name}`"
              :value="cls.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="描述">
          <el-input 
            v-model="newGroup.description" 
            type="textarea" 
            placeholder="请输入小组描述（可选）"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateGroupDialog = false">取消</el-button>
          <el-button type="primary" @click="createGroup">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 添加小组成员对话框 -->
    <el-dialog v-model="showAddMemberDialog" title="添加小组成员" width="500px">
      <el-select 
        v-model="selectedStudentForGroup" 
        placeholder="选择学生" 
        style="width: 100%"
        filterable
      >
        <el-option
          v-for="student in classStudents"
          :key="student.id"
          :label="student.name"
          :value="student.id"
        />
      </el-select>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddMemberDialog = false">取消</el-button>
          <el-button type="primary" @click="addGroupMember">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </Layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import Layout from './Layout.vue'
import SeatingPoint from '../components/SeatingPoint.vue'
import { usePointStore } from '../stores/point'
import { useStudentStore } from '../stores/student'
import { useGroupStore } from '../stores/group'
import { useSeatingStore } from '../stores/seating'
import type { PointFormData, PointRule } from '../types/point'
import type { GroupFormData } from '../types/group'

// 状态管理
const pointStore = usePointStore()
const studentStore = useStudentStore()
const groupStore = useGroupStore()
const seatingStore = useSeatingStore()

// 响应式数据
const activeTab = ref('ranking')
const rankingTab = ref('student')
const showAddPointDialog = ref(false)
const showCreateGroupDialog = ref(false)
const showAddMemberDialog = ref(false)
const selectedClassId = ref<number | null>(null)
const ruleClassId = ref<number | null>(null)
const groupClassId = ref<number | null>(null)
const seatingPointClassId = ref<number | null>(null)

// 积分对象类型
const pointTargetType = ref<'student' | 'group' | 'seat'>('student')

// 表单数据
const newPoint = ref<PointFormData>({
  student_id: undefined,
  group_id: undefined,
  class_id: 0,
  points: 1,
  type: 'reward',
  reason: ''
})

const newGroup = ref<GroupFormData>({
  name: '',
  class_id: 0,
  description: ''
})

// 座位图选择相关
const selectedSeats = ref<Set<string>>(new Set())
const seatingArrangement = ref<any>(null)
const seatingArrangementForPoint = ref<any>(null)

// 小组管理相关
const selectedStudentForGroup = ref<number | null>(null)

// 记录筛选
const recordFilter = ref({
  class_id: null,
  student_id: null,
  type: null
})

const recordDateRange = ref<[Date, Date] | null>(null)

// 分页
const pointsPage = ref(1)
const pointsPageSize = ref(20)

// 规则编辑
const editingRules = ref<PointRule[]>([])

// 计算属性
const classes = computed(() => {
  return studentStore.classes || []
})

const studentPoints = computed(() => {
  return pointStore.studentPoints || []
})

const groupPoints = computed(() => {
  return pointStore.groupPoints || []
})

const points = computed(() => {
  return pointStore.points || []
})

const pointsTotal = computed(() => {
  return pointStore.total || 0
})

const pointRules = computed({
  get: () => editingRules.value,
  set: (value) => {
    editingRules.value = value
  }
})

const loading = computed(() => {
  return pointStore.loading || studentStore.loading || groupStore.loading || seatingStore.loading
})

const classStudents = computed(() => {
  return studentStore.students.filter(s => s.class_id === newPoint.value.class_id)
})

const classGroups = computed(() => {
  return groupStore.groups.filter(g => g.class_id === newPoint.value.class_id)
})

const groups = computed(() => {
  return groupStore.groups || []
})

const currentGroup = computed(() => {
  return groupStore.currentGroup
})

const filteredStudents = computed(() => {
  if (!recordFilter.value.class_id) return []
  return studentStore.students.filter(s => s.class_id === recordFilter.value.class_id)
})

// 座位图相关计算属性
const selectedStudentsFromSeats = computed(() => {
  if (!seatingArrangement.value) return []
  
  const students: any[] = []
  selectedSeats.value.forEach(seatKey => {
    const [row, col] = seatKey.split('-').map(Number)
    const seat = seatingArrangement.value.layout.seats[row - 1][col - 1]
    if (seat && seat.student_id && seat.student_name) {
      students.push({
        id: seat.student_id,
        name: seat.student_name
      })
    }
  })
  
  return students
})

// 方法
const loadClasses = async () => {
  await studentStore.fetchClasses()
}

const loadStudentPoints = async () => {
  if (selectedClassId.value) {
    await pointStore.fetchStudentPointsSummary(selectedClassId.value)
    await pointStore.fetchGroupPointsSummary(selectedClassId.value)
  }
}

const loadPoints = async () => {
  const params: any = {
    page: pointsPage.value,
    page_size: pointsPageSize.value
  }
  
  if (recordFilter.value.class_id) {
    params.class_id = recordFilter.value.class_id
  }
  
  if (recordFilter.value.student_id) {
    params.student_id = recordFilter.value.student_id
  }
  
  if (recordFilter.value.type) {
    params.type = recordFilter.value.type
  }
  
  if (recordDateRange.value && recordDateRange.value.length === 2) {
    params.start_date = recordDateRange.value[0].toISOString().split('T')[0]
    params.end_date = recordDateRange.value[1].toISOString().split('T')[0]
  }
  
  await pointStore.fetchPoints(params)
}

const loadPointRules = async () => {
  if (ruleClassId.value) {
    await pointStore.fetchPointRules(ruleClassId.value)
    editingRules.value = JSON.parse(JSON.stringify(pointStore.pointRules))
  }
}

const loadGroups = async () => {
  if (groupClassId.value) {
    await groupStore.fetchGroups(groupClassId.value)
  }
}

const loadSeatingArrangement = async (classId: number) => {
  const result = await seatingStore.getSeatingArrangement(classId)
  if (result.success) {
    seatingArrangement.value = result.data
  }
}

// 为座位图积分加载座位安排
const loadSeatingArrangementForPoint = async (classId: number) => {
  const result = await seatingStore.getSeatingArrangement(classId)
  if (result.success) {
    seatingArrangementForPoint.value = result.data
  }
}

const savePointRules = async () => {
  if (ruleClassId.value) {
    const result = await pointStore.updatePointRules(ruleClassId.value, editingRules.value)
    if (result.success) {
      ElMessage.success('积分规则保存成功')
    } else {
      ElMessage.error('积分规则保存失败: ' + result.error)
    }
  }
}

const addPointRule = () => {
  editingRules.value.push({
    id: Date.now(),
    name: '',
    points: 1,
    type: 'reward',
    enabled: true
  })
}

const removePointRule = (index: number) => {
  editingRules.value.splice(index, 1)
}

// 从座位图添加积分
const handleAddPointFromSeating = async (data: { student_id: number; points: number; type: string; reason: string }) => {
  const pointData: PointFormData = {
    student_id: data.student_id,
    class_id: seatingPointClassId.value || 0,
    points: data.points,
    type: data.type as 'reward' | 'penalty',
    reason: data.reason
  }
  
  const result = await pointStore.createPoint(pointData)
  if (result.success) {
    ElMessage.success('积分记录添加成功')
    // 刷新数据
    if (activeTab.value === 'ranking' && selectedClassId.value) {
      loadStudentPoints()
    } else if (activeTab.value === 'records') {
      loadPoints()
    }
  } else {
    ElMessage.error('积分记录添加失败: ' + result.error)
  }
}

const addPoint = async () => {
  if (!newPoint.value.class_id) {
    ElMessage.warning('请选择班级')
    return
  }
  
  // 根据积分对象类型设置相应的ID
  if (pointTargetType.value === 'student' && !newPoint.value.student_id) {
    ElMessage.warning('请选择学生')
    return
  }
  
  if (pointTargetType.value === 'group' && !newPoint.value.group_id) {
    ElMessage.warning('请选择小组')
    return
  }
  
  if (pointTargetType.value === 'seat' && selectedStudentsFromSeats.value.length === 0) {
    ElMessage.warning('请通过座位图选择至少一个学生')
    return
  }
  
  if (!newPoint.value.reason) {
    ElMessage.warning('请输入积分原因')
    return
  }
  
  // 如果是座位图选择，需要为每个选中的学生创建积分记录
  if (pointTargetType.value === 'seat' && selectedStudentsFromSeats.value.length > 0) {
    let successCount = 0
    let failCount = 0
    
    for (const student of selectedStudentsFromSeats.value) {
      const pointData = {
        ...newPoint.value,
        student_id: student.id,
        group_id: undefined
      }
      
      const result = await pointStore.createPoint(pointData)
      if (result.success) {
        successCount++
      } else {
        failCount++
        ElMessage.error(`为学生${student.name}添加积分失败: ${result.error}`)
      }
    }
    
    ElMessage.success(`成功为${successCount}个学生添加积分${failCount > 0 ? `，${failCount}个失败` : ''}`)
    showAddPointDialog.value = false
    resetPointForm()
    
    // 刷新数据
    if (activeTab.value === 'ranking' && selectedClassId.value) {
      loadStudentPoints()
    } else if (activeTab.value === 'records') {
      loadPoints()
    }
  } else {
    // 单个积分记录
    const result = await pointStore.createPoint(newPoint.value)
    if (result.success) {
      ElMessage.success('积分记录添加成功')
      showAddPointDialog.value = false
      resetPointForm()
      
      // 刷新数据
      if (activeTab.value === 'ranking' && selectedClassId.value) {
        loadStudentPoints()
      } else if (activeTab.value === 'records') {
        loadPoints()
      }
    } else {
      ElMessage.error('积分记录添加失败: ' + result.error)
    }
  }
}

const resetPointForm = () => {
  newPoint.value = {
    student_id: undefined,
    group_id: undefined,
    class_id: 0,
    points: 1,
    type: 'reward',
    reason: ''
  }
  pointTargetType.value = 'student'
  selectedSeats.value.clear()
}

const deletePoint = async (id: number) => {
  ElMessageBox.confirm('确定要删除这条积分记录吗？', '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    const result = await pointStore.deletePoint(id)
    if (result.success) {
      ElMessage.success('积分记录删除成功')
      // 刷新数据
      if (activeTab.value === 'ranking' && selectedClassId.value) {
        loadStudentPoints()
      } else if (activeTab.value === 'records') {
        loadPoints()
      }
    } else {
      ElMessage.error('积分记录删除失败: ' + result.error)
    }
  }).catch(() => {
    // 用户取消删除
  })
}

const showStudentPoints = (studentId: number) => {
  ElMessage.info('查看学生积分详情功能待实现')
}

const showGroupPoints = (groupId: number) => {
  ElMessage.info('查看小组积分详情功能待实现')
}

const onClassChange = async () => {
  newPoint.value.student_id = undefined
  newPoint.value.group_id = undefined
  selectedSeats.value.clear()
  
  // 如果是座位图选择模式，加载座位图
  if (pointTargetType.value === 'seat' && newPoint.value.class_id) {
    await loadSeatingArrangement(newPoint.value.class_id)
  }
}

const onPointTargetTypeChange = async () => {
  // 切换到座位图选择时，加载座位图
  if (pointTargetType.value === 'seat' && newPoint.value.class_id) {
    await loadSeatingArrangement(newPoint.value.class_id)
  }
}

const toggleSeatSelection = (row: number, col: number, seat: any) => {
  if (seat.type !== 'seat' || !seat.student_name) return
  
  const seatKey = `${row}-${col}`
  if (selectedSeats.value.has(seatKey)) {
    selectedSeats.value.delete(seatKey)
  } else {
    selectedSeats.value.add(seatKey)
  }
}

const removeSelectedStudent = (studentId: number) => {
  // 从座位选择中移除学生
  if (!seatingArrangement.value) return
  
  for (let r = 0; r < seatingArrangement.value.layout.seats.length; r++) {
    const row = seatingArrangement.value.layout.seats[r]
    for (let c = 0; c < row.length; c++) {
      const seat = row[c]
      if (seat.student_id === studentId) {
        selectedSeats.value.delete(`${r + 1}-${c + 1}`)
        return
      }
    }
  }
}

const getSeatNumber = (rowIndex: number, colIndex: number) => {
  if (!seatingArrangement.value) return `${rowIndex + 1}-${colIndex + 1}`
  // 这里可以使用与排位管理相同的座位编号逻辑
  return `${rowIndex + 1}-${colIndex + 1}`
}

const handlePointsSizeChange = (val: number) => {
  pointsPageSize.value = val
  loadPoints()
}

const handlePointsCurrentChange = (val: number) => {
  pointsPage.value = val
  loadPoints()
}

// 小组管理方法
const createGroup = async () => {
  if (!newGroup.value.name) {
    ElMessage.warning('请输入小组名称')
    return
  }
  
  if (!newGroup.value.class_id) {
    ElMessage.warning('请选择班级')
    return
  }
  
  const result = await groupStore.createGroup(newGroup.value)
  if (result.success) {
    ElMessage.success('小组创建成功')
    showCreateGroupDialog.value = false
    newGroup.value = {
      name: '',
      class_id: 0,
      description: ''
    }
    
    // 刷新小组列表
    if (groupClassId.value) {
      loadGroups()
    }
  } else {
    ElMessage.error('小组创建失败: ' + result.error)
  }
}

const handleGroupSelect = async (group: any) => {
  if (group) {
    await groupStore.fetchGroupById(group.id)
  }
}

const deleteGroup = async (id: number) => {
  ElMessageBox.confirm('确定要删除这个小组吗？', '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    if (groupClassId.value) {
      const result = await groupStore.deleteGroup(id, groupClassId.value)
      if (result.success) {
        ElMessage.success('小组删除成功')
        // 刷新小组列表
        loadGroups()
      } else {
        ElMessage.error('小组删除失败: ' + result.error)
      }
    }
  }).catch(() => {
    // 用户取消删除
  })
}

const addGroupMember = async () => {
  if (!selectedStudentForGroup.value) {
    ElMessage.warning('请选择学生')
    return
  }
  
  if (!currentGroup.value) {
    ElMessage.warning('请先选择一个小组')
    return
  }
  
  const result = await groupStore.addGroupMember(currentGroup.value.id, selectedStudentForGroup.value)
  if (result.success) {
    ElMessage.success('小组成员添加成功')
    showAddMemberDialog.value = false
    selectedStudentForGroup.value = null
  } else {
    ElMessage.error('小组成员添加失败: ' + result.error)
  }
}

const removeGroupMember = async (student_id: number) => {
  if (!currentGroup.value) {
    ElMessage.warning('请先选择一个小组')
    return
  }
  
  const result = await groupStore.removeGroupMember(currentGroup.value.id, student_id)
  if (result.success) {
    ElMessage.success('小组成员移除成功')
  } else {
    ElMessage.error('小组成员移除失败: ' + result.error)
  }
}

// 生命周期
onMounted(async () => {
  await loadClasses()
  // 默认选择第一个班级
  if (classes.value.length > 0) {
    selectedClassId.value = classes.value[0].id
    ruleClassId.value = classes.value[0].id
    groupClassId.value = classes.value[0].id
    seatingPointClassId.value = classes.value[0].id
    newPoint.value.class_id = classes.value[0].id
    newGroup.value.class_id = classes.value[0].id
    loadStudentPoints()
    loadPointRules()
    loadGroups()
    loadSeatingArrangementForPoint(classes.value[0].id)
  }
})
</script>

<style scoped>
.points-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  padding: 24px;
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
  color: white;
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
  padding: 20px;
  background: #f5f7fa;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header-actions {
  display: flex;
  align-items: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 座位图样式 */
.seating-map-container {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 20px;
  background: #fff;
}

.seating-map {
  display: inline-block;
  padding: 10px;
}

.seat-row {
  display: flex;
  margin-bottom: 5px;
}

.seat {
  width: 80px;
  height: 80px;
  margin: 2px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.seat-available {
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
}

.seat-unavailable {
  background: #f0f2f5;
  border: 1px solid #e4e7ed;
  cursor: not-allowed;
}

.seat-selected {
  background: #409eff;
  color: white;
  border-color: #409eff;
}

.seat-content {
  text-align: center;
  width: 100%;
}

.seat-number {
  font-size: 12px;
  font-weight: bold;
}

.seat-student {
  font-size: 12px;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.seat-empty {
  font-size: 12px;
  color: #909399;
}

.aisle-content, .podium-content {
  font-size: 12px;
  color: #909399;
}

.seating-map-empty {
  text-align: center;
  padding: 40px 0;
}

.group-list-card, .group-detail-card {
  height: 100%;
}
</style>