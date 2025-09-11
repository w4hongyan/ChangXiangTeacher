<template>
  <div class="shop-container">
    <!-- 页面头部 -->
    <div class="shop-header">
      <div class="header-left">
        <h1 class="page-title">
          <el-icon><ShoppingBag /></el-icon>
          积分商城
        </h1>
        <p class="page-description">学生可以使用积分兑换心仪的奖品</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showItemDialog = true">
          <el-icon><Plus /></el-icon>
          添加商品
        </el-button>
        <el-button @click="showCategoryDialog = true">
          <el-icon><FolderAdd /></el-icon>
          管理分类
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards" v-if="stats">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon total-items">
                <el-icon><Box /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.total_items }}</div>
                <div class="stat-label">商品总数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon active-items">
                <el-icon><ShoppingCart /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.active_items }}</div>
                <div class="stat-label">在售商品</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon total-exchanges">
                <el-icon><Tickets /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.total_exchanges }}</div>
                <div class="stat-label">兑换总数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon pending-exchanges">
                <el-icon><Clock /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.pending_exchanges }}</div>
                <div class="stat-label">待审批</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 主要内容区域 -->
    <el-tabs v-model="activeTab" class="shop-tabs">
      <!-- 商品管理 -->
      <el-tab-pane label="商品管理" name="items">
        <ShopItemManagement />
      </el-tab-pane>

      <!-- 兑换记录 -->
      <el-tab-pane label="兑换记录" name="exchanges">
        <ShopExchangeManagement />
      </el-tab-pane>

      <!-- 学生商城 -->
      <el-tab-pane label="学生商城" name="student">
        <StudentShop />
      </el-tab-pane>

      <!-- 数据统计 -->
      <el-tab-pane label="数据统计" name="stats">
        <ShopStatistics />
      </el-tab-pane>
    </el-tabs>

    <!-- 添加商品对话框 -->
    <el-dialog
      v-model="showItemDialog"
      title="添加商品"
      width="600px"
      :close-on-click-modal="false"
    >
      <ShopItemForm
        @success="handleItemSuccess"
        @cancel="showItemDialog = false"
      />
    </el-dialog>

    <!-- 分类管理对话框 -->
    <el-dialog
      v-model="showCategoryDialog"
      title="分类管理"
      width="800px"
      :close-on-click-modal="false"
    >
      <ShopCategoryManagement @close="showCategoryDialog = false" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useShopStore } from '../stores/shop'
import ShopItemManagement from './shop/ShopItemManagement.vue'
import ShopExchangeManagement from './shop/ShopExchangeManagement.vue'
import StudentShop from './shop/StudentShop.vue'
import ShopStatistics from './shop/ShopStatistics.vue'
import ShopItemForm from './shop/ShopItemForm.vue'
import ShopCategoryManagement from './shop/ShopCategoryManagement.vue'
import {
  ShoppingBag,
  Plus,
  FolderAdd,
  Box,
  ShoppingCart,
  Tickets,
  Clock
} from '@element-plus/icons-vue'

const shopStore = useShopStore()
const activeTab = ref('items')
const showItemDialog = ref(false)
const showCategoryDialog = ref(false)

// 计算属性
const stats = computed(() => shopStore.stats)

// 处理商品添加成功
const handleItemSuccess = () => {
  showItemDialog.value = false
  shopStore.fetchItems()
  shopStore.fetchStats()
}

// 初始化数据
onMounted(async () => {
  await Promise.all([
    shopStore.fetchStats(),
    shopStore.fetchCategories()
  ])
})
</script>

<style scoped>
.shop-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.shop-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-left {
  flex: 1;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.page-description {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.header-right {
  display: flex;
  gap: 12px;
}

.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.stat-icon.total-items {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.active-items {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.total-exchanges {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.pending-exchanges {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.shop-tabs {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

:deep(.el-tabs__header) {
  margin-bottom: 20px;
}

:deep(.el-tabs__item) {
  font-size: 16px;
  font-weight: 500;
}

:deep(.el-tabs__nav-wrap::after) {
  display: none;
}

:deep(.el-dialog__header) {
  padding: 20px 20px 10px;
  border-bottom: 1px solid #ebeef5;
}

:deep(.el-dialog__body) {
  padding: 20px;
}
</style>