<template>
  <div class="student-shop">
    <!-- 学生选择器 -->
    <div class="student-selector">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-select
            v-model="selectedClass"
            placeholder="选择班级"
            @change="handleClassChange"
          >
            <el-option
              v-for="cls in classes"
              :key="cls.id"
              :label="cls.name"
              :value="cls.id"
            />
          </el-select>
        </el-col>
        <el-col :span="8">
          <el-select
            v-model="selectedStudent"
            placeholder="选择学生"
            filterable
            @change="handleStudentChange"
            :disabled="!selectedClass"
          >
            <el-option
              v-for="student in students"
              :key="student.id"
              :label="student.name"
              :value="student.id"
            />
          </el-select>
        </el-col>
        <el-col :span="10">
          <div class="student-points" v-if="studentInfo">
            <span class="points-label">可用积分：</span>
            <span class="points-value">{{ studentInfo.available_points }}</span>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 学生信息卡片 -->
    <div class="student-info-card" v-if="studentInfo">
      <el-card>
        <div class="info-header">
          <h3>{{ studentInfo.student_name }} 的积分商城</h3>
        </div>
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="info-item">
              <div class="info-value">{{ studentInfo.total_points }}</div>
              <div class="info-label">总积分</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="info-item">
              <div class="info-value">{{ studentInfo.available_points }}</div>
              <div class="info-label">可用积分</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="info-item">
              <div class="info-value">{{ studentInfo.total_exchanges }}</div>
              <div class="info-label">兑换次数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="info-item">
              <div class="info-value">{{ studentInfo.pending_exchanges }}</div>
              <div class="info-label">待审批</div>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <!-- 商品分类筛选 -->
    <div class="category-filter" v-if="studentInfo">
      <el-radio-group v-model="selectedCategory" @change="handleCategoryChange">
        <el-radio-button label="">全部商品</el-radio-button>
        <el-radio-button
          v-for="category in categories"
          :key="category.id"
          :label="category.name"
        >
          {{ category.name }}
        </el-radio-button>
      </el-radio-group>
    </div>

    <!-- 商品展示 -->
    <div class="shop-items" v-if="studentInfo" v-loading="loading">
      <div class="items-grid">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="shop-item"
          :class="{ 'out-of-stock': item.stock === 0, 'unaffordable': !canAfford(item) }"
        >
          <div class="item-image">
            <img
              v-if="item.image_url"
              :src="item.image_url"
              :alt="item.name"
            />
            <div v-else class="no-image">
              <el-icon><Picture /></el-icon>
            </div>
            <div class="item-badges">
              <el-tag v-if="item.stock === 0" type="danger" size="small">
                缺货
              </el-tag>
              <el-tag v-else-if="!canAfford(item)" type="warning" size="small">
                积分不足
              </el-tag>
            </div>
          </div>
          
          <div class="item-content">
            <h4 class="item-name">{{ item.name }}</h4>
            <p class="item-description">{{ item.description || '暂无描述' }}</p>
            
            <div class="item-price">
              <span class="price-value">{{ item.price }}</span>
              <span class="price-unit">积分</span>
            </div>
            
            <div class="item-meta">
              <span class="stock-info">
                库存: {{ item.stock === -1 ? '充足' : item.stock }}
              </span>
              <span class="sold-info">
                已售: {{ item.sold_count || 0 }}
              </span>
            </div>
            
            <div class="item-actions">
              <el-button
                type="primary"
                size="small"
                :disabled="!canExchange(item)"
                @click="showExchangeDialog(item)"
              >
                <el-icon><ShoppingCart /></el-icon>
                兑换
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 最近兑换记录 -->
    <div class="recent-exchanges" v-if="studentInfo && studentInfo.recent_exchanges.length > 0">
      <el-card>
        <template #header>
          <h3>最近兑换记录</h3>
        </template>
        <el-table :data="studentInfo.recent_exchanges" size="small">
          <el-table-column prop="item_name" label="商品名称" />
          <el-table-column prop="quantity" label="数量" width="80" />
          <el-table-column prop="points_cost" label="消耗积分" width="100">
            <template #default="{ row }">
              <span class="points-cost">{{ row.points_cost }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)" size="small">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="兑换时间" width="160">
            <template #default="{ row }">
              {{ formatDateTime(row.created_at) }}
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 兑换对话框 -->
    <el-dialog
      v-model="showExchangeForm"
      title="兑换商品"
      width="500px"
      :close-on-click-modal="false"
    >
      <div v-if="exchangeItem" class="exchange-form">
        <div class="exchange-item-info">
          <div class="item-image">
            <img
              v-if="exchangeItem.image_url"
              :src="exchangeItem.image_url"
              :alt="exchangeItem.name"
            />
            <div v-else class="no-image">
              <el-icon><Picture /></el-icon>
            </div>
          </div>
          <div class="item-details">
            <h4>{{ exchangeItem.name }}</h4>
            <p>{{ exchangeItem.description }}</p>
            <div class="item-price">
              <span class="price-value">{{ exchangeItem.price }}</span>
              <span class="price-unit">积分/件</span>
            </div>
          </div>
        </div>
        
        <el-form :model="exchangeForm" label-width="80px">
          <el-form-item label="兑换数量">
            <el-input-number
              v-model="exchangeForm.quantity"
              :min="1"
              :max="getMaxQuantity(exchangeItem)"
              @change="updateTotalCost"
            />
          </el-form-item>
          <el-form-item label="总消耗">
            <span class="total-cost">{{ totalCost }} 积分</span>
          </el-form-item>
          <el-form-item label="备注">
            <el-input
              v-model="exchangeForm.notes"
              type="textarea"
              :rows="3"
              placeholder="请输入兑换备注（可选）"
            />
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <el-button @click="showExchangeForm = false">取消</el-button>
        <el-button
          type="primary"
          @click="confirmExchange"
          :loading="loading"
        >
          确认兑换
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useShopStore } from '../../stores/shop'
import { useClassStore } from '../../stores/class'
import { useStudentStore } from '../../stores/student'
import type { ShopItem } from '../../types/shop'
import { Picture, ShoppingCart } from '@element-plus/icons-vue'

