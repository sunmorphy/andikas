import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import LoginView from '../views/LoginView.vue'
import AppLayout from '../components/layout/AppLayout.vue'
import DashboardView from '../views/DashboardView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { guest: true }
    },
    {
      path: '/',
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: DashboardView
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('../views/ProfileView.vue')
        },
        {
          path: 'skills',
          name: 'skills',
          component: () => import('../views/SkillsView.vue')
        },
        {
          path: 'tags',
          name: 'tags',
          component: () => import('../views/TagsView.vue')
        },
        {
          path: 'experience',
          name: 'experience',
          component: () => import('../views/ExperienceView.vue')
        },
        {
          path: 'education',
          name: 'education',
          component: () => import('../views/EducationView.vue')
        },
        {
          path: 'certifications',
          name: 'certifications',
          component: () => import('../views/CertificationsView.vue')
        },
        {
          path: 'projects',
          name: 'projects',
          component: () => import('../views/ProjectsView.vue')
        }
      ]
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login' })
  } else if (to.meta.guest && authStore.isAuthenticated) {
    next({ name: 'dashboard' })
  } else {
    next()
  }
})

export default router
