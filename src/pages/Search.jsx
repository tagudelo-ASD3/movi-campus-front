import { useState, useEffect, useRef } from 'react'
import './Search.css'
import searchData from '../Data/search.json'
import { findJourney } from '../services/transit.js'
import BottomNav from '../components/BottomNav.jsx'
import startDotIcon from '../assets/icons/start-dot.svg'
import endTriangleIcon from '../assets/icons/end-triangle.svg'
import chevronDownIcon from '../assets/icons/chevron-down.svg'
import arrowUpDownIcon from '../assets/icons/arrow-up-down.svg'
import mapPinIcon from '../assets/icons/map-pin.svg'
import mapPinSelectedIcon from '../assets/icons/map-pin-selected.svg'
import checkIcon from '../assets/icons/check.svg'

const stops = searchData.stops

const CAMPUS = { lat: 4.6014, lon: -74.066 }

function buildMapUrl(lat, lon) {
  const d = 0.006
  const bbox = `${lon - d},${lat - d},${lon + d},${lat + d}`.replace(/,/g, '%2C')
  const marker = `${lat},${lon}`.replace(/,/g, '%2C')
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`
}

function buildDirectionsUrl(originStop, destStop) {
  if (originStop && destStop) {
    return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${originStop.lat},${originStop.lon};${destStop.lat},${destStop.lon}`
  }
  const p = originStop || destStop || CAMPUS
  return buildMapUrl(p.lat, p.lon)
}

