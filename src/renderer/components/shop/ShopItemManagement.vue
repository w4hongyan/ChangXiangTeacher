<template>
  <div class="item-management">
    <!-- 搜索和筛选 -->
    <div class="search-filters">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-input
            v-model="searchQuery"
            placeholder="搜索商品名称或描述"
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select
            v-model="selectedCategory"
            placeholder="选择分类"
            clearable
            @change="handleCategoryChange"
          >
            <el-option label="全部分类" value="" />
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.name"
            />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select
            v-model="selectedStatus"
            placeholder="商品状态"
            @change="handleStatusChange"
          >
            <el-option label="全部状态" :value="undefined" />
            <el-option label="在售" :value="true" />
            <el-option label="下架" :value="false" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select
            v-model="sortBy"
            placeholder="排序方式"
            @change="handleSortChange"
          >
            <el-option label="排序顺序" value="sort_order" />
            <el-option label="创建时间" value="created_at" />
            <el-option label="价格" value="price" />
            <el-option label="销量" value="sold_count" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-button type="primary" @click="showAddDialog = true">
            <el-icon><Plus /></el-icon>
            添加商品
          </el-button>
          <el-button @click="refreshData">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </el-col>
      </el-row>
    </div>

    <!-- 商品列表 -->
    <div class="items-grid" v-loading="loading">
      <div
        v-for="item in items"
        :key="item.id"
        class="item-card"
        :class="{ inactive: !item.is_active }"
      >
        <div class="item-image">
          <img
            v-if="item.image_url"
            :src="item.image_url"
            :alt="item.name"
            @error="handleImageError"
          />
          <div v-else class="no-image">
            <el-icon><Picture /></el-icon>
          </div>
          <div class="item-status" v-if="!item.is_active">
            <el-tag type="danger" size="small">已下架</el-tag>
          </div>
        </div>
        
        <div class="item-content">
          <div class="item-header">
            <h3 class="item-name">{{ item.name }}</h3>
            <div class="item-price">
              <span class="price-value">{{ item.price }}</span>
              <span class="price-unit">积分</span>
            </div>
          </div>
          
          <p class="item-description">{{ item.description || '暂无描述' }}</p>
          
          <div class="item-meta">
            <el-tag size="small" type="info">{{ item.category }}</el-tag>
            <span class="stock-info">
              库存: {{ item.stock === -1 ? '无限' : item.stock }}
            </span>
            <span class="sold-info">
              已售: {{ item.sold_count || 0 }}
            </span>
          </div>
          
          <div class="item-actions">
            <el-button size="small" @click="editItem(item)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button
              size="small"
              :type="item.is_active ? 'warning' : 'success'"
              @click="toggleItemStatus(item)"
            >
              <el-icon v-if="item.is_active"><Hide /></el-icon>
              <el-icon v-else><View /></el-icon>
              {{ item.is_active ? '下架' : '上架' }}
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="deleteItem(item)"
            >
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </div>
        </div>
      </div>
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

    <!-- 添加/编辑商品对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingItem ? '编辑商品' : '添加商品'"
      width="600px"
      :close-on-click-modal="false"
    >
      <ShopItemForm
        :item="editingItem"
        @success="handleFormSuccess"
        @cancel="handleFormCancel"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useShopStore } from '../../stores/shop'
import type { ShopItem } from '../../types/shop'
import ShopItemForm from './ShopItemForm.vue'
import {
  Search,
  Plus,
  Refresh,
  Picture,
  Edit,
  Hide,
  View,
  Delete
} from '@element-plus/icons-vue'

const shopStore = useShopStore()

// 响应式数据
const searchQuery = ref('')
const selectedCategory = ref('')
const selectedStatus = ref<boolean | undefined>(undefined)
const sortBy = ref('sort_order')
const showAddDialog = ref(false)
const editingItem = ref<ShopItem | null>(null)

// 计算属性
const items = computed(() => shopStore.items)
const categories = computed(() => shopStore.categories)
const loading = computed(() => shopStore.loading)
const pagination = computed(() => shopStore.pagination)

// 搜索处理
const handleSearch = () => {
  fetchItems()
}

// 分类筛选
const handleCategoryChange = () => {
  fetchItems()
}

// 状态筛选
const handleStatusChange = () => {
  fetchItems()
}

// 排序处理
const handleSortChange = () => {
  fetchItems()
}

// 获取商品列表
const fetchItems = () => {
  const params = {
    search: searchQuery.value || undefined,
    category: selectedCategory.value || undefined,
    is_active: selectedStatus.value,
    sort_by: sortBy.value,
    page: pagination.value.page,
    page_size: pagination.value.pageSize
  }
  shopStore.fetchItems(params)
}

// 刷新数据
const refreshData = () => {
  fetchItems()
  shopStore.fetchCategories()
}

// 编辑商品
const editItem = (item: ShopItem) => {
  editingItem.value = { ...item }
  showAddDialog.value = true
}

// 切换商品状态
const toggleItemStatus = async (item: ShopItem) => {
  try {
    await shopStore.updateItem(item.id, {
      is_active: !item.is_active
    })
    ElMessage.success(`商品已${item.is_active ? '下架' : '上架'}`)
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 删除商品
const deleteItem = async (item: ShopItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除商品「${item.name}」吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await shopStore.deleteItem(item.id)
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 处理表单成功
const handleFormSuccess = () => {
  showAddDialog.value = false
  editingItem.value = null
  fetchItems()
}

// 处理表单取消
const handleFormCancel = () => {
  showAddDialog.value = false
  editingItem.value = null
}

// 分页处理
const handleSizeChange = (size: number) => {
  shopStore.pagination.pageSize = size
  shopStore.pagination.page = 1
  fetchItems()
}

const handlePageChange = (page: number) => {
  shopStore.pagination.page = page
  fetchItems()
}

// 图片加载错误处理
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
  const parent = img.parentElement
  if (parent) {
    parent.innerHTML = '<div class="no-image"><i class="el-icon-picture"></i></div>'
  }
}

// 初始化
onMounted(() => {
  fetchItems()
  shopStore.fetchCategories()
})
</script>

<style scoped>
.item-management {
  padding: 0;
}

.search-filters {
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.item-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
}

.item-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.item-card.inactive {
  opacity: 0.7;
}

.item-image {
  position: relative;
  height: 200px;
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

.item-status {
  position: absolute;
  top: 8px;
  right: 8px;
}

.item-content {
  padding: 16px;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.item-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  flex: 1;
  margin-right: 12px;
}

.item-price {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.price-value {
  font-size: 18px;
  font-weight: 600;
  color: #e6a23c;
}

.price-unit {
  font-size: 12px;
  color: #909399;
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

.item-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  font-size: 12px;
  color: #909399;
}

.item-actions {
  display: flex;
  gap: 8px;
}

.item-actions .el-button {
  flex: 1;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>