<template>
  <div class="batch-data-selector">
    <!-- 选择器头部 -->
    <div class="selector-header">
      <div class="header-left">
        <h4>{{ title }}</h4>
        <span class="selected-count">已选择 {{ selectedItems.length }} 项</span>
      </div>
      <div class="header-right">
        <el-button-group>
          <el-button 
            size="small" 
            @click="selectAll"
            :disabled="filteredData.length === 0"
          >
            全选
          </el-button>
          <el-button 
            size="small" 
            @click="clearSelection"
            :disabled="selectedItems.length === 0"
          >
            清空
          </el-button>
          <el-button 
            size="small" 
            @click="invertSelection"
            :disabled="filteredData.length === 0"
          >
            反选
          </el-button>
        </el-button-group>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="selector-filters">
      <el-row :gutter="16">
        <el-col :span="8">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索..."
            prefix-icon="Search"
            clearable
            @input="handleSearch"
          />
        </el-col>
        <el-col :span="8" v-if="showClassFilter">
          <el-select
            v-model="selectedClass"
            placeholder="选择班级"
            clearable
            @change="handleClassChange"
          >
            <el-option
              v-for="cls in classList"
              :key="cls.id"
              :label="cls.name"
              :value="cls.id"
            />
          </el-select>
        </el-col>
        <el-col :span="8" v-if="showStatusFilter">
          <el-select
            v-model="selectedStatus"
            placeholder="选择状态"
            clearable
            @change="handleStatusChange"
          >
            <el-option label="全部" value="" />
            <el-option label="正常" value="active" />
            <el-option label="停用" value="inactive" />
          </el-select>
        </el-col>
      </el-row>
    </div>

    <!-- 数据列表 -->
    <div class="selector-content">
      <div class="data-list" v-if="filteredData.length > 0">
        <div 
          v-for="item in paginatedData" 
          :key="getItemKey(item)"
          class="data-item"
          :class="{ 'selected': isSelected(item) }"
          @click="toggleSelection(item)"
        >
          <div class="item-checkbox">
            <el-checkbox 
              :model-value="isSelected(item)"
              @change="toggleSelection(item)"
              @click.stop
            />
          </div>
          <div class="item-content">
            <div class="item-main">
              <span class="item-name">{{ getItemName(item) }}</span>
              <span class="item-info" v-if="getItemInfo(item)">{{ getItemInfo(item) }}</span>
            </div>
            <div class="item-meta" v-if="getItemMeta(item)">
              <span class="item-meta-text">{{ getItemMeta(item) }}</span>
            </div>
          </div>
          <div class="item-actions" v-if="showItemActions">
            <slot name="item-actions" :item="item"></slot>
          </div>
        </div>
      </div>
      
      <!-- 空状态 -->
      <el-empty v-else description="暂无数据" />
    </div>

    <!-- 分页 -->
    <div class="selector-pagination" v-if="filteredData.length > pageSize">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="filteredData.length"
        layout="prev, pager, next, jumper"
        small
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { PropType } from 'vue'

// 定义数据项接口
interface DataItem {
  id: number | string
  name: string
  [key: string]: any
}

// Props定义
const props = defineProps({
  title: {
    type: String,
    default: '选择数据'
  },
  data: {
    type: Array as PropType<DataItem[]>,
    default: () => []
  },
  selectedItems: {
    type: Array as PropType<DataItem[]>,
    default: () => []
  },
  keyField: {
    type: String,
    default: 'id'
  },
  nameField: {
    type: String,
    default: 'name'
  },
  infoField: {
    type: String,
    default: ''
  },
  metaField: {
    type: String,
    default: ''
  },
  showClassFilter: {
    type: Boolean,
    default: false
  },
  showStatusFilter: {
    type: Boolean,
    default: false
  },
  showItemActions: {
    type: Boolean,
    default: false
  },
  classList: {
    type: Array as PropType<Array<{ id: number; name: string }>>,
    default: () => []
  },
  pageSize: {
    type: Number,
    default: 20
  }
})

// Emits定义
const emit = defineEmits<{
  'update:selectedItems': [items: DataItem[]]
  'selection-change': [items: DataItem[]]
}>()

