<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import api from '../utils/api'

interface Skill {
  id: string
  name: string
}

interface Project {
  id: string
  title: string
  published: boolean
  highlighted: boolean
  type: string
  skills?: Skill[]
}

const authStore = useAuthStore()
const projects = ref<Project[]>([])
const loading = ref(true)
const error = ref(false)

async function fetchProjects() {
  loading.value = true
  error.value = false
  try {
    const { data } = await api.get('/projects')
    if (data.success) {
      projects.value = data.data
    }
  } catch (err) {
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchProjects()
})

const totalProjects = computed(() => projects.value.length)
const publishedCount = computed(() => projects.value.filter(p => p.published).length)
const draftCount = computed(() => projects.value.filter(p => !p.published).length)
const highlightedCount = computed(() => projects.value.filter(p => p.highlighted).length)

// Group projects by type
const projectsByType = computed(() => {
  const counts: Record<string, number> = {}
  projects.value.forEach(p => {
    const t = p.type || 'individual'
    counts[t] = (counts[t] || 0) + 1
  })
  return Object.entries(counts).map(([type, count]) => ({ type, count }))
})
</script>

<template>
  <div class="dashboard-container">
    <h1 class="page-title">Dashboard</h1>
    
    <!-- Welcome Banner -->
    <div class="welcome-card card">
      <h2>Welcome back, {{ authStore.user?.name || authStore.user?.username || 'User' }}</h2>
      <p>Monitor your portfolio metrics and project analytics below.</p>
    </div>

    <!-- Loading/Error States -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <span>Loading project insights...</span>
    </div>
    
    <div v-else-if="error" class="error-state card">
      <p>Failed to retrieve project data. Please verify your connection status.</p>
    </div>

    <div v-else class="insights-content">
      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-box card">
          <div class="stat-num">{{ totalProjects }}</div>
          <div class="stat-label">Total Projects</div>
        </div>
        <div class="stat-box card">
          <div class="stat-num">{{ publishedCount }}</div>
          <div class="stat-label">Published</div>
        </div>
        <div class="stat-box card">
          <div class="stat-num">{{ draftCount }}</div>
          <div class="stat-label">Drafts</div>
        </div>
        <div class="stat-box card">
          <div class="stat-num">{{ highlightedCount }}</div>
          <div class="stat-label">Starred</div>
        </div>
      </div>

      <!-- Details Section -->
      <div class="details-section">
        <!-- Breakdown Card -->
        <div class="card breakdown-card">
          <h3>Breakdown by Type</h3>
          <div class="breakdown-list">
            <div v-for="item in projectsByType" :key="item.type" class="breakdown-item">
              <span class="item-type">{{ item.type }}</span>
              <span class="item-count">{{ item.count }}</span>
            </div>
            <div v-if="projectsByType.length === 0" class="empty-text">No project classifications.</div>
          </div>
        </div>

        <!-- Recent Projects Card -->
        <div class="card recent-projects-card">
          <h3>Recent Projects Log</h3>
          <div class="projects-list">
            <div v-for="proj in projects.slice(0, 5)" :key="proj.id" class="project-item">
              <div class="project-info">
                <h4>{{ proj.title }}</h4>
                <span class="project-meta-type">{{ proj.type }}</span>
              </div>
              <div class="project-status-tags">
                <span v-if="proj.highlighted" class="status-tag tag-highlighted">Starred</span>
                <span :class="['status-tag', proj.published ? 'tag-published' : 'tag-draft']">
                  {{ proj.published ? 'Published' : 'Draft' }}
                </span>
              </div>
            </div>
            <div v-if="projects.length === 0" class="empty-text">No projects found. Create one from the Projects panel.</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.welcome-card {
  padding: 2.5rem;
  border-left: 5px solid var(--color-primary);
}

.welcome-card h2 {
  font-size: 1.75rem;
  font-weight: 900;
  margin-bottom: 0.5rem;
  letter-spacing: -0.03em;
}

.welcome-card p {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5rem;
  gap: 1rem;
  color: var(--color-text-secondary);
}

.spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3.5px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Stats Layout */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

.stat-box {
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border: 1.5px solid var(--color-border);
}

.stat-num {
  font-size: 4rem;
  font-weight: 900;
  color: var(--color-primary);
  line-height: 1.0;
  letter-spacing: -0.05em;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
}

/* Details Section */
.details-section {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 1.5rem;
  align-items: start;
}

@media (max-width: 868px) {
  .details-section {
    grid-template-columns: 1fr;
  }
}

.breakdown-card, .recent-projects-card {
  padding: 2rem;
  border: 1.5px solid var(--color-border);
}

.breakdown-card h3, .recent-projects-card h3 {
  font-size: 1rem;
  font-weight: 900;
  margin-bottom: 1.5rem;
  border-bottom: 1.5px solid var(--color-border);
  padding-bottom: 0.75rem;
  letter-spacing: -0.02em;
}

.breakdown-list {
  display: flex;
  flex-direction: column;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  padding: 0.85rem 0;
  border-bottom: 1px solid var(--color-border);
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.breakdown-item:last-child {
  border-bottom: none;
}

.item-type {
  color: var(--color-text-secondary);
}

.item-count {
  color: var(--color-primary);
  font-weight: 900;
}

.projects-list {
  display: flex;
  flex-direction: column;
}

.project-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid var(--color-border);
}

.project-item:last-child {
  border-bottom: none;
}

.project-info h4 {
  font-size: 0.85rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: -0.01em;
  color: var(--color-text-primary);
}

.project-meta-type {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-text-tertiary);
  margin-top: 0.2rem;
  display: block;
}

.project-status-tags {
  display: flex;
  gap: 0.35rem;
}

.status-tag {
  font-size: 0.6rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.25rem 0.5rem;
  display: inline-block;
}

.tag-published {
  background-color: var(--color-text-primary);
  color: var(--color-bg-base);
}

.tag-draft {
  background-color: transparent;
  color: var(--color-text-secondary);
  border: 1.5px solid var(--color-border);
}

.tag-highlighted {
  background-color: var(--color-primary);
  color: #ffffff;
}

.empty-text {
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
  text-align: center;
  padding: 3rem 0;
  text-transform: uppercase;
  font-weight: 700;
}
</style>
