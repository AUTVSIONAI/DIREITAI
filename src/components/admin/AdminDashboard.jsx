import React, { useState, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'
import AdminHeader from './AdminHeader'
import { useAuth } from '../../contexts/AuthContext'

// Lazy load all admin pages for better code splitting
const Overview = React.lazy(() => import('./pages/Overview'))
const UserManagement = React.lazy(() => import('./pages/UserManagement'))
const EventManagement = React.lazy(() => import('./pages/EventManagement'))
const ArenasManagement = React.lazy(() => import('./pages/ArenasManagement'))
const UnifiedLiveMap = React.lazy(() => import('./pages/UnifiedLiveMap'))
const ContentModeration = React.lazy(() => import('./pages/ContentModeration'))
const StoreManagement = React.lazy(() => import('./pages/StoreManagement'))
const FinancialReports = React.lazy(() => import('./pages/FinancialReports'))
const SystemSettings = React.lazy(() => import('./pages/SystemSettings'))
const ApiLogs = React.lazy(() => import('./pages/ApiLogs'))
const Announcements = React.lazy(() => import('./pages/Announcements'))
const NotificationsManagement = React.lazy(() => import('./pages/NotificationsManagement'))
const PlansManagement = React.lazy(() => import('./pages/PlansManagement'))
const PaymentSuccess = React.lazy(() => import('./pages/PaymentSuccess'))
const PoliticiansManagement = React.lazy(() => import('./pages/PoliticiansManagement'))
const PoliticianApproval = React.lazy(() => import('./pages/PoliticianApproval'))
const PoliticianSync = React.lazy(() => import('./PoliticianSync'))
const AgentsManagement = React.lazy(() => import('./pages/AgentsManagement'))
const BlogManagement = React.lazy(() => import('./pages/BlogManagement'))
const RatingsManagement = React.lazy(() => import('./pages/RatingsManagement'))
const SurveysManagement = React.lazy(() => import('./pages/SurveysManagement'))
const AffiliatesAdmin = React.lazy(() => import('./pages/AffiliatesAdmin'))
const VoiceServiceControl = React.lazy(() => import('./pages/VoiceServiceControl'))

// Loading component for Suspense fallback
const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    <span className="ml-2 text-gray-600">Carregando...</span>
  </div>
)


const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { userProfile } = useAuth()
  // Se for admin flag, força role admin para ver tudo
  const role = userProfile?.is_admin ? 'admin' : String(userProfile?.role || '').toLowerCase()
  const plan = String(userProfile?.plan || 'gratuito').toLowerCase()
  const tierOrder = { gratuito: 0, patriota: 1, cidadao: 2, cidadão: 2, premium: 3, pro: 4, elite: 5 }
  const tier = tierOrder[plan] ?? 0

  const baseByRole = {
    journalist: ['dashboard', 'blog', 'ratings', 'moderation', 'announcements', 'notifications', 'surveys'],
    politician: ['dashboard', 'agents', 'events', 'unified-map', 'ratings', 'surveys', 'politicians'],
    party: ['dashboard', 'events', 'affiliates', 'politicians', 'surveys', 'announcements'],
    admin: ['all'],
    super_admin: ['all']
  }

  const tierUnlocks = {
    journalist: {
      0: ['blog', 'surveys'],
      1: ['ratings'],
      2: ['moderation'],
      3: ['announcements'],
      4: ['notifications'],
      5: ['blog', 'ratings', 'moderation', 'announcements', 'notifications', 'surveys']
    },
    politician: {
      0: ['agents', 'surveys'],
      1: ['events'],
      2: ['unified-map'],
      3: ['ratings'],
      4: ['politicians'],
      5: ['agents', 'events', 'unified-map', 'ratings', 'surveys', 'politicians']
    },
    party: {
      0: ['events'],
      1: ['affiliates'],
      2: ['politicians'],
      3: ['surveys'],
      4: ['announcements'],
      5: ['events', 'affiliates', 'politicians', 'surveys', 'announcements']
    }
  }

  const can = (section) => {
    if (!section) return false
    if (baseByRole[role]?.includes('all')) return true
    const base = new Set(baseByRole[role] || [])
    const unlocks = new Set((tierUnlocks[role]?.[tier] || []))
    const allowed = new Set([...base, ...unlocks])
    if (section.startsWith('politicians.')) {
      return allowed.has('politicians')
    }
    return allowed.has(section)
  }

  const NoAccess = () => (
    <div className="min-h-[300px] flex items-center justify-center">
      <div className="text-center">
        <div className="text-xl font-bold text-gray-900 mb-2">Acesso restrito</div>
        <div className="text-gray-600">Seu plano atual não inclui este módulo administrativo.</div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-transparent">
      {/* Sidebar */}
      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <AdminHeader setSidebarOpen={setSidebarOpen} />
        
        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-transparent p-6">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/users" element={can('users') ? <UserManagement /> : <NoAccess />} />
              <Route path="/events" element={can('events') ? <EventManagement /> : <NoAccess />} />
              <Route path="/arenas" element={can('arenas') ? <ArenasManagement /> : <NoAccess />} />
              <Route path="/politicians" element={can('politicians') ? <PoliticiansManagement /> : <NoAccess />} />
              <Route path="/politicians/approval" element={can('politicians.approval') ? <PoliticianApproval /> : <NoAccess />} />
              <Route path="/politicians/sync" element={can('politicians.sync') ? <PoliticianSync /> : <NoAccess />} />
              <Route path="/agents" element={can('agents') ? <AgentsManagement /> : <NoAccess />} />
              <Route path="/blog" element={can('blog') ? <BlogManagement /> : <NoAccess />} />
              <Route path="/ratings" element={can('ratings') ? <RatingsManagement /> : <NoAccess />} />
              <Route path="/surveys" element={can('surveys') ? <SurveysManagement /> : <NoAccess />} />

              <Route path="/unified-map" element={can('unified-map') ? <UnifiedLiveMap /> : <NoAccess />} />
              <Route path="/moderation" element={can('moderation') ? <ContentModeration /> : <NoAccess />} />
              <Route path="/store" element={can('store') ? <StoreManagement /> : <NoAccess />} />
              <Route path="/reports" element={can('reports') ? <FinancialReports /> : <NoAccess />} />
             <Route path="/affiliates" element={can('affiliates') ? <AffiliatesAdmin /> : <NoAccess />} />
              <Route path="/settings" element={can('settings') ? <SystemSettings /> : <NoAccess />} />
              <Route path="/voice-service" element={can('all') ? <VoiceServiceControl /> : <NoAccess />} />
              <Route path="/logs" element={can('logs') ? <ApiLogs /> : <NoAccess />} />
              <Route path="/announcements" element={can('announcements') ? <Announcements /> : <NoAccess />} />
              <Route path="/notifications" element={can('notifications') ? <NotificationsManagement /> : <NoAccess />} />
              <Route path="/plans" element={can('plans') ? <PlansManagement /> : <NoAccess />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  )
}

export default AdminDashboard
