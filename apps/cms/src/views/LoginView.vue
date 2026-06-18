<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const identifier = ref('')
const password = ref('')
const errorMsg = ref('')

const authStore = useAuthStore()
const router = useRouter()

async function handleLogin() {
  errorMsg.value = ''
  if (!identifier.value || !password.value) {
    errorMsg.value = 'Please provide both identifier and password'
    return
  }

  const success = await authStore.login(identifier.value, password.value)
  if (success) {
    router.push('/')
  } else {
    errorMsg.value = 'Invalid credentials or server error'
  }
}
</script>

<template>
  <div class="login-container">
    <div class="card login-card">
      <div class="login-header">
        <h1>Portfolio CMS</h1>
        <p>Login to manage your portfolio</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="identifier">Email or Username</label>
          <input 
            id="identifier" 
            v-model="identifier" 
            type="text" 
            placeholder="user@example.com" 
            required 
            :disabled="authStore.loading"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input 
            id="password" 
            v-model="password" 
            type="password" 
            placeholder="••••••••" 
            required 
            :disabled="authStore.loading"
          />
        </div>

        <div v-if="errorMsg" class="error-msg">
          {{ errorMsg }}
        </div>

        <button type="submit" class="btn btn-primary login-btn" :disabled="authStore.loading">
          {{ authStore.loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 1rem;
  background-color: var(--color-bg-base);
}

.login-card {
  width: 100%;
  max-width: 400px;
  border: 2px solid var(--color-text-primary);
  padding: 2.5rem;
}

.login-header {
  text-align: left;
  margin-bottom: 2.5rem;
  border-bottom: 2px solid var(--color-border);
  padding-bottom: 1.5rem;
}

.login-header h1 {
  font-size: 2.25rem;
  font-weight: 900;
  letter-spacing: -0.04em;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  line-height: 1.0;
}

.login-header p {
  color: var(--color-primary);
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.login-btn {
  width: 100%;
  margin-top: 1.5rem;
}

.error-msg {
  color: var(--color-danger);
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  margin-top: 0.75rem;
  text-align: center;
}
</style>
