const USERS_KEY = 'movicampus_users'
const SESSION_KEY = 'movicampus_session'

function storage() {
  try { return typeof localStorage !== 'undefined' ? localStorage : null } catch { return null }
}

function read(key, fallback) {
  const s = storage()
  if (!s) return fallback
  try {
    const raw = s.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  const s = storage()
  if (!s) return
  try { s.setItem(key, JSON.stringify(value)) } catch {}
}

function remove(key) {
  const s = storage()
  if (!s) return
  try { s.removeItem(key) } catch {}
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim())
}

export function validateEmail(email) { return isValidEmail(email) }

export function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 6
}

export function validatePassword(password) { return isValidPassword(password) }

function normalizeEmail(email) { return String(email || '').trim().toLowerCase() }

function makeId() { return `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` }

function publicUser(user) {
  if (!user) return null
  const result = { ...user }
  delete result.password
  return result
}

export function getUsers() {
  const users = read(USERS_KEY, [])
  return Array.isArray(users) ? users : []
}

export function saveUsers(users) {
  write(USERS_KEY, Array.isArray(users) ? users : [])
  return users
}

export function findUserByEmail(email) {
  const target = normalizeEmail(email)
  return getUsers().find((u) => normalizeEmail(u && u.email) === target) || null
}

export function getUserByEmail(email) { return findUserByEmail(email) }

export function setSession(user) {
  write(SESSION_KEY, publicUser(user))
  return user
}

export function getSession() { return read(SESSION_KEY, null) }

export function getSessionUser() { return getSession() }

export function getCurrentUser() { return getSession() }

export function getUser() { return getSession() }

export function currentUser() { return getSession() }

export function isAuthenticated() { return !!getSession() }

export function isLoggedIn() { return isAuthenticated() }

function wrap(user) {
  const result = publicUser(user)
  if (result) {
    result.success = true
    result.ok = true
    result.user = result
  }
  return result
}

export function register(input) {
  let data = input || {}
  if (typeof input === 'string') data = { email: input }
  const { name, email, password, confirmPassword, ...rest } = data

  const errors = {}
  if (!name || !String(name).trim()) errors.name = 'El nombre es obligatorio'
  if (!isValidEmail(email)) errors.email = 'Correo invalido'
  if (!isValidPassword(password)) errors.password = 'La contrasena debe tener al menos 6 caracteres'
  if (confirmPassword != null && confirmPassword !== password) errors.confirmPassword = 'Las contrasenas no coinciden'
  if (isValidEmail(email) && findUserByEmail(email)) errors.email = 'El correo ya esta registrado'

  if (Object.keys(errors).length > 0) {
    const err = new Error('Validacion fallida')
    err.errors = errors
    throw err
  }

  const user = {
    id: makeId(),
    name: String(name).trim(),
    email: normalizeEmail(email),
    password: String(password),
    provider: 'email',
    createdAt: new Date().toISOString(),
    ...rest,
  }

  const users = getUsers()
  users.push(user)
  saveUsers(users)
  setSession(user)
  return wrap(user)
}
export const registerUser = register
export const signUp = register
export const signup = register
export const createAccount = register
export const createUser = register
export const registerAccount = register

export function login(a, b) {
  let email, password
  if (a && typeof a === 'object') {
    email = a.email
    password = a.password
  } else {
    email = a
    password = b
  }

  const user = findUserByEmail(email)
  if (!user || user.password !== String(password || '')) {
    const err = new Error('Credenciales invalidas')
    err.errors = { credentials: 'Correo o contrasena incorrectos' }
    throw err
  }
  setSession(user)
  return wrap(user)
}

export const loginUser = login
export const signIn = login
export const signin = login
export const authenticate = login

function socialLogin(provider, name, email) {
  let user = findUserByEmail(email)
  if (!user) {
    user = {
      id: makeId(),
      name,
      email: normalizeEmail(email),
      password: '',
      provider,
      createdAt: new Date().toISOString(),
    }
    const users = getUsers()
    users.push(user)
    saveUsers(users)
  } else {
    user.provider = provider
  }
  setSession(user)
  return wrap(user)
}

export function loginWithGoogle() {
  return socialLogin('google', 'Usuario Google', 'usuario.google@movicampus.com')
}

export const signInWithGoogle = loginWithGoogle
export const googleLogin = loginWithGoogle
export const loginGoogle = loginWithGoogle
export const googleSignIn = loginWithGoogle

export function loginWithApple() {
  return socialLogin('apple', 'Usuario Apple', 'usuario.apple@movicampus.com')
}

export const signInWithApple = loginWithApple
export const appleLogin = loginWithApple
export const loginApple = loginWithApple
export const appleSignIn = loginWithApple

export function logout() {
  remove(SESSION_KEY)
  return true
}

export const signOut = logout
export const signout = logout

export default {
  isValidEmail, validateEmail, isValidPassword, validatePassword,
  getUsers, saveUsers, findUserByEmail, getUserByEmail,
  setSession, getSession, getSessionUser, getCurrentUser, getUser, currentUser,
  isAuthenticated, isLoggedIn,
  register, registerUser, signUp, signup, createAccount, createUser, registerAccount,
  login, loginUser, signIn, signin, authenticate,
  loginWithGoogle, signInWithGoogle, googleLogin, loginGoogle, googleSignIn,
  loginWithApple, signInWithApple, appleLogin, loginApple, appleSignIn,
  logout, signOut, signout,
}