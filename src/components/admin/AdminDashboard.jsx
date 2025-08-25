import React, { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'
import AdminHeader from './AdminHeader'
import Overview from './pages/Overview'
import UserManagement from './pages/UserManagement'
import EventManagement from './pages/EventManagement'
import UnifiedLiveMap from './pages/UnifiedLiveMap'
import ContentModeration from './pages/ContentModeration'
import StoreManagement from './pages/StoreManagement'
import FinancialReports from './pages/FinancialReports'
import SystemSettings from './pages/SystemSettings'
import ApiLogs from './pages/ApiLogs'
import Announcements from './pages/Announcements'
import NotificationsManagement from './pages/NotificationsManagement'
import PlansManagement from './pages/PlansManagement'
import PaymentSuccess from './pages/PaymentSuccess'
import PoliticiansManagement from './pages/PoliticiansManagement'
import PoliticianApproval from './pages/PoliticianApproval'
import PoliticianSync from './PoliticianSync'
import AgentsManagement from './pages/AgentsManagement'
import BlogManagement from './pages/BlogManagement'
import RatingsManagement from './pages/RatingsManagement'
import SurveysManagement from './pages/SurveysManagement'


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
            <Route path="/settings" element={<SystemSettings />} />
            <Route path="/logs" element={<ApiLogs />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/notifications" element={<NotificationsManagement />} />
            <Route path="/plans" element={<PlansManagement />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default AdminDashboard