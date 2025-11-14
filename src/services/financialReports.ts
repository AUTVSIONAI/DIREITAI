import { apiClient } from '../lib/api'
import { supabase } from '../lib/supabase'

export interface FinancialOverview {
  totalRevenue: number
  monthlyGrowth: number
  totalSubscriptions: number
  subscriptionGrowth: number
  averageOrderValue: number
  aovGrowth: number
  churnRate: number
  churnChange: number
}

export interface RevenueByPlan {
  plan: string
  revenue: number
  subscribers: number
  percentage: number
}

export interface MonthlyRevenue {
  month: string
  revenue: number
  subscriptions: number
  orders: number
}

export interface TopProduct {
  name: string
  revenue: number
  units: number
  growth: number
}

export interface Transaction {
  id: string
  type: 'subscription' | 'product'
  customer: string
  plan?: string
  description?: string
  amount: number
  status: 'completed' | 'pending' | 'failed' | 'refunded'
  date: string
  method: 'credit_card' | 'pix' | 'boleto' | 'debit_card'
}

export interface FinancialFilters {
  period?: 'day' | 'week' | 'month' | 'quarter' | 'year'
  startDate?: string
  endDate?: string
  plan?: string
  status?: string
}

export class FinancialReportsService {
  private static async fallbackFetch<T>(path: string, params: URLSearchParams): Promise<T> {
    const url = `https://direitai-backend.vercel.app/api${path}?${params.toString()}`
    let headers: Record<string, string> = { 'Content-Type': 'application/json' }
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
    } catch {}
    const res = await fetch(url, { method: 'GET', headers })
    const json = await res.json().catch(() => null)
    // Alguns endpoints retornam embrulhados em { data }
    if (json && typeof json === 'object' && 'data' in json && json.data != null) return json.data as T
    return json as T
  }

  static async getOverview(filters?: FinancialFilters): Promise<FinancialOverview> {
    const params = new URLSearchParams()
    if (filters?.period) params.append('period', filters.period)
    if (filters?.startDate) params.append('start_date', filters.startDate)
    if (filters?.endDate) params.append('end_date', filters.endDate)

    const response = await apiClient.get(`/admin/financial/overview?${params.toString()}`)
    const raw = response.data as any
    const data = (raw && typeof raw === 'object' && 'data' in raw) ? (raw.data as FinancialOverview) : (raw as FinancialOverview)
    const isEmpty = !data || (
      (data.totalRevenue ?? 0) === 0 &&
      (data.totalSubscriptions ?? 0) === 0 &&
      (data.averageOrderValue ?? 0) === 0
    )
    if (!response.success || isEmpty) {
      return await this.fallbackFetch<FinancialOverview>(`/admin/financial/overview`, params)
    }
    return data
  }

  static async getRevenueByPlan(filters?: FinancialFilters): Promise<RevenueByPlan[]> {
    const params = new URLSearchParams()
    if (filters?.period) params.append('period', filters.period)
    if (filters?.startDate) params.append('start_date', filters.startDate)
    if (filters?.endDate) params.append('end_date', filters.endDate)

    const response = await apiClient.get(`/admin/financial/revenue-by-plan?${params.toString()}`)
    const raw = response.data as any
    const data = (raw && typeof raw === 'object' && 'data' in raw) ? (raw.data as RevenueByPlan[]) : (raw as RevenueByPlan[])
    if (!response.success || !Array.isArray(data) || data.length === 0) {
      return await this.fallbackFetch<RevenueByPlan[]>(`/admin/financial/revenue-by-plan`, params)
    }
    return data
  }

  static async getMonthlyRevenue(filters?: FinancialFilters): Promise<MonthlyRevenue[]> {
    const params = new URLSearchParams()
    if (filters?.period) params.append('period', filters.period)
    if (filters?.startDate) params.append('start_date', filters.startDate)
    if (filters?.endDate) params.append('end_date', filters.endDate)

    const response = await apiClient.get(`/admin/financial/monthly-revenue?${params.toString()}`)
    const raw = response.data as any
    const data = (raw && typeof raw === 'object' && 'data' in raw) ? (raw.data as MonthlyRevenue[]) : (raw as MonthlyRevenue[])
    if (!response.success || !Array.isArray(data) || data.length === 0) {
      return await this.fallbackFetch<MonthlyRevenue[]>(`/admin/financial/monthly-revenue`, params)
    }
    return data
  }

  static async getTopProducts(filters?: FinancialFilters): Promise<TopProduct[]> {
    const params = new URLSearchParams()
    if (filters?.period) params.append('period', filters.period)
    if (filters?.startDate) params.append('start_date', filters.startDate)
    if (filters?.endDate) params.append('end_date', filters.endDate)

    const response = await apiClient.get(`/admin/financial/top-products?${params.toString()}`)
    const raw = response.data as any
    const data = (raw && typeof raw === 'object' && 'data' in raw) ? (raw.data as TopProduct[]) : (raw as TopProduct[])
    if (!response.success || !Array.isArray(data) || data.length === 0) {
      return await this.fallbackFetch<TopProduct[]>(`/admin/financial/top-products`, params)
    }
    return data
  }

  static async getTransactions(filters?: FinancialFilters & { page?: number; limit?: number }): Promise<{
    transactions: Transaction[]
    total: number
    page: number
    totalPages: number
  }> {
    const params = new URLSearchParams()
    if (filters?.period) params.append('period', filters.period)
    if (filters?.startDate) params.append('start_date', filters.startDate)
    if (filters?.endDate) params.append('end_date', filters.endDate)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())

    const response = await apiClient.get(`/admin/financial/transactions?${params.toString()}`)
    const raw = response.data as any
    const data = (raw && typeof raw === 'object' && 'data' in raw) ? (raw.data as any) : raw
    const list = data?.transactions as Transaction[]
    if (!response.success || !Array.isArray(list) || list.length === 0) {
      return await this.fallbackFetch<{
        transactions: Transaction[]
        total: number
        page: number
        totalPages: number
      }>(`/admin/financial/transactions`, params)
    }
    return data
  }

  static async exportReport(type: 'overview' | 'transactions' | 'revenue', filters?: FinancialFilters): Promise<Blob> {
    const params = new URLSearchParams()
    if (filters?.period) params.append('period', filters.period)
    if (filters?.startDate) params.append('start_date', filters.startDate)
    if (filters?.endDate) params.append('end_date', filters.endDate)
    
    const response = await apiClient.download(`/admin/financial/export/${type}?${params.toString()}`)
    return response
  }

  static async getRevenueMetrics(filters?: FinancialFilters): Promise<{
    totalRevenue: number
    recurringRevenue: number
    oneTimeRevenue: number
    refunds: number
    netRevenue: number
  }> {
    const params = new URLSearchParams()
    if (filters?.period) params.append('period', filters.period)
    if (filters?.startDate) params.append('start_date', filters.startDate)
    if (filters?.endDate) params.append('end_date', filters.endDate)

    const response = await apiClient.get(`/admin/financial/metrics?${params.toString()}`)
    const raw = response.data as any
    const data = (raw && typeof raw === 'object' && 'data' in raw) ? raw.data : raw
    const isEmpty = !data || Object.keys(data).length === 0
    if (!response.success || isEmpty) {
      return await this.fallbackFetch(`/admin/financial/metrics`, params)
    }
    return data
  }
}

// Create and export singleton instance
export const financialReportsService = new FinancialReportsService();

export default FinancialReportsService
