const TABS = [
  { key: 'inicio', label: 'Inicio', icon: 'fa-house', screen: 'dashboard' },
  { key: 'buscar', label: 'Buscar', icon: 'fa-magnifying-glass', screen: 'search' },
  { key: 'rutas', label: 'Rutas', icon: 'fa-route', screen: 'routes' },
  { key: 'favoritos', label: 'Favoritos', icon: 'fa-heart', screen: 'favorites' },
  { key: 'perfil', label: 'Perfil', icon: 'fa-user', screen: 'profile' },
]

export default function BottomNav({ screen, onNavigate }) {
  const activeTab =
    screen === 'dashboard' ? 'inicio' :
    screen === 'search' ? 'buscar' :
    screen === 'routes' ? 'rutas' :
    screen === 'favorites' ? 'favoritos' :
    screen === 'profile' ? 'perfil' : 'buscar'

  return (
    <nav className="tab-bar">
      {TABS.map((t) => (
        <button
          key={t.key}
          type="button"
          className={`tab ${activeTab === t.key ? 'active' : ''}`}
          onClick={() => onNavigate?.(t.screen)}
        >
          <i className={`fa-solid ${t.icon}`} />
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  )
}
