import { useState, useEffect, useRef } from 'react'
import './Profile.css'
import profileData from '../Data/profile.json'
import { loadProfile, saveProfile as persistProfile } from '../services/profile.js'
import { getNotificationPrefs, setNotificationPrefs } from '../services/notifications.js'
import BottomNav from '../components/BottomNav.jsx'
import defaultAvatar from '../assets/images/avatar-default.png'
import lockIcon from '../assets/icons/lock.svg'
import arrowLeftIcon from '../assets/icons/arrow-left.svg'
import cameraIcon from '../assets/icons/camera.svg'
import chevronRightIcon from '../assets/icons/chevron-right.svg'
import alertCircleIcon from '../assets/icons/alert-circle.svg'
import checkCircleIcon from '../assets/icons/check-circle.svg'

const EDITABLE_FIELDS = [
  { key: 'name', label: 'Nombre', autoComplete: 'given-name' },
  { key: 'lastName', label: 'Apellido', autoComplete: 'family-name' },
  { key: 'phone', label: 'Teléfono', autoComplete: 'tel', type: 'tel' },
  { key: 'career', label: 'Carrera', autoComplete: 'off' },
]

function toForm(user) {
  return {
    name: user.name || '',
    lastName: user.lastName || '',
    phone: user.phone || '',
    career: user.career || '',
    photo: user.photo || null,
  }
}

function validate(form) {
  const errors = {}
  if (!form.name.trim()) errors.name = 'Ingresa tu nombre.'
  if (!form.lastName.trim()) errors.lastName = 'Ingresa tu apellido.'
  const digits = form.phone.replace(/\D/g, '')
  if (form.phone.trim() && (!/^\+?[\d\s-]+$/.test(form.phone.trim()) || digits.length < 7)) {
    errors.phone = 'Ingresa un teléfono válido, por ejemplo +57 1234 5678.'
  }
  if (!form.career.trim()) errors.career = 'Ingresa tu carrera.'
  return errors
}

