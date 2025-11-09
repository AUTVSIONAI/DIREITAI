import React, { Suspense, lazy } from 'react'
import { Loader2 } from 'lucide-react'

// Lazy loading do Chart.js
const ChartComponent = lazy(async () => {
  // Importar Chart.js e react-chartjs-2 dinamicamente
  const [{ Line }, ChartJS] = await Promise.all([
    import('react-chartjs-2'),
    import('chart.js')
  ])
  
  // Registrar componentes necessários
  const {
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
  } = ChartJS
  
  ChartJS.Chart.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
  )
  
  return { default: Line }
})

// Componente de loading para o chart
const ChartLoader = () => (
  <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
    <div className="flex flex-col items-center space-y-2">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      <p className="text-sm text-gray-600">Carregando gráfico...</p>
    </div>
  </div>
)

// Wrapper para lazy loading de charts
const LazyChart = ({ type = 'Line', ...props }) => {
  return (
    <Suspense fallback={<ChartLoader />}>
      <ChartComponent {...props} />
    </Suspense>
  )
}

export default LazyChart