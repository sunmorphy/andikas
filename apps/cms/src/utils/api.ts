import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cms_token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export async function translateText(text: string, targetLangs?: string[]): Promise<Record<string, string>> {
  if (!text || text.trim() === '') return {}
  const res = await api.post('/translate', { text, targetLangs })
  if (res.data.success) {
    return res.data.translations
  }
  throw new Error(res.data.error || 'Translation failed')
}

export default api
