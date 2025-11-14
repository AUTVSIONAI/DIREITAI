import React, { useEffect, useState } from 'react'
import { DollarSign, RefreshCw, Download, CreditCard, LineChart, PieChart } from 'lucide-react'
import { apiClient } from '../../../lib/api'

const fmtDate = (d) => d.toISOString().slice(0,10)

const FinancialReports = () => {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const [startDate, setStartDate] = useState(fmtDate(startOfMonth))
  const [endDate, setEndDate] = useState(fmtDate(now))
  const [method, setMethod] = useState('all')
  const [paymentStatus, setPaymentStatus] = useState('paid')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [overview, setOverview] = useState(null)
  const [monthlyRevenue, setMonthlyRevenue] = useState([])
  const [transactions, setTransactions] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [creditsTransactions, setCreditsTransactions] = useState([])
  const [creditsRevenue, setCreditsRevenue] = useState(0)

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const qs = (params) => new URLSearchParams(params).toString()
      const overviewReq = apiClient.get(`/stripeapi/admin/financial/overview?${qs({ start_date: startDate, end_date: endDate })}`)
      const monthlyReq = apiClient.get(`/stripeapi/admin/financial/monthly-revenue?${qs({ start_date: startDate, end_date: endDate })}`)
      const txReq = apiClient.get(`/stripeapi/admin/financial/transactions?${qs({ start_date: startDate, end_date: endDate, limit: 100, method: method !== 'all' ? method : '' })}`)
      const topReq = apiClient.get(`/stripeapi/admin/financial/top-products?${qs({ start_date: startDate, end_date: endDate, payment_status: paymentStatus, limit: 50 })}`)
      const creditsReq = apiClient.get(`/stripeapi/payments/credits/transactions?${qs({ start_date: startDate, end_date: endDate, limit: 100 })}`)
      const [overviewRes, monthlyRes, txRes, topRes, creditsRes] = await Promise.all([overviewReq, monthlyReq, txReq, topReq, creditsReq])
      const ovRaw = overviewRes?.data
      const ov = ovRaw?.data || ovRaw || null
      setOverview(ov)
      const mRaw = monthlyRes?.data
      setMonthlyRevenue(Array.isArray(mRaw?.data) ? mRaw.data : Array.isArray(mRaw) ? mRaw : [])
      const tRaw = txRes?.data
      const tList = tRaw?.data?.transactions || tRaw?.transactions || []
      setTransactions(Array.isArray(tList) ? tList : [])
      const tpRaw = topRes?.data
      setTopProducts(Array.isArray(tpRaw?.data) ? tpRaw.data : Array.isArray(tpRaw) ? tpRaw : [])
      const cRaw = creditsRes?.data
      const cList = Array.isArray(cRaw?.data) ? cRaw.data : Array.isArray(cRaw) ? cRaw : []
      setCreditsTransactions(cList)
      setCreditsRevenue(Array.isArray(cList) ? cList.reduce((s, t) => s + Number(t.amount || 0), 0) : 0)
    } catch (e) {
      setError('Erro ao carregar dados financeiros')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])
  useEffect(() => { loadData() }, [startDate, endDate, method, paymentStatus])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="p-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded">DEBUG: Nova página de Relatórios integrada ao Stripe</div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Relatórios Financeiros</h2>
          <p className="text-gray-600">Receita e transações reais do Stripe</p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg" />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg" />
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg">
            <option value="all">Método: Todos</option>
            <option value="card">Cartão</option>
            <option value="pix">PIX</option>
            <option value="boleto">Boleto</option>
            <option value="other">Outros</option>
          </select>
          <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg">
            <option value="paid">Pagos</option>
            <option value="unpaid">Não pagos</option>
            <option value="refunded">Reembolsos</option>
          </select>
          <button onClick={loadData} className="btn-primary flex items-center"><RefreshCw className="h-4 w-4 mr-2" />Atualizar</button>
          <button className="btn-secondary flex items-center"><Download className="h-4 w-4 mr-2" />Exportar</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Receita Total</p>
              <p className="text-2xl font-bold text-gray-900">R$ {(overview?.totalRevenue ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
              <p className="text-2xl font-bold text-gray-900">R$ {(overview?.averageOrderValue ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <CreditCard className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Receita de Créditos</p>
              <p className="text-2xl font-bold text-gray-900">R$ {creditsRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <CreditCard className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Evolução da Receita</h3>
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <LineChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <div className="text-sm text-gray-600">
                {(monthlyRevenue || []).slice(-6).map((m) => (
                  <div key={m.month} className="flex items-center justify-between">
                    <span>{m.month}</span>
                    <span>R$ {Number(m.revenue || 0).toLocaleString('pt-BR')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Produtos mais vendidos</h3>
          </div>
          <div className="h-64 bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-center mb-2">
              <PieChart className="h-12 w-12 text-gray-400" />
            </div>
            <div className="space-y-2">
              {(topProducts || []).slice(0,8).map((p) => (
                <div key={p.name} className="flex items-center justify-between text-sm">
                  <span>{p.name}</span>
                  <span>R$ {Number(p.revenue || 0).toLocaleString('pt-BR')}</span>
                </div>
              ))}
              {(topProducts || []).length === 0 && (
                <div className="text-center text-gray-500">Sem dados no período</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Transações</h3>
        </div>
        <div className="space-y-2">
          {(transactions || []).slice(0,20).map((t) => (
            <div key={t.id} className="flex items-center justify-between text-sm">
              <span>{new Date(t.date).toLocaleString('pt-BR')}</span>
              <span className="font-medium">R$ {Number(t.amount || 0).toFixed(2)}</span>
              <span className="text-gray-600">{t.method}</span>
              <span className="text-green-600">{t.status}</span>
            </div>
          ))}
          {(transactions || []).length === 0 && (
            <div className="text-center text-gray-500">Sem transações no período</div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Créditos vendidos</h3>
        </div>
        <div className="space-y-2">
          {(creditsTransactions || []).slice(0,10).map((t) => (
            <div key={t.id} className="flex items-center justify-between text-sm">
              <span>{new Date(t.createdAt).toLocaleString('pt-BR')}</span>
              <span className="font-medium">R$ {Number(t.amount || 0).toFixed(2)}</span>
              <span className="text-gray-600">{t.method}</span>
              <span className="text-green-600">{t.status}</span>
            </div>
          ))}
          {(creditsTransactions || []).length === 0 && (
            <div className="text-center text-gray-500">Sem transações de créditos no período</div>
          )}
        </div>
      </div>

      {error && (
        <div className="text-center py-12 text-red-600">{error}</div>
      )}
    </div>
  )
}

export default FinancialReports
