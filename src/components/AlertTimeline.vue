<script setup lang="ts">
import type { CaregiverAlert } from '@/types'

const props = defineProps<{ items: CaregiverAlert[] }>()

function severityColor(level: CaregiverAlert['severity']) {
  switch (level) {
    case 'CRITICAL':
      return '#ef4444'
    case 'HIGH':
      return '#f97316'
    case 'MEDIUM':
      return '#facc15'
    default:
      return '#10b981'
  }
}
</script>

<template>
  <section class="timeline-card">
    <header>
      <div>
        <p class="eyebrow">最新事件</p>
        <h4>告警时间线</h4>
      </div>
      <span>{{ props.items.length }} 条</span>
    </header>
    <ol>
      <li v-for="item in props.items" :key="item.alertId">
        <span class="dot" :style="{ background: severityColor(item.severity) }"></span>
        <div class="body">
          <p class="title">{{ item.personName }} · {{ item.alertType }}</p>
          <p class="description">设备 {{ item.deviceId }} · {{ item.severity }}</p>
          <div class="meta">
            <span>{{ new Date(item.detectedAt).toLocaleString() }}</span>
            <span v-if="item.acknowledged" class="resolved">已确认</span>
          </div>
        </div>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.timeline-card {
  background: rgba(8, 11, 18, 0.88);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
  color: #f8fafc;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 0.75rem;
  color: rgba(248, 250, 252, 0.5);
}

ol {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

li {
  display: grid;
  grid-template-columns: 18px 1fr;
  gap: 1rem;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-top: 0.3rem;
}

.title {
  font-weight: 600;
}

.description {
  font-size: 0.9rem;
  color: rgba(248, 250, 252, 0.7);
}

.meta {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: rgba(248, 250, 252, 0.5);
}

.resolved {
  color: #34d399;
}
</style>
