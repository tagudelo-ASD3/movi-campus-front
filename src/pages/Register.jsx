import { useState } from 'react'
import './Login.css'
import { register, loginWithGoogle, loginWithApple } from '../services/auth.js'

export default function Register({ onNavigate }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    try {
      register({ name, email, password, confirmPassword })
      if (onNavigate) onNavigate('dashboard')
    } catch (err) {
      const msg = err && err.errors ? Object.values(err.errors)[0] : (err && err.message) || 'No se pudo registrar'
      setError(msg)
    }
  }

  const handleGoogle = () => {
    try { loginWithGoogle() } catch {}
    if (onNavigate) onNavigate('dashboard')
  }

  const handleApple = () => {
    try { loginWithApple() } catch {}
    if (onNavigate) onNavigate('dashboard')
  }

  return (
    <div className="login-screen">
      <div className="login-container">
        <header className="hero">
          <svg className="hero-illustration" viewBox="0 0 360 210" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
              <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9EC5F5" />
                <stop offset="100%" stopColor="#E8F0FA" />
              </linearGradient>
            </defs>
            <rect width="360" height="210" fill="url(#sky)" />
          </svg>
          <div className="brand-card">
            <div className="brand-icon">
              <i className="fa-solid fa-route" aria-hidden="true" />
            </div>
            <span className="brand-name">MoviCampus</span>
          </div>
        </header>

        <main className="content">
          <h1>Crear cuenta</h1>
          <p className="subtitle">Regístrate para encontrar la mejor ruta</p>

          <form className="form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="name">Nombre</label>
              <div className="input-wrap">
                <i className="fa-regular fa-user input-icon" aria-hidden="true" />
                <input
                  id="name"
                  type="text"
                  placeholder="Tu nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="email">Correo universitario</label>
              <div className="input-wrap">
                <i className="fa-regular fa-envelope input-icon" aria-hidden="true" />
                <input
                  id="email"
                  type="email"
                  placeholder="ejemplo@ibero.edu.co"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="password">Contraseña</label>
              <div className="input-wrap">
                <i className="fa-solid fa-lock input-icon" aria-hidden="true" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="field">
              <label htmlFor="confirmPassword">Confirmar contraseña</label>
              <div className="input-wrap">
                <i className="fa-solid fa-lock input-icon" aria-hidden="true" />
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            {error && <p className="register-error" role="alert">{error}</p>}

            <button type="submit" className="btn-primary">
              Registrarse
            </button>
          </form>

          <p className="register-text">
            ¿Ya tienes cuenta?{' '}
            <a
              href="#login"
              onClick={(e) => {
                e.preventDefault()
                if (onNavigate) onNavigate('login')
              }}
            >
              Iniciar sesión
            </a>
          </p>

          <div className="divider">
            <span>o continuar con</span>
          </div>

          <div className="social-row">
            <button type="button" className="btn-social" onClick={handleGoogle}>
              <i className="fa-brands fa-google" aria-hidden="true" /> Google
            </button>
            <button type="button" className="btn-social" onClick={handleApple}>
              <i className="fa-brands fa-apple" aria-hidden="true" /> Apple
            </button>
          </div>
        </main>

        <div className="home-indicator" aria-hidden="true" />
      </div>
    </div>
  )
}