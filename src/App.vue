<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import PrimaryNav from './components/PrimaryNav.vue'
import { useUserStore } from '@/store/user'

const router = useRouter()
const store = useUserStore()
const accountMenuOpen = ref(false)
const searchValue = ref('')

const alertCount = computed(() => store.alertStats.active)
const accountName = computed(() => store.username || '访客')
const avatarLabel = computed(() => {
  if (!store.isAuthenticated) {
    return '登'
  }
  const trimmed = accountName.value.trim()
  return trimmed.slice(0, 2)
})

function handleLogout() {
  store.logout()
  accountMenuOpen.value = false
  router.push({ name: 'login' })
}

function handleLogin() {
  accountMenuOpen.value = false
  router.push({ name: 'login' })
}

function goAlerts() {
  router.push({ name: 'alerts' })
}

function onAvatarClick(event: MouseEvent) {
  event.stopPropagation()
  if (!store.isAuthenticated) {
    handleLogin()
    return
  }
  accountMenuOpen.value = !accountMenuOpen.value
}

function closeMenu() {
  accountMenuOpen.value = false
}

onMounted(() => {
  document.addEventListener('click', closeMenu)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeMenu)
})
</script>

<template>
  <div class="app-shell">
    <div class="background-glow" aria-hidden="true"></div>
    <header class="nav-bar">
      <div class="brand">
        <div class="logo"></div>
        <div class="brand-meta">
          <strong>毫米波监测</strong>
          <span>mmWave</span>
        </div>
      </div>
      <PrimaryNav />
      <div class="nav-actions">
        <label class="search" aria-label="搜索">
          <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
            <path
              d="M15.5 14h-.79l-.28-.27A6 6 0 1 0 14 15.5l.27.28v.79L20 21.49 21.49 20Zm-6 0a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z"
              fill="currentColor"
            />
          </svg>
          <input v-model="searchValue" type="search" placeholder="搜索" />
        </label>
        <button class="icon-btn" type="button" aria-label="查看异常告警" @click="goAlerts">
          <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
            <path
              d="M12 3a7 7 0 0 0-7 7v2.43L3.46 15A1 1 0 0 0 4.2 16.7H8a4 4 0 0 0 8 0h3.8a1 1 0 0 0 .74-1.71L19 12.43V10a7 7 0 0 0-7-7Zm0 2a5 5 0 0 1 5 5v2.78l1.35 1.41H5.65L7 12.78V10a5 5 0 0 1 5-5Zm-2 13h4a2 2 0 0 1-4 0Z"
              fill="currentColor"
            />
          </svg>
          <span v-if="alertCount" class="badge">{{ alertCount }}</span>
        </button>
        <div class="avatar-wrapper">
          <button class="avatar-btn" type="button" aria-label="账号" @click="onAvatarClick">
            <span>{{ avatarLabel }}</span>
          </button>
          <transition name="fade">
            <div v-if="accountMenuOpen" class="account-menu" @click.stop>
              <p class="account-title">{{ accountName }}</p>
              <p class="account-role">{{ store.profile?.role || '访客权限' }}</p>
              <button type="button" class="account-action" @click="handleLogout">退出登录</button>
            </div>
          </transition>
        </div>
      </div>
    </header>
    <main class="main-panel">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  position: relative;
  min-height: 100vh;
  padding: clamp(1rem, 3vw, 2.5rem);
}

.background-glow {
  position: fixed;
  inset: 0;
  background: radial-gradient(circle at 10% 20%, rgba(120, 143, 255, 0.25), transparent 45%),
    radial-gradient(circle at 80% 0%, rgba(251, 113, 133, 0.18), transparent 40%),
    radial-gradient(circle at 60% 80%, rgba(45, 212, 191, 0.15), transparent 40%);
  filter: blur(90px);
  pointer-events: none;
}

.nav-bar {
  position: relative;
  z-index: 5;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1.5rem;
  padding: 0.9rem 1.4rem;
  border-radius: 22px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(244, 247, 255, 0.9));
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.12);
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: linear-gradient(135deg, #6ee7f3, #a855f7);
}

.brand-meta {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.brand-meta strong {
  font-size: 1rem;
  color: #0f172a;
}

.brand-meta span {
  font-size: 0.75rem;
  color: rgba(15, 23, 42, 0.45);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.search {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.8);
}

.search svg {
  width: 16px;
  height: 16px;
  color: rgba(15, 23, 42, 0.6);
}

.search input {
  border: none;
  background: transparent;
  color: #0f172a;
  outline: none;
  width: 120px;
}

.icon-btn {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(248, 250, 252, 0.95);
  color: #0f172a;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.icon-btn:hover {
  border-color: rgba(15, 23, 42, 0.2);
  background: #fff;
}

.icon-btn svg {
  width: 20px;
  height: 20px;
}

.badge {
  position: absolute;
  top: -4px;
  right: -4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  font-size: 0.7rem;
  border-radius: 999px;
  background: #f43f5e;
  color: #fff;
  font-weight: 600;
}

.avatar-wrapper {
  position: relative;
}

.avatar-btn {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: linear-gradient(135deg, rgba(110, 231, 243, 0.55), rgba(168, 85, 247, 0.55));
  color: #0f172a;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
}

.avatar-btn:hover {
  transform: translateY(-1px);
}

.account-menu {
  position: absolute;
  right: 0;
  margin-top: 0.5rem;
  width: 190px;
  padding: 1rem;
  border-radius: 16px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.95);
  color: #0f172a;
  box-shadow: 0 20px 55px rgba(15, 23, 42, 0.2);
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  z-index: 20;
}

.account-title {
  font-weight: 600;
}

.account-role {
  font-size: 0.8rem;
  color: rgba(15, 23, 42, 0.55);
}

.account-action {
  margin-top: 0.6rem;
  border: none;
  border-radius: 999px;
  padding: 0.4rem 0.8rem;
  background: linear-gradient(135deg, #6ee7f3, #a855f7);
  color: #0f172a;
  cursor: pointer;
  font-weight: 600;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.main-panel {
  position: relative;
  z-index: 1;
  margin-top: clamp(0.5rem, 2vw, 1rem);
}
</style>
