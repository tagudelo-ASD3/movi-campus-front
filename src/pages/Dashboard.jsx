import { useState } from 'react'
import './Dashboard.css'
import dashboardData from '../Data/dashboard.json'
import searchData from '../Data/search.json'
import profileData from '../Data/profile.json'
import favoritesData from '../Data/favorites.json'
import { loadProfile } from '../services/profile.js'
import { seedNotifications, getNotifications, markAllNotificationsRead } from '../services/notifications.js'
import BottomNav from '../components/BottomNav.jsx'

const favorites = favoritesData
const recents = dashboardData.recents
const stops = searchData.stops

export default function Dashboard({ screen, onNavigate }) {
  const [user] = useState(() => loadProfile(profileData.user))
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState(() => {
    seedNotifications()
    return getNotifications()
  })
  const unreadCount = notifications.filter((n) => !n.read).length
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const suggestions = query.trim()
    ? stops.filter((s) => `${s.name} ${(s.routes || [s.route]).join(' ')}`.toLowerCase().includes(query.toLowerCase()))
    : []

  return (
    <div className="dashboard-screen">
      <header className="dash-header">
        <div className="greeting">
          <span className="greeting-sub">¡Hola, {user.name}!</span>
          <h1 className="greeting-title">¿A dónde vas hoy?</h1>
        </div>
        <div className="dash-header-actions">
          <button
            className="notif-btn"
            aria-label="Notificaciones"
            onClick={() => {
              const next = !showNotifications
              setShowNotifications(next)
              if (next) {
                markAllNotificationsRead()
                setNotifications(getNotifications())
              }
            }}
          >
            <i className="fa-solid fa-bell" aria-hidden="true" />
            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </button>
          <div className="avatar">
            {user.photo ? (
              <img src={user.photo} alt="Foto de perfil" className="avatar-img" />
            ) : (
              <i className="fa-solid fa-user" aria-hidden="true" />
            )}
          </div>
        </div>
      </header>

      <div className="search-wrap">
        <i className="fa-solid fa-magnifying-glass search-icon" aria-hidden="true" />
        <input
          type="text"
          placeholder="Buscar paradas de la universidad..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
        />
        {open && suggestions.length > 0 && (
          <ul className="search-suggest" role="listbox">
            {suggestions.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className="suggest-item"
                  onMouseDown={() => {
                    setQuery(s.name)
                    setOpen(false)
                    onNavigate?.('search', s.name)
                  }}
                >
                  <i className="fa-solid fa-location-dot" aria-hidden="true" />
                  <div className="suggest-body">
                    <p className="suggest-name">{s.name}</p>
                    <p className="suggest-route">{(s.routes || [s.route]).join(', ')}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
        {open && query.trim() && suggestions.length === 0 && (
          <div className="search-suggest search-empty">Sin resultados</div>
        )}
      </div>

      {showNotifications && (
        <div className="notif-modal-backdrop" onClick={() => setShowNotifications(false)}>
          <div
            className="notif-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="notif-title"
          >
            <div className="notif-panel-head">
              <span id="notif-title">Notificaciones</span>
            <button
              className="notif-close"
              onClick={() => setShowNotifications(false)}
              aria-label="Cerrar notificaciones"
            >
              <i className="fa-solid fa-xmark" aria-hidden="true" />
            </button>
          </div>
          <div className="notif-list">
            {notifications.length === 0 && <p className="notif-empty">Sin notificaciones</p>}
            {notifications.map((n) => (
              <div key={n.id} className={`notif-item ${n.read ? '' : 'unread'}`}>
                <div className="notif-item-title">{n.title}</div>
                <div className="notif-item-msg">{n.message}</div>
              </div>
            ))}
          </div>
        </div>
        </div>
      )}
      <div className="sections">

        <section className="section">
          <div className="section-head">
            <h2>Rutas favoritas</h2>
            <a
              href="#ver-todo"
              className="see-all"
              onClick={(e) => {
                e.preventDefault()
                onNavigate?.('favorites')
              }}
            >
              Ver todo
            </a>
          </div>
          <div className="fav-scroll">
            {favorites.map((f) => (
              <article
                className="fav-card"
                key={f.id}
                style={{ cursor: 'pointer' }}
                onClick={() => onNavigate?.('search', { origin: f.origin, dest: f.dest })}
              >
                <div className="route-points">
                  <div className="point-row">
                    <div className="point-body">
                      <span className="point-label">Inicio</span>
                      <span className="point-name">{f.origin}</span>
                    </div>
                  </div>
                  <div className="point-row">
                    <div className="point-body">
                      <span className="point-label">Final</span>
                      <span className="point-name">{f.dest}</span>
                    </div>
                  </div>
                </div>
                <div className="card-footer">
                  <div className="footer-left">
                    <i className="fa-solid fa-route" aria-hidden="true" />
                    <span>{f.stops} paradas</span>
                  </div>
                  <span className="bus-status">{f.bus}</span>
                  <button
                    className="heart-btn"
                    aria-label="Quitar de favoritos"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <i className="fa-solid fa-heart" aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <h2>Últimas rutas</h2>
          </div>
          <div className="recent-list">
            {recents.map((r) => (
              <article
                className="recent-card"
                key={r.id}
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  onNavigate?.('search', { origin: r.origin || '', dest: r.dest || '' })
                }}
              >
                <div className="recent-icon">
                  <i className="fa-solid fa-diagram-project" aria-hidden="true" />
                </div>
                <div className="recent-body">
                  <p className="recent-route">{r.origin} → {r.dest}</p>
                  <p className="recent-meta">{r.meta}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <BottomNav screen={screen} onNavigate={onNavigate} />

      <div className="home-indicator" aria-hidden="true" />
    </div>
  )
}