export default function Search({ screen, onNavigate, searchOrigin, searchDest }) {
  const [origin, setOrigin] = useState(searchOrigin || 'Parada Biblioteca Principal')
  const [dest, setDest] = useState(searchDest || '')
  const [activeField, setActiveField] = useState(null)
  const [routeInfo, setRouteInfo] = useState(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeError, setRouteError] = useState(null)
  const [userPos, setUserPos] = useState(null)
  const [mapReady, setMapReady] = useState(false)
  const [selectedRouteName, setSelectedRouteName] = useState(null)
  const [showFallback, setShowFallback] = useState(false)
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const markersRef = useRef([])
  const routeLayerRef = useRef(null)
  const fieldsRef = useRef(null)

  useEffect(() => {
    if (!('geolocation' in navigator)) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }, [])

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
        attribution: '&copy; OpenStreetMap contributors'
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
    return () => { cancelled = true; clearInterval(timer); if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null } }
  }, [])

  useEffect(() => {
    if (!mapInstance.current || !window.L) return
    const L = window.L
    let cancelled = false
    const makeIcon = (color, iconClass, size = 26) => L.divIcon({
      className: 'mc-map-marker',
      html: `<i class="fa-solid ${iconClass}" style="color:${color};font-size:${size}px;text-shadow:0 1px 2px rgba(0,0,0,.4);"></i>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size],
    })
    const userIcon = makeIcon('#e74c3c', 'fa-location-dot')
    const originIcon = makeIcon('#1E4E8C', 'fa-location-dot')
    const destIcon = makeIcon('#27ae60', 'fa-flag-checkered')
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []
    if (routeLayerRef.current) { routeLayerRef.current.remove(); routeLayerRef.current = null }
    const points = []
    if (userPos) {
      const m = L.marker([userPos.lat, userPos.lon], { icon: userIcon, title: 'Estás aquí' }).addTo(mapInstance.current).bindPopup('Estás aquí').bindTooltip('Estás aquí', { permanent: true, direction: 'top' })
      markersRef.current.push(m)
      points.push([userPos.lat, userPos.lon])
    }
    const originStop = stops.find((s) => s.name === origin && s.lat && s.lon)
    const destStop = stops.find((s) => s.name === dest && s.lat && s.lon)
    if (originStop) {
      const m = L.marker([originStop.lat, originStop.lon], { icon: originIcon, title: `Origen: ${originStop.name}` }).addTo(mapInstance.current).bindPopup(`Origen: ${originStop.name}`)
      markersRef.current.push(m)
      points.push([originStop.lat, originStop.lon])
    }
    if (destStop) {
      const m = L.marker([destStop.lat, destStop.lon], { icon: destIcon, title: `Destino: ${destStop.name}` }).addTo(mapInstance.current).bindPopup(`Destino: ${destStop.name}`)
      markersRef.current.push(m)
      points.push([destStop.lat, destStop.lon])
    }

    const fetchRoute = async () => {
      if (selectedJourney) {
        setRouteLoading(false)
        setRouteError(null)
        setRouteInfo(null)
        const routeStops = segmentStops
          .map((name) => stops.find((s) => s.name === name))
          .filter(Boolean)
        const pts = routeStops.map((s) => [s.lat, s.lon])
        if (routeLayerRef.current) { routeLayerRef.current.remove(); routeLayerRef.current = null }
        markersRef.current.forEach((m) => m.remove())
        markersRef.current = []
        const color = selectedJourney.route.color || '#1E4E8C'
        if (pts.length > 1) {
          let drawn = false
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 8000)
          try {
            const url = `https://router.project-osrm.org/route/v1/driving/${routeStops.map((s) => `${s.lon},${s.lat}`).join(';')}?overview=full&geometries=geojson`
            const res = await fetch(url, { signal: controller.signal })
            if (res.ok) {
              const data = await res.json()
              if (!cancelled && data.routes && data.routes.length) {
                const coords = data.routes[0].geometry.coordinates.map(([lon, lat]) => [lat, lon])
                const layer = L.polyline(coords, { color, weight: 5, opacity: 0.85 }).addTo(mapInstance.current)
                routeLayerRef.current = layer
                mapInstance.current.fitBounds(layer.getBounds(), { padding: [40, 40], maxZoom: 16 })
                drawn = true
              }
            }
          } catch { clearTimeout(timeoutId) }
          clearTimeout(timeoutId)
          if (!drawn && !cancelled) {
            const layer = L.polyline(pts, { color, weight: 5, opacity: 0.85, dashArray: '6 6' }).addTo(mapInstance.current)
            routeLayerRef.current = layer
            mapInstance.current.fitBounds(layer.getBounds(), { padding: [40, 40], maxZoom: 16 })
          }
        }
        routeStops.forEach((s, idx) => {
          const icon = L.divIcon({
            className: 'mc-map-marker',
            html: `<i class="fa-solid ${idx === 0 ? 'fa-location-dot' : idx === routeStops.length - 1 ? 'fa-flag-checkered' : 'fa-circle'}" style="color:${color};font-size:20px;text-shadow:0 1px 2px rgba(0,0,0,.4);"></i>`,
            iconSize: [20, 20],
            iconAnchor: [10, 20],
          })
          const m = L.marker([s.lat, s.lon], { icon, title: `${idx + 1}. ${s.name}` }).addTo(mapInstance.current).bindPopup(`${idx + 1}. ${s.name}`)
          markersRef.current.push(m)
        })
        if (userPos) {
          const userIcon = L.divIcon({
            className: 'mc-map-marker',
            html: `<i class="fa-solid fa-location-dot" style="color:#e74c3c;font-size:22px;text-shadow:0 1px 2px rgba(0,0,0,.4);"></i>`,
            iconSize: [22, 22],
            iconAnchor: [11, 22],
          })
          const m = L.marker([userPos.lat, userPos.lon], { icon: userIcon, title: 'Estás aquí' }).addTo(mapInstance.current).bindPopup('Estás aquí')
          markersRef.current.push(m)
        }
        return
      }

      if (!originStop || !destStop) {
        setRouteInfo(null)
        setRouteError(null)
        setRouteLoading(false)
        if (points.length === 1) mapInstance.current.setView(points[0], 16)
        else if (points.length > 1) mapInstance.current.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 16 })
        else mapInstance.current.setView([CAMPUS.lat, CAMPUS.lon], 14)
        return
      }
      setRouteLoading(true)
      setRouteError(null)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${originStop.lon},${originStop.lat};${destStop.lon},${destStop.lat}?overview=full&geometries=geojson`
        const res = await fetch(url, { signal: controller.signal })
        if (!res.ok) throw new Error('No se pudo obtener la ruta')
        const data = await res.json()
        if (cancelled) return
        if (!data.routes || !data.routes.length) throw new Error('Sin ruta disponible')
        const route = data.routes[0]
        const coords = route.geometry.coordinates.map(([lon, lat]) => [lat, lon])
        const layer = L.polyline(coords, { color: '#1E4E8C', weight: 5, opacity: 0.85 }).addTo(mapInstance.current)
        routeLayerRef.current = layer
        mapInstance.current.fitBounds(layer.getBounds(), { padding: [40, 40], maxZoom: 16 })
        setRouteInfo({ distance: route.distance, duration: route.duration })
      } catch (e) {
        if (cancelled) return
        setRouteError(e.message || 'Error al calcular la ruta')
        setRouteInfo(null)
        if (points.length > 1) mapInstance.current.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 16 })
      } finally {
        clearTimeout(timeoutId)
        if (!cancelled) setRouteLoading(false)
      }
    }

    fetchRoute()
    return () => { cancelled = true }
  }, [mapReady, userPos, origin, dest, selectedRouteName])

  useEffect(() => {
    if (searchOrigin) setOrigin(searchOrigin)
  }, [searchOrigin])

  useEffect(() => {
    if (searchDest) setDest(searchDest)
  }, [searchDest])

  useEffect(() => {
    const handleClick = (e) => {
      if (fieldsRef.current && !fieldsRef.current.contains(e.target)) {
        setActiveField(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      if (!mapInstance.current) setShowFallback(true)
    }, 2000)
    return () => clearTimeout(t)
  }, [])

  const swap = () => {
    setOrigin(dest || origin)
    setDest(origin)
  }

  const targetField = activeField || (!origin.trim() ? 'origin' : !dest.trim() ? 'dest' : null)
  const targetValue = targetField === 'origin' ? origin : targetField === 'dest' ? dest : ''
  const otherField = targetField === 'origin' ? dest : targetField === 'dest' ? origin : ''
  const isExactStop = stops.some((s) => s.name === targetValue)
  const fieldQuery = isExactStop ? '' : targetValue.trim().toLowerCase()
  const suggestions = stops.filter((s) =>
    s.name !== otherField &&
    (!fieldQuery || `${s.name} ${(s.routes || [s.route]).join(' ')}`.toLowerCase().includes(fieldQuery))
  )

  const selectStop = (s) => {
    if (s.name === otherField) return
    if (targetField === 'origin') setOrigin(s.name)
    else if (targetField === 'dest') setDest(s.name)
    setActiveField(null)
  }

  const matchingRoutes = findJourney(origin, dest)

  const sameStop = origin.trim() !== '' && dest.trim() !== '' && origin === dest

  const selectedJourney = selectedRouteName
    ? matchingRoutes.find((j) => j.route.name === selectedRouteName) || null
    : null

  const segmentStops = selectedJourney
    ? (() => {
        const arr = selectedJourney.route.stops
        const i = arr.indexOf(origin)
        const j = arr.indexOf(dest)
        if (i !== -1 && j !== -1 && i < j) return arr.slice(i, j + 1)
        return arr
      })()
    : []

  useEffect(() => {
    if (matchingRoutes.length === 0) {
      setSelectedRouteName(null)
      return
    }
    if (!matchingRoutes.some((j) => j.route.name === selectedRouteName)) {
      setSelectedRouteName(matchingRoutes[0].route.name)
    }
  }, [matchingRoutes, selectedRouteName])

  return (
    <div className="search-screen">
      <div className="search-content">
        <div className="search-left" ref={fieldsRef}>
          <div className="search-panel">
            <div className="route-fields">
              <div className="route-inputs">
                <label className={`route-field origin ${targetField === 'origin' ? 'active' : ''}`}>
                  <img src={startDotIcon} alt="" width="8" height="8" className="field-marker" />
                  <input
                    type="text"
                    className="field-input"
                    value={origin}
                    placeholder="Seleccionar parada"
                    aria-label="Parada de origen"
                    onFocus={() => setActiveField('origin')}
                    onChange={(e) => { setOrigin(e.target.value); setActiveField('origin') }}
                  />
                  <img src={chevronDownIcon} alt="" width="16" height="16" className="field-chevron" />
                </label>
                <label className={`route-field dest ${targetField === 'dest' ? 'active' : ''}`}>
                  <span className="field-marker">
                    <img src={endTriangleIcon} alt="" width="6.9282" height="6" />
                  </span>
                  <input
                    type="text"
                    className="field-input"
                    value={dest}
                    placeholder="Seleccionar parada"
                    aria-label="Parada de destino"
                    onFocus={() => setActiveField('dest')}
                    onChange={(e) => { setDest(e.target.value); setActiveField('dest') }}
                  />
                  <img src={chevronDownIcon} alt="" width="16" height="16" className="field-chevron" />
                </label>
              </div>
              <button type="button" className="swap-btn" onClick={swap} aria-label="Intercambiar origen y destino">
                <img src={arrowUpDownIcon} alt="" width="20" height="20" />
              </button>
            </div>
          </div>

          {targetField && (
            <section className="section stop-picker">
              <h2 className="section-title">Paradas disponibles</h2>
              {suggestions.length === 0 ? (
                <p className="search-empty">Sin resultados</p>
              ) : (
                <ul className="stops-list">
                  {suggestions.map((s) => {
                    const checked = s.name === targetValue
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          aria-pressed={checked}
                          className={`stop-option ${checked ? 'selected' : ''}`}
                          onClick={() => selectStop(s)}
                        >
                          <span className="stop-option-icon">
                            <img src={checked ? mapPinSelectedIcon : mapPinIcon} alt="" width="18" height="18" />
                          </span>
                          <span className="stop-option-body">
                            <span className="stop-option-name">{s.name}</span>
                            <span className="stop-option-route">{(s.routes || [s.route]).join(', ')}</span>
                          </span>
                          <span className="stop-option-radio">
                            {checked && <img src={checkIcon} alt="" width="12" height="12" />}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          )}
        </div>

        {origin && dest && (
          <>
            <section className="section">
              <h2 className="section-title">Rutas disponibles para tu viaje</h2>
              {sameStop ? (
                <p className="search-empty">El origen y el destino no pueden ser la misma parada.</p>
              ) : matchingRoutes.length === 0 ? (
                <p className="search-empty">No tenemos una ruta definida para este origen y destino.</p>
              ) : (
                <div className="stops-list">
                  {matchingRoutes.map(({ route }) => (
                    <button
                      type="button"
                      key={route.id || route.name}
                      className={`stop-card ${selectedRouteName === route.name ? 'active' : ''}`}
                      onClick={() => setSelectedRouteName(route.name)}
                      style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}
                    >
                      <div className="stop-icon active">
                        <i className="fa-solid fa-route" aria-hidden="true" />
                      </div>
                      <div className="stop-body">
                        <p className="stop-name">{route.name}</p>
                        <p className="stop-route">Seleccionar esta ruta</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            {selectedJourney && (
              <section className="section">
                <h2 className="section-title">Camino de {selectedJourney.route.name}</h2>
                <div className="stops-list">
                  {segmentStops.map((stopName, idx) => (
                    <div className="stop-card" key={`${stopName}-${idx}`}>
                      <div className={`stop-icon ${idx === 0 || idx === segmentStops.length - 1 ? 'active' : ''}`}>
                        <i className={`fa-solid ${idx === 0 ? 'fa-location-dot' : idx === segmentStops.length - 1 ? 'fa-flag-checkered' : 'fa-circle'}`} aria-hidden="true" />
                      </div>
                      <div className="stop-body">
                        <p className="stop-name">{stopName}</p>
                        <p className="stop-route">
                          {idx === 0 ? 'Origen' : idx === segmentStops.length - 1 ? 'Destino' : 'Parada intermedia'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="stop-route" style={{ marginTop: 8 }}>
                  Tenemos esta ruta definida con {selectedJourney.stopsCount} paradas. {selectedJourney.buses.length === 1 ? 'Te sirve este bus:' : 'Te sirven estos buses:'}{' '}
                  {selectedJourney.buses.length
                    ? selectedJourney.buses.map((b) => `${b.code} (en ${b.eta})`).join(', ')
                    : 'sin buses disponibles'}
                </p>
              </section>
            )}
          </>
        )}

        <section className="section map-section">
          <h2 className="section-title">Ubicación en el campus</h2>
          <div className="map-wrap">
            {showFallback ? (
              <iframe
                title="Mapa del campus - OpenStreetMap"
                className="campus-map"
                src={buildDirectionsUrl(stops.find((s) => s.name === origin), stops.find((s) => s.name === dest))}
                loading="lazy"
              />
            ) : (
              <div ref={mapRef} className="leaflet-map" />
            )}
          </div>
          {(routeLoading || routeInfo || routeError) && (
            <div className="route-info" style={{ marginTop: 8, fontSize: 13, color: '#1E4E8C' }}>
              {routeLoading && <span>Calculando ruta…</span>}
              {routeError && <span style={{ color: '#c0392b' }}>{routeError}</span>}
              {routeInfo && !routeLoading && (
                <span>
                  Ruta: {routeInfo.distance < 1000 ? `${Math.round(routeInfo.distance)} m` : `${(routeInfo.distance / 1000).toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`} · {Math.round(routeInfo.duration / 60)} min
                </span>
              )}
            </div>
          )}
        </section>
      </div>

      <BottomNav screen={screen} onNavigate={onNavigate} />

      <div className="home-indicator" aria-hidden="true" />
    </div>
  )
}
