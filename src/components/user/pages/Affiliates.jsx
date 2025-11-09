import React, { useEffect, useState } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { getMyAffiliateProfile, getAffiliateStatsSummary, getAffiliateCommissions, requestAffiliateActivation } from '../../../services/affiliates'
import { apiClient } from '../../../lib/api'
import { Copy, Link as LinkIcon, BarChart3, CheckCircle, AlertCircle, Hourglass, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const Affiliates = () => {
  const { userProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)
  const [userId, setUserId] = useState(null)
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [copied, setCopied] = useState(false)
const [products, setProducts] = useState([])
const [commissions, setCommissions] = useState([])
const [copiedProductId, setCopiedProductId] = useState(null)
const [filterPeriod, setFilterPeriod] = useState('30d')
const [filterStatus, setFilterStatus] = useState('all')
// helpers e estados de ordenação
const formatBRL = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0))
const [groupSortField, setGroupSortField] = useState('totalAmount')
const [groupSortDir, setGroupSortDir] = useState('desc')
const [sortField, setSortField] = useState('date')
const [sortDir, setSortDir] = useState('desc')
const toggleGroupSort = (field) => {
  setGroupSortField(field)
  setGroupSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'))
}
const toggleSort = (field) => {
  setSortField(field)
  setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'))
}
  const navigate = useNavigate()

  const lastUserIdRef = React.useRef(null)

  useEffect(() => {
    const resolveUserId = async () => {
      // Usar o ID já resolvido pela AuthProvider (tabela users.id quando disponível)
      const uid = userProfile?.id || null
      if (uid === lastUserIdRef.current) {
        setLoading(false)
        return
      }
      lastUserIdRef.current = uid
      setUserId(uid)
      if (!uid) {
        setLoading(false)
        return
      }
      const p = await getMyAffiliateProfile(uid)
      setProfile(p)
      const label = (p?.status || (p?.is_active ? 'active' : 'pending'))?.toLowerCase()
      if (p?.code) {
        const s = await getAffiliateStatsSummary(p.code)
        setStats(s)
        // Carregar produtos independentemente do status de afiliação
         try {
           const resp = await apiClient.get('/store/products')
           setProducts(resp.data?.products || [])
         } catch (e) {
           console.warn('Falha ao buscar produtos para afiliado:', e?.message || e)
         }
         if (label === 'active' || p?.is_active) {
           try {
             const list = await getAffiliateCommissions(p.code)
             setCommissions(list || [])
           } catch (e) {
             console.warn('Falha ao buscar comissões do afiliado:', e?.message || e)
           }
         } else {
           setCommissions([])
         }
       } else {
         setStats(null)
         // Carregar produtos mesmo sem código de afiliado
         try {
           const resp = await apiClient.get('/store/products')
           setProducts(resp.data?.products || [])
         } catch (e) {
           console.warn('Falha ao buscar produtos (sem código):', e?.message || e)
         }
      }
      setLoading(false)
    }
    resolveUserId()
  })

  const programUrl = `${window.location.origin}/?aff=${profile?.code || ''}`

  const copyTextWithFallback = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      try {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.setAttribute('readonly', '')
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        const ok = document.execCommand('copy')
        document.body.removeChild(ta)
        if (ok) return true
      } catch {}
      try {
        window.prompt('Copie seu link de afiliado:', text)
      } catch {}
      return false
    }
  }

  const copyLink = async () => {
    try {
      const ok = await copyTextWithFallback(programUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const copyProductLink = async (productId) => {
    const code = profile?.code || ''
    const link = `${window.location.origin}/store?aff=${code}&product=${encodeURIComponent(productId)}`
    try {
      const ok = await copyTextWithFallback(link)
      setCopiedProductId(productId)
      setTimeout(() => setCopiedProductId(null), 1500)
    } catch {}
  }

  const requestActivation = async () => {
    if (!userId) return
    try {
      setRequesting(true)
      await requestAffiliateActivation(userId)
      // Recarregar perfil após solicitar
      const p = await getMyAffiliateProfile(userId)
      setProfile(p)
    } catch (err) {
      alert('Falha ao solicitar afiliação: ' + (err?.message || err))
    } finally {
      setRequesting(false)
    }
  }

  const statusLabel = profile?.status || (profile?.is_active ? 'active' : 'pending')

  const filteredCommissions = React.useMemo(() => {
    const now = Date.now()
    const periodDays = filterPeriod === '7d' ? 7 : filterPeriod === '30d' ? 30 : filterPeriod === '90d' ? 90 : null
    const minTimestamp = periodDays ? now - periodDays * 24 * 60 * 60 * 1000 : null
    return (commissions || []).filter(c => {
      const status = (c.status || '').toString().toLowerCase()
      const createdAt = c.created_at ? new Date(c.created_at).getTime() : null
      const statusOk = filterStatus === 'all' ? true : status === filterStatus
      const periodOk = minTimestamp ? (createdAt ? createdAt >= minTimestamp : false) : true
      return statusOk && periodOk
    })
  }, [commissions, filterPeriod, filterStatus])

  const groupedTotals = React.useMemo(() => {
    const map = new Map()
    for (const c of filteredCommissions) {
      const key = String(c.product_id || '')
      if (!map.has(key)) {
        map.set(key, { productId: c.product_id, totalAmount: 0, count: 0, paid: 0, pending: 0 })
      }
      const entry = map.get(key)
      const amount = typeof c.commission_amount === 'number' ? c.commission_amount : 0
      entry.totalAmount += amount
      entry.count += 1
      const st = (c.status || '').toString().toLowerCase()
      if (st === 'paid') entry.paid += 1
      else if (st === 'pending') entry.pending += 1
      map.set(key, entry)
    }
    return Array.from(map.values())
  }, [filteredCommissions])

  const sortedGroupedTotals = React.useMemo(() => {
    const arr = [...groupedTotals]
    return arr.sort((a, b) => {
      const field = groupSortField
      const dir = groupSortDir === 'asc' ? 1 : -1
      if (field === 'product') {
        const pa = products.find(x => String(x.id) === String(a.productId))
        const pb = products.find(x => String(x.id) === String(b.productId))
        const av = (pa?.name || pa?.title || '').toString().toLowerCase()
        const bv = (pb?.name || pb?.title || '').toString().toLowerCase()
        if (av < bv) return -1 * dir
        if (av > bv) return 1 * dir
        return 0
      } else {
        const av = a[field] ?? 0
        const bv = b[field] ?? 0
        return (av - bv) * dir
      }
    })
  }, [groupedTotals, groupSortField, groupSortDir, products])

  // Produtos com afiliação habilitada
  const affProducts = React.useMemo(() => (products || []), [products])

  // Resolver chave única do produto para cópia/feedback
  const getProdKey = (prod) => {
    const k = prod?.id ?? prod?.product_id ?? prod?.uuid ?? prod?.sku ?? null
    return k != null ? String(k) : null
  }

  // Obter a % de comissão do produto (ou padrão do afiliado)
  const getCommissionPercent = (prod) => {
      const parseNum = (v) => {
        if (typeof v === 'number') return v
        if (typeof v === 'string') {
          const s = v.trim().replace('%', '').replace(',', '.')
          const n = parseFloat(s)
          return isNaN(n) ? null : n
        }
        return null
      }
      const candidates = [
        prod?.affiliate_rate_percent,
        prod?.affiliate_commission_percent,
        prod?.commission_percent,
        prod?.affiliate_rate,
        prod?.affiliateRatePercent,
        prod?.affiliateCommissionPercent,
        prod?.commissionPercent,
        prod?.commission_rate,
        prod?.commissionRate,
      ]
      for (const v of candidates) {
        const num = parseNum(v)
        if (typeof num === 'number') return num
      }
      const defaultRate = parseNum(profile?.commission_rate_default)
      return typeof defaultRate === 'number' ? defaultRate : null
    }

    const getCommissionAmount = (prod) => {
      const pct = getCommissionPercent(prod)
      const priceRaw = (typeof prod?.price !== 'undefined' ? prod.price : (typeof prod?.amount !== 'undefined' ? prod.amount : null))
      const price = typeof priceRaw === 'number' ? priceRaw : (typeof priceRaw === 'string' && !isNaN(Number(priceRaw)) ? Number(priceRaw) : null)
      if (typeof pct === 'number' && typeof price === 'number') {
        return (price * pct) / 100
      }
      return null
    }
 
     // Verificar se afiliação está habilitada para o produto (várias chaves)
     const isProductAffiliateEnabled = (prod) => {
     const keys = ['affiliate_enabled', 'affiliateEnabled', 'allow_affiliate', 'allowAffiliate']
     for (const k of keys) {
       const v = prod?.[k]
       if (typeof v !== 'undefined') {
         if (typeof v === 'string') {
           const s = v.trim().toLowerCase()
           if (['false', '0', 'no', 'off'].includes(s)) return false
           if (['true', '1', 'yes', 'on'].includes(s)) return true
           return !!s
         }
         return !!v
       }
     }
     // Padrão: habilitado quando não há flag explícita no produto
     return true
   }
 
   // Gerar link (auto-gerar código se necessário)
  const [affActionLoading, setAffActionLoading] = useState(false)
  const handleAffiliateClick = async (prod) => {
     if (!isProductAffiliateEnabled(prod)) return
     if (affActionLoading) return
    setAffActionLoading(true)
    try {
      const pid = getProdKey(prod)
      if (!profile?.code) {
        if (userProfile?.id) {
          try {
            await requestAffiliateActivation(userProfile.id)
            // re-carregar perfil para obter código
            const refreshed = await getMyAffiliateProfile(userProfile.id)
            setProfile(refreshed)
            const code = refreshed?.code || profile?.code || ''
            if (pid) {
              await copyProductLink(pid)
            } else {
              await copyTextWithFallback(`${window.location.origin}/?aff=${code}`)
              setCopiedProductId(getProdKey(prod) || 'program')
              setTimeout(() => setCopiedProductId(null), 1500)
            }
          } catch (e) {
            console.warn('Falha ao gerar código de afiliado:', e?.message || e)
            // Mesmo em caso de falha, fornecer feedback com link do programa (sem código)
            if (pid) {
              await copyProductLink(pid)
            } else {
              await copyTextWithFallback(`${window.location.origin}/?aff=`)
              setCopiedProductId(getProdKey(prod) || 'program')
              setTimeout(() => setCopiedProductId(null), 1500)
            }
          }
        }
      } else {
        if (pid) {
          await copyProductLink(pid)
        } else {
          await copyTextWithFallback(programUrl)
          setCopiedProductId(getProdKey(prod) || 'program')
          setTimeout(() => setCopiedProductId(null), 1500)
        }
      }
    } finally {
      setAffActionLoading(false)
    }
  }

  // Ordenação de comissões detalhadas
  const sortedCommissions = React.useMemo(() => {
    const arr = [...filteredCommissions]
    return arr.sort((a, b) => {
      let va, vb
      switch (sortField) {
        case 'product': {
          const pa = products.find(x => String(x.id) === String(a.product_id))
          const pb = products.find(x => String(x.id) === String(b.product_id))
          va = (pa?.name || pa?.title || '').toString().toLowerCase()
          vb = (pb?.name || pb?.title || '').toString().toLowerCase()
          break
        }
        case 'amount':
          va = typeof a.commission_amount === 'number' ? a.commission_amount : 0
          vb = typeof b.commission_amount === 'number' ? b.commission_amount : 0
          break
        case 'status':
          va = (a.status || '').toString().toLowerCase()
          vb = (b.status || '').toString().toLowerCase()
          break
        case 'date':
        default:
          va = a.created_at ? new Date(a.created_at).getTime() : 0
          vb = b.created_at ? new Date(b.created_at).getTime() : 0
      }
      const cmp = typeof va === 'string' ? va.localeCompare(vb) : (va - vb)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filteredCommissions, sortField, sortDir, products])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-2 text-gray-600">Carregando...</span>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Programa de Afiliados</h1>

      {!profile && (
        <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200 text-yellow-800 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5" />
              <div>
                <p className="font-medium">Você ainda não está no programa de afiliados.</p>
                <p className="text-sm">Solicite acesso e aguarde aprovação do admin. Após ativado, seu código aparecerá aqui.</p>
              </div>
            </div>
            <button
              onClick={requestActivation}
              disabled={requesting}
              className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-300"
            >{requesting ? 'Solicitando...' : 'Solicitar afiliação'}</button>
          </div>
        </div>
      )}

      {profile && (
        <div className="space-y-6">
          <div className="p-4 border rounded-lg bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Seu código</p>
                <p className="text-xl font-semibold">{profile.code}</p>
              </div>
              <div className="flex items-center">
                {statusLabel === 'active' && (
                  <span className="text-green-600 flex items-center"><CheckCircle className="h-5 w-5 mr-1" />Ativo</span>
                )}
                {statusLabel === 'pending' && (
                  <span className="text-amber-600 flex items-center"><Hourglass className="h-5 w-5 mr-1" />Pendente de aprovação</span>
                )}
                {statusLabel === 'rejected' && (
                  <span className="text-gray-600 flex items-center"><XCircle className="h-5 w-5 mr-1" />Rejeitado</span>
                )}
              </div>
            </div>
          </div>

          {(statusLabel === 'active') && (
            <div className="p-4 border rounded-lg bg-white shadow-sm">
              <p className="text-gray-600 mb-2">Seu link de indicação</p>
              <div className="flex items-center">
                <div className="flex-1 px-3 py-2 border rounded-md bg-gray-50 text-sm truncate">
                  {programUrl}
                </div>
                <button onClick={copyLink} className="ml-3 px-3 py-2 bg-primary-600 text-white rounded-md flex items-center">
                  <Copy className="h-4 w-4 mr-2" />
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 flex items-center">
                <LinkIcon className="h-4 w-4 mr-1" />Cole este link em suas redes e conteúdos.
              </p>
            </div>
          )}

          {stats && (
            <div className="p-4 border rounded-lg bg-white shadow-sm">
              <div className="flex items-center mb-3">
                <BarChart3 className="h-5 w-5 mr-2 text-primary-600" />
                <h2 className="font-semibold">Resumo</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-gray-50 rounded-md text-center">
                    <p className="text-xs text-gray-600">Cliques</p>
                    <p className="text-lg font-bold">{stats.clicks}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-md text-center">
                    <p className="text-xs text-gray-600">Pedidos</p>
                    <p className="text-lg font-bold">{stats.orders}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-md text-center">
                    <p className="text-xs text-gray-600">Comissões pendentes</p>
                    <p className="text-lg font-bold">{stats.commissions_pending}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-md text-center">
                    <p className="text-xs text-gray-600">Total comissões</p>
                    <p className="text-lg font-bold">{formatBRL(stats.total_commission_amount)}</p>
                  </div>
                </div>
            </div>
          )}

          {(statusLabel === 'active' || profile?.is_active || true) && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-3">Produtos para divulgar</h3>
              {affProducts.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhum produto encontrado.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {affProducts.map(prod => (
                    <div key={prod.id} className="border rounded-lg p-3 bg-white shadow-sm">
                      <div className="flex items-center gap-3">
                        {(prod.image || (prod.images && prod.images[0])) && (
                          <img src={prod.image || (prod.images && prod.images[0])} alt={prod.name || prod.title || `Produto #${prod.id}`} className="w-14 h-14 object-cover rounded" />
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{prod.name || prod.title || `Produto #${prod.id}`}</div>
                          {/* Linha combinada: preço, comissão e estimativa */}
                           <div className="text-xs text-gray-700 mt-0.5">
                             {(() => {
                               const parts = []
                               const priceRaw = (typeof prod?.price !== 'undefined' ? prod.price : (typeof prod?.amount !== 'undefined' ? prod.amount : null))
                               const price = typeof priceRaw === 'number' ? priceRaw : (typeof priceRaw === 'string' && !isNaN(Number(priceRaw)) ? Number(priceRaw) : null)
                               if (typeof price === 'number') parts.push(`Preço: ${formatBRL(price)}`)
                               const pct = getCommissionPercent(prod)
                               if (typeof pct === 'number') {
                                 parts.push(`Comissão: ${pct}%`)
                               } else {
                                 parts.push('Comissão definida pelo admin')
                               }
                               const amt = getCommissionAmount(prod)
                               if (typeof amt === 'number') parts.push(`Estimativa: até ${formatBRL(amt)} por venda`)
                               return parts.length > 0 ? parts.join(' • ') : 'Comissão definida pelo admin'
                             })()}
                           </div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <button
                            onClick={() => handleAffiliateClick(prod)}
                            disabled={!isProductAffiliateEnabled(prod) || affActionLoading}
                            className={`inline-flex items-center gap-2 px-3 py-2 text-sm rounded ${
                              isProductAffiliateEnabled(prod) && !affActionLoading
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            }`}
                          >
                            <LinkIcon className="w-4 h-4" />
                            {affActionLoading
                              ? 'Gerando...'
                              : copiedProductId === (getProdKey(prod) || 'program')
                                ? 'Link copiado!'
                                : (isProductAffiliateEnabled(prod)
                                    ? (profile?.code ? 'Gerar link de afiliado' : 'Gerar código e link')
                                    : 'Afiliação desabilitada')}
                          </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {(statusLabel === 'active' || profile?.is_active) && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-3">Meus ganhos por produto</h3>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <label className="text-sm text-gray-600">Período:</label>
                <select value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)} className="px-2 py-1 border rounded">
                  <option value="7d">Últimos 7 dias</option>
                  <option value="30d">Últimos 30 dias</option>
                  <option value="90d">Últimos 90 dias</option>
                  <option value="all">Todo período</option>
                </select>
                <label className="text-sm text-gray-600 ml-4">Status:</label>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-2 py-1 border rounded">
                  <option value="all">Todos</option>
                  <option value="pending">Pendentes</option>
                  <option value="paid">Pagas</option>
                  <option value="rejected">Rejeitadas</option>
                </select>
              </div>

              {groupedTotals.length > 0 && (
                <div className="overflow-x-auto mb-6">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="py-2 pr-4 cursor-pointer" onClick={() => toggleGroupSort('product')}>Produto</th>
                        <th className="py-2 pr-4 cursor-pointer" onClick={() => toggleGroupSort('totalAmount')}>Total comissões</th>
                        <th className="py-2 pr-4 cursor-pointer" onClick={() => toggleGroupSort('count')}>Quantidade</th>
                        <th className="py-2 pr-4 cursor-pointer" onClick={() => toggleGroupSort('paid')}>Pagas</th>
                        <th className="py-2 pr-4 cursor-pointer" onClick={() => toggleGroupSort('pending')}>Pendentes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedGroupedTotals.map(g => {
                        const p = products.find(x => String(x.id) === String(g.productId))
                        const name = p?.name || p?.title || (g.productId ? `Produto #${g.productId}` : '—')
                        return (
                          <tr key={g.productId || 'na'} className="border-b">
                            <td className="py-2 pr-4">{name}</td>
                            <td className="py-2 pr-4">{formatBRL(g.totalAmount)}</td>
                            <td className="py-2 pr-4">{g.count}</td>
                            <td className="py-2 pr-4">{g.paid}</td>
                            <td className="py-2 pr-4">{g.pending}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {filteredCommissions.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhuma comissão encontrada para os filtros aplicados.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="py-2 pr-4 cursor-pointer" onClick={() => toggleSort('product')}>Produto</th>
                        <th className="py-2 pr-4 cursor-pointer" onClick={() => toggleSort('amount')}>Comissão</th>
                        <th className="py-2 pr-4 cursor-pointer" onClick={() => toggleSort('status')}>Status</th>
                        <th className="py-2 pr-4 cursor-pointer" onClick={() => toggleSort('date')}>Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedCommissions.map((c) => {
                        const p = products.find(x => String(x.id) === String(c.product_id))
                        const name = p?.name || p?.title || (c.product_id ? `Produto #${c.product_id}` : '—')
                        const amount = typeof c.commission_amount === 'number' ? c.commission_amount : 0
                        const status = (c.status || '').toString().toLowerCase()
                        const date = c.created_at ? new Date(c.created_at).toLocaleString() : '—'
                        return (
                          <tr key={c.id} className="border-b">
                            <td className="py-2 pr-4">{name}</td>
                            <td className="py-2 pr-4">{formatBRL(amount)}</td>
                            <td className="py-2 pr-4 capitalize">{status || '—'}</td>
                            <td className="py-2 pr-4">{date}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Affiliates