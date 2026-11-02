import { useState, useEffect } from 'react'
import './Profile.css'
import profileData from '../Data/profile.json'
import { loadProfile, saveProfile as persistProfile } from '../services/profile.js'
import PhotoSelector from '../components/PhotoSelector.jsx'
import { getNotificationPrefs, setNotificationPrefs } from '../services/notifications.js'
import BottomNav from '../components/BottomNav.jsx'

export default function Profile({ screen, onNavigate }) {

  const [profile, setProfile] = useState(() => loadProfile(profileData.user))

  const user = profile
  const [prefs, setPrefs] = useState(() => getNotificationPrefs())
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const stored = localStorage.getItem('theme')
      if (stored) return stored === 'dark'
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    } catch {
      return false
    }
  })

  useEffect(() => {
    setNotificationPrefs(prefs)
  }, [prefs])
  const [showEdit, setShowEdit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [form, setForm] = useState({ name: user.name, email: user.email, photo: user.photo })

  useEffect(() => {
    if (showEdit) setForm({ name: user.name, email: user.email, photo: user.photo })
  }, [showEdit, user.name, user.email, user.photo])

  useEffect(() => {
    const theme = darkMode ? 'dark' : 'light'
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('theme', theme) } catch {}
  }, [darkMode])

  useEffect(() => {
    if (!showEdit) return
    const onKey = (e) => { if (e.key === 'Escape') setShowEdit(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [showEdit])

  const hasChanges = form.name !== user.name || form.email !== user.email || form.photo !== user.photo

  const saveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await new Promise((res) => setTimeout(res, 450))
      const updated = { ...user, name: form.name.trim() || user.name, email: form.email.trim() || user.email, photo: form.photo }
      setProfile(updated)
      persistProfile(updated)
      setShowEdit(false)
      setToast({ type: 'success', message: 'Perfil actualizado correctamente' })
    } catch {
      setToast({ type: 'error', message: 'No se pudo guardar el perfil' })
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2800)
    return () => clearTimeout(t)
  }, [toast])

  return (
    <div className="profile-screen">
      <header className="profile-header">
        <div className="avatar">
          {user.photo ? (
            <img src={user.photo} alt="Foto de perfil" className="avatar-img" />
          ) : (
            <i className="fa-solid fa-user" />
          )}
        </div>
        <div className="profile-info">
          <h1 className="profile-name">{user.name}</h1>
          <p className="profile-email">{user.email}</p>
          <button className="edit-link" onClick={() => setShowEdit(true)}>Editar perfil</button>
        </div>
      </header>

      <div className="profile-content">
        <section className="section">
          <h2 className="section-title">Ajustes de la aplicación</h2>
          <div className="settings-card">
            <div className="setting-row">
              <span className="setting-label">Notificaciones</span>
              <button
                className={`toggle ${prefs.bus ? 'on' : ''}`}
                onClick={() => setPrefs((p) => ({ ...p, bus: !p.bus }))}
                aria-pressed={prefs.bus}
              >
                <span className="toggle-knob" />
              </button>
            </div>

            <div className="setting-row">
              <span className="setting-label">Modo oscuro</span>
              <button
                className={`toggle ${darkMode ? 'on' : ''}`}
                onClick={() => setDarkMode((v) => !v)}
                aria-pressed={darkMode}
              >
                <span className="toggle-knob" />
              </button>
            </div>
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">Sobre MoviCampus</h2>
          <div className="info-card">
            <button className="info-row">
              <span className="info-label">Versión de la aplicación</span>
              <span className="info-value">
                {user.version} <i className="fa-solid fa-chevron-right" />
              </span>
            </button>
            <button className="info-row">
              <span className="info-label">Términos y condiciones</span>
              <i className="fa-solid fa-chevron-right" />
            </button>
            <button className="info-row">
              <span className="info-label">Política de privacidad</span>
              <i className="fa-solid fa-chevron-right" />
            </button>
          </div>
        </section>

        <button className="logout-btn" onClick={() => onNavigate?.('login')}>Cerrar Sesión</button>
      </div>

{showEdit && (
        <div className="profile-modal-backdrop" onClick={() => setShowEdit(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="edit-profile-title">
            <h2 id="edit-profile-title" className="profile-modal-title">Editar perfil</h2>
            <form onSubmit={saveProfile} className="profile-modal-form">
              <label className="profile-modal-label">
                Nombre
                <input
                  type="text"
                  className="profile-modal-input"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </label>
              <label className="profile-modal-label">
                Correo
                <input
                  type="email"
                  className="profile-modal-input"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </label>
              <PhotoSelector
                value={form.photo}
                initialValue={user.photo}
                name={form.name}
                onChange={(photo) => setForm((f) => ({ ...f, photo }))}
                disabled={saving}
              />
              <div className="profile-modal-actions">
                <button type="button" className="profile-modal-cancel" onClick={() => setShowEdit(false)} disabled={saving}>Cancelar</button>
                <button type="submit" className="profile-modal-save" disabled={!hasChanges || saving}>
                  {saving ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin" /> Guardando...
                    </>
                  ) : (
                    'Guardar cambios'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

{toast && (
        <div className={`profile-toast ${toast.type}`} role="status" aria-live="polite">
          <i className={`fa-solid ${toast.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}`} />
          {toast.message}
        </div>
      )}

      <BottomNav screen={screen} onNavigate={onNavigate} />

      <div className="home-indicator" aria-hidden="true" />
    </div>
  )
}
