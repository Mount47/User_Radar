<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const links = [
  { name: 'Dashboard', path: '/', label: '概览' },
  { name: 'People', path: '/people', label: '人员' },
  { name: 'Devices', path: '/devices', label: '设备' },
  { name: 'Mappings', path: '/mappings', label: '雷达绑定' },
  { name: 'Realtime', path: '/realtime', label: '实时监测' },
  { name: 'History', path: '/history', label: '历史数据' },
  { name: 'Alerts', path: '/alerts', label: '告警处理' }
]

const activePath = computed(() => route.path)
</script>

<template>
  <nav class="primary-nav">
    <RouterLink v-for="item in links" :key="item.path" :to="item.path" class="nav-link"
      :class="{ active: activePath.startsWith(item.path) && item.path !== '/' }" exact-active-class="active">
      <span>{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.primary-nav {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.6rem;
  font-size: 0.95rem;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  padding: 0.2rem;
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.nav-link {
  color: rgba(12, 16, 28, 0.8);
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: none;
  transition: color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
  padding: 0.55rem 0.9rem;
  border-radius: 999px;
}

.nav-link.active {
  color: #0f172a;
  background: linear-gradient(135deg, rgba(94, 234, 212, 0.35), rgba(129, 140, 248, 0.35));
  box-shadow: 0 10px 30px rgba(79, 70, 229, 0.2);
}

.nav-link:not(.active):hover {
  color: #0f172a;
}
</style>
