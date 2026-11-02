const PROFILE_KEY = 'profile'

export function loadProfile(defaultUser) {
  try {
    const stored = localStorage.getItem(PROFILE_KEY)
    if (stored) return { ...defaultUser, photo: null, ...JSON.parse(stored) }
  } catch {}
  return { ...defaultUser, photo: null }
}

export function saveProfile(profile) {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)) } catch {}
  return profile
}
