import React, { Suspense, lazy, useMemo, useState, useEffect } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { supabase } from '../../../lib/supabase'
import { Shield } from 'lucide-react'

const Agents = lazy(() => import('./Agents'))
const AffiliatesAdmin = lazy(() => import('../../admin/pages/AffiliatesAdmin'))
const BlogManagement = lazy(() => import('../../admin/pages/BlogManagement'))
const RatingsManagement = lazy(() => import('../../admin/pages/RatingsManagement'))
const SurveysManagement = lazy(() => import('../../admin/pages/SurveysManagement'))
const ContentModeration = lazy(() => import('../../admin/pages/ContentModeration'))
const PoliticiansManagement = lazy(() => import('../../admin/pages/PoliticiansManagement'))
const EventManagement = lazy(() => import('../../admin/pages/EventManagement'))
const UnifiedLiveMap = lazy(() => import('../../admin/pages/UnifiedLiveMap'))

const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
)

const RoleAdmin = () => {
  const { userProfile } = useAuth()
  const role = String(userProfile?.role || '').toLowerCase()
  const plan = String(userProfile?.plan || 'gratuito').toLowerCase()
  
  const [localPoliticianId, setLocalPoliticianId] = useState(userProfile?.politician_id || null)
  const [loadingPoliticianId, setLoadingPoliticianId] = useState(false)

  useEffect(() => {
    if (userProfile?.politician_id) {
      setLocalPoliticianId(userProfile.politician_id)
    } else if (role === 'politician' && userProfile?.id) {
      const fetchId = async () => {
        setLoadingPoliticianId(true)
        try {
          const { data, error } = await supabase
            .from('politicians')
            .select('id')
            .eq('email', userProfile.email)
            .maybeSingle() // Use maybeSingle instead of single to avoid 406 if multiple (shouldn't happen) or null if none
          
          if (!error && data) {
             setLocalPoliticianId(data.id)
          }
        } catch (e) {
          console.error('Erro ao buscar ID do político:', e)
        } finally {
          setLoadingPoliticianId(false)
        }
      }
      fetchId()
    }
  }, [userProfile, role])

  const myPoliticianId = localPoliticianId
  const myParty = userProfile?.party

  const tierOrder = { gratuito: 0, patriota: 1, cidadao: 2, cidadão: 2, premium: 3, pro: 4, elite: 5 }
  const tier = tierOrder[plan] ?? 0

  const baseByRole = {
    journalist: ['blog'],
    politician: ['agents', 'ratings', 'politicians'],
    party: ['politicians', 'ratings', 'surveys'],
    admin: ['all'],
    super_admin: ['all']
  }

  const tierUnlocks = {
    journalist: {
      0: ['blog'],
      1: ['blog'],
      2: ['blog'],
      5: ['blog']
    },
    politician: {
      0: ['agents', 'ratings', 'politicians'],
      1: ['agents', 'ratings', 'politicians'],
      2: ['agents', 'ratings', 'politicians'],
      3: ['agents', 'ratings', 'politicians'],
      4: ['agents', 'ratings', 'politicians'],
      5: ['agents', 'ratings', 'politicians']
    },
    party: {
      0: ['politicians', 'ratings', 'surveys'],
      1: ['politicians', 'ratings', 'surveys'],
      2: ['politicians', 'ratings', 'surveys'],
      3: ['politicians', 'ratings', 'surveys'],
      5: ['politicians', 'ratings', 'surveys']
    }
  }

  const can = (section) => {
    if (!section) return false
    if (baseByRole[role]?.includes('all')) return true
    const base = new Set(baseByRole[role] || [])
    const unlocks = new Set((tierUnlocks[role]?.[tier] || []))
    const allowed = new Set([...base, ...unlocks])
    return allowed.has(section)
  }

  const modules = useMemo(() => {
    const list = []
    
    // Props de escopo
    const isPolitician = role === 'politician'
    const isParty = role === 'party'
    const isJournalist = role === 'journalist'

    if (can('agents')) list.push({ 
      key: 'agents', 
      title: isPolitician ? 'Meu Agente IA' : 'Agentes IA', 
      component: <Agents onlyMyAgent={isPolitician} /> 
    })
    
    if (can('events')) list.push({ key: 'events', title: 'Eventos', component: <EventManagement /> })
    if (can('unified-map')) list.push({ key: 'unified-map', title: 'Mapa ao Vivo', component: <UnifiedLiveMap /> })
    if (can('affiliates')) list.push({ key: 'affiliates', title: 'Afiliados', component: <AffiliatesAdmin /> })
    
    if (can('politicians')) {
       // Removido bloqueio estrito se myPoliticianId for nulo, permitindo renderizar o componente
       // que agora lida internamente com o estado de loading/erro se necessário
       list.push({ 
         key: 'politicians', 
         title: isPolitician ? 'Perfil Político' : 'Políticos', 
         component: <PoliticiansManagement 
           limitToPoliticianId={isPolitician ? myPoliticianId : null}
           limitToParty={isParty ? (myParty || 'UNKNOWN_PARTY') : null}
           isPoliticianView={isPolitician}
         /> 
       })
    }
    
    if (can('blog')) list.push({ 
      key: 'blog', 
      title: 'Blog Patriota', 
      component: <BlogManagement onlyMyPosts={isJournalist} /> 
    })
    
    if (can('ratings')) {
      // Removido bloqueio estrito para permitir que RatingsManagement tente resolver ou mostre estado vazio
      list.push({ 
        key: 'ratings', 
        title: isPolitician ? 'Minhas Avaliações' : 'Avaliações', 
        component: <RatingsManagement 
          limitToPoliticianId={isPolitician ? myPoliticianId : null}
          limitToParty={isParty ? (myParty || 'UNKNOWN_PARTY') : null}
          isPoliticianView={isPolitician}
        /> 
      })
    }
    
    if (can('surveys')) list.push({ key: 'surveys', title: 'Pesquisas DireitaJá', component: <SurveysManagement /> })
    if (can('moderation')) list.push({ key: 'moderation', title: 'Moderação', component: <ContentModeration /> })
    
    return list
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, plan, myPoliticianId, myParty])

  if (modules.length === 0) {
    if (loadingPoliticianId) {
      return <PageLoader />
    }
    
    // Se não tiver módulos mas for político sem ID, ainda tenta renderizar
    // para permitir que o usuário veja algo ou contate suporte,
    // mas a lógica acima (dentro do useMemo) já deve ter adicionado os módulos
    // se as permissões estiverem corretas.
    
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-10 h-10 text-red-500 mx-auto mb-2" />
          <div className="text-xl font-bold text-gray-900 mb-1">Sem módulos administrativos</div>
          <div className="text-gray-600">Seu plano atual não inclui módulos admin para sua função.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Admin da Função</h2>
        <p className="text-sm text-gray-600">Atribuições administrativas para: {role}</p>
      </div>

      <Suspense fallback={<PageLoader />}>
        <div className="space-y-6">
          {modules.map((m) => (
            <div key={m.key} className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-lg font-semibold text-gray-900 mb-3">{m.title}</div>
              {m.component}
            </div>
          ))}
        </div>
      </Suspense>
    </div>
  )
}

export default RoleAdmin

