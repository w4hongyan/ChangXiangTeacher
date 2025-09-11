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

    <!-- 时间范围选择 -->
    <div class="time-range-selector">
      <el-card>
        <div class="selector-header">
          <h3>数据分析</h3>
          <div class="time-controls">
            <el-radio-group v-model="timeRange" @change="handleTimeRangeChange">
              <el-radio-button label="7d">最近7天</el-radio-button>
              <el-radio-button label="30d">最近30天</el-radio-button>
              <el-radio-button label="90d">最近90天</el-radio-button>
              <el-radio-button label="custom">自定义</el-radio-button>
            </el-radio-group>
            <el-date-picker
              v-if="timeRange === 'custom'"
              v-model="customDateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              @change="handleCustomDateChange"
              style="margin-left: 16px;"
            />
          </div>
        </div>
      </el-card>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <el-row :gutter="20">
        <!-- 兑换趋势图 -->
        <el-col :span="12">
          <el-card>
            <template #header>
              <h4>兑换趋势</h4>
            </template>
            <div ref="exchangeTrendChart" class="chart-container"></div>
          </el-card>
        </el-col>
        
        <!-- 积分消耗趋势 -->
        <el-col :span="12">
          <el-card>
            <template #header>
              <h4>积分消耗趋势</h4>
            </template>
            <div ref="pointsTrendChart" class="chart-container"></div>
          </el-card>
        </el-col>
      </el-row>
      
      <el-row :gutter="20" style="margin-top: 20px;">
        <!-- 热门商品排行 -->
        <el-col :span="12">
          <el-card>
            <template #header>
              <h4>热门商品排行</h4>
            </template>
            <div ref="popularItemsChart" class="chart-container"></div>
          </el-card>
        </el-col>
        
        <!-- 分类销售占比 -->
        <el-col :span="12">
          <el-card>
            <template #header>
              <h4>分类销售占比</h4>
            </template>
            <div ref="categoryPieChart" class="chart-container"></div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 详细数据表格 -->
    <div class="detailed-data">
      <el-card>
        <template #header>
          <div class="table-header">
            <h4>商品销售详情</h4>
            <el-button type="primary" size="small" @click="exportData">
              <el-icon><Download /></el-icon>
              导出数据
            </el-button>
          </div>
        </template>
        
        <el-table :data="itemSalesData" v-loading="loading">
          <el-table-column prop="item_name" label="商品名称" />
          <el-table-column prop="category_name" label="分类" width="120" />
          <el-table-column prop="total_sold" label="销量" width="80" sortable />
          <el-table-column prop="total_revenue" label="收入积分" width="120" sortable>
            <template #default="{ row }">
              <span class="revenue-text">{{ row.total_revenue }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="avg_price" label="平均价格" width="120">
            <template #default="{ row }">
              {{ Math.round(row.avg_price) }} 积分
            </template>
          </el-table-column>
          <el-table-column prop="stock" label="库存" width="80">
            <template #default="{ row }">
              <span :class="{ 'low-stock': row.stock < 10 && row.stock !== -1 }">
                {{ row.stock === -1 ? '充足' : row.stock }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="last_sold_at" label="最后销售" width="160">
            <template #default="{ row }">
              {{ row.last_sold_at ? formatDateTime(row.last_sold_at) : '暂无' }}
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { useShopStore } from '../../stores/shop'
import { Money, ShoppingBag, Box, User, Download } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const shopStore = useShopStore()

// 响应式数据
const timeRange = ref('30d')
const customDateRange = ref<[Date, Date] | null>(null)
const exchangeTrendChart = ref<HTMLElement>()
const pointsTrendChart = ref<HTMLElement>()
const popularItemsChart = ref<HTMLElement>()
const categoryPieChart = ref<HTMLElement>()

// 图表实例
let exchangeTrendChartInstance: echarts.ECharts | null = null
let pointsTrendChartInstance: echarts.ECharts | null = null
let popularItemsChartInstance: echarts.ECharts | null = null
let categoryPieChartInstance: echarts.ECharts | null = null

// 计算属性
const statistics = computed(() => shopStore.statistics)
const itemSalesData = computed(() => shopStore.itemSalesData)
const loading = computed(() => shopStore.loading)

// 时间范围变化处理
const handleTimeRangeChange = () => {
  if (timeRange.value !== 'custom') {
    customDateRange.value = null
    fetchStatistics()
  }
}

// 自定义日期变化处理
const handleCustomDateChange = () => {
  if (customDateRange.value) {
    fetchStatistics()
  }
}

// 获取统计数据
const fetchStatistics = async () => {
  let startDate: string | undefined
  let endDate: string | undefined
  
  if (timeRange.value === 'custom' && customDateRange.value) {
    startDate = customDateRange.value[0].toISOString().split('T')[0]
    endDate = customDateRange.value[1].toISOString().split('T')[0]
  } else if (timeRange.value !== 'custom') {
    const days = parseInt(timeRange.value.replace('d', ''))
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    
    startDate = start.toISOString().split('T')[0]
    endDate = end.toISOString().split('T')[0]
  }
  
  await shopStore.fetchStatistics({ start_date: startDate, end_date: endDate })
  
  // 更新图表
  nextTick(() => {
    updateCharts()
  })
}

// 更新图表
const updateCharts = () => {
  updateExchangeTrendChart()
  updatePointsTrendChart()
  updatePopularItemsChart()
  updateCategoryPieChart()
}

// 更新兑换趋势图
const updateExchangeTrendChart = () => {
  if (!exchangeTrendChartInstance || !statistics.value.exchange_trend) return
  
  const data = statistics.value.exchange_trend
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.date)
    },
    yAxis: {
      type: 'value',
      name: '兑换次数'
    },
    series: [{
      name: '兑换次数',
      type: 'line',
      smooth: true,
      data: data.map(item => item.count),
      itemStyle: {
        color: '#409eff'
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [{
            offset: 0, color: 'rgba(64, 158, 255, 0.3)'
          }, {
            offset: 1, color: 'rgba(64, 158, 255, 0.1)'
          }]
        }
      }
    }]
  }
  
  exchangeTrendChartInstance.setOption(option)
}

