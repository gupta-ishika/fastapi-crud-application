import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
})

// ── Token helpers ─────────────────────────────────────────────────────────────

export const getToken  = () => localStorage.getItem('token')
export const setToken  = (t) => localStorage.setItem('token', t)
export const clearToken = () => localStorage.removeItem('token')

// ── Auth API ─────────────────────────────────────────────────────────────────

export async function register(username, password, role = 'user') {
  const res = await api.post('/auth/register', { username, password, role })
  return res.data   // UserResponse
}

export async function login(username, password) {
  // OAuth2 form-encoded body
  const params = new URLSearchParams()
  params.append('username', username)
  params.append('password', password)
  const res = await api.post('/auth/token', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  setToken(res.data.access_token)
  return res.data
}

export async function getMe() {
  const token = getToken()
  const res = await api.get('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.data   // UserResponse
}

export function logout() {
  clearToken()
}
