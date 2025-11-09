import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, Users, DollarSign, Eye } from 'lucide-react'
import { adminApproveAffiliate, adminRejectAffiliate, adminSetAffiliateActive, adminListAffiliates, adminGetAffiliatesSummary } from '../../../services/affiliates'

const AffiliatesAdmin = () => {
  const [loading, setLoading] = useState(true)
  const [affiliates, setAffiliates] = useState([])
  const [summary, setSummary] = useState({ total_affiliates: 0, total_commissions: 0, pending_payouts: 0 })

  const loadData = async () => {
    setLoading(true)
    try {
      const { affiliates: list } = await adminListAffiliates({ status: 'all', page: 1, limit: 50 })
      setAffiliates(list || [])
    } catch (err) {
      console.warn('Erro ao listar afiliados via backend:', err?.message || err)
      setAffiliates([])
    }

    try {
      const s = await adminGetAffiliatesSummary()
      setSummary(s)
    } catch (err) {
      console.warn('Erro ao obter resumo de afiliados:', err?.message || err)
      setSummary({ total_affiliates: 0, total_commissions: 0, pending_payouts: 0 })
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleApprove = async (id) => {
    try {
      await adminApproveAffiliate(id)
      await loadData()
    } catch (err) {
      alert('Falha ao aprovar: ' + (err?.message || err))
    }
  }

  const handleReject = async (id) => {
    try {
      await adminRejectAffiliate(id)
      await loadData()
    } catch (err) {
      alert('Falha ao rejeitar: ' + (err?.message || err))
    }
  }

  const handleToggleActive = async (id, currentActive) => {
    try {
      await adminSetAffiliateActive(id, !currentActive)
      await loadData()
    } catch (err) {
      alert('Falha ao alterar status: ' + (err?.message || err))
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Afiliados</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 border rounded-lg bg-white shadow-sm flex items-center">
          <Users className="h-6 w-6 text-primary-600 mr-3" />
          <div>
            <p className="text-sm text-gray-600">Total afiliados</p>
            <p className="text-xl font-semibold">{summary.total_affiliates}</p>
          </div>
        </div>
        <div className="p-4 border rounded-lg bg-white shadow-sm flex items-center">
          <DollarSign className="h-6 w-6 text-green-600 mr-3" />
          <div>
            <p className="text-sm text-gray-600">Comissões</p>
            <p className="text-xl font-semibold">R$ {Number(summary.total_commissions || 0).toFixed(2)}</p>
          </div>
        </div>
        <div className="p-4 border rounded-lg bg-white shadow-sm flex items-center">
          <BarChart3 className="h-6 w-6 text-amber-600 mr-3" />
          <div>
            <p className="text-sm text-gray-600">Payouts pendentes</p>
            <p className="text-xl font-semibold">R$ {Number(summary.pending_payouts || 0).toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-lg shadow-sm">
        <table className="min-w-full">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="px-4 py-2">Código</th>
              <th className="px-4 py-2">Usuário</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {affiliates.map(a => (
              <tr key={a.id} className="border-t">
                <td className="px-4 py-2 font-mono">{a.code || '—'}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{a.user_display_name || a.user_id}</div>
                      <div className="text-xs text-gray-500">{a.user_email || 'Email não informado'}</div>
                    </div>
                    <Link
                      to={`/admin/users?search=${encodeURIComponent(a.user_email || a.user_display_name || '')}`}
                      className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                    >
                      <Eye className="h-4 w-4 mr-1" /> Ver perfil
                    </Link>
                  </div>
                </td>
                <td className={`px-4 py-2`}>
                  <span className={`px-2 py-1 rounded text-xs ${a.is_active ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{a.is_active ? 'active' : 'pending'}</span>
                </td>
                <td className="px-4 py-2">
                  <div className="flex gap-2">
                    {!a.is_active && (
                      <button
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded"
                        onClick={() => handleApprove(a.id)}
                      >Aprovar</button>
                    )}
                    {!a.is_active && (
                      <button
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded"
                        onClick={() => handleReject(a.id)}
                      >Rejeitar</button>
                    )}
                    <button
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded"
                      onClick={() => handleToggleActive(a.id, a.is_active)}
                    >{a.is_active ? 'Desativar' : 'Ativar'}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AffiliatesAdmin