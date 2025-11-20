import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { getActivePinia, setActivePinia } from 'pinia'
import pinia from '@/store'
import { useUserStore } from '@/store/user'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue')
  },
  {
    path: '/devices',
    name: 'devices',
    component: () => import('@/views/DevicesView.vue')
  },
  {
    path: '/people',
    name: 'people',
    component: () => import('@/views/PeopleView.vue')
  },
  {
    path: '/mappings',
    name: 'mappings',
    component: () => import('@/views/MappingsView.vue')
  },
  {
    path: '/realtime',
    name: 'realtime',
    component: () => import('@/views/RealtimeView.vue')
  },
  {
    path: '/history',
    name: 'history',
    component: () => import('@/views/HistoryView.vue')
  },
  {
    path: '/alerts',
    name: 'alerts',
    component: () => import('@/views/AlertsView.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

router.beforeEach((to, _from, next) => {
  if (!getActivePinia()) {
    setActivePinia(pinia)
  }

  const store = useUserStore()

  if (!store.isAuthenticated && !to.meta.public) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  if (store.isAuthenticated && to.name === 'login') {
    next({ name: 'dashboard' })
    return
  }

  next()
})

export default router
