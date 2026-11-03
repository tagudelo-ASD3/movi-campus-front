const PREFS_KEY = 'notificationPrefs'
const NOTIFS_KEY = 'notifications'

const defaultPrefs = {
  bus: true,
  serviceChanges: true,
  favorites: true,
  stops: true,
  operational: false,
}

export function getNotificationPrefs() {
  try {
    const stored = localStorage.getItem(PREFS_KEY)
    if (stored) return { ...defaultPrefs, ...JSON.parse(stored) }
  } catch {}
  return { ...defaultPrefs }
}

export function setNotificationPrefs(prefs) {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)) } catch {}
}

export function getNotifications() {
  try {
    const stored = localStorage.getItem(NOTIFS_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return Array.isArray(parsed) ? parsed : []
    }
  } catch {}
  return []
}

function addNotification(notification) {
  const prefs = getNotificationPrefs()
  const type = notification.type || 'system'
  const allowed = {
    service: prefs.serviceChanges,
    favorite: prefs.favorites,
    stop: prefs.stops,
    operational: prefs.operational,
    system: true,
    bus: prefs.bus,
  }
  if (allowed[type] === false) return null
  const list = getNotifications()
  const item = {
    id: Date.now() + Math.random(),
    type,
    title: notification.title || 'Notificación',
    message: notification.message || '',
    time: new Date().toISOString(),
    read: false,
  }
  const next = [item, ...list].slice(0, 30)
  try { localStorage.setItem(NOTIFS_KEY, JSON.stringify(next)) } catch {}
  return item
}

export function markAllNotificationsRead() {
  const list = getNotifications().map((n) => ({ ...n, read: true }))
  try { localStorage.setItem(NOTIFS_KEY, JSON.stringify(list)) } catch {}
}

export function seedNotifications() {
  if (getNotifications().length > 0) return
  const samples = [
    { type: 'service', title: 'Cambio de servicio', message: 'La Ruta Campus Norte presenta un desvío temporal por mantenimiento.' },
    { type: 'favorite', title: 'Ruta favorita', message: 'Tu ruta favorita "Parada Biblioteca Principal → Parada Fac. Ingeniería" tiene un bus disponible.' },
    { type: 'stop', title: 'Parada cercana', message: 'Estás cerca de Parada Cafetería. Tu parada de bajada es la siguiente.' },
    { type: 'operational', title: 'Aviso operativo', message: 'Reporte de incidencia en Parada Laboratorios. Se recomienda usar ruta alterna.' },
  ]
  samples.forEach((s) => addNotification(s))
}
