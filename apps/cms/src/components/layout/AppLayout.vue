<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const isMenuOpen = ref(false)

function logout() {
  authStore.logout()
  isMenuOpen.value = false
}

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

function closeMenu() {
  isMenuOpen.value = false
}
</script>

<template>
  <div class="app-layout">
    <!-- Mobile Header -->
    <header class="mobile-header">
      <h2>Manage Content</h2>
      <button class="menu-toggle" @click="toggleMenu" aria-label="Toggle menu">
        <span class="bar" :class="{ 'open': isMenuOpen }"></span>
        <span class="bar" :class="{ 'open': isMenuOpen }"></span>
        <span class="bar" :class="{ 'open': isMenuOpen }"></span>
      </button>
    </header>

    <!-- Sidebar / Drawer -->
    <aside class="sidebar" :class="{ 'is-open': isMenuOpen }">
      <div class="brand">
        <h2>Manage Content</h2>
      </div>
      <nav class="nav-menu">
        <router-link to="/" class="nav-link" exact-active-class="active" @click="closeMenu">Dashboard</router-link>
        <router-link to="/profile" class="nav-link" exact-active-class="active" @click="closeMenu">Profile</router-link>
        <router-link to="/skills" class="nav-link" exact-active-class="active" @click="closeMenu">Skills</router-link>
        <router-link to="/tags" class="nav-link" exact-active-class="active" @click="closeMenu">Tags</router-link>
        <router-link to="/experience" class="nav-link" exact-active-class="active" @click="closeMenu">Experience</router-link>
        <router-link to="/education" class="nav-link" exact-active-class="active" @click="closeMenu">Education</router-link>
        <router-link to="/certifications" class="nav-link" exact-active-class="active" @click="closeMenu">Certifications</router-link>
        <router-link to="/projects" class="nav-link" exact-active-class="active" @click="closeMenu">Projects</router-link>
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

.mobile-header {
  display: none;
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
  font-size: 1.25rem;
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

@media (max-width: 768px) {
  .app-layout {
    flex-direction: column;
  }

  .mobile-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 60px;
    padding: 0 1.5rem;
    background-color: var(--color-bg-surface);
    border-bottom: 1.5px solid var(--color-border);
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
  }

  .mobile-header h2 {
    font-size: 1.1rem;
    font-weight: 900;
    color: var(--color-text-primary);
    letter-spacing: -0.04em;
  }

  .menu-toggle {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 20px;
    height: 14px;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
  }

  .menu-toggle .bar {
    width: 100%;
    height: 2px;
    background-color: var(--color-text-primary);
    transition: transform 0.2s ease, opacity 0.2s ease;
  }

  .menu-toggle .bar.open:nth-child(1) {
    transform: translateY(6px) rotate(45deg);
  }

  .menu-toggle .bar.open:nth-child(2) {
    opacity: 0;
  }

  .menu-toggle .bar.open:nth-child(3) {
    transform: translateY(-6px) rotate(-45deg);
  }

  .sidebar {
    position: fixed;
    top: 60px;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: calc(100vh - 60px);
    z-index: 90;
    transform: translateX(-100%);
    transition: transform 0.2s ease-in-out;
    border-right: none;
    border-bottom: 1.5px solid var(--color-border);
  }

  .sidebar.is-open {
    transform: translateX(0);
  }

  .brand {
    display: none;
  }

  .main-content {
    padding: 1.5rem;
    margin-top: 60px;
    height: calc(100vh - 60px);
  }
}
</style>
