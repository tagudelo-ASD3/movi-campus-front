import './BottomNav.css'
import homeIcon from '../assets/icons/nav-home.svg'
import searchIcon from '../assets/icons/nav-search.svg'
import routeIcon from '../assets/icons/nav-route.svg'
import heartIcon from '../assets/icons/nav-heart.svg'
import userIcon from '../assets/icons/nav-user.svg'

const TABS = [
  { key: 'inicio', label: 'Inicio', icon: homeIcon, screen: 'dashboard' },
  { key: 'buscar', label: 'Buscar', icon: searchIcon, screen: 'search' },
  { key: 'rutas', label: 'Rutas', icon: routeIcon, iconSize: 20, screen: 'routes' },
  { key: 'favoritos', label: 'Favoritos', icon: heartIcon, screen: 'favorites' },
  { key: 'perfil', label: 'Perfil', icon: userIcon, screen: 'profile' },
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
          <span
            className="mc-tab-icon"
            aria-hidden="true"
            style={{
              WebkitMaskImage: `url("${t.icon}")`,
              maskImage: `url("${t.icon}")`,
              WebkitMaskSize: `${t.iconSize || 22}px`,
              maskSize: `${t.iconSize || 22}px`,
            }}
          />
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  )
}
