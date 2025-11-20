<script setup lang="ts">
import type { CaregiverDevice } from '@/types'

const props = defineProps<{ mapping: CaregiverDevice }>()

const statusCopy: Record<CaregiverDevice['status'], string> = {
  ONLINE: '在线',
  OFFLINE: '离线',
  MAINTENANCE: '维护'
}
</script>

<template>
  <article class="mapping-card">
    <header>
      <div>
        <p class="eyebrow">{{ props.mapping.modelType }}</p>
        <h3>{{ props.mapping.deviceName }}</h3>
        <small>{{ props.mapping.deviceId }}</small>
      </div>
      <span class="status" :class="props.mapping.status.toLowerCase()">{{ statusCopy[props.mapping.status] }}</span>
    </header>
    <p class="person">服务对象：{{ props.mapping.persons.map((item) => item.personName).join('、') || '未绑定' }}</p>
    <div class="metrics">
      <div>
        <p>位置</p>
        <strong>{{ props.mapping.location }}</strong>
      </div>
      <div>
        <p>信号</p>
        <strong>{{ props.mapping.signalQuality ?? '--' }}%</strong>
      </div>
      <div>
        <p>最近心跳</p>
        <strong>{{ props.mapping.lastHeartbeat ? new Date(props.mapping.lastHeartbeat).toLocaleTimeString() : '--' }}</strong>
      </div>
    </div>
  </article>
</template>

<style scoped>
.mapping-card {
  background: rgba(12, 15, 28, 0.85);
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 1.4rem;
  color: #f4f6ff;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.eyebrow {
  letter-spacing: 0.2em;
  text-transform: uppercase;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.6);
}

small {
  color: rgba(255, 255, 255, 0.5);
}

.status {
  padding: 0.25rem 0.8rem;
  border-radius: 999px;
  font-size: 0.8rem;
  text-transform: uppercase;
}

.status.online {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
}

.status.offline {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.status.maintenance {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}

.person {
  color: rgba(255, 255, 255, 0.7);
  margin: 0.6rem 0;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.metrics p {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 0.2rem;
}

.metrics strong {
  font-size: 1rem;
}
</style>
