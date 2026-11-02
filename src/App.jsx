import { useState } from 'react'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Search from './pages/Search.jsx'
import Favorites from './pages/Favorites.jsx'
import Profile from './pages/Profile.jsx'
import Routes from './pages/Routes.jsx'

export default function App() {
  const [screen, setScreen] = useState('dashboard')
  const [searchOrigin, setSearchOrigin] = useState('')
  const [searchDest, setSearchDest] = useState('')

  const navigate = (next, payload) => {
    setScreen(next)
    if (next === 'search') {
      if (payload && typeof payload === 'object') {
        setSearchOrigin(payload.origin || '')
        setSearchDest(payload.dest || '')
      } else if (typeof payload === 'string') {
        setSearchOrigin(payload)
        setSearchDest('')
      }
    }
  }

  const props = { screen, onNavigate: navigate, searchOrigin, searchDest }

  switch (screen) {
    case 'login':
      return <Login {...props} />
    case 'register':
      return <Register {...props} />
    case 'dashboard':
      return <Dashboard {...props} />
    case 'search':
      return <Search {...props} />
    case 'favorites':
      return <Favorites {...props} />
    case 'profile':
      return <Profile {...props} />
    case 'routes':
      return <Routes {...props} />
    default:
      return <Dashboard {...props} />
  }
}

