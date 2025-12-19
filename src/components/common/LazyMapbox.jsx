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
    ...(viewState ? { viewState } : {}),
    ...(normalizedInitialViewState ? { initialViewState: normalizedInitialViewState } : {}),
  }

  return (
    <Suspense fallback={<div>Carregando mapa...</div>}>
      <Map ref={ref} {...normalizedProps} />
    </Suspense>
  )
})

const LazyMarker = (props) => (
  <Suspense fallback={null}>
    <Marker {...props} />
  </Suspense>
)

const LazyPopup = (props) => (
  <Suspense fallback={null}>
    <Popup {...props} />
  </Suspense>
)

const LazyNavigationControl = (props) => (
  <Suspense fallback={null}>
    <NavigationControl {...props} />
  </Suspense>
)

const LazyScaleControl = (props) => (
  <Suspense fallback={null}>
    <ScaleControl {...props} />
  </Suspense>
)

const LazyFullscreenControl = (props) => (
  <Suspense fallback={null}>
    <FullscreenControl {...props} />
  </Suspense>
)

const LazySource = (props) => (
  <Suspense fallback={null}>
    <Source {...props} />
  </Suspense>
)

const LazyLayer = (props) => (
  <Suspense fallback={null}>
    <Layer {...props} />
  </Suspense>
)

export { LazyMap, LazyMarker, LazyPopup, LazyNavigationControl, LazyScaleControl, LazyFullscreenControl, LazySource, LazyLayer }
