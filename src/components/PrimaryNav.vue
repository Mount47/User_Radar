<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const links = [
  { name: 'Dashboard', path: '/', label: '概览' },
  { name: 'People', path: '/people', label: '人员' },
  { name: 'Mappings', path: '/mappings', label: '雷达绑定' },
  { name: 'Realtime', path: '/realtime', label: '实时监测' },
  { name: 'History', path: '/history', label: '历史数据' },
  { name: 'Alerts', path: '/alerts', label: '告警处理' }
]

const activePath = computed(() => route.path)
</script>

<template>
  <nav class="primary-nav">
    <RouterLink
      v-for="item in links"
      :key="item.path"
      :to="item.path"
      class="nav-link"
      :class="{ active: activePath.startsWith(item.path) && item.path !== '/' }"
      exact-active-class="active"
    >
      <span>{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.primary-nav {
  display: flex;
  flex-wrap: nowrap;
  gap: 1.1rem;
  font-size: 0.95rem;
}

.nav-link {
  color: rgba(244, 245, 255, 0.8);
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: none;
  transition: color 0.2s ease;
}

.nav-link.active {
  color: #f97316;
}

.nav-link:not(.active):hover {
  color: #fff;
}
</style>
