<script setup lang="ts">
import { useAuthStore } from '../../stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

function logout() {
  authStore.logout()
}
</script>

<template>
  <div class="app-layout">
    <aside class="sidebar">
      <div class="brand">
        <h2>CMS</h2>
      </div>
      <nav class="nav-menu">
        <router-link to="/" class="nav-link" exact-active-class="active">Dashboard</router-link>
        <router-link to="/profile" class="nav-link" exact-active-class="active">Profile</router-link>
        <router-link to="/skills" class="nav-link" exact-active-class="active">Skills</router-link>
        <router-link to="/tags" class="nav-link" exact-active-class="active">Tags</router-link>
        <router-link to="/experience" class="nav-link" exact-active-class="active">Experience</router-link>
        <router-link to="/education" class="nav-link" exact-active-class="active">Education</router-link>
        <router-link to="/certifications" class="nav-link" exact-active-class="active">Certifications</router-link>
        <router-link to="/projects" class="nav-link" exact-active-class="active">Projects</router-link>
      </nav>
      <div class="sidebar-footer">
        <button class="btn btn-secondary logout-btn" @click="logout">Logout</button>
      </div>
    </aside>
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <component :is="Component" />
      </router-view>
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 240px;
  background-color: var(--color-bg-surface);
  border-right: 1.5px solid var(--color-border);
  display: flex;
  flex-direction: column;
}

.brand {
  padding: 2rem 1.5rem;
  border-bottom: 1.5px solid var(--color-border);
}

.brand h2 {
  font-size: 1.5rem;
  font-weight: 900;
  color: var(--color-text-primary);
  letter-spacing: -0.04em;
}

.nav-menu {
  flex: 1;
  padding: 1.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.nav-link {
  padding: 0.75rem 1.5rem;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
  border-left: 4px solid transparent;
  transition: none;
}

.nav-link:hover {
  background-color: var(--color-bg-surface-hover);
  color: var(--color-text-primary);
}

.nav-link.active {
  background-color: var(--color-primary);
  color: #ffffff;
  border-left-color: #ffffff;
}

.sidebar-footer {
  padding: 1.5rem;
  border-top: 1.5px solid var(--color-border);
}

.logout-btn {
  width: 100%;
}

.main-content {
  flex: 1;
  padding: 2.5rem;
  overflow-y: auto;
  height: 100vh;
  background-color: var(--color-bg-base);
}
</style>
