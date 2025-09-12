<template>
  <div class="shop-statistics">
    <!-- 统计概览 -->
    <div class="statistics-overview">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon revenue">
                <el-icon><Money /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ statistics.total_revenue }}</div>
                <div class="stat-label">总收入积分</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon orders">
                <el-icon><ShoppingBag /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ statistics.total_orders }}</div>
                <div class="stat-label">总兑换订单</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon items">
                <el-icon><Box /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ statistics.total_items_sold }}</div>
                <div class="stat-label">商品销量</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-icon users">
                <el-icon><User /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ statistics.active_users }}</div>
                <div class="stat-label">活跃用户</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 数据表格 -->
    <div class="data-tables">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>热门商品</span>
              </div>
            </template>
            <el-table :data="statistics.popular_items" style="width: 100%">
              <el-table-column prop="name" label="商品名称" />
              <el-table-column prop="total_sold" label="销量" />
              <el-table-column prop="total_points" label="积分收入" />
            </el-table>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>分类统计</span>
              </div>
            </template>
            <el-table :data="statistics.category_stats" style="width: 100%">
              <el-table-column prop="category_name" label="分类" />
              <el-table-column prop="total_sold" label="销量" />
              <el-table-column prop="total_revenue" label="收入" />
            </el-table>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Money, ShoppingBag, Box, User } from '@element-plus/icons-vue'

// 统计数据
const statistics = ref({
  total_revenue: 0,
  total_orders: 0,
  total_items_sold: 0,
  active_users: 0,
  popular_items: [],
  category_stats: []
})

// 加载统计数据
const loadStatistics = async () => {
  try {
    // 模拟数据
    statistics.value = {
      total_revenue: 12580,
      total_orders: 156,
      total_items_sold: 234,
      active_users: 89,
      popular_items: [
        { name: '笔记本', total_sold: 45, total_points: 2250 },
        { name: '橡皮擦', total_sold: 38, total_points: 760 },
        { name: '铅笔', total_sold: 32, total_points: 640 }
      ],
      category_stats: [
        { category_name: '学习用品', total_sold: 120, total_revenue: 6000 },
        { category_name: '生活用品', total_sold: 80, total_revenue: 4000 },
        { category_name: '娱乐用品', total_sold: 34, total_revenue: 2580 }
      ]
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
    ElMessage.error('加载统计数据失败')
  }
}

onMounted(() => {
  loadStatistics()
})
</script>

<style scoped>
.shop-statistics {
  padding: 20px;
}

.statistics-overview {
  margin-bottom: 20px;
}

.stat-card {
  height: 120px;
}

.stat-item {
  display: flex;
  align-items: center;
  height: 100%;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 24px;
  color: white;
}

.stat-icon.revenue {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.orders {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.items {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.users {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.data-tables {
  margin-top: 20px;
}

.card-header {
  font-weight: bold;
  font-size: 16px;
}
</style>