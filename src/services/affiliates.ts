import { apiClient } from '../lib/api'

export interface AffiliateProfile {
  id: string
  user_id: string
  code: string
  is_active: boolean
  commission_rate_default: number
  created_at: string
  status?: 'pending' | 'active' | 'rejected'
}

export const recordAffiliateClick = async (code: string, route?: string, userId?: string) => {
  try {
    const key = `aff_click_${code}_${route || window.location.pathname}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
    await apiClient.post('/affiliates/clicks', {
      affiliate_code: code,
      click_url: route || window.location.pathname,
      referrer: document.referrer || null,
      user_id: userId || null,
      user_agent: navigator.userAgent,
    })
  } catch (err) {
    console.warn('Falha ao registrar clique de afiliado:', (err as any)?.message || err)
  }
}

export const getMyAffiliateProfile = async (_userId: string): Promise<AffiliateProfile | null> => {
  try {
    const resp = await apiClient.get('/affiliates/me')
    const profile = (resp?.data?.profile) || null
    return profile as any
  } catch (error: any) {
    console.warn('Erro ao buscar perfil de afiliado:', error?.message || error)
    return null
  }
}

export const adminApproveAffiliate = async (affiliateId: string) => {
  await apiClient.patch(`/affiliates/${affiliateId}/approve`, {})
}

export const adminRejectAffiliate = async (affiliateId: string) => {
  await apiClient.patch(`/affiliates/${affiliateId}/reject`, {})
}

export const adminSetAffiliateActive = async (affiliateId: string, active: boolean) => {
  await apiClient.patch(`/affiliates/${affiliateId}/active`, { active })
}

export const requestAffiliateActivation = async (_userId: string) => {
  await apiClient.post('/affiliates/request-activation', {})
}

export const adminListAffiliates = async (params?: { search?: string; status?: 'pending' | 'active' | 'rejected' | 'all'; page?: number; limit?: number }) => {
  const page = params?.page || 1
  const limit = params?.limit || 20
  const status = params?.status || 'all'
  const search = (params?.search || '').trim()
  const resp = await apiClient.get('/affiliates', { params: { page, limit, status, search } })
  const data = resp?.data || {}
  return {
    affiliates: data.affiliates || [],
    total: data.total || 0,
    page: data.page || page,
    totalPages: data.totalPages || Math.max(1, Math.ceil((data.total || 0) / (limit || 1)))
  }
}

export const adminUpdateCommissionRate = async (affiliateId: string, rate: number) => {
  await apiClient.patch(`/affiliates/${affiliateId}/commission-rate`, { rate })
}

export const adminGetAffiliatesSummary = async (): Promise<{ total_affiliates: number; total_commissions: number; pending_payouts: number }> => {
  try {
    const resp = await apiClient.get('/affiliates/summary')
    return {
      total_affiliates: resp?.data?.total_affiliates || 0,
      total_commissions: resp?.data?.total_commissions || 0,
      pending_payouts: resp?.data?.pending_payouts || 0,
    }
  } catch (err: any) {
    console.warn('Falha ao obter resumo de afiliados:', err?.message || err)
    return { total_affiliates: 0, total_commissions: 0, pending_payouts: 0 }
  }
}

export const getAffiliateCommissions = async (code: string): Promise<AffiliateCommission[]> => {
  try {
    const resp = await apiClient.get(`/affiliates/commissions/${code}`)
    const list = resp?.data?.commissions || []
    return list as AffiliateCommission[]
  } catch (err: any) {
    console.warn('Falha geral ao buscar comissões do afiliado:', err?.message || err)
    return []
  }
}

export interface AffiliateCommission {
  id: string
  order_id?: string
  product_id?: string
  commission_amount?: number
  status?: string
  created_at?: string
}

export interface AffiliateStatsSummary {
  clicks: number
  orders: number
  commissions_pending: number
  total_commission_amount: number
}

export const getAffiliateStatsSummary = async (code: string): Promise<AffiliateStatsSummary> => {
  try {
    const resp = await apiClient.get(`/affiliates/stats/${code}`)
    return {
      clicks: resp?.data?.clicks ?? 0,
      orders: resp?.data?.orders ?? 0,
      commissions_pending: resp?.data?.commissions_pending ?? 0,
      total_commission_amount: resp?.data?.total_commission_amount ?? 0,
    }
  } catch (err: any) {
    console.warn('Falha ao obter resumo do afiliado:', err?.message || err)
    return { clicks: 0, orders: 0, commissions_pending: 0, total_commission_amount: 0 }
  }
}