function Switch({ label, checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`toggle ${checked ? 'on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle-knob" aria-hidden="true" />
    </button>
  )
}

function ResultPopup({ type, onPrimary, onCancel }) {
  const isSuccess = type === 'success'
  const primaryRef = useRef(null)

  useEffect(() => { primaryRef.current?.focus() }, [])

  return (
    <div className="profile-popup-backdrop">
      <div
        className="profile-popup"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="profile-popup-title"
        aria-describedby="profile-popup-text"
      >
        <img src={isSuccess ? checkCircleIcon : alertCircleIcon} alt="" width="80" height="80" />
        <h2 id="profile-popup-title" className="profile-popup-title">
          {isSuccess ? '¡Operación exitosa!' : '¡Ocurrió un error!'}
        </h2>
        <p id="profile-popup-text" className="profile-popup-text">
          {isSuccess
            ? 'Tus cambios han sido guardados correctamente.'
            : 'No pudimos procesar tu solicitud. Inténtalo de nuevo.'}
        </p>
        <div className="profile-popup-actions">
          <button ref={primaryRef} type="button" className="profile-popup-btn primary" onClick={onPrimary}>
            {isSuccess ? 'Continuar' : 'Reintentar'}
          </button>
          {!isSuccess && (
            <button type="button" className="profile-popup-btn secondary" onClick={onCancel}>
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Profile({ screen, onNavigate }) {
  const [user, setUser] = useState(() => loadProfile(profileData.user))
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
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(() => toForm(user))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null)
  const fileRef = useRef(null)

  useEffect(() => {
    setNotificationPrefs(prefs)
  }, [prefs])

  useEffect(() => {
    const theme = darkMode ? 'dark' : 'light'
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('theme', theme) } catch {}
  }, [darkMode])

  const openEdit = () => {
    setForm(toForm(user))
    setErrors({})
    setEditing(true)
    window.scrollTo?.(0, 0)
  }

  const closeEdit = () => {
    setEditing(false)
    setResult(null)
    window.scrollTo?.(0, 0)
  }

  const updateField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const handlePhoto = (e) => {
    const file = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => updateField('photo', reader.result)
    reader.readAsDataURL(file)
  }

  const save = async (e) => {
    e?.preventDefault()
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length) return
    setSaving(true)
    try {
      await new Promise((res) => setTimeout(res, 450))
      const updated = {
        ...user,
        name: form.name.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        career: form.career.trim(),
        photo: form.photo,
      }
      persistProfile(updated)
      setUser(updated)
      setResult('success')
    } catch {
      setResult('error')
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <div className="profile-screen edit-profile-screen">
        <header className="edit-profile-header">
          <button type="button" className="edit-profile-back" onClick={closeEdit} aria-label="Volver al perfil">
            <img src={arrowLeftIcon} alt="" width="18" height="18" />
          </button>
          <h1 className="edit-profile-title">Editar perfil</h1>
          <span className="edit-profile-spacer" aria-hidden="true" />
        </header>

        <div className="edit-profile-avatar-section">
          <button
            type="button"
            className="edit-profile-avatar"
            onClick={() => fileRef.current?.click()}
            aria-label="Cambiar foto de perfil"
          >
            <span className="edit-profile-avatar-img">
              <img src={form.photo || defaultAvatar} alt="" />
            </span>
            <span className="edit-profile-camera">
              <img src={cameraIcon} alt="" width="16" height="16" />
            </span>
          </button>
          <button type="button" className="edit-profile-photo-link" onClick={() => fileRef.current?.click()}>
            Cambiar foto de perfil
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handlePhoto} />
        </div>

        <form className="edit-profile-form" onSubmit={save} noValidate>
          {EDITABLE_FIELDS.slice(0, 2).map((f) => (
            <ProfileField key={f.key} field={f} value={form[f.key]} error={errors[f.key]} onChange={updateField} />
          ))}

          <div className="profile-field">
            <label className="profile-field-label" htmlFor="profile-email">Correo electrónico</label>
            <div className="profile-field-box locked">
              <input
                id="profile-email"
                type="email"
                className="profile-field-input"
                value={user.email}
                readOnly
                aria-readonly="true"
              />
              <img src={lockIcon} alt="" width="16" height="16" />
            </div>
          </div>

          {EDITABLE_FIELDS.slice(2).map((f) => (
            <ProfileField key={f.key} field={f} value={form[f.key]} error={errors[f.key]} onChange={updateField} />
          ))}

          <div className="edit-profile-actions">
            <button type="submit" className="edit-profile-save" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>

        {result && (
          <ResultPopup
            type={result}
            onPrimary={result === 'success' ? closeEdit : () => { setResult(null); save() }}
            onCancel={() => setResult(null)}
          />
        )}

        <BottomNav screen={screen} onNavigate={onNavigate} />
        <div className="home-indicator" aria-hidden="true" />
      </div>
    )
  }

  return (
    <div className="profile-screen">
      <header className="profile-header">
        <div className="avatar">
          <img src={user.photo || defaultAvatar} alt="Foto de perfil" className="avatar-img" />
        </div>
        <div className="profile-info">
          <h1 className="profile-name">{user.name}</h1>
          <p className="profile-email">{user.email}</p>
          <button type="button" className="edit-link" onClick={openEdit}>Editar perfil</button>
        </div>
      </header>

      <div className="profile-content">
        <section className="section">
          <h2 className="section-title">Ajustes de la aplicación</h2>
          <div className="settings-card">
            <div className="setting-row">
              <span className="setting-label">Notificaciones de bus</span>
              <Switch
                label="Notificaciones de bus"
                checked={!!prefs.bus}
                onChange={(v) => setPrefs((p) => ({ ...p, bus: v }))}
              />
            </div>
            <div className="setting-row">
              <span className="setting-label">Modo oscuro</span>
              <Switch label="Modo oscuro" checked={darkMode} onChange={setDarkMode} />
            </div>
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">Sobre MoviCampus</h2>
          <div className="info-card">
            <div className="info-row">
              <span className="info-label">Versión</span>
              <span className="info-value">{user.version}</span>
            </div>
            <button type="button" className="info-row">
              <span className="info-label">Términos y condiciones</span>
              <img src={chevronRightIcon} alt="" width="16" height="16" />
            </button>
            <button type="button" className="info-row">
              <span className="info-label">Política de privacidad</span>
              <img src={chevronRightIcon} alt="" width="16" height="16" />
            </button>
          </div>
        </section>

        <button type="button" className="logout-btn" onClick={() => onNavigate?.('login')}>Cerrar sesión</button>
      </div>

      <BottomNav screen={screen} onNavigate={onNavigate} />

      <div className="home-indicator" aria-hidden="true" />
    </div>
  )
}

function ProfileField({ field, value, error, onChange }) {
  const id = `profile-${field.key}`
  const errorId = `${id}-error`
  return (
    <div className="profile-field">
      <label className="profile-field-label" htmlFor={id}>{field.label}</label>
      <div className={`profile-field-box ${error ? 'has-error' : ''}`}>
        <input
          id={id}
          type={field.type || 'text'}
          className="profile-field-input"
          value={value}
          autoComplete={field.autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          onChange={(e) => onChange(field.key, e.target.value)}
        />
      </div>
      {error && (
        <p id={errorId} className="profile-field-error" role="alert">
          <img src={alertCircleIcon} alt="" width="14" height="14" />
          {error}
        </p>
      )}
    </div>
  )
}
