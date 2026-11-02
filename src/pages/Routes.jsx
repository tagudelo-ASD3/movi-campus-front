import { useState, useEffect, useRef } from 'react'
import './Dashboard.css'
import './Search.css'
import { getRoutes, getBuses, formatBusCount } from '../services/transit.js'
import searchData from '../Data/search.json'
import BottomNav from '../components/BottomNav.jsx'

const routes = getRoutes()
const buses = getBuses()
const stops = searchData.stops
const CAMPUS = { lat: 4.6014, lon: -74.066 }

export default function Routes({ screen, onNavigate }) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mapReady, setMapReady] = useState(false)
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const markersRef = useRef([])
  const routeLayerRef = useRef(null)
  const selectedRoute = routes[selectedIndex] || null
  const selectedBuses = buses.filter((b) => b.route === selectedRoute?.name)
  const selectedStops = selectedRoute ? selectedRoute.stops : []

  useEffect(() => {
    let cancelled = false
    const init = () => {
      if (cancelled || !window.L || !mapRef.current || mapInstance.current) return false
      const L = window.L
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })
      const map = L.map(mapRef.current).setView([CAMPUS.lat, CAMPUS.lon], 14)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map)
      mapInstance.current = map
      setMapReady(true)
      setTimeout(() => map.invalidateSize(), 100)
      return true
    }
    if (init()) return
    const timer = setInterval(() => {
      if (init()) clearInterval(timer)
    }, 100)
    return () => {
      cancelled = true
      clearInterval(timer)
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null }
    }
  }, [])

  useEffect(() => {
    if (!mapInstance.current || !window.L || !selectedRoute) return
    const L = window.L
    let cancelled = false
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)
    try {
      const routeStops = selectedStops
        .map((name) => stops.find((s) => s.name === name))
        .filter(Boolean)
      const pts = routeStops.map((s) => [s.lat, s.lon])
      if (routeLayerRef.current) { routeLayerRef.current.remove(); routeLayerRef.current = null }
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
      const color = selectedRoute.color || '#1E4E8C'
      routeStops.forEach((s, idx) => {
        const icon = L.divIcon({
          className: 'mc-map-marker',
          html: `<i class="fa-solid ${idx === 0 ? 'fa-location-dot' : idx === routeStops.length - 1 ? 'fa-flag-checkered' : 'fa-circle'}" style="color:${color};font-size:20px;text-shadow:0 1px 2px rgba(0,0,0,.4);"></i>`,
          iconSize: [20, 20],
          iconAnchor: [10, 20],
        })
        const m = L.marker([s.lat, s.lon], { icon }).addTo(mapInstance.current).bindPopup(`${idx + 1}. ${s.name}`)
        markersRef.current.push(m)
      })
      if (pts.length < 2) {
        if (pts.length === 1) mapInstance.current.setView(pts[0], 16)
        clearTimeout(timeoutId)
        return
      }
      let drawn = false
      const draw = async () => {
        try {
          const url = `https://router.project-osrm.org/route/v1/driving/${routeStops.map((s) => `${s.lon},${s.lat}`).join(';')}?overview=full&geometries=geojson`
          const res = await fetch(url, { signal: controller.signal })
          if (cancelled || !res.ok) throw new Error('fetch failed')
          const data = await res.json()
          if (cancelled) return
          if (data.routes && data.routes.length) {
            const coords = data.routes[0].geometry.coordinates.map(([lon, lat]) => [lat, lon])
            const layer = L.polyline(coords, { color, weight: 5, opacity: 0.85 }).addTo(mapInstance.current)
            if (cancelled) { layer.remove(); return }
            routeLayerRef.current = layer
            mapInstance.current.fitBounds(layer.getBounds(), { padding: [40, 40], maxZoom: 16 })
            drawn = true
          }
        } catch {}
        if (cancelled) return
        if (!drawn) {
          const layer = L.polyline(pts, { color, weight: 5, opacity: 0.85, dashArray: '6 6' }).addTo(mapInstance.current)
          if (cancelled) { layer.remove(); return }
          routeLayerRef.current = layer
          mapInstance.current.fitBounds(layer.getBounds(), { padding: [40, 40], maxZoom: 16 })
        }
      }
      draw().finally(() => clearTimeout(timeoutId))
    } catch (e) {
      console.error('Routes draw error', e)
      clearTimeout(timeoutId)
    }
    return () => {
      cancelled = true
      controller.abort()
      clearTimeout(timeoutId)
    }
  }, [selectedIndex, mapReady])

  return (
    <div className="dashboard-screen">
      <header className="dash-header">
        <div className="greeting">
          <span className="greeting-sub">MoviCampus</span>
          <h1 className="greeting-title">Rutas disponibles</h1>
        </div>
      </header>

      <section className="section">
        <h2 className="section-title">Selecciona una ruta</h2>
        <div className="stops-list">
          {routes.map((r, i) => {
            const busCount = buses.filter((b) => b.route === r.name).length
            return (
            <button
              type="button"
              key={r.id || r.name}
              className={`stop-card ${selectedIndex === i ? 'active' : ''}`}
              onClick={() => setSelectedIndex(i)}
              onTouchEnd={() => setSelectedIndex(i)}
              style={{
                width: '100%',
                textAlign: 'left',
                cursor: 'pointer',
                background: selectedIndex === i ? 'var(--primary-soft)' : undefined,
              }}
            >
              <div className="stop-icon active">
                <i className="fa-solid fa-route" />
              </div>
              <div className="stop-body">
                <p className="stop-name">{r.name}</p>
                <p className="stop-route">{r.stops.length} paradas · {formatBusCount(busCount)}</p>
              </div>
            </button>
            )
          })}
        </div>
      </section>

      <section className="section map-section">
        <h2 className="section-title">Mapa de la ruta</h2>
        <div className="map-wrap">
          <div ref={mapRef} className="leaflet-map" style={{ height: '220px', width: '100%' }} />
        </div>
      </section>

      {selectedRoute && selectedRoute.name !== 'Ruta Circuito Campus' && (
        <section className="section">
          <h2 className="section-title">Camino de {selectedRoute.name}</h2>
          <div className="stops-list">
            {selectedStops.map((stopName, idx) => (
              <div className="stop-card" key={`${stopName}-${idx}`}>
                <div className={`stop-icon ${idx === 0 || idx === selectedStops.length - 1 ? 'active' : ''}`}>
                  <i className={`fa-solid ${idx === 0 ? 'fa-location-dot' : idx === selectedStops.length - 1 ? 'fa-flag-checkered' : 'fa-circle'}`} />
                </div>
                <div className="stop-body">
                  <p className="stop-name">{stopName}</p>
                  <p className="stop-route">
                    {idx === 0 ? 'Inicio' : idx === selectedStops.length - 1 ? 'Fin' : 'Parada intermedia'}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="stop-route" style={{ marginTop: 8 }}>
            Te sirven estos buses:{' '}
            {selectedBuses.length
              ? selectedBuses.map((b) => `${b.code} (en ${b.eta})`).join(', ')
              : 'sin buses disponibles'}
          </p>
        </section>
      )}

      <BottomNav screen={screen} onNavigate={onNavigate} />
      <div className="home-indicator" aria-hidden="true" />
    </div>
  )
}