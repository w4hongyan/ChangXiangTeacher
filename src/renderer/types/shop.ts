export interface ShopItem {
  id: number
  name: string
  description: string
  price: number
  image_url?: string
  stock: number // -1表示无限库存
  sold_count: number
  is_active: boolean
  sort_order: number
  attributes?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface ShopCategory {
  id: number
  name: string
  description?: string
  icon?: string
  color: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ShopExchange {
  id: number
  student_id: number
  item_id: number
  class_id: number
  quantity: number
  points_cost: number
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  notes?: string
  approved_by?: number
  approved_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
  // 关联数据
  student_name?: string
  item_name?: string
  item_image_url?: string
}

export interface ShopItemFormData {
  name: string
  description: string
  price: number
  category: string
  image_url?: string
  stock: number
  is_active: boolean
  sort_order: number
  attributes?: Record<string, any>
}

export interface ShopCategoryFormData {
  name: string
  description?: string
  icon?: string
  color: string
  sort_order: number
  is_active: boolean
}

export interface ShopExchangeFormData {
  student_id: number
  item_id: number
  class_id: number
  quantity: number
  notes?: string
}

export interface ShopQueryParams {
  category?: string
  is_active?: boolean
  search?: string
  sort_by?: 'name' | 'price' | 'sold_count' | 'created_at'
  sort_order?: 'asc' | 'desc'
  page?: number
  page_size?: number
}

export interface ExchangeQueryParams {
  student_id?: number
  class_id?: number
  status?: string
  start_date?: string
  end_date?: string
  page?: number
  page_size?: number
}

export interface ShopStats {
  total_items: number
  active_items: number
  total_exchanges: number
  pending_exchanges: number
  total_points_spent: number
  popular_items: Array<{
    item_id: number
    item_name: string
    exchange_count: number
  }>
  category_stats: Array<{
    category: string
    item_count: number
    exchange_count: number
  }>
}

export interface StudentShopInfo {
  student_id: number
  student_name: string
  total_points: number
  available_points: number
  total_exchanges: number
  pending_exchanges: number
  recent_exchanges: ShopExchange[]
}