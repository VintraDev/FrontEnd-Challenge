import axios from 'axios'
export const http = axios.create({ baseURL: '/api', timeout: 5000 })

export const sessionTokenKey = 'kurio-demo-session'
http.interceptors.request.use((config) => {
  const token = localStorage.getItem(sessionTokenKey)
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})
