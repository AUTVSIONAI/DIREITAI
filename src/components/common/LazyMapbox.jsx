import React, { Suspense } from 'react'
import 'mapbox-gl/dist/mapbox-gl.css'

// Import padrão do Map conforme react-map-gl v7
import Map, { Marker, Popup, NavigationControl, ScaleControl, FullscreenControl, Source, Layer } from 'react-map-gl'

const LazyMap = React.forwardRef((props, ref) => {
  const token = import.meta.env.VITE_MAPBOX_TOKEN
  const { latitude, longitude, zoom, initialViewState, viewState, ...rest } = props

  const normalizedInitialViewState = initialViewState || (
    typeof latitude === 'number' && typeof longitude === 'number' && typeof zoom === 'number'
      ? { latitude, longitude, zoom }
      : undefined
  )

  const normalizedProps = {
    ...rest,
    mapboxAccessToken: token,
    reuseMaps: true, // Reutilizar instância do mapa para evitar perda de contexto e recarregamento
    preserveDrawingBuffer: true, // Previne que o canvas fique branco/transparente em alguns dispositivos
    trackResize: true,
    ...(viewState ? { viewState } : {}),
    ...(normalizedInitialViewState ? { initialViewState: normalizedInitialViewState } : {}),
  }

  return (
    <Map 
      ref={ref} 
      {...normalizedProps} 
      style={{ ...props.style, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
    />
  )
})

const LazyMarker = (props) => (
  <Marker {...props} />
)

const LazyPopup = (props) => (
  <Popup {...props} />
)

const LazyNavigationControl = (props) => (
  <NavigationControl {...props} />
)

const LazyScaleControl = (props) => (
  <ScaleControl {...props} />
)

const LazyFullscreenControl = (props) => (
  <FullscreenControl {...props} />
)

const LazySource = (props) => (
  <Source {...props} />
)

const LazyLayer = (props) => (
  <Layer {...props} />
)

export { LazyMap, LazyMarker, LazyPopup, LazyNavigationControl, LazyScaleControl, LazyFullscreenControl, LazySource, LazyLayer }
