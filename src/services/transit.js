import routesData from '../Data/routes.json'
import busesData from '../Data/buses.json'
import searchData from '../Data/search.json'

const routes = Array.isArray(routesData)
  ? routesData
  : (routesData && Array.isArray(routesData.routes) ? routesData.routes : [])

const buses = Array.isArray(busesData)
  ? busesData
  : (busesData && Array.isArray(busesData.buses) ? busesData.buses : [])

const stops = Array.isArray(searchData)
  ? searchData
  : (searchData && Array.isArray(searchData.stops) ? searchData.stops : [])

// Normalize: a route owns its single bus (una ruta = un bus)
for (const route of routes) {
  const bus = buses.find((b) => {
    if (b.route === route.name) return true
    if (route.id != null && (b.routeId === route.id || b.route === route.id)) return true
    return false
  })
  if (bus) {
    route.bus = bus
    route.busId = bus.id
    route.busCode = bus.code
  }
}

// Normalize stops: a stop may belong to several routes (varias rutas pueden compartir paradas)
for (const stop of stops) {
  if (!Array.isArray(stop.routes)) {
    stop.routes = stop.route ? [stop.route] : []
  }
  if (!stop.route && stop.routes.length) stop.route = stop.routes[0]
}


export function getRoutes() {
  return routes
}

export function getBuses() {
  return buses
}

function getBusForRoute(route) {
  const name = typeof route === 'string' ? route : (route && route.name)
  const id = typeof route === 'object' && route ? route.id : null
  const found = buses.find((b) => {
    if (name && b.route === name) return true
    if (id != null && (b.routeId === id || b.route === id)) return true
    return false
  })
  return found || (route && route.bus) || null
}

function getBusesForRoute(route) {
  const bus = getBusForRoute(route)
  return bus ? [bus] : []
}


function findRoutes(origin, dest) {
  if (!origin || !dest) return []
  return routes.filter((route) => {
    const stops = Array.isArray(route.stops) ? route.stops : []
    const i = stops.indexOf(origin)
    const j = stops.indexOf(dest)
    return i !== -1 && j !== -1 && i < j
  })
}

export function routeStopsCount(route, origin, dest) {
  const stops = (route && Array.isArray(route.stops)) ? route.stops : []
  const i = stops.indexOf(origin)
  const j = stops.indexOf(dest)
  if (i === -1 || j === -1) return stops.length
  return j - i + 1
}

export function findJourney(origin, dest) {
  return findRoutes(origin, dest).map((route) => ({
    route,
    stopsCount: routeStopsCount(route, origin, dest),
    buses: getBusesForRoute(route),
  }))
}



export function formatBusCount(count) {
  const n = Number.isFinite(count) ? count : (Number(count) || 0)
  return `${n} ${n === 1 ? 'bus' : 'buses'}`
}

export const busCountLabel = formatBusCount
export const pluralizeBus = formatBusCount
export const pluralizeBuses = formatBusCount
export const busesLabel = formatBusCount
export const getBusLabel = formatBusCount

export function pluralize(count, singular = 'bus', plural) {
  const n = Number.isFinite(count) ? count : (Number(count) || 0)
  const resolvedPlural = plural || `${singular}s`
  return `${n} ${n === 1 ? singular : resolvedPlural}`
}

export function formatRoutePath(origin, dest, separator = ' → ') {
  return `${origin}${separator}${dest}`
}

export const formatRoute = formatRoutePath
export const routeArrow = formatRoutePath
export const formatStops = (stops, separator = ' → ') =>
  Array.isArray(stops) ? stops.join(separator) : String(stops ?? '')
