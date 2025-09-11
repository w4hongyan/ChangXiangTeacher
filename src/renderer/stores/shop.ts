import { defineStore } from 'pinia'
import type { 
  ShopItem, 
  ShopCategory, 
  ShopExchange, 
  ShopItemFormData, 
  ShopCategoryFormData, 
  ShopExchangeFormData,
  ShopQueryParams,
  ExchangeQueryParams,
  ShopStats,
  StudentShopInfo
} from '../types/shop'

interface ShopState {
  items: ShopItem[]
  categories: ShopCategory[]
  exchanges: ShopExchange[]
  stats: ShopStats | null
  studentInfo: StudentShopInfo | null
  loading: boolean
  error: string | null
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
  exchangePagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

export const useShopStore = defineStore('shop', {
  state: (): ShopState => ({
    items: [],
    categories: [],
    exchanges: [],
    stats: null,
    studentInfo: null,
    loading: false,
    error: null,
    pagination: {
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0
    },
    exchangePagination: {
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0
    }
  }),

  getters: {
    // 获取活跃商品
    activeItems: (state) => state.items.filter(item => item.is_active),
    
    // 按分类获取商品
    getItemsByCategory: (state) => (category: string) => 
      state.items.filter(item => item.category === category && item.is_active),
    
    // 获取热门商品
    popularItems: (state) => 
      [...state.items]
        .filter(item => item.is_active)
        .sort((a, b) => (b.sold_count || 0) - (a.sold_count || 0))
        .slice(0, 10),
    
    // 获取待审批兑换
    pendingExchanges: (state) => 
      state.exchanges.filter(exchange => exchange.status === 'pending'),
    
    // 获取已完成兑换
    completedExchanges: (state) => 
      state.exchanges.filter(exchange => exchange.status === 'approved'),
    
    // 获取学生可用积分
    availablePoints: (state) => state.studentInfo?.available_points || 0
  },

  actions: {
    // 设置加载状态
    setLoading(loading: boolean) {
      this.loading = loading
    },

    // 设置错误信息
    setError(error: string | null) {
      this.error = error
    },

    // 获取商品列表
    async fetchItems(params: ShopQueryParams = {}) {
      try {
        this.setLoading(true)
        this.setError(null)
        
        const result = await window.electronAPI.invoke('shop:listItems', params)
        
        if (result.success) {
          this.items = result.data.items
          this.pagination = {
            total: result.data.total,
            page: result.data.page,
            pageSize: result.data.page_size,
            totalPages: result.data.total_pages
          }
        } else {
          this.setError(result.error || '获取商品列表失败')
        }
      } catch (error) {
        console.error('获取商品列表失败:', error)
        this.setError('获取商品列表失败')
      } finally {
        this.setLoading(false)
      }
    },

    // 创建商品
    async createItem(data: ShopItemFormData) {
      try {
        this.setLoading(true)
        this.setError(null)
        
        const result = await window.electronAPI.invoke('shop:createItem', data)
        
        if (result.success) {
          this.items.unshift(result.data)
          return result.data
        } else {
          this.setError(result.error || '创建商品失败')
          throw new Error(result.error || '创建商品失败')
        }
      } catch (error) {
        console.error('创建商品失败:', error)
        this.setError(error instanceof Error ? error.message : '创建商品失败')
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    // 更新商品
    async updateItem(id: number, data: Partial<ShopItemFormData>) {
      try {
        this.setLoading(true)
        this.setError(null)
        
        const result = await window.electronAPI.invoke('shop:updateItem', id, data)
        
        if (result.success) {
          const index = this.items.findIndex(item => item.id === id)
          if (index !== -1) {
            this.items[index] = result.data
          }
          return result.data
        } else {
          this.setError(result.error || '更新商品失败')
          throw new Error(result.error || '更新商品失败')
        }
      } catch (error) {
        console.error('更新商品失败:', error)
        this.setError(error instanceof Error ? error.message : '更新商品失败')
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    // 删除商品
    async deleteItem(id: number) {
      try {
        this.setLoading(true)
        this.setError(null)
        
        const result = await window.electronAPI.invoke('shop:deleteItem', id)
        
        if (result.success) {
          this.items = this.items.filter(item => item.id !== id)
        } else {
          this.setError(result.error || '删除商品失败')
          throw new Error(result.error || '删除商品失败')
        }
      } catch (error) {
        console.error('删除商品失败:', error)
        this.setError(error instanceof Error ? error.message : '删除商品失败')
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    // 获取分类列表
    async fetchCategories() {
      try {
        this.setLoading(true)
        this.setError(null)
        
        const result = await window.electronAPI.invoke('shop:listCategories')
        
        if (result.success) {
          this.categories = result.data
        } else {
          this.setError(result.error || '获取分类列表失败')
        }
      } catch (error) {
        console.error('获取分类列表失败:', error)
        this.setError('获取分类列表失败')
      } finally {
        this.setLoading(false)
      }
    },

    // 创建分类
    async createCategory(data: ShopCategoryFormData) {
      try {
        this.setLoading(true)
        this.setError(null)
        
        const result = await window.electronAPI.invoke('shop:createCategory', data)
        
        if (result.success) {
          this.categories.push(result.data)
          return result.data
        } else {
          this.setError(result.error || '创建分类失败')
          throw new Error(result.error || '创建分类失败')
        }
      } catch (error) {
        console.error('创建分类失败:', error)
        this.setError(error instanceof Error ? error.message : '创建分类失败')
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    // 兑换商品
    async exchangeItem(data: ShopExchangeFormData) {
      try {
        this.setLoading(true)
        this.setError(null)
        
        const result = await window.electronAPI.invoke('shop:exchangeItem', data)
        
        if (result.success) {
          this.exchanges.unshift(result.data)
          // 更新学生信息中的积分
          if (this.studentInfo && this.studentInfo.student_id === data.student_id) {
            this.studentInfo.available_points -= result.data.points_cost
            this.studentInfo.total_exchanges += 1
            this.studentInfo.pending_exchanges += 1
          }
          return result.data
        } else {
          this.setError(result.error || '兑换商品失败')
          throw new Error(result.error || '兑换商品失败')
        }
      } catch (error) {
        console.error('兑换商品失败:', error)
        this.setError(error instanceof Error ? error.message : '兑换商品失败')
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    // 获取兑换记录
    async fetchExchanges(params: ExchangeQueryParams = {}) {
      try {
        this.setLoading(true)
        this.setError(null)
        
        const result = await window.electronAPI.invoke('shop:listExchanges', params)
        
        if (result.success) {
          this.exchanges = result.data.items
          this.exchangePagination = {
            total: result.data.total,
            page: result.data.page,
            pageSize: result.data.page_size,
            totalPages: result.data.total_pages
          }
        } else {
          this.setError(result.error || '获取兑换记录失败')
        }
      } catch (error) {
        console.error('获取兑换记录失败:', error)
        this.setError('获取兑换记录失败')
      } finally {
        this.setLoading(false)
      }
    },

    // 审批兑换
    async approveExchange(id: number, approved: boolean, notes?: string) {
      try {
        this.setLoading(true)
        this.setError(null)
        
        const result = await window.electronAPI.invoke('shop:approveExchange', id, approved, notes)
        
        if (result.success) {
          const index = this.exchanges.findIndex(exchange => exchange.id === id)
          if (index !== -1) {
            this.exchanges[index] = result.data
          }
          return result.data
        } else {
          this.setError(result.error || '审批兑换失败')
          throw new Error(result.error || '审批兑换失败')
        }
      } catch (error) {
        console.error('审批兑换失败:', error)
        this.setError(error instanceof Error ? error.message : '审批兑换失败')
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    // 获取商城统计
    async fetchStats() {
      try {
        this.setLoading(true)
        this.setError(null)
        
        const result = await window.electronAPI.invoke('shop:getStats')
        
        if (result.success) {
          this.stats = result.data
        } else {
          this.setError(result.error || '获取商城统计失败')
        }
      } catch (error) {
        console.error('获取商城统计失败:', error)
        this.setError('获取商城统计失败')
      } finally {
        this.setLoading(false)
      }
    },

    // 获取学生商城信息
    async fetchStudentInfo(studentId: number, classId: number) {
      try {
        this.setLoading(true)
        this.setError(null)
        
        const result = await window.electronAPI.invoke('shop:getStudentInfo', studentId, classId)
        
        if (result.success) {
          this.studentInfo = result.data
        } else {
          this.setError(result.error || '获取学生商城信息失败')
        }
      } catch (error) {
        console.error('获取学生商城信息失败:', error)
        this.setError('获取学生商城信息失败')
      } finally {
        this.setLoading(false)
      }
    },

    // 清空数据
    clearData() {
      this.items = []
      this.categories = []
      this.exchanges = []
      this.stats = null
      this.studentInfo = null
      this.error = null
      this.pagination = {
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0
      }
      this.exchangePagination = {
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0
      }
    }
  }
})