// 响应式数据
const searchKeyword = ref('')
const selectedClass = ref<number | null>(null)
const selectedStatus = ref('')
const currentPage = ref(1)

// 计算属性
const filteredData = computed(() => {
  let result = [...props.data]
  
  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(item => 
      getItemName(item).toLowerCase().includes(keyword) ||
      (getItemInfo(item) && getItemInfo(item).toLowerCase().includes(keyword))
    )
  }
  
  // 班级过滤
  if (selectedClass.value && props.showClassFilter) {
    result = result.filter(item => item.class_id === selectedClass.value)
  }
  
  // 状态过滤
  if (selectedStatus.value && props.showStatusFilter) {
    result = result.filter(item => item.status === selectedStatus.value)
  }
  
  return result
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * props.pageSize
  const end = start + props.pageSize
  return filteredData.value.slice(start, end)
})

// 方法
const getItemKey = (item: DataItem) => {
  return item[props.keyField]
}

const getItemName = (item: DataItem) => {
  return item[props.nameField] || ''
}

const getItemInfo = (item: DataItem) => {
  return props.infoField ? item[props.infoField] || '' : ''
}

const getItemMeta = (item: DataItem) => {
  return props.metaField ? item[props.metaField] || '' : ''
}

const isSelected = (item: DataItem) => {
  return props.selectedItems.some(selected => 
    getItemKey(selected) === getItemKey(item)
  )
}

const toggleSelection = (item: DataItem) => {
  const newSelection = [...props.selectedItems]
  const index = newSelection.findIndex(selected => 
    getItemKey(selected) === getItemKey(item)
  )
  
  if (index > -1) {
    newSelection.splice(index, 1)
  } else {
    newSelection.push(item)
  }
  
  emit('update:selectedItems', newSelection)
  emit('selection-change', newSelection)
}

const selectAll = () => {
  const allItems = [...props.selectedItems]
  
  filteredData.value.forEach(item => {
    if (!isSelected(item)) {
      allItems.push(item)
    }
  })
  
  emit('update:selectedItems', allItems)
  emit('selection-change', allItems)
}

const clearSelection = () => {
  emit('update:selectedItems', [])
  emit('selection-change', [])
}

const invertSelection = () => {
  const newSelection = [...props.selectedItems]
  
  filteredData.value.forEach(item => {
    const index = newSelection.findIndex(selected => 
      getItemKey(selected) === getItemKey(item)
    )
    
    if (index > -1) {
      newSelection.splice(index, 1)
    } else {
      newSelection.push(item)
    }
  })
  
  emit('update:selectedItems', newSelection)
  emit('selection-change', newSelection)
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleClassChange = () => {
  currentPage.value = 1
}

const handleStatusChange = () => {
  currentPage.value = 1
}

// 监听数据变化重置分页
watch(() => props.data, () => {
  currentPage.value = 1
})
</script>

<style scoped>
.batch-data-selector {
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  background: var(--el-bg-color);
}

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color-page);
}

.header-left h4 {
  margin: 0 12px 0 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.selected-count {
  font-size: 14px;
  color: var(--el-text-color-regular);
  background: var(--el-color-primary-light-9);
  padding: 2px 8px;
  border-radius: 12px;
}

.selector-filters {
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.selector-content {
  max-height: 400px;
  overflow-y: auto;
}

.data-list {
  padding: 8px 0;
}

.data-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.data-item:hover {
  background: var(--el-color-primary-light-9);
}

.data-item.selected {
  background: var(--el-color-primary-light-8);
  border-left: 3px solid var(--el-color-primary);
}

.data-item:last-child {
  border-bottom: none;
}

.item-checkbox {
  margin-right: 12px;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-main {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.item-name {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.item-info {
  font-size: 12px;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
  padding: 2px 6px;
  border-radius: 4px;
}

.item-meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.item-actions {
  margin-left: 12px;
}

.selector-pagination {
  padding: 16px 20px;
  border-top: 1px solid var(--el-border-color-lighter);
  display: flex;
  justify-content: center;
}
</style>