import './Favorites.css'
import favoritesData from '../Data/favorites.json'
import BottomNav from '../components/BottomNav.jsx'

const favorites = favoritesData

export default function Favorites({ screen, onNavigate }) {
  return (
    <div className="fav-screen">
      <header className="fav-header">
        <h1 className="fav-title">Mis favoritos</h1>
        <span className="count-badge">{favorites.length} RUTAS</span>
      </header>

       <div className="fav-list">
        {favorites.map((f) => {
          return (
          <article
            className="fav-card"
            key={f.id}
            style={{ cursor: 'pointer' }}
            onClick={() => onNavigate?.('search', { origin: f.origin, dest: f.dest })}
          >
            <div className="route-points">
              <div className="point-row">
                <span className="dot blue" />
                <div className="point-body">
                  <span className="point-label">Inicio</span>
                  <span className="point-name">{f.origin}</span>
                </div>
              </div>
              <div className="point-row">
                <span className="dot green" />
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
              <button className="heart-btn" aria-label="Quitar de favoritos" onClick={(e) => e.stopPropagation()}>
                <i className="fa-solid fa-heart" aria-hidden="true" />
              </button>
            </div>
          </article>
          )
        })}
      </div>

      <BottomNav screen={screen} onNavigate={onNavigate} />

      <div className="home-indicator" aria-hidden="true" />
    </div>
  )
}
