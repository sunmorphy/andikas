import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// Initialize auth state before mounting or navigating
const authStore = useAuthStore()
if (authStore.token) {
    // We can opt to fetch user details here so the app knows who is logged in
    authStore.fetchUser()
}

app.use(router)

app.mount('#app')
