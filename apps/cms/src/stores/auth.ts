import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../utils/api'
import router from '../router'

export interface User {
    id: string
    email: string
    username: string
    name: string
    role?: string
}

export const useAuthStore = defineStore('auth', () => {
    const user = ref<User | null>(null)
    const token = ref<string | null>(localStorage.getItem('cms_token'))
    const isAuthenticated = ref(!!token.value)
    const loading = ref(false)

    async function login(identifier: string, password: string): Promise<boolean> {
        loading.value = true
        try {
            const { data } = await api.post('/auth/login', { identifier, password })
            if (data.success && data.data) {
                user.value = data.data.user
                token.value = data.data.token
                isAuthenticated.value = true
                localStorage.setItem('cms_token', data.data.token)
                return true
            }
            return false
        } catch (e) {
            console.error('Login failed', e)
            return false
        } finally {
            loading.value = false
        }
    }

    async function fetchUser() {
        if (!token.value) return false
        loading.value = true
        try {
            const { data } = await api.get('/auth/me')
            if (data.success && data.data) {
                user.value = data.data
                isAuthenticated.value = true
                return true
            }
            logout()
            return false
        } catch (e) {
            console.error('Fetch user failed', e)
            logout()
            return false
        } finally {
            loading.value = false
        }
    }

    function logout() {
        user.value = null
        token.value = null
        isAuthenticated.value = false
        localStorage.removeItem('cms_token')
        router.push('/login')
    }

    return { user, token, isAuthenticated, loading, login, logout, fetchUser }
})
