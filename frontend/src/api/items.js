import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
})

// Attach JWT from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const getItems    = ()           => api.get('/items/')
export const getItem     = (id)         => api.get(`/items/${id}`)
export const createItem  = (data)       => api.post('/items/', data)
export const updateItem  = (id, data)   => api.put(`/items/${id}`, data)
export const deleteItem  = (id)         => api.delete(`/items/${id}`)

