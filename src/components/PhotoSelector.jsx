import { useEffect, useRef, useState } from 'react'
import './PhotoSelector.css'

function initials(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function PhotoSelector({ value, initialValue, name, onChange, disabled }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const fileRef = useRef(null)
  const ini = initials(name)

  const hasChanges = value !== initialValue

  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const handleFile = (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => onChange?.(reader.result)
    reader.readAsDataURL(file)
    e.target.value = ''
    setOpen(false)
  }

  const selectOption = (opt) => {
    if (opt.action === 'upload') {
      fileRef.current?.click()
      setOpen(false)
      return
    }
    if (opt.action === 'default' || opt.action === 'remove') {
      onChange?.(null)
      setOpen(false)
      return
    }
  }

  const options = [
    { id: 'default', label: 'Foto por defecto', icon: 'fa-user', action: 'default' },
    { id: 'upload', label: 'Subir nueva', icon: 'fa-upload', action: 'upload' },
    { id: 'remove', label: 'Eliminar foto', icon: 'fa-trash', action: 'remove' },
  ]

  return (
    <div className="photo-selector" ref={rootRef}>
      <div className={`photo-selector-preview ${hasChanges ? 'has-changes' : ''}`}>
        {value ? (
          <img src={value} alt="Foto de perfil" className="photo-selector-preview-img" />
        ) : (
          <span className="photo-selector-initials" aria-hidden="true">{ini}</span>
        )}
      </div>

      <div className="photo-selector-control">
        <button
          type="button"
          className={`photo-selector-trigger ${open ? 'open' : ''}`}
          onClick={() => !disabled && setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          disabled={disabled}
        >
          <span className="photo-selector-trigger-label">
            <i className="fa-solid fa-image" />
            Seleccionar foto
          </span>
          <i className={`fa-solid fa-chevron-down photo-selector-chevron ${open ? 'open' : ''}`} />
        </button>

        {open && (
          <ul className="photo-selector-menu" role="listbox">
            {options.map((opt) => {
              const selected = (opt.action === 'default' || opt.action === 'remove') && !value
              return (
                <li key={opt.id} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    className={`photo-selector-option ${selected ? 'selected' : ''}`}
                    onClick={() => selectOption(opt)}
                  >
                    <span className="photo-selector-option-icon">
                      <i className={`fa-solid ${opt.icon}`} />
                    </span>
                    <span className="photo-selector-option-label">{opt.label}</span>
                    {selected && <i className="fa-solid fa-check photo-selector-option-check" />}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
    </div>
  )
}