// 更新积分消耗趋势图
const updatePointsTrendChart = () => {
  if (!pointsTrendChartInstance || !statistics.value.points_trend) return
  
  const data = statistics.value.points_trend
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.date)
    },
    yAxis: {
      type: 'value',
      name: '积分'
    },
    series: [{
      name: '积分消耗',
      type: 'bar',
      data: data.map(item => item.points),
      itemStyle: {
        color: '#e6a23c'
      }
    }]
  }
  
  pointsTrendChartInstance.setOption(option)
}

// 更新热门商品排行图
const updatePopularItemsChart = () => {
  if (!popularItemsChartInstance || !statistics.value.popular_items) return
  
  const data = statistics.value.popular_items.slice(0, 10) // 取前10名
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'value'
    },
    yAxis: {
      type: 'category',
      data: data.map(item => item.item_name),
      axisLabel: {
        interval: 0,
        formatter: function(value: string) {
          return value.length > 8 ? value.substring(0, 8) + '...' : value
        }
      }
    },
    series: [{
      name: '销量',
      type: 'bar',
      data: data.map(item => item.total_sold),
      itemStyle: {
        color: '#67c23a'
      }
    }]
  }
  
  popularItemsChartInstance.setOption(option)
}

// 更新分类销售占比图
const updateCategoryPieChart = () => {
  if (!categoryPieChartInstance || !statistics.value.category_sales) return
  
  const data = statistics.value.category_sales
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [{
      name: '分类销售',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: '18',
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: data.map(item => ({
        value: item.total_sold,
        name: item.category_name
      }))
    }]
  }
  
  categoryPieChartInstance.setOption(option)
}

// 初始化图表
const initCharts = () => {
  nextTick(() => {
    if (exchangeTrendChart.value) {
      exchangeTrendChartInstance = echarts.init(exchangeTrendChart.value)
    }
    if (pointsTrendChart.value) {
      pointsTrendChartInstance = echarts.init(pointsTrendChart.value)
    }
    if (popularItemsChart.value) {
      popularItemsChartInstance = echarts.init(popularItemsChart.value)
    }
    if (categoryPieChart.value) {
      categoryPieChartInstance = echarts.init(categoryPieChart.value)
    }
    
    // 监听窗口大小变化
    window.addEventListener('resize', () => {
      exchangeTrendChartInstance?.resize()
      pointsTrendChartInstance?.resize()
      popularItemsChartInstance?.resize()
      categoryPieChartInstance?.resize()
    })
  })
}

// 导出数据
const exportData = () => {
  // 这里可以实现数据导出功能
  ElMessage.info('导出功能开发中...')
}

// 格式化日期时间
const formatDateTime = (dateTime: string) => {
  return new Date(dateTime).toLocaleString('zh-CN')
}

// 初始化
onMounted(() => {
  initCharts()
  fetchStatistics()
})
</script>

<style scoped>
.shop-statistics {
  padding: 0;
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
  font-size: 24px;
  color: white;
  margin-right: 16px;
}

.stat-icon.revenue {
  background: linear-gradient(135deg, #e6a23c, #f7ba2a);
}

.stat-icon.orders {
  background: linear-gradient(135deg, #409eff, #66b1ff);
}

.stat-icon.items {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.stat-icon.users {
  background: linear-gradient(135deg, #f56c6c, #f78989);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.time-range-selector {
  margin-bottom: 20px;
}

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.selector-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.time-controls {
  display: flex;
  align-items: center;
}

.charts-section {
  margin-bottom: 20px;
}

.chart-container {
  width: 100%;
  height: 300px;
}

.detailed-data {
  margin-bottom: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-header h4 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.revenue-text {
  font-weight: 600;
  color: #e6a23c;
}

.low-stock {
  color: #f56c6c;
  font-weight: 600;
}
</style>