const shopStore = useShopStore()
const classStore = useClassStore()
const studentStore = useStudentStore()

// 响应式数据
const selectedClass = ref<number | null>(null)
const selectedStudent = ref<number | null>(null)
const selectedCategory = ref('')
const showExchangeForm = ref(false)
const exchangeItem = ref<ShopItem | null>(null)
const exchangeForm = ref({
  quantity: 1,
  notes: ''
})

// 计算属性
const classes = computed(() => classStore.classes)
const students = computed(() => studentStore.students)
const categories = computed(() => shopStore.categories)
const items = computed(() => shopStore.activeItems)
const studentInfo = computed(() => shopStore.studentInfo)
const loading = computed(() => shopStore.loading)

// 筛选后的商品
const filteredItems = computed(() => {
  if (!selectedCategory.value) return items.value
  return items.value.filter(item => item.category === selectedCategory.value)
})

// 总消耗积分
const totalCost = computed(() => {
  if (!exchangeItem.value) return 0
  return exchangeItem.value.price * exchangeForm.value.quantity
})

// 班级变化处理
const handleClassChange = () => {
  selectedStudent.value = null
  shopStore.studentInfo = null
  if (selectedClass.value) {
    studentStore.fetchStudents({ class_id: selectedClass.value })
  }
}

// 学生变化处理
const handleStudentChange = () => {
  if (selectedStudent.value && selectedClass.value) {
    shopStore.fetchStudentInfo(selectedStudent.value, selectedClass.value)
  }
}

// 分类变化处理
const handleCategoryChange = () => {
  // 分类筛选逻辑已在计算属性中处理
}

