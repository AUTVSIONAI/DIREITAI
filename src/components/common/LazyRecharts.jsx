import React, { Suspense, lazy } from 'react'

// Lazy load Recharts components
const PieChart = lazy(() => import('recharts').then(module => ({ default: module.PieChart })))
const Pie = lazy(() => import('recharts').then(module => ({ default: module.Pie })))
const Cell = lazy(() => import('recharts').then(module => ({ default: module.Cell })))
const BarChart = lazy(() => import('recharts').then(module => ({ default: module.BarChart })))
const Bar = lazy(() => import('recharts').then(module => ({ default: module.Bar })))
const XAxis = lazy(() => import('recharts').then(module => ({ default: module.XAxis })))
const YAxis = lazy(() => import('recharts').then(module => ({ default: module.YAxis })))
const CartesianGrid = lazy(() => import('recharts').then(module => ({ default: module.CartesianGrid })))
const Tooltip = lazy(() => import('recharts').then(module => ({ default: module.Tooltip })))
const ResponsiveContainer = lazy(() => import('recharts').then(module => ({ default: module.ResponsiveContainer })))

// Loading component
const ChartLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    <span className="ml-2 text-gray-600">Carregando gráfico...</span>
  </div>
)

// Lazy Pie Chart Component
export const LazyPieChart = ({ data, colors, ...props }) => (
  <Suspense fallback={<ChartLoader />}>
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percentage }) => `${name}: ${percentage}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          {...props}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  </Suspense>
)

// Lazy Bar Chart Component
export const LazyBarChart = ({ data, colors, ...props }) => (
  <Suspense fallback={<ChartLoader />}>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis 
          dataKey="name" 
          tick={{ fill: 'white', fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis tick={{ fill: 'white' }} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'rgba(0,0,0,0.8)', 
            border: 'none', 
            borderRadius: '8px',
            color: 'white'
          }}
        />
        <Bar dataKey="value" fill="#8884d8" {...props}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </Suspense>
)