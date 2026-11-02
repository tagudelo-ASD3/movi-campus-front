import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fortawesome/fontawesome-free/css/fontawesome.min.css'
import '@fortawesome/fontawesome-free/css/solid.min.css'
import '@fortawesome/fontawesome-free/css/brands.min.css'
import './index.css'
import App from './App.jsx'

// Apply persisted/preferred theme before render to avoid flash
try {
  const stored = localStorage.getItem('theme')
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  if (stored === 'dark' || (!stored && prefersDark)) {
    document.documentElement.dataset.theme = 'dark'
  } else {
    document.documentElement.dataset.theme = 'light'
  }
} catch {}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
