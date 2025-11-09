import React, { useState, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'
import AdminHeader from './AdminHeader'

// Lazy load all admin pages for better code splitting
const Overview = React.lazy(() => import('./pages/Overview'))
const UserManagement = React.lazy(() => import('./pages/UserManagement'))
const EventManagement = React.lazy(() => import('./pages/EventManagement'))
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

// Loading component for Suspense fallback
const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    <span className="ml-2 text-gray-600">Carregando...</span>
  </div>
)


const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <AdminHeader setSidebarOpen={setSidebarOpen} />
        
        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/events" element={<EventManagement />} />
              <Route path="/politicians" element={<PoliticiansManagement />} />
              <Route path="/politicians/approval" element={<PoliticianApproval />} />
              <Route path="/politicians/sync" element={<PoliticianSync />} />
              <Route path="/agents" element={<AgentsManagement />} />
              <Route path="/blog" element={<BlogManagement />} />
              <Route path="/ratings" element={<RatingsManagement />} />
              <Route path="/surveys" element={<SurveysManagement />} />

              <Route path="/unified-map" element={<UnifiedLiveMap />} />
              <Route path="/moderation" element={<ContentModeration />} />
              <Route path="/store" element={<StoreManagement />} />
              <Route path="/reports" element={<FinancialReports />} />
             <Route path="/affiliates" element={<AffiliatesAdmin />} />
              <Route path="/settings" element={<SystemSettings />} />
              <Route path="/logs" element={<ApiLogs />} />
              <Route path="/announcements" element={<Announcements />} />
              <Route path="/notifications" element={<NotificationsManagement />} />
              <Route path="/plans" element={<PlansManagement />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  )
}

export default AdminDashboard