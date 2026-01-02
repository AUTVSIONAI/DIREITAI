import React, { useState, Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useAuth } from '../../contexts/AuthContext'

// Componente de loading para páginas internas
const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
)

// Lazy loading das páginas do dashboard
const Overview = lazy(() => import('./pages/Overview'))
const Profile = lazy(() => import('./pages/Profile'))
const UnifiedAI = lazy(() => import('./pages/UnifiedAI.jsx'))
const CheckIn = lazy(() => import('./pages/CheckIn'))
const Ranking = lazy(() => import('./pages/Ranking'))
const Store = lazy(() => import('./pages/Store'))
const Achievements = lazy(() => import('./pages/Achievements'))
const Plan = lazy(() => import('./pages/Plan'))
const StoreSuccess = lazy(() => import('./pages/StoreSuccess'))
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'))
const Agents = lazy(() => import('./pages/Agents'))
const EventMap = lazy(() => import('./pages/EventMap'))
const Affiliates = lazy(() => import('./pages/Affiliates'))
const RoleAdmin = lazy(() => import('./pages/RoleAdmin'))
const PoliticianArenas = lazy(() => import('./pages/PoliticianArenas'))
const SuggestionsManagement = lazy(() => import('../admin/pages/SuggestionsManagement'))
const Settings = lazy(() => import('./pages/Settings'))


const UserDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { userProfile } = useAuth()
  const role = String(userProfile?.role || '').toLowerCase()
  const isPolitician = role === 'politician'

  return (
    <div className="flex h-screen bg-transparent">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header setSidebarOpen={setSidebarOpen} />
        
        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-transparent p-6">
          <Suspense fallback={<PageLoader />}>
            <Routes>
            <Route path="/" element={isPolitician ? <Agents onlyMyAgent={true} /> : <Overview />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/direitagpt" element={<UnifiedAI />} />
            <Route path="/creative" element={<UnifiedAI />} />
            <Route path="/agents" element={<Agents onlyMyAgent={isPolitician} />} />
            <Route path="/checkin" element={<CheckIn />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="/store" element={<Store />} />
            <Route path="/store/success" element={<StoreSuccess />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="plan" element={<Plan />} />
            <Route path="/events" element={<EventMap />} />
            <Route path="/arenas" element={<PoliticianArenas />} />
            <Route path="/affiliates" element={<Affiliates />} />
            <Route path="/admin-role" element={<RoleAdmin />} />
            <Route path="/suggestions" element={<SuggestionsManagement />} />
            <Route path="/settings" element={<Settings />} />

            </Routes>
          </Suspense>
        </main>
      </div>
      
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

export default UserDashboard
