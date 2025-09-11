<template>
  <div class="exchange-management">
    <!-- 搜索和筛选 -->
    <div class="search-filters">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-select
            v-model="selectedClass"
            placeholder="选择班级"
            clearable
            @change="handleClassChange"
          >
            <el-option label="全部班级" value="" />
            <el-option
              v-for="cls in classes"
              :key="cls.id"
              :label="cls.name"
              :value="cls.id"
            />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select
            v-model="selectedStatus"
            placeholder="兑换状态"
            @change="handleStatusChange"
          >
            <el-option label="全部状态" value="" />
            <el-option label="待审批" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="handleDateChange"
          />
        </el-col>
        <el-col :span="4">
          <el-button @click="refreshData">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </el-col>
        <el-col :span="4">
          <el-button type="primary" @click="batchApprove">
            <el-icon><Check /></el-icon>
            批量审批
          </el-button>
        </el-col>
      </el-row>
    </div>

    <!-- 兑换记录表格 -->
    <div class="exchange-table">
      <el-table
        v-loading="loading"
        :data="exchanges"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column prop="id" label="兑换ID" width="80" />
        
        <el-table-column label="商品信息" min-width="200">
          <template #default="{ row }">
            <div class="item-info">
              <div class="item-image">
                <img
                  v-if="row.item_image_url"
                  :src="row.item_image_url"
                  :alt="row.item_name"
                />
                <div v-else class="no-image">
                  <el-icon><Picture /></el-icon>
                </div>
              </div>
              <div class="item-details">
                <div class="item-name">{{ row.item_name }}</div>
                <div class="item-meta">
                  数量: {{ row.quantity }} | 单价: {{ row.points_cost / row.quantity }}积分
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="student_name" label="学生" width="100" />
        
        <el-table-column prop="points_cost" label="消耗积分" width="100">
          <template #default="{ row }">
            <span class="points-cost">{{ row.points_cost }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="getStatusType(row.status)"
              size="small"
            >
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="created_at" label="兑换时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="approved_at" label="审批时间" width="160">
          <template #default="{ row }">
            {{ row.approved_at ? formatDateTime(row.approved_at) : '-' }}
          </template>
        </el-table-column>
        
        <el-table-column label="备注" min-width="150">
          <template #default="{ row }">
            {{ row.notes || '-' }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button
                v-if="row.status === 'pending'"
                size="small"
                type="success"
                @click="approveExchange(row, true)"
              >
                <el-icon><Check /></el-icon>
                通过
              </el-button>
              <el-button
                v-if="row.status === 'pending'"
                size="small"
                type="danger"
                @click="approveExchange(row, false)"
              >
                <el-icon><Close /></el-icon>
                拒绝
              </el-button>
              <el-button
                size="small"
                @click="viewDetails(row)"
              >
                <el-icon><View /></el-icon>
                详情
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination-wrapper" v-if="pagination.total > 0">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 兑换详情对话框 -->
    <el-dialog
      v-model="showDetailsDialog"
      title="兑换详情"
      width="600px"
    >
      <div v-if="selectedExchange" class="exchange-details">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="兑换ID">
            {{ selectedExchange.id }}
          </el-descriptions-item>
          <el-descriptions-item label="学生姓名">
            {{ selectedExchange.student_name }}
          </el-descriptions-item>
          <el-descriptions-item label="商品名称">
            {{ selectedExchange.item_name }}
          </el-descriptions-item>
          <el-descriptions-item label="兑换数量">
            {{ selectedExchange.quantity }}
          </el-descriptions-item>
          <el-descriptions-item label="消耗积分">
            <span class="points-cost">{{ selectedExchange.points_cost }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="兑换状态">
            <el-tag :type="getStatusType(selectedExchange.status)">
              {{ getStatusText(selectedExchange.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="兑换时间">
            {{ formatDateTime(selectedExchange.created_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="审批时间">
            {{ selectedExchange.approved_at ? formatDateTime(selectedExchange.approved_at) : '未审批' }}
          </el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">
            {{ selectedExchange.notes || '无' }}
          </el-descriptions-item>
        </el-descriptions>
        
        <div class="exchange-actions" v-if="selectedExchange.status === 'pending'">
          <el-button
            type="success"
            @click="approveExchange(selectedExchange, true)"
          >
            <el-icon><Check /></el-icon>
            通过申请
          </el-button>
          <el-button
            type="danger"
            @click="approveExchange(selectedExchange, false)"
          >
            <el-icon><Close /></el-icon>
            拒绝申请
          </el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 批量审批对话框 -->
    <el-dialog
      v-model="showBatchDialog"
      title="批量审批"
      width="500px"
    >
      <div class="batch-approve">
        <p>已选择 {{ selectedExchanges.length }} 条兑换记录</p>
        <el-form :model="batchForm" label-width="80px">
          <el-form-item label="审批结果">
            <el-radio-group v-model="batchForm.approved">
              <el-radio :label="true">通过</el-radio>
              <el-radio :label="false">拒绝</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="备注">
            <el-input
              v-model="batchForm.notes"
              type="textarea"
              :rows="3"
              placeholder="请输入审批备注"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showBatchDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmBatchApprove">
          确认审批
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useShopStore } from '../../stores/shop'
import { useClassStore } from '../../stores/class'
import type { ShopExchange } from '../../types/shop'
import {
  Refresh,
  Check,
  Close,
  View,
  Picture
} from '@element-plus/icons-vue'

const shopStore = useShopStore()
const classStore = useClassStore()

// 响应式数据
const selectedClass = ref('')
const selectedStatus = ref('')
const dateRange = ref<[string, string] | null>(null)
const selectedExchanges = ref<ShopExchange[]>([])
const showDetailsDialog = ref(false)
const showBatchDialog = ref(false)
const selectedExchange = ref<ShopExchange | null>(null)
const batchForm = ref({
  approved: true,
  notes: ''
})

// 计算属性
const exchanges = computed(() => shopStore.exchanges)
const classes = computed(() => classStore.classes)
const loading = computed(() => shopStore.loading)
const pagination = computed(() => shopStore.exchangePagination)

// 获取兑换记录
const fetchExchanges = () => {
  const params = {
    class_id: selectedClass.value ? Number(selectedClass.value) : undefined,
    status: selectedStatus.value || undefined,
    start_date: dateRange.value?.[0],
    end_date: dateRange.value?.[1],
    page: pagination.value.page,
    page_size: pagination.value.pageSize
  }
  shopStore.fetchExchanges(params)
}

// 刷新数据
const refreshData = () => {
  fetchExchanges()
}

// 班级筛选
const handleClassChange = () => {
  fetchExchanges()
}

// 状态筛选
const handleStatusChange = () => {
  fetchExchanges()
}

// 日期筛选
const handleDateChange = () => {
  fetchExchanges()
}

// 选择变化
const handleSelectionChange = (selection: ShopExchange[]) => {
  selectedExchanges.value = selection
}

// 审批兑换
const approveExchange = async (exchange: ShopExchange, approved: boolean) => {
  try {
    let notes = ''
    if (!approved) {
      const { value } = await ElMessageBox.prompt(
        '请输入拒绝原因：',
        '拒绝兑换',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputType: 'textarea'
        }
      )
      notes = value || ''
    }
    
    await shopStore.approveExchange(exchange.id, approved, notes)
    ElMessage.success(`兑换${approved ? '通过' : '拒绝'}成功`)
    
    if (showDetailsDialog.value) {
      showDetailsDialog.value = false
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

// 查看详情
const viewDetails = (exchange: ShopExchange) => {
  selectedExchange.value = exchange
  showDetailsDialog.value = true
}

// 批量审批
const batchApprove = () => {
  if (selectedExchanges.value.length === 0) {
    ElMessage.warning('请先选择要审批的兑换记录')
    return
  }
  
  const pendingExchanges = selectedExchanges.value.filter(e => e.status === 'pending')
  if (pendingExchanges.length === 0) {
    ElMessage.warning('所选记录中没有待审批的兑换')
    return
  }
  
  selectedExchanges.value = pendingExchanges
  showBatchDialog.value = true
}

// 确认批量审批
const confirmBatchApprove = async () => {
  try {
    const promises = selectedExchanges.value.map(exchange =>
      shopStore.approveExchange(exchange.id, batchForm.value.approved, batchForm.value.notes)
    )
    
    await Promise.all(promises)
    ElMessage.success(`批量${batchForm.value.approved ? '通过' : '拒绝'}成功`)
    
    showBatchDialog.value = false
    batchForm.value = { approved: true, notes: '' }
    selectedExchanges.value = []
  } catch (error) {
    ElMessage.error('批量审批失败')
  }
}

// 分页处理
const handleSizeChange = (size: number) => {
  shopStore.exchangePagination.pageSize = size
  shopStore.exchangePagination.page = 1
  fetchExchanges()
}

const handlePageChange = (page: number) => {
  shopStore.exchangePagination.page = page
  fetchExchanges()
}

// 获取状态类型
const getStatusType = (status: string) => {
  switch (status) {
    case 'pending': return 'warning'
    case 'approved': return 'success'
    case 'rejected': return 'danger'
    default: return 'info'
  }
}

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'pending': return '待审批'
    case 'approved': return '已通过'
    case 'rejected': return '已拒绝'
    default: return '未知'
  }
}

// 格式化日期时间
const formatDateTime = (dateTime: string) => {
  return new Date(dateTime).toLocaleString('zh-CN')
}

// 初始化
onMounted(() => {
  fetchExchanges()
  classStore.fetchClasses()
})
</script>

<style scoped>
.exchange-management {
  padding: 0;
}

.search-filters {
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.exchange-table {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.item-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-image {
  width: 48px;
  height: 48px;
  border-radius: 4px;
  overflow: hidden;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  font-size: 20px;
  color: #c0c4cc;
}

.item-details {
  flex: 1;
}

.item-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.item-meta {
  font-size: 12px;
  color: #909399;
}

.points-cost {
  font-weight: 600;
  color: #e6a23c;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-top: 20px;
}

.exchange-details {
  padding: 0;
}

.exchange-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.batch-approve {
  padding: 0;
}
</style>