// 检查是否能够承担
const canAfford = (item: ShopItem) => {
  if (!studentInfo.value) return false
  return studentInfo.value.available_points >= item.price
}

// 检查是否可以兑换
const canExchange = (item: ShopItem) => {
  return item.stock !== 0 && canAfford(item)
}

// 获取最大兑换数量
const getMaxQuantity = (item: ShopItem) => {
  if (!studentInfo.value) return 1
  
  const maxByPoints = Math.floor(studentInfo.value.available_points / item.price)
  const maxByStock = item.stock === -1 ? maxByPoints : Math.min(maxByPoints, item.stock)
  
  return Math.max(1, maxByStock)
}

// 显示兑换对话框
const showExchangeDialog = (item: ShopItem) => {
  exchangeItem.value = item
  exchangeForm.value = {
    quantity: 1,
    notes: ''
  }
  showExchangeForm.value = true
}

// 更新总消耗
const updateTotalCost = () => {
  // 总消耗在计算属性中自动更新
}

// 确认兑换
const confirmExchange = async () => {
  if (!exchangeItem.value || !selectedStudent.value || !selectedClass.value) {
    return
  }
  
  try {
    const exchangeData = {
      student_id: selectedStudent.value,
      item_id: exchangeItem.value.id,
      class_id: selectedClass.value,
      quantity: exchangeForm.value.quantity,
      notes: exchangeForm.value.notes
    }
    
    await shopStore.exchangeItem(exchangeData)
    ElMessage.success('兑换申请提交成功，等待审批')
    
    showExchangeForm.value = false
    
    // 刷新学生信息
    if (selectedStudent.value && selectedClass.value) {
      shopStore.fetchStudentInfo(selectedStudent.value, selectedClass.value)
    }
  } catch (error) {
    ElMessage.error('兑换失败')
  }
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
  classStore.fetchClasses()
  shopStore.fetchItems({ is_active: true })
  shopStore.fetchCategories()
})
</script>

<style scoped>
.student-shop {
  padding: 0;
}

.student-selector {
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.student-points {
  display: flex;
  align-items: center;
  height: 32px;
}

.points-label {
  font-size: 14px;
  color: #606266;
  margin-right: 8px;
}

.points-value {
  font-size: 18px;
  font-weight: 600;
  color: #e6a23c;
}

.student-info-card {
  margin-bottom: 20px;
}

.info-header h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #303133;
}

.info-item {
  text-align: center;
}

.info-value {
  font-size: 24px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 4px;
}

.info-label {
  font-size: 14px;
  color: #909399;
}

.category-filter {
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.shop-items {
  margin-bottom: 20px;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.shop-item {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
}

.shop-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.shop-item.out-of-stock,
.shop-item.unaffordable {
  opacity: 0.6;
}

.item-image {
  position: relative;
  height: 180px;
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
  font-size: 48px;
  color: #c0c4cc;
}

.item-badges {
  position: absolute;
  top: 8px;
  right: 8px;
}

.item-content {
  padding: 16px;
}

.item-name {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.item-description {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-price {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 8px;
}

.price-value {
  font-size: 20px;
  font-weight: 600;
  color: #e6a23c;
}

.price-unit {
  font-size: 12px;
  color: #909399;
}

.item-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
  margin-bottom: 16px;
}

.item-actions {
  text-align: center;
}

.recent-exchanges {
  margin-bottom: 20px;
}

.points-cost {
  font-weight: 600;
  color: #e6a23c;
}

.exchange-form {
  padding: 0;
}

.exchange-item-info {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.exchange-item-info .item-image {
  width: 80px;
  height: 80px;
  border-radius: 6px;
}

.exchange-item-info .item-details h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #303133;
}

.exchange-item-info .item-details p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #606266;
}

.total-cost {
  font-size: 16px;
  font-weight: 600;
  color: #e6a23c;
}
</style>