import { useState } from 'react'
import './Login.css'
import { loginWithGoogle, loginWithApple } from '../services/auth.js'

export default function Login({ onNavigate }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
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
            <circle cx="300" cy="42" r="24" fill="#FDE68A" opacity="0.9" />
            <g fill="#FFFFFF" opacity="0.75">
              <ellipse cx="80" cy="48" rx="30" ry="13" />
              <ellipse cx="108" cy="42" rx="22" ry="11" />
              <ellipse cx="230" cy="62" rx="32" ry="13" />
              <ellipse cx="258" cy="56" rx="20" ry="10" />
            </g>
            <rect x="0" y="162" width="360" height="48" fill="#C7D9EE" />
            <g>
              <rect x="30" y="95" width="62" height="67" rx="5" fill="#1E4E8C" />
              <rect x="38" y="105" width="12" height="14" rx="2" fill="#E8F0FA" />
              <rect x="56" y="105" width="12" height="14" rx="2" fill="#E8F0FA" />
              <rect x="38" y="128" width="12" height="14" rx="2" fill="#E8F0FA" />
              <rect x="56" y="128" width="12" height="14" rx="2" fill="#E8F0FA" />
            </g>
            <g>
              <rect x="110" y="70" width="74" height="92" rx="5" fill="#143A6B" />
              <rect x="118" y="82" width="14" height="16" rx="2" fill="#E8F0FA" />
              <rect x="140" y="82" width="14" height="16" rx="2" fill="#E8F0FA" />
              <rect x="162" y="82" width="14" height="16" rx="2" fill="#E8F0FA" />
              <rect x="118" y="110" width="14" height="16" rx="2" fill="#E8F0FA" />
              <rect x="140" y="110" width="14" height="16" rx="2" fill="#E8F0FA" />
              <rect x="162" y="110" width="14" height="16" rx="2" fill="#E8F0FA" />
            </g>
          </svg>
          <div className="brand-card">
            <div className="brand-icon">
              <i className="fa-solid fa-route" />
            </div>
            <span className="brand-name">MoviCampus</span>
          </div>
        </header>

        <main className="content">
          <h1>¡Te damos la bienvenida!</h1>
          <p className="subtitle">Encuentra la mejor ruta para ir a la Universidad</p>

          <form className="form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">Correo Universitario</label>
              <div className="input-wrap">
                <i className="fa-regular fa-envelope input-icon" />
                <input
                  id="email"
                  type="email"
                  placeholder="ejemplo@universidad.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="password">Contraseña</label>
              <div className="input-wrap">
                <i className="fa-solid fa-lock input-icon" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary">
              Iniciar Sesión
            </button>
          </form>

          <p className="register-text">
            ¿No tienes cuenta?{' '}
            <a
              href="#registro"
              onClick={(e) => {
                e.preventDefault()
                if (onNavigate) onNavigate('register')
              }}
            >
              Registrarse
            </a>
          </p>

          <div className="divider">
            <span>o continuar con</span>
          </div>

<div className="social-row">
            <button type="button" className="btn-social" onClick={() => { try { loginWithGoogle() } catch {} if (onNavigate) onNavigate('dashboard') }}>
              <i className="fa-brands fa-google" /> Google
            </button>
            <button type="button" className="btn-social" onClick={() => { try { loginWithApple() } catch {} if (onNavigate) onNavigate('dashboard') }}>
              <i className="fa-brands fa-apple" /> Apple
            </button>
          </div>
        </main>

        <div className="home-indicator" aria-hidden="true" />
      </div>
    </div>